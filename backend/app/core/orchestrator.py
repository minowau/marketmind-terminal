"""
MarketMind AI v2 — Orchestrator
Central DAG runner that chains the full pipeline:
  News Ingestion → Analysis → Market Check → Signal Fusion → Simulation → Prediction

Supports both Celery chain execution and direct synchronous/async execution.
Includes audit trail logging for every step.
"""

import json
from typing import Dict, Any, Optional, List
from datetime import datetime

from app.db.models import News, NewsAnalysis, Signal
from app.db.session import get_session
from app.utils.logging import get_logger

logger = get_logger(__name__)


class PipelineAuditLog:
    """Simple audit trail for pipeline runs."""

    def __init__(self, run_id: str):
        self.run_id = run_id
        self.steps: List[Dict[str, Any]] = []
        self.started_at = datetime.utcnow()
        self.completed_at: Optional[datetime] = None
        self.status = "running"

    def log_step(self, step_name: str, status: str, details: Optional[Dict] = None):
        entry = {
            "step": step_name,
            "status": status,
            "timestamp": datetime.utcnow().isoformat(),
            "details": details or {},
        }
        self.steps.append(entry)
        logger.info(
            "pipeline_step",
            run_id=self.run_id,
            step=step_name,
            status=status,
        )

    def complete(self, status: str = "success"):
        self.completed_at = datetime.utcnow()
        self.status = status

    def to_dict(self) -> Dict[str, Any]:
        return {
            "run_id": self.run_id,
            "started_at": self.started_at.isoformat(),
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "status": self.status,
            "steps": self.steps,
        }


def create_signal_from_analysis(
    news_analysis_id: int,
    symbol: str,
    impact_score: float,
    sentiment: str,
    technical_signal: str = "neutral",
    trigger: str = "",
) -> Signal:
    """
    Fuse news analysis + technical signals into a Signal record.
    Signal score is a weighted combination of impact, sentiment, and technicals.
    """
    # Sentiment multiplier
    sentiment_multiplier = {
        "positive": 1.0,
        "negative": -1.0,
        "neutral": 0.0,
    }.get(sentiment, 0.0)

    # Technical multiplier
    tech_multiplier = {
        "bullish": 1.2,
        "bearish": -1.2,
        "neutral": 0.0,
    }.get(technical_signal, 0.0)

    # Fused signal score (range roughly -10 to +10)
    signal_score = (impact_score * sentiment_multiplier * 0.6) + (impact_score * tech_multiplier * 0.4)
    signal_score = round(max(min(signal_score, 10.0), -10.0), 2)

    # Confidence based on alignment of sentiment and technicals
    if (sentiment_multiplier > 0 and tech_multiplier > 0) or \
       (sentiment_multiplier < 0 and tech_multiplier < 0):
        confidence = min(0.9, 0.5 + impact_score * 0.05)
    elif sentiment_multiplier == 0 or tech_multiplier == 0:
        confidence = 0.4 + impact_score * 0.03
    else:
        confidence = max(0.1, 0.3 - impact_score * 0.02)  # Conflicting signals

    confidence = round(confidence, 2)

    reason = f"Sentiment: {sentiment}, Technical: {technical_signal}, Impact: {impact_score:.1f}"

    with get_session() as session:
        signal = Signal(
            symbol=symbol,
            signal_score=signal_score,
            reason=reason,
            trigger=trigger,
            confidence=confidence,
            news_analysis_id=news_analysis_id,
        )
        session.add(signal)
        session.commit()
        session.refresh(signal)
        session.expunge(signal) # Allow object to be used after session close

    logger.info(
        "signal_created",
        signal_id=signal.id,
        symbol=symbol,
        score=signal_score,
        confidence=confidence,
    )

    return signal


def trigger_celery_pipeline(news_id: int) -> str:
    """
    Kick off the full pipeline as a Celery chain.
    Returns the chain task ID.
    """
    from app.workers.tasks import (
        analyze_news_task,
        check_market_signal,
        run_investor_simulation,
        compute_prediction_task,
    )
    from celery import chain

    pipeline = chain(
        analyze_news_task.s(news_id),
        check_market_signal.s(),
        run_investor_simulation.s(),
        compute_prediction_task.s(),
    )

    result = pipeline.apply_async()
    logger.info("celery_pipeline_triggered", news_id=news_id, task_id=result.id)
    return result.id


def trigger_simulation_pipeline(signal_id: int) -> str:
    """
    Kick off simulation + prediction as a Celery chain (skip news/analysis).
    """
    from app.workers.tasks import run_investor_simulation, compute_prediction_task
    from celery import chain

    pipeline = chain(
        run_investor_simulation.s(signal_id),
        compute_prediction_task.s(),
    )

    result = pipeline.apply_async()
    logger.info("simulation_pipeline_triggered", signal_id=signal_id, task_id=result.id)
    return result.id
