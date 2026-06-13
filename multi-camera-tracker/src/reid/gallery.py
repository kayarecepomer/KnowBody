"""
gallery.py — Rolling appearance gallery with EMA embedding updates.

Each global ID maintains a set of embedding vectors.  When a new track
appears in a camera, its embedding is compared against all gallery entries
using cosine similarity to decide whether it is an already-seen identity
(cross-camera re-identification) or a brand-new person.
"""

from __future__ import annotations

import logging
import time
from collections import defaultdict, deque
from dataclasses import dataclass, field
from typing import Dict, Deque, List, Optional, Tuple

import numpy as np

logger = logging.getLogger(__name__)


@dataclass
class GalleryEntry:
    """One embedding sample stored in the gallery."""

    global_id: int
    embedding: np.ndarray             # L2-normalised, shape (D,)
    camera_id: str
    local_track_id: int
    timestamp: float = field(default_factory=time.time)


class AppearanceGallery:
    """
    Per-global-ID rolling feature gallery.

    For each global ID the gallery stores up to ``max_size`` embeddings
    (oldest are pruned first).  The representative embedding used for
    matching is the EMA-updated mean.

    Parameters
    ----------
    max_size:
        Maximum number of stored embeddings per global ID.
    ema_alpha:
        EMA update coefficient.  At each update:
        ``mean = (1 - alpha) * mean + alpha * new_embedding``.
    similarity_threshold:
        Minimum cosine similarity to accept a ReID match.
    max_travel_time:
        Maximum seconds between "left cam A" and "arrived cam B" to
        still attempt a ReID match.
    """

    def __init__(
        self,
        max_size: int = 50,
        ema_alpha: float = 0.10,
        similarity_threshold: float = 0.70,
        max_travel_time: float = 30.0,
    ) -> None:
        self.max_size = max_size
        self.ema_alpha = ema_alpha
        self.similarity_threshold = similarity_threshold
        self.max_travel_time = max_travel_time

        # global_id → deque of GalleryEntry
        self._entries: Dict[int, Deque[GalleryEntry]] = defaultdict(
            lambda: deque(maxlen=self.max_size)
        )
        # global_id → EMA embedding (representative vector)
        self._means: Dict[int, np.ndarray] = {}
        # global_id → timestamp of last "left camera" event
        self._exit_times: Dict[int, float] = {}

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def add(
        self,
        global_id: int,
        embedding: np.ndarray,
        camera_id: str,
        local_track_id: int,
    ) -> None:
        """Add or update an embedding in the gallery."""
        embedding = self._normalise(embedding)
        entry = GalleryEntry(
            global_id=global_id,
            embedding=embedding,
            camera_id=camera_id,
            local_track_id=local_track_id,
        )
        self._entries[global_id].append(entry)

        # EMA update of the mean representative vector
        if global_id not in self._means:
            self._means[global_id] = embedding.copy()
        else:
            self._means[global_id] = self._normalise(
                (1.0 - self.ema_alpha) * self._means[global_id]
                + self.ema_alpha * embedding
            )

    def mark_exited(self, global_id: int) -> None:
        """Record the timestamp at which a global ID was last seen exiting a camera."""
        self._exit_times[global_id] = time.time()

    def match(
        self,
        query_embedding: np.ndarray,
        query_camera_id: str,
        adjacent_ids: Optional[List[int]] = None,
    ) -> Tuple[Optional[int], float]:
        """
        Find the best-matching global ID for a query embedding.

        Only IDs that recently exited a camera (within ``max_travel_time``
        seconds) and whose exit camera is in ``adjacent_ids`` (if provided)
        are considered candidates.

        Parameters
        ----------
        query_embedding:
            L2-normalised query embedding, shape (D,).
        query_camera_id:
            The camera where the query track was just detected.
        adjacent_ids:
            Optional list of global IDs to restrict the search to.  If
            ``None``, all recently exited IDs are searched.

        Returns
        -------
        (best_global_id, cosine_similarity) or (None, 0.0) if no match
        found above the threshold.
        """
        query_embedding = self._normalise(query_embedding)
        now = time.time()

        best_id: Optional[int] = None
        best_sim: float = 0.0

        candidates = adjacent_ids if adjacent_ids is not None else list(self._means.keys())

        for gid in candidates:
            exit_time = self._exit_times.get(gid)
            if exit_time is None:
                continue
            if now - exit_time > self.max_travel_time:
                continue

            mean_emb = self._means.get(gid)
            if mean_emb is None:
                continue

            sim = float(np.dot(query_embedding, mean_emb))
            if sim > best_sim:
                best_sim = sim
                best_id = gid

        if best_sim >= self.similarity_threshold:
            logger.debug(
                "ReID match: global_id=%d  sim=%.3f  cam=%s",
                best_id,
                best_sim,
                query_camera_id,
            )
            return best_id, best_sim

        return None, best_sim

    def get_entries(self, global_id: int) -> List[GalleryEntry]:
        """Return all stored entries for a global ID."""
        return list(self._entries.get(global_id, []))

    def all_global_ids(self) -> List[int]:
        return list(self._means.keys())

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _normalise(v: np.ndarray) -> np.ndarray:
        norm = np.linalg.norm(v)
        return v / max(norm, 1e-12)

    @classmethod
    def from_config(cls, cam_cfg: dict, reid_cfg: dict) -> "AppearanceGallery":
        """Construct from config dicts."""
        return cls(
            max_size=reid_cfg.get("gallery_max_size", 50),
            ema_alpha=reid_cfg.get("ema_alpha", 0.10),
            similarity_threshold=cam_cfg.get("reid_similarity_threshold", 0.70),
            max_travel_time=cam_cfg.get("max_travel_time_seconds", 30.0),
        )
