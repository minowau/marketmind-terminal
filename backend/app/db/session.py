"""
MarketMind AI v2 — Database Session & Engine
Provides async engine, session factory, and FastAPI dependency.
Supports both PostgreSQL (asyncpg) and SQLite (aiosqlite).
"""

import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import create_engine, event
from sqlalchemy.dialects.sqlite.base import SQLiteDialect
from sqlmodel import SQLModel, Session
from contextlib import contextmanager

from app.config import settings
from app.utils.logging import get_logger

logger = get_logger(__name__)

# ── Turso/LibSQL Fix: Prevent unsupported PRAGMA calls ──
if settings.DATABASE_URL.startswith("libsql"):
    _original_get_isolation_level = SQLiteDialect.get_isolation_level
    def _patched_get_isolation_level(self, dbapi_conn):
        return "SERIALIZABLE" # Fixed value to avoid PRAGMA call
    SQLiteDialect.get_isolation_level = _patched_get_isolation_level
    logger.info("turso_isolation_level_patched")

_is_sqlite = settings.DATABASE_URL.startswith("sqlite")
_is_libsql = settings.DATABASE_URL.startswith("libsql")

def get_engine_url(base_url: str):
    """Constructs the appropriate engine URL for Turso/libsql."""
    if base_url.startswith("libsql://"):
        # Transform libsql:// to sqlite+libsql://
        new_url = base_url.replace("libsql://", "sqlite+libsql://")
        if settings.TURSO_AUTH_TOKEN:
            connector = "&" if "?" in new_url else "?"
            return f"{new_url}{connector}authToken={settings.TURSO_AUTH_TOKEN}"
        return new_url
    return base_url

# ── Ensure local SQLite data directory exists ──
if _is_sqlite:
    _db_path = settings.DATABASE_URL.split("///", 1)[-1]
    _db_dir = os.path.dirname(os.path.abspath(_db_path))
    os.makedirs(_db_dir, exist_ok=True)

# ── Engines ──
async_url = get_engine_url(settings.DATABASE_URL)
sync_url = get_engine_url(settings.DATABASE_URL_SYNC)

if _is_libsql:
    # Use sync engine for libsql as sqlalchemy-libsql is sync
    # Set isolation_level="AUTOCOMMIT" to avoid PRAGMA calls that fail over HTTP (405)
    _libsql_kwargs = {
        "echo": settings.DEBUG,
        "isolation_level": "AUTOCOMMIT",
        "connect_args": {"check_same_thread": False}
    }
    async_engine = create_engine(async_url, **_libsql_kwargs)
    sync_engine = async_engine
else:
    _async_kwargs = {"echo": settings.DEBUG}
    if not _is_sqlite:
        _async_kwargs.update(pool_size=20, max_overflow=10, pool_pre_ping=True)
    else:
        _async_kwargs["connect_args"] = {"check_same_thread": False}
    
    async_engine = create_async_engine(async_url, **_async_kwargs)
    sync_engine = create_engine(sync_url, echo=settings.DEBUG)

# ── Session Factories ──
if _is_libsql:
    from sqlalchemy.orm import sessionmaker
    AsyncSessionLocal = sessionmaker(bind=async_engine, class_=Session, expire_on_commit=False)
else:
    AsyncSessionLocal = async_sessionmaker(bind=async_engine, class_=AsyncSession, expire_on_commit=False)


async def create_db_tables():
    """Create all tables on startup."""
    try:
        if _is_libsql:
            SQLModel.metadata.create_all(async_engine)
        else:
            async with async_engine.begin() as conn:
                await conn.run_sync(SQLModel.metadata.create_all)
        logger.info("database_tables_prepared", url=async_url.split("?")[0])
    except Exception as e:
        if "already exists" in str(e).lower():
            pass
        else:
            logger.error("database_table_creation_failed", error=str(e))


async def get_db():
    """Yield a database session for FastAPI."""
    if _is_libsql:
        with AsyncSessionLocal() as session:
            try:
                yield session
                session.commit()
            except Exception:
                session.rollback()
                raise
            finally:
                session.close()
    else:
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
    if _is_libsql:
        session = Session(sync_engine)
    else:
        # For standard sync engine, use same logic
        session = Session(sync_engine)
        
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
