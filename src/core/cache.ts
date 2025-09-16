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
 * Thread-safe LRU cache with automatic cleanup and memory management
 */
export class BoundedCache<T = unknown> {
  private cache = new Map<string, CacheEntry<T>>();
  private accessOrder = new Set<string>();
  private options: CacheOptions;
  private cleanupTimer?: NodeJS.Timeout;
  private currentSize = 0;
  private operationQueue: Array<() => void> = [];
  private isProcessing = false;
  private queueFullErrors = 0;
  private readonly maxQueueSize = 1000;

  constructor(options: Partial<CacheOptions> = {}) {
    this.options = { ...DEFAULT_CACHE_OPTIONS, ...options };
    this.startCleanupTimer();
  }

  /**
   * Synchronous operation wrapper for thread safety with timeout protection
   */
  private async withLock<R>(operation: () => R, timeoutMs: number = 5000): Promise<R> {
    return new Promise((resolve, reject) => {
      // Circuit breaker: reject if queue is too full
      if (this.operationQueue.length >= this.maxQueueSize) {
        this.queueFullErrors++;
        reject(new Error(`Cache operation rejected: queue full (${this.operationQueue.length}/${this.maxQueueSize})`));
        return;
      }

      // Timeout protection to prevent deadlocks
      const timeoutId = setTimeout(() => {
        reject(new Error(`Cache operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      this.operationQueue.push(() => {
        try {
          clearTimeout(timeoutId);
          const result = operation();
          resolve(result);
        } catch (error) {
          clearTimeout(timeoutId);
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  /**
   * Process queued operations sequentially
   */
  private processQueue(): void {
    if (this.isProcessing || this.operationQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    // Process in next tick to avoid blocking
    process.nextTick(() => {
      const operation = this.operationQueue.shift();
      if (operation) {
        operation();
      }

      this.isProcessing = false;

      // Process next operation if any
      if (this.operationQueue.length > 0) {
        this.processQueue();
      }
    });
  }

  /**
   * Get an item from cache (thread-safe)
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expires) {
      // Atomic delete
      this.deleteInternal(key);
      return null;
    }

    // Atomic access order update
    entry.lastAccessed = Date.now();
    this.accessOrder.delete(key);
    this.accessOrder.add(key);

    return entry.data;
  }

  /**
   * Set an item in cache (thread-safe)
   */
  async set(key: string, data: T, ttl?: number): Promise<void> {
    return this.withLock(() => {
      const size = this.estimateSize(data);
      const expires = Date.now() + (ttl ?? this.options.defaultTtl);
      const now = Date.now();

      // Remove existing entry if present
      if (this.cache.has(key)) {
        this.deleteInternal(key);
      }

      // Ensure we have space
      this.ensureCapacityInternal(size);

      const entry: CacheEntry<T> = {
        data,
        expires,
        lastAccessed: now,
        size
      };

      this.cache.set(key, entry);
      this.accessOrder.add(key);
      this.currentSize += size;
    });
  }

  /**
   * Delete an item from cache (thread-safe)
   */
  async delete(key: string): Promise<boolean> {
    return this.withLock(() => {
      return this.deleteInternal(key);
    });
  }

  /**
   * Internal atomic delete operation
   */
  private deleteInternal(key: string): boolean {
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
   * Clear all items from cache (thread-safe)
   */
  async clear(): Promise<void> {
    return this.withLock(() => {
      this.cache.clear();
      this.accessOrder.clear();
      this.currentSize = 0;
    });
  }

  /**
   * Get cache statistics including reliability metrics
   */
  getStats(): {
    size: number;
    maxSize: number;
    currentMemory: number;
    hitRate: number;
    itemCount: number;
    queueLength: number;
    queueFullErrors: number;
    isProcessing: boolean;
  } {
    return {
      size: this.cache.size,
      maxSize: this.options.maxSize,
      currentMemory: this.currentSize,
      hitRate: 0, // Would need hit/miss tracking for accurate calculation
      itemCount: this.cache.size,
      queueLength: this.operationQueue.length,
      queueFullErrors: this.queueFullErrors,
      isProcessing: this.isProcessing
    };
  }

  /**
   * Cleanup expired entries (thread-safe)
   */
  async cleanup(): Promise<number> {
    return this.withLock(() => {
      const now = Date.now();
      let removedCount = 0;
      const expiredKeys: string[] = [];

      // Collect expired keys first to avoid modification during iteration
      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.expires) {
          expiredKeys.push(key);
        }
      }

      // Remove expired entries atomically
      for (const key of expiredKeys) {
        if (this.deleteInternal(key)) {
          removedCount++;
        }
      }

      return removedCount;
    });
  }

  /**
   * Ensure we have capacity for new entry (internal, already within lock)
   */
  private ensureCapacityInternal(newItemSize: number): void {
    // Remove expired items first
    this.cleanupInternal();

    // Remove LRU items until we have space
    while (
      this.cache.size >= this.options.maxSize ||
      (this.currentSize + newItemSize > this.options.maxSize * 1024) // Assume max 1KB per item
    ) {
      const oldestKey = this.accessOrder.values().next().value;
      if (!oldestKey) break;
      this.deleteInternal(oldestKey);
    }
  }

  /**
   * Internal cleanup for expired entries (already within lock)
   */
  private cleanupInternal(): number {
    const now = Date.now();
    let removedCount = 0;
    const expiredKeys: string[] = [];

    // Collect expired keys first to avoid modification during iteration
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expires) {
        expiredKeys.push(key);
      }
    }

    // Remove expired entries atomically
    for (const key of expiredKeys) {
      if (this.deleteInternal(key)) {
        removedCount++;
      }
    }

    return removedCount;
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

    this.cleanupTimer = setInterval(async () => {
      try {
        await this.cleanup();
      } catch (error) {
        // Silent cleanup errors to avoid crashing the timer
        if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
          console.warn('[EdgePilot] Cache cleanup error:', error);
        }
      }
    }, this.options.cleanupInterval);

    // Clear timer on process exit
    if (typeof process !== 'undefined') {
      process.on('exit', () => this.destroy());
    }
  }

  /**
   * Destroy cache and cleanup resources
   */
  async destroy(): Promise<void> {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }

    // Clear operation queue
    this.operationQueue.length = 0;
    this.isProcessing = false;

    await this.clear();
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