"""
MarketMind AI v2 — Wishlist API
Endpoints for managing user's stock wishlist.
"""

from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, desc
from app.db.session import get_db
from app.db.models import Wishlist, Stock, Signal, Prediction
from app.schemas.stock_schema import WishlistOut, StockOut
from app.schemas.signal_schema import SignalOut, PredictionOut
from app.utils.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(tags=["Wishlist"])

@router.get("/", response_model=List[WishlistOut])
async def get_wishlist(db: AsyncSession = Depends(get_db)):
    """Fetch all items in the wishlist with their stock details, signals, and predictions."""
    result = await db.execute(select(Wishlist))
    items = result.scalars().all()
    
    out = []
    for item in items:
        # Fetch stock basic info
        stock_res = await db.execute(select(Stock).where(Stock.symbol == item.symbol))
        stock = stock_res.scalar_one_or_none()
        
        # Fetch latest signals
        signals_res = await db.execute(
            select(Signal)
            .where(Signal.symbol == item.symbol)
            .order_by(desc(Signal.created_at))
            .limit(3)
        )
        signals = [SignalOut.model_validate(s) for s in signals_res.scalars().all()]
        
        # Fetch latest prediction
        pred_res = await db.execute(
            select(Prediction)
            .where(Prediction.symbol == item.symbol)
            .order_by(desc(Prediction.created_at))
            .limit(1)
        )
        pred_row = pred_res.scalar_one_or_none()
        prediction = PredictionOut(
            min_pct=pred_row.expected_min_pct,
            max_pct=pred_row.expected_max_pct,
            confidence=pred_row.confidence
        ) if pred_row else None

        out.append(WishlistOut(
            id=item.id,
            symbol=item.symbol,
            created_at=item.created_at,
            stock=StockOut.model_validate(stock) if stock else None,
            latest_signals=signals,
            prediction=prediction
        ))
    
    return out

@router.post("/", response_model=WishlistOut)
async def add_to_wishlist(
    symbol: str = Body(..., embed=True),
    db: AsyncSession = Depends(get_db)
):
    """Add a stock symbol to the wishlist and trigger initial prediction."""
    symbol = symbol.upper()
    
    # Check if already exists
    existing_res = await db.execute(select(Wishlist).where(Wishlist.symbol == symbol))
    if existing_res.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Stock already in wishlist")
        
    # Check if stock exists in our system (or auto-fetch)
    from app.core.agents.market_agent import fetch_and_update_stock
    stock = await fetch_and_update_stock(symbol)
    if not stock:
        raise HTTPException(status_code=404, detail="Invalid stock symbol")

    item = Wishlist(symbol=symbol)
    db.add(item)
    
    # Proactively check if it has a prediction. If not, trigger one.
    sig_res = await db.execute(select(Signal).where(Signal.symbol == symbol).limit(1))
    if not sig_res.scalar_one_or_none():
        try:
            from app.core.agents.technical_agent import compute_indicators_for_symbol
            from app.core.orchestrator import create_signal_from_analysis
            from app.core.agents.investor_sim_agent import run_simulation
            from app.core.agents.prediction_agent import compute_prediction
            
            tech_res = await compute_indicators_for_symbol(symbol)
            tech_signal = tech_res.get("overall_signal", "neutral")
            
            # Create a "System Bootstrap" signal
            signal = create_signal_from_analysis(
                news_analysis_id=0, # 0 indicates no specific news analysis (technical bootstrap)
                symbol=symbol,
                impact_score=5.0, # Default impact
                sentiment="neutral",
                technical_signal=tech_signal,
                trigger="System Bootstrap / Wishlist Add"
            )
            
            run_simulation(symbol, signal.signal_score, signal.confidence, signal.id)
            compute_prediction(symbol, signal.id, signal.signal_score)
            logger.info("wishlist_bootstrap_triggered", symbol=symbol)
        except Exception as e:
            logger.error("wishlist_bootstrap_failed", symbol=symbol, error=str(e))

    await db.commit()
    await db.refresh(item)
    
    # Fetch the newly created prediction to return in response
    pred_res = await db.execute(
        select(Prediction)
        .where(Prediction.symbol == symbol)
        .order_by(desc(Prediction.created_at))
        .limit(1)
    )
    pred_row = pred_res.scalar_one_or_none()
    prediction = PredictionOut(
        min_pct=pred_row.expected_min_pct,
        max_pct=pred_row.expected_max_pct,
        confidence=pred_row.confidence
    ) if pred_row else None

    # Fetch latest signals
    signals_res = await db.execute(
        select(Signal)
        .where(Signal.symbol == symbol)
        .order_by(desc(Signal.created_at))
        .limit(3)
    )
    signals = [SignalOut.model_validate(s) for s in signals_res.scalars().all()]

    return WishlistOut(
        id=item.id,
        symbol=item.symbol,
        created_at=item.created_at,
        stock=StockOut.model_validate(stock) if stock else None,
        latest_signals=signals,
        prediction=prediction
    )

@router.delete("/{symbol}")
async def remove_from_wishlist(symbol: str, db: AsyncSession = Depends(get_db)):
    """Remove a stock symbol from the wishlist."""
    symbol = symbol.upper()
    await db.execute(delete(Wishlist).where(Wishlist.symbol == symbol))
    await db.commit()
    return {"status": "success", "message": f"{symbol} removed from wishlist"}
