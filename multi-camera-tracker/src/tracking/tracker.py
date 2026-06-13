"""
tracker.py — ByteTrack-style single-camera multi-object tracker.

ByteTrack uses two detection score thresholds:
  * High-confidence detections  → matched directly to existing tracks.
  * Low-confidence detections   → used as a second-pass to recover lost
    tracks that weren't matched in the first pass.

References
----------
Zhang et al., "ByteTrack: Multi-Object Tracking by Associating Every
Detection Box", ECCV 2022. https://arxiv.org/abs/2110.06864
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from enum import Enum, auto
from typing import Dict, List, Optional, Tuple

import numpy as np
from scipy.optimize import linear_sum_assignment

from .kalman import KalmanBoxTracker

logger = logging.getLogger(__name__)


class TrackState(Enum):
    Tentative = auto()   # not yet confirmed (hit_streak < min_hits)
    Confirmed = auto()   # active & confirmed
    Lost = auto()        # not updated recently, but still alive
    Deleted = auto()     # to be removed


@dataclass
class Track:
    """A single object track maintained by :class:`ByteTracker`."""

    track_id: int
    bbox: np.ndarray                  # [x1, y1, x2, y2]
    state: TrackState
    class_id: int = 0
    class_name: str = "person"
    confidence: float = 0.0
    age: int = 0
    hit_streak: int = 0
    time_since_update: int = 0
    # Appearance embedding (filled by ReID extractor, may be None)
    embedding: Optional[np.ndarray] = field(default=None, repr=False)

    @property
    def is_confirmed(self) -> bool:
        return self.state == TrackState.Confirmed

    @property
    def center(self) -> np.ndarray:
        x1, y1, x2, y2 = self.bbox
        return np.array([(x1 + x2) / 2, (y1 + y2) / 2])


def _iou_matrix(bboxes_a: np.ndarray, bboxes_b: np.ndarray) -> np.ndarray:
    """Compute pairwise IoU between two sets of boxes (N×4 and M×4)."""
    n, m = len(bboxes_a), len(bboxes_b)
    if n == 0 or m == 0:
        return np.zeros((n, m))

    ax1, ay1, ax2, ay2 = bboxes_a[:, 0], bboxes_a[:, 1], bboxes_a[:, 2], bboxes_a[:, 3]
    bx1, by1, bx2, by2 = bboxes_b[:, 0], bboxes_b[:, 1], bboxes_b[:, 2], bboxes_b[:, 3]

    inter_x1 = np.maximum(ax1[:, None], bx1[None, :])
    inter_y1 = np.maximum(ay1[:, None], by1[None, :])
    inter_x2 = np.minimum(ax2[:, None], bx2[None, :])
    inter_y2 = np.minimum(ay2[:, None], by2[None, :])

    inter_area = np.maximum(0.0, inter_x2 - inter_x1) * np.maximum(0.0, inter_y2 - inter_y1)
    area_a = (ax2 - ax1) * (ay2 - ay1)
    area_b = (bx2 - bx1) * (by2 - by1)
    union_area = area_a[:, None] + area_b[None, :] - inter_area

    return np.where(union_area > 0, inter_area / union_area, 0.0)


def _hungarian(cost_matrix: np.ndarray, threshold: float) -> Tuple[List, List, List]:
    """
    Run Hungarian assignment on a cost matrix and split into matches / unmatched.

    Returns
    -------
    matches : list of (row_idx, col_idx)
    unmatched_rows : list of int
    unmatched_cols : list of int
    """
    if cost_matrix.size == 0:
        return [], list(range(cost_matrix.shape[0])), list(range(cost_matrix.shape[1]))

    row_ind, col_ind = linear_sum_assignment(-cost_matrix)  # maximise IoU
    matches = []
    unmatched_rows = list(range(cost_matrix.shape[0]))
    unmatched_cols = list(range(cost_matrix.shape[1]))

    for r, c in zip(row_ind, col_ind):
        if cost_matrix[r, c] >= threshold:
            matches.append((r, c))
            unmatched_rows.remove(r)
            unmatched_cols.remove(c)

    return matches, unmatched_rows, unmatched_cols


class ByteTracker:
    """
    Per-camera ByteTrack tracker.

    Parameters
    ----------
    high_thresh:
        Confidence threshold separating "high" from "low" detections.
    low_thresh:
        Minimum confidence to consider a detection at all.
    max_lost_frames:
        Frames to keep a track alive without any match before deletion.
    min_hits:
        Consecutive hits required to promote a track from Tentative to Confirmed.
    iou_threshold:
        IoU threshold for data association.
    """

    def __init__(
        self,
        high_thresh: float = 0.60,
        low_thresh: float = 0.10,
        max_lost_frames: int = 30,
        min_hits: int = 3,
        iou_threshold: float = 0.30,
    ) -> None:
        self.high_thresh = high_thresh
        self.low_thresh = low_thresh
        self.max_lost_frames = max_lost_frames
        self.min_hits = min_hits
        self.iou_threshold = iou_threshold

        self._kalman_trackers: Dict[int, KalmanBoxTracker] = {}
        self._tracks: Dict[int, Track] = {}
        self._frame_count: int = 0

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def update(self, detections) -> List[Track]:
        """
        Update tracker with detections from the current frame.

        Parameters
        ----------
        detections:
            List of :class:`~src.detection.detector.Detection` objects.

        Returns
        -------
        List of active (non-deleted) :class:`Track` objects.
        """
        self._frame_count += 1

        # --- Step 0: predict all existing tracks -----------------------
        predicted_bboxes: Dict[int, np.ndarray] = {}
        for tid, kf in list(self._kalman_trackers.items()):
            predicted_bboxes[tid] = kf.predict()

        # --- Step 1: split detections by confidence --------------------
        high_dets = [d for d in detections if d.confidence >= self.high_thresh]
        low_dets = [
            d for d in detections if self.low_thresh <= d.confidence < self.high_thresh
        ]

        active_track_ids = [tid for tid, t in self._tracks.items()
                            if t.state != TrackState.Deleted]

        # --- Step 2: first association (high dets vs active tracks) ----
        unmatched_tracks_1, unmatched_high_dets = self._associate(
            active_track_ids, high_dets, predicted_bboxes
        )

        # --- Step 3: second association (low dets vs remaining tracks) -
        lost_track_ids = [tid for tid in unmatched_tracks_1
                          if self._tracks[tid].state == TrackState.Lost]
        _, _ = self._associate(
            lost_track_ids, low_dets, predicted_bboxes, second_pass=True
        )

        # --- Step 4: mark still-unmatched tracks as lost / delete ------
        remaining_unmatched = [tid for tid in unmatched_tracks_1
                               if tid not in lost_track_ids]
        remaining_unmatched += lost_track_ids  # re-add truly unmatched lost tracks

        for tid in remaining_unmatched:
            track = self._tracks[tid]
            if track.state != TrackState.Deleted:
                track.state = TrackState.Lost
                track.time_since_update = self._kalman_trackers[tid].time_since_update
                if track.time_since_update > self.max_lost_frames:
                    track.state = TrackState.Deleted

        # --- Step 5: initialise new tracks for unmatched high dets -----
        for det in unmatched_high_dets:
            kf = KalmanBoxTracker(det.bbox)
            # Count the triggering detection as the first hit
            kf.hits = 1
            kf.hit_streak = 1
            self._kalman_trackers[kf.id] = kf
            self._tracks[kf.id] = Track(
                track_id=kf.id,
                bbox=det.bbox.copy(),
                state=TrackState.Tentative,
                class_id=det.class_id,
                class_name=det.class_name,
                confidence=det.confidence,
            )

        # --- Step 6: refresh track metadata from Kalman state ----------
        for tid, track in self._tracks.items():
            if track.state == TrackState.Deleted:
                continue
            kf = self._kalman_trackers[tid]
            track.bbox = kf.get_state()
            track.age = kf.age
            track.hit_streak = kf.hit_streak
            track.time_since_update = kf.time_since_update
            if (
                track.state == TrackState.Tentative
                and kf.hit_streak >= self.min_hits
            ):
                track.state = TrackState.Confirmed

        # Clean up deleted tracks
        to_delete = [tid for tid, t in self._tracks.items() if t.state == TrackState.Deleted]
        for tid in to_delete:
            del self._tracks[tid]
            del self._kalman_trackers[tid]

        return [t for t in self._tracks.values() if t.state != TrackState.Deleted]

    def reset(self) -> None:
        """Reset tracker state (e.g. when starting a new video)."""
        self._kalman_trackers.clear()
        self._tracks.clear()
        self._frame_count = 0

    # ------------------------------------------------------------------
    # Internals
    # ------------------------------------------------------------------

    def _associate(
        self,
        track_ids: List[int],
        detections,
        predicted_bboxes: Dict[int, np.ndarray],
        second_pass: bool = False,
    ) -> Tuple[List[int], list]:
        """
        Match *track_ids* to *detections* using IoU + Hungarian.

        Returns (unmatched_track_ids, unmatched_detections).
        """
        if not track_ids or not detections:
            return list(track_ids), list(detections)

        track_boxes = np.array([predicted_bboxes[tid] for tid in track_ids])
        det_boxes = np.array([d.bbox for d in detections])

        iou = _iou_matrix(track_boxes, det_boxes)
        thresh = self.iou_threshold if not second_pass else self.iou_threshold * 0.8
        matches, unmatched_track_idxs, unmatched_det_idxs = _hungarian(iou, thresh)

        for track_idx, det_idx in matches:
            tid = track_ids[track_idx]
            det = detections[det_idx]
            self._kalman_trackers[tid].update(det.bbox)
            self._tracks[tid].confidence = det.confidence
            self._tracks[tid].embedding = det.embedding

        unmatched_track_ids = [track_ids[i] for i in unmatched_track_idxs]
        unmatched_dets = [detections[i] for i in unmatched_det_idxs]
        return unmatched_track_ids, unmatched_dets

    @classmethod
    def from_config(cls, cfg: dict) -> "ByteTracker":
        """Construct from a ``tracking`` config dict."""
        return cls(
            high_thresh=cfg.get("high_confidence_threshold", 0.60),
            low_thresh=cfg.get("low_confidence_threshold", 0.10),
            max_lost_frames=cfg.get("max_lost_frames", 30),
            min_hits=cfg.get("min_hits", 3),
            iou_threshold=cfg.get("iou_threshold", 0.30),
        )
