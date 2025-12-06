import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { F1AnalysisDB, clearExpiredEntries, getCacheStats } from './database';

describe('Database Configuration', () => {
  let testDb: F1AnalysisDB;

  beforeEach(() => {
    testDb = new F1AnalysisDB();
  });

  afterEach(async () => {
    await testDb.delete();
    await testDb.close();
  });

  it('should create database instance', () => {
    expect(testDb).toBeInstanceOf(F1AnalysisDB);
    expect(testDb.name).toBe('F1AnalysisDB');
  });

  it('should have cache table defined', () => {
    expect(testDb.cache).toBeDefined();
  });

  it('should add and retrieve cache entry', async () => {
    const entry = {
      key: 'test-key',
      value: { data: 'test-data' },
      timestamp: new Date(),
      ttl: 3600000, // 1 hour
      size: 100,
      accessCount: 1,
      lastAccessed: new Date(),
    };

    await testDb.cache.add(entry);
    const retrieved = await testDb.cache.get('test-key');

    expect(retrieved).toBeDefined();
    expect(retrieved?.key).toBe('test-key');
    expect(retrieved?.value).toEqual({ data: 'test-data' });
  });

  it('should clear expired entries', async () => {
    const now = new Date();
    const expiredEntry = {
      key: 'expired-key',
      value: { data: 'expired' },
      timestamp: new Date(now.getTime() - 7200000), // 2 hours ago
      ttl: 3600000, // 1 hour TTL (expired)
      size: 100,
      accessCount: 1,
      lastAccessed: new Date(now.getTime() - 7200000),
    };

    const validEntry = {
      key: 'valid-key',
      value: { data: 'valid' },
      timestamp: now,
      ttl: 3600000, // 1 hour TTL (not expired)
      size: 100,
      accessCount: 1,
      lastAccessed: now,
    };

    await testDb.cache.bulkAdd([expiredEntry, validEntry]);

    const clearedCount = await clearExpiredEntries();
    expect(clearedCount).toBe(1);

    const remaining = await testDb.cache.toArray();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].key).toBe('valid-key');
  });

  it('should calculate cache statistics', async () => {
    const entries = [
      {
        key: 'key1',
        value: { data: 'data1' },
        timestamp: new Date(),
        ttl: 3600000,
        size: 100,
        accessCount: 5,
        lastAccessed: new Date(),
      },
      {
        key: 'key2',
        value: { data: 'data2' },
        timestamp: new Date(),
        ttl: 3600000,
        size: 200,
        accessCount: 3,
        lastAccessed: new Date(),
      },
    ];

    await testDb.cache.bulkAdd(entries);

    const stats = await getCacheStats();
    expect(stats.totalEntries).toBe(2);
    expect(stats.totalSize).toBe(300);
    expect(stats.hitRate).toBeGreaterThan(0);
  });

  it('should return empty stats for empty cache', async () => {
    const stats = await getCacheStats();
    expect(stats.totalEntries).toBe(0);
    expect(stats.totalSize).toBe(0);
    expect(stats.hitRate).toBe(0);
  });
});
