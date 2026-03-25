"""
MarketMind AI v2 — Seeding Utility
Populates the database with initial stock data and news signals.
"""

import asyncio
from sqlmodel import select
from app.db.models import Stock
from app.db.session import get_session
from app.core.agents.market_agent import fetch_and_update_stock
from app.core.agents.news_agent import fetch_and_store
from app.utils.logging import get_logger

logger = get_logger("seeding")

TOP_STOCKS = [
    "RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK",
    "TATAMOTORS", "TATASTEEL", "SBIN", "BHARTIARTL", "ITC"
]

async def seed_initial_data():
    """
    Seeds the database with initial stock data and news.
    Only runs if no stocks exist in the database.
    """
    try:
        with get_session() as session:
            # Check if already seeded (by checking for RELIANCE)
            existing = session.exec(select(Stock).where(Stock.symbol == "RELIANCE")).first()
            if existing:
                logger.debug("seeding_skipped_already_populated")
                return

        logger.info("seeding_started")

        # 1. Seed Stocks
        # We do them sequentially or in small batches to be extra safe with yfinance
        logger.info("seeding_stocks", count=len(TOP_STOCKS))
        for symbol in TOP_STOCKS:
            await fetch_and_update_stock(symbol, force=True)
            await asyncio.sleep(1) # Small delay to be polite to YF

        # 2. Seed News
        logger.info("seeding_news_and_signals")
        await fetch_and_store(analyze=True)

        logger.info("seeding_completed")
    except Exception as e:
        logger.error("seeding_failed_unexpectedly", error=str(e))
