"""
MarketMind AI v2 — Admin API (Protected)
Admin endpoints for triggering jobs and health checks.
All endpoints require API_KEY_ADMIN authentication.
"""

from fastapi import APIRouter, Depends, HTTPException, Header
from typing import Optional
from datetime import datetime

from app.config import settings
from app.utils.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(tags=["Admin"])


# ── Authentication Dependency ──

async def verify_admin_key(x_api_key: str = Header(..., alias="X-API-Key")):
    """Verify admin API key from request header."""
    if x_api_key != settings.API_KEY_ADMIN:
        raise HTTPException(status_code=403, detail="Invalid admin API key")
    return x_api_key


# ── Endpoints ──

@router.post("/trigger-news-fetch")
async def trigger_news_fetch(api_key: str = Depends(verify_admin_key)):
    """
    Manually trigger a news fetch + analysis pipeline.
    Queues the fetch task via Celery.
    """
    try:
        from app.workers.tasks import fetch_and_store_news
        task = fetch_and_store_news.delay()

        logger.info("admin_trigger_news_fetch", task_id=task.id)
        return {
            "status": "queued",
            "task_id": task.id,
            "message": "News fetch task queued successfully",
        }
    except Exception as e:
        logger.error("admin_trigger_news_fetch_failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/run-simulation")
async def run_simulation(
    signal_id: int,
    api_key: str = Depends(verify_admin_key),
):
    """
    Manually trigger investor simulation for a specific signal.
    Runs simulation + prediction pipeline.
    """
    try:
        from app.core.orchestrator import trigger_simulation_pipeline
        task_id = trigger_simulation_pipeline(signal_id)

        logger.info("admin_run_simulation", signal_id=signal_id, task_id=task_id)
        return {
            "status": "queued",
            "task_id": task_id,
            "signal_id": signal_id,
            "message": "Simulation pipeline queued successfully",
        }
    except Exception as e:
        logger.error("admin_run_simulation_failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    """
    Service health check.
    Verifies database and Redis connectivity.
    """
    health = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {},
    }

    # Check database
    try:
        from app.db.session import async_engine
        from sqlalchemy import text

        async with async_engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        health["services"]["database"] = {"status": "connected"}
    except Exception as e:
        health["services"]["database"] = {"status": "error", "detail": str(e)}
        health["status"] = "degraded"

    # Check Redis
    try:
        import redis as redis_lib
        r = redis_lib.Redis.from_url(settings.REDIS_URL)
        r.ping()
        health["services"]["redis"] = {"status": "connected"}
    except Exception as e:
        health["services"]["redis"] = {"status": "error", "detail": str(e)}
        health["status"] = "degraded"

    # Check Celery
    try:
        from app.workers.celery_app import celery
        inspector = celery.control.inspect()
        active_workers = inspector.active_queues()
        worker_count = len(active_workers) if active_workers else 0
        health["services"]["celery"] = {
            "status": "connected" if worker_count > 0 else "no_workers",
            "active_workers": worker_count,
        }
    except Exception as e:
        health["services"]["celery"] = {"status": "error", "detail": str(e)}

    return health
