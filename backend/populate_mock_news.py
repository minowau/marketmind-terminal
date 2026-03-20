import asyncio
import json
from datetime import datetime, timedelta
from app.db.session import get_session
from app.db.models import News, NewsAnalysis
from sqlmodel import delete, select

MOCK_NEWS = [
    {
        "title": "HDFC Bank Reports Record Q4 Profits; Beats Analyst Estimates by 15%",
        "summary": "India's largest private lender, HDFC Bank, has posted a stellar performance for the final quarter, driven by strong loan growth and improved asset quality.",
        "symbol": "HDFC",
        "sentiment": "positive",
        "impact": 8.5,
        "rationale": "Strong earnings combined with a healthy NIM (Net Interest Margin) expansion makes HDFC a top pick for the banking sector this quarter."
    },
    {
        "title": "Infosys Secures Massive $2.5 Billion AI Transformation Deal with Global Retail Giant",
        "summary": "Infosys has announced its largest-ever deal in the AI space, signaling a major shift in the IT services landscape as enterprise AI spending accelerates.",
        "symbol": "INFY",
        "sentiment": "positive",
        "impact": 9.2,
        "rationale": "This landmark deal provides multi-year revenue visibility and positions Infosys as a leader in the lucrative GenAI implementation market."
    },
    {
        "title": "Tata Motors EV Sales Skyrocket by 55% as New Nexon EV Variant Dominates Market",
        "summary": "Tata Motors continues its undisputed leadership in the Indian EV market, reporting record-breaking sales figures for the recent quarter.",
        "symbol": "TATAMOTORS",
        "sentiment": "positive",
        "impact": 8.0,
        "rationale": "With over 70% market share in EVs, Tata Motors is the primary beneficiary of the accelerating adoption of electric mobility in India."
    },
    {
        "title": "Reliance Industries to Expand Jio 5G Services to 10,000 More Rural Towns",
        "summary": "Reliance Jio is doubling down on its 5G dominance, aiming to provide high-speed connectivity to the remotest parts of the country by year-end.",
        "symbol": "RELIANCE",
        "sentiment": "positive",
        "impact": 7.5,
        "rationale": "Rural 5G expansion will drive ARPU growth as users upgrade from legacy networks to Jio's high-speed ecosystem."
    },
    {
        "title": "Global Tech Sell-Off Weighs on Indian IT Stocks; TCS and Wipro Face Volatility",
        "summary": "Concerns over high valuations in the global tech sector have triggered a localized sell-off in major Indian IT firms despite strong fundamentals.",
        "symbol": "TCS",
        "sentiment": "negative",
        "impact": 4.5,
        "rationale": "Short-term technical weakness is expected due to global cues, though long-term deal pipelines remain robust."
    },
    {
        "title": "Adani Power Energy Transition Strategy Receives Boost from Green Energy Bond Issuance",
        "summary": "Adani Power has successfully raised $500M through green bonds to fund its transition towards more sustainable energy production methods.",
        "symbol": "ADANIPOWER",
        "sentiment": "positive",
        "impact": 6.8,
        "rationale": "Improved ESG rating and access to low-cost capital for green projects will reduce long-term debt servicing costs."
    }
]

async def populate_news():
    print("Clearing old news and populating high-quality mocks...")
    
    with get_session() as session:
        # Clear existing
        session.exec(delete(NewsAnalysis))
        session.exec(delete(News))
        session.commit()
        
        for i, item in enumerate(MOCK_NEWS):
            print(f"  Adding news for {item['symbol']}...")
            
            # 1. Create News record
            news = News(
                title=item["title"],
                summary=item["summary"],
                url=f"https://marketmind.ai/news/mock-{i}",
                source="MarketMind Premium",
                published_at=datetime.utcnow() - timedelta(minutes=i*10)
            )
            session.add(news)
            session.flush() # Get the ID
            
            # 2. Create NewsAnalysis record
            analysis = NewsAnalysis(
                news_id=news.id,
                sentiment=item["sentiment"],
                impact_score=item["impact"],
                entities=json.dumps([{ "symbol": item["symbol"], "name": item["symbol"], "type": "company" }]),
                analysis_text=item["rationale"]
            )
            session.add(analysis)
        
        session.commit()
    print("News population complete.")

if __name__ == "__main__":
    asyncio.run(populate_news())
