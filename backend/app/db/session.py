"""
MarketMind AI v2 — Database Session & Engine
Provides async engine, session factory, and FastAPI dependency.
Supports both PostgreSQL (asyncpg) and SQLite (aiosqlite).
"""

import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import create_engine, event
from sqlmodel import SQLModel, Session
from contextlib import contextmanager

from app.config import settings

_is_sqlite = settings.DATABASE_URL.startswith("sqlite")

# ── Ensure SQLite data directory exists ──
if _is_sqlite:
    # Extract path from sqlite+aiosqlite:///./data/marketmind.db
    _db_path = settings.DATABASE_URL.split("///", 1)[-1]
    _db_dir = os.path.dirname(os.path.abspath(_db_path))
    os.makedirs(_db_dir, exist_ok=True)

# ── Async Engine (for FastAPI endpoints) ──
_async_kwargs = {"echo": settings.DEBUG}
if not _is_sqlite:
    _async_kwargs.update(pool_size=20, max_overflow=10, pool_pre_ping=True)
else:
    # SQLite needs connect_args for async
    _async_kwargs["connect_args"] = {"check_same_thread": False}

async_engine = create_async_engine(settings.DATABASE_URL, **_async_kwargs)

AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# ── Sync Engine (for Celery workers / migrations) ──
_sync_kwargs = {"echo": settings.DEBUG}
if not _is_sqlite:
    _sync_kwargs.update(pool_size=10, max_overflow=5, pool_pre_ping=True)
else:
    _sync_kwargs["connect_args"] = {"check_same_thread": False}

sync_engine = create_engine(settings.DATABASE_URL_SYNC, **_sync_kwargs)

# Enable WAL mode and foreign keys for SQLite
if _is_sqlite:
    @event.listens_for(sync_engine, "connect")
    def _set_sqlite_pragma(dbapi_conn, connection_record):
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


async def create_db_tables():
    """Create all tables on startup (dev convenience; use Alembic in prod)."""
    try:
        async with async_engine.begin() as conn:
            await conn.run_sync(SQLModel.metadata.create_all)
    except Exception:
        # Ignore 'table already exists' errors from concurrent workers
        pass


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
