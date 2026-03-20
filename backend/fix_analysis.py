import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

from app.core.agents.news_agent import analyze_new_articles
from app.db.session import get_db
from app.db.models import News, NewsAnalysis
from sqlalchemy import select

async def run_fix():
    print("Starting AI analysis fix for existing news...")
    async for db in get_db():
        # Find news IDs that don't have an analysis
        query = select(News.id).outerjoin(NewsAnalysis).where(NewsAnalysis.id == None)
        result = await db.execute(query)
        news_ids = result.scalars().all()
        
        if not news_ids:
            print("No news items found missing analysis.")
            return

        print(f"Found {len(news_ids)} news items missing analysis. Starting analysis...")
        
        # We can reuse the analyze_new_articles but we need to pass a list
        # analyze_new_articles uses with get_session() which is sync, 
        # but the project seems to use both sync and async sessions.
        # Let's check news_agent.py again.
        
        from app.core.agents.news_agent import analyze_new_articles
        await analyze_new_articles(news_ids)
        
        print("Analysis fix completed.")
        break

if __name__ == "__main__":
    asyncio.run(run_fix())
