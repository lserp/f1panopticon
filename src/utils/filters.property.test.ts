import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  filterSessions,
  filterLapData,
  filterLapSummaries,
  validateSessionFilter,
  validatePerformanceFilter,
  FilterValidationError,
} from './filters';
import type { SessionData, LapData, LapSummary, SessionType, APIProvider } from '../types';

/**
 * Property-based tests for Filter Utilities
 * Feature: f1-analysis-platform
 */

describe('Filter Utilities Property Tests', () => {
  /**
   * Property 4: Filter correctness
   * Feature: f1-analysis-platform, Property 4: Filter correctness
   * Validates: Requirements 2.3, 4.5
   *
   * For any filter criteria (season, race, session type, driver, date range,
   * track sector, tire compound, fuel load), all returned results must match
   * the specified criteria, and no matching items in the dataset should be excluded.
   */
  describe('Property 4: Filter correctness', () => {
    // Arbitraries for generating test data
    const currentYear = new Date().getFullYear();
    const sessionDataArb = fc.record({
      id: fc.string({ minLength: 1 }),
      season: fc.integer({ min: 1950, max: currentYear + 1 }),
      round: fc.integer({ min: 1, max: 25 }),
      sessionType: fc.constantFrom<SessionType>('practice', 'qualifying', 'race', 'sprint'),
      circuitId: fc.string({ minLength: 1, maxLength: 20 }),
      circuitName: fc.string({ minLength: 1 }),
      date: fc.date({ min: new Date('2020-01-01'), max: new Date(`${currentYear + 1}-12-31`) }),
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
          id: fc.string({ minLength: 1, maxLength: 20 }),
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
    });

    const lapDataArb = fc.record({
      sessionId: fc.string({ minLength: 1 }),
      driverId: fc.string({ minLength: 1 }),
      lapNumber: fc.integer({ min: 1, max: 100 }),
      lapTime: fc.float({ min: 60, max: 200 }),
      sector1Time: fc.float({ min: 0, max: 60 }),
      sector2Time: fc.float({ min: 0, max: 60 }),
      sector3Time: fc.float({ min: 0, max: 60 }),
      telemetry: fc.record({
        distance: fc.array(fc.float({ min: 0, max: 6000 }), { minLength: 10, maxLength: 100 }),
        time: fc.array(fc.float({ min: 0, max: 200 }), { minLength: 10, maxLength: 100 }),
        speed: fc.array(fc.float({ min: 0, max: 350 }), { minLength: 10, maxLength: 100 }),
        throttle: fc.array(fc.float({ min: 0, max: 100 }), { minLength: 10, maxLength: 100 }),
        brake: fc.array(fc.float({ min: 0, max: 100 }), { minLength: 10, maxLength: 100 }),
        gear: fc.array(fc.integer({ min: 1, max: 8 }), { minLength: 10, maxLength: 100 }),
        rpm: fc.array(fc.float({ min: 0, max: 15000 }), { minLength: 10, maxLength: 100 }),
        drs: fc.array(fc.integer({ min: 0, max: 14 }), { minLength: 10, maxLength: 100 }),
        nGear: fc.array(fc.float({ min: 0, max: 1 }), { minLength: 10, maxLength: 100 }),
      }),
      tireCompound: fc.constantFrom('SOFT', 'MEDIUM', 'HARD', 'INTERMEDIATE', 'WET'),
      tireAge: fc.integer({ min: 0, max: 50 }),
      fuelLoad: fc.float({ min: 0, max: 110 }),
      trackStatus: fc.constantFrom('green', 'yellow', 'red'),
    });

    const lapSummaryArb = fc.record({
      lapNumber: fc.integer({ min: 1, max: 100 }),
      driverId: fc.string({ minLength: 1 }),
      lapTime: fc.float({ min: 60, max: 200 }),
      sector1Time: fc.float({ min: 0, max: 60 }),
      sector2Time: fc.float({ min: 0, max: 60 }),
      sector3Time: fc.float({ min: 0, max: 60 }),
      tireCompound: fc.constantFrom('SOFT', 'MEDIUM', 'HARD', 'INTERMEDIATE', 'WET'),
      tireAge: fc.integer({ min: 0, max: 50 }),
    });

    describe('Session filtering correctness', () => {
      it('should only return sessions matching season filter', () => {
        fc.assert(
          fc.property(
            fc.array(sessionDataArb, { minLength: 1, maxLength: 50 }),
            fc.integer({ min: 1950, max: currentYear + 1 }),
            (sessions: SessionData[], filterSeason: number) => {
              const filtered = filterSessions(sessions, { season: filterSeason });

              // All returned sessions must match the filter
              for (const session of filtered) {
                expect(session.season).toBe(filterSeason);
              }

              // No matching sessions should be excluded
              const expectedCount = sessions.filter((s) => s.season === filterSeason).length;
              expect(filtered.length).toBe(expectedCount);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should only return sessions matching race (round) filter', () => {
        fc.assert(
          fc.property(
            fc.array(sessionDataArb, { minLength: 1, maxLength: 50 }),
            fc.integer({ min: 1, max: 25 }),
            (sessions: SessionData[], filterRace: number) => {
              const filtered = filterSessions(sessions, { race: filterRace });

              // All returned sessions must match the filter
              for (const session of filtered) {
                expect(session.round).toBe(filterRace);
              }

              // No matching sessions should be excluded
              const expectedCount = sessions.filter((s) => s.round === filterRace).length;
              expect(filtered.length).toBe(expectedCount);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should only return sessions matching session type filter', () => {
        fc.assert(
          fc.property(
            fc.array(sessionDataArb, { minLength: 1, maxLength: 50 }),
            fc.constantFrom<SessionType>('practice', 'qualifying', 'race', 'sprint'),
            (sessions: SessionData[], filterType: SessionType) => {
              const filtered = filterSessions(sessions, { sessionType: filterType });

              // All returned sessions must match the filter
              for (const session of filtered) {
                expect(session.sessionType).toBe(filterType);
              }

              // No matching sessions should be excluded
              const expectedCount = sessions.filter((s) => s.sessionType === filterType).length;
              expect(filtered.length).toBe(expectedCount);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should only return sessions matching driver filter', () => {
        fc.assert(
          fc.property(
            fc.array(sessionDataArb, { minLength: 1, maxLength: 50 }),
            fc.string({ minLength: 1, maxLength: 20 }),
            (sessions: SessionData[], filterDriver: string) => {
              const filtered = filterSessions(sessions, { driver: filterDriver });

              // All returned sessions must have the driver
              for (const session of filtered) {
                const hasDriver = session.drivers.some((d) => d.id === filterDriver);
                expect(hasDriver).toBe(true);
              }

              // No matching sessions should be excluded
              const expectedCount = sessions.filter((s) =>
                s.drivers.some((d) => d.id === filterDriver)
              ).length;
              expect(filtered.length).toBe(expectedCount);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should only return sessions matching date range filter', () => {
        fc.assert(
          fc.property(
            fc.array(sessionDataArb, { minLength: 1, maxLength: 50 }),
            fc.date({
              min: new Date('2020-01-01'),
              max: new Date(`${currentYear + 1}-12-31`),
              noInvalidDate: true,
            }),
            fc.date({
              min: new Date('2020-01-01'),
              max: new Date(`${currentYear + 1}-12-31`),
              noInvalidDate: true,
            }),
            (sessions: SessionData[], date1: Date, date2: Date) => {
              // Skip if dates are invalid
              if (Number.isNaN(date1.getTime()) || Number.isNaN(date2.getTime())) {
                return;
              }

              // Ensure dateFrom <= dateTo
              const dateFrom = date1 < date2 ? date1 : date2;
              const dateTo = date1 < date2 ? date2 : date1;

              const filtered = filterSessions(sessions, { dateFrom, dateTo });

              // All returned sessions must be within date range and have valid dates
              for (const session of filtered) {
                expect(Number.isNaN(session.date.getTime())).toBe(false);
                expect(session.date >= dateFrom).toBe(true);
                expect(session.date <= dateTo).toBe(true);
              }

              // No matching sessions should be excluded (only count sessions with valid dates)
              const expectedCount = sessions.filter(
                (s) => !Number.isNaN(s.date.getTime()) && s.date >= dateFrom && s.date <= dateTo
              ).length;
              expect(filtered.length).toBe(expectedCount);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should only return sessions matching circuit filter', () => {
        fc.assert(
          fc.property(
            fc.array(sessionDataArb, { minLength: 1, maxLength: 50 }),
            fc.string({ minLength: 1, maxLength: 20 }),
            (sessions: SessionData[], filterCircuit: string) => {
              const filtered = filterSessions(sessions, { circuitId: filterCircuit });

              // All returned sessions must match the circuit
              for (const session of filtered) {
                expect(session.circuitId).toBe(filterCircuit);
              }

              // No matching sessions should be excluded
              const expectedCount = sessions.filter((s) => s.circuitId === filterCircuit).length;
              expect(filtered.length).toBe(expectedCount);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should handle multiple filters correctly', () => {
        fc.assert(
          fc.property(
            fc.array(sessionDataArb, { minLength: 1, maxLength: 50 }),
            fc.integer({ min: 1950, max: currentYear + 1 }),
            fc.constantFrom<SessionType>('practice', 'qualifying', 'race', 'sprint'),
            (sessions: SessionData[], filterSeason: number, filterType: SessionType) => {
              const filtered = filterSessions(sessions, {
                season: filterSeason,
                sessionType: filterType,
              });

              // All returned sessions must match both filters
              for (const session of filtered) {
                expect(session.season).toBe(filterSeason);
                expect(session.sessionType).toBe(filterType);
              }

              // No matching sessions should be excluded
              const expectedCount = sessions.filter(
                (s) => s.season === filterSeason && s.sessionType === filterType
              ).length;
              expect(filtered.length).toBe(expectedCount);
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    describe('Performance metrics filtering correctness', () => {
      it('should only return laps matching tire compound filter', () => {
        fc.assert(
          fc.property(
            fc.array(lapDataArb, { minLength: 1, maxLength: 50 }),
            fc.constantFrom('SOFT', 'MEDIUM', 'HARD', 'INTERMEDIATE', 'WET'),
            (laps: LapData[], filterCompound: string) => {
              const filtered = filterLapData(laps, { tireCompound: filterCompound });

              // All returned laps must match the filter
              for (const lap of filtered) {
                expect(lap.tireCompound).toBe(filterCompound);
              }

              // No matching laps should be excluded
              const expectedCount = laps.filter((l) => l.tireCompound === filterCompound).length;
              expect(filtered.length).toBe(expectedCount);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should only return laps matching fuel load range filter', () => {
        fc.assert(
          fc.property(
            fc.array(lapDataArb, { minLength: 1, maxLength: 50 }),
            fc.float({ min: 0, max: 50, noNaN: true }),
            fc.float({ min: 50, max: 110, noNaN: true }),
            (laps: LapData[], fuelMin: number, fuelMax: number) => {
              const filtered = filterLapData(laps, {
                fuelLoadMin: fuelMin,
                fuelLoadMax: fuelMax,
              });

              // All returned laps must be within fuel range and have valid fuel load
              for (const lap of filtered) {
                expect(Number.isNaN(lap.fuelLoad)).toBe(false);
                expect(lap.fuelLoad >= fuelMin).toBe(true);
                expect(lap.fuelLoad <= fuelMax).toBe(true);
              }

              // No matching laps should be excluded (only count laps with valid fuel load)
              const expectedCount = laps.filter(
                (l) => !Number.isNaN(l.fuelLoad) && l.fuelLoad >= fuelMin && l.fuelLoad <= fuelMax
              ).length;
              expect(filtered.length).toBe(expectedCount);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should only return laps matching lap number range filter', () => {
        fc.assert(
          fc.property(
            fc.array(lapDataArb, { minLength: 1, maxLength: 50 }),
            fc.integer({ min: 1, max: 50 }),
            fc.integer({ min: 50, max: 100 }),
            (laps: LapData[], lapMin: number, lapMax: number) => {
              const filtered = filterLapData(laps, {
                lapNumberMin: lapMin,
                lapNumberMax: lapMax,
              });

              // All returned laps must be within lap number range
              for (const lap of filtered) {
                expect(lap.lapNumber >= lapMin).toBe(true);
                expect(lap.lapNumber <= lapMax).toBe(true);
              }

              // No matching laps should be excluded
              const expectedCount = laps.filter(
                (l) => l.lapNumber >= lapMin && l.lapNumber <= lapMax
              ).length;
              expect(filtered.length).toBe(expectedCount);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should only return laps with valid sector times when sector filter is applied', () => {
        fc.assert(
          fc.property(
            fc.array(lapDataArb, { minLength: 1, maxLength: 50 }),
            fc.constantFrom(1, 2, 3),
            (laps: LapData[], sector: number) => {
              const filtered = filterLapData(laps, { sector });

              // All returned laps must have valid sector times for the specified sector (not NaN and > 0)
              for (const lap of filtered) {
                if (sector === 1) {
                  expect(Number.isNaN(lap.sector1Time)).toBe(false);
                  expect(lap.sector1Time).toBeGreaterThan(0);
                } else if (sector === 2) {
                  expect(Number.isNaN(lap.sector2Time)).toBe(false);
                  expect(lap.sector2Time).toBeGreaterThan(0);
                } else if (sector === 3) {
                  expect(Number.isNaN(lap.sector3Time)).toBe(false);
                  expect(lap.sector3Time).toBeGreaterThan(0);
                }
              }

              // No matching laps should be excluded (only count laps with valid sector times)
              const expectedCount = laps.filter((l) => {
                if (sector === 1) return !Number.isNaN(l.sector1Time) && l.sector1Time > 0;
                if (sector === 2) return !Number.isNaN(l.sector2Time) && l.sector2Time > 0;
                if (sector === 3) return !Number.isNaN(l.sector3Time) && l.sector3Time > 0;
                return false;
              }).length;
              expect(filtered.length).toBe(expectedCount);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should filter lap summaries correctly by tire compound', () => {
        fc.assert(
          fc.property(
            fc.array(lapSummaryArb, { minLength: 1, maxLength: 50 }),
            fc.constantFrom('SOFT', 'MEDIUM', 'HARD', 'INTERMEDIATE', 'WET'),
            (laps: LapSummary[], filterCompound: string) => {
              const filtered = filterLapSummaries(laps, { tireCompound: filterCompound });

              // All returned laps must match the filter
              for (const lap of filtered) {
                expect(lap.tireCompound).toBe(filterCompound);
              }

              // No matching laps should be excluded
              const expectedCount = laps.filter((l) => l.tireCompound === filterCompound).length;
              expect(filtered.length).toBe(expectedCount);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should handle multiple performance filters correctly', () => {
        fc.assert(
          fc.property(
            fc.array(lapDataArb, { minLength: 1, maxLength: 50 }),
            fc.constantFrom('SOFT', 'MEDIUM', 'HARD'),
            fc.integer({ min: 1, max: 50 }),
            fc.integer({ min: 50, max: 100 }),
            (laps: LapData[], compound: string, lapMin: number, lapMax: number) => {
              const filtered = filterLapData(laps, {
                tireCompound: compound,
                lapNumberMin: lapMin,
                lapNumberMax: lapMax,
              });

              // All returned laps must match all filters
              for (const lap of filtered) {
                expect(lap.tireCompound).toBe(compound);
                expect(lap.lapNumber >= lapMin).toBe(true);
                expect(lap.lapNumber <= lapMax).toBe(true);
              }

              // No matching laps should be excluded
              const expectedCount = laps.filter(
                (l) => l.tireCompound === compound && l.lapNumber >= lapMin && l.lapNumber <= lapMax
              ).length;
              expect(filtered.length).toBe(expectedCount);
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    describe('Filter validation', () => {
      it('should reject invalid season values', () => {
        fc.assert(
          fc.property(
            fc.integer().filter((n) => n < 1950 || n > new Date().getFullYear() + 1),
            (invalidSeason: number) => {
              expect(() => {
                validateSessionFilter({ season: invalidSeason });
              }).toThrow(FilterValidationError);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should reject invalid race values', () => {
        fc.assert(
          fc.property(
            fc.integer().filter((n) => n < 1 || n > 30),
            (invalidRace: number) => {
              expect(() => {
                validateSessionFilter({ race: invalidRace });
              }).toThrow(FilterValidationError);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should reject invalid sector values', () => {
        fc.assert(
          fc.property(
            fc.integer().filter((n) => n < 1 || n > 3),
            (invalidSector: number) => {
              expect(() => {
                validatePerformanceFilter({ sector: invalidSector });
              }).toThrow(FilterValidationError);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should reject invalid fuel load ranges', () => {
        fc.assert(
          fc.property(
            fc.float({ min: 0, max: 110 }),
            fc.float({ min: 0, max: 110 }),
            (fuelMin: number, fuelMax: number) => {
              // Only test when min > max (invalid range)
              if (fuelMin > fuelMax) {
                expect(() => {
                  validatePerformanceFilter({
                    fuelLoadMin: fuelMin,
                    fuelLoadMax: fuelMax,
                  });
                }).toThrow(FilterValidationError);
              }
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should reject invalid date ranges', () => {
        fc.assert(
          fc.property(
            fc.date({ min: new Date('2025-01-01'), max: new Date('2030-12-31') }),
            fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }),
            (dateFrom: Date, dateTo: Date) => {
              // dateFrom is after dateTo (invalid range)
              expect(() => {
                validateSessionFilter({ dateFrom, dateTo });
              }).toThrow(FilterValidationError);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should accept valid filter combinations', () => {
        fc.assert(
          fc.property(
            fc.record({
              season: fc.integer({ min: 1950, max: currentYear + 1 }),
              race: fc.integer({ min: 1, max: 25 }),
              sessionType: fc.constantFrom<SessionType>('practice', 'qualifying', 'race', 'sprint'),
              driver: fc.string({ minLength: 1 }),
              circuitId: fc.string({ minLength: 1 }),
            }),
            (filter) => {
              // Should not throw
              expect(() => {
                validateSessionFilter(filter);
              }).not.toThrow();
            }
          ),
          { numRuns: 100 }
        );
      });
    });
  });
});
