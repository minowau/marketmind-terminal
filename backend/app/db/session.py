"""
MarketMind AI v2 — Database Session & Engine
Provides async engine, session factory, and FastAPI dependency.
Supports PostgreSQL (asyncpg) and SQLite (aiosqlite).
"""

import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import create_engine, event
from sqlmodel import SQLModel, Session
from contextlib import contextmanager

from app.config import settings
from app.utils.logging import get_logger

logger = get_logger(__name__)

_is_sqlite = settings.DATABASE_URL.startswith("sqlite")
_is_postgresql = settings.DATABASE_URL.startswith("postgresql")

# ── Ensure local SQLite data directory exists ──
if _is_sqlite:
    _db_path = settings.DATABASE_URL.split("///", 1)[-1]
    _db_dir = os.path.dirname(os.path.abspath(_db_path))
    logger.info("sqlite_db_setup", path=_db_path, directory=_db_dir)
    try:
        os.makedirs(_db_dir, exist_ok=True)
        # Verify writability
        test_file = os.path.join(_db_dir, ".write_test")
        with open(test_file, "w") as f:
            f.write("test")
        os.remove(test_file)
        logger.info("sqlite_db_dir_ready")
    except Exception as e:
        logger.error("sqlite_db_setup_failed", error=str(e))

# ── Engines ──
_async_url = settings.DATABASE_URL
_sync_url = settings.DATABASE_URL_SYNC

# ── Defensive Sanitization: Revert legacy 'libsql' URLs to SQLite ──
if "libsql" in _async_url:
    _async_url = _async_url.replace("libsql://", "sqlite+aiosqlite:///").replace("sqlite+libsql://", "sqlite+aiosqlite:///")
if "libsql" in _sync_url:
    _sync_url = _sync_url.replace("libsql://", "sqlite:///").replace("sqlite+libsql://", "sqlite:///")

_async_kwargs = {"echo": settings.DEBUG}
if _is_postgresql:
    _async_kwargs.update(pool_size=20, max_overflow=10, pool_pre_ping=True)
else:
    _async_kwargs["connect_args"] = {"check_same_thread": False}

async_engine = create_async_engine(_async_url, **_async_kwargs)

# ── Sync Engine (for background workers) ──
_sync_kwargs = {"echo": settings.DEBUG}
if not _is_postgresql:
    _sync_kwargs["connect_args"] = {"check_same_thread": False}

sync_engine = create_engine(_sync_url, **_sync_kwargs)

# Enable WAL mode for SQLite
if _is_sqlite:
    @event.listens_for(sync_engine, "connect")
    def _set_sqlite_pragma(dbapi_conn, connection_record):
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

AsyncSessionLocal = async_sessionmaker(
    bind=async_engine, class_=AsyncSession, expire_on_commit=False
)


async def create_db_tables():
    """Create all tables on startup."""
    try:
        async with async_engine.begin() as conn:
            await conn.run_sync(SQLModel.metadata.create_all)
        logger.info("database_tables_created")
    except Exception as e:
        if "already exists" in str(e).lower():
            logger.debug("database_tables_already_exist")
        else:
            logger.error("database_table_creation_failed", error=str(e))


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
