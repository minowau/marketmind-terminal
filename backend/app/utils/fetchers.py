"""
MarketMind AI v2 — News Fetchers
Fetch and normalize news from Economic Times RSS, GNews API, and other sources.
"""

import hashlib
import httpx
import feedparser
from typing import List, Dict, Any, Optional
from datetime import datetime

from app.config import settings
from app.utils.logging import get_logger

logger = get_logger(__name__)


def _generate_external_id(url: str, title: str) -> str:
    """Generate a deterministic external ID from URL and title."""
    raw = f"{url}:{title}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:16]


def _parse_published_date(entry: Dict[str, Any]) -> datetime:
    """Extract and parse the published date from a feed entry."""
    published = entry.get("published_parsed") or entry.get("updated_parsed")
    if published:
        from time import mktime
        return datetime.fromtimestamp(mktime(published))
    return datetime.utcnow()


async def fetch_et_rss() -> List[Dict[str, Any]]:
    """
    Fetch and normalize articles from Economic Times RSS feed.
    Returns list of dicts ready for News model creation.
    """
    logger.info("fetching_et_rss", url=settings.ET_RSS_URL)
    articles = []

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(settings.ET_RSS_URL)
            response.raise_for_status()

        feed = feedparser.parse(response.text)

        for entry in feed.entries:
            title = entry.get("title", "").strip()
            summary = entry.get("summary", entry.get("description", "")).strip()
            url = entry.get("link", "")

            if not title:
                continue

            articles.append({
                "external_id": _generate_external_id(url, title),
                "title": title,
                "summary": summary,
                "url": url,
                "source": "EconomicTimes",
                "published_at": _parse_published_date(entry),
            })

        logger.info("et_rss_fetched", count=len(articles))
    except Exception as e:
        logger.error("et_rss_fetch_failed", error=str(e))
        raise

    return articles


async def fetch_gnews(query: str = "India stock market", max_results: int = 20) -> List[Dict[str, Any]]:
    """
    Fetch articles from GNews API.
    Requires GNEWS_API_KEY in settings.
    """
    if not settings.GNEWS_API_KEY:
        logger.warning("gnews_api_key_missing")
        return []

    logger.info("fetching_gnews", query=query)
    articles = []
    url = "https://gnews.io/api/v4/search"
    params = {
        "q": query,
        "lang": "en",
        "max": max_results,
        "apikey": settings.GNEWS_API_KEY,
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()

        for item in data.get("articles", []):
            title = item.get("title", "").strip()
            description = item.get("description", "").strip()
            article_url = item.get("url", "")
            pub_date = item.get("publishedAt", "")

            if not title:
                continue

            published_at = datetime.utcnow()
            if pub_date:
                try:
                    published_at = datetime.fromisoformat(pub_date.replace("Z", "+00:00"))
                except ValueError:
                    pass

            articles.append({
                "external_id": _generate_external_id(article_url, title),
                "title": title,
                "summary": description,
                "url": article_url,
                "source": item.get("source", {}).get("name", "GNews"),
                "published_at": published_at,
            })

        logger.info("gnews_fetched", count=len(articles))
    except Exception as e:
        logger.error("gnews_fetch_failed", error=str(e))
        raise

    return articles


async def fetch_all_news() -> List[Dict[str, Any]]:
    """Fetch from all configured sources and return combined list."""
    all_articles: List[Dict[str, Any]] = []

    # Economic Times RSS
    try:
        et_articles = await fetch_et_rss()
        all_articles.extend(et_articles)
    except Exception:
        logger.warning("et_rss_skipped_due_to_error")

    # GNews API
    try:
        gnews_articles = await fetch_gnews()
        all_articles.extend(gnews_articles)
    except Exception:
        logger.warning("gnews_skipped_due_to_error")

    # Deduplicate by external_id
    seen = set()
    unique = []
    for article in all_articles:
        if article["external_id"] not in seen:
            seen.add(article["external_id"])
            unique.append(article)

    logger.info("total_news_fetched", count=len(unique))
    return unique
