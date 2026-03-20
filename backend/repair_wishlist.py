import requests
import json

base_url = "http://localhost:8000/api/v1/wishlist"

def repair_wishlist():
    # 1. Get current wishlist
    res = requests.get(base_url)
    items = res.json()
    symbols = [item['symbol'] for item in items]
    print(f"Current wishlist: {symbols}")

    for symbol in symbols:
        print(f"Re-adding {symbol} to trigger bootstrap...")
        # Delete
        requests.delete(f"{base_url}/{symbol}")
        # Add (this triggers the new bootstrap logic)
        res = requests.post(base_url, json={"symbol": symbol})
        if res.status_code == 200:
            data = res.json()
            print(f"  Success! Prediction: {data.get('prediction')}")
        else:
            print(f"  Failed: {res.text}")

if __name__ == "__main__":
    repair_wishlist()
