"""
event_bus.py — Lightweight synchronous pub/sub event bus.

Components publish events (dicts or dataclass instances) to named topics,
and any number of subscriber callbacks receive them.  The bus is
thread-safe for concurrent publishers and is used to decouple the
pipeline modules from the dashboard and storage layers.
"""

from __future__ import annotations

import logging
import threading
from collections import defaultdict
from typing import Any, Callable, Dict, List

logger = logging.getLogger(__name__)

Callback = Callable[[Any], None]


class EventBus:
    """
    Thread-safe synchronous pub/sub event bus.

    Usage
    -----
    ::

        bus = EventBus()

        def on_transition(event):
            print(event)

        bus.subscribe("transition", on_transition)
        bus.publish("transition", {"global_id": 1, "from": "cam_01", "to": "cam_02"})
    """

    def __init__(self) -> None:
        self._subscribers: Dict[str, List[Callback]] = defaultdict(list)
        self._lock = threading.Lock()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def subscribe(self, topic: str, callback: Callback) -> None:
        """Register *callback* to receive events on *topic*."""
        with self._lock:
            self._subscribers[topic].append(callback)
        logger.debug("Subscribed to topic '%s': %s", topic, callback)

    def unsubscribe(self, topic: str, callback: Callback) -> None:
        """Remove a previously registered callback."""
        with self._lock:
            try:
                self._subscribers[topic].remove(callback)
            except ValueError:
                pass

    def publish(self, topic: str, event: Any) -> None:
        """
        Deliver *event* to all subscribers of *topic*.

        Callbacks are invoked synchronously in the calling thread.
        Exceptions raised by individual callbacks are caught and logged
        so that one bad subscriber cannot break the entire pipeline.
        """
        with self._lock:
            callbacks = list(self._subscribers[topic])

        for cb in callbacks:
            try:
                cb(event)
            except Exception:
                logger.exception(
                    "Error in subscriber %s for topic '%s'", cb, topic
                )


# Well-known topic names
TOPIC_TRANSITION = "transition"   # cross-camera handoff event
TOPIC_TRACK_UPDATE = "track_update"  # per-camera track list update
TOPIC_FRAME = "frame"             # annotated frame ready for dashboard
