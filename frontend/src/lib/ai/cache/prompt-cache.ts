// In-Memory Response & Prompt Cache
// Speeds up identical requests for common challenge explanations and hints

interface CacheEntry {
  response: string;
  timestamp: number;
}

const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes
const cache = new Map<string, CacheEntry>();

export function getCacheKey(
  challengeId: number,
  intent: string,
  subIntent: string = '',
  tier: number = 1
): string {
  return `${challengeId}:${intent}:${subIntent}:${tier}`;
}

export function getCachedResponse(key: string): string | null {
  const entry = cache.get(key);
  if (!entry) return null;

  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }

  return entry.response;
}

export function setCachedResponse(key: string, response: string): void {
  if (cache.size > 500) {
    // Evict earliest entry
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }

  cache.set(key, {
    response,
    timestamp: Date.now(),
  });
}
