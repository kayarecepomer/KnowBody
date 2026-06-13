"""
main.py — CLI entry point for the multi-camera tracking pipeline.

Usage
-----
::

    # Run with default config files
    python main.py

    # Override config paths
    python main.py --cameras configs/cameras.yaml --model configs/model.yaml

    # Disable dashboard
    python main.py --no-dashboard

    # Verbose logging
    python main.py --log-level DEBUG
"""

from __future__ import annotations

import argparse
import logging
import signal
import sys
import time

import yaml


def _parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Multi-Camera Person/Object Tracker")
    p.add_argument("--cameras", default="configs/cameras.yaml", help="Camera topology config")
    p.add_argument("--model", default="configs/model.yaml", help="Model config")
    p.add_argument("--no-dashboard", action="store_true", help="Disable the web dashboard")
    p.add_argument(
        "--log-level",
        default="INFO",
        choices=["DEBUG", "INFO", "WARNING", "ERROR"],
        help="Logging verbosity",
    )
    return p.parse_args()


def main() -> None:
    args = _parse_args()
    logging.basicConfig(
        level=getattr(logging, args.log_level),
        format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
        datefmt="%H:%M:%S",
    )
    logger = logging.getLogger("main")

    # --- Load configs --------------------------------------------------
    with open(args.cameras) as f:
        cam_data = yaml.safe_load(f)
    with open(args.model) as f:
        model_data = yaml.safe_load(f)

    config = {
        "cameras": cam_data["cameras"],
        "handoff": cam_data.get("handoff", {}),
        **model_data,
    }

    # --- Build pipeline -----------------------------------------------
    from src.pipeline.orchestrator import Orchestrator
    from src.pipeline.event_bus import TOPIC_TRANSITION, TOPIC_TRACK_UPDATE, TOPIC_FRAME
    from src.pipeline.storage import EventStorage

    orchestrator = Orchestrator(config)
    storage = EventStorage.from_config(model_data.get("storage", {}))

    # --- Optionally start dashboard ------------------------------------
    dashboard = None
    if not args.no_dashboard:
        try:
            from src.dashboard.server import DashboardState, DashboardServer

            state = DashboardState()

            # Wire EventBus → DashboardState
            def _on_frame(ev):
                state.update_frame(ev["camera_id"], ev["frame"])

            def _on_tracks(ev):
                state.update_tracks(ev["camera_id"], ev["tracks"])

            def _on_transition(ev):
                import dataclasses
                d = dataclasses.asdict(ev) if hasattr(ev, "__dataclass_fields__") else vars(ev)
                state.add_transition(d)
                storage.save_transition(ev)

            orchestrator.bus.subscribe(TOPIC_FRAME, _on_frame)
            orchestrator.bus.subscribe(TOPIC_TRACK_UPDATE, _on_tracks)
            orchestrator.bus.subscribe(TOPIC_TRANSITION, _on_transition)

            dashboard = DashboardServer.from_config(model_data.get("dashboard", {}), state)
            dashboard.start()
        except Exception as exc:
            logger.warning("Dashboard could not start: %s", exc)
    else:
        # Still persist transitions even without dashboard
        def _on_transition(ev):
            storage.save_transition(ev)

        orchestrator.bus.subscribe(TOPIC_TRANSITION, _on_transition)

    # --- Start pipeline -----------------------------------------------
    orchestrator.start()

    # --- Graceful shutdown on Ctrl-C / SIGTERM ------------------------
    def _shutdown(sig, frame):
        logger.info("Shutdown requested …")
        orchestrator.stop()
        sys.exit(0)

    signal.signal(signal.SIGINT, _shutdown)
    signal.signal(signal.SIGTERM, _shutdown)

    logger.info("Pipeline running. Press Ctrl-C to stop.")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        pass
    finally:
        orchestrator.stop()
        logger.info("Bye.")


if __name__ == "__main__":
    main()
