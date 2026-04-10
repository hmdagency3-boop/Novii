/**
 * Cache Utilities for Reducing PostgREST Egress
 * Implements localStorage and memory caching strategies
 */

export interface CacheConfig {
  maxAge?: number; // milliseconds
  key: string;
}

// In-memory cache (fast, lost on refresh)
const memoryCache = new Map<string, { data: any; timestamp: number }>();

// Cache configuration (in milliseconds)
export const CACHE_DURATIONS = {
  PROFILE: 5 * 60 * 1000, // 5 minutes
  POSTS: 3 * 60 * 1000, // 3 minutes
  COMMENTS: 2 * 60 * 1000, // 2 minutes
  STORIES: 1 * 60 * 1000, // 1 minute
  FOLLOWERS: 10 * 60 * 1000, // 10 minutes
  NOTIFICATIONS: 30 * 1000, // 30 seconds
  STATISTICS: 15 * 60 * 1000, // 15 minutes
  TIMEZONES: 24 * 60 * 60 * 1000, // 24 hours (doesn't change often)
};

/**
 * Get data from cache (memory first, then localStorage)
 */
export function getFromCache<T>(cacheKey: string): T | null {
  // Check memory cache first
  const memoryEntry = memoryCache.get(cacheKey);
  if (memoryEntry) {
    const age = Date.now() - memoryEntry.timestamp;
    if (age < (CACHE_DURATIONS as any)[cacheKey.split('_')[0]] || age < 30000) {
      return memoryEntry.data as T;
    }
  }

  // Check localStorage as fallback
  try {
    const stored = localStorage.getItem(cacheKey);
    if (!stored) return null;

    const { data, timestamp } = JSON.parse(stored);
    const age = Date.now() - timestamp;
    
    // Only return if fresh (less than 10 minutes old)
    if (age < 10 * 60 * 1000) {
      // Restore to memory cache
      memoryCache.set(cacheKey, { data, timestamp });
      return data as T;
    }
  } catch (error) {
    console.warn('Cache read error:', error);
  }

  return null;
}

/**
 * Save data to cache (both memory and localStorage)
 */
export function saveToCache<T>(cacheKey: string, data: T): void {
  const timestamp = Date.now();

  // Save to memory cache
  memoryCache.set(cacheKey, { data, timestamp });

  // Also save to localStorage for persistence
  try {
    localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp }));
  } catch (error) {
    console.warn('Cache write error:', error);
  }
}

/**
 * Invalidate cache
 */
export function invalidateCache(cacheKey: string): void {
  memoryCache.delete(cacheKey);
  try {
    localStorage.removeItem(cacheKey);
  } catch (error) {
    console.warn('Cache invalidation error:', error);
  }
}

/**
 * Invalidate multiple caches by pattern
 */
export function invalidateCacheByPattern(pattern: string): void {
  // Invalidate memory cache
  for (const key of Array.from(memoryCache.keys())) {
    if (key.includes(pattern)) {
      memoryCache.delete(key);
    }
  }

  // Invalidate localStorage
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes(pattern)) {
        localStorage.removeItem(key);
      }
    }
  } catch (error) {
    console.warn('Pattern cache invalidation error:', error);
  }
}

/**
 * Clear all caches
 */
export function clearAllCaches(): void {
  memoryCache.clear();
  try {
    localStorage.clear();
  } catch (error) {
    console.warn('Clear cache error:', error);
  }
}

/**
 * Get or fetch strategy - returns cached data if available, otherwise fetches
 */
export async function getOrFetch<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  maxAge?: number
): Promise<T> {
  // Try cache first
  const cached = getFromCache<T>(cacheKey);
  if (cached) {
    console.log(`✅ Cache hit: ${cacheKey}`);
    return cached;
  }

  // Fetch and cache
  console.log(`🔄 Cache miss, fetching: ${cacheKey}`);
  const data = await fetchFn();
  saveToCache(cacheKey, data);
  return data;
}

/**
 * Batch cache queries - useful for reducing multiple calls
 */
export async function batchGetOrFetch<T>(
  queries: Array<{ key: string; fn: () => Promise<T> }>
): Promise<T[]> {
  const results: T[] = [];
  const toFetch: { index: number; key: string; fn: () => Promise<T> }[] = [];

  // Check cache first
  for (let i = 0; i < queries.length; i++) {
    const cached = getFromCache<T>(queries[i].key);
    if (cached) {
      results[i] = cached;
    } else {
      toFetch.push({ index: i, ...queries[i] });
    }
  }

  // Fetch missing data
  if (toFetch.length > 0) {
    const fetched = await Promise.all(toFetch.map(q => q.fn()));
    for (let i = 0; i < toFetch.length; i++) {
      const index = toFetch[i].index;
      results[index] = fetched[i];
      saveToCache(toFetch[i].key, fetched[i]);
    }
  }

  return results;
}
