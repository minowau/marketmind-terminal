"""
MarketMind AI v2 — Technical Agent
Computes comprehensive technical indicators for a symbol using historical price data.
"""

import asyncio
from typing import Dict, Any, Optional, List
from datetime import datetime

from app.utils.indicators import compute_all_indicators, interpret_rsi, interpret_macd
from app.utils.logging import get_logger

logger = get_logger(__name__)


def _fetch_price_history(symbol: str, period: str = "3mo") -> Optional[List[float]]:
    """Fetch historical close prices via yfinance (synchronous)."""
    try:
        import yfinance as yf

        ticker_symbol = symbol if "." in symbol else f"{symbol}.NS"
        ticker = yf.Ticker(ticker_symbol)
        hist = ticker.history(period=period)

        if hist.empty:
            return None

        return hist["Close"].tolist()
    except Exception as e:
        logger.error("price_history_fetch_error", symbol=symbol, error=str(e))
        return None


async def compute_indicators_for_symbol(symbol: str) -> Dict[str, Any]:
    """
    Compute all technical indicators for a given symbol.

    Returns:
        {
            "symbol": str,
            "indicators": {
                "rsi": {"value": float, "interpretation": str},
                "macd": {"macd": float, "signal": float, "histogram": float, "interpretation": str},
                "bollinger_bands": {"upper": float, "middle": float, "lower": float, "bandwidth": float},
                "sma_20": float,
                "sma_50": float,
            },
            "overall_signal": "bullish" | "bearish" | "neutral",
            "computed_at": str (ISO),
        }
    """
    loop = asyncio.get_event_loop()
    prices = await loop.run_in_executor(None, _fetch_price_history, symbol)

    if not prices or len(prices) < 15:
        logger.warning("insufficient_price_data", symbol=symbol, data_points=len(prices) if prices else 0)
        return {
            "symbol": symbol,
            "indicators": {},
            "overall_signal": "neutral",
            "computed_at": datetime.utcnow().isoformat(),
        }

    indicators = compute_all_indicators(prices)

    # Determine overall signal from indicators
    overall = _compute_overall_signal(indicators, prices)

    result = {
        "symbol": symbol,
        "indicators": indicators,
        "overall_signal": overall,
        "computed_at": datetime.utcnow().isoformat(),
    }

    logger.info(
        "indicators_computed",
        symbol=symbol,
        overall_signal=overall,
        indicator_count=len(indicators),
    )

    return result


def _compute_overall_signal(indicators: Dict[str, Any], prices: List[float]) -> str:
    """
    Combine multiple indicators into a single overall signal.
    Simple weighted voting system.
    """
    bullish_votes = 0
    bearish_votes = 0
    total_votes = 0

    # RSI signal
    rsi_data = indicators.get("rsi")
    if rsi_data:
        total_votes += 1
        interp = rsi_data.get("interpretation", "neutral")
        if interp == "oversold":
            bullish_votes += 1  # Oversold → potential buy
        elif interp == "overbought":
            bearish_votes += 1  # Overbought → potential sell

    # MACD signal
    macd_data = indicators.get("macd")
    if macd_data:
        total_votes += 1
        interp = macd_data.get("interpretation", "neutral")
        if interp == "bullish":
            bullish_votes += 1
        elif interp == "bearish":
            bearish_votes += 1

    # Price vs SMA
    sma_20 = indicators.get("sma_20")
    if sma_20 and prices:
        total_votes += 1
        if prices[-1] > sma_20:
            bullish_votes += 1
        else:
            bearish_votes += 1

    # Compute overall
    if total_votes == 0:
        return "neutral"

    bullish_ratio = bullish_votes / total_votes
    bearish_ratio = bearish_votes / total_votes

    if bullish_ratio > 0.5:
        return "bullish"
    elif bearish_ratio > 0.5:
        return "bearish"
    return "neutral"


async def get_indicator_summary(symbol: str) -> List[Dict[str, Any]]:
    """
    Get formatted indicator list for API response.
    Returns list of IndicatorData-compatible dicts.
    """
    result = await compute_indicators_for_symbol(symbol)
    indicators = result.get("indicators", {})
    summary = []

    if "rsi" in indicators:
        rsi = indicators["rsi"]
        summary.append({
            "name": "RSI (14)",
            "value": rsi["value"],
            "interpretation": rsi["interpretation"],
        })

    if "macd" in indicators:
        macd = indicators["macd"]
        summary.append({
            "name": "MACD",
            "value": macd["macd"],
            "interpretation": macd["interpretation"],
        })
        summary.append({
            "name": "MACD Signal",
            "value": macd["signal"],
            "interpretation": macd["interpretation"],
        })

    if "sma_20" in indicators:
        summary.append({
            "name": "SMA (20)",
            "value": indicators["sma_20"],
            "interpretation": "neutral",
        })

    if "sma_50" in indicators:
        summary.append({
            "name": "SMA (50)",
            "value": indicators["sma_50"],
            "interpretation": "neutral",
        })

    if "bollinger_bands" in indicators:
        bb = indicators["bollinger_bands"]
        summary.append({
            "name": "Bollinger Upper",
            "value": bb["upper"],
            "interpretation": "neutral",
        })
        summary.append({
            "name": "Bollinger Lower",
            "value": bb["lower"],
            "interpretation": "neutral",
        })

    return summary
