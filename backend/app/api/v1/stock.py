"""
MarketMind AI v2 — Stock API
GET /api/v1/stock/{symbol}/overview — full stock overview.
"""

import json
from fastapi import APIRouter, Depends, HTTPException, Path, Query
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.utils.logging import get_logger

logger = get_logger(__name__)

from app.db.session import get_db
from app.db.models import Stock, Signal, Prediction, AgentAction, News, NewsAnalysis
from app.schemas.stock_schema import StockOut, StockOverview, IndicatorData
from app.schemas.signal_schema import SignalOut, PredictionOut, AgentActionOut
from app.schemas.news_schema import NewsWithAnalysisOut, NewsAnalysisOut

router = APIRouter(tags=["Stock"])


@router.get("/{symbol}/overview", response_model=StockOverview)
async def get_stock_overview(
    symbol: str = Path(..., description="Stock symbol (e.g., INFY, TATAMOTORS)"),
    db: AsyncSession = Depends(get_db),
):
    """
    Full stock overview: current price, indicators, latest signals,
    news affecting it, and last predictions.
    """
    symbol = symbol.upper()

    # Fetch stock data
    stock_result = await db.execute(select(Stock).where(Stock.symbol == symbol))
    stock = stock_result.scalar_one_or_none()

    if not stock:
        # Auto-fetch from market agent if not in DB
        from app.core.agents.market_agent import fetch_and_update_stock
        logger.info("stock_auto_fetch_triggered", symbol=symbol)
        stock = await fetch_and_update_stock(symbol)

    if not stock:
        raise HTTPException(status_code=404, detail=f"Stock {symbol} not found")

    # Build indicator list from stored values
    indicators = []
    if stock.rsi is not None:
        interpretation = "overbought" if stock.rsi > 70 else ("oversold" if stock.rsi < 30 else "neutral")
        indicators.append(IndicatorData(name="RSI (14)", value=stock.rsi, interpretation=interpretation))
    if stock.macd is not None:
        indicators.append(IndicatorData(name="MACD", value=stock.macd, interpretation="neutral"))
    if stock.macd_signal is not None:
        indicators.append(IndicatorData(name="MACD Signal", value=stock.macd_signal, interpretation="neutral"))

    # Latest signals
    signals_result = await db.execute(
        select(Signal)
        .where(Signal.symbol == symbol)
        .order_by(desc(Signal.created_at))
        .limit(5)
    )
    signals = signals_result.scalars().all()
    latest_signals = [
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

    # Latest prediction
    pred_result = await db.execute(
        select(Prediction)
        .where(Prediction.symbol == symbol)
        .order_by(desc(Prediction.created_at))
        .limit(1)
    )
    prediction_row = pred_result.scalar_one_or_none()
    prediction = None
    if prediction_row:
        prediction = PredictionOut(
            min_pct=prediction_row.expected_min_pct,
            max_pct=prediction_row.expected_max_pct,
            confidence=prediction_row.confidence,
        )

    # Recent agent actions
    actions_result = await db.execute(
        select(AgentAction)
        .where(AgentAction.symbol == symbol)
        .order_by(desc(AgentAction.timestamp))
        .limit(20)
    )
    actions = actions_result.scalars().all()
    recent_actions = [
        AgentActionOut(
            id=a.id,
            agent_id=a.agent_id,
            agent_type=a.agent_type,
            symbol=a.symbol,
            action=a.action,
            size=a.size,
            reasoning=a.reasoning,
            timestamp=a.timestamp,
        )
        for a in actions
    ]

    # Latest news affecting this symbol (search in entities)
    # We search for news analyses that mention this symbol
    latest_news = []
    analyses_result = await db.execute(
        select(NewsAnalysis)
        .where(NewsAnalysis.entities.contains(symbol))
        .order_by(desc(NewsAnalysis.created_at))
        .limit(5)
    )
    analyses = analyses_result.scalars().all()
    for analysis in analyses:
        news_result = await db.execute(select(News).where(News.id == analysis.news_id))
        news = news_result.scalar_one_or_none()
        if news:
            try:
                entities_list = json.loads(analysis.entities) if analysis.entities else []
            except json.JSONDecodeError:
                entities_list = []

            latest_news.append(
                NewsWithAnalysisOut(
                    id=news.id,
                    external_id=news.external_id,
                    title=news.title,
                    summary=news.summary,
                    url=news.url,
                    source=news.source,
                    published_at=news.published_at,
                    created_at=news.created_at,
                    analysis=NewsAnalysisOut(
                        id=analysis.id,
                        news_id=analysis.news_id,
                        sentiment=analysis.sentiment,
                        impact_score=analysis.impact_score,
                        entities=entities_list,
                        analysis_text=analysis.analysis_text,
                        created_at=analysis.created_at,
                    ),
                )
            )

    return StockOverview(
        symbol=stock.symbol,
        company_name=stock.company_name,
        last_price=stock.last_price,
        last_volume=stock.last_volume,
        day_change_pct=stock.day_change_pct,
        indicators=indicators,
        latest_signals=latest_signals,
        latest_news=latest_news,
        prediction=prediction,
        recent_agent_actions=recent_actions,
        updated_at=stock.updated_at,
    )


@router.get("/search")
async def search_stocks(q: str = Query(..., description="Search query")):
    """
    Search for NSE stocks using Yahoo Finance API proxy.
    """
    import httpx

    # Yahoo finance search endpoint
    url = f"https://query2.finance.yahoo.com/v1/finance/search?q={q}"
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers, timeout=5.0)
            response.raise_for_status()
            data = response.json()

        from typing import Dict, Any
        results: List[Dict[str, Any]] = []
        for quote in data.get("quotes", []):
            symbol = quote.get("symbol", "")
            # Return NSE/BSE stocks or specific exact matches
            if symbol.endswith(".NS") or symbol.endswith(".BO") or quote.get("quoteType") == "EQUITY":
                results.append({
                    "symbol": symbol.replace(".NS", "").replace(".BO", ""), # Strip suffix for easier internal use if needed, but let's keep it to display proper NSE/BSE
                    "yahoo_symbol": symbol,
                    "company_name": quote.get("shortname", quote.get("longname", "")),
                    "exchange": quote.get("exchange", ""),
                    "type": quote.get("quoteType", "")
                })

        return results[:10]  # Return top 10

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@router.get("/", response_model=List[StockOut])
async def list_stocks(db: AsyncSession = Depends(get_db)):
    """List all tracked stocks."""
    result = await db.execute(select(Stock).order_by(Stock.symbol))
    stocks = result.scalars().all()
    return [
        StockOut(
            symbol=s.symbol,
            company_name=s.company_name,
            last_price=s.last_price,
            last_volume=s.last_volume,
            day_change_pct=s.day_change_pct,
            rsi=s.rsi,
            macd=s.macd,
            macd_signal=s.macd_signal,
            updated_at=s.updated_at,
        )
        for s in stocks
    ]
