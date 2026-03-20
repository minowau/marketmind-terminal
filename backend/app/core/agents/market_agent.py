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
    Fetch latest stock data from Yahoo Finance (synchronous).
    Adds .NS suffix for NSE stocks if not present.
    """
    try:
        import yfinance as yf

        # Auto-append .NS for Indian stocks if no suffix
        ticker_symbol = symbol if "." in symbol else f"{symbol}.NS"

        ticker = yf.Ticker(ticker_symbol)
        info = ticker.info

        # Get historical data for indicator computation
        hist = ticker.history(period="3mo")

        if hist.empty:
            logger.warning("yfinance_no_data", symbol=ticker_symbol)
            return None

        last_close = float(hist["Close"].iloc[-1])
        prev_close = float(hist["Close"].iloc[-2]) if len(hist) > 1 else last_close
        day_change_pct = ((last_close - prev_close) / prev_close * 100) if prev_close else 0

        return {
            "symbol": symbol,
            "company_name": info.get("shortName", info.get("longName", symbol)),
            "last_price": last_close,
            "last_volume": int(hist["Volume"].iloc[-1]),
            "day_change_pct": round(day_change_pct, 2),
            "price_history": hist["Close"].tolist(),
        }

    except Exception as e:
        logger.error("yfinance_fetch_error", symbol=symbol, error=str(e))
        return None


async def fetch_market_data(symbol: str) -> Optional[Dict[str, Any]]:
    """
    Async wrapper to fetch market data for a symbol.
    Runs yfinance in executor to avoid blocking the event loop.
    """
    loop = asyncio.get_event_loop()
    data = await loop.run_in_executor(None, _fetch_yfinance_data, symbol)
    return data


async def fetch_and_update_stock(symbol: str) -> Optional[Stock]:
    """
    Fetch latest market data and update the Stock record in DB.
    Creates a new record if it doesn't exist.
    """
    data = await fetch_market_data(symbol)
    if not data:
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
            )
            session.add(stock)

        session.commit()
        session.refresh(stock)
        session.expunge(stock) # Allow object to be used after session close

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
