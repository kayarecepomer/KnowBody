#!/usr/bin/env python3
"""
scripts/demo.py — Offline demo using local video files.

Runs the full detection + tracking + ReID pipeline on a set of video
files (one per "camera") and prints transition events to the console.
No RTSP streams or GPU required; the mock ReID backend is used by default.

Usage
-----
::

    python scripts/demo.py --videos path/cam1.mp4 path/cam2.mp4
    python scripts/demo.py --webcam          # use webcam 0 and 1 (if available)
"""

from __future__ import annotations

import argparse
import logging
import sys
import time
from pathlib import Path

# Make sure the project root is on the path when running from scripts/
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import cv2
import yaml

from src.detection.detector import Detection
from src.tracking.tracker import ByteTracker, TrackState
from src.reid.extractor import EmbeddingExtractor
from src.reid.gallery import AppearanceGallery
from src.camera.exit_zone import ExitZoneMonitor, ExitZone
from src.camera.topology import CameraTopology
from src.pipeline.global_id_manager import GlobalIDManager
from src.pipeline.event_bus import EventBus, TOPIC_TRANSITION

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("demo")


DEMO_CAMERAS_CONFIG = """
cameras:
  - id: cam_01
    name: "Camera 1"
    source: "__SOURCE_0__"
    width: 640
    height: 480
    fps: 30
    exit_zones:
      - name: right_exit
        points: [[560, 0], [640, 0], [640, 480], [560, 480]]
    adjacent: [cam_02]
  - id: cam_02
    name: "Camera 2"
    source: "__SOURCE_1__"
    width: 640
    height: 480
    fps: 30
    exit_zones:
      - name: left_exit
        points: [[0, 0], [80, 0], [80, 480], [0, 480]]
    adjacent: [cam_01]

handoff:
  max_travel_time_seconds: 30
  reid_similarity_threshold: 0.60
  exit_confirm_frames: 2
"""


def _build_demo_config(sources: list) -> dict:
    src0 = str(sources[0]) if len(sources) > 0 else "0"
    src1 = str(sources[1]) if len(sources) > 1 else "1"
    cfg_str = DEMO_CAMERAS_CONFIG.replace("__SOURCE_0__", src0).replace("__SOURCE_1__", src1)
    return yaml.safe_load(cfg_str)


def run_demo(sources: list, max_frames: int = 500, show: bool = True) -> None:
    cfg = _build_demo_config(sources)
    cameras_cfg = cfg["cameras"]
    handoff_cfg = cfg["handoff"]

    extractor = EmbeddingExtractor(backend="mock", embedding_dim=128)
    gallery = AppearanceGallery(
        similarity_threshold=handoff_cfg["reid_similarity_threshold"],
        max_travel_time=handoff_cfg["max_travel_time_seconds"],
    )
    topology = CameraTopology.from_config(cameras_cfg)
    id_mgr = GlobalIDManager()
    bus = EventBus()
    bus.subscribe(TOPIC_TRANSITION, lambda ev: print(f"\n🔀 TRANSITION: {ev}\n"))

    # Per-camera state
    caps = {}
    trackers = {}
    monitors = {}
    for cam in cameras_cfg:
        caps[cam["id"]] = cv2.VideoCapture(cam["source"])
        trackers[cam["id"]] = ByteTracker(
            high_thresh=0.5, low_thresh=0.1, max_lost_frames=20, min_hits=2
        )
        zones = [
            ExitZone(name=z["name"], polygon=__import__("numpy").array(z["points"], dtype=float))
            for z in cam.get("exit_zones", [])
        ]
        monitors[cam["id"]] = ExitZoneMonitor(
            zones=zones,
            confirm_frames=handoff_cfg["exit_confirm_frames"],
            camera_id=cam["id"],
        )

    known_ids: dict[str, set] = {c["id"]: set() for c in cameras_cfg}
    frame_count = 0

    logger.info("Demo running. Press 'q' to quit.")
    while frame_count < max_frames:
        frame_count += 1
        any_frame = False

        for cam in cameras_cfg:
            cid = cam["id"]
            cap = caps[cid]
            ret, frame = cap.read()
            if not ret:
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)  # loop video
                ret, frame = cap.read()
                if not ret:
                    continue
            any_frame = True

            # --- Mock detections (random boxes in top half) -------------
            import numpy as np

            rng = np.random.default_rng(seed=frame_count + hash(cid) % 1000)
            num_det = rng.integers(1, 3)
            dets = []
            h, w = frame.shape[:2]
            for _ in range(num_det):
                x1 = int(rng.integers(0, w - 80))
                y1 = int(rng.integers(0, h - 120))
                x2 = x1 + int(rng.integers(40, 80))
                y2 = y1 + int(rng.integers(80, 120))
                conf = float(rng.uniform(0.6, 0.95))
                dets.append(
                    Detection(
                        bbox=np.array([x1, y1, x2, y2], dtype=float),
                        confidence=conf,
                        class_id=0,
                        class_name="person",
                    )
                )

            # Attach mock embeddings
            bboxes = np.array([d.bbox for d in dets]) if dets else np.empty((0, 4))
            embs = extractor.extract(frame, bboxes)
            for det, emb in zip(dets, embs):
                det.embedding = emb

            # Update tracker
            tracks = trackers[cid].update(dets)

            # Assign global IDs and handle new tracks
            id_map = id_mgr.local_to_global_map(cid)
            for track in tracks:
                if track.state == TrackState.Confirmed:
                    if track.track_id not in known_ids[cid]:
                        if track.embedding is not None:
                            matched, sim = gallery.match(track.embedding, cid)
                            if matched is not None:
                                id_mgr.assign(cid, track.track_id, matched)
                                from src.pipeline.orchestrator import TransitionEvent
                                bus.publish(TOPIC_TRANSITION, TransitionEvent(
                                    global_id=matched, from_camera="prev",
                                    to_camera=cid, from_local_id=-1,
                                    to_local_id=track.track_id, similarity=sim,
                                ))
                            else:
                                id_mgr.get_or_create(cid, track.track_id)
                        else:
                            id_mgr.get_or_create(cid, track.track_id)
                        known_ids[cid].add(track.track_id)

            id_map = id_mgr.local_to_global_map(cid)

            # Update gallery
            for track in tracks:
                if track.state == TrackState.Confirmed and track.embedding is not None:
                    gid = id_map.get(track.track_id)
                    if gid:
                        gallery.add(gid, track.embedding, cid, track.track_id)

            # Check exits
            exit_events = monitors[cid].update(tracks, id_map)
            for ev in exit_events:
                gallery.mark_exited(ev.global_id)
                logger.info("EXIT  global_id=%d  cam=%s  zone=%s", ev.global_id, cid, ev.zone_name)

            # Draw
            if show:
                for track in tracks:
                    if track.state != TrackState.Confirmed:
                        continue
                    x1, y1, x2, y2 = map(int, track.bbox)
                    gid = id_map.get(track.track_id, "?")
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                    cv2.putText(frame, f"G{gid}", (x1, y1 - 4),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
                cv2.imshow(f"{cid} — {cam['name']}", frame)

        if show and cv2.waitKey(1) & 0xFF == ord("q"):
            break

        if not any_frame:
            break

    for cap in caps.values():
        cap.release()
    if show:
        cv2.destroyAllWindows()
    logger.info("Demo finished (%d frames).", frame_count)


def main():
    p = argparse.ArgumentParser(description="Multi-Camera Tracker Demo")
    g = p.add_mutually_exclusive_group()
    g.add_argument("--videos", nargs="+", help="Path(s) to video file(s)")
    g.add_argument("--webcam", action="store_true", help="Use webcam indices 0 and 1")
    p.add_argument("--max-frames", type=int, default=500)
    p.add_argument("--no-display", action="store_true")
    args = p.parse_args()

    if args.webcam:
        sources = [0, 1]
    elif args.videos:
        sources = args.videos
    else:
        sources = [0, 1]  # default to webcams

    run_demo(sources, max_frames=args.max_frames, show=not args.no_display)


if __name__ == "__main__":
    main()
