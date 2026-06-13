"""
server.py — FastAPI + WebSocket dashboard for real-time visualisation.

Endpoints
---------
GET  /                     → Serve the HTML dashboard.
GET  /api/transitions      → JSON list of recent transition events.
GET  /api/cameras          → JSON list of active cameras and their track counts.
WS   /ws/{camera_id}       → Stream JPEG-encoded annotated frames for one camera.
WS   /ws/events            → Stream transition/track-update events as JSON.
"""

from __future__ import annotations

import asyncio
import base64
import json
import logging
import queue
import threading
import time
from collections import deque
from typing import Any, Deque, Dict, List, Optional, Set

import cv2
import numpy as np

logger = logging.getLogger(__name__)

try:
    from fastapi import FastAPI, WebSocket, WebSocketDisconnect
    from fastapi.responses import HTMLResponse
    import uvicorn
    _FASTAPI_AVAILABLE = True
except ImportError:
    _FASTAPI_AVAILABLE = False
    logger.warning("fastapi/uvicorn not installed; dashboard disabled.")


# ---------------------------------------------------------------------------
# Dashboard state (shared between EventBus callbacks and async WS handlers)
# ---------------------------------------------------------------------------

class DashboardState:
    """Thread-safe state store fed by EventBus callbacks."""

    def __init__(self, max_transitions: int = 200) -> None:
        self._lock = threading.Lock()
        # camera_id → latest annotated frame (BGR numpy array)
        self._frames: Dict[str, np.ndarray] = {}
        # recent transition events
        self._transitions: Deque[dict] = deque(maxlen=max_transitions)
        # camera_id → latest track list
        self._tracks: Dict[str, List[dict]] = {}

    def update_frame(self, camera_id: str, frame: np.ndarray) -> None:
        with self._lock:
            self._frames[camera_id] = frame

    def update_tracks(self, camera_id: str, tracks: List[dict]) -> None:
        with self._lock:
            self._tracks[camera_id] = tracks

    def add_transition(self, event: dict) -> None:
        with self._lock:
            self._transitions.appendleft(event)

    def get_frame_jpeg(self, camera_id: str) -> Optional[bytes]:
        with self._lock:
            frame = self._frames.get(camera_id)
        if frame is None:
            return None
        _, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
        return buf.tobytes()

    def get_transitions(self) -> List[dict]:
        with self._lock:
            return list(self._transitions)

    def get_cameras(self) -> List[dict]:
        with self._lock:
            return [
                {"camera_id": cam, "track_count": len(trks)}
                for cam, trks in self._tracks.items()
            ]


# ---------------------------------------------------------------------------
# HTML template
# ---------------------------------------------------------------------------

_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Multi-Camera Tracker</title>
<style>
  body { margin:0; background:#111; color:#eee; font-family:sans-serif; }
  h1 { padding:12px 20px; margin:0; background:#1a1a2e; font-size:1.2rem; }
  #cameras { display:flex; flex-wrap:wrap; gap:12px; padding:12px; }
  .cam-card { background:#1e1e2e; border-radius:8px; overflow:hidden; }
  .cam-card h3 { margin:0; padding:6px 10px; background:#222; font-size:.85rem; }
  .cam-card img { display:block; max-width:480px; width:100%; }
  #events { padding:12px; max-height:220px; overflow-y:auto; }
  #events h2 { margin:0 0 6px; font-size:1rem; }
  .ev { background:#1e1e2e; border-left:3px solid #0af; padding:6px 10px;
        margin:4px 0; border-radius:4px; font-size:.8rem; }
</style>
</head>
<body>
<h1>🎥 Multi-Camera Tracker — Live Dashboard</h1>
<div id="cameras"></div>
<div id="events"><h2>Transition Events</h2><div id="ev-list"></div></div>
<script>
const camsDiv = document.getElementById('cameras');
const evList = document.getElementById('ev-list');
const cameraSockets = {};

async function loadCameras() {
  const res = await fetch('/api/cameras');
  const cams = await res.json();
  cams.forEach(c => {
    if (!cameraSockets[c.camera_id]) {
      const card = document.createElement('div');
      card.className = 'cam-card';
      card.innerHTML = `<h3>${c.camera_id}</h3><img id="img-${c.camera_id}" src="" alt="feed"/>`;
      camsDiv.appendChild(card);
      openFrameSocket(c.camera_id);
    }
  });
}

function openFrameSocket(camId) {
  const ws = new WebSocket(`ws://${location.host}/ws/${camId}`);
  ws.binaryType = 'arraybuffer';
  ws.onmessage = e => {
    const img = document.getElementById(`img-${camId}`);
    if (img) {
      const blob = new Blob([e.data], {type:'image/jpeg'});
      const url = URL.createObjectURL(blob);
      img.onload = () => URL.revokeObjectURL(url);
      img.src = url;
    }
  };
  ws.onclose = () => { delete cameraSockets[camId]; setTimeout(() => openFrameSocket(camId), 2000); };
  cameraSockets[camId] = ws;
}

function openEventSocket() {
  const ws = new WebSocket(`ws://${location.host}/ws/events`);
  ws.onmessage = e => {
    const ev = JSON.parse(e.data);
    if (ev.type === 'transition') {
      const d = document.createElement('div');
      d.className = 'ev';
      d.textContent = `ID ${ev.global_id}: ${ev.from_camera} → ${ev.to_camera}  (sim ${ev.similarity.toFixed(2)})`;
      evList.prepend(d);
      if (evList.children.length > 30) evList.removeChild(evList.lastChild);
    }
  };
  ws.onclose = () => setTimeout(openEventSocket, 2000);
}

setInterval(loadCameras, 3000);
loadCameras();
openEventSocket();
</script>
</body>
</html>
"""


# ---------------------------------------------------------------------------
# FastAPI application factory
# ---------------------------------------------------------------------------

def create_app(state: DashboardState, stream_fps: float = 15) -> "FastAPI":
    if not _FASTAPI_AVAILABLE:
        raise RuntimeError("fastapi is not installed.")

    app = FastAPI(title="Multi-Camera Tracker Dashboard")
    frame_interval = 1.0 / max(stream_fps, 1)

    @app.get("/", response_class=HTMLResponse)
    async def root():
        return _HTML

    @app.get("/api/cameras")
    async def api_cameras():
        return state.get_cameras()

    @app.get("/api/transitions")
    async def api_transitions():
        return state.get_transitions()

    @app.websocket("/ws/events")
    async def ws_events(websocket: WebSocket):
        await websocket.accept()
        last_count = 0
        try:
            while True:
                transitions = state.get_transitions()
                if len(transitions) > last_count:
                    for ev in transitions[: len(transitions) - last_count]:
                        await websocket.send_text(json.dumps({"type": "transition", **ev}))
                    last_count = len(transitions)
                await asyncio.sleep(0.5)
        except WebSocketDisconnect:
            pass

    @app.websocket("/ws/{camera_id}")
    async def ws_camera(websocket: WebSocket, camera_id: str):
        await websocket.accept()
        try:
            while True:
                t0 = time.monotonic()
                jpeg = state.get_frame_jpeg(camera_id)
                if jpeg is not None:
                    await websocket.send_bytes(jpeg)
                elapsed = time.monotonic() - t0
                await asyncio.sleep(max(0.0, frame_interval - elapsed))
        except WebSocketDisconnect:
            pass

    return app


class DashboardServer:
    """
    Wraps the FastAPI app and runs it in a background thread.

    Parameters
    ----------
    state:
        :class:`DashboardState` instance (populated by EventBus callbacks).
    host, port:
        Bind address.
    stream_fps:
        Target FPS for JPEG streams sent to browser clients.
    """

    def __init__(
        self,
        state: DashboardState,
        host: str = "0.0.0.0",
        port: int = 8080,
        stream_fps: float = 15,
    ) -> None:
        self._state = state
        self._host = host
        self._port = port
        self._stream_fps = stream_fps
        self._thread: Optional[threading.Thread] = None

    def start(self) -> None:
        if not _FASTAPI_AVAILABLE:
            logger.warning("Dashboard disabled — fastapi not installed.")
            return
        app = create_app(self._state, self._stream_fps)
        config = uvicorn.Config(app, host=self._host, port=self._port, log_level="warning")
        server = uvicorn.Server(config)
        self._thread = threading.Thread(target=server.run, daemon=True)
        self._thread.start()
        logger.info("Dashboard running at http://%s:%d", self._host, self._port)

    @classmethod
    def from_config(cls, cfg: dict, state: DashboardState) -> "DashboardServer":
        return cls(
            state=state,
            host=cfg.get("host", "0.0.0.0"),
            port=cfg.get("port", 8080),
            stream_fps=cfg.get("stream_fps", 15),
        )
