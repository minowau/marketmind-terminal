import pytest
from app.utils.indicators import (
    compute_sma,
    compute_ema,
    compute_rsi,
    compute_macd,
    compute_bollinger_bands,
    interpret_rsi,
    interpret_macd
)

def test_compute_sma():
    prices = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19]
    # Period 5 -> mean of [15, 16, 17, 18, 19] = 17.0
    sma = compute_sma(prices, period=5)
    assert sma == 17.0

def test_compute_sma_insufficient_data():
    prices = [10, 11]
    assert compute_sma(prices, period=5) is None

def test_compute_rsi():
    # Downward trend
    prices = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 9, 8, 7, 6, 5, 4]
    rsi = compute_rsi(prices, period=14)
    assert rsi is not None
    assert rsi < 30  # Oversold

    # Upward trend
    prices_up = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150]
    rsi_up = compute_rsi(prices_up, period=14)
    assert rsi_up is not None
    assert rsi_up > 70  # Overbought

def test_compute_macd():
    # Make a synthetic price array
    prices = [100 + i for i in range(50)]
    macd_data = compute_macd(prices)
    assert macd_data is not None
    assert "macd" in macd_data
    assert "signal" in macd_data
    assert "histogram" in macd_data

def test_bollinger_bands():
    prices = [100] * 20
    bb = compute_bollinger_bands(prices, period=20)
    assert bb is not None
    assert bb["upper"] == 100.0
    assert bb["lower"] == 100.0
    assert bb["middle"] == 100.0
    assert bb["bandwidth"] == 0.0

def test_interpretations():
    assert interpret_rsi(80) == "overbought"
    assert interpret_rsi(20) == "oversold"
    assert interpret_rsi(50) == "neutral"
    
    assert interpret_macd({"histogram": 1.5}) == "bullish"
    assert interpret_macd({"histogram": -0.5}) == "bearish"
    assert interpret_macd({"histogram": 0.0}) == "neutral"
