"""
MarketMind AI v2 — Stock Schemas (Pydantic)
API serialization models for stock data and overview.
"""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.schemas.signal_schema import SignalOut, PredictionOut, AgentActionOut
from app.schemas.news_schema import NewsWithAnalysisOut


class StockOut(BaseModel):
    """Basic stock snapshot for API responses."""
    symbol: str
    company_name: Optional[str] = None
    last_price: float
    last_volume: int
    day_change_pct: Optional[float] = None
    rsi: Optional[float] = None
    macd: Optional[float] = None
    macd_signal: Optional[float] = None
    updated_at: datetime

    class Config:
        from_attributes = True


class IndicatorData(BaseModel):
    """Technical indicator data point."""
    name: str
    value: float
    interpretation: Optional[str] = None  # 'bullish' | 'bearish' | 'neutral'


class StockOverview(BaseModel):
    """
    Full stock overview for GET /api/v1/stock/{symbol}/overview
    Combines price data, technical indicators, latest signals, news, and predictions.
    """
    symbol: str
    company_name: Optional[str] = None
    last_price: float
    last_volume: int
    day_change_pct: Optional[float] = None
    indicators: List[IndicatorData] = []
    latest_signals: List[SignalOut] = []
    latest_news: List[NewsWithAnalysisOut] = []
    prediction: Optional[PredictionOut] = None
    recent_agent_actions: List[AgentActionOut] = []
    updated_at: datetime


class WishlistOut(BaseModel):
    """Wishlist item with stock details."""
    id: int
    symbol: str
    created_at: datetime
    stock: Optional[StockOut] = None
    latest_signals: List[SignalOut] = []
    prediction: Optional[PredictionOut] = None

    class Config:
        from_attributes = True
