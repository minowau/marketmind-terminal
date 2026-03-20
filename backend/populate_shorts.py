import asyncio
from app.db.session import get_session
from app.db.models import Signal
from datetime import datetime, timedelta

SHORTS = [
    {
        "symbol": "PAYTM",
        "company": "One97 Communications",
        "signal_score": -8.2,
        "confidence": 0.88,
        "trigger": "Regulatory headwinds and increasing competition in payments.",
        "predicted_move_min": -2.5,
        "predicted_move_max": -5.0
    },
    {
        "symbol": "WIPRO",
        "company": "Wipro Limited",
        "signal_score": -4.5,
        "confidence": 0.72,
        "trigger": "Weak guidance for the upcoming quarter and slowing discretionary spend.",
        "predicted_move_min": -1.2,
        "predicted_move_max": -3.0
    }
]

async def populate_shorts():
    print("Adding SHORT signals for demonstration...")
    with get_session() as session:
        for item in SHORTS:
            print(f"  Adding {item['symbol']} (SHORT)...")
            sig = Signal(
                symbol=item["symbol"],
                company=item["company"],
                signal_score=item["signal_score"],
                confidence=item["confidence"],
                trigger=item["trigger"],
                predicted_move_min=item["predicted_move_min"],
                predicted_move_max=item["predicted_move_max"],
                created_at=datetime.utcnow()
            )
            session.add(sig)
        session.commit()
    print("Short signals added.")

if __name__ == "__main__":
    asyncio.run(populate_shorts())
