"""
tests/test_reid.py — Unit tests for EmbeddingExtractor and AppearanceGallery.
"""

import numpy as np
import pytest

from src.reid.extractor import EmbeddingExtractor
from src.reid.gallery import AppearanceGallery


class TestEmbeddingExtractor:
    def _extractor(self):
        return EmbeddingExtractor(backend="mock", embedding_dim=128)

    def test_empty_bboxes_returns_empty(self):
        ext = self._extractor()
        frame = np.zeros((480, 640, 3), dtype=np.uint8)
        result = ext.extract(frame, np.empty((0, 4)))
        assert result.shape == (0, 128)

    def test_single_bbox_returns_unit_vector(self):
        ext = self._extractor()
        frame = np.zeros((480, 640, 3), dtype=np.uint8)
        bboxes = np.array([[10, 10, 100, 200]], dtype=float)
        result = ext.extract(frame, bboxes)
        assert result.shape == (1, 128)
        np.testing.assert_allclose(np.linalg.norm(result[0]), 1.0, atol=1e-5)

    def test_multiple_bboxes(self):
        ext = self._extractor()
        frame = np.zeros((480, 640, 3), dtype=np.uint8)
        bboxes = np.array([
            [0, 0, 50, 100],
            [200, 100, 350, 400],
            [500, 200, 600, 480],
        ], dtype=float)
        result = ext.extract(frame, bboxes)
        assert result.shape == (3, 128)

    def test_unknown_backend_raises(self):
        with pytest.raises(ValueError, match="Unknown ReID backend"):
            EmbeddingExtractor(backend="invalid_backend")


class TestAppearanceGallery:
    def _gallery(self, threshold=0.5, travel_time=30.0):
        return AppearanceGallery(
            max_size=10,
            ema_alpha=0.1,
            similarity_threshold=threshold,
            max_travel_time=travel_time,
        )

    def _unit_vec(self, dim=128, seed=0):
        rng = np.random.default_rng(seed)
        v = rng.standard_normal(dim).astype(np.float32)
        return v / np.linalg.norm(v)

    def test_add_and_retrieve(self):
        g = self._gallery()
        emb = self._unit_vec()
        g.add(global_id=1, embedding=emb, camera_id="cam_01", local_track_id=10)
        entries = g.get_entries(1)
        assert len(entries) == 1
        assert entries[0].global_id == 1
        assert entries[0].camera_id == "cam_01"

    def test_match_same_embedding(self):
        g = self._gallery(threshold=0.5)
        emb = self._unit_vec(seed=1)
        g.add(global_id=42, embedding=emb, camera_id="cam_01", local_track_id=1)
        g.mark_exited(42)

        matched_id, sim = g.match(emb, query_camera_id="cam_02")
        assert matched_id == 42
        assert sim >= 0.5

    def test_no_match_dissimilar_embedding(self):
        g = self._gallery(threshold=0.99)
        emb1 = self._unit_vec(seed=1)
        emb2 = self._unit_vec(seed=99)
        g.add(global_id=1, embedding=emb1, camera_id="cam_01", local_track_id=1)
        g.mark_exited(1)

        matched_id, sim = g.match(emb2, query_camera_id="cam_02")
        assert matched_id is None

    def test_no_match_without_exit(self):
        """Without mark_exited the ID should not be matched."""
        g = self._gallery(threshold=0.5)
        emb = self._unit_vec(seed=2)
        g.add(global_id=7, embedding=emb, camera_id="cam_01", local_track_id=5)
        # Not calling mark_exited — match should return None
        matched_id, _ = g.match(emb, query_camera_id="cam_02")
        assert matched_id is None

    def test_max_size_pruning(self):
        g = AppearanceGallery(max_size=3)
        emb = self._unit_vec()
        for i in range(10):
            g.add(global_id=1, embedding=emb, camera_id="cam", local_track_id=i)
        assert len(g.get_entries(1)) <= 3

    def test_ema_update_normalised(self):
        g = self._gallery()
        emb = self._unit_vec(seed=3)
        g.add(global_id=1, embedding=emb, camera_id="cam", local_track_id=1)
        mean = g._means[1]
        np.testing.assert_allclose(np.linalg.norm(mean), 1.0, atol=1e-5)
