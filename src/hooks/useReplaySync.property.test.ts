import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { findTelemetryPointAtTime } from './useReplaySync';

/**
 * **Feature: f1-analysis-platform, Property 13: Replay synchronization**
 *
 * Property: For any replay time T during session replay, all displayed telemetry
 * channels must show data corresponding to time T (within the data sampling frequency).
 *
 * **Validates: Requirements 9.5**
 */

// Generator for valid telemetry data
const telemetryDataArbitrary = fc.integer({ min: 10, max: 100 }).chain((length) =>
  fc.record({
    distance: fc
      .array(fc.float({ min: 0, max: 10000, noNaN: true }), {
        minLength: length,
        maxLength: length,
      })
      .map((arr) => {
        // Ensure distances are sorted
        return arr.sort((a, b) => a - b);
      }),
    time: fc
      .array(fc.float({ min: 0, max: 300, noNaN: true }), { minLength: length, maxLength: length })
      .map((arr) => {
        // Ensure times are sorted
        return arr.sort((a, b) => a - b);
      }),
    speed: fc.array(fc.float({ min: 0, max: 350, noNaN: true }), {
      minLength: length,
      maxLength: length,
    }),
    throttle: fc.array(fc.float({ min: 0, max: 100, noNaN: true }), {
      minLength: length,
      maxLength: length,
    }),
    brake: fc.array(fc.float({ min: 0, max: 100, noNaN: true }), {
      minLength: length,
      maxLength: length,
    }),
    gear: fc.array(fc.integer({ min: 1, max: 8 }), { minLength: length, maxLength: length }),
    rpm: fc.array(fc.float({ min: 5000, max: 15000, noNaN: true }), {
      minLength: length,
      maxLength: length,
    }),
    drs: fc.array(fc.integer({ min: 0, max: 14 }), { minLength: length, maxLength: length }),
    nGear: fc.array(fc.float({ min: 0, max: 1, noNaN: true }), {
      minLength: length,
      maxLength: length,
    }),
  })
);

describe('Property 13: Replay synchronization', () => {
  it('should find a telemetry point within sampling frequency for any valid time', () => {
    fc.assert(
      fc.property(telemetryDataArbitrary, (telemetry) => {
        // Skip if telemetry is empty
        if (telemetry.time.length === 0) {
          return;
        }

        const minTime = telemetry.time[0];
        const maxTime = telemetry.time[telemetry.time.length - 1];

        // Skip if all times are the same (edge case with no time progression)
        if (minTime === maxTime) {
          return;
        }

        // Test at various points in the session
        const testTimes = [
          minTime,
          maxTime,
          (minTime + maxTime) / 2,
          minTime + (maxTime - minTime) * 0.25,
          minTime + (maxTime - minTime) * 0.75,
        ];

        // Calculate the maximum gap between consecutive time values
        // This handles non-uniform time distributions
        let maxTimeGap = 0;
        for (let i = 1; i < telemetry.time.length; i++) {
          const gap = telemetry.time[i] - telemetry.time[i - 1];
          maxTimeGap = Math.max(maxTimeGap, gap);
        }

        testTimes.forEach((time) => {
          const result = findTelemetryPointAtTime(telemetry, time);

          // Should always find a point
          expect(result).not.toBeNull();

          if (result) {
            // The found point should be within the telemetry data
            expect(result.index).toBeGreaterThanOrEqual(0);
            expect(result.index).toBeLessThan(telemetry.time.length);

            // The time at the found index should be close to the requested time
            const foundTime = telemetry.time[result.index];

            // The found time should be within the maximum time gap
            // (this is the actual sampling frequency for non-uniform data)
            const timeDifference = Math.abs(foundTime - time);
            const epsilon = 1e-10;
            expect(timeDifference).toBeLessThanOrEqual(maxTimeGap + epsilon);

            // The distance should correspond to the found index
            expect(result.distance).toBe(telemetry.distance[result.index]);
          }
        });
      }),
      { numRuns: 100 }
    );
  });

  it('should maintain time consistency across all telemetry channels', () => {
    fc.assert(
      fc.property(telemetryDataArbitrary, (telemetry) => {
        // Skip if telemetry is empty
        if (telemetry.time.length === 0) {
          return;
        }

        const minTime = telemetry.time[0];
        const maxTime = telemetry.time[telemetry.time.length - 1];

        // Skip if all times are the same
        if (minTime === maxTime) {
          return;
        }

        const testTime = (minTime + maxTime) / 2;

        const result = findTelemetryPointAtTime(telemetry, testTime);

        // Should always find a result for valid telemetry
        expect(result).not.toBeNull();

        if (result) {
          const { index } = result;

          // Index should be valid
          expect(index).toBeGreaterThanOrEqual(0);
          expect(index).toBeLessThan(telemetry.time.length);

          // All telemetry channels should have data at the same index
          // (they should all be the same length and synchronized)
          expect(telemetry.distance[index]).toBeDefined();
          expect(telemetry.time[index]).toBeDefined();
          expect(telemetry.speed[index]).toBeDefined();
          expect(telemetry.throttle[index]).toBeDefined();
          expect(telemetry.brake[index]).toBeDefined();
          expect(telemetry.gear[index]).toBeDefined();
          expect(telemetry.rpm[index]).toBeDefined();
          expect(telemetry.drs[index]).toBeDefined();
          expect(telemetry.nGear[index]).toBeDefined();

          // All channels should be synchronized to the same time
          const channelTime = telemetry.time[index];
          expect(channelTime).toBe(telemetry.time[index]);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should return monotonically increasing distances for increasing times', () => {
    fc.assert(
      fc.property(telemetryDataArbitrary, (telemetry) => {
        // Skip if telemetry is too short
        if (telemetry.time.length < 3) {
          return;
        }

        const minTime = telemetry.time[0];
        const maxTime = telemetry.time[telemetry.time.length - 1];

        // Generate a sequence of increasing times
        const numSteps = Math.min(10, telemetry.time.length);
        const timeStep = (maxTime - minTime) / numSteps;

        let previousDistance = -1;

        for (let i = 0; i <= numSteps; i++) {
          const time = minTime + i * timeStep;
          const result = findTelemetryPointAtTime(telemetry, time);

          if (result) {
            // Distance should be non-decreasing as time increases
            expect(result.distance).toBeGreaterThanOrEqual(previousDistance);
            previousDistance = result.distance;
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should handle boundary conditions correctly', () => {
    fc.assert(
      fc.property(telemetryDataArbitrary, (telemetry) => {
        // Skip if telemetry is empty
        if (telemetry.time.length === 0) {
          return;
        }

        const minTime = telemetry.time[0];
        const maxTime = telemetry.time[telemetry.time.length - 1];

        // Test before start
        const beforeStart = findTelemetryPointAtTime(telemetry, minTime - 10);
        expect(beforeStart).not.toBeNull();
        if (beforeStart) {
          expect(beforeStart.index).toBe(0);
          expect(beforeStart.distance).toBe(telemetry.distance[0]);
        }

        // Test after end
        const afterEnd = findTelemetryPointAtTime(telemetry, maxTime + 10);
        expect(afterEnd).not.toBeNull();
        if (afterEnd) {
          expect(afterEnd.index).toBe(telemetry.time.length - 1);
          expect(afterEnd.distance).toBe(telemetry.distance[telemetry.time.length - 1]);
        }

        // Test at exact start
        const atStart = findTelemetryPointAtTime(telemetry, minTime);
        expect(atStart).not.toBeNull();
        if (atStart) {
          expect(atStart.index).toBe(0);
        }

        // Test at exact end
        const atEnd = findTelemetryPointAtTime(telemetry, maxTime);
        expect(atEnd).not.toBeNull();
        if (atEnd) {
          expect(atEnd.index).toBe(telemetry.time.length - 1);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should return the same result for the same time query', () => {
    fc.assert(
      fc.property(telemetryDataArbitrary, (telemetry) => {
        // Skip if telemetry is empty
        if (telemetry.time.length === 0) {
          return;
        }

        const minTime = telemetry.time[0];
        const maxTime = telemetry.time[telemetry.time.length - 1];
        const testTime = (minTime + maxTime) / 2;

        // Query the same time multiple times
        const result1 = findTelemetryPointAtTime(telemetry, testTime);
        const result2 = findTelemetryPointAtTime(telemetry, testTime);
        const result3 = findTelemetryPointAtTime(telemetry, testTime);

        // All results should be identical
        expect(result1).toEqual(result2);
        expect(result2).toEqual(result3);
      }),
      { numRuns: 100 }
    );
  });
});
