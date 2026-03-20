"""
MarketMind AI v2 — Technical Indicators
Pure numeric helpers for RSI, MACD, Bollinger Bands, and SMA.
"""

import numpy as np
from typing import Dict, Any, List, Optional, Tuple


def compute_sma(prices: List[float], period: int = 20) -> Optional[float]:
    """Compute Simple Moving Average for the last `period` data points."""
    if len(prices) < period:
        return None
    return float(np.mean(prices[-period:]))


def compute_ema(prices: List[float], period: int = 12) -> Optional[float]:
    """Compute Exponential Moving Average."""
    if len(prices) < period:
        return None
    arr = np.array(prices, dtype=float)
    multiplier = 2 / (period + 1)
    ema = arr[0]
    for price in arr[1:]:
        ema = (price - ema) * multiplier + ema
    return float(ema)


def compute_rsi(prices: List[float], period: int = 14) -> Optional[float]:
    """
    Compute Relative Strength Index (RSI).
    Returns a value between 0 and 100.
    - RSI > 70 → overbought (potential sell signal)
    - RSI < 30 → oversold (potential buy signal)
    """
    if len(prices) < period + 1:
        return None

    arr = np.array(prices, dtype=float)
    deltas = np.diff(arr)

    gains = np.where(deltas > 0, deltas, 0.0)
    losses = np.where(deltas < 0, -deltas, 0.0)

    # Initial average gain/loss
    avg_gain = np.mean(gains[:period])
    avg_loss = np.mean(losses[:period])

    # Smooth using Wilder's method
    for i in range(period, len(gains)):
        avg_gain = (avg_gain * (period - 1) + gains[i]) / period
        avg_loss = (avg_loss * (period - 1) + losses[i]) / period

    if avg_loss == 0:
        return 100.0

    rs = avg_gain / avg_loss
    rsi = 100.0 - (100.0 / (1.0 + rs))
    return round(float(rsi), 2)


def compute_macd(
    prices: List[float],
    fast_period: int = 12,
    slow_period: int = 26,
    signal_period: int = 9,
) -> Optional[Dict[str, float]]:
    """
    Compute MACD (Moving Average Convergence Divergence).
    Returns dict with 'macd', 'signal', and 'histogram' values.
    """
    if len(prices) < slow_period + signal_period:
        return None

    # Compute EMAs
    def _ema_series(data: np.ndarray, period: int) -> np.ndarray:
        ema = np.zeros_like(data)
        ema[0] = data[0]
        multiplier = 2 / (period + 1)
        for i in range(1, len(data)):
            ema[i] = (data[i] - ema[i - 1]) * multiplier + ema[i - 1]
        return ema

    arr = np.array(prices, dtype=float)
    fast_ema = _ema_series(arr, fast_period)
    slow_ema = _ema_series(arr, slow_period)

    macd_line = fast_ema - slow_ema
    signal_line = _ema_series(macd_line, signal_period)
    histogram = macd_line - signal_line

    return {
        "macd": round(float(macd_line[-1]), 4),
        "signal": round(float(signal_line[-1]), 4),
        "histogram": round(float(histogram[-1]), 4),
    }


def compute_bollinger_bands(
    prices: List[float],
    period: int = 20,
    num_std: float = 2.0,
) -> Optional[Dict[str, float]]:
    """
    Compute Bollinger Bands.
    Returns dict with 'upper', 'middle' (SMA), 'lower', and 'bandwidth'.
    """
    if len(prices) < period:
        return None

    recent = np.array(prices[-period:], dtype=float)
    middle = float(np.mean(recent))
    std = float(np.std(recent))

    upper = middle + num_std * std
    lower = middle - num_std * std
    bandwidth = ((upper - lower) / middle) * 100 if middle != 0 else 0

    return {
        "upper": round(upper, 2),
        "middle": round(middle, 2),
        "lower": round(lower, 2),
        "bandwidth": round(bandwidth, 2),
    }


def interpret_rsi(rsi: float) -> str:
    """Interpret RSI value."""
    if rsi >= 70:
        return "overbought"
    elif rsi <= 30:
        return "oversold"
    return "neutral"


def interpret_macd(macd_data: Dict[str, float]) -> str:
    """Interpret MACD histogram."""
    hist = macd_data.get("histogram", 0)
    if hist > 0:
        return "bullish"
    elif hist < 0:
        return "bearish"
    return "neutral"


def compute_all_indicators(prices: List[float]) -> Dict[str, Any]:
    """Compute all indicators and return a combined dict."""
    result = {}

    rsi = compute_rsi(prices)
    if rsi is not None:
        result["rsi"] = {"value": rsi, "interpretation": interpret_rsi(rsi)}

    macd_data = compute_macd(prices)
    if macd_data is not None:
        result["macd"] = {**macd_data, "interpretation": interpret_macd(macd_data)}

    bollinger = compute_bollinger_bands(prices)
    if bollinger is not None:
        result["bollinger_bands"] = bollinger

    sma_20 = compute_sma(prices, 20)
    if sma_20 is not None:
        result["sma_20"] = sma_20

    sma_50 = compute_sma(prices, 50)
    if sma_50 is not None:
        result["sma_50"] = sma_50

    return result
