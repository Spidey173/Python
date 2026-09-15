"""
Distributed-Ready Rate Limiter for PyForge Authentication.
Supports Redis / Valkey / Upstash for distributed deployments with automatic
in-memory fallback for local development and testing.
"""
import time
import logging
from typing import Optional, Tuple
from app.config import settings

logger = logging.getLogger("pyforge.rate_limiter")


class RateLimiter:
    def __init__(self, redis_url: Optional[str] = None):
        self.redis_url = redis_url
        self._redis_client = None
        self._memory_fails: dict[str, list[float]] = {}
        self._memory_locks: dict[str, float] = {}

    async def _get_redis(self):
        if self._redis_client is None and self.redis_url:
            try:
                import redis.asyncio as aioredis
                self._redis_client = aioredis.from_url(
                    self.redis_url,
                    encoding="utf-8",
                    decode_responses=True,
                    socket_connect_timeout=1.0,
                )
                await self._redis_client.ping()
                logger.info("Connected to Redis for distributed rate limiting.")
            except Exception as e:
                logger.warning(f"Could not connect to Redis ({e}). Falling back to in-memory rate limiting.")
                self._redis_client = None
        return self._redis_client

    async def is_locked(self, key: str) -> Tuple[bool, int]:
        """
        Check if an identifier/IP is currently locked out.
        Returns: (is_locked: bool, retry_after_seconds: int)
        """
        redis = await self._get_redis()
        lock_key = f"pyforge:lock:{key}"

        if redis:
            try:
                ttl = await redis.ttl(lock_key)
                if ttl > 0:
                    return True, ttl
                return False, 0
            except Exception as e:
                logger.warning(f"Redis check failed, falling back to memory: {e}")

        # In-memory fallback
        now = time.time()
        lock_expiry = self._memory_locks.get(key, 0)
        if lock_expiry > now:
            return True, max(1, int(lock_expiry - now))
        elif key in self._memory_locks:
            del self._memory_locks[key]

        return False, 0

    async def record_failure(
        self,
        key: str,
        max_attempts: int = 5,
        window_seconds: int = 60,
        lockout_seconds: int = 30
    ) -> Tuple[bool, int]:
        """
        Record a failed attempt. If attempts exceed max_attempts, initiate lockout.
        Returns: (is_now_locked: bool, retry_after_seconds: int)
        """
        redis = await self._get_redis()
        fail_key = f"pyforge:fail:{key}"
        lock_key = f"pyforge:lock:{key}"

        if redis:
            try:
                count = await redis.incr(fail_key)
                if count == 1:
                    await redis.expire(fail_key, window_seconds)
                if count >= max_attempts:
                    await redis.set(lock_key, "1", ex=lockout_seconds)
                    await redis.delete(fail_key)
                    return True, lockout_seconds
                return False, 0
            except Exception as e:
                logger.warning(f"Redis record failed, falling back to memory: {e}")

        # In-memory fallback
        now = time.time()
        timestamps = [ts for ts in self._memory_fails.get(key, []) if ts > now - window_seconds]
        timestamps.append(now)
        self._memory_fails[key] = timestamps

        if len(timestamps) >= max_attempts:
            self._memory_locks[key] = now + lockout_seconds
            self._memory_fails.pop(key, None)
            return True, lockout_seconds

        return False, 0

    async def clear_failures(self, key: str):
        """Reset failed attempts on successful login."""
        redis = await self._get_redis()
        fail_key = f"pyforge:fail:{key}"
        lock_key = f"pyforge:lock:{key}"

        if redis:
            try:
                await redis.delete(fail_key, lock_key)
            except Exception:
                pass

        self._memory_fails.pop(key, None)
        self._memory_locks.pop(key, None)


# Global singleton
rate_limiter = RateLimiter(redis_url=settings.REDIS_URL)
