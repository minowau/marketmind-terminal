from app.db.session import get_session
from app.db.models import Prediction, Signal
from sqlmodel import select

def check():
    with get_session() as session:
        preds = session.exec(select(Prediction)).all()
        print(f"Total Predictions: {len(preds)}")
        for p in preds:
            print(f"Prediction: ID={p.id}, Symbol={p.symbol}, SignalID={p.signal_id}")
        
        signals = session.exec(select(Signal)).all()
        print(f"Total Signals: {len(signals)}")
        for s in signals:
            print(f"Signal: ID={s.id}, Symbol={s.symbol}, Score={s.signal_score}")

if __name__ == "__main__":
    check()
