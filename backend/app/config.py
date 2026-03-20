"""
MarketMind AI v2 — Application Configuration
Loads environment variables via pydantic-settings.
"""

import os
from pydantic import field_validator, ValidationInfo
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional


class Settings(BaseSettings):
    """Central configuration loaded from environment / .env file."""

    # ── Application ──
    APP_NAME: str = "MarketMind AI"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = False

    # ── Database ──
    DATABASE_URL: str = "postgresql+asyncpg://mmuser:mmsecret@localhost:5432/marketmind"
    DATABASE_URL_SYNC: str = "postgresql://mmuser:mmsecret@localhost:5432/marketmind"

    # ── Redis ──
    REDIS_URL: str = "redis://localhost:6379/0"

    # ── LLM / AI ──
    LLM_PROVIDER: str = "openai"  # openai | anthropic | local
    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    LOCAL_LLM_URL: str = "http://localhost:11434/v1"

    # ── Embeddings ──
    EMBEDDING_PROVIDER: str = "openai"  # openai | local
    EMBEDDING_MODEL: str = "text-embedding-3-small"

    # ── Vector DB ──
    VECTOR_DB_URL: Optional[str] = "http://localhost:8080"

    # ── News APIs ──
    GNEWS_API_KEY: Optional[str] = None
    ET_RSS_URL: str = "https://economictimes.indiatimes.com/rssfeedstopstories.cms"

    # ── Security ──
    API_KEY_ADMIN: str = "changeme-admin-key-12345"
    SECRET_KEY: str = "changeme-secret-key-67890"
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # ── Mail ──
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 465
    SMTP_USER: str = "jupalliprabhas@gmail.com"
    SMTP_PASSWORD: Optional[str] = None  # Should be set in .env as App Password

    # ── Celery ──
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_url(cls, v: Optional[str]) -> Optional[str]:
        """Ensure the DATABASE_URL uses the asyncpg driver and handle Render env vars."""
        # Prefer environment variable if it exists, even if Pydantic should do it.
        env_val = os.getenv("DATABASE_URL")
        target = env_val if env_val else v
        
        if not target:
            return target
            
        if target.startswith("postgres://"):
            target = target.replace("postgres://", "postgresql+asyncpg://", 1)
        elif target.startswith("postgresql://") and "+asyncpg" not in target:
            target = target.replace("postgresql://", "postgresql+asyncpg://", 1)
        
        return target

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
        env_prefix="",
    )


# Singleton instance — import this everywhere
settings = Settings()
