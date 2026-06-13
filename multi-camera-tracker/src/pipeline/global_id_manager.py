"""
global_id_manager.py — Persistent global identity across cameras.

Maintains a bidirectional mapping between (camera_id, local_track_id)
and a system-wide global_id.  When a new track appears and cannot be
matched to a recently exited identity via ReID, a new global_id is minted.
"""

from __future__ import annotations

import logging
import threading
from typing import Dict, Optional, Tuple

logger = logging.getLogger(__name__)

# Type alias
LocalKey = Tuple[str, int]   # (camera_id, local_track_id)


class GlobalIDManager:
    """
    Thread-safe registry mapping local track keys to global IDs.

    A *global ID* is a monotonically increasing integer assigned to each
    distinct person / object observed by the system.  The same global ID
    is reused when a cross-camera ReID match succeeds.
    """

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._next_id: int = 1
        # (cam_id, local_id) → global_id
        self._local_to_global: Dict[LocalKey, int] = {}
        # global_id → set of (cam_id, local_id) ever assigned
        self._global_to_locals: Dict[int, set] = {}

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def get_or_create(self, camera_id: str, local_track_id: int) -> int:
        """
        Return the global ID for a local track, creating one if needed.
        """
        key: LocalKey = (camera_id, local_track_id)
        with self._lock:
            if key in self._local_to_global:
                return self._local_to_global[key]
            gid = self._next_id
            self._next_id += 1
            self._assign(key, gid)
            logger.debug("New global_id=%d  ←  cam=%s  local=%d", gid, camera_id, local_track_id)
            return gid

    def assign(self, camera_id: str, local_track_id: int, global_id: int) -> None:
        """
        Force-assign an existing *global_id* to a local track.

        Used when ReID matches a new track to a previously seen identity.
        """
        key: LocalKey = (camera_id, local_track_id)
        with self._lock:
            old_gid = self._local_to_global.get(key)
            if old_gid == global_id:
                return
            if old_gid is not None:
                self._global_to_locals[old_gid].discard(key)
            self._assign(key, global_id)
            logger.info(
                "ReID assign: global_id=%d  ←  cam=%s  local=%d  (was %s)",
                global_id,
                camera_id,
                local_track_id,
                old_gid,
            )

    def get(self, camera_id: str, local_track_id: int) -> Optional[int]:
        """Return the global ID for a local track, or None if unknown."""
        key: LocalKey = (camera_id, local_track_id)
        with self._lock:
            return self._local_to_global.get(key)

    def remove(self, camera_id: str, local_track_id: int) -> None:
        """Remove a local track mapping (e.g. when a track is deleted)."""
        key: LocalKey = (camera_id, local_track_id)
        with self._lock:
            gid = self._local_to_global.pop(key, None)
            if gid is not None:
                self._global_to_locals[gid].discard(key)

    def local_to_global_map(self, camera_id: str) -> Dict[int, int]:
        """
        Return a snapshot ``{local_track_id: global_id}`` for one camera.
        """
        with self._lock:
            return {
                local_id: gid
                for (cam, local_id), gid in self._local_to_global.items()
                if cam == camera_id
            }

    def all_global_ids(self) -> list:
        with self._lock:
            return list(self._global_to_locals.keys())

    # ------------------------------------------------------------------
    # Internal
    # ------------------------------------------------------------------

    def _assign(self, key: LocalKey, gid: int) -> None:
        self._local_to_global[key] = gid
        self._global_to_locals.setdefault(gid, set()).add(key)
