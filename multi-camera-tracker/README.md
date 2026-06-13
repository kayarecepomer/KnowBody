# Multi-Camera Person / Object Tracker

A production-grade Computer Vision system that **continuously tracks people and objects across multiple camera feeds**, detecting when a subject transitions between cameras and maintaining a single persistent global identity throughout.

---

## ✨ Features

| Module | Technology | Notes |
|---|---|---|
| **Detection** | YOLOv8 (Ultralytics) | Real-time, multi-class |
| **Single-cam tracking** | ByteTrack + Kalman filter | Handles occlusion & re-entry |
| **Re-identification** | OSNet (torchreid) | L2-normalised embeddings + EMA gallery |
| **Exit zone detection** | Polygon overlap | Configurable per-camera ROIs |
| **Cross-camera handoff** | Cosine similarity + time window | Assigns same global ID |
| **Dashboard** | FastAPI + WebSocket | Live JPEG streams + transition events |
| **Storage** | SQLAlchemy (SQLite/Postgres) | Persists all transition events |

---

## 📂 Repository Structure

```
multi-camera-tracker/
├── configs/
│   ├── cameras.yaml        # Camera streams, exit zones, adjacency graph
│   └── model.yaml          # Detection / tracking / ReID thresholds
├── models/                 # Downloaded YOLOv8 / OSNet weights go here
├── src/
│   ├── detection/
│   │   └── detector.py     # YOLOv8 wrapper → list[Detection]
│   ├── tracking/
│   │   ├── kalman.py       # Constant-velocity Kalman filter
│   │   └── tracker.py      # ByteTracker (per-camera)
│   ├── reid/
│   │   ├── extractor.py    # Appearance embedding extraction
│   │   └── gallery.py      # Rolling EMA feature gallery
│   ├── camera/
│   │   ├── stream.py       # Thread-safe VideoCapture wrapper
│   │   ├── topology.py     # Camera adjacency graph
│   │   └── exit_zone.py    # Polygon-based exit detection
│   ├── pipeline/
│   │   ├── event_bus.py         # Pub/sub event system
│   │   ├── global_id_manager.py # Local → global ID mapping
│   │   ├── orchestrator.py      # Multi-threaded pipeline
│   │   └── storage.py           # SQLAlchemy event persistence
│   └── dashboard/
│       └── server.py       # FastAPI + WebSocket dashboard
├── tests/                  # pytest test suite
├── scripts/
│   ├── demo.py             # Offline demo on video files / webcam
│   └── setup.sh            # One-shot environment setup
├── data/                   # Auto-created; stores events.db
├── main.py                 # CLI entry point
└── requirements.txt
```

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
bash scripts/setup.sh          # CUDA
bash scripts/setup.sh --cpu    # CPU-only PyTorch
```

### 2. Configure cameras
Edit `configs/cameras.yaml`:
```yaml
cameras:
  - id: cam_01
    source: "rtsp://192.168.1.101:554/stream"   # or 0 for webcam
    exit_zones:
      - name: right_door
        points: [[1800, 0], [1920, 0], [1920, 1080], [1800, 1080]]
    adjacent: [cam_02]
```

### 3. Run

```bash
# Full pipeline (reads from RTSP / files defined in cameras.yaml)
python main.py

# Offline demo with two video files
python scripts/demo.py --videos cam1.mp4 cam2.mp4

# Demo with webcam
python scripts/demo.py --webcam

# Disable dashboard
python main.py --no-dashboard
```

Open `http://localhost:8080` to see the live dashboard.

---

## ⚙️ Configuration

### `configs/cameras.yaml`

| Key | Description |
|---|---|
| `cameras[*].id` | Unique camera identifier |
| `cameras[*].source` | RTSP URL, file path, or webcam integer |
| `cameras[*].exit_zones` | List of named polygon ROIs (pixel coords) |
| `cameras[*].adjacent` | Neighbour camera IDs for ReID search |
| `handoff.reid_similarity_threshold` | Cosine similarity threshold (default `0.70`) |
| `handoff.max_travel_time_seconds` | Max seconds between exit and arrival (default `30`) |
| `handoff.exit_confirm_frames` | Frames in exit zone before event fires (default `3`) |

### `configs/model.yaml`

| Key | Description |
|---|---|
| `detection.model` | YOLOv8 weights (`yolov8n.pt` … `yolov8x.pt`) |
| `detection.confidence_threshold` | Min score to keep a detection |
| `tracking.high_confidence_threshold` | ByteTrack high-score threshold |
| `reid.backend` | `"torchreid"` or `"mock"` |
| `reid.model_name` | torchreid model name (`"osnet_x1_0"`, …) |
| `reid.ema_alpha` | EMA update rate for gallery vectors |
| `dashboard.port` | Web dashboard port (default `8080`) |

---

## 🧠 Key Algorithms

### Exit Zone Detection
A polygonal ROI is defined at each camera edge.  When ≥30% of a track's bounding box overlaps the zone for **N consecutive frames** (`exit_confirm_frames`), a "left camera" event is fired and the global ID is marked as recently exited.

### Cross-Camera Re-Identification
When a new confirmed track appears in camera B, its OSNet embedding is compared (cosine similarity) against the gallery of all global IDs that recently exited within `max_travel_time_seconds`.  If the best similarity exceeds `reid_similarity_threshold`, the existing global ID is reassigned — otherwise a new identity is minted.

### Gallery Management
Each global ID maintains a rolling deque of up to `gallery_max_size` embeddings.  A representative **EMA mean** is updated at each new observation:

```
mean = (1 - α) * mean + α * new_embedding   (then L2-normalised)
```

This allows the gallery to adapt to gradual appearance changes (clothing, lighting).

---

## 🧪 Running Tests

```bash
pytest tests/ -v
```

The test suite uses **mock backends** only (no GPU, no network downloads required).

---

## 📊 Dashboard

Open `http://localhost:8080` after starting the pipeline.

- **Live camera feeds** with colour-coded bounding boxes (one colour per global ID)
- **Transition event log** — shows every cross-camera handoff in real time
- **REST API** — `GET /api/transitions` and `GET /api/cameras` for integration

---

## 🗺️ Roadmap

- [ ] Milestone 1 — Single-camera detection + tracking ✅
- [ ] Milestone 2 — ReID embedding extraction + gallery ✅
- [ ] Milestone 3 — Camera topology + exit zones ✅
- [ ] Milestone 4 — Cross-camera handoff + global IDs ✅
- [ ] Milestone 5 — Multi-stream async pipeline ✅
- [ ] Milestone 6 — Visualisation dashboard ✅
- [ ] Milestone 7 — Evaluation on DukeMTMC / Market-1501

---

## 📄 License

MIT
