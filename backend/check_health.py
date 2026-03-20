import asyncio
import asyncpg
import redis.asyncio as redis
import os
from dotenv import load_dotenv

load_dotenv()

async def check_services():
    db_url = os.getenv("DATABASE_URL")
    redis_url = os.getenv("REDIS_URL")
    
    print(f"Checking Database: {db_url}")
    try:
        conn = await asyncpg.connect(db_url)
        await conn.close()
        print("✅ Database is UP")
    except Exception as e:
        print(f"❌ Database is DOWN: {e}")

    print(f"Checking Redis: {redis_url}")
    try:
        r = redis.from_url(redis_url)
        await r.ping()
        await r.aclose()
        print("✅ Redis is UP")
    except Exception as e:
        print(f"❌ Redis is DOWN: {e}")

if __name__ == "__main__":
    asyncio.run(check_services())
