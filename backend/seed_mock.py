import asyncio
import os
import json
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

from app.db.session import get_session
from app.db.models import News, NewsAnalysis

def seed_mock_news():
    print("Seeding a rich mock news item...")
    
    with get_session() as session:
        # 1. Create the News article
        mock_news = News(
            external_id="mock-premium-001",
            title="Reliance Industries Announces Strategic 5G Expansion & Record Q3 Earnings",
            summary="Reliance Industries (RIL) has reported a 15% increase in quarterly profits, surpassing analyst estimates. Additionally, the company announced a new $2B investment in 5G infrastructure to cover rural India by 2027.",
            url="https://example.com/ril-q3-results",
            source="MarketMind Exclusive",
            published_at=datetime.utcnow()
        )
        session.add(mock_news)
        session.flush() # Get the ID
        
        # 2. Create the AI Analysis
        mock_analysis = NewsAnalysis(
            news_id=mock_news.id,
            sentiment="positive",
            impact_score=8.5,
            entities=json.dumps(["RELIANCE", "JIOFIN", "TATACOMM"]),
            analysis_text="Extraordinary performance in energy and retail combined with aggressive 5G expansion confirms long-term bullish outlook. Expect 4-6% short-term price appreciation as institutional investors rebalance portfolios."
        )
        session.add(mock_analysis)
        session.commit()
        
    print(f"Successfully seeded mock news item with ID: {mock_news.id}")

if __name__ == "__main__":
    seed_mock_news()
