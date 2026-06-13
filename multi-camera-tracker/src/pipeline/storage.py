"""
storage.py — SQLAlchemy-based event persistence.

Stores :class:`~src.pipeline.orchestrator.TransitionEvent` objects in a
relational database (SQLite by default, PostgreSQL-compatible).
"""

from __future__ import annotations

import logging
import time
from typing import List, Optional

logger = logging.getLogger(__name__)

try:
    from sqlalchemy import Column, Float, Integer, String, create_engine, text
    from sqlalchemy.orm import DeclarativeBase, Session
    _SA_AVAILABLE = True
except ImportError:
    _SA_AVAILABLE = False
    logger.warning("sqlalchemy not installed; event persistence disabled.")


if _SA_AVAILABLE:
    class _Base(DeclarativeBase):
        pass

    class TransitionRecord(_Base):
        __tablename__ = "transitions"

        id = Column(Integer, primary_key=True, autoincrement=True)
        global_id = Column(Integer, nullable=False, index=True)
        from_camera = Column(String(64), nullable=False)
        to_camera = Column(String(64), nullable=False)
        from_local_id = Column(Integer)
        to_local_id = Column(Integer)
        similarity = Column(Float)
        timestamp = Column(Float, nullable=False, default=time.time)

    class EventStorage:
        """Persists transition events to a SQL database."""

        def __init__(self, database_url: str = "sqlite:///./data/events.db") -> None:
            self._engine = create_engine(database_url, echo=False)
            _Base.metadata.create_all(self._engine)
            logger.info("Event storage initialised: %s", database_url)

        def save_transition(self, event) -> None:
            """Persist a :class:`TransitionEvent` or dict."""
            with Session(self._engine) as session:
                rec = TransitionRecord(
                    global_id=event.global_id if hasattr(event, "global_id") else event["global_id"],
                    from_camera=event.from_camera if hasattr(event, "from_camera") else event["from_camera"],
                    to_camera=event.to_camera if hasattr(event, "to_camera") else event["to_camera"],
                    from_local_id=getattr(event, "from_local_id", None) or event.get("from_local_id"),
                    to_local_id=getattr(event, "to_local_id", None) or event.get("to_local_id"),
                    similarity=getattr(event, "similarity", None) or event.get("similarity"),
                    timestamp=getattr(event, "timestamp", None) or event.get("timestamp", time.time()),
                )
                session.add(rec)
                session.commit()

        def query_transitions(
            self,
            global_id: Optional[int] = None,
            limit: int = 100,
        ) -> List[dict]:
            with Session(self._engine) as session:
                q = session.query(TransitionRecord)
                if global_id is not None:
                    q = q.filter(TransitionRecord.global_id == global_id)
                q = q.order_by(TransitionRecord.timestamp.desc()).limit(limit)
                return [
                    {
                        "id": r.id,
                        "global_id": r.global_id,
                        "from_camera": r.from_camera,
                        "to_camera": r.to_camera,
                        "similarity": r.similarity,
                        "timestamp": r.timestamp,
                    }
                    for r in q.all()
                ]

        @classmethod
        def from_config(cls, cfg: dict) -> "EventStorage":
            return cls(database_url=cfg.get("database_url", "sqlite:///./data/events.db"))

else:
    class EventStorage:  # type: ignore[no-redef]
        def __init__(self, *args, **kwargs):
            logger.warning("EventStorage unavailable — install sqlalchemy.")

        def save_transition(self, event) -> None:
            pass

        def query_transitions(self, *args, **kwargs) -> list:
            return []

        @classmethod
        def from_config(cls, cfg: dict) -> "EventStorage":
            return cls()
