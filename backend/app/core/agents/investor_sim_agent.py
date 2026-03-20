"""
MarketMind AI v2 — Investor Simulation Agent
Runs multiple simulated investor agents with different strategies.
Each agent evaluates signals and produces BUY/SELL/HOLD actions.
Events are broadcast via Redis pub/sub for real-time UI updates.
"""

import json
import uuid
import random
from typing import List, Dict, Any, Optional
from datetime import datetime

from app.db.models import AgentAction, Signal
from app.db.session import get_session
from app.utils.logging import get_logger

logger = get_logger(__name__)

# ── Agent Strategy Definitions ──

AGENT_TYPES = {
    "FOMO": {
        "description": "Trend-following, buys on strong positive signals",
        "buy_threshold": 3.0,
        "sell_threshold": -2.0,
        "risk_appetite": 0.8,
    },
    "VALUE": {
        "description": "Contrarian value investor, buys beaten-down quality stocks",
        "buy_threshold": 5.0,
        "sell_threshold": -1.0,
        "risk_appetite": 0.3,
    },
    "MOMENTUM": {
        "description": "Momentum trader, follows strong directional moves",
        "buy_threshold": 4.0,
        "sell_threshold": -3.0,
        "risk_appetite": 0.7,
    },
    "CONTRARIAN": {
        "description": "Goes against the crowd; buys on panic, sells on euphoria",
        "buy_threshold": -3.0,  # Buys when signal is very negative (panic)
        "sell_threshold": 4.0,  # Sells when euphoria
        "risk_appetite": 0.4,
    },
    "INSTITUTIONAL": {
        "description": "Large-cap focused, conservative, high conviction plays only",
        "buy_threshold": 6.0,
        "sell_threshold": -4.0,
        "risk_appetite": 0.2,
    },
    "DAY_TRADER": {
        "description": "Short-term, quick trades, responsive to any signal",
        "buy_threshold": 1.5,
        "sell_threshold": -1.5,
        "risk_appetite": 0.9,
    },
}

# Number of agents of each type to simulate
AGENTS_PER_TYPE = 5


def _create_agent_id(agent_type: str, index: int) -> str:
    """Create a deterministic agent ID."""
    return f"{agent_type}_{index:03d}"


def _decide_action(
    agent_type: str,
    strategy: Dict[str, Any],
    signal_score: float,
    confidence: float,
) -> Dict[str, Any]:
    """
    Decide BUY/SELL/HOLD based on agent strategy and signal.
    Returns action dict with action, size, and reasoning.
    """
    buy_thresh = strategy["buy_threshold"]
    sell_thresh = strategy["sell_threshold"]
    risk = strategy["risk_appetite"]

    # Add some randomness to simulate individuality
    noise = random.gauss(0, 0.5)
    adjusted_score = signal_score + noise

    if agent_type == "CONTRARIAN":
        # Contrarian logic: buy when everyone is panicking
        if adjusted_score <= buy_thresh:
            size = abs(adjusted_score) * risk * confidence * 1000
            return {
                "action": "BUY",
                "size": round(size, 2),
                "reasoning": f"Contrarian buy on panic (signal={signal_score:.1f})",
            }
        elif adjusted_score >= sell_thresh:
            size = adjusted_score * risk * confidence * 800
            return {
                "action": "SELL",
                "size": round(size, 2),
                "reasoning": f"Contrarian sell on euphoria (signal={signal_score:.1f})",
            }
    else:
        # Standard directional logic
        if adjusted_score >= buy_thresh:
            size = adjusted_score * risk * confidence * 1000
            return {
                "action": "BUY",
                "size": round(size, 2),
                "reasoning": f"{agent_type} buy signal triggered (score={signal_score:.1f})",
            }
        elif adjusted_score <= sell_thresh:
            size = abs(adjusted_score) * risk * confidence * 800
            return {
                "action": "SELL",
                "size": round(size, 2),
                "reasoning": f"{agent_type} sell signal triggered (score={signal_score:.1f})",
            }

    return {
        "action": "HOLD",
        "size": 0,
        "reasoning": f"{agent_type} holding (signal={signal_score:.1f}, threshold not met)",
    }


def run_simulation(
    symbol: str,
    signal_score: float,
    confidence: float,
    signal_id: Optional[int] = None,
) -> List[Dict[str, Any]]:
    """
    Run the full investor simulation for a given signal.
    Spawns multiple agents of each type, records their actions.

    Returns list of agent action events.
    """
    logger.info(
        "simulation_started",
        symbol=symbol,
        signal_score=signal_score,
        confidence=confidence,
    )

    events = []

    with get_session() as session:
        for agent_type, strategy in AGENT_TYPES.items():
            for i in range(AGENTS_PER_TYPE):
                agent_id = _create_agent_id(agent_type, i)
                decision = _decide_action(agent_type, strategy, signal_score, confidence)

                # Store action in DB
                action = AgentAction(
                    agent_id=agent_id,
                    agent_type=agent_type,
                    symbol=symbol,
                    action=decision["action"],
                    size=decision["size"],
                    reasoning=decision["reasoning"],
                    signal_id=signal_id,
                    timestamp=datetime.utcnow(),
                )
                session.add(action)

                # Build event for broadcasting
                event = {
                    "type": "agent_action",
                    "agent_id": agent_id,
                    "agent_type": agent_type,
                    "symbol": symbol,
                    "action": decision["action"],
                    "size": decision["size"],
                    "reasoning": decision["reasoning"],
                    "timestamp": datetime.utcnow().isoformat(),
                }
                events.append(event)

        session.commit()

    logger.info(
        "simulation_completed",
        symbol=symbol,
        total_actions=len(events),
        buys=sum(1 for e in events if e["action"] == "BUY"),
        sells=sum(1 for e in events if e["action"] == "SELL"),
        holds=sum(1 for e in events if e["action"] == "HOLD"),
    )

    return events


def publish_events_to_redis(events: List[Dict[str, Any]]) -> None:
    """Publish agent action events to Redis pub/sub for WebSocket broadcast."""
    try:
        import redis
        from app.config import settings

        r = redis.Redis.from_url(settings.REDIS_URL)

        for event in events:
            r.publish("sim:events", json.dumps(event))

        logger.info("events_published_to_redis", count=len(events))
    except Exception as e:
        logger.error("redis_publish_error", error=str(e))
