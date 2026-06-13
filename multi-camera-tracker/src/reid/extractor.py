"""
extractor.py — Appearance embedding extractor for person ReID.

Supports two backends:
  * ``"torchreid"`` — uses OSNet from the torchreid library (requires GPU/CPU
    with PyTorch).
  * ``"mock"``      — returns deterministic random vectors; useful for unit
    tests and CI environments without heavy dependencies.
"""

from __future__ import annotations

import logging
from typing import List, Optional

import numpy as np

logger = logging.getLogger(__name__)

# Resize target for most ReID models (height × width)
_REID_INPUT_SIZE = (256, 128)


class EmbeddingExtractor:
    """
    Extract fixed-length appearance embeddings from cropped bounding-box images.

    Parameters
    ----------
    backend:
        ``"torchreid"`` or ``"mock"``.
    model_name:
        torchreid model identifier (e.g. ``"osnet_x1_0"``).
    weights:
        Path to custom weights; ``None`` → auto-download pretrained.
    device:
        Torch device string or ``"auto"``.
    embedding_dim:
        Dimensionality of the output embedding vector.
    """

    def __init__(
        self,
        backend: str = "torchreid",
        model_name: str = "osnet_x1_0",
        weights: Optional[str] = None,
        device: str = "auto",
        embedding_dim: int = 512,
    ) -> None:
        self.backend = backend
        self.embedding_dim = embedding_dim
        self._device = self._resolve_device(device)

        if backend == "torchreid":
            self._model = self._load_torchreid(model_name, weights)
        elif backend == "mock":
            self._model = None
            logger.warning("Using mock ReID extractor — embeddings are random.")
        else:
            raise ValueError(f"Unknown ReID backend: {backend!r}")

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def extract(self, frame: np.ndarray, bboxes: np.ndarray) -> np.ndarray:
        """
        Extract embeddings for a batch of bounding boxes from one frame.

        Parameters
        ----------
        frame:
            H×W×3 uint8 BGR image.
        bboxes:
            N×4 array of ``[x1, y1, x2, y2]`` boxes.

        Returns
        -------
        N×D float32 array of L2-normalised embeddings.
        """
        if len(bboxes) == 0:
            return np.empty((0, self.embedding_dim), dtype=np.float32)

        if self.backend == "mock":
            return self._mock_embeddings(len(bboxes))

        crops = self._crop_resize(frame, bboxes)

        return self._extract_torchreid(crops)

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _crop_resize(self, frame: np.ndarray, bboxes: np.ndarray) -> List[np.ndarray]:
        import cv2

        h_frame, w_frame = frame.shape[:2]
        crops = []
        for box in bboxes:
            x1, y1, x2, y2 = map(int, box)
            x1, y1 = max(0, x1), max(0, y1)
            x2, y2 = min(w_frame, x2), min(h_frame, y2)
            if x2 <= x1 or y2 <= y1:
                # Degenerate box — use a black crop
                crops.append(np.zeros((_REID_INPUT_SIZE[0], _REID_INPUT_SIZE[1], 3), np.uint8))
            else:
                crop = frame[y1:y2, x1:x2]
                crop = cv2.resize(crop, (_REID_INPUT_SIZE[1], _REID_INPUT_SIZE[0]))
                crops.append(crop)
        return crops

    def _extract_torchreid(self, crops: List[np.ndarray]) -> np.ndarray:
        import torch

        # torchreid expects tensors of shape (N, C, H, W) with ImageNet normalisation
        mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
        std = np.array([0.229, 0.224, 0.225], dtype=np.float32)

        tensors = []
        for crop in crops:
            img = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0
            img = (img - mean) / std
            tensors.append(torch.from_numpy(img.transpose(2, 0, 1)))  # CHW

        batch = torch.stack(tensors).to(self._device)
        with torch.no_grad():
            feats = self._model(batch)          # (N, D)
            feats = torch.nn.functional.normalize(feats, dim=1)

        return feats.cpu().numpy().astype(np.float32)

    def _mock_embeddings(self, n: int) -> np.ndarray:
        """Return deterministic-ish unit vectors (useful for testing)."""
        rng = np.random.default_rng(seed=42)
        vecs = rng.standard_normal((n, self.embedding_dim)).astype(np.float32)
        norms = np.linalg.norm(vecs, axis=1, keepdims=True)
        return vecs / np.maximum(norms, 1e-12)

    def _load_torchreid(self, model_name: str, weights: Optional[str]):
        try:
            import torchreid

            model = torchreid.models.build_model(
                name=model_name,
                num_classes=1000,   # pretrained on Market-1501 / DukeMTMC
                pretrained=(weights is None),
            )
            if weights:
                torchreid.utils.load_pretrained_weights(model, weights)
            model.eval()
            model.to(self._device)
            logger.info("Loaded torchreid model '%s' on '%s'.", model_name, self._device)
            return model
        except ImportError as exc:
            raise RuntimeError(
                "torchreid is required for embedding extraction. "
                "Install via: pip install torchreid"
            ) from exc

    @staticmethod
    def _resolve_device(device: str) -> str:
        if device != "auto":
            return device
        try:
            import torch

            if torch.cuda.is_available():
                return "cuda"
            if torch.backends.mps.is_available():
                return "mps"
        except ImportError:
            pass
        return "cpu"

    @classmethod
    def from_config(cls, cfg: dict) -> "EmbeddingExtractor":
        """Construct from a ``reid`` config dict."""
        return cls(
            backend=cfg.get("backend", "torchreid"),
            model_name=cfg.get("model_name", "osnet_x1_0"),
            weights=cfg.get("weights"),
            device=cfg.get("device", "auto"),
            embedding_dim=cfg.get("embedding_dim", 512),
        )
