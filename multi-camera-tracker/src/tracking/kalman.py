"""
kalman.py — Constant-velocity Kalman filter for bounding-box tracking.

State vector: [cx, cy, s, r, vx, vy, vs]
    cx, cy  — centre of bounding box
    s       — scale (area)
    r       — aspect ratio (width/height, kept constant)
    vx, vy  — velocities in x and y
    vs      — velocity of scale

Measurement vector: [cx, cy, s, r]

This is the same formulation used by SORT / ByteTrack.
"""

from __future__ import annotations

import numpy as np


class KalmanBoxTracker:
    """
    Tracks a single bounding box using a Kalman filter.

    Parameters
    ----------
    bbox : array-like
        Initial bounding box ``[x1, y1, x2, y2]``.
    """

    count: int = 0  # class-level counter for unique IDs

    def __init__(self, bbox: np.ndarray) -> None:
        KalmanBoxTracker.count += 1
        self.id: int = KalmanBoxTracker.count

        # State dimension: 7, Measurement dimension: 4
        self._kf = self._build_filter()
        self._kf["x"][:4] = self._bbox_to_z(bbox)

        self.time_since_update: int = 0
        self.hit_streak: int = 0
        self.hits: int = 0
        self.age: int = 0
        self._history: list[np.ndarray] = []

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def predict(self) -> np.ndarray:
        """Advance the state estimate and return the predicted bbox."""
        kf = self._kf
        # Clamp scale to positive
        if (kf["x"][6] + kf["x"][2]) <= 0:
            kf["x"][6] = 0.0

        # x = F @ x
        kf["x"] = kf["F"] @ kf["x"]
        # P = F @ P @ F.T + Q
        kf["P"] = kf["F"] @ kf["P"] @ kf["F"].T + kf["Q"]

        self.age += 1
        if self.time_since_update > 0:
            self.hit_streak = 0
        self.time_since_update += 1
        self._history.append(self._x_to_bbox(kf["x"]))
        return self._history[-1]

    def update(self, bbox: np.ndarray) -> None:
        """Correct the filter state with a new measurement."""
        kf = self._kf
        z = self._bbox_to_z(bbox)

        # Innovation: y = z - H @ x
        y = z - kf["H"] @ kf["x"]
        # Innovation covariance: S = H @ P @ H.T + R
        S = kf["H"] @ kf["P"] @ kf["H"].T + kf["R"]
        # Kalman gain: K = P @ H.T @ inv(S)
        K = kf["P"] @ kf["H"].T @ np.linalg.inv(S)
        # State update
        kf["x"] = kf["x"] + K @ y
        # Covariance update (Joseph form for numerical stability)
        I_KH = np.eye(7) - K @ kf["H"]
        kf["P"] = I_KH @ kf["P"]

        self.time_since_update = 0
        self.hits += 1
        self.hit_streak += 1
        self._history = []

    def get_state(self) -> np.ndarray:
        """Return current state as ``[x1, y1, x2, y2]``."""
        return self._x_to_bbox(self._kf["x"])

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _build_filter() -> dict:
        """Construct the Kalman filter matrices."""
        dt = 1.0  # one frame

        # Transition matrix F (constant-velocity model)
        F = np.eye(7)
        for i in range(4):
            F[i, i + 3] = dt  # position += velocity * dt

        # Measurement matrix H (observe first 4 state dimensions)
        H = np.zeros((4, 7))
        H[:4, :4] = np.eye(4)

        # Measurement noise R
        R = np.diag([1.0, 1.0, 10.0, 10.0])

        # Process noise Q
        Q = np.diag([1.0, 1.0, 1.0, 1.0, 0.01, 0.01, 0.0001])

        # Initial estimate covariance P
        P = np.diag([10.0, 10.0, 10.0, 10.0, 1e4, 1e4, 1e4])

        return {"F": F, "H": H, "R": R, "Q": Q, "P": P, "x": np.zeros((7, 1))}

    @staticmethod
    def _bbox_to_z(bbox: np.ndarray) -> np.ndarray:
        """Convert ``[x1, y1, x2, y2]`` → ``[[cx], [cy], [s], [r]]``."""
        x1, y1, x2, y2 = bbox
        w = x2 - x1
        h = y2 - y1
        cx = x1 + w / 2
        cy = y1 + h / 2
        s = w * h          # area
        r = w / max(h, 1e-6)  # aspect ratio
        return np.array([[cx], [cy], [s], [r]], dtype=float)

    @staticmethod
    def _x_to_bbox(x: np.ndarray) -> np.ndarray:
        """Convert state vector → ``[x1, y1, x2, y2]``."""
        flat = x.flatten()
        cx, cy, s, r = float(flat[0]), float(flat[1]), float(flat[2]), float(flat[3])
        s = max(s, 1e-6)
        r = max(r, 1e-6)
        w = np.sqrt(s * r)
        h = s / w
        return np.array([cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2])
