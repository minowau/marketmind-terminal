"""
MarketMind AI v2 — Signals API
GET /api/v1/signals — list recent signals.
GET /api/v1/signals/{signal_id} — signal detail.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Path
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.db.session import get_db
from app.db.models import Signal
from app.schemas.signal_schema import SignalOut

router = APIRouter(tags=["Signals"])


@router.get("/", response_model=List[SignalOut])
async def list_signals(
    limit: int = Query(default=20, ge=1, le=100),
    symbol: Optional[str] = Query(default=None, description="Filter by stock symbol"),
    min_confidence: Optional[float] = Query(default=None, description="Min confidence"),
    db: AsyncSession = Depends(get_db),
):
    """List recent signals, optionally filtered by symbol and confidence."""
    query = select(Signal).order_by(desc(Signal.created_at))

    if symbol:
        query = query.where(Signal.symbol == symbol.upper())
    if min_confidence is not None:
        query = query.where(Signal.confidence >= min_confidence)

    query = query.limit(limit)
    result = await db.execute(query)
    signals = result.scalars().all()

    return [
        SignalOut(
            id=s.id,
            symbol=s.symbol,
            signal_score=s.signal_score,
            reason=s.reason,
            trigger=s.trigger,
            confidence=s.confidence,
            created_at=s.created_at,
        )
        for s in signals
    ]


@router.get("/{signal_id}", response_model=SignalOut)
async def get_signal(
    signal_id: int = Path(..., description="Signal ID"),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific signal by ID."""
    result = await db.execute(select(Signal).where(Signal.id == signal_id))
    signal = result.scalar_one_or_none()

    if not signal:
        raise HTTPException(status_code=404, detail=f"Signal {signal_id} not found")

    return SignalOut(
        id=signal.id,
        symbol=signal.symbol,
        signal_score=signal.signal_score,
        reason=signal.reason,
        trigger=signal.trigger,
        confidence=signal.confidence,
        created_at=signal.created_at,
    )
