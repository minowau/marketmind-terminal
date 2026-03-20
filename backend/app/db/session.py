"""
MarketMind AI v2 — Database Session & Engine
Provides async engine, session factory, and FastAPI dependency.
"""

import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import create_engine
from sqlmodel import SQLModel, Session
from contextlib import contextmanager, asynccontextmanager

from app.config import settings
from app.utils.logging import get_logger

logger = get_logger("db")

def get_masked_url(url: str) -> str:
    """Mask the password in the database URL for logging."""
    try:
        from urllib.parse import urlparse, urlunparse
        parsed = urlparse(url)
        if parsed.password:
            new_netloc = f"{parsed.username}:****@{parsed.hostname}:{parsed.port}"
            return urlunparse(parsed._replace(netloc=new_netloc))
        return url
    except Exception:
        return "invalid-url"

# Log the connection target (masked) for debugging
current_url = settings.DATABASE_URL
masked_url = get_masked_url(current_url)
logger.info("initializing_db_engine", url=masked_url)

if "localhost" in current_url and os.getenv("RENDER") == "true":
    logger.error("database_url_is_localhost_in_render", 
                 hint="Check if DATABASE_URL is correctly set in Render dashboard or render.yaml")
    # Log other related env vars to help debug
    related_vars = {k: "set" if v else "empty" for k, v in os.environ.items() 
                    if any(x in k for x in ["DATABASE", "POSTGRES", "RENDER_URL"])}
    logger.info("related_env_vars", **related_vars)

# ── Async Engine (for FastAPI endpoints) ──
async_engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# ── Sync Engine (for Celery workers / migrations) ──
sync_engine = create_engine(
    settings.DATABASE_URL_SYNC,
    echo=settings.DEBUG,
    pool_size=10,
    max_overflow=5,
    pool_pre_ping=True,
)


async def create_db_tables():
    """Create all tables on startup (dev convenience; use Alembic in prod)."""
    async with async_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)


async def drop_db_tables():
    """Drop all tables (use cautiously)."""
    async with async_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)


# ── FastAPI Dependency (async) ──
async def get_db() -> AsyncSession:
    """Yield an async database session for FastAPI route dependencies."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# ── Sync Context Manager (for Celery tasks) ──
@contextmanager
def get_session():
    """Yield a synchronous session for background workers."""
    session = Session(sync_engine)
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
