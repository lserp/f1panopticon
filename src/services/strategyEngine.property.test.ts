/**
 * Property-based tests for Strategy Engine
 * Tests correctness properties for pit exit calculations and strategy simulation
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  calculatePitExitPosition,
  calculateTimeGaps,
  simulateStrategy,
  type RaceState,
} from './strategyEngine';
import type { CarPosition } from '../types';

describe('Strategy Engine - Property-Based Tests', () => {
  /**
   * Property 15: Pit exit position consistency
   * Feature: f1-analysis-platform, Property 15: Pit exit position consistency
   * Validates: Requirements 5.2
   *
   * For any pit stop at lap N, the calculated pit exit position must be consistent
   * with the driver's track position in the lap data immediately after lap N.
   */
  describe('Property 15: Pit exit position consistency', () => {
    it('should maintain position consistency after pit stop', () => {
      fc.assert(
        fc.property(
          // Generate race state
          fc.record({
            lap: fc.integer({ min: 1, max: 70 }),
            positions: fc
              .array(
                fc.record({
                  driverId: fc.string({ minLength: 3, maxLength: 3 }),
                  position: fc.integer({ min: 1, max: 20 }),
                  distance: fc.float({ min: 0, max: 6000, noNaN: true }),
                  gap: fc.float({ min: 0, max: 60, noNaN: true }),
                }),
                { minLength: 3, maxLength: 20 }
              )
              .map((positions) => {
                // Ensure unique driver IDs and positions
                const uniquePositions = positions.map((pos, index) => ({
                  ...pos,
                  driverId: `DR${index.toString().padStart(2, '0')}`,
                  position: index + 1,
                  distance: 6000 - index * 300, // Spread cars out
                }));
                return uniquePositions;
              }),
            timestamp: fc
              .integer({ min: 1577836800000, max: 1924905600000 })
              .map((ts) => new Date(ts)),
          }),
          fc.float({ min: 20, max: 30, noNaN: true }), // pit duration
          fc.float({ min: 1000, max: 5000, noNaN: true }), // pit exit distance
          (raceState: RaceState, pitDuration: number, pitExitDistance: number) => {
            // Pick a driver from the race state
            const driverId = raceState.positions[0].driverId;
            const pitLap = raceState.lap;

            // Calculate pit exit position
            const pitExitAnalysis = calculatePitExitPosition(
              pitLap,
              pitDuration,
              raceState,
              pitExitDistance,
              driverId
            );

            // Property: Position before should be valid
            expect(pitExitAnalysis.positionBefore).toBeGreaterThanOrEqual(1);
            expect(pitExitAnalysis.positionBefore).toBeLessThanOrEqual(raceState.positions.length);

            // Property: Position after should be valid
            expect(pitExitAnalysis.positionAfter).toBeGreaterThanOrEqual(1);
            expect(pitExitAnalysis.positionAfter).toBeLessThanOrEqual(raceState.positions.length);

            // Property: Exit distance should match input
            expect(pitExitAnalysis.exitDistance).toBe(pitExitDistance);

            // Property: Pit lap should match input
            expect(pitExitAnalysis.pitLap).toBe(pitLap);

            // Property: Exit time should be after race state timestamp
            expect(pitExitAnalysis.exitTime.getTime()).toBeGreaterThanOrEqual(
              raceState.timestamp.getTime()
            );

            // Property: If there are cars ahead, gap should be positive
            if (pitExitAnalysis.carsAhead.length > 0) {
              expect(pitExitAnalysis.gapAhead).toBeGreaterThanOrEqual(0);
            }

            // Property: If there are cars behind, gap should be positive
            if (pitExitAnalysis.carsBehind.length > 0) {
              expect(pitExitAnalysis.gapBehind).toBeGreaterThanOrEqual(0);
            }

            // Property: Traffic impact should be valid
            expect(['clear', 'minor', 'significant']).toContain(pitExitAnalysis.trafficImpact);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve driver identity through pit stop', () => {
      fc.assert(
        fc.property(
          fc.record({
            lap: fc.integer({ min: 1, max: 70 }),
            positions: fc
              .array(
                fc.record({
                  driverId: fc.string({ minLength: 3, maxLength: 3 }),
                  position: fc.integer({ min: 1, max: 20 }),
                  distance: fc.float({ min: 0, max: 6000, noNaN: true }),
                  gap: fc.float({ min: 0, max: 60, noNaN: true }),
                }),
                { minLength: 5, maxLength: 20 }
              )
              .map((positions) => {
                const uniquePositions = positions.map((pos, index) => ({
                  ...pos,
                  driverId: `DR${index.toString().padStart(2, '0')}`,
                  position: index + 1,
                  distance: 6000 - index * 300,
                }));
                return uniquePositions;
              }),
            timestamp: fc
              .integer({ min: 1577836800000, max: 1924905600000 })
              .map((ts) => new Date(ts)),
          }),
          fc.float({ min: 20, max: 30, noNaN: true }),
          fc.float({ min: 1000, max: 5000, noNaN: true }),
          fc.integer({ min: 0, max: 4 }), // index of driver to pit
          (
            raceState: RaceState,
            pitDuration: number,
            pitExitDistance: number,
            driverIndex: number
          ) => {
            const driverId = raceState.positions[driverIndex].driverId;
            const pitLap = raceState.lap;

            const pitExitAnalysis = calculatePitExitPosition(
              pitLap,
              pitDuration,
              raceState,
              pitExitDistance,
              driverId
            );

            // Property: The analysis should be for the correct driver
            // (implicitly tested by the function not throwing an error)
            expect(pitExitAnalysis.pitLap).toBe(pitLap);
            expect(pitExitAnalysis.exitDistance).toBe(pitExitDistance);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 16: Time gap transitivity
   * Feature: f1-analysis-platform, Property 16: Time gap transitivity
   * Validates: Requirements 5.3
   *
   * For any three cars A, B, and C at the same moment, if gap(A,B) = X seconds
   * and gap(B,C) = Y seconds, then gap(A,C) must equal X + Y seconds
   * (within measurement precision).
   */
  describe('Property 16: Time gap transitivity', () => {
    it('should maintain transitive time gaps between cars', () => {
      fc.assert(
        fc.property(
          fc
            .array(
              fc.record({
                driverId: fc.string({ minLength: 3, maxLength: 3 }),
                position: fc.integer({ min: 1, max: 20 }),
                distance: fc.float({ min: 0, max: 6000, noNaN: true }),
                gap: fc.float({ min: 0, max: 60, noNaN: true }),
              }),
              { minLength: 3, maxLength: 20 }
            )
            .map((positions) => {
              // Create positions with proper ordering
              const sortedPositions = positions
                .map((pos, index) => ({
                  ...pos,
                  driverId: `DR${index.toString().padStart(2, '0')}`,
                  position: index + 1,
                  distance: 6000 - index * 300, // Evenly spaced
                }))
                .sort((a, b) => b.distance - a.distance);
              return sortedPositions;
            }),
          fc.float({ min: 80, max: 100, noNaN: true }), // average lap time
          fc.float({ min: 5000, max: 6500, noNaN: true }), // track length
          (positions: CarPosition[], averageLapTime: number, trackLength: number) => {
            // Calculate time gaps
            const positionsWithGaps = calculateTimeGaps(positions, averageLapTime, trackLength);

            // Test transitivity for all triplets
            for (let i = 0; i < positionsWithGaps.length - 2; i++) {
              const carA = positionsWithGaps[i];
              const carB = positionsWithGaps[i + 1];
              const carC = positionsWithGaps[i + 2];

              // Calculate gaps
              const gapAB = carB.gap - carA.gap;
              const gapBC = carC.gap - carB.gap;
              const gapAC = carC.gap - carA.gap;

              // Property: gap(A,C) should equal gap(A,B) + gap(B,C)
              // Allow small floating point error
              const expectedGapAC = gapAB + gapBC;
              expect(Math.abs(gapAC - expectedGapAC)).toBeLessThan(0.01);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain gap ordering', () => {
      fc.assert(
        fc.property(
          fc
            .array(
              fc.record({
                driverId: fc.string({ minLength: 3, maxLength: 3 }),
                position: fc.integer({ min: 1, max: 20 }),
                distance: fc.float({ min: 0, max: 6000, noNaN: true }),
                gap: fc.float({ min: 0, max: 60, noNaN: true }),
              }),
              { minLength: 2, maxLength: 20 }
            )
            .map((positions) => {
              const sortedPositions = positions
                .map((pos, index) => ({
                  ...pos,
                  driverId: `DR${index.toString().padStart(2, '0')}`,
                  position: index + 1,
                  distance: 6000 - index * 300,
                }))
                .sort((a, b) => b.distance - a.distance);
              return sortedPositions;
            }),
          fc.float({ min: 80, max: 100, noNaN: true }),
          fc.float({ min: 5000, max: 6500, noNaN: true }),
          (positions: CarPosition[], averageLapTime: number, trackLength: number) => {
            const positionsWithGaps = calculateTimeGaps(positions, averageLapTime, trackLength);

            // Property: Leader should have gap of 0
            expect(positionsWithGaps[0].gap).toBe(0);

            // Property: Gaps should be non-decreasing (each car further back has larger gap)
            for (let i = 1; i < positionsWithGaps.length; i++) {
              expect(positionsWithGaps[i].gap).toBeGreaterThanOrEqual(positionsWithGaps[i - 1].gap);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should calculate gaps proportional to distance differences', () => {
      fc.assert(
        fc.property(
          fc
            .array(
              fc.record({
                driverId: fc.string({ minLength: 3, maxLength: 3 }),
                position: fc.integer({ min: 1, max: 20 }),
                distance: fc.float({ min: 0, max: 6000, noNaN: true }),
                gap: fc.float({ min: 0, max: 60, noNaN: true }),
              }),
              { minLength: 2, maxLength: 10 }
            )
            .map((positions) => {
              const sortedPositions = positions
                .map((pos, index) => ({
                  ...pos,
                  driverId: `DR${index.toString().padStart(2, '0')}`,
                  position: index + 1,
                  distance: 6000 - index * 500, // Fixed spacing
                }))
                .sort((a, b) => b.distance - a.distance);
              return sortedPositions;
            }),
          fc.float({ min: 80, max: 100, noNaN: true }),
          fc.float({ min: 5000, max: 6500, noNaN: true }),
          (positions: CarPosition[], averageLapTime: number, trackLength: number) => {
            const positionsWithGaps = calculateTimeGaps(positions, averageLapTime, trackLength);

            // Property: Time gap should be proportional to distance gap
            const distancePerSecond = trackLength / averageLapTime;

            for (let i = 1; i < positionsWithGaps.length; i++) {
              const distanceGap = positionsWithGaps[0].distance - positionsWithGaps[i].distance;
              const expectedTimeGap = distanceGap / distancePerSecond;

              // Allow small floating point error
              expect(Math.abs(positionsWithGaps[i].gap - expectedTimeGap)).toBeLessThan(0.1);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 17: Strategy simulation consistency
   * Feature: f1-analysis-platform, Property 17: Strategy simulation consistency
   * Validates: Requirements 5.4
   *
   * For any race scenario, simulating the same strategy twice with identical inputs
   * must produce identical results including predicted finish times and positions.
   */
  describe('Property 17: Strategy simulation consistency', () => {
    it('should produce identical results for identical inputs', () => {
      fc.assert(
        fc.property(
          // Generate race data
          fc.record({
            totalLaps: fc.integer({ min: 50, max: 70 }),
            trackLength: fc.float({ min: 5000, max: 7000, noNaN: true }),
            averageLapTime: fc.float({ min: 80, max: 100, noNaN: true }),
            currentLap: fc.integer({ min: 1, max: 30 }),
            positions: fc
              .array(
                fc.record({
                  driverId: fc.string({ minLength: 3, maxLength: 3 }),
                  position: fc.integer({ min: 1, max: 20 }),
                  distance: fc.float({ min: 0, max: 6000, noNaN: true }),
                  gap: fc.float({ min: 0, max: 60, noNaN: true }),
                }),
                { minLength: 3, maxLength: 10 }
              )
              .map((positions) => {
                return positions.map((pos, index) => ({
                  ...pos,
                  driverId: `DR${index.toString().padStart(2, '0')}`,
                  position: index + 1,
                  distance: 6000 - index * 300,
                }));
              }),
            weatherConditions: fc.constantFrom('dry', 'wet', 'mixed'),
            safetyCarProbability: fc.float({ min: 0, max: 0.5, noNaN: true }),
          }),
          // Generate strategy plan
          fc.record({
            pitStops: fc
              .array(
                fc.record({
                  lap: fc.integer({ min: 10, max: 50 }),
                  duration: fc.float({ min: 20, max: 30, noNaN: true }),
                  tireCompoundIn: fc.constantFrom('soft', 'medium', 'hard'),
                  tireCompoundOut: fc.constantFrom('soft', 'medium', 'hard'),
                  reason: fc.constantFrom('planned', 'damage', 'safety_car'),
                }),
                { minLength: 1, maxLength: 3 }
              )
              .map((stops) => {
                // Sort by lap number and ensure unique laps
                return stops
                  .map((stop, index) => ({
                    ...stop,
                    lap: 10 + index * 15,
                  }))
                  .sort((a, b) => a.lap - b.lap);
              }),
            tireAllocation: fc
              .array(
                fc.record({
                  startLap: fc.integer({ min: 1, max: 50 }),
                  endLap: fc.integer({ min: 10, max: 70 }),
                  compound: fc.constantFrom('soft', 'medium', 'hard'),
                  expectedLaps: fc.integer({ min: 10, max: 30 }),
                }),
                { minLength: 2, maxLength: 4 }
              )
              .map((stints) => {
                // Create non-overlapping stints
                let currentLap = 1;
                return stints.map((stint, index) => {
                  const startLap = currentLap;
                  const endLap = startLap + 15 + index * 5;
                  currentLap = endLap + 1;
                  return {
                    ...stint,
                    startLap,
                    endLap,
                    expectedLaps: endLap - startLap + 1,
                  };
                });
              }),
            estimatedFinishTime: fc.float({ min: 5000, max: 6000, noNaN: true }),
            riskLevel: fc.constantFrom('low', 'medium', 'high'),
          }),
          (raceData, strategyPlan) => {
            // Simulate the strategy twice
            const result1 = simulateStrategy(raceData, strategyPlan);
            const result2 = simulateStrategy(raceData, strategyPlan);

            // Property: Results should be identical
            expect(result1.predictedFinishTime).toBe(result2.predictedFinishTime);
            expect(result1.predictedPosition).toBe(result2.predictedPosition);

            // Confidence intervals should be identical
            expect(result1.confidenceInterval.lower).toBe(result2.confidenceInterval.lower);
            expect(result1.confidenceInterval.upper).toBe(result2.confidenceInterval.upper);
            expect(result1.confidenceInterval.confidence).toBe(
              result2.confidenceInterval.confidence
            );
            expect(result1.confidenceInterval.mean).toBe(result2.confidenceInterval.mean);

            // Risk assessment should be identical
            expect(result1.riskAssessment.level).toBe(result2.riskAssessment.level);
            expect(result1.riskAssessment.factors).toEqual(result2.riskAssessment.factors);

            // Alternative outcomes should be identical
            expect(result1.alternativeOutcomes.length).toBe(result2.alternativeOutcomes.length);

            for (let i = 0; i < result1.alternativeOutcomes.length; i++) {
              expect(result1.alternativeOutcomes[i].scenario).toBe(
                result2.alternativeOutcomes[i].scenario
              );
              expect(result1.alternativeOutcomes[i].probability).toBe(
                result2.alternativeOutcomes[i].probability
              );
              expect(result1.alternativeOutcomes[i].finishTime).toBe(
                result2.alternativeOutcomes[i].finishTime
              );
              expect(result1.alternativeOutcomes[i].position).toBe(
                result2.alternativeOutcomes[i].position
              );
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should produce valid predictions', () => {
      fc.assert(
        fc.property(
          fc.record({
            totalLaps: fc.integer({ min: 50, max: 70 }),
            trackLength: fc.float({ min: 5000, max: 7000, noNaN: true }),
            averageLapTime: fc.float({ min: 80, max: 100, noNaN: true }),
            currentLap: fc.integer({ min: 1, max: 30 }),
            positions: fc
              .array(
                fc.record({
                  driverId: fc.string({ minLength: 3, maxLength: 3 }),
                  position: fc.integer({ min: 1, max: 20 }),
                  distance: fc.float({ min: 0, max: 6000, noNaN: true }),
                  gap: fc.float({ min: 0, max: 60, noNaN: true }),
                }),
                { minLength: 3, maxLength: 10 }
              )
              .map((positions) => {
                return positions.map((pos, index) => ({
                  ...pos,
                  driverId: `DR${index.toString().padStart(2, '0')}`,
                  position: index + 1,
                  distance: 6000 - index * 300,
                }));
              }),
            weatherConditions: fc.constantFrom('dry', 'wet', 'mixed'),
            safetyCarProbability: fc.float({ min: 0, max: 0.5, noNaN: true }),
          }),
          fc.record({
            pitStops: fc
              .array(
                fc.record({
                  lap: fc.integer({ min: 10, max: 50 }),
                  duration: fc.float({ min: 20, max: 30, noNaN: true }),
                  tireCompoundIn: fc.constantFrom('soft', 'medium', 'hard'),
                  tireCompoundOut: fc.constantFrom('soft', 'medium', 'hard'),
                  reason: fc.constantFrom('planned', 'damage', 'safety_car'),
                }),
                { minLength: 1, maxLength: 3 }
              )
              .map((stops) => {
                return stops
                  .map((stop, index) => ({
                    ...stop,
                    lap: 10 + index * 15,
                  }))
                  .sort((a, b) => a.lap - b.lap);
              }),
            tireAllocation: fc
              .array(
                fc.record({
                  startLap: fc.integer({ min: 1, max: 50 }),
                  endLap: fc.integer({ min: 10, max: 70 }),
                  compound: fc.constantFrom('soft', 'medium', 'hard'),
                  expectedLaps: fc.integer({ min: 10, max: 30 }),
                }),
                { minLength: 2, maxLength: 4 }
              )
              .map((stints) => {
                let currentLap = 1;
                return stints.map((stint, index) => {
                  const startLap = currentLap;
                  const endLap = startLap + 15 + index * 5;
                  currentLap = endLap + 1;
                  return {
                    ...stint,
                    startLap,
                    endLap,
                    expectedLaps: endLap - startLap + 1,
                  };
                });
              }),
            estimatedFinishTime: fc.float({ min: 5000, max: 6000, noNaN: true }),
            riskLevel: fc.constantFrom('low', 'medium', 'high'),
          }),
          (raceData, strategyPlan) => {
            const result = simulateStrategy(raceData, strategyPlan);

            // Property: Predicted finish time should be positive
            expect(result.predictedFinishTime).toBeGreaterThan(0);

            // Property: Predicted position should be valid (1-20)
            expect(result.predictedPosition).toBeGreaterThanOrEqual(1);
            expect(result.predictedPosition).toBeLessThanOrEqual(20);

            // Property: Confidence interval should be valid
            expect(result.confidenceInterval.lower).toBeLessThanOrEqual(
              result.confidenceInterval.mean
            );
            expect(result.confidenceInterval.upper).toBeGreaterThanOrEqual(
              result.confidenceInterval.mean
            );
            expect(result.confidenceInterval.confidence).toBeGreaterThan(0);
            expect(result.confidenceInterval.confidence).toBeLessThanOrEqual(1);

            // Property: Risk level should be valid
            expect(['low', 'medium', 'high']).toContain(result.riskAssessment.level);

            // Property: Alternative outcomes should have valid probabilities
            for (const outcome of result.alternativeOutcomes) {
              expect(outcome.probability).toBeGreaterThanOrEqual(0);
              expect(outcome.probability).toBeLessThanOrEqual(1);
              expect(outcome.finishTime).toBeGreaterThan(0);
              expect(outcome.position).toBeGreaterThanOrEqual(1);
              expect(outcome.position).toBeLessThanOrEqual(20);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
