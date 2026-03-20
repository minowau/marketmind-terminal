import pytest
from app.core.orchestrator import create_signal_from_analysis

def test_create_signal_logic(mocker):
    # Mocking DB session to avoid needing a real DB for logic test
    mock_session = mocker.patch("app.core.orchestrator.get_session")
    
    # Very positive news + bullish technicals -> High positive score
    impact = 8.0
    signal1 = create_signal_from_analysis(
        news_analysis_id=1,
        symbol="RELIANCE",
        impact_score=impact,
        sentiment="positive",
        technical_signal="bullish",
        trigger="Good earnings"
    )
    
    # Score math: 
    # sentiments: 8.0 * 1.0 * 0.6 = 4.8
    # technicals: 8.0 * 1.2 * 0.4 = 3.84
    # Expected: 8.64
    assert round(signal1.signal_score, 2) == 8.64
    assert signal1.confidence >= 0.5
    
    # Very negative news + bearish technicals -> High negative score
    signal2 = create_signal_from_analysis(
        news_analysis_id=2,
        symbol="TATAMOTORS",
        impact_score=10.0,
        sentiment="negative",
        technical_signal="bearish",
        trigger="Bad earnings"
    )
    
    # Expected: (10 * -1 * 0.6) + (10 * -1.2 * 0.4) = -6 - 4.8 = -10.8 -> clapped to -10.0
    assert signal2.signal_score == -10.0
