"""
MarketMind AI v2 — Database Session & Engine
Provides async engine, session factory, and FastAPI dependency.
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import create_engine
from sqlmodel import SQLModel, Session
from contextlib import contextmanager, asynccontextmanager

from app.config import settings

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
