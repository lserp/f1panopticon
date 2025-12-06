/**
 * Property-based tests for Analysis Engine
 * Tests universal properties that should hold across all inputs
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  calculateLapDelta,
  calculateCorrelation,
  analyzeCorrelations,
  analyzeMultivariateCorrelations,
  rankCorrelationsByStrength,
  calculateMean,
  calculateStandardDeviation,
  calculateVariance,
} from './analysisEngine';
import type { LapData, TelemetryData } from '../types';

/**
 * Generator for valid telemetry data
 * Generates realistic telemetry with monotonically increasing distances
 */
const telemetryDataArbitrary = (): fc.Arbitrary<TelemetryData> => {
  return fc
    .tuple(
      fc.integer({ min: 10, max: 100 }), // number of data points
      fc.float({ min: 1000, max: 6000, noNaN: true }) // track length in meters (min 1000 to ensure variation)
    )
    .chain(([numPoints, trackLength]) => {
      // Generate monotonically increasing distance array with guaranteed variation
      const distanceStep = trackLength / (numPoints - 1);
      const distances = fc.constant(Array.from({ length: numPoints }, (_, i) => i * distanceStep));

      return fc.record({
        distance: distances,
        time: fc.array(fc.float({ min: 0, max: 200, noNaN: true }), {
          minLength: numPoints,
          maxLength: numPoints,
        }),
        speed: fc.array(fc.float({ min: 50, max: 350, noNaN: true }), {
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
        gear: fc.array(fc.integer({ min: 1, max: 8 }), {
          minLength: numPoints,
          maxLength: numPoints,
        }),
        rpm: fc.array(fc.float({ min: 5000, max: 15000, noNaN: true }), {
          minLength: numPoints,
          maxLength: numPoints,
        }),
        drs: fc.array(fc.integer({ min: 0, max: 14 }), {
          minLength: numPoints,
          maxLength: numPoints,
        }),
        nGear: fc.array(fc.float({ min: 0, max: 1, noNaN: true }), {
          minLength: numPoints,
          maxLength: numPoints,
        }),
      });
    });
};

/**
 * Generator for valid lap data
 */
const lapDataArbitrary = (): fc.Arbitrary<LapData> => {
  return fc.record({
    sessionId: fc.uuid(),
    driverId: fc.uuid(),
    lapNumber: fc.integer({ min: 1, max: 70 }),
    lapTime: fc.float({ min: 60, max: 150, noNaN: true }), // 1-2.5 minutes
    sector1Time: fc.float({ min: 15, max: 40, noNaN: true }),
    sector2Time: fc.float({ min: 15, max: 40, noNaN: true }),
    sector3Time: fc.float({ min: 15, max: 40, noNaN: true }),
    tireCompound: fc.constantFrom('soft', 'medium', 'hard', 'intermediate', 'wet'),
    tireAge: fc.integer({ min: 0, max: 50 }),
    telemetry: telemetryDataArbitrary(),
    fuelLoad: fc.float({ min: 0, max: 110, noNaN: true }),
    trackStatus: fc.constantFrom('green', 'yellow', 'red'),
  });
};

describe('Analysis Engine - Property Tests', () => {
  describe('Property 14: Delta antisymmetry', () => {
    /**
     * Feature: f1-analysis-platform, Property 14: Delta antisymmetry
     * Validates: Requirements 4.2
     *
     * For any two laps A and B, the lap time delta from A to B must equal
     * the negative of the delta from B to A: delta(A,B) = -delta(B,A)
     */
    it('should satisfy delta(A,B) = -delta(B,A) for lap times', () => {
      fc.assert(
        fc.property(lapDataArbitrary(), lapDataArbitrary(), (lapA, lapB) => {
          const deltaAB = calculateLapDelta(lapA, lapB);
          const deltaBA = calculateLapDelta(lapB, lapA);

          // Check lap time antisymmetry
          expect(deltaAB.lapTime).toBeCloseTo(-deltaBA.lapTime, 10);
        }),
        { numRuns: 100 }
      );
    });

    it('should satisfy delta(A,B) = -delta(B,A) for sector times', () => {
      fc.assert(
        fc.property(lapDataArbitrary(), lapDataArbitrary(), (lapA, lapB) => {
          const deltaAB = calculateLapDelta(lapA, lapB);
          const deltaBA = calculateLapDelta(lapB, lapA);

          // Check sector time antisymmetry
          expect(deltaAB.sector1).toBeCloseTo(-deltaBA.sector1, 10);
          expect(deltaAB.sector2).toBeCloseTo(-deltaBA.sector2, 10);
          expect(deltaAB.sector3).toBeCloseTo(-deltaBA.sector3, 10);
        }),
        { numRuns: 100 }
      );
    });

    it('should satisfy delta(A,B) = -delta(B,A) for speed differentials', () => {
      fc.assert(
        fc.property(lapDataArbitrary(), lapDataArbitrary(), (lapA, lapB) => {
          const deltaAB = calculateLapDelta(lapA, lapB);
          const deltaBA = calculateLapDelta(lapB, lapA);

          // Speed differentials should have same length
          expect(deltaAB.speedDifferential.length).toBe(deltaBA.speedDifferential.length);

          // Check speed differential antisymmetry at each point
          for (let i = 0; i < deltaAB.speedDifferential.length; i++) {
            const diffAB = deltaAB.speedDifferential[i];
            const diffBA = deltaBA.speedDifferential[i];

            // Same distance
            expect(diffAB.distance).toBeCloseTo(diffBA.distance, 5);

            // Antisymmetric speed delta
            expect(diffAB.speedDelta).toBeCloseTo(-diffBA.speedDelta, 5);

            // Swapped lap speeds
            expect(diffAB.lap1Speed).toBeCloseTo(diffBA.lap2Speed, 5);
            expect(diffAB.lap2Speed).toBeCloseTo(diffBA.lap1Speed, 5);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 20: Correlation self-identity', () => {
    /**
     * Feature: f1-analysis-platform, Property 20: Correlation self-identity
     * Validates: Requirements 8.1
     *
     * For any telemetry parameter X, the correlation coefficient between X and
     * itself must equal 1.0
     */
    it('should return 1.0 for correlation of a parameter with itself', () => {
      fc.assert(
        fc.property(
          fc.array(fc.float({ min: -1000, max: 1000, noNaN: true }), {
            minLength: 10,
            maxLength: 100,
          }),
          (values) => {
            // Skip arrays with no variance
            const hasVariance = values.some((v, i) => i > 0 && v !== values[0]);
            if (!hasVariance) {
              return true; // Skip this case
            }

            const correlation = calculateCorrelation(values, values);
            expect(correlation).toBeCloseTo(1.0, 10);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 1.0 for self-correlation in multivariate analysis', () => {
      fc.assert(
        fc.property(fc.array(lapDataArbitrary(), { minLength: 10, maxLength: 50 }), (laps) => {
          const params: Array<keyof TelemetryData> = ['speed', 'throttle', 'brake'];
          const result = analyzeMultivariateCorrelations(laps, params);

          // Check diagonal elements are 1.0
          for (let i = 0; i < result.correlationMatrix.length; i++) {
            expect(result.correlationMatrix[i][i]).toBeCloseTo(1.0, 10);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 21: Correlation symmetry', () => {
    /**
     * Feature: f1-analysis-platform, Property 21: Correlation symmetry
     * Validates: Requirements 8.1
     *
     * For any two telemetry parameters X and Y, the correlation coefficient
     * between X and Y must equal the correlation coefficient between Y and X
     */
    it('should satisfy corr(X,Y) = corr(Y,X)', () => {
      fc.assert(
        fc.property(
          fc.array(fc.float({ min: -1000, max: 1000, noNaN: true }), {
            minLength: 10,
            maxLength: 100,
          }),
          fc.array(fc.float({ min: -1000, max: 1000, noNaN: true }), {
            minLength: 10,
            maxLength: 100,
          }),
          (valuesX, valuesY) => {
            // Ensure same length
            const minLength = Math.min(valuesX.length, valuesY.length);
            const x = valuesX.slice(0, minLength);
            const y = valuesY.slice(0, minLength);

            const corrXY = calculateCorrelation(x, y);
            const corrYX = calculateCorrelation(y, x);

            expect(corrXY).toBeCloseTo(corrYX, 10);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have symmetric correlation matrix in multivariate analysis', () => {
      fc.assert(
        fc.property(fc.array(lapDataArbitrary(), { minLength: 10, maxLength: 50 }), (laps) => {
          const params: Array<keyof TelemetryData> = ['speed', 'throttle', 'brake'];
          const result = analyzeMultivariateCorrelations(laps, params);

          const matrix = result.correlationMatrix;
          const n = matrix.length;

          // Check matrix is symmetric
          for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
              expect(matrix[i][j]).toBeCloseTo(matrix[j][i], 10);
            }
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 22: Multivariate consistency', () => {
    /**
     * Feature: f1-analysis-platform, Property 22: Multivariate consistency
     * Validates: Requirements 8.3
     *
     * For any telemetry parameter X, the univariate correlation between X and
     * lap time must match the corresponding coefficient in the multivariate
     * analysis (partial correlation)
     */
    it('should have consistent univariate and multivariate correlations', () => {
      fc.assert(
        fc.property(fc.array(lapDataArbitrary(), { minLength: 10, maxLength: 50 }), (laps) => {
          const params: Array<keyof TelemetryData> = ['speed', 'throttle', 'brake'];

          // Get univariate correlations
          const univariateResults = analyzeCorrelations(laps, params);

          // Get multivariate correlations
          const multivariateResult = analyzeMultivariateCorrelations(laps, params);

          // Check each parameter's correlation matches
          for (const univariate of univariateResults) {
            const multivariateCorr = multivariateResult.partialCorrelations.get(
              univariate.parameter
            );

            if (multivariateCorr !== undefined) {
              expect(univariate.coefficient).toBeCloseTo(multivariateCorr, 5);
            }
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 23: Ranking order correctness', () => {
    /**
     * Feature: f1-analysis-platform, Property 23: Ranking order correctness
     * Validates: Requirements 8.4
     *
     * For any set of correlation results ranked by strength, each parameter's
     * position in the ranking must correspond to its correlation coefficient
     * magnitude, with higher magnitudes appearing earlier in the ranking
     */
    it('should rank correlations by absolute coefficient magnitude', () => {
      fc.assert(
        fc.property(fc.array(lapDataArbitrary(), { minLength: 10, maxLength: 50 }), (laps) => {
          const params: Array<keyof TelemetryData> = ['speed', 'throttle', 'brake', 'rpm'];
          const results = analyzeCorrelations(laps, params);
          const ranked = rankCorrelationsByStrength(results);

          // Check that sorted array is in descending order by absolute coefficient
          for (let i = 0; i < ranked.sortedByStrength.length - 1; i++) {
            const current = Math.abs(ranked.sortedByStrength[i].coefficient);
            const next = Math.abs(ranked.sortedByStrength[i + 1].coefficient);
            expect(current).toBeGreaterThanOrEqual(next);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve all results when ranking', () => {
      fc.assert(
        fc.property(fc.array(lapDataArbitrary(), { minLength: 10, maxLength: 50 }), (laps) => {
          const params: Array<keyof TelemetryData> = ['speed', 'throttle', 'brake'];
          const results = analyzeCorrelations(laps, params);
          const ranked = rankCorrelationsByStrength(results);

          // Check that all results are preserved
          expect(ranked.sortedByStrength.length).toBe(results.length);

          // Check that all parameters are present
          const originalParams = new Set(results.map((r) => r.parameter));
          const rankedParams = new Set(ranked.sortedByStrength.map((r) => r.parameter));
          expect(rankedParams).toEqual(originalParams);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 19: Statistical calculation correctness', () => {
    /**
     * Feature: f1-analysis-platform, Property 19: Statistical calculation correctness
     * Validates: Requirements 7.5
     *
     * For any set of lap times, the calculated standard deviation must satisfy
     * the mathematical definition: sqrt(sum((x - mean)^2) / n)
     */
    it('should calculate standard deviation correctly', () => {
      fc.assert(
        fc.property(
          fc.array(fc.float({ min: 60, max: 150, noNaN: true }), {
            minLength: 5,
            maxLength: 100,
          }),
          (values) => {
            const stdDev = calculateStandardDeviation(values);

            // Manually calculate standard deviation
            const mean = calculateMean(values);
            const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
            const variance = squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;
            const expectedStdDev = Math.sqrt(variance);

            expect(stdDev).toBeCloseTo(expectedStdDev, 10);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should calculate variance correctly', () => {
      fc.assert(
        fc.property(
          fc.array(fc.float({ min: 60, max: 150, noNaN: true }), {
            minLength: 5,
            maxLength: 100,
          }),
          (values) => {
            const variance = calculateVariance(values);
            const stdDev = calculateStandardDeviation(values);

            // Variance should equal standard deviation squared
            expect(variance).toBeCloseTo(stdDev * stdDev, 10);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have mean within min and max values', () => {
      fc.assert(
        fc.property(
          fc.array(fc.float({ min: 60, max: 150, noNaN: true }), {
            minLength: 5,
            maxLength: 100,
          }),
          (values) => {
            const mean = calculateMean(values);
            const min = Math.min(...values);
            const max = Math.max(...values);

            expect(mean).toBeGreaterThanOrEqual(min);
            expect(mean).toBeLessThanOrEqual(max);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have standard deviation of zero for constant values', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 60, max: 150, noNaN: true }),
          fc.integer({ min: 5, max: 100 }),
          (value, count) => {
            const values = Array(count).fill(value);
            const stdDev = calculateStandardDeviation(values);

            expect(stdDev).toBeCloseTo(0, 10);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should satisfy the relationship: variance = sum((x - mean)^2) / n', () => {
      fc.assert(
        fc.property(
          fc.array(fc.float({ min: 60, max: 150, noNaN: true }), {
            minLength: 5,
            maxLength: 100,
          }),
          (values) => {
            const variance = calculateVariance(values);
            const mean = calculateMean(values);

            // Calculate variance manually
            const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
            const expectedVariance = squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;

            expect(variance).toBeCloseTo(expectedVariance, 10);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
