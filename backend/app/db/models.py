"""
MarketMind AI v2 — Database Models (SQLModel)
All core tables for news, analysis, stocks, signals, agent actions, and predictions.
"""

from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class News(SQLModel, table=True):
    """Raw news articles ingested from RSS / GNews / other feeds."""
    __tablename__ = "news"

    id: Optional[int] = Field(default=None, primary_key=True)
    external_id: str = Field(index=True, unique=True)
    title: str
    summary: str
    url: Optional[str] = None
    source: Optional[str] = None
    published_at: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)


class NewsAnalysis(SQLModel, table=True):
    """LLM / FinBERT analysis result for a news article."""
    __tablename__ = "news_analysis"

    id: Optional[int] = Field(default=None, primary_key=True)
    news_id: int = Field(index=True, foreign_key="news.id")
    sentiment: str  # 'positive' | 'negative' | 'neutral'
    impact_score: float = Field(default=0.0)
    entities: str = Field(default="[]")  # JSON string of extracted entities
    analysis_text: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Stock(SQLModel, table=True):
    """Latest snapshot of a stock / instrument."""
    __tablename__ = "stock"

    symbol: str = Field(primary_key=True)
    company_name: Optional[str] = None
    last_price: float = Field(default=0.0)
    last_volume: int = Field(default=0)
    day_change_pct: Optional[float] = None
    rsi: Optional[float] = None
    macd: Optional[float] = None
    macd_signal: Optional[float] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Signal(SQLModel, table=True):
    """Fused signal combining news impact + technical indicators."""
    __tablename__ = "signal"

    id: Optional[int] = Field(default=None, primary_key=True)
    symbol: str = Field(index=True)
    signal_score: float = Field(default=0.0)
    reason: Optional[str] = None
    trigger: Optional[str] = None  # brief description of what triggered the signal
    confidence: float = Field(default=0.0)
    news_analysis_id: Optional[int] = Field(default=None, foreign_key="news_analysis.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class AgentAction(SQLModel, table=True):
    """Individual action taken by a simulated investor agent."""
    __tablename__ = "agent_action"

    id: Optional[int] = Field(default=None, primary_key=True)
    agent_id: str = Field(index=True)
    agent_type: str  # 'FOMO' | 'VALUE' | 'MOMENTUM' | 'CONTRARIAN' | etc.
    symbol: str = Field(index=True)
    action: str  # 'BUY' | 'SELL' | 'HOLD'
    size: Optional[float] = None
    reasoning: Optional[str] = None
    signal_id: Optional[int] = Field(default=None, foreign_key="signal.id")
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class Prediction(SQLModel, table=True):
    """Aggregated prediction from investor simulation."""
    __tablename__ = "prediction"

    id: Optional[int] = Field(default=None, primary_key=True)
    symbol: str = Field(index=True)
    buy_probability: float = Field(default=0.0)
    expected_min_pct: float = Field(default=0.0)
    expected_max_pct: float = Field(default=0.0)
    confidence: float = Field(default=0.0)
    signal_id: Optional[int] = Field(default=None, foreign_key="signal.id")
    rationale: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Wishlist(SQLModel, table=True):
    """User wishlist of stocks."""
    __tablename__ = "wishlist"

    id: Optional[int] = Field(default=None, primary_key=True)
    symbol: str = Field(index=True, unique=True, foreign_key="stock.symbol")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Waitlist(SQLModel, table=True):
    """User waitlist for terminal access."""
    __tablename__ = "waitlist"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    email: str = Field(index=True, unique=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class AuthOTP(SQLModel, table=True):
    """Temporary OTP storage for dynamic terminal access."""
    __tablename__ = "auth_otp"

    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True)
    otp_code: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime
    is_used: bool = Field(default=False)
