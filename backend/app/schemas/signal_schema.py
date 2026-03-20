"""
MarketMind AI v2 — Signal Schemas (Pydantic)
API serialization models for signals, predictions, and opportunities.
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class PredictionOut(BaseModel):
    """Prediction move band for a stock."""
    min_pct: float
    max_pct: float
    confidence: float

    class Config:
        from_attributes = True


class SignalOut(BaseModel):
    """Serialized signal for API responses."""
    id: int
    symbol: str
    signal_score: float
    reason: Optional[str] = None
    trigger: Optional[str] = None
    confidence: float
    created_at: datetime

    class Config:
        from_attributes = True


class OpportunityOut(BaseModel):
    """
    Combined signal + prediction data for the OpportunityRadar UI.
    Maps to GET /api/v1/opportunities response items.
    """
    symbol: str
    company: Optional[str] = None
    signal_score: float
    predicted_move: PredictionOut
    trigger: Optional[str] = None
    last_updated: datetime

    class Config:
        from_attributes = True


class AgentActionOut(BaseModel):
    """Serialized agent action event."""
    id: int
    agent_id: str
    agent_type: str
    symbol: str
    action: str
    size: Optional[float] = None
    reasoning: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True
