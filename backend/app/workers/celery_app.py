"""
MarketMind AI v2 — Celery Application
Configured with Redis broker, result backend, and periodic beat schedule.
"""

from celery import Celery
from celery.schedules import crontab

from app.config import settings

# Create Celery app
celery = Celery(
    "marketmind",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

# Celery configuration
celery.conf.update(
    # Serialization
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",

    # Timezone
    timezone="Asia/Kolkata",
    enable_utc=True,

    # Task settings
    task_track_started=True,
    task_time_limit=600,  # 10 minute hard limit
    task_soft_time_limit=300,  # 5 minute soft limit
    task_acks_late=True,
    worker_prefetch_multiplier=1,

    # Result expiry
    result_expires=3600,  # 1 hour

    # Retry
    task_default_retry_delay=30,
    task_max_retries=3,

    # Task routes
    task_routes={
        "app.workers.tasks.fetch_and_store_news": {"queue": "news"},
        "app.workers.tasks.analyze_news_task": {"queue": "analysis"},
        "app.workers.tasks.check_market_signal": {"queue": "analysis"},
        "app.workers.tasks.run_investor_simulation": {"queue": "simulation"},
        "app.workers.tasks.compute_prediction_task": {"queue": "prediction"},
    },
)

# Periodic tasks (Celery Beat schedule)
celery.conf.beat_schedule = {
    # Fetch news every 15 minutes during market hours (9 AM - 4 PM IST, Mon-Fri)
    "fetch-news-every-15-min": {
        "task": "app.workers.tasks.fetch_and_store_news",
        "schedule": crontab(minute="*/15", hour="9-16", day_of_week="mon-fri"),
        "options": {"queue": "news"},
    },
    # Fetch news every hour outside market hours (less frequent)
    "fetch-news-hourly-off-hours": {
        "task": "app.workers.tasks.fetch_and_store_news",
        "schedule": crontab(minute=0, hour="0-8,17-23"),
        "options": {"queue": "news"},
    },
}

# Auto-discover tasks from workers module
celery.autodiscover_tasks(["app.workers"])
