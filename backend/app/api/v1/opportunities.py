"""
MarketMind AI v2 — Opportunities API
GET /api/v1/opportunities — list top signals with predictions for OpportunityRadar.
"""

import json
from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.db.models import Signal, Stock, Prediction
from app.schemas.signal_schema import OpportunityOut, PredictionOut

router = APIRouter(tags=["Opportunities"])


@router.get("/", response_model=List[OpportunityOut])
async def list_opportunities(
    limit: int = Query(default=10, ge=1, le=50, description="Max results to return"),
    min_score: Optional[float] = Query(default=None, description="Minimum signal score"),
    db: AsyncSession = Depends(get_db),
):
    """
    List top investment opportunities ranked by signal score.
    Combines signal data with latest predictions and stock info.
    """
    # Build query for top signals
    query = select(Signal).order_by(desc(Signal.signal_score))

    if min_score is not None:
        query = query.where(Signal.signal_score >= min_score)

    query = query.limit(limit)
    result = await db.execute(query)
    signals = result.scalars().all()

    opportunities = []
    for signal in signals:
        # Fetch latest prediction for this symbol
        pred_query = (
            select(Prediction)
            .where(Prediction.symbol == signal.symbol)
            .order_by(desc(Prediction.created_at))
            .limit(1)
        )
        pred_result = await db.execute(pred_query)
        prediction = pred_result.scalar_one_or_none()

        # Fetch stock info for company name
        stock_query = select(Stock).where(Stock.symbol == signal.symbol)
        stock_result = await db.execute(stock_query)
        stock = stock_result.scalar_one_or_none()

        predicted_move = PredictionOut(
            min_pct=prediction.expected_min_pct if prediction else 0.0,
            max_pct=prediction.expected_max_pct if prediction else 0.0,
            confidence=prediction.confidence if prediction else 0.0,
        )

        opportunity = OpportunityOut(
            symbol=signal.symbol,
            company=stock.company_name if stock else None,
            signal_score=signal.signal_score,
            predicted_move=predicted_move,
            trigger=signal.trigger,
            last_updated=signal.created_at,
        )
        opportunities.append(opportunity)

    return opportunities
