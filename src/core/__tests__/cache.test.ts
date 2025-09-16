import { BoundedCache } from '../cache';

describe('BoundedCache', () => {
  let cache: BoundedCache<string>;

  beforeEach(() => {
    cache = new BoundedCache({
      maxSize: 100,
      maxMemory: 1024,
      defaultTtl: 1000,
      cleanupInterval: 60000
    });
  });

  afterEach(async () => {
    await cache.destroy();
  });

  describe('Basic Operations', () => {
    it('should store and retrieve values', async () => {
      await cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return null for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBeNull();
    });

    it('should update existing values', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key1', 'value2');
      expect(cache.get('key1')).toBe('value2');
    });

    it('should delete values', async () => {
      await cache.set('key1', 'value1');
      const deleted = await cache.delete('key1');
      expect(deleted).toBe(true);
      expect(cache.get('key1')).toBeNull();
    });

    it('should clear all values', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      await cache.clear();
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
    });
  });

  describe('TTL and Expiration', () => {
    it('should expire entries after TTL', async () => {
      await cache.set('key1', 'value1', 100); // 100ms TTL
      expect(cache.get('key1')).toBe('value1');

      await new Promise(resolve => setTimeout(resolve, 150));
      expect(cache.get('key1')).toBeNull();
    });

    it('should use default TTL when not specified', async () => {
      await cache.set('key1', 'value1'); // Uses 1000ms default
      expect(cache.get('key1')).toBe('value1');

      await new Promise(resolve => setTimeout(resolve, 500));
      expect(cache.get('key1')).toBe('value1'); // Still valid
    });
  });

  describe('LRU Eviction', () => {
    it('should evict least recently used items when at capacity', async () => {
      const smallCache = new BoundedCache<string>({
        maxSize: 3,
        maxMemory: 1024,
        defaultTtl: 60000
      });

      await smallCache.set('key1', 'value1');
      await smallCache.set('key2', 'value2');
      await smallCache.set('key3', 'value3');

      // Access key1 and key2 to make them more recent
      smallCache.get('key1');
      smallCache.get('key2');

      // Add key4, should evict key3 (least recently used)
      await smallCache.set('key4', 'value4');

      expect(smallCache.get('key1')).toBe('value1');
      expect(smallCache.get('key2')).toBe('value2');
      expect(smallCache.get('key3')).toBeNull(); // Evicted
      expect(smallCache.get('key4')).toBe('value4');

      await smallCache.destroy();
    });
  });

  describe('Thread Safety', () => {
    it('should handle concurrent set operations', async () => {
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(cache.set(`key${i}`, `value${i}`));
      }

      await Promise.all(promises);

      for (let i = 0; i < 10; i++) {
        expect(cache.get(`key${i}`)).toBe(`value${i}`);
      }
    });

    it('should handle mixed concurrent operations', async () => {
      await cache.set('key1', 'initial');

      const operations = [
        cache.set('key2', 'value2'),
        cache.set('key3', 'value3'),
        cache.delete('key1'),
        cache.set('key4', 'value4'),
      ];

      await Promise.all(operations);

      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBe('value2');
      expect(cache.get('key3')).toBe('value3');
      expect(cache.get('key4')).toBe('value4');
    });
  });

  describe('Statistics', () => {
    it('should provide accurate statistics', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');

      const stats = cache.getStats();
      expect(stats.size).toBe(2);
      expect(stats.itemCount).toBe(2);
      expect(stats.queueLength).toBe(0);
      expect(stats.isProcessing).toBe(false);
    });

    it('should track queue metrics during operations', async () => {
      // Start multiple operations to build up queue
      const promises = [];
      for (let i = 0; i < 50; i++) {
        promises.push(cache.set(`key${i}`, `value${i}`));
      }

      // Check stats while operations are in progress
      const stats = cache.getStats();
      expect(stats.queueLength).toBeGreaterThanOrEqual(0);

      await Promise.all(promises);

      // After completion, queue should be empty
      const finalStats = cache.getStats();
      expect(finalStats.queueLength).toBe(0);
      expect(finalStats.size).toBe(50);
    });
  });

  describe('Memory Management', () => {
    it('should respect memory limits', async () => {
      const memoryCache = new BoundedCache<string>({
        maxSize: 1000,
        maxMemory: 100, // Very small memory limit
        defaultTtl: 60000
      });

      // Try to add items that exceed memory
      for (let i = 0; i < 20; i++) {
        await memoryCache.set(`key${i}`, 'x'.repeat(10));
      }

      // Cache should have evicted older items to stay within memory
      const stats = memoryCache.getStats();
      expect(stats.currentMemory).toBeLessThanOrEqual(100);

      await memoryCache.destroy();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup expired entries', async () => {
      await cache.set('key1', 'value1', 100); // Expires in 100ms
      await cache.set('key2', 'value2', 1000); // Expires in 1s

      await new Promise(resolve => setTimeout(resolve, 150));

      const cleaned = await cache.cleanup();
      expect(cleaned).toBe(1); // key1 should be cleaned
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBe('value2');
    });
  });
});