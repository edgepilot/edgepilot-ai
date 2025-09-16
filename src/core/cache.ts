import { ApiResponse } from './streaming';

/**
 * Enhanced cache implementation with size limits and cleanup
 */

export interface CacheOptions {
  maxSize: number;
  defaultTtl: number;
  cleanupInterval: number;
}

export const DEFAULT_CACHE_OPTIONS: CacheOptions = {
  maxSize: 1000,
  defaultTtl: 60_000, // 1 minute
  cleanupInterval: 300_000 // 5 minutes
};

export interface CacheEntry<T> {
  data: T;
  expires: number;
  lastAccessed: number;
  size: number;
}

/**
 * LRU cache with automatic cleanup and memory management
 */
export class BoundedCache<T = unknown> {
  private cache = new Map<string, CacheEntry<T>>();
  private accessOrder = new Set<string>();
  private options: CacheOptions;
  private cleanupTimer?: NodeJS.Timeout;
  private currentSize = 0;

  constructor(options: Partial<CacheOptions> = {}) {
    this.options = { ...DEFAULT_CACHE_OPTIONS, ...options };
    this.startCleanupTimer();
  }

  /**
   * Get an item from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expires) {
      this.delete(key);
      return null;
    }

    // Update access order for LRU
    entry.lastAccessed = Date.now();
    this.accessOrder.delete(key);
    this.accessOrder.add(key);

    return entry.data;
  }

  /**
   * Set an item in cache
   */
  set(key: string, data: T, ttl?: number): void {
    const size = this.estimateSize(data);
    const expires = Date.now() + (ttl ?? this.options.defaultTtl);
    const now = Date.now();

    // Remove existing entry if present
    if (this.cache.has(key)) {
      this.delete(key);
    }

    // Ensure we have space
    this.ensureCapacity(size);

    const entry: CacheEntry<T> = {
      data,
      expires,
      lastAccessed: now,
      size
    };

    this.cache.set(key, entry);
    this.accessOrder.add(key);
    this.currentSize += size;
  }

  /**
   * Delete an item from cache
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    this.cache.delete(key);
    this.accessOrder.delete(key);
    this.currentSize -= entry.size;
    return true;
  }

  /**
   * Clear all items from cache
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder.clear();
    this.currentSize = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    currentMemory: number;
    hitRate: number;
    itemCount: number;
  } {
    return {
      size: this.cache.size,
      maxSize: this.options.maxSize,
      currentMemory: this.currentSize,
      hitRate: 0, // Would need hit/miss tracking for accurate calculation
      itemCount: this.cache.size
    };
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expires) {
        this.delete(key);
        removedCount++;
      }
    }

    return removedCount;
  }

  /**
   * Ensure we have capacity for new entry
   */
  private ensureCapacity(newItemSize: number): void {
    // Remove expired items first
    this.cleanup();

    // Remove LRU items until we have space
    while (
      this.cache.size >= this.options.maxSize ||
      (this.currentSize + newItemSize > this.options.maxSize * 1024) // Assume max 1KB per item
    ) {
      const oldestKey = this.accessOrder.values().next().value;
      if (!oldestKey) break;
      this.delete(oldestKey);
    }
  }

  /**
   * Estimate memory size of data
   */
  private estimateSize(data: T): number {
    try {
      const jsonString = JSON.stringify(data);
      return jsonString.length * 2; // Rough estimate: 2 bytes per character
    } catch {
      return 1024; // Default size if JSON.stringify fails
    }
  }

  /**
   * Start automatic cleanup timer
   */
  private startCleanupTimer(): void {
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
      return; // Skip timer in tests
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.options.cleanupInterval);

    // Clear timer on process exit
    if (typeof process !== 'undefined') {
      process.on('exit', () => this.destroy());
    }
  }

  /**
   * Destroy cache and cleanup resources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    this.clear();
  }
}

/**
 * Type-safe cache for API responses
 */
export class ResponseCache extends BoundedCache<ApiResponse> {
  constructor(options: Partial<CacheOptions> = {}) {
    super({
      maxSize: 500, // Fewer items for response cache
      defaultTtl: 300_000, // 5 minutes for responses
      cleanupInterval: 600_000, // 10 minutes
      ...options
    });
  }

  /**
   * Generate cache key from request parameters
   */
  static generateKey(params: {
    messages: Array<{ role: string; content: string }>;
    model: string;
    temperature?: number;
  }): string {
    const { messages, model, temperature } = params;
    const key = JSON.stringify({
      messages: messages.map(m => ({ role: m.role, content: m.content.slice(0, 100) })), // Truncate for key
      model,
      temperature
    });

    // Create a simple hash of the key to keep it manageable
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return `response_${Math.abs(hash)}`;
  }
}