"""
tests/test_tracking.py — Unit tests for the ByteTracker and Kalman filter.
"""

import numpy as np
import pytest

from src.tracking.kalman import KalmanBoxTracker
from src.tracking.tracker import ByteTracker, TrackState
from src.detection.detector import Detection


def _make_det(x1, y1, x2, y2, conf=0.9, cls=0):
    return Detection(
        bbox=np.array([x1, y1, x2, y2], dtype=float),
        confidence=conf,
        class_id=cls,
        class_name="person",
    )


class TestKalmanBoxTracker:
    def test_predict_returns_array(self):
        kf = KalmanBoxTracker(np.array([100, 100, 200, 300], dtype=float))
        pred = kf.predict()
        assert pred.shape == (4,)

    def test_update_reduces_uncertainty(self):
        kf = KalmanBoxTracker(np.array([100, 100, 200, 300], dtype=float))
        p_before = kf._kf["P"].copy()
        kf.update(np.array([102, 101, 202, 301], dtype=float))
        p_after = kf._kf["P"]
        # Trace of P should decrease after an update
        assert np.trace(p_after) < np.trace(p_before)

    def test_state_close_to_bbox_after_update(self):
        bbox = np.array([100.0, 100.0, 200.0, 300.0])
        kf = KalmanBoxTracker(bbox)
        kf.update(bbox)
        state = kf.get_state()
        np.testing.assert_allclose(state, bbox, atol=2.0)

    def test_unique_ids(self):
        start = KalmanBoxTracker.count
        k1 = KalmanBoxTracker(np.array([0, 0, 10, 10], dtype=float))
        k2 = KalmanBoxTracker(np.array([0, 0, 10, 10], dtype=float))
        assert k1.id != k2.id


class TestByteTracker:
    def _fresh_tracker(self, min_hits=1):
        return ByteTracker(
            high_thresh=0.6, low_thresh=0.1,
            max_lost_frames=5, min_hits=min_hits, iou_threshold=0.3
        )

    def test_no_detections(self):
        tracker = self._fresh_tracker()
        tracks = tracker.update([])
        assert tracks == []

    def test_single_detection_creates_track(self):
        tracker = self._fresh_tracker(min_hits=1)
        dets = [_make_det(100, 100, 200, 300, conf=0.9)]
        tracks = tracker.update(dets)
        assert len(tracks) == 1
        assert tracks[0].state == TrackState.Confirmed

    def test_low_conf_detection_tentative_initially(self):
        tracker = ByteTracker(high_thresh=0.6, low_thresh=0.1, min_hits=3)
        dets = [_make_det(100, 100, 200, 300, conf=0.8)]
        tracks = tracker.update(dets)
        # min_hits=3, so after 1 frame it's Tentative
        assert any(t.state == TrackState.Tentative for t in tracks)

    def test_track_confirmed_after_min_hits(self):
        tracker = ByteTracker(high_thresh=0.5, low_thresh=0.1, min_hits=3)
        for _ in range(3):
            dets = [_make_det(100, 100, 200, 300, conf=0.8)]
            tracks = tracker.update(dets)
        confirmed = [t for t in tracks if t.state == TrackState.Confirmed]
        assert len(confirmed) == 1

    def test_track_deleted_after_max_lost(self):
        tracker = ByteTracker(high_thresh=0.5, low_thresh=0.1,
                              max_lost_frames=2, min_hits=1)
        tracker.update([_make_det(100, 100, 200, 300, conf=0.9)])
        # Now stop providing detections
        for _ in range(4):
            tracks = tracker.update([])
        assert all(t.state != TrackState.Confirmed for t in tracks) or len(tracks) == 0

    def test_two_independent_detections(self):
        tracker = self._fresh_tracker(min_hits=1)
        dets = [
            _make_det(0, 0, 50, 100, conf=0.9),
            _make_det(500, 0, 550, 100, conf=0.9),
        ]
        tracks = tracker.update(dets)
        assert len(tracks) == 2
        ids = {t.track_id for t in tracks}
        assert len(ids) == 2

    def test_reset_clears_state(self):
        tracker = self._fresh_tracker(min_hits=1)
        tracker.update([_make_det(100, 100, 200, 300, conf=0.9)])
        tracker.reset()
        assert tracker.update([]) == []
