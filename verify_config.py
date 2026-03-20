import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

# Mock environment variables
os.environ["DATABASE_URL"] = "postgres://user:pass@host:5432/db"
os.environ["DATABASE_URL_SYNC"] = "postgres://user:pass@host:5432/db"

from app.config import Settings

def test_settings():
    settings = Settings()
    print(f"Async URL: {settings.DATABASE_URL}")
    print(f"Sync URL:  {settings.DATABASE_URL_SYNC}")
    
    assert settings.DATABASE_URL == "postgresql+asyncpg://user:pass@host:5432/db"
    assert settings.DATABASE_URL_SYNC == "postgresql://user:pass@host:5432/db"
    print("Verification Successful!")

if __name__ == "__main__":
    try:
        test_settings()
    except Exception as e:
        print(f"Verification Failed: {e}")
        sys.exit(1)
