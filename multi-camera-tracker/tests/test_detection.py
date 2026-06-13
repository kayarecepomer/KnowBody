"""
tests/test_detection.py — Unit tests for the Detector module.

Uses the ``"mock"`` backend (no actual YOLO weights needed).
"""

import numpy as np
import pytest

from src.detection.detector import Detection


class TestDetection:
    def _make_detection(self, x1=10, y1=20, x2=60, y2=120, conf=0.9, cls=0):
        return Detection(
            bbox=np.array([x1, y1, x2, y2], dtype=float),
            confidence=conf,
            class_id=cls,
            class_name="person",
        )

    def test_xywh(self):
        d = self._make_detection(10, 20, 60, 120)
        xywh = d.xywh
        assert xywh[0] == pytest.approx(10)
        assert xywh[1] == pytest.approx(20)
        assert xywh[2] == pytest.approx(50)   # width
        assert xywh[3] == pytest.approx(100)  # height

    def test_center(self):
        d = self._make_detection(0, 0, 100, 200)
        cx, cy = d.center
        assert cx == pytest.approx(50)
        assert cy == pytest.approx(100)

    def test_area(self):
        d = self._make_detection(0, 0, 50, 100)
        assert d.area == pytest.approx(5000)

    def test_zero_area_degenerate(self):
        d = self._make_detection(50, 50, 50, 50)
        assert d.area == 0.0

    def test_embedding_defaults_none(self):
        d = self._make_detection()
        assert d.embedding is None
