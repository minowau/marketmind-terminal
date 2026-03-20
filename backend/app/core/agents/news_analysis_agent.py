"""
MarketMind AI v2 — News Analysis Agent
Analyzes news articles using FinBERT + LLM to extract sentiment,
entities, impact score, and explanation.
"""

import json
from typing import Dict, Any, List

from app.core.ai.finbert_wrapper import analyze_sentiment
from app.core.ai.llm_client import structured_extraction
from app.utils.logging import get_logger

logger = get_logger(__name__)

# Schema for LLM structured extraction
_ANALYSIS_SCHEMA = {
    "type": "object",
    "properties": {
        "entities": {
            "type": "array",
            "items": {"type": "string"},
            "description": "List of company names, stock symbols, or sectors mentioned",
        },
        "impact_score": {
            "type": "number",
            "description": "Impact score from 0 (no impact) to 10 (extreme market impact)",
        },
        "explanation": {
            "type": "string",
            "description": "Brief 1-2 sentence explanation of why this news matters for markets",
        },
        "affected_symbols": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Stock symbols likely affected (e.g., INFY, TATAMOTORS, RELIANCE)",
        },
    },
    "required": ["entities", "impact_score", "explanation"],
}

_SYSTEM_PROMPT = """You are a financial news analyst. Given a news article title and summary,
extract the following information:
1. entities: companies, sectors, or stock symbols mentioned
2. impact_score: how much this could move relevant stocks (0-10 scale)
3. explanation: brief reason why this matters for the market
4. affected_symbols: NSE/BSE stock symbols likely affected

Focus on Indian stock market context. Be precise and concise."""


async def analyze_text(text: str) -> Dict[str, Any]:
    """
    Full analysis pipeline for a news article:
    1. FinBERT sentiment analysis (fast, finance-specific)
    2. LLM entity extraction, impact scoring, explanation

    Returns:
        {
            "sentiment": "positive" | "negative" | "neutral",
            "sentiment_score": float,
            "impact": float (0-10),
            "entities": list[str],
            "affected_symbols": list[str],
            "explanation": str,
        }
    """
    logger.info("analyzing_news_text", text_length=len(text))

    # Step 1: FinBERT sentiment
    sentiment_result = await analyze_sentiment(text)

    # Step 2: LLM structured extraction
    llm_result = await structured_extraction(
        text=text,
        system_prompt=_SYSTEM_PROMPT,
        response_schema=_ANALYSIS_SCHEMA,
    )

    result = {
        "sentiment": sentiment_result["label"],
        "sentiment_score": sentiment_result["score"],
        "impact": llm_result.get("impact_score", 0.0),
        "entities": llm_result.get("entities", []),
        "affected_symbols": llm_result.get("affected_symbols", []),
        "explanation": llm_result.get("explanation", ""),
    }

    logger.info(
        "news_analysis_complete",
        sentiment=result["sentiment"],
        impact=result["impact"],
        entities_count=len(result["entities"]),
    )

    return result


async def analyze_text_lite(text: str) -> Dict[str, Any]:
    """
    Lightweight analysis using only FinBERT (no LLM call).
    Useful as a fast fallback or for cost-saving.
    """
    sentiment_result = await analyze_sentiment(text)

    return {
        "sentiment": sentiment_result["label"],
        "sentiment_score": sentiment_result["score"],
        "impact": _estimate_impact_from_sentiment(sentiment_result),
        "entities": [],
        "affected_symbols": [],
        "explanation": f"Sentiment: {sentiment_result['label']} ({sentiment_result['score']:.2f})",
    }


def _estimate_impact_from_sentiment(sentiment: Dict[str, Any]) -> float:
    """Rough impact estimate based on sentiment strength."""
    score = sentiment["score"]
    label = sentiment["label"]

    if label == "neutral":
        return score * 2  # Low impact
    else:
        return min(score * 8, 10.0)  # Scale up for non-neutral
