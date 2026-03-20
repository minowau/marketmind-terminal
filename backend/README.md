# MarketMind AI v2 — Backend

> Intelligent market analysis platform powered by FastAPI, AI agents, and real-time simulation.

## Quick Start

### Prerequisites
- Python 3.11+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (recommended)

### 1. Environment Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your actual API keys and database credentials
```

### 2. Docker Compose (Recommended)

```bash
docker-compose -f docker/docker-compose.dev.yml up --build
```

This starts: PostgreSQL, Redis, FastAPI backend, Celery worker, and Celery beat.

### 3. Manual Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate   # Linux/Mac
venv\Scripts\activate      # Windows

# Install dependencies
pip install -r requirements.txt

# Start FastAPI
uvicorn app.main:app --reload --port 8000

# Start Celery worker (separate terminal)
celery -A app.workers.celery_app.celery worker --loglevel=info

# Start Celery beat (separate terminal)
celery -A app.workers.celery_app.celery beat --loglevel=info
```

### 4. Database Migrations

```bash
# Apply migrations
alembic upgrade head

# Auto-generate new migration after model changes
alembic revision --autogenerate -m "description"
```

### 5. Access

- **API Docs**: http://localhost:8000/docs
- **OpenAPI JSON**: http://localhost:8000/openapi.json
- **WebSocket**: ws://localhost:8000/ws/simulation

---

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  News Feeds │────▶│  News Agent  │────▶│ Analysis Agent  │
│ (RSS/GNews) │     │  (Fetcher)   │     │ (FinBERT + LLM) │
└─────────────┘     └──────────────┘     └────────┬────────┘
                                                   │
                    ┌──────────────┐     ┌─────────▼────────┐
                    │ Market Agent │────▶│  Signal Fusion   │
                    │ (yfinance)   │     │  (Orchestrator)  │
                    └──────────────┘     └────────┬────────┘
                                                   │
                    ┌──────────────┐     ┌─────────▼────────┐
                    │  Technical   │     │  Investor Sim    │
                    │   Agent      │     │ (30 agents ×6    │
                    └──────────────┘     │  strategies)     │
                                         └────────┬────────┘
                                                   │
                                         ┌─────────▼────────┐
                                         │  Prediction      │
                                         │  Agent           │
                                         └────────┬────────┘
                                                   │
                    ┌──────────────┐     ┌─────────▼────────┐
                    │  Frontend    │◀────│  WebSocket       │
                    │  (React)     │     │  Broadcast       │
                    └──────────────┘     └──────────────────┘
```

## API Endpoints

| Method | Path                           | Description                    |
|--------|--------------------------------|--------------------------------|
| GET    | /api/v1/opportunities          | Top signals for OpportunityRadar |
| GET    | /api/v1/news                   | Latest analyzed news           |
| GET    | /api/v1/stock/{symbol}/overview| Full stock overview            |
| GET    | /api/v1/signals                | Recent signals                 |
| GET    | /api/v1/signals/{id}           | Signal detail                  |
| POST   | /api/v1/admin/trigger-news-fetch| Trigger news ingestion        |
| POST   | /api/v1/admin/run-simulation   | Trigger simulation             |
| GET    | /api/v1/admin/health           | Service health check           |
| WS     | /ws/simulation                 | Real-time simulation events    |

## Tech Stack

- **FastAPI** — async web framework
- **PostgreSQL + SQLModel** — database
- **Redis** — cache, queue broker, pub/sub
- **Celery** — background task processing
- **FinBERT + OpenAI/Anthropic** — AI analysis
- **yfinance** — market data
- **WebSocket** — real-time streaming
