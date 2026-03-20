from app.db.session import get_session
from app.db.models import Prediction, Wishlist
from sqlmodel import select

def get_verdicts():
    with get_session() as session:
        wishlist = session.exec(select(Wishlist)).all()
        print("="*50)
        print(f"{'SYMBOL':<15} | {'VERDICT':<8} | {'PROB':<5} | {'EXPECTED MOVE':<15}")
        print("-"*50)
        for item in wishlist:
            p = session.exec(
                select(Prediction)
                .where(Prediction.symbol == item.symbol)
                .order_by(Prediction.created_at.desc())
            ).first()
            
            if p:
                verdict = "BUY" if p.buy_probability > 0.6 else "SELL" if p.buy_probability < 0.4 else "HOLD"
                prob = f"{p.buy_probability:.2f}"
                move = f"{p.expected_min_pct}% to {p.expected_max_pct}%"
                print(f"{item.symbol:<15} | {verdict:<8} | {prob:<5} | {move:<15}")
            else:
                print(f"{item.symbol:<15} | {'N/A':<8} | {'---':<5} | {'Calculated soon'}")
        print("="*50)

if __name__ == "__main__":
    get_verdicts()
