import asyncio
import json
from sqlmodel import select
from app.db.session import get_session
from app.db.models import Wishlist, News, Signal, Prediction, NewsAnalysis
from app.core.agents.news_agent import analyze_new_articles
from app.core.agents.market_agent import fetch_and_update_stock
from app.core.agents.technical_agent import compute_indicators_for_symbol
from app.core.orchestrator import create_signal_from_analysis
from app.core.agents.investor_sim_agent import run_simulation
from app.core.agents.prediction_agent import compute_prediction

async def bulk_populate():
    print("Starting bulk population for wishlist items...")
    
    with get_session() as session:
        wishlist_items = session.exec(select(Wishlist)).all()
        print(f"Found {len(wishlist_items)} items in wishlist.")

    for item in wishlist_items:
        symbol = item.symbol
        print(f"\nProcessing {symbol}...")
        
        # 1. Ensure stock info is fresh
        await fetch_and_update_stock(symbol)
        
        # 2. Check for signals and predictions
        with get_session() as session:
            existing_sig = session.exec(select(Signal).where(Signal.symbol == symbol)).first()
            existing_pred = session.exec(select(Prediction).where(Prediction.symbol == symbol)).first()
        
        if existing_pred:
            print(f"  {symbol} already has a prediction. Skipping.")
            continue
            
        # 3. Try to find news to analyze
        # We look for news that mentions this symbol in title/summary if possible
        # Or just take the most recent 3 news articles and 'assign' them if they aren't analyzed
        with get_session() as session:
            # Simple heuristic: find news that isn't analyzed or just any news
            news_list = session.exec(select(News).limit(2)).all()
            news_ids = [n.id for n in news_list]
        
        if news_ids:
            print(f"  Analyzing {len(news_ids)} news articles for {symbol} context...")
            # This triggers signal -> sim -> prediction synchronously (due to our recent fix)
            await analyze_new_articles(news_ids)
        else:
            print(f"  No news found. Triggering technical bootstrap...")
            tech_res = await compute_indicators_for_symbol(symbol)
            tech_signal = tech_res.get("overall_signal", "neutral")
            
            signal = create_signal_from_analysis(
                news_analysis_id=0,
                symbol=symbol,
                impact_score=5.0,
                sentiment="neutral",
                technical_signal=tech_signal,
                trigger="Manual Bootstrap"
            )
            run_simulation(symbol, signal.signal_score, signal.confidence, signal.id)
            compute_prediction(symbol, signal.id, signal.signal_score)

    # 4. Final Verdict Printout
    print("\n" + "="*40)
    print("FINAL MOCK VERDICT FOR WISHLIST")
    print("="*40)
    with get_session() as session:
        for item in wishlist_items:
            pred = session.exec(
                select(Prediction)
                .where(Prediction.symbol == item.symbol)
                .order_by(Prediction.created_at.desc())
            ).first()
            
            if pred:
                verdict = "BUY" if pred.buy_probability > 0.6 else "SELL" if pred.buy_probability < 0.4 else "HOLD"
                print(f"{item.symbol:12} | Verdict: {verdict:5} | Prob: {pred.buy_probability:.2f} | Move: {pred.expected_min_pct}% to {pred.expected_max_pct}%")
            else:
                print(f"{item.symbol:12} | No prediction generated.")
    print("="*40)

if __name__ == "__main__":
    asyncio.run(bulk_populate())
