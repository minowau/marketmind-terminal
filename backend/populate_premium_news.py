
import asyncio
import json
import random
from datetime import datetime, timedelta
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import SessionLocal
from app.db.models import News, NewsAnalysis

PREMIUM_NEWS = [
    {
        "symbol": "RELIANCE",
        "title": "Reliance Industries Unveils Mega $10bn Green Energy Expansion Plan",
        "summary": "Mukesh Ambani announced a significant escalation in Reliance's renewable energy roadmap, targeting a 20% increase in solar giga-factory capacity by 2026. Analysts see this as a pivot towards long-term ESG stability.",
        "source": "Bloomberg Quint",
        "sentiment": "positive",
        "impact": 0.85,
        "analysis": "The massive capital commitment signals RIL's aggressive stance in the global energy transition. This move is expected to de-risk its traditional petrochem business and attract institutional ESG funds."
    },
    {
        "symbol": "TCS",
        "title": "TCS Secures $2.5bn Strategic Digital Transformation Deal with UK Retail Giant",
        "summary": "Tata Consultancy Services won one of its largest contracts this year, a multi-year cloud-first initiative for a Tier-1 UK retailer. The deal includes AI-driven supply chain optimization.",
        "source": "Reuters Business",
        "sentiment": "positive",
        "impact": 0.92,
        "analysis": "A contract of this magnitude reinforces TCS's dominance in the UK market and its ability to win high-margin digital transformation projects despite global macro headwinds."
    },
    {
        "symbol": "HDFC",
        "title": "HDFC Bank Q4 Net Profit Surges 18% as Asset Quality Remains Robust",
        "summary": "India's largest private lender reported strong credit growth in the retail segment. Net Interest Margin (NIM) stable at 4.1%, beating street estimates.",
        "source": "Financial Times",
        "sentiment": "positive",
        "impact": 0.78,
        "analysis": "Resilient asset quality during a period of rising interest rates proves HDFC Bank's superior risk management. Strong retail credit demand continues to drive the bottom line."
    },
    {
        "symbol": "WIPRO",
        "title": "Wipro Guides for Modest Revenue Growth Amid Muted IT Spending in Europe",
        "summary": "Wipro's latest guidance reflects slowing discretionary spend in the EU financial services sector. CEO emphasizes focus on AI-first restructuring.",
        "source": "Economic Times",
        "sentiment": "negative",
        "impact": 0.65,
        "analysis": "Wipro remains the most vulnerable among Tier-1 IT peers to European macro fluctuations. The restructuring costs might weigh on margins in the next two quarters."
    },
    {
        "symbol": "PAYTM",
        "title": "Paytm Receives Crucial NPCI License for Third-Party App Provider Status",
        "summary": "The National Payments Corporation of India (NPCI) has granted Paytm the TPAP license, allowing it to continue UPI operations seamlessly through partner banks.",
        "source": "CNBC-TV18",
        "sentiment": "positive",
        "impact": 0.88,
        "analysis": "This is a major regulatory breakthrough for Paytm, removing the survival risk associated with its payment bank restrictions. UPI business continuity is now stabilized."
    },
    {
        "symbol": "INFOSYS",
        "title": "Infosys Bags $1.5bn AI Infrastructure Deal with Global Tech Conglomerate",
        "summary": "Infosys Topaz platform chosen for a massive generative AI scaling project. The deal involves automating legacy systems for a Fortune 500 company.",
        "source": "Wall Street Journal",
        "sentiment": "positive",
        "impact": 0.82,
        "analysis": "Infosys's early investment in generative AI via the Topaz platform is paying off with large-scale contract wins, positioning it ahead of slower competitors."
    },
    {
        "symbol": "RELIANCE",
        "title": "Jio Financial Services Eyes 5% Market Share in Consumer Credit by 2025",
        "summary": "Jio Financial Services is launching a suite of digital lending products integrated into the MyJio ecosystem, targeting rural and semi-urban markets.",
        "source": "Business Standard",
        "sentiment": "positive",
        "impact": 0.75,
        "analysis": "The deep distribution network of Reliance Retail and Jio provides an unfair advantage for the fintech arm to disrupt the consumer lending space with low acquisition costs."
    },
    {
        "symbol": "TCS",
        "title": "TCS Announces Dividend of ₹28 per Share Following Strong Cash Flow Generation",
        "summary": "The board of directors declared an interim dividend, rewarding shareholders after a quarter of record-high free cash flow conversion.",
        "source": "Mint",
        "sentiment": "neutral",
        "impact": 0.45,
        "analysis": "Steady dividend payouts reflect TCS's cash-rich balance sheet and commitment to shareholder returns, even as the global IT outlook remains cautious."
    },
    {
        "symbol": "PAYTM",
        "title": "Paytm Experiences Significant User Churn Following Regulatory Directives",
        "summary": "Latest data suggests a 15% drop in monthly active users as consumers shift towards competitors amidst uncertainty over wallet services.",
        "source": "The Hindu Business Line",
        "sentiment": "negative",
        "impact": 0.72,
        "analysis": "Regaining consumer trust will be a long-term challenge. Despite the TPAP license, the loss of the 'wallet' ecosystem creates a friction point for non-bank users."
    },
    {
        "symbol": "INFOSYS",
        "title": "Infosys Co-Founder Warns of Talent War in AI Engineering as Demand Peaks",
        "summary": "During an industry keynote, Narayana Murthy highlighted the acute shortage of senior AI architects in India, urging faster skill development.",
        "source": "NDTV Profit",
        "sentiment": "neutral",
        "impact": 0.35,
        "analysis": "Rising wage inflation for specialized AI talent could thin the margins for Infosys if they fail to improve employee utilization and pricing leverage."
    }
]

async def populate():
    async with SessionLocal() as db:
        # Clear existing news
        await db.execute(delete(NewsAnalysis))
        await db.execute(delete(News))
        await db.commit()
        
        for i, item in enumerate(PREMIUM_NEWS):
            # Create News
            news = News(
                external_id=f"premium_news_{i}_{random.randint(1000, 9999)}",
                title=item["title"],
                summary=item["summary"],
                source=item["source"],
                published_at=datetime.utcnow() - timedelta(hours=random.randint(1, 48)),
                url=f"https://{item['source'].lower().replace(' ', '')}.com/article/{i}"
            )
            db.add(news)
            await db.flush() # Get ID
            
            # Create Analysis
            analysis = NewsAnalysis(
                news_id=news.id,
                sentiment=item["sentiment"],
                impact_score=item["impact"],
                entities=json.dumps([item["symbol"]]),
                analysis_text=item["analysis"]
            )
            db.add(analysis)
            
        await db.commit()
        print(f"Successfully populated {len(PREMIUM_NEWS)} premium news items.")

if __name__ == "__main__":
    asyncio.run(populate())
