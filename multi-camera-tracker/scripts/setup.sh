#!/usr/bin/env bash
# scripts/setup.sh — Install all dependencies for the multi-camera tracker.
# Usage: bash scripts/setup.sh [--cpu]
#
# Flags:
#   --cpu   Install CPU-only PyTorch (faster install, no CUDA support)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "=== Multi-Camera Tracker Setup ==="
echo "Project root: $PROJECT_ROOT"
cd "$PROJECT_ROOT"

# --- Python version check -------------------------------------------
MIN_PYTHON="3.10"
PYTHON=$(command -v python3 || command -v python)
PY_VERSION=$("$PYTHON" -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")

python3 -c "
import sys
ver = sys.version_info
if ver < (3, 10):
    print(f'ERROR: Python {ver.major}.{ver.minor} found; Python 3.10+ required.')
    sys.exit(1)
print(f'Python {ver.major}.{ver.minor} OK')
"

# --- Virtual environment --------------------------------------------
if [[ ! -d ".venv" ]]; then
    echo "Creating virtual environment …"
    "$PYTHON" -m venv .venv
fi

source .venv/bin/activate
pip install --upgrade pip wheel setuptools --quiet

# --- PyTorch (CPU or CUDA) ------------------------------------------
CPU_ONLY=false
for arg in "$@"; do
    [[ "$arg" == "--cpu" ]] && CPU_ONLY=true
done

if python -c "import torch" &>/dev/null; then
    echo "PyTorch already installed — skipping."
else
    if $CPU_ONLY; then
        echo "Installing PyTorch (CPU only) …"
        pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu --quiet
    else
        echo "Installing PyTorch (CUDA 12.1) …"
        pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121 --quiet
    fi
fi

# --- Project dependencies -------------------------------------------
echo "Installing project requirements …"
pip install -r requirements.txt --quiet

# --- torchreid (special install) ------------------------------------
if ! python -c "import torchreid" &>/dev/null; then
    echo "Installing torchreid …"
    pip install git+https://github.com/KaiyangZhou/deep-person-reid.git --quiet || \
        echo "WARNING: torchreid install failed. Use backend=mock in configs/model.yaml."
fi

# --- Download YOLOv8 nano weights ----------------------------------
python - <<'EOF'
from pathlib import Path
weights = Path("models/yolov8n.pt")
if not weights.exists():
    try:
        from ultralytics import YOLO
        print("Downloading YOLOv8 nano weights …")
        YOLO("yolov8n.pt")  # auto-downloads to ~/.ultralytics/
        print("Done.")
    except Exception as e:
        print(f"WARNING: Could not download weights automatically: {e}")
else:
    print("YOLOv8 weights already present.")
EOF

# --- Create data directory ------------------------------------------
mkdir -p data

echo ""
echo "✅  Setup complete!"
echo "   Activate environment : source .venv/bin/activate"
echo "   Run demo             : python scripts/demo.py --webcam"
echo "   Run full pipeline    : python main.py"
echo "   Run tests            : pytest tests/"
