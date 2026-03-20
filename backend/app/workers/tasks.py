"""
MarketMind AI v2 — Celery Background Tasks
All async/background processing tasks for the pipeline.
"""

import json
import asyncio
from typing import Optional, Dict, Any

from .celery_app import celery
from app.utils.logging import get_logger

logger = get_logger(__name__)


def _run_async(coro):
    """Helper to run async code from sync Celery tasks."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as pool:
                return pool.submit(asyncio.run, coro).result()
        return loop.run_until_complete(coro)
    except RuntimeError:
        return asyncio.run(coro)


@celery.task(name="app.workers.tasks.fetch_and_store_news", bind=True, max_retries=3)
def fetch_and_store_news(self):
    """
    Periodic task: Fetch news from all sources and store in DB.
    Triggers analysis for each new article.
    """
    logger.info("task_fetch_news_started")

    try:
        from app.core.agents.news_agent import fetch_and_store
        new_ids = _run_async(fetch_and_store())

        # Trigger analysis for each new article
        for news_id in new_ids:
            analyze_news_task.delay(news_id)

        logger.info("task_fetch_news_completed", new_articles=len(new_ids))
        return {"new_articles": len(new_ids), "news_ids": new_ids}

    except Exception as exc:
        logger.error("task_fetch_news_failed", error=str(exc))
        self.retry(exc=exc, countdown=60)


@celery.task(name="app.workers.tasks.analyze_news_task", bind=True, max_retries=3)
def analyze_news_task(self, news_id: int):
    """
    Analyze a news article: run FinBERT + LLM extraction.
    Creates a NewsAnalysis record. Returns news_analysis_id.
    """
    logger.info("task_analyze_news_started", news_id=news_id)

    try:
        from app.core.agents.news_analysis_agent import analyze_text
        from app.db.models import News, NewsAnalysis
        from app.db.session import get_session

        with get_session() as session:
            news = session.get(News, news_id)
            if not news:
                logger.warning("task_analyze_news_not_found", news_id=news_id)
                return None

            text = f"{news.title}\n{news.summary}"

        # Run analysis (async)
        result = _run_async(analyze_text(text))

        # Store analysis
        with get_session() as session:
            analysis = NewsAnalysis(
                news_id=news_id,
                sentiment=result["sentiment"],
                impact_score=result["impact"],
                entities=json.dumps(result["entities"]),
                analysis_text=result["explanation"],
            )
            session.add(analysis)
            session.commit()
            session.refresh(analysis)

            logger.info(
                "task_analyze_news_completed",
                news_id=news_id,
                analysis_id=analysis.id,
                sentiment=result["sentiment"],
            )
            return analysis.id

    except Exception as exc:
        logger.error("task_analyze_news_failed", news_id=news_id, error=str(exc))
        self.retry(exc=exc, countdown=30)


@celery.task(name="app.workers.tasks.check_market_signal", bind=True, max_retries=3)
def check_market_signal(self, news_analysis_id: int):
    """
    Check market conditions and create/update signal for affected symbols.
    Combines news analysis with technical indicators.
    Returns signal_id.
    """
    logger.info("task_check_signal_started", analysis_id=news_analysis_id)

    try:
        from app.db.models import NewsAnalysis
        from app.db.session import get_session
        from app.core.orchestrator import create_signal_from_analysis
        from app.core.agents.market_agent import fetch_and_update_stock
        from app.core.agents.technical_agent import compute_indicators_for_symbol

        # Get analysis
        with get_session() as session:
            analysis = session.get(NewsAnalysis, news_analysis_id)
            if not analysis:
                logger.warning("analysis_not_found", id=news_analysis_id)
                return None

            entities = json.loads(analysis.entities) if analysis.entities else []
            sentiment = analysis.sentiment
            impact_score = analysis.impact_score

            # Get related news for trigger text
            news = session.get(News, analysis.news_id) if analysis.news_id else None
            trigger = news.title[:100] if news else ""

        # If we have identified symbols, process each
        # For now, use entities as potential symbols
        symbols = [e.upper() for e in entities[:3]]  # Top 3 entities

        if not symbols:
            symbols = ["NIFTY"]  # Default to market index

        signal_id = None
        for symbol in symbols:
            # Update stock data
            _run_async(fetch_and_update_stock(symbol))

            # Get technical signal
            tech_result = _run_async(compute_indicators_for_symbol(symbol))
            tech_signal = tech_result.get("overall_signal", "neutral")

            # Create fused signal
            signal = create_signal_from_analysis(
                news_analysis_id=news_analysis_id,
                symbol=symbol,
                impact_score=impact_score,
                sentiment=sentiment,
                technical_signal=tech_signal,
                trigger=trigger,
            )
            signal_id = signal.id  # Return last signal ID

        logger.info("task_check_signal_completed", signal_id=signal_id)
        return signal_id

    except Exception as exc:
        logger.error("task_check_signal_failed", error=str(exc))
        self.retry(exc=exc, countdown=30)


# Need to import News model for the check_market_signal task
from app.db.models import News


@celery.task(name="app.workers.tasks.run_investor_simulation", bind=True, max_retries=2)
def run_investor_simulation(self, signal_id: int):
    """
    Run investor simulation for a signal.
    Spawns agent actors, records actions, publishes events.
    Returns signal_id (pass-through for chaining).
    """
    logger.info("task_simulation_started", signal_id=signal_id)

    try:
        from app.db.models import Signal
        from app.db.session import get_session
        from app.core.agents.investor_sim_agent import run_simulation, publish_events_to_redis

        with get_session() as session:
            signal = session.get(Signal, signal_id)
            if not signal:
                logger.warning("signal_not_found", signal_id=signal_id)
                return signal_id

            symbol = signal.symbol
            score = signal.signal_score
            confidence = signal.confidence

        # Run simulation
        events = run_simulation(
            symbol=symbol,
            signal_score=score,
            confidence=confidence,
            signal_id=signal_id,
        )

        # Publish events to Redis for WebSocket broadcast
        publish_events_to_redis(events)

        logger.info("task_simulation_completed", signal_id=signal_id, events=len(events))
        return signal_id

    except Exception as exc:
        logger.error("task_simulation_failed", signal_id=signal_id, error=str(exc))
        self.retry(exc=exc, countdown=30)


@celery.task(name="app.workers.tasks.compute_prediction_task", bind=True, max_retries=2)
def compute_prediction_task(self, signal_id: int):
    """
    Compute prediction from aggregated agent actions.
    Final step in the pipeline.
    """
    logger.info("task_prediction_started", signal_id=signal_id)

    try:
        from app.db.models import Signal
        from app.db.session import get_session
        from app.core.agents.prediction_agent import compute_prediction

        with get_session() as session:
            signal = session.get(Signal, signal_id)
            if not signal:
                logger.warning("signal_not_found_for_prediction", signal_id=signal_id)
                return None

            symbol = signal.symbol
            score = signal.signal_score

        prediction = compute_prediction(
            symbol=symbol,
            signal_id=signal_id,
            signal_score=score,
        )

        # Publish prediction event to Redis
        try:
            import redis
            from app.config import settings

            r = redis.Redis.from_url(settings.REDIS_URL)
            event = {
                "type": "prediction",
                "symbol": symbol,
                "buy_probability": prediction.buy_probability,
                "expected_min_pct": prediction.expected_min_pct,
                "expected_max_pct": prediction.expected_max_pct,
                "confidence": prediction.confidence,
                "rationale": prediction.rationale,
            }
            r.publish("sim:events", json.dumps(event))
        except Exception:
            pass  # Non-critical

        logger.info(
            "task_prediction_completed",
            prediction_id=prediction.id,
            symbol=symbol,
            buy_prob=prediction.buy_probability,
        )
        return prediction.id

    except Exception as exc:
        logger.error("task_prediction_failed", signal_id=signal_id, error=str(exc))
        self.retry(exc=exc, countdown=30)
