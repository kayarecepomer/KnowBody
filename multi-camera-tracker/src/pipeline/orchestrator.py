"""
orchestrator.py — End-to-end multi-camera tracking pipeline.

One :class:`CameraWorker` thread runs per camera stream.  Each worker:
  1. Reads the latest frame from its :class:`~src.camera.stream.CameraStream`.
  2. Runs detection (YOLOv8).
  3. Runs ReID embedding extraction on detected crops.
  4. Updates the per-camera ByteTracker.
  5. Assigns / looks up global IDs.
  6. Checks exit zones and fires exit events.
  7. For newly appearing tracks, attempts cross-camera ReID.
  8. Publishes track-update and annotated-frame events to the EventBus.

The :class:`Orchestrator` owns all workers, the shared
:class:`~src.pipeline.global_id_manager.GlobalIDManager`, and the
:class:`~src.reid.gallery.AppearanceGallery`.
"""

from __future__ import annotations

import logging
import threading
import time
from typing import Dict, List, Optional

import cv2
import numpy as np

from src.camera.exit_zone import ExitZoneMonitor
from src.camera.stream import CameraStream
from src.camera.topology import CameraTopology
from src.detection.detector import Detector, Detection
from src.pipeline.event_bus import EventBus, TOPIC_TRANSITION, TOPIC_TRACK_UPDATE, TOPIC_FRAME
from src.pipeline.global_id_manager import GlobalIDManager
from src.reid.extractor import EmbeddingExtractor
from src.reid.gallery import AppearanceGallery
from src.tracking.tracker import ByteTracker, Track, TrackState

logger = logging.getLogger(__name__)

# Colour palette for drawing (BGR)
_PALETTE = [
    (255, 56, 56), (255, 157, 151), (255, 112, 31), (255, 178, 29),
    (207, 210, 49), (72, 249, 10), (146, 204, 23), (61, 219, 134),
    (26, 147, 52), (0, 212, 187), (44, 153, 168), (0, 194, 255),
    (52, 69, 147), (100, 115, 255), (0, 24, 236), (132, 56, 255),
    (82, 0, 133), (203, 56, 255), (255, 149, 200), (255, 55, 199),
]


def _track_colour(global_id: int) -> tuple:
    return _PALETTE[global_id % len(_PALETTE)]


class TransitionEvent:
    """Emitted when a global ID transitions between cameras."""

    def __init__(
        self,
        global_id: int,
        from_camera: str,
        to_camera: str,
        from_local_id: int,
        to_local_id: int,
        similarity: float,
    ) -> None:
        self.global_id = global_id
        self.from_camera = from_camera
        self.to_camera = to_camera
        self.from_local_id = from_local_id
        self.to_local_id = to_local_id
        self.similarity = similarity
        self.timestamp = time.time()

    def __repr__(self) -> str:
        return (
            f"TransitionEvent(global_id={self.global_id}, "
            f"{self.from_camera}→{self.to_camera}, "
            f"sim={self.similarity:.3f})"
        )


class CameraWorker:
    """
    Processes a single camera stream in a dedicated thread.

    Parameters
    ----------
    cam_cfg:
        Config dict for this camera (from cameras.yaml).
    detector:
        Shared :class:`Detector` instance (thread-safe with PyTorch inference lock).
    extractor:
        Shared :class:`EmbeddingExtractor` instance.
    tracker:
        Per-camera :class:`ByteTracker`.
    exit_monitor:
        Per-camera :class:`ExitZoneMonitor`.
    global_id_mgr:
        Shared :class:`GlobalIDManager`.
    gallery:
        Shared :class:`AppearanceGallery`.
    topology:
        :class:`CameraTopology` for neighbour lookups.
    bus:
        Shared :class:`EventBus`.
    handoff_cfg:
        Handoff config dict.
    """

    def __init__(
        self,
        cam_cfg: dict,
        detector: Detector,
        extractor: EmbeddingExtractor,
        tracker: ByteTracker,
        exit_monitor: ExitZoneMonitor,
        global_id_mgr: GlobalIDManager,
        gallery: AppearanceGallery,
        topology: CameraTopology,
        bus: EventBus,
        handoff_cfg: dict,
        inference_lock: threading.Lock,
    ) -> None:
        self.camera_id = cam_cfg["id"]
        self._stream = CameraStream.from_config(cam_cfg)
        self._detector = detector
        self._extractor = extractor
        self._tracker = tracker
        self._exit_monitor = exit_monitor
        self._global_id_mgr = global_id_mgr
        self._gallery = gallery
        self._topology = topology
        self._bus = bus
        self._handoff_cfg = handoff_cfg
        self._inference_lock = inference_lock

        # Set of local track IDs that have already been ReID'd (avoid re-querying)
        self._known_local_ids: set = set()

        self._stopped = threading.Event()
        self._thread: Optional[threading.Thread] = None

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    def start(self) -> None:
        self._stream.start()
        self._thread = threading.Thread(
            target=self._run_loop, name=f"worker-{self.camera_id}", daemon=True
        )
        self._thread.start()

    def stop(self) -> None:
        self._stopped.set()
        self._stream.stop()
        if self._thread:
            self._thread.join(timeout=10.0)

    # ------------------------------------------------------------------
    # Main loop
    # ------------------------------------------------------------------

    def _run_loop(self) -> None:
        logger.info("Worker started: %s", self.camera_id)
        while not self._stopped.is_set():
            ok, frame = self._stream.read()
            if not ok:
                time.sleep(0.01)
                continue

            detections = self._detect(frame)
            self._attach_embeddings(frame, detections)

            tracks = self._tracker.update(detections)

            # Assign global IDs to brand-new confirmed tracks
            for track in tracks:
                if track.state == TrackState.Confirmed:
                    if track.track_id not in self._known_local_ids:
                        self._handle_new_track(frame, track)

            # Remove stale local IDs
            active_ids = {t.track_id for t in tracks}
            self._known_local_ids &= active_ids

            # Build local→global map for exit-zone evaluation
            id_map = self._global_id_mgr.local_to_global_map(self.camera_id)

            # Update gallery for all confirmed tracks
            for track in tracks:
                if track.state == TrackState.Confirmed and track.embedding is not None:
                    gid = id_map.get(track.track_id)
                    if gid is not None:
                        self._gallery.add(gid, track.embedding, self.camera_id, track.track_id)

            # Check exit zones
            exit_events = self._exit_monitor.update(tracks, id_map)
            for ev in exit_events:
                self._gallery.mark_exited(ev.global_id)
                logger.info("Exit event: %s", ev)

            # Annotate and publish frame
            annotated = self._draw(frame, tracks, id_map)
            self._bus.publish(TOPIC_TRACK_UPDATE, {
                "camera_id": self.camera_id,
                "tracks": [self._track_to_dict(t, id_map) for t in tracks],
                "timestamp": time.time(),
            })
            self._bus.publish(TOPIC_FRAME, {
                "camera_id": self.camera_id,
                "frame": annotated,
                "timestamp": time.time(),
            })

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _detect(self, frame: np.ndarray) -> List[Detection]:
        with self._inference_lock:
            return self._detector.detect(frame)

    def _attach_embeddings(self, frame: np.ndarray, detections: List[Detection]) -> None:
        if not detections:
            return
        bboxes = np.array([d.bbox for d in detections])
        with self._inference_lock:
            embeddings = self._extractor.extract(frame, bboxes)
        for det, emb in zip(detections, embeddings):
            det.embedding = emb

    def _handle_new_track(self, frame: np.ndarray, track: Track) -> None:
        """Attempt cross-camera ReID; assign or mint a global ID."""
        neighbours = self._topology.neighbours(self.camera_id)

        matched_gid: Optional[int] = None
        best_sim: float = 0.0

        if track.embedding is not None and neighbours:
            # Collect global IDs that recently exited a neighbour camera
            candidate_gids = self._gallery.all_global_ids()
            matched_gid, best_sim = self._gallery.match(
                track.embedding,
                query_camera_id=self.camera_id,
                adjacent_ids=candidate_gids,
            )

        if matched_gid is not None:
            # ReID success — reuse global ID
            old_gid = self._global_id_mgr.get(self.camera_id, track.track_id)
            self._global_id_mgr.assign(self.camera_id, track.track_id, matched_gid)
            self._known_local_ids.add(track.track_id)

            # Determine which camera this identity last came from
            from_camera = self._last_camera_for(matched_gid)

            event = TransitionEvent(
                global_id=matched_gid,
                from_camera=from_camera or "unknown",
                to_camera=self.camera_id,
                from_local_id=-1,
                to_local_id=track.track_id,
                similarity=best_sim,
            )
            self._bus.publish(TOPIC_TRANSITION, event)
            logger.info("TRANSITION: %s", event)
        else:
            # New identity
            gid = self._global_id_mgr.get_or_create(self.camera_id, track.track_id)
            self._known_local_ids.add(track.track_id)
            logger.debug("New identity: global_id=%d  cam=%s  local=%d", gid, self.camera_id, track.track_id)

    def _last_camera_for(self, global_id: int) -> Optional[str]:
        """Return the most recent camera where *global_id* appeared."""
        entries = self._gallery.get_entries(global_id)
        if not entries:
            return None
        return max(entries, key=lambda e: e.timestamp).camera_id

    def _draw(
        self, frame: np.ndarray, tracks: List[Track], id_map: Dict[int, int]
    ) -> np.ndarray:
        out = frame.copy()
        for track in tracks:
            if track.state != TrackState.Confirmed:
                continue
            gid = id_map.get(track.track_id)
            colour = _track_colour(gid) if gid is not None else (200, 200, 200)
            x1, y1, x2, y2 = map(int, track.bbox)
            cv2.rectangle(out, (x1, y1), (x2, y2), colour, 2)
            label = f"G{gid}" if gid is not None else f"L{track.track_id}"
            cv2.putText(
                out, label, (x1, max(0, y1 - 6)),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, colour, 2
            )
        return out

    @staticmethod
    def _track_to_dict(track: Track, id_map: Dict[int, int]) -> dict:
        x1, y1, x2, y2 = track.bbox.tolist()
        return {
            "local_id": track.track_id,
            "global_id": id_map.get(track.track_id),
            "bbox": [x1, y1, x2, y2],
            "confidence": track.confidence,
            "class_name": track.class_name,
            "state": track.state.name,
        }


class Orchestrator:
    """
    Top-level coordinator owning all camera workers and shared state.

    Parameters
    ----------
    config:
        Merged config dict with keys ``cameras``, ``handoff``,
        ``detection``, ``tracking``, ``reid``.
    """

    def __init__(self, config: dict) -> None:
        cameras_cfg: List[dict] = config["cameras"]
        handoff_cfg: dict = config.get("handoff", {})
        det_cfg: dict = config.get("detection", {})
        trk_cfg: dict = config.get("tracking", {})
        reid_cfg: dict = config.get("reid", {})

        self._bus = EventBus()
        self._global_id_mgr = GlobalIDManager()
        self._gallery = AppearanceGallery.from_config(handoff_cfg, reid_cfg)
        self._topology = CameraTopology.from_config(cameras_cfg)

        # Shared detector and extractor (protected by a lock)
        self._inference_lock = threading.Lock()
        self._detector = Detector.from_config(det_cfg)
        self._extractor = EmbeddingExtractor.from_config(reid_cfg)

        self._workers: List[CameraWorker] = []
        for cam_cfg in cameras_cfg:
            tracker = ByteTracker.from_config(trk_cfg)
            exit_monitor = ExitZoneMonitor.from_config(cam_cfg, handoff_cfg)
            worker = CameraWorker(
                cam_cfg=cam_cfg,
                detector=self._detector,
                extractor=self._extractor,
                tracker=tracker,
                exit_monitor=exit_monitor,
                global_id_mgr=self._global_id_mgr,
                gallery=self._gallery,
                topology=self._topology,
                bus=self._bus,
                handoff_cfg=handoff_cfg,
                inference_lock=self._inference_lock,
            )
            self._workers.append(worker)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    @property
    def bus(self) -> EventBus:
        return self._bus

    def start(self) -> None:
        for w in self._workers:
            w.start()
        logger.info("Orchestrator started (%d cameras).", len(self._workers))

    def stop(self) -> None:
        for w in self._workers:
            w.stop()
        logger.info("Orchestrator stopped.")

    @classmethod
    def from_config_files(
        cls,
        cameras_yaml: str = "configs/cameras.yaml",
        model_yaml: str = "configs/model.yaml",
    ) -> "Orchestrator":
        """Load both YAML files and build an Orchestrator."""
        import yaml

        with open(cameras_yaml) as f:
            cam_data = yaml.safe_load(f)
        with open(model_yaml) as f:
            model_data = yaml.safe_load(f)

        config = {
            "cameras": cam_data["cameras"],
            "handoff": cam_data.get("handoff", {}),
            **model_data,
        }
        return cls(config)
