"""
topology.py — Camera adjacency graph.

Reads ``configs/cameras.yaml`` and provides a directed graph of which
cameras are spatially adjacent (i.e. a person can walk from one to the
other).  Used to constrain cross-camera ReID searches.
"""

from __future__ import annotations

from typing import Dict, List, Set


class CameraTopology:
    """
    Directed adjacency graph of cameras.

    Parameters
    ----------
    adjacency:
        Dict mapping camera_id → set of adjacent camera_ids.
    """

    def __init__(self, adjacency: Dict[str, Set[str]]) -> None:
        self._adj: Dict[str, Set[str]] = adjacency

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def neighbours(self, camera_id: str) -> List[str]:
        """Return the list of cameras adjacent to *camera_id*."""
        return list(self._adj.get(camera_id, set()))

    def are_adjacent(self, cam_a: str, cam_b: str) -> bool:
        """Return True if *cam_a* and *cam_b* are directly adjacent."""
        return cam_b in self._adj.get(cam_a, set())

    def all_camera_ids(self) -> List[str]:
        return list(self._adj.keys())

    # ------------------------------------------------------------------
    # Factory
    # ------------------------------------------------------------------

    @classmethod
    def from_config(cls, cameras_cfg: List[dict]) -> "CameraTopology":
        """
        Build topology from the ``cameras`` list in ``cameras.yaml``.

        Each camera entry may have an ``adjacent`` list of neighbouring
        camera IDs.  The resulting graph is *directed* (only edges
        explicitly listed are stored; add both directions in the YAML to
        make it undirected).
        """
        adjacency: Dict[str, Set[str]] = {}
        for cam in cameras_cfg:
            cid = cam["id"]
            adjacency.setdefault(cid, set())
            for neighbour in cam.get("adjacent", []):
                adjacency[cid].add(neighbour)
                adjacency.setdefault(neighbour, set())
        return cls(adjacency)
