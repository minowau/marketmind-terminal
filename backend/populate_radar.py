import asyncio
import json
from datetime import datetime, timedelta
from app.db.session import get_session
from app.db.models import Signal, Prediction, Stock
from app.core.agents.market_agent import fetch_and_update_stock

TOP_6 = [
    {"symbol": "INFY", "company": "Infosys Ltd", "score": 8.2, "trigger": "$1B AI contract win"},
    {"symbol": "TATAMOTORS", "company": "Tata Motors", "score": 7.8, "trigger": "EV sales surge 40% YoY"},
    {"symbol": "HDFC", "company": "HDFC Bank", "score": 8.5, "trigger": "Q4 earnings beat estimates"},
    {"symbol": "RELIANCE", "company": "Reliance Industries", "score": 6.2, "trigger": "Jio 5G expansion complete"},
    {"symbol": "TCS", "company": "Tata Consultancy", "score": 7.9, "trigger": "Major cloud deal signed"},
    {"symbol": "WIPRO", "company": "Wipro Ltd", "score": 5.8, "trigger": "CEO transition announced"},
]

async def populate_radar():
    print("Populating Opportunity Radar with Top 6 companies...")
    
    with get_session() as session:
        for item in TOP_6:
            symbol = item["symbol"]
            print(f"  Processing {symbol}...")
            
            # Ensure stock exists
            await fetch_and_update_stock(symbol)
            
            # Create a high-quality signal
            signal = Signal(
                symbol=symbol,
                signal_score=item["score"],
                reason=item["trigger"],
                trigger=item["trigger"],
                confidence=0.85,
                created_at=datetime.utcnow()
            )
            session.add(signal)
            session.flush()
            
            # Create a matching prediction
            prediction = Prediction(
                symbol=symbol,
                signal_id=signal.id,
                buy_probability=0.75 if item["score"] > 6 else 0.55,
                expected_min_pct=round(item["score"] * 0.2, 1),
                expected_max_pct=round(item["score"] * 0.5, 1),
                confidence=0.82,
                rationale=f"System generated high-conviction signal based on {item['trigger']}.",
                created_at=datetime.utcnow()
            )
            session.add(prediction)
        
        session.commit()
    print("Radar population complete.")

if __name__ == "__main__":
    asyncio.run(populate_radar())
