"""
MarketMind AI v2 — News Schemas (Pydantic)
API serialization models for news and news analysis endpoints.
"""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class NewsOut(BaseModel):
    """Serialized news article for API responses."""
    id: int
    external_id: str
    title: str
    summary: str
    url: Optional[str] = None
    source: Optional[str] = None
    published_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class NewsAnalysisOut(BaseModel):
    """Serialized news analysis for API responses."""
    id: int
    news_id: int
    sentiment: str
    impact_score: float
    entities: List[str] = []  # Parsed from JSON string
    analysis_text: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class NewsWithAnalysisOut(BaseModel):
    """News article combined with its analysis."""
    id: int
    external_id: str
    title: str
    summary: str
    url: Optional[str] = None
    source: Optional[str] = None
    published_at: datetime
    created_at: datetime
    analysis: Optional[NewsAnalysisOut] = None

    class Config:
        from_attributes = True
