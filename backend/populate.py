import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

from app.core.agents.news_agent import fetch_and_store

async def main():
    print("Environment variables loaded:")
    print("GNEWS_API_KEY:", os.getenv("GNEWS_API_KEY"))
    print("ET_RSS_URL:", os.getenv("ET_RSS_URL"))
    
    print("\nStarting news fetch, store, and AI analysis process...")
    try:
        new_ids = await fetch_and_store(analyze=True)
        print(f"Successfully processed {len(new_ids)} articles with AI analysis.")
    except Exception as e:
        print(f"Error during fetching: {e}")

if __name__ == "__main__":
    asyncio.run(main())
