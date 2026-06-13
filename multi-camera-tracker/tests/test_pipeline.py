"""
tests/test_pipeline.py — Integration-level tests for pipeline components.
"""

import threading
import time

import pytest

from src.pipeline.event_bus import EventBus, TOPIC_TRANSITION
from src.pipeline.global_id_manager import GlobalIDManager
from src.camera.topology import CameraTopology


class TestEventBus:
    def test_subscribe_and_publish(self):
        bus = EventBus()
        received = []
        bus.subscribe("test", received.append)
        bus.publish("test", {"value": 42})
        assert received == [{"value": 42}]

    def test_multiple_subscribers(self):
        bus = EventBus()
        a, b = [], []
        bus.subscribe("x", a.append)
        bus.subscribe("x", b.append)
        bus.publish("x", 1)
        assert a == [1]
        assert b == [1]

    def test_unsubscribe(self):
        bus = EventBus()
        received = []
        bus.subscribe("t", received.append)
        bus.unsubscribe("t", received.append)
        bus.publish("t", "hello")
        assert received == []

    def test_bad_subscriber_does_not_crash_bus(self):
        bus = EventBus()

        def bad_cb(ev):
            raise RuntimeError("oops")

        good = []
        bus.subscribe("t", bad_cb)
        bus.subscribe("t", good.append)
        bus.publish("t", "msg")
        assert good == ["msg"]

    def test_thread_safe_publish(self):
        bus = EventBus()
        counts = []
        bus.subscribe("t", counts.append)

        threads = [
            threading.Thread(target=lambda: bus.publish("t", i))
            for i in range(50)
        ]
        for t in threads:
            t.start()
        for t in threads:
            t.join()
        assert len(counts) == 50

    def test_no_cross_topic_delivery(self):
        bus = EventBus()
        received = []
        bus.subscribe("alpha", received.append)
        bus.publish("beta", "should not arrive")
        assert received == []


class TestGlobalIDManager:
    def test_creates_new_id(self):
        mgr = GlobalIDManager()
        gid = mgr.get_or_create("cam_01", 1)
        assert isinstance(gid, int)
        assert gid >= 1

    def test_same_local_same_global(self):
        mgr = GlobalIDManager()
        g1 = mgr.get_or_create("cam_01", 1)
        g2 = mgr.get_or_create("cam_01", 1)
        assert g1 == g2

    def test_different_local_different_global(self):
        mgr = GlobalIDManager()
        g1 = mgr.get_or_create("cam_01", 1)
        g2 = mgr.get_or_create("cam_01", 2)
        assert g1 != g2

    def test_assign_overrides_global(self):
        mgr = GlobalIDManager()
        _ = mgr.get_or_create("cam_02", 5)
        existing_gid = mgr.get_or_create("cam_01", 1)
        # Force cam_02 track 5 to match cam_01's global id
        mgr.assign("cam_02", 5, existing_gid)
        assert mgr.get("cam_02", 5) == existing_gid

    def test_local_to_global_map(self):
        mgr = GlobalIDManager()
        g1 = mgr.get_or_create("cam_01", 10)
        g2 = mgr.get_or_create("cam_01", 20)
        mgr.get_or_create("cam_02", 10)  # different camera
        m = mgr.local_to_global_map("cam_01")
        assert m == {10: g1, 20: g2}

    def test_remove(self):
        mgr = GlobalIDManager()
        mgr.get_or_create("cam_01", 1)
        mgr.remove("cam_01", 1)
        assert mgr.get("cam_01", 1) is None

    def test_thread_safe_creation(self):
        mgr = GlobalIDManager()
        results = []

        def create():
            results.append(mgr.get_or_create("cam", threading.get_ident() % 100))

        threads = [threading.Thread(target=create) for _ in range(40)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()
        assert len(results) == 40


class TestCameraTopology:
    def _topology(self):
        cameras = [
            {"id": "cam_01", "adjacent": ["cam_02", "cam_03"]},
            {"id": "cam_02", "adjacent": ["cam_01"]},
            {"id": "cam_03", "adjacent": []},
        ]
        return CameraTopology.from_config(cameras)

    def test_neighbours(self):
        topo = self._topology()
        assert set(topo.neighbours("cam_01")) == {"cam_02", "cam_03"}

    def test_are_adjacent(self):
        topo = self._topology()
        assert topo.are_adjacent("cam_01", "cam_02")
        assert topo.are_adjacent("cam_01", "cam_03")
        assert not topo.are_adjacent("cam_03", "cam_01")

    def test_all_cameras(self):
        topo = self._topology()
        ids = set(topo.all_camera_ids())
        assert {"cam_01", "cam_02", "cam_03"}.issubset(ids)

    def test_unknown_camera_returns_empty(self):
        topo = self._topology()
        assert topo.neighbours("nonexistent") == []
