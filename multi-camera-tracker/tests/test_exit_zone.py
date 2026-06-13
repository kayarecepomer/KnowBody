"""
tests/test_exit_zone.py — Unit tests for exit zone detection.
"""

import numpy as np
import pytest

from src.camera.exit_zone import (
    ExitZone,
    ExitZoneMonitor,
    bbox_overlap_ratio,
)
from src.tracking.tracker import Track, TrackState


def _make_track(tid, x1, y1, x2, y2, state=TrackState.Confirmed):
    t = Track(
        track_id=tid,
        bbox=np.array([x1, y1, x2, y2], dtype=float),
        state=state,
    )
    return t


def _right_edge_zone(frame_w=1920, frame_h=1080, thickness=120):
    """Exit zone covering the right edge of the frame."""
    return ExitZone(
        name="right_door",
        polygon=np.array([
            [frame_w - thickness, 0],
            [frame_w, 0],
            [frame_w, frame_h],
            [frame_w - thickness, frame_h],
        ], dtype=float),
    )


class TestBboxOverlapRatio:
    def test_full_overlap(self):
        bbox = np.array([0.0, 0.0, 100.0, 100.0])
        zone = np.array([[0, 0], [100, 0], [100, 100], [0, 100]], dtype=float)
        ratio = bbox_overlap_ratio(bbox, zone)
        assert ratio == pytest.approx(1.0, abs=1e-3)

    def test_no_overlap(self):
        bbox = np.array([0.0, 0.0, 50.0, 50.0])
        zone = np.array([[200, 200], [300, 200], [300, 300], [200, 300]], dtype=float)
        ratio = bbox_overlap_ratio(bbox, zone)
        assert ratio == pytest.approx(0.0, abs=1e-6)

    def test_half_overlap(self):
        bbox = np.array([0.0, 0.0, 100.0, 100.0])
        zone = np.array([[50, 0], [150, 0], [150, 100], [50, 100]], dtype=float)
        ratio = bbox_overlap_ratio(bbox, zone)
        assert ratio == pytest.approx(0.5, abs=0.02)

    def test_degenerate_zero_area(self):
        bbox = np.array([50.0, 50.0, 50.0, 50.0])
        zone = np.array([[0, 0], [100, 0], [100, 100], [0, 100]], dtype=float)
        assert bbox_overlap_ratio(bbox, zone) == 0.0


class TestExitZoneMonitor:
    def _monitor(self, confirm_frames=3):
        zone = _right_edge_zone()
        return ExitZoneMonitor(
            zones=[zone],
            confirm_frames=confirm_frames,
            overlap_threshold=0.3,
            camera_id="cam_01",
        )

    def test_no_event_below_confirm_frames(self):
        monitor = self._monitor(confirm_frames=3)
        # Track near right edge (overlaps zone)
        track = _make_track(1, 1820, 0, 1920, 200)
        id_map = {1: 10}
        events = monitor.update([track], id_map)
        assert events == []
        events = monitor.update([track], id_map)
        assert events == []

    def test_event_fired_after_confirm_frames(self):
        monitor = self._monitor(confirm_frames=3)
        track = _make_track(1, 1820, 0, 1920, 200)
        id_map = {1: 10}
        for _ in range(3):
            events = monitor.update([track], id_map)
        assert len(events) == 1
        assert events[0].global_id == 10
        assert events[0].zone_name == "right_door"

    def test_no_duplicate_event(self):
        monitor = self._monitor(confirm_frames=2)
        track = _make_track(1, 1820, 0, 1920, 200)
        id_map = {1: 10}
        all_events = []
        for _ in range(6):
            all_events += monitor.update([track], id_map)
        # Only one event per track
        assert len(all_events) == 1

    def test_no_event_when_track_not_in_zone(self):
        monitor = self._monitor(confirm_frames=2)
        track = _make_track(1, 0, 0, 100, 200)  # left side, far from right zone
        id_map = {1: 5}
        for _ in range(5):
            events = monitor.update([track], id_map)
        assert events == []

    def test_no_event_without_global_id(self):
        monitor = self._monitor(confirm_frames=1)
        track = _make_track(1, 1820, 0, 1920, 200)
        id_map = {}  # no mapping
        for _ in range(3):
            events = monitor.update([track], id_map)
        assert events == []
