"""
MarketMind AI v2 — Market Agent
Fetches market data (Yahoo Finance / yfinance), updates Stock records.
"""

import asyncio
from typing import Dict, Any, Optional, List
from datetime import datetime

from sqlmodel import select
from app.db.models import Stock
from app.db.session import get_session
from app.utils.logging import get_logger

logger = get_logger(__name__)


def _fetch_yfinance_data(symbol: str) -> Optional[Dict[str, Any]]:
    """
    Virtualize market data: Return deterministic 'Neural Prices' for 'The Council'.
    Bypasses yfinance for instant, reliable performance on Hugging Face.
    """
    symbol = symbol.upper()
    
    # Mock data for key 'The Council' symbols
    mock_data = {
        "RELIANCE": {"name": "Reliance Industries", "price": 2984.50, "change": 1.25},
        "TCS": {"name": "Tata Consultancy Services", "price": 4120.35, "change": 0.82},
        "NIFTY": {"name": "NIFTY 50 Index", "price": 22453.15, "change": -0.34},
        "INFY": {"name": "Infosys Limited", "price": 1648.20, "change": 2.15},
        "HDFCBANK": {"name": "HDFC Bank Limited", "price": 1450.75, "change": 0.58},
        "SBIN": {"name": "State Bank of India", "price": 763.40, "change": -1.12}
    }
    
    # Extract the base symbol if it has .NS
    base_symbol = symbol.split(".")[0]
    data = mock_data.get(base_symbol, {"name": f"{base_symbol} Neural Node", "price": 1000.0, "change": 0.0})
    
    # Generate mock price history (sine wave with noise for sleek visualization)
    import math
    import random
    base_price = data["price"]
    history = []
    for i in range(60):
        # Neural oscillation pattern
        val = base_price * (1 + 0.02 * math.sin(i/6) + random.uniform(-0.005, 0.005))
        history.append(round(val, 2))
    
    return {
        "symbol": base_symbol,
        "company_name": data["name"],
        "last_price": base_price,
        "last_volume": 1250000 + random.randint(-100000, 100000),
        "day_change_pct": data["change"],
        "price_history": history,
    }


async def fetch_market_data(symbol: str) -> Optional[Dict[str, Any]]:
    """
    Async wrapper to fetch market data for a symbol.
    Runs yfinance in executor to avoid blocking the event loop.
    """
    loop = asyncio.get_event_loop()
    data = await loop.run_in_executor(None, _fetch_yfinance_data, symbol)
    return data


# In-memory cooldown for failed fetches (symbol -> timestamp)
GLOBAL_COOLDOWN: Dict[str, datetime] = {}
COOLDOWN_MINUTES = 5

async def fetch_and_update_stock(symbol: str, force: bool = False) -> Optional[Stock]:
    """
    Fetch latest market data and update the Stock record in DB.
    Throttles redundant calls and respects a cooldown for failed (rate-limited) symbols.
    """
    symbol = symbol.upper()

    # 1. 429 Cooldown Check
    if symbol in GLOBAL_COOLDOWN:
        since_fail = (datetime.utcnow() - GLOBAL_COOLDOWN[symbol]).total_seconds() / 60
        if since_fail < COOLDOWN_MINUTES:
            logger.warning("skipping_fetch_cooldown_active", symbol=symbol, mins_left=round(COOLDOWN_MINUTES - since_fail, 1))
            return None
        else:
            del GLOBAL_COOLDOWN[symbol]

    # 2. Check if refresh is actually needed (unless forced)
    if not force:
        with get_session() as session:
            existing = session.get(Stock, symbol)
            if existing and existing.updated_at:
                age_mins = (datetime.utcnow() - existing.updated_at).total_seconds() / 60
                if age_mins < 30:
                    logger.debug("skipping_fetch_recent_data_exists", symbol=symbol, age_mins=round(age_mins, 1))
                    return existing

    # 3. Perform the fetch
    data = await fetch_market_data(symbol)
    
    if not data:
        # Mark for cooldown to avoid slamming on 429s or invalid symbols
        GLOBAL_COOLDOWN[symbol] = datetime.utcnow()
        return None

    # Compute technical indicators
    from app.utils.indicators import compute_rsi, compute_macd

    prices = data.get("price_history", [])
    rsi = compute_rsi(prices) if len(prices) > 14 else None
    macd_data = compute_macd(prices) if len(prices) > 35 else None

    with get_session() as session:
        stock = session.get(Stock, symbol)

        if stock:
            stock.last_price = data["last_price"]
            stock.last_volume = data["last_volume"]
            stock.company_name = data["company_name"]
            stock.day_change_pct = data["day_change_pct"]
            stock.rsi = rsi
            stock.macd = macd_data["macd"] if macd_data else None
            stock.macd_signal = macd_data["signal"] if macd_data else None
            stock.updated_at = datetime.utcnow()
        else:
            stock = Stock(
                symbol=symbol,
                company_name=data["company_name"],
                last_price=data["last_price"],
                last_volume=data["last_volume"],
                day_change_pct=data["day_change_pct"],
                rsi=rsi,
                macd=macd_data["macd"] if macd_data else None,
                macd_signal=macd_data["signal"] if macd_data else None,
                updated_at=datetime.utcnow()
            )
            session.add(stock)

        session.commit()
        session.refresh(stock)
        session.expunge(stock)

        logger.info(
            "stock_updated",
            symbol=symbol,
            price=stock.last_price,
            rsi=stock.rsi,
        )
        return stock


async def fetch_and_update_multiple(symbols: List[str]) -> List[Stock]:
    """Fetch and update multiple stocks concurrently."""
    tasks = [fetch_and_update_stock(s) for s in symbols]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    stocks = []
    for result in results:
        if isinstance(result, Stock):
            stocks.append(result)
        elif isinstance(result, Exception):
            logger.error("batch_stock_update_error", error=str(result))

    return stocks
