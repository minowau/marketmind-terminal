import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

from app.db.session import get_db
from app.db.models import News, NewsAnalysis
from sqlalchemy import select

async def check():
    async for db in get_db():
        result = await db.execute(select(News).order_by(News.id.desc()).limit(5))
        news_list = result.scalars().all()
        
        if not news_list:
            print("NO NEWS FOUND")
            return

        for news in news_list:
            print(f"--- NEWS ID: {news.id} ---")
            print(f"TITLE: {news.title}")
            print(f"SUMMARY (len={len(news.summary or '')}): {news.summary[:100]}...")
            
            analysis_result = await db.execute(select(NewsAnalysis).where(NewsAnalysis.news_id == news.id))
            analysis = analysis_result.scalars().first()
            if analysis:
                print(f"ANALYSIS: sentiment={analysis.sentiment}, impact={analysis.impact_score}")
                print(f"ANALYSIS TEXT (len={len(analysis.analysis_text or '')}): {analysis.analysis_text[:100]}...")
            else:
                print("NO ANALYSIS FOUND")
        break

if __name__ == "__main__":
    asyncio.run(check())
