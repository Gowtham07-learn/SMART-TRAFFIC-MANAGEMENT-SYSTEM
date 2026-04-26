import redis.asyncio as aioredis
from config import settings

_redis = None

async def init_redis():
    global _redis
    _redis = await aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    return _redis

async def get_redis():
    return _redis

def get_redis_sync():
    return _redis
