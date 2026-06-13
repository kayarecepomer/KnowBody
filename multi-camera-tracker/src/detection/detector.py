"""
detector.py — YOLOv8-based object/person detector.

Wraps Ultralytics YOLOv8 and normalises its output into a list of
``Detection`` dataclass instances for downstream consumers.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import List, Optional

import numpy as np

logger = logging.getLogger(__name__)


@dataclass
class Detection:
    """Single detected object in one frame."""

    bbox: np.ndarray          # [x1, y1, x2, y2] in pixel coordinates
    confidence: float
    class_id: int
    class_name: str
    # Optional feature embedding filled in by the ReID extractor later
    embedding: Optional[np.ndarray] = field(default=None, repr=False)

    @property
    def xyxy(self) -> np.ndarray:
        return self.bbox

    @property
    def xywh(self) -> np.ndarray:
        x1, y1, x2, y2 = self.bbox
        return np.array([x1, y1, x2 - x1, y2 - y1], dtype=float)

    @property
    def center(self) -> np.ndarray:
        x1, y1, x2, y2 = self.bbox
        return np.array([(x1 + x2) / 2, (y1 + y2) / 2])

    @property
    def area(self) -> float:
        x1, y1, x2, y2 = self.bbox
        return max(0.0, x2 - x1) * max(0.0, y2 - y1)


class Detector:
    """
    YOLOv8 wrapper for multi-class detection.

    Parameters
    ----------
    model_path:
        Path to a YOLOv8 ``.pt`` weights file or a model name recognised
        by Ultralytics (e.g. ``"yolov8n.pt"``).
    confidence_threshold:
        Minimum detection score to keep.
    iou_threshold:
        NMS IoU threshold.
    device:
        Torch device string.  ``"auto"`` selects CUDA > MPS > CPU.
    classes:
        Optional list of COCO class IDs to keep (``None`` → all classes).
    """

    def __init__(
        self,
        model_path: str = "yolov8n.pt",
        confidence_threshold: float = 0.40,
        iou_threshold: float = 0.45,
        device: str = "auto",
        classes: Optional[List[int]] = None,
    ) -> None:
        self.confidence_threshold = confidence_threshold
        self.iou_threshold = iou_threshold
        self.classes = classes
        self._device = self._resolve_device(device)
        self._model = self._load_model(model_path)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def detect(self, frame: np.ndarray) -> List[Detection]:
        """
        Run inference on a single BGR frame.

        Parameters
        ----------
        frame:
            H×W×3 uint8 NumPy array (OpenCV BGR).

        Returns
        -------
        List of :class:`Detection` objects sorted by descending confidence.
        """
        results = self._model(
            frame,
            conf=self.confidence_threshold,
            iou=self.iou_threshold,
            classes=self.classes,
            verbose=False,
        )
        detections: List[Detection] = []
        for result in results:
            boxes = result.boxes
            if boxes is None:
                continue
            xyxy = boxes.xyxy.cpu().numpy()
            confs = boxes.conf.cpu().numpy()
            cls_ids = boxes.cls.cpu().numpy().astype(int)
            for i in range(len(xyxy)):
                detections.append(
                    Detection(
                        bbox=xyxy[i],
                        confidence=float(confs[i]),
                        class_id=int(cls_ids[i]),
                        class_name=result.names[cls_ids[i]],
                    )
                )
        detections.sort(key=lambda d: d.confidence, reverse=True)
        return detections

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

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

    def _load_model(self, model_path: str):
        try:
            from ultralytics import YOLO

            model = YOLO(model_path)
            model.to(self._device)
            logger.info("Loaded YOLOv8 model '%s' on device '%s'.", model_path, self._device)
            return model
        except ImportError as exc:
            raise RuntimeError(
                "ultralytics is required for detection. "
                "Install it with: pip install ultralytics"
            ) from exc

    @classmethod
    def from_config(cls, cfg: dict) -> "Detector":
        """Construct from a ``detection`` config dict (from ``model.yaml``)."""
        return cls(
            model_path=cfg.get("model", "yolov8n.pt"),
            confidence_threshold=cfg.get("confidence_threshold", 0.40),
            iou_threshold=cfg.get("iou_threshold", 0.45),
            device=cfg.get("device", "auto"),
            classes=cfg.get("classes"),
        )
