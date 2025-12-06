import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CacheManager } from './cacheManager';

describe('CacheManager Unit Tests', () => {
  let cacheManager: CacheManager;

  beforeEach(() => {
    cacheManager = new CacheManager();
  });

  afterEach(async () => {
    await cacheManager.clear();
  });

  describe('Basic Operations', () => {
    it('should store and retrieve a simple value', async () => {
      await cacheManager.set('test-key', 'test-value');
      const result = await cacheManager.get('test-key');
      expect(result).toBe('test-value');
    });

    it('should return null for non-existent key', async () => {
      const result = await cacheManager.get('non-existent');
      expect(result).toBeNull();
    });

    it('should check if key exists', async () => {
      await cacheManager.set('test-key', 'test-value');
      expect(await cacheManager.has('test-key')).toBe(true);
      expect(await cacheManager.has('non-existent')).toBe(false);
    });

    it('should delete a key', async () => {
      await cacheManager.set('test-key', 'test-value');
      await cacheManager.delete('test-key');
      expect(await cacheManager.has('test-key')).toBe(false);
    });

    it('should clear all entries', async () => {
      await cacheManager.set('key1', 'value1');
      await cacheManager.set('key2', 'value2');
      await cacheManager.clear();
      expect(await cacheManager.size()).toBe(0);
    });
  });

  describe('Complex Data Types', () => {
    it('should handle objects', async () => {
      const obj = { name: 'test', value: 123, nested: { prop: true } };
      await cacheManager.set('obj-key', obj);
      const result = await cacheManager.get('obj-key');
      expect(result).toEqual(obj);
    });

    it('should handle arrays', async () => {
      const arr = [1, 2, 3, 'four', { five: 5 }];
      await cacheManager.set('arr-key', arr);
      const result = await cacheManager.get('arr-key');
      expect(result).toEqual(arr);
    });

    it('should handle nested structures', async () => {
      const complex = {
        users: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
        ],
        metadata: {
          count: 2,
          timestamp: new Date().toISOString(),
        },
      };
      await cacheManager.set('complex-key', complex);
      const result = await cacheManager.get('complex-key');
      expect(result).toEqual(complex);
    });
  });

  describe('TTL and Expiration', () => {
    it('should respect custom TTL', async () => {
      const shortTTL = 50; // 50ms
      await cacheManager.set('short-lived', 'value', shortTTL);

      // Should exist immediately
      expect(await cacheManager.has('short-lived')).toBe(true);

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should be expired
      expect(await cacheManager.has('short-lived')).toBe(false);
    });

    it('should provide freshness information', async () => {
      await cacheManager.set('test-key', 'value', 10000);
      const freshness = await cacheManager.getFreshness('test-key');

      expect(freshness).not.toBeNull();
      expect(freshness?.isFresh).toBe(true);
      expect(freshness?.age).toBeGreaterThanOrEqual(0);
      expect(freshness?.remainingTTL).toBeGreaterThan(0);
    });

    it('should return null freshness for non-existent key', async () => {
      const freshness = await cacheManager.getFreshness('non-existent');
      expect(freshness).toBeNull();
    });
  });

  describe('LRU Eviction', () => {
    it('should evict least recently used entries when cache is full', async () => {
      // Create a very small cache (500 bytes)
      const smallCache = new CacheManager(500);

      // Store entries that will exceed the limit
      const largeValue = 'x'.repeat(200); // ~200 bytes each
      await smallCache.set('key1', largeValue);
      await smallCache.set('key2', largeValue);

      // Access key2 to make it more recently used
      await smallCache.get('key2');

      // Add key3 which should trigger eviction of key1 (least recently used)
      await smallCache.set('key3', largeValue);

      // key1 should be evicted (least recently used)
      const key1Exists = await smallCache.has('key1');
      const key3Exists = await smallCache.has('key3');

      // key1 should be evicted, key3 should exist
      expect(key1Exists).toBe(false);
      expect(key3Exists).toBe(true);

      await smallCache.clear();
    });
  });

  describe('Statistics', () => {
    it('should track cache statistics', async () => {
      await cacheManager.set('key1', 'value1');
      await cacheManager.set('key2', 'value2');

      const stats = await cacheManager.getStats();
      expect(stats.totalEntries).toBe(2);
      expect(stats.totalSize).toBeGreaterThan(0);
    });

    it('should calculate hit rate', async () => {
      await cacheManager.set('key1', 'value1');

      // Hit
      await cacheManager.get('key1');
      // Miss
      await cacheManager.get('non-existent');

      const stats = await cacheManager.getStats();
      expect(stats.hitRate).toBe(0.5); // 1 hit, 1 miss = 50%
    });
  });

  describe('Validation', () => {
    it('should validate SessionData on retrieval', async () => {
      const validSession = {
        id: 'session-1',
        season: 2024,
        round: 5,
        circuitId: 'monaco',
        drivers: [],
        laps: [],
      };

      await cacheManager.set('session:test', validSession);
      const result = await cacheManager.get('session:test');
      expect(result).not.toBeNull();
    });

    it('should reject invalid SessionData', async () => {
      const invalidSession = {
        id: 'session-1',
        // Missing required fields
      };

      await cacheManager.set('session:test', invalidSession);
      const result = await cacheManager.get('session:test');
      expect(result).toBeNull();
    });
  });

  describe('Pattern-based Operations', () => {
    it('should expire entries by pattern', async () => {
      await cacheManager.set('session:2024:1', 'data1');
      await cacheManager.set('session:2024:2', 'data2');
      await cacheManager.set('lap:2024:1', 'data3');

      const expiredCount = await cacheManager.expireByPattern('session:2024');
      expect(expiredCount).toBe(2);

      expect(await cacheManager.has('session:2024:1')).toBe(false);
      expect(await cacheManager.has('session:2024:2')).toBe(false);
      expect(await cacheManager.has('lap:2024:1')).toBe(true);
    });

    it('should get all keys', async () => {
      await cacheManager.set('key1', 'value1');
      await cacheManager.set('key2', 'value2');
      await cacheManager.set('key3', 'value3');

      const keys = await cacheManager.keys();
      expect(keys).toHaveLength(3);
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).toContain('key3');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string as key', async () => {
      await cacheManager.set('', 'value');
      const result = await cacheManager.get('');
      expect(result).toBe('value');
    });

    it('should handle empty string as value', async () => {
      await cacheManager.set('key', '');
      const result = await cacheManager.get('key');
      expect(result).toBe('');
    });

    it('should handle zero as value', async () => {
      await cacheManager.set('key', 0);
      const result = await cacheManager.get('key');
      expect(result).toBe(0);
    });

    it('should handle false as value', async () => {
      await cacheManager.set('key', false);
      const result = await cacheManager.get('key');
      expect(result).toBe(false);
    });

    it('should handle empty array as value', async () => {
      await cacheManager.set('key', []);
      const result = await cacheManager.get('key');
      expect(result).toEqual([]);
    });

    it('should handle empty object as value', async () => {
      await cacheManager.set('key', {});
      const result = await cacheManager.get('key');
      expect(result).toEqual({});
    });

    it('should update existing key', async () => {
      await cacheManager.set('key', 'value1');
      await cacheManager.set('key', 'value2');
      const result = await cacheManager.get('key');
      expect(result).toBe('value2');
    });
  });
});
