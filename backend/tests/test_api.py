import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["app"] == "MarketMind AI"

def test_health():
    # Health endpoint tries to hit DB/Redis/Celery.
    # Without them running, it should return 'degraded' but still 200.
    response = client.get("/api/v1/admin/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    # It might be degraded if services aren't running
    assert data["status"] in ["healthy", "degraded"]
