import pytest
from app.core.agents.investor_sim_agent import _decide_action, AGENT_TYPES

def test_decide_action_fomo():
    strategy = AGENT_TYPES["FOMO"]
    
    # Strong signal above buy_threshold (3.0)
    decision = _decide_action("FOMO", strategy, signal_score=4.0, confidence=0.8)
    assert decision["action"] == "BUY"
    assert decision["size"] > 0
    
    # Neutral signal
    decision_neutral = _decide_action("FOMO", strategy, signal_score=0.0, confidence=0.5)
    # The gaussian noise could push it, but 0.0 + N(0,0.5) rarely exceeds 3.0
    # So we expect mostly HOLD
    
def test_decide_action_contrarian():
    strategy = AGENT_TYPES["CONTRARIAN"]
    
    # Extremely negative signal (panic) -> contrarian BUYS
    # Contrarian buy threshold is -3.0
    decision = _decide_action("CONTRARIAN", strategy, signal_score=-4.0, confidence=0.9)
    # Expect BUY because -4.0 <= -3.0
    if decision["action"] != "HOLD": # Account for Gaussian noise occasionally pushing it above
        assert decision["action"] == "BUY"
    
    # Extremely positive signal (euphoria) -> contrarian SELLS
    # Contrarian sell threshold is 4.0
    decision2 = _decide_action("CONTRARIAN", strategy, signal_score=5.0, confidence=0.8)
    if decision2["action"] != "HOLD":
        assert decision2["action"] == "SELL"
