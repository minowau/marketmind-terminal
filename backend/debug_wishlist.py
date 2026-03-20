import requests
import json

url = "http://localhost:8000/api/v1/wishlist/"

def debug_wishlist():
    res = requests.get(url)
    print(f"Status: {res.status_code}")
    items = res.json()
    for item in items:
        print(f"Symbol: {item['symbol']}")
        print(f"  Stock: {item['stock'] is not None}")
        print(f"  Prediction: {item.get('prediction')}")
        print(f"  Signals Count: {len(item.get('latest_signals', []))}")
        if item.get('latest_signals'):
             print(f"  Latest Signal Score: {item['latest_signals'][0]['signal_score']}")

if __name__ == "__main__":
    debug_wishlist()
