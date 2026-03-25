import json
import asyncio
from typing import List, Dict, Any

from sqlmodel import select
from app.db.models import News, NewsAnalysis
from app.db.session import get_session
from app.utils.fetchers import fetch_all_news
from app.utils.logging import get_logger
from app.core.agents.news_analysis_agent import analyze_text, analyze_text_lite
from app.core.orchestrator import create_signal_from_analysis
from app.core.agents.market_agent import fetch_and_update_stock
from app.core.agents.technical_agent import compute_indicators_for_symbol
from app.core.agents.investor_sim_agent import run_simulation
from app.core.agents.prediction_agent import compute_prediction

logger = get_logger(__name__)


def store_news_articles(articles: List[Dict[str, Any]]) -> List[int]:
    """
    Store normalized news articles in the database.
    Skips duplicates based on external_id.
    Returns list of newly created news IDs.
    """
    new_ids = []

    with get_session() as session:
        for article in articles:
            # Check for duplicate
            existing = session.exec(
                select(News).where(News.external_id == article["external_id"])
            ).first()

            if existing:
                logger.debug("news_duplicate_skipped", external_id=article["external_id"])
                continue

            news = News(
                external_id=article["external_id"],
                title=article["title"],
                summary=article["summary"],
                url=article.get("url"),
                source=article.get("source"),
                published_at=article["published_at"],
            )
            session.add(news)
            session.flush()  # Get the ID
            new_ids.append(news.id)

            logger.info("news_stored", news_id=news.id, title=article["title"][:60])

        session.commit()

    logger.info("news_batch_stored", total=len(articles), new=len(new_ids))
    return new_ids


async def analyze_new_articles(news_ids: List[int]):
    """
    Perform AI analysis on a list of news articles by ID.
    Stores results in NewsAnalysis table.
    """
    if not news_ids:
        return

    logger.info("analyzing_batch_start", count=len(news_ids))
    
    with get_session() as session:
        for news_id in news_ids:
            news = session.get(News, news_id)
            if not news:
                continue

            try:
                # Combine title and summary for context
                text_to_analyze = f"{news.title}\n{news.summary}"
                try:
                    analysis = await analyze_text(text_to_analyze)
                except Exception as e:
                    logger.warning("llm_analysis_failed_falling_back_to_lite", news_id=news.id, error=str(e))
                    # Fallback to lite analysis (no LLM required)
                    analysis = await analyze_text_lite(text_to_analyze)

                # Store analysis
                news_analysis = NewsAnalysis(
                    news_id=news.id,
                    sentiment=analysis["sentiment"],
                    impact_score=analysis["impact"],
                    entities=json.dumps(analysis["entities"]),
                    analysis_text=analysis["explanation"]
                )
                session.add(news_analysis)
                session.commit() # Commit here so signal generation can see the record
                session.refresh(news_analysis)

                # Synchronously trigger signal generation for each entity
                entities = analysis.get("entities", [])
                symbols = [e.upper() for e in entities[:3]] # Process top 3
                if not symbols:
                    symbols = ["RELIANCE"] # Fallback

                for symbol in symbols:
                    try:
                        # Ensure stock exists and is updated
                        await fetch_and_update_stock(symbol)
                        # Get technical outlook
                        tech_res = await compute_indicators_for_symbol(symbol)
                        tech_signal = tech_res.get("overall_signal", "neutral")
                        
                        # Create fused signal
                        signal = create_signal_from_analysis(
                            news_analysis_id=news_analysis.id,
                            symbol=symbol,
                            impact_score=news_analysis.impact_score,
                            sentiment=news_analysis.sentiment,
                            technical_signal=tech_signal,
                            trigger=news.title[:100]
                        )

                        # Synchronously run simulation
                        run_simulation(
                            symbol=symbol,
                            signal_score=signal.signal_score,
                            confidence=signal.confidence,
                            signal_id=signal.id
                        )

                        # Synchronously compute prediction
                        compute_prediction(
                            symbol=symbol,
                            signal_id=signal.id,
                            signal_score=signal.signal_score
                        )
                    except Exception as sig_err:
                        logger.error("signal_generation_failed", symbol=symbol, error=str(sig_err))

                logger.debug("analysis_and_signals_stored", news_id=news.id)
            except Exception as e:
                logger.error("analysis_failed", news_id=news.id, error=str(e))

        session.commit()
    logger.info("analyzing_batch_completed")


async def fetch_and_store(analyze: bool = True) -> List[int]:
    """
    Virtualize news ingestion: Seed 'The Council' with high-fidelity mock data.
    Ensures instant population and speed on Hugging Face.
    """
    logger.info("neural_virtualization_started", analyze=analyze)

    # High-fidelity 'The Council' themed mock articles
    mock_articles = [
        {
            "external_id": "council_alpha_001",
            "title": "NEURAL_CORE: Institutional Accumulation Detected in RELIANCE",
            "summary": "The Council's neural matrix has identified a significant shift in institutional flow for RELIANCE. Cluster analysis suggests a 12.4% probability of an upside breakout within the next 48 neural cycles.",
            "url": "https://thecouncil.ai/signals/reliance-alpha",
            "source": "Neural Core",
            "published_at": datetime.utcnow()
        },
        {
            "external_id": "council_alpha_002",
            "title": "PROTOCOL_SURGE: TCS Digital Transformation Deal Signals Neural Growth",
            "summary": "A major cloud-native AI partnership has been confirmed. Neural agents predict a strong retail reaction as volume nodes hit critical mass. Sentiment delta is trending positive.",
            "url": "https://thecouncil.ai/signals/tcs-surge",
            "source": "Neural Core",
            "published_at": datetime.utcnow()
        },
        {
            "external_id": "council_alpha_003",
            "title": "MARKET_MATRIX: NIFTY 50 Enters High Volatility Neural Zone",
            "summary": "Global macro clusters are converging on the NIFTY index. The Council identifies a temporary liquidity gap. Caution is advised for short-term delta neutral strategies.",
            "url": "https://thecouncil.ai/signals/nifty-matrix",
            "source": "Neural Core",
            "published_at": datetime.utcnow()
        },
        {
            "external_id": "council_alpha_004",
            "title": "FINANCE_NODE: HDFCBANK Rate Cut Projection Analysis",
            "summary": "Neural simulations of central bank sentiment suggest a 0.25bps shift. Banking nodes across the matrix are re-aligning for high-conviction buy signals.",
            "url": "https://thecouncil.ai/signals/hdfc-node",
            "source": "Neural Core",
            "published_at": datetime.utcnow()
        }
    ]

    new_ids = store_news_articles(mock_articles)

    if analyze and new_ids:
        await analyze_new_articles(new_ids)

    logger.info("neural_virtualization_completed", new_articles=len(new_ids))
    return new_ids
