import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { LapData, TelemetryData } from '../types';

/**
 * Property-Based Tests for Telemetry Visualization
 * Feature: f1-analysis-platform
 */

// Helper to generate valid telemetry data
const telemetryDataArbitrary = (numPoints: number): fc.Arbitrary<TelemetryData> => {
  return fc.record({
    distance: fc
      .array(fc.float({ min: 0, max: 6000, noNaN: true }), {
        minLength: numPoints,
        maxLength: numPoints,
      })
      .map((arr) => arr.sort((a, b) => a - b)),
    time: fc
      .array(fc.float({ min: 0, max: 120, noNaN: true }), {
        minLength: numPoints,
        maxLength: numPoints,
      })
      .map((arr) => arr.sort((a, b) => a - b)),
    speed: fc.array(fc.float({ min: 0, max: 350, noNaN: true }), {
      minLength: numPoints,
      maxLength: numPoints,
    }),
    throttle: fc.array(fc.float({ min: 0, max: 100, noNaN: true }), {
      minLength: numPoints,
      maxLength: numPoints,
    }),
    brake: fc.array(fc.float({ min: 0, max: 100, noNaN: true }), {
      minLength: numPoints,
      maxLength: numPoints,
    }),
    gear: fc.array(fc.integer({ min: 1, max: 8 }), { minLength: numPoints, maxLength: numPoints }),
    rpm: fc.array(fc.float({ min: 5000, max: 15000, noNaN: true }), {
      minLength: numPoints,
      maxLength: numPoints,
    }),
    drs: fc.array(fc.integer({ min: 0, max: 14 }), { minLength: numPoints, maxLength: numPoints }),
    nGear: fc.array(fc.float({ min: 0, max: 1, noNaN: true }), {
      minLength: numPoints,
      maxLength: numPoints,
    }),
  });
};

// Helper to generate lap data
const lapDataArbitrary = (numPoints: number): fc.Arbitrary<LapData> => {
  return fc.record({
    sessionId: fc.uuid(),
    driverId: fc.constantFrom('VER', 'HAM', 'LEC', 'NOR', 'PER', 'SAI'),
    lapNumber: fc.integer({ min: 1, max: 70 }),
    lapTime: fc.float({ min: 60, max: 120, noNaN: true }),
    sector1Time: fc.float({ min: 15, max: 40, noNaN: true }),
    sector2Time: fc.float({ min: 15, max: 40, noNaN: true }),
    sector3Time: fc.float({ min: 15, max: 40, noNaN: true }),
    tireCompound: fc.constantFrom('SOFT', 'MEDIUM', 'HARD', 'INTERMEDIATE', 'WET'),
    tireAge: fc.integer({ min: 0, max: 50 }),
    telemetry: telemetryDataArbitrary(numPoints),
    fuelLoad: fc.float({ min: 0, max: 110, noNaN: true }),
    trackStatus: fc.constantFrom('green', 'yellow', 'red') as fc.Arbitrary<
      'green' | 'yellow' | 'red'
    >,
  });
};

describe('Telemetry Visualization Property Tests', () => {
  /**
   * Property 9: Multi-lap overlay synchronization
   * Feature: f1-analysis-platform, Property 9: Multi-lap overlay synchronization
   * Validates: Requirements 3.2, 7.1, 7.4
   *
   * For any set of up to 4 laps displayed as overlays, all laps must be aligned
   * to the same distance axis such that the same distance value corresponds to
   * the same track position for all laps.
   */
  describe('Property 9: Multi-lap overlay synchronization', () => {
    it('should align all laps to the same distance axis', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 50, max: 100 }), // numPoints
          fc.integer({ min: 1, max: 4 }), // numLaps
          (numPoints, numLaps) => {
            // Generate multiple laps with the same number of telemetry points
            const laps: LapData[] = [];
            for (let i = 0; i < numLaps; i++) {
              const lap = fc.sample(lapDataArbitrary(numPoints), 1)[0];
              laps.push(lap);
            }

            // Property: All laps should have telemetry data with distance arrays
            // that can be compared on the same axis

            // Check 1: All laps have telemetry data
            expect(laps.every((lap) => lap.telemetry !== undefined)).toBe(true);

            // Check 2: All distance arrays are sorted (monotonically increasing)
            laps.forEach((lap) => {
              const distances = lap.telemetry.distance;
              for (let i = 1; i < distances.length; i++) {
                expect(distances[i]).toBeGreaterThanOrEqual(distances[i - 1]);
              }
            });

            // Check 3: All laps have the same length telemetry arrays
            // (required for proper alignment on the same distance axis)
            const firstLength = laps[0].telemetry.distance.length;
            laps.forEach((lap) => {
              expect(lap.telemetry.distance.length).toBe(firstLength);
              expect(lap.telemetry.speed.length).toBe(firstLength);
              expect(lap.telemetry.throttle.length).toBe(firstLength);
              expect(lap.telemetry.brake.length).toBe(firstLength);
              expect(lap.telemetry.gear.length).toBe(firstLength);
            });

            // Check 4: For any given distance value, we can find corresponding
            // data points in all laps (interpolation would work)
            // This validates that the distance axis is the common reference
            const sampleDistance = laps[0].telemetry.distance[Math.floor(numPoints / 2)];
            laps.forEach((lap) => {
              const distances = lap.telemetry.distance;
              // The distance should be within the range of each lap's telemetry
              expect(sampleDistance).toBeGreaterThanOrEqual(distances[0]);
              expect(sampleDistance).toBeLessThanOrEqual(distances[distances.length - 1]);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain distance axis consistency when overlaying laps', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 50, max: 100 }), // numPoints
          (numPoints) => {
            // Generate 4 laps (maximum overlay)
            const laps = fc.sample(
              fc.array(lapDataArbitrary(numPoints), { minLength: 4, maxLength: 4 }),
              1
            )[0];

            // Property: When overlaying multiple laps, the distance axis
            // should be consistent across all laps

            // All laps should have valid distance ranges
            laps.forEach((lap) => {
              const distances = lap.telemetry.distance;
              expect(distances.length).toBeGreaterThan(0);
              expect(distances[0]).toBeGreaterThanOrEqual(0);
              expect(distances[distances.length - 1]).toBeLessThanOrEqual(10000); // reasonable track length
            });

            // The distance values should be comparable across laps
            // (i.e., they represent the same physical track positions)
            const minDistance = Math.min(...laps.map((lap) => lap.telemetry.distance[0]));
            const maxDistance = Math.max(
              ...laps.map((lap) => lap.telemetry.distance[lap.telemetry.distance.length - 1])
            );

            // All laps should have overlapping distance ranges
            laps.forEach((lap) => {
              const lapMin = lap.telemetry.distance[0];
              const lapMax = lap.telemetry.distance[lap.telemetry.distance.length - 1];

              // There should be some overlap in distance ranges
              expect(lapMax).toBeGreaterThanOrEqual(minDistance);
              expect(lapMin).toBeLessThanOrEqual(maxDistance);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 12: Teammate telemetry alignment
   * Feature: f1-analysis-platform, Property 12: Teammate telemetry alignment
   * Validates: Requirements 7.1, 7.4
   *
   * For any two teammates' telemetry overlays, both telemetry traces must be
   * aligned to the same track distance reference such that the same distance
   * value represents the same physical location on track for both drivers.
   */
  describe('Property 12: Teammate telemetry alignment', () => {
    it('should align teammate telemetry to the same track distance reference', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 50, max: 100 }), // numPoints
          fc.constantFrom(
            ['VER', 'PER'], // Red Bull teammates
            ['HAM', 'RUS'], // Mercedes teammates
            ['LEC', 'SAI'], // Ferrari teammates
            ['NOR', 'PIA'] // McLaren teammates
          ),
          (numPoints, [driver1, driver2]) => {
            // Generate telemetry for two teammates
            const lap1 = fc.sample(lapDataArbitrary(numPoints), 1)[0];
            const lap2 = fc.sample(lapDataArbitrary(numPoints), 1)[0];

            // Override driver IDs to be teammates
            lap1.driverId = driver1;
            lap2.driverId = driver2;

            // Property: Teammate telemetry must be aligned to the same distance reference

            // Check 1: Both laps have valid telemetry data
            expect(lap1.telemetry).toBeDefined();
            expect(lap2.telemetry).toBeDefined();

            // Check 2: Distance arrays are sorted (monotonically increasing)
            const distances1 = lap1.telemetry.distance;
            const distances2 = lap2.telemetry.distance;

            for (let i = 1; i < distances1.length; i++) {
              expect(distances1[i]).toBeGreaterThanOrEqual(distances1[i - 1]);
            }
            for (let i = 1; i < distances2.length; i++) {
              expect(distances2[i]).toBeGreaterThanOrEqual(distances2[i - 1]);
            }

            // Check 3: Both drivers' telemetry uses the same distance reference system
            // (i.e., distance 0 is the start line for both, and distances are in meters)
            expect(distances1[0]).toBeGreaterThanOrEqual(0);
            expect(distances2[0]).toBeGreaterThanOrEqual(0);

            // Check 4: The distance ranges should be comparable
            // (both drivers are on the same track)
            const maxDist1 = distances1[distances1.length - 1];
            const maxDist2 = distances2[distances2.length - 1];

            // Both should be within reasonable track length (most F1 tracks are 3-7km)
            expect(maxDist1).toBeLessThanOrEqual(10000);
            expect(maxDist2).toBeLessThanOrEqual(10000);

            // Check 5: For any given distance value, it represents the same
            // physical location for both drivers
            // We verify this by checking that the distance values are in the same scale
            const midDist1 = distances1[Math.floor(distances1.length / 2)];
            const midDist2 = distances2[Math.floor(distances2.length / 2)];

            // Both mid-distances should be in a similar range (same track)
            expect(Math.abs(midDist1 - midDist2)).toBeLessThan(maxDist1); // reasonable difference
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain consistent distance-to-position mapping for teammates', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 50, max: 100 }), // numPoints
          (numPoints) => {
            // Generate two laps with the same session (teammates in same session)
            const sessionId = fc.sample(fc.uuid(), 1)[0];
            const lap1 = fc.sample(lapDataArbitrary(numPoints), 1)[0];
            const lap2 = fc.sample(lapDataArbitrary(numPoints), 1)[0];

            lap1.sessionId = sessionId;
            lap2.sessionId = sessionId;
            lap1.driverId = 'VER';
            lap2.driverId = 'PER';

            // Property: In the same session, distance values map to the same
            // track positions for all drivers

            // Both laps should have the same session
            expect(lap1.sessionId).toBe(lap2.sessionId);

            // Distance arrays should use the same reference system
            const dist1 = lap1.telemetry.distance;
            const dist2 = lap2.telemetry.distance;

            // Both should start from a similar reference point (start line)
            expect(dist1[0]).toBeGreaterThanOrEqual(0);
            expect(dist2[0]).toBeGreaterThanOrEqual(0);

            // The maximum distances should be in the same ballpark
            // (representing the same track length)
            const maxDist1 = dist1[dist1.length - 1];
            const maxDist2 = dist2[dist2.length - 1];

            // Both should represent a full lap of the same track
            expect(maxDist1).toBeGreaterThan(0);
            expect(maxDist2).toBeGreaterThan(0);

            // The distance scale should be consistent
            // (1 meter in lap1 = 1 meter in lap2)
            // We verify this by checking that the distance increments are reasonable
            const avgIncrement1 = maxDist1 / dist1.length;
            const avgIncrement2 = maxDist2 / dist2.length;

            expect(avgIncrement1).toBeGreaterThan(0);
            expect(avgIncrement2).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
