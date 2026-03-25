"""
MarketMind AI v2 — Application Configuration
Loads environment variables via pydantic-settings.
"""

from pydantic_settings import BaseSettings
from typing import List, Optional


class Settings(BaseSettings):
    """Central configuration loaded from environment / .env file."""

    # ── Application ──
    APP_NAME: str = "The Council"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = False

    # ── Database ──
    DATABASE_URL: str = "sqlite+aiosqlite:////data/marketmind.db"
    DATABASE_URL_SYNC: str = "sqlite:////data/marketmind.db"
    TURSO_AUTH_TOKEN: Optional[str] = None

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
    CORS_ORIGINS: str = "*"

    # ── Mail ──
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = "jupalliprabhas@gmail.com"
    SMTP_PASSWORD: Optional[str] = None  # Should be set in .env as App Password
    RESEND_API_KEY: Optional[str] = None

    # ── Celery ──
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse comma-separated CORS origins into a list."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# Singleton instance — import this everywhere
settings = Settings()
