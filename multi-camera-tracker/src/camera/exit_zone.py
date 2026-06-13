"""
exit_zone.py — Polygon-based exit zone detection.

An exit zone is a named polygonal region (defined in pixel coordinates)
at the edge of a camera's field of view.  When a tracked bounding box
overlaps an exit zone for a configurable number of consecutive frames,
an ``ExitEvent`` is emitted.
"""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple

import numpy as np

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Geometry helpers (pure NumPy — no Shapely dependency for the core logic)
# ---------------------------------------------------------------------------

def _bbox_to_polygon(bbox: np.ndarray) -> np.ndarray:
    """Convert ``[x1, y1, x2, y2]`` to a 4-point polygon array."""
    x1, y1, x2, y2 = bbox
    return np.array([[x1, y1], [x2, y1], [x2, y2], [x1, y2]], dtype=float)


def _polygon_intersection_area(poly_a: np.ndarray, poly_b: np.ndarray) -> float:
    """
    Compute the intersection area of two *convex* polygons using the
    Sutherland-Hodgman algorithm.

    Parameters
    ----------
    poly_a, poly_b:
        Arrays of shape (N, 2) and (M, 2) representing the polygon vertices
        in order (clockwise or counter-clockwise).
    """

    def _clip(subject: list, clip_edge_start, clip_edge_end) -> list:
        output: list = []
        if not subject:
            return output
        for i in range(len(subject)):
            curr = subject[i]
            prev = subject[i - 1]
            curr_inside = _inside(curr, clip_edge_start, clip_edge_end)
            prev_inside = _inside(prev, clip_edge_start, clip_edge_end)
            if curr_inside:
                if not prev_inside:
                    output.append(_intersect(prev, curr, clip_edge_start, clip_edge_end))
                output.append(curr)
            elif prev_inside:
                output.append(_intersect(prev, curr, clip_edge_start, clip_edge_end))
        return output

    def _inside(p, a, b) -> bool:
        return (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]) >= 0

    def _intersect(p1, p2, p3, p4):
        x1, y1 = p1
        x2, y2 = p2
        x3, y3 = p3
        x4, y4 = p4
        denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)
        if abs(denom) < 1e-10:
            return p2  # parallel — return end-point
        t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom
        return (x1 + t * (x2 - x1), y1 + t * (y2 - y1))

    def _polygon_area(pts) -> float:
        if len(pts) < 3:
            return 0.0
        n = len(pts)
        area = 0.0
        for i in range(n):
            j = (i + 1) % n
            area += pts[i][0] * pts[j][1]
            area -= pts[j][0] * pts[i][1]
        return abs(area) / 2.0

    clipped = list(map(tuple, poly_a))
    for i in range(len(poly_b)):
        clipped = _clip(clipped, poly_b[i], poly_b[(i + 1) % len(poly_b)])
        if not clipped:
            return 0.0

    return _polygon_area(clipped)


def bbox_overlap_ratio(bbox: np.ndarray, zone_poly: np.ndarray) -> float:
    """
    Return the fraction of *bbox* area that overlaps *zone_poly*.

    Returns a value in [0, 1].
    """
    bbox_area = max(0.0, (bbox[2] - bbox[0]) * (bbox[3] - bbox[1]))
    if bbox_area < 1.0:
        return 0.0
    bbox_poly = _bbox_to_polygon(bbox)
    inter = _polygon_intersection_area(bbox_poly, zone_poly)
    return inter / bbox_area


# ---------------------------------------------------------------------------
# Exit zone data structures
# ---------------------------------------------------------------------------

@dataclass
class ExitZone:
    """One named exit zone."""

    name: str
    polygon: np.ndarray  # shape (N, 2), pixel coordinates


@dataclass
class ExitEvent:
    """Fired when a track has been in an exit zone for enough frames."""

    global_id: int
    local_track_id: int
    camera_id: str
    zone_name: str
    timestamp: float = field(default_factory=time.time)
    last_bbox: Optional[np.ndarray] = None


class ExitZoneMonitor:
    """
    Tracks consecutive frames in which each local track overlaps an exit zone.

    Parameters
    ----------
    zones:
        List of :class:`ExitZone` objects for one camera.
    confirm_frames:
        Number of consecutive overlapping frames before an exit is confirmed.
    overlap_threshold:
        Minimum fraction of the bbox that must overlap the zone.
    camera_id:
        ID of the camera this monitor belongs to.
    """

    def __init__(
        self,
        zones: List[ExitZone],
        confirm_frames: int = 3,
        overlap_threshold: float = 0.30,
        camera_id: str = "unknown",
    ) -> None:
        self.zones = zones
        self.confirm_frames = confirm_frames
        self.overlap_threshold = overlap_threshold
        self.camera_id = camera_id

        # (track_id, zone_name) → consecutive overlap count
        self._counters: Dict[Tuple[int, str], int] = {}
        # track_ids that already fired an exit event (to avoid duplicates)
        self._fired: set = set()

    def update(
        self, tracks, global_id_map: Dict[int, int]
    ) -> List[ExitEvent]:
        """
        Evaluate all active tracks against exit zones.

        Parameters
        ----------
        tracks:
            List of :class:`~src.tracking.tracker.Track` objects.
        global_id_map:
            Mapping local_track_id → global_id.

        Returns
        -------
        List of :class:`ExitEvent` objects for newly confirmed exits.
        """
        events: List[ExitEvent] = []
        active_ids = {t.track_id for t in tracks}

        # Prune counters for gone tracks
        keys_to_remove = [k for k in self._counters if k[0] not in active_ids]
        for k in keys_to_remove:
            del self._counters[k]

        self._fired = {tid for tid in self._fired if tid in active_ids}

        for track in tracks:
            if track.track_id in self._fired:
                continue
            for zone in self.zones:
                key = (track.track_id, zone.name)
                ratio = bbox_overlap_ratio(track.bbox, zone.polygon)
                if ratio >= self.overlap_threshold:
                    self._counters[key] = self._counters.get(key, 0) + 1
                    if self._counters[key] >= self.confirm_frames:
                        gid = global_id_map.get(track.track_id)
                        if gid is not None:
                            event = ExitEvent(
                                global_id=gid,
                                local_track_id=track.track_id,
                                camera_id=self.camera_id,
                                zone_name=zone.name,
                                last_bbox=track.bbox.copy(),
                            )
                            events.append(event)
                            self._fired.add(track.track_id)
                            logger.info(
                                "EXIT: global_id=%d  cam=%s  zone=%s",
                                gid,
                                self.camera_id,
                                zone.name,
                            )
                            break
                else:
                    self._counters.pop(key, None)

        return events

    @classmethod
    def from_config(cls, cam_cfg: dict, handoff_cfg: dict) -> "ExitZoneMonitor":
        """Build from a camera config entry and the global handoff config."""
        zones = [
            ExitZone(
                name=z["name"],
                polygon=np.array(z["points"], dtype=float),
            )
            for z in cam_cfg.get("exit_zones", [])
        ]
        return cls(
            zones=zones,
            confirm_frames=handoff_cfg.get("exit_confirm_frames", 3),
            camera_id=cam_cfg["id"],
        )
