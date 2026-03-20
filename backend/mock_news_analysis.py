from app.db.session import get_session
from app.db.models import News, NewsAnalysis
from sqlmodel import select
import json

def mock_analysis():
    with get_session() as session:
        # Find news without analysis
        news_without_analysis = session.exec(select(News).where(News.id.notin_(select(NewsAnalysis.news_id)))).all()
        print(f"Found {len(news_without_analysis)} news articles without analysis.")
        
        for news in news_without_analysis:
            analysis = NewsAnalysis(
                news_id=news.id,
                sentiment="neutral",
                impact_score=5.0,
                entities=json.dumps(["GENERAL"]),
                analysis_text=f"MOCK ANALYSIS for '{news.title}': No specific market impact expected at this time."
            )
            session.add(analysis)
            print(f"  Added mock analysis for News ID: {news.id}")
        
        session.commit()
        print("Done mocking news analysis.")

if __name__ == "__main__":
    mock_analysis()
