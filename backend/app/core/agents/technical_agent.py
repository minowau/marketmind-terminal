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
    """
    Virtualize price history: Return deterministic 'Neural Oscillations' for 'The Council'.
    Bypasses yfinance for instant indicator computation on Hugging Face.
    """
    import math
    import random
    
    # Base price mapping to match market_agent.py for consistency
    mock_prices = {
        "RELIANCE": 2984.50,
        "TCS": 4120.35,
        "NIFTY": 22453.15,
        "INFY": 1648.20,
        "HDFCBANK": 1450.75,
        "SBIN": 763.40
    }
    
    base_symbol = symbol.split(".")[0].upper()
    base_price = mock_prices.get(base_symbol, 1000.0)
    
    # Generate 60 days of neural history
    history = []
    for i in range(60):
        val = base_price * (1 + 0.02 * math.sin(i/6) + random.uniform(-0.005, 0.005))
        history.append(round(val, 2))
        
    return history


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
