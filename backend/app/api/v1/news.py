"""
MarketMind AI v2 — News API
GET /api/v1/news — list latest analyzed news items.
"""

import json
from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.db.session import get_db
from app.db.models import News, NewsAnalysis
from app.schemas.news_schema import NewsOut, NewsWithAnalysisOut, NewsAnalysisOut

router = APIRouter(tags=["News"])


@router.get("/", response_model=List[NewsWithAnalysisOut])
async def list_news(
    limit: int = Query(default=20, ge=1, le=100, description="Max results"),
    source: Optional[str] = Query(default=None, description="Filter by source"),
    sentiment: Optional[str] = Query(default=None, description="Filter by sentiment"),
    db: AsyncSession = Depends(get_db),
):
    """
    List latest news articles with their analysis (sentiment, impact, entities).
    """
    query = select(News).order_by(desc(News.published_at))

    if source:
        query = query.where(News.source == source)

    query = query.limit(limit)
    result = await db.execute(query)
    news_list = result.scalars().all()

    output = []
    for news in news_list:
        # Fetch analysis for this news article
        analysis_query = (
            select(NewsAnalysis)
            .where(NewsAnalysis.news_id == news.id)
            .order_by(desc(NewsAnalysis.created_at))
            .limit(1)
        )
        analysis_result = await db.execute(analysis_query)
        analysis = analysis_result.scalar_one_or_none()

        # Filter by sentiment if requested
        if sentiment and analysis and analysis.sentiment != sentiment:
            continue

        analysis_out = None
        if analysis:
            try:
                entities_list = json.loads(analysis.entities) if analysis.entities else []
            except json.JSONDecodeError:
                entities_list = []

            analysis_out = NewsAnalysisOut(
                id=analysis.id,
                news_id=analysis.news_id,
                sentiment=analysis.sentiment,
                impact_score=analysis.impact_score,
                entities=entities_list,
                analysis_text=analysis.analysis_text,
                created_at=analysis.created_at,
            )

        item = NewsWithAnalysisOut(
            id=news.id,
            external_id=news.external_id,
            title=news.title,
            summary=news.summary,
            url=news.url,
            source=news.source,
            published_at=news.published_at,
            created_at=news.created_at,
            analysis=analysis_out,
        )
        output.append(item)

    return output


@router.get("/sources", response_model=List[str])
async def list_sources(db: AsyncSession = Depends(get_db)):
    """List all unique news sources in the database."""
    from sqlalchemy import distinct
    query = select(distinct(News.source)).where(News.source.isnot(None))
    result = await db.execute(query)
    return [row[0] for row in result.all()]
