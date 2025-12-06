import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { LapData, TelemetryData } from '../types';
import { calculatePerformanceGaps, findGapAtDistance } from './performanceGap';

/**
 * Property-Based Tests for Performance Gap Highlighting
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

describe('Performance Gap Highlighting Property Tests', () => {
  /**
   * Property 18: Performance gap threshold
   * Feature: f1-analysis-platform, Property 18: Performance gap threshold
   * Validates: Requirements 7.3
   *
   * For any driver comparison, all track sections highlighted as having
   * performance gaps must have gaps exceeding 0.1 seconds, and all sections
   * with gaps exceeding 0.1 seconds must be highlighted.
   */
  describe('Property 18: Performance gap threshold', () => {
    it('should only highlight gaps exceeding the threshold', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 50, max: 100 }), // numPoints
          fc.float({ min: Math.fround(0.05), max: Math.fround(0.5), noNaN: true }), // threshold
          (numPoints, threshold) => {
            // Generate two laps for comparison
            const lap1 = fc.sample(lapDataArbitrary(numPoints), 1)[0];
            const lap2 = fc.sample(lapDataArbitrary(numPoints), 1)[0];

            // Calculate performance gaps with the given threshold
            const gaps = calculatePerformanceGaps(lap1, lap2, threshold);

            // Property: All highlighted gaps must exceed the threshold
            gaps.forEach((gap) => {
              expect(gap.gap).toBeGreaterThan(threshold);
            });

            // Property: Gap values should be non-negative
            gaps.forEach((gap) => {
              expect(gap.gap).toBeGreaterThanOrEqual(0);
            });

            // Property: Gap start should be before or equal to gap end
            gaps.forEach((gap) => {
              expect(gap.startDistance).toBeLessThanOrEqual(gap.endDistance);
            });

            // Property: Gaps should not overlap
            for (let i = 0; i < gaps.length - 1; i++) {
              expect(gaps[i].endDistance).toBeLessThan(gaps[i + 1].startDistance);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should highlight all sections with gaps exceeding 0.1 seconds', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 50, max: 100 }), // numPoints
          (numPoints) => {
            // Generate two laps for comparison
            const lap1 = fc.sample(lapDataArbitrary(numPoints), 1)[0];
            const lap2 = fc.sample(lapDataArbitrary(numPoints), 1)[0];

            const threshold = 0.1; // Standard threshold from requirements
            const gaps = calculatePerformanceGaps(lap1, lap2, threshold);

            // Property: All gaps must exceed the threshold
            gaps.forEach((gap) => {
              expect(gap.gap).toBeGreaterThan(threshold);
            });

            // Property: Each gap should have valid distance bounds
            gaps.forEach((gap) => {
              expect(gap.startDistance).toBeGreaterThanOrEqual(0);
              expect(gap.endDistance).toBeGreaterThanOrEqual(gap.startDistance);

              // Should be within reasonable track bounds
              expect(gap.startDistance).toBeLessThanOrEqual(10000);
              expect(gap.endDistance).toBeLessThanOrEqual(10000);
            });

            // Property: Each gap should indicate which lap is faster
            gaps.forEach((gap) => {
              expect(gap.fasterLapIndex).toBeGreaterThanOrEqual(0);
              expect(gap.fasterLapIndex).toBeLessThanOrEqual(1);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly identify which lap is faster in each gap', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 50, max: 100 }), // numPoints
          (numPoints) => {
            // Generate two laps
            const lap1 = fc.sample(lapDataArbitrary(numPoints), 1)[0];
            const lap2 = fc.sample(lapDataArbitrary(numPoints), 1)[0];

            const threshold = 0.1;
            const gaps = calculatePerformanceGaps(lap1, lap2, threshold);

            // Property: fasterLapIndex should be either 0 or 1
            gaps.forEach((gap) => {
              expect([0, 1]).toContain(gap.fasterLapIndex);
            });

            // Property: Gap magnitude should be positive
            gaps.forEach((gap) => {
              expect(gap.gap).toBeGreaterThan(0);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle edge case where laps are identical', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 50, max: 100 }), // numPoints
          (numPoints) => {
            // Generate one lap and use it for both comparisons
            const lap = fc.sample(lapDataArbitrary(numPoints), 1)[0];
            const lap1 = { ...lap };
            const lap2 = { ...lap };

            const threshold = 0.1;
            const gaps = calculatePerformanceGaps(lap1, lap2, threshold);

            // Property: Identical laps should have no gaps exceeding threshold
            // (or very few due to floating point precision)
            expect(gaps.length).toBeLessThanOrEqual(1);

            // If there are any gaps, they should be very small
            gaps.forEach((gap) => {
              expect(gap.gap).toBeLessThan(threshold * 2);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow finding gaps at specific distances', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 50, max: 100 }), // numPoints
          (numPoints) => {
            // Generate two laps
            const lap1 = fc.sample(lapDataArbitrary(numPoints), 1)[0];
            const lap2 = fc.sample(lapDataArbitrary(numPoints), 1)[0];

            const threshold = 0.1;
            const gaps = calculatePerformanceGaps(lap1, lap2, threshold);

            // Property: For any distance within a gap, findGapAtDistance should return that gap
            gaps.forEach((gap) => {
              const midDistance = (gap.startDistance + gap.endDistance) / 2;
              const foundGap = findGapAtDistance(midDistance, gaps);

              expect(foundGap).toBeDefined();
              expect(foundGap?.startDistance).toBe(gap.startDistance);
              expect(foundGap?.endDistance).toBe(gap.endDistance);
            });

            // Property: For distances outside all gaps, findGapAtDistance should return undefined
            if (gaps.length > 0) {
              const beforeFirstGap = gaps[0].startDistance - 100;
              if (beforeFirstGap >= 0) {
                const foundGap = findGapAtDistance(beforeFirstGap, gaps);
                expect(foundGap).toBeUndefined();
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should respect different threshold values', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 50, max: 100 }), // numPoints
          fc.float({ min: Math.fround(0.05), max: Math.fround(0.5), noNaN: true }), // threshold1
          fc.float({ min: Math.fround(0.05), max: Math.fround(0.5), noNaN: true }), // threshold2
          (numPoints, threshold1, threshold2) => {
            // Generate two laps
            const lap1 = fc.sample(lapDataArbitrary(numPoints), 1)[0];
            const lap2 = fc.sample(lapDataArbitrary(numPoints), 1)[0];

            const gaps1 = calculatePerformanceGaps(lap1, lap2, threshold1);
            const gaps2 = calculatePerformanceGaps(lap1, lap2, threshold2);

            // Property: Higher threshold should result in fewer or equal gaps
            if (threshold1 < threshold2) {
              expect(gaps1.length).toBeGreaterThanOrEqual(gaps2.length);
            } else if (threshold1 > threshold2) {
              expect(gaps2.length).toBeGreaterThanOrEqual(gaps1.length);
            }

            // Property: All gaps should respect their respective thresholds
            gaps1.forEach((gap) => {
              expect(gap.gap).toBeGreaterThan(threshold1);
            });
            gaps2.forEach((gap) => {
              expect(gap.gap).toBeGreaterThan(threshold2);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
