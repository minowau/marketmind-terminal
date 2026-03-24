"""
MarketMind AI v2 — FastAPI Application Entry Point
Registers all routers, middleware, and lifecycle events.
"""

import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.utils.logging import setup_logging, get_logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle."""
    # ── Startup ──
    setup_logging("DEBUG" if settings.DEBUG else "INFO")
    logger = get_logger("main")
    logger.info("application_starting", version=settings.APP_VERSION)

    # Create database tables
    from app.db.session import create_db_tables
    await create_db_tables()
    logger.info("database_tables_created")

    # Start Redis pub/sub listener for WebSocket broadcasting
    from app.ws.router import redis_listener
    redis_task = asyncio.create_task(redis_listener())
    logger.info("redis_pubsub_listener_launched")

    logger.info("application_started", app=settings.APP_NAME)

    yield

    # ── Shutdown ──
    logger.info("application_shutting_down")
    redis_task.cancel()
    try:
        await redis_task
    except asyncio.CancelledError:
        pass
    logger.info("application_stopped")


# ── Create FastAPI App ──
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "MarketMind AI v2 — Intelligent market analysis platform. "
        "Combines news sentiment analysis, technical indicators, "
        "investor simulation, and AI-driven predictions."
    ),
    lifespan=lifespan,
)

# ── CORS Middleware ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register API Routers ──
from app.api.v1 import opportunities, news, stock, signals, admin, wishlist, waitlist, auth
from app.ws.router import websocket_router

app.include_router(opportunities.router, prefix="/api/v1/opportunities")
app.include_router(news.router, prefix="/api/v1/news")
app.include_router(stock.router, prefix="/api/v1/stock")
app.include_router(signals.router, prefix="/api/v1/signals")
app.include_router(wishlist.router, prefix="/api/v1/wishlist")
app.include_router(waitlist.router, prefix="/api/v1/waitlist")
app.include_router(auth.router, prefix="/api/v1/auth")
app.include_router(admin.router, prefix="/api/v1/admin")
app.include_router(websocket_router, prefix="/ws")


# ── Root Endpoint ──
@app.get("/api/v1", tags=["Root"])
async def api_root():
    """API root endpoint — basic info."""
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "openapi": "/openapi.json",
    }


# ── Static File Serving (Frontend) ──
import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Use absolute path relative to this file for Docker compatibility (even with --chdir)
dist_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "dist"))

if os.path.exists(dist_path):
    # Mount the assets directory
    app.mount("/assets", StaticFiles(directory=os.path.join(dist_path, "assets")), name="assets")

    # Catch-all route to serve index.html for React Router
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Allow API routes to pass through (though they are matched first)
        if full_path.startswith("api/") or full_path.startswith("ws/"):
            return None
        
        # Check if requested file exists in dist (e.g. favicon.ico)
        file_path = os.path.join(dist_path, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
            
        # Default to index.html for SPA routing
        return FileResponse(os.path.join(dist_path, "index.html"))
else:
    @app.get("/")
    async def root():
        return {"message": "MarketMind AI API is running. Frontend not found in /dist"}
