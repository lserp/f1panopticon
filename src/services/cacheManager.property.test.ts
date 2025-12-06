import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { CacheManager } from './cacheManager';
import type { SessionData, APIProvider, SessionType } from '../types';

/**
 * Property-based tests for Cache Manager
 * Feature: f1-analysis-platform
 */

describe('CacheManager Property Tests', () => {
  let cacheManager: CacheManager;

  beforeEach(() => {
    cacheManager = new CacheManager();
  });

  afterEach(async () => {
    await cacheManager.clear();
  });

  /**
   * Property 1: Cached data validity
   * Feature: f1-analysis-platform, Property 1: Cached data validity
   * Validates: Requirements 1.2
   *
   * For any data stored in the Local Cache, that data must pass the same
   * validation checks that were applied when it was received from the Public API.
   */
  describe('Property 1: Cached data validity', () => {
    it('should validate cached SessionData on retrieval', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate valid SessionData
          fc.record({
            id: fc.string({ minLength: 1 }),
            season: fc.integer({ min: 1950, max: 2030 }),
            round: fc.integer({ min: 1, max: 25 }),
            sessionType: fc.constantFrom<SessionType>('practice', 'qualifying', 'race', 'sprint'),
            circuitId: fc.string({ minLength: 1 }),
            circuitName: fc.string({ minLength: 1 }),
            date: fc.date(),
            weather: fc.record({
              airTemp: fc.float({ min: -10, max: 50 }),
              trackTemp: fc.float({ min: 0, max: 70 }),
              humidity: fc.float({ min: 0, max: 100 }),
              pressure: fc.float({ min: 900, max: 1100 }),
              windSpeed: fc.float({ min: 0, max: 50 }),
              windDirection: fc.float({ min: 0, max: 360 }),
              rainfall: fc.boolean(),
            }),
            drivers: fc.array(
              fc.record({
                id: fc.string({ minLength: 1 }),
                code: fc.string({ minLength: 3, maxLength: 3 }),
                number: fc.integer({ min: 1, max: 99 }),
                firstName: fc.string({ minLength: 1 }),
                lastName: fc.string({ minLength: 1 }),
                team: fc.string({ minLength: 1 }),
              }),
              { minLength: 1, maxLength: 20 }
            ),
            laps: fc.array(
              fc.record({
                lapNumber: fc.integer({ min: 1, max: 100 }),
                driverId: fc.string({ minLength: 1 }),
                lapTime: fc.float({ min: 60, max: 200 }),
                sector1Time: fc.float({ min: 10, max: 60 }),
                sector2Time: fc.float({ min: 10, max: 60 }),
                sector3Time: fc.float({ min: 10, max: 60 }),
                tireCompound: fc.constantFrom('SOFT', 'MEDIUM', 'HARD'),
                tireAge: fc.integer({ min: 0, max: 50 }),
              }),
              { minLength: 0, maxLength: 100 }
            ),
            source: fc.constantFrom<APIProvider>('fastf1', 'ergast', 'openf1'),
            fetchedAt: fc.date(),
          }),
          async (sessionData: SessionData) => {
            const key = `session:${sessionData.id}`;

            // Store the session data
            await cacheManager.set(key, sessionData);

            // Retrieve it
            const retrieved = await cacheManager.get<SessionData>(key);

            // The retrieved data should be valid (not null)
            expect(retrieved).not.toBeNull();

            // The retrieved data should match the original
            if (retrieved) {
              expect(retrieved.id).toBe(sessionData.id);
              expect(retrieved.season).toBe(sessionData.season);
              expect(retrieved.round).toBe(sessionData.round);
              expect(retrieved.circuitId).toBe(sessionData.circuitId);
              expect(Array.isArray(retrieved.drivers)).toBe(true);
              expect(Array.isArray(retrieved.laps)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid cached data', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }),
          fc.anything(),
          async (key: string, invalidData: unknown) => {
            // Skip if the data happens to be valid SessionData
            if (
              typeof invalidData === 'object' &&
              invalidData !== null &&
              'id' in invalidData &&
              'season' in invalidData &&
              'round' in invalidData &&
              'circuitId' in invalidData &&
              'drivers' in invalidData &&
              'laps' in invalidData &&
              Array.isArray((invalidData as { drivers: unknown }).drivers) &&
              Array.isArray((invalidData as { laps: unknown }).laps)
            ) {
              return;
            }

            const sessionKey = `session:${key}`;

            // Store invalid data
            await cacheManager.set(sessionKey, invalidData);

            // Retrieve it - should be rejected by validator
            const retrieved = await cacheManager.get<SessionData>(sessionKey);

            // Invalid data should be rejected (null)
            expect(retrieved).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 2: Session completion consistency
   * Feature: f1-analysis-platform, Property 2: Session completion consistency
   * Validates: Requirements 1.4
   *
   * For any session that has ended, querying the Local Cache for that session
   * must return a session marked as complete.
   */
  describe('Property 2: Session completion consistency', () => {
    it('should maintain session completion status in cache', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.string({ minLength: 1 }),
            season: fc.integer({ min: 1950, max: 2030 }),
            round: fc.integer({ min: 1, max: 25 }),
            sessionType: fc.constantFrom<SessionType>('practice', 'qualifying', 'race', 'sprint'),
            circuitId: fc.string({ minLength: 1 }),
            circuitName: fc.string({ minLength: 1 }),
            date: fc.date({ min: new Date('2020-01-01'), max: new Date('2023-12-31') }),
            weather: fc.record({
              airTemp: fc.float({ min: -10, max: 50 }),
              trackTemp: fc.float({ min: 0, max: 70 }),
              humidity: fc.float({ min: 0, max: 100 }),
              pressure: fc.float({ min: 900, max: 1100 }),
              windSpeed: fc.float({ min: 0, max: 50 }),
              windDirection: fc.float({ min: 0, max: 360 }),
              rainfall: fc.boolean(),
            }),
            drivers: fc.array(
              fc.record({
                id: fc.string({ minLength: 1 }),
                code: fc.string({ minLength: 3, maxLength: 3 }),
                number: fc.integer({ min: 1, max: 99 }),
                firstName: fc.string({ minLength: 1 }),
                lastName: fc.string({ minLength: 1 }),
                team: fc.string({ minLength: 1 }),
              }),
              { minLength: 1, maxLength: 20 }
            ),
            laps: fc.array(
              fc.record({
                lapNumber: fc.integer({ min: 1, max: 100 }),
                driverId: fc.string({ minLength: 1 }),
                lapTime: fc.float({ min: 60, max: 200 }),
                sector1Time: fc.float({ min: 10, max: 60 }),
                sector2Time: fc.float({ min: 10, max: 60 }),
                sector3Time: fc.float({ min: 10, max: 60 }),
                tireCompound: fc.constantFrom('SOFT', 'MEDIUM', 'HARD'),
                tireAge: fc.integer({ min: 0, max: 50 }),
              }),
              { minLength: 1, maxLength: 100 }
            ),
            source: fc.constantFrom<APIProvider>('fastf1', 'ergast', 'openf1'),
            fetchedAt: fc.date(),
          }),
          async (sessionData: SessionData) => {
            // A session is considered complete if it has a date in the past
            // and has lap data
            const now = new Date();
            const isComplete = sessionData.date < now && sessionData.laps.length > 0;

            const key = `session:${sessionData.id}`;

            // Store the session
            await cacheManager.set(key, sessionData);

            // Retrieve it
            const retrieved = await cacheManager.get<SessionData>(key);

            // If the session was complete when stored, it should still be complete
            if (isComplete && retrieved) {
              // Note: dates are serialized to strings in JSON, so we compare timestamps
              const retrievedDate = new Date(retrieved.date);
              const originalDate = new Date(sessionData.date);
              expect(retrievedDate.getTime()).toBe(originalDate.getTime());
              expect(retrieved.laps.length).toBeGreaterThan(0);
              expect(retrievedDate < now).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 3: Cache retention
   * Feature: f1-analysis-platform, Property 3: Cache retention
   * Validates: Requirements 2.2
   *
   * For any data stored in the Local Cache with a retention period of N days,
   * querying that data within N days must successfully retrieve it, and
   * querying after N days may return null.
   */
  describe('Property 3: Cache retention', () => {
    it('should retain data within TTL period', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }),
          // Use jsonValue but filter out null since null is our sentinel value
          fc.jsonValue().filter((v) => v !== null),
          fc.integer({ min: 1000, max: 10000 }), // TTL in milliseconds
          async (key: string, value: unknown, ttl: number) => {
            // Store with specific TTL
            await cacheManager.set(key, value, ttl);

            // Immediately retrieve - should be available
            const retrieved = await cacheManager.get(key);
            expect(retrieved).not.toBeNull();

            // Deep equality check for JSON-serializable values
            expect(JSON.stringify(retrieved)).toEqual(JSON.stringify(value));

            // Check freshness
            const freshness = await cacheManager.getFreshness(key);
            expect(freshness).not.toBeNull();
            if (freshness) {
              expect(freshness.isFresh).toBe(true);
              expect(freshness.remainingTTL).toBeGreaterThan(0);
              expect(freshness.remainingTTL).toBeLessThanOrEqual(ttl);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should expire data after TTL period', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }),
          fc.anything(),
          async (key: string, value: unknown) => {
            // Store with very short TTL (1ms)
            const shortTTL = 1;
            await cacheManager.set(key, value, shortTTL);

            // Wait for expiration
            await new Promise((resolve) => setTimeout(resolve, 10));

            // Retrieve - should be expired and return null
            const retrieved = await cacheManager.get(key);
            expect(retrieved).toBeNull();

            // Check freshness
            const freshness = await cacheManager.getFreshness(key);
            // Entry should be deleted, so freshness should be null
            expect(freshness).toBeNull();
          }
        ),
        { numRuns: 50 } // Fewer runs due to setTimeout
      );
    });

    it('should track cache retention correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              key: fc.string({ minLength: 1 }),
              value: fc.jsonValue().filter((v) => v !== null),
              ttl: fc.integer({ min: 1000, max: 100000 }),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          async (entries: Array<{ key: string; value: unknown; ttl: number }>) => {
            // Clear cache before this test to ensure clean state
            await cacheManager.clear();

            // Create unique keys to avoid collisions
            const uniqueEntries = entries.map((entry, idx) => ({
              ...entry,
              key: `test-${idx}-${entry.key}`,
            }));

            // Store all entries
            for (const entry of uniqueEntries) {
              await cacheManager.set(entry.key, entry.value, entry.ttl);
            }

            // All entries should be retrievable immediately
            for (const entry of uniqueEntries) {
              const retrieved = await cacheManager.get(entry.key);
              expect(retrieved).not.toBeNull();
            }

            // Check stats
            const stats = await cacheManager.getStats();
            expect(stats.totalEntries).toBe(uniqueEntries.length);
            expect(stats.totalSize).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
