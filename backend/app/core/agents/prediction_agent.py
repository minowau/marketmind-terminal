"""
MarketMind AI v2 — Prediction Agent
Aggregates agent actions from simulation → produce buy probability,
expected move band, confidence, and rationale → stores Prediction.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime

from sqlmodel import select
from app.db.models import AgentAction, Prediction
from app.db.session import get_session
from app.utils.logging import get_logger

logger = get_logger(__name__)


def aggregate_actions(
    symbol: str,
    signal_id: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Aggregate agent actions for a symbol/signal into prediction inputs.

    Returns:
        {
            "total_agents": int,
            "buy_count": int,
            "sell_count": int,
            "hold_count": int,
            "buy_volume": float,
            "sell_volume": float,
            "buy_ratio": float,
            "avg_buy_size": float,
            "avg_sell_size": float,
        }
    """
    with get_session() as session:
        query = select(AgentAction).where(AgentAction.symbol == symbol)
        if signal_id:
            query = query.where(AgentAction.signal_id == signal_id)
        query = query.order_by(AgentAction.timestamp.desc())

        results = session.exec(query).all()
        # Extract data immediately to avoid "not bound to session" errors outside the block
        actions = [{"action": a.action, "size": a.size} for a in results]

    if not actions:
        return {
            "total_agents": 0,
            "buy_count": 0, "sell_count": 0, "hold_count": 0,
            "buy_volume": 0, "sell_volume": 0,
            "buy_ratio": 0.5,
            "avg_buy_size": 0, "avg_sell_size": 0,
        }

    buys = [a for a in actions if a.action == "BUY"]
    sells = [a for a in actions if a.action == "SELL"]
    holds = [a for a in actions if a.action == "HOLD"]

    buy_volume = sum(a.size or 0 for a in buys)
    sell_volume = sum(a.size or 0 for a in sells)
    total = len(actions)

    return {
        "total_agents": total,
        "buy_count": len(buys),
        "sell_count": len(sells),
        "hold_count": len(holds),
        "buy_volume": round(buy_volume, 2),
        "sell_volume": round(sell_volume, 2),
        "buy_ratio": round(len(buys) / total, 4) if total > 0 else 0.5,
        "avg_buy_size": round(buy_volume / len(buys), 2) if buys else 0,
        "avg_sell_size": round(sell_volume / len(sells), 2) if sells else 0,
    }


def compute_prediction(
    symbol: str,
    signal_id: Optional[int] = None,
    signal_score: float = 0.0,
) -> Prediction:
    """
    Compute and store a prediction for the given symbol.

    Pipeline:
    1. Aggregate agent actions
    2. Calculate buy probability from buy/sell ratio
    3. Estimate move band based on signal strength and agent conviction
    4. Compute confidence from agent agreement
    5. Generate rationale text
    6. Store Prediction in DB
    """
    agg = aggregate_actions(symbol, signal_id)

    # Buy probability: weighted by volume and count
    if agg["total_agents"] == 0:
        buy_probability = 0.5
    else:
        # Blend count ratio and volume ratio
        count_ratio = agg["buy_ratio"]
        volume_total = agg["buy_volume"] + agg["sell_volume"]
        volume_ratio = (agg["buy_volume"] / volume_total) if volume_total > 0 else 0.5
        buy_probability = round(count_ratio * 0.4 + volume_ratio * 0.6, 4)

    # Expected move band
    base_move = abs(signal_score) * 0.5  # Each signal point ≈ 0.5% move
    expected_min_pct = round(base_move * 0.5, 2)
    expected_max_pct = round(base_move * 1.5, 2)

    # If net bearish, flip to negative
    if buy_probability < 0.45:
        expected_min_pct = -expected_max_pct
        expected_max_pct = -round(base_move * 0.3, 2)

    # Confidence: how much agents agree (low variance = high confidence)
    if agg["total_agents"] > 0:
        majority = max(agg["buy_count"], agg["sell_count"], agg["hold_count"])
        confidence = round(majority / agg["total_agents"], 4)
    else:
        confidence = 0.0

    # Rationale
    rationale = _generate_rationale(agg, buy_probability, signal_score)

    # Store prediction
    with get_session() as session:
        prediction = Prediction(
            symbol=symbol,
            buy_probability=buy_probability,
            expected_min_pct=expected_min_pct,
            expected_max_pct=expected_max_pct,
            confidence=confidence,
            signal_id=signal_id,
            rationale=rationale,
            created_at=datetime.utcnow(),
        )
        session.add(prediction)
        session.commit()
        session.refresh(prediction)

    logger.info(
        "prediction_computed",
        symbol=symbol,
        buy_probability=buy_probability,
        expected_move=f"{expected_min_pct}% to {expected_max_pct}%",
        confidence=confidence,
    )

    return prediction


def _generate_rationale(agg: Dict[str, Any], buy_prob: float, signal_score: float) -> str:
    """Generate human-readable rationale for the prediction."""
    parts = []

    if agg["total_agents"] > 0:
        parts.append(
            f"{agg['total_agents']} simulated agents evaluated: "
            f"{agg['buy_count']} BUY, {agg['sell_count']} SELL, {agg['hold_count']} HOLD."
        )

    if buy_prob > 0.65:
        parts.append("Strong bullish consensus among agents.")
    elif buy_prob > 0.55:
        parts.append("Moderate bullish lean.")
    elif buy_prob < 0.35:
        parts.append("Strong bearish consensus.")
    elif buy_prob < 0.45:
        parts.append("Moderate bearish lean.")
    else:
        parts.append("Mixed signals; no clear consensus.")

    if abs(signal_score) > 6:
        parts.append(f"Signal strength is very high ({signal_score:.1f}).")
    elif abs(signal_score) > 3:
        parts.append(f"Signal strength is moderate ({signal_score:.1f}).")

    return " ".join(parts)
