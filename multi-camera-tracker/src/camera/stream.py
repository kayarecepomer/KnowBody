"""
stream.py — Thread-safe camera stream reader.

Wraps ``cv2.VideoCapture`` in a background thread so that the main
processing loop always gets the *latest* frame rather than buffered ones.
Supports RTSP streams, local video files, and webcam indices.
"""

from __future__ import annotations

import logging
import threading
import time
from typing import Optional, Tuple

import cv2
import numpy as np

logger = logging.getLogger(__name__)


class CameraStream:
    """
    Continuously reads frames from a video source in a background thread.

    Parameters
    ----------
    source:
        RTSP URL, file path, or integer webcam index.
    camera_id:
        Human-readable identifier for this stream.
    width, height:
        Optional target frame dimensions (0 = use source resolution).
    fps:
        Target FPS for reading (0 = as fast as possible).
    reconnect_delay:
        Seconds to wait before attempting to reconnect on failure.
    """

    def __init__(
        self,
        source,
        camera_id: str = "camera",
        width: int = 0,
        height: int = 0,
        fps: float = 0,
        reconnect_delay: float = 5.0,
    ) -> None:
        self.source = source
        self.camera_id = camera_id
        self._target_width = width
        self._target_height = height
        self._target_fps = fps
        self._reconnect_delay = reconnect_delay

        self._cap: Optional[cv2.VideoCapture] = None
        self._frame: Optional[np.ndarray] = None
        self._frame_ts: float = 0.0
        self._lock = threading.Lock()
        self._stopped = threading.Event()
        self._thread: Optional[threading.Thread] = None

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    def start(self) -> "CameraStream":
        """Open the stream and start the background reader thread."""
        self._open()
        self._thread = threading.Thread(target=self._reader_loop, daemon=True)
        self._thread.start()
        logger.info("Stream started: %s (%s)", self.camera_id, self.source)
        return self

    def stop(self) -> None:
        """Signal the reader thread to stop and release the capture."""
        self._stopped.set()
        if self._thread is not None:
            self._thread.join(timeout=5.0)
        if self._cap is not None:
            self._cap.release()
        logger.info("Stream stopped: %s", self.camera_id)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def read(self) -> Tuple[bool, Optional[np.ndarray]]:
        """
        Return the latest frame.

        Returns
        -------
        (ok, frame) — ok is False if no frame has been captured yet.
        """
        with self._lock:
            if self._frame is None:
                return False, None
            return True, self._frame.copy()

    @property
    def is_alive(self) -> bool:
        return self._thread is not None and self._thread.is_alive()

    @property
    def fps(self) -> float:
        """Source FPS (0 if unknown)."""
        if self._cap is not None and self._cap.isOpened():
            return self._cap.get(cv2.CAP_PROP_FPS)
        return 0.0

    @property
    def frame_size(self) -> Tuple[int, int]:
        """Return (width, height) of the stream."""
        if self._cap is not None and self._cap.isOpened():
            w = int(self._cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            h = int(self._cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            return w, h
        return 0, 0

    # ------------------------------------------------------------------
    # Background reader
    # ------------------------------------------------------------------

    def _open(self) -> None:
        if self._cap is not None:
            self._cap.release()
        self._cap = cv2.VideoCapture(self.source)
        if self._target_width > 0:
            self._cap.set(cv2.CAP_PROP_FRAME_WIDTH, self._target_width)
        if self._target_height > 0:
            self._cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self._target_height)
        if self._target_fps > 0:
            self._cap.set(cv2.CAP_PROP_FPS, self._target_fps)

    def _reader_loop(self) -> None:
        while not self._stopped.is_set():
            if self._cap is None or not self._cap.isOpened():
                logger.warning(
                    "Stream %s not open; reconnecting in %.1fs …",
                    self.camera_id,
                    self._reconnect_delay,
                )
                time.sleep(self._reconnect_delay)
                self._open()
                continue

            ret, frame = self._cap.read()
            if not ret:
                logger.warning("Stream %s: read failed. Reconnecting …", self.camera_id)
                time.sleep(self._reconnect_delay)
                self._open()
                continue

            with self._lock:
                self._frame = frame
                self._frame_ts = time.time()

    @classmethod
    def from_config(cls, cam_cfg: dict) -> "CameraStream":
        """Build from a camera config entry."""
        return cls(
            source=cam_cfg["source"],
            camera_id=cam_cfg["id"],
            width=cam_cfg.get("width", 0),
            height=cam_cfg.get("height", 0),
            fps=cam_cfg.get("fps", 0),
        )
