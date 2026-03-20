import asyncio
import json
import random
import redis
from datetime import datetime
from app.config import settings

# Strategy/Agent Types from investor_sim_agent.py
AGENT_TYPES = ["FOMO", "VALUE", "MOMENTUM", "CONTRARIAN", "INSTITUTIONAL", "DAY_TRADER"]
SYMBOLS = ["INFY", "TATAMOTORS", "HDFC", "RELIANCE", "TCS", "WIPRO", "HDFCBANK", "SBIN"]

def get_random_action():
    agent_type = random.choice(AGENT_TYPES)
    symbol = random.choice(SYMBOLS)
    action = random.choice(["BUY", "SELL"])
    size = random.randint(10000, 500000)
    
    return {
        "type": "agent_action",
        "agent_id": f"{agent_type}_{random.randint(1, 100):03d}",
        "agent_type": agent_type,
        "symbol": symbol,
        "action": action,
        "size": size,
        "reasoning": f"Simulated {action} pressure based on market volatility.",
        "timestamp": datetime.utcnow().isoformat()
    }

async def stream_events():
    print(f"Connecting to Redis at {settings.REDIS_URL}...")
    try:
        r = redis.Redis.from_url(settings.REDIS_URL)
        print("Broadcasting simulation events to 'sim:events' channel...")
        
        action_count = 0
        while True:
            # Generate 1-3 events per "burst"
            for _ in range(random.randint(1, 3)):
                event = get_random_action()
                r.publish("sim:events", json.dumps(event))
                print(f" [EVENT] {event['agent_type']} {event['action']} {event['symbol']} - ₹{event['size']/1000:.0f}K")
                action_count += 1
            
            # Every 15-20 actions, send a prediction event with rationale
            if action_count >= 15:
                symbol = random.choice(SYMBOLS)
                pred_event = {
                    "type": "prediction",
                    "symbol": symbol,
                    "buy_probability": random.uniform(0.3, 0.9),
                    "rationale": f"Based on {action_count} simulated agent actions for {symbol}, the consensus leans towards a {'BULLISH' if action_count % 2 == 0 else 'BEARISH'} outlook. Volume metrics indicate strong institutional support.",
                    "timestamp": datetime.utcnow().isoformat()
                }
                r.publish("sim:events", json.dumps(pred_event))
                print(f" [PREDICTION] {symbol} - {pred_event['rationale'][:50]}...")
                action_count = 0

            # Wait 1-4 seconds between bursts
            await asyncio.sleep(random.uniform(1.0, 4.0))
            
    except Exception as e:
        print(f"Error in stream_events: {e}")

if __name__ == "__main__":
    asyncio.run(stream_events())
