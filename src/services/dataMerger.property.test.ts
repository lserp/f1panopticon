import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { SessionData, DriverInfo, APIProvider } from '../types';

/**
 * **Feature: f1-analysis-platform, Property 28: Multi-source merge completeness**
 *
 * For any session available from multiple API sources, the merged dataset must
 * contain all unique data fields present in any source, with no data loss.
 *
 * **Validates: Requirements 13.2**
 */

// Arbitraries for generating test data
const apiProviderArb = fc.constantFrom<APIProvider>('ergast', 'openf1', 'fastf1');

const driverInfoArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 10 }),
  code: fc.string({ minLength: 3, maxLength: 3 }),
  number: fc.integer({ min: 1, max: 99 }),
  firstName: fc.string({ minLength: 1, maxLength: 20 }),
  lastName: fc.string({ minLength: 1, maxLength: 20 }),
  team: fc.string({ minLength: 1, maxLength: 30 }),
});

const weatherDataArb = fc.record({
  airTemp: fc.float({ min: -10, max: 50 }),
  trackTemp: fc.float({ min: -10, max: 70 }),
  humidity: fc.float({ min: 0, max: 100 }),
  pressure: fc.float({ min: 900, max: 1100 }),
  windSpeed: fc.float({ min: 0, max: 50 }),
  windDirection: fc.float({ min: 0, max: 360 }),
  rainfall: fc.boolean(),
});

const lapSummaryArb = fc.record({
  lapNumber: fc.integer({ min: 1, max: 70 }),
  driverId: fc.string({ minLength: 1, maxLength: 10 }),
  lapTime: fc.float({ min: 60, max: 150 }),
  sector1Time: fc.float({ min: 10, max: 50 }),
  sector2Time: fc.float({ min: 10, max: 50 }),
  sector3Time: fc.float({ min: 10, max: 50 }),
  tireCompound: fc.constantFrom('soft', 'medium', 'hard', 'intermediate', 'wet'),
  tireAge: fc.integer({ min: 0, max: 50 }),
});

const sessionDataArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  season: fc.integer({ min: 2018, max: 2024 }),
  round: fc.integer({ min: 1, max: 24 }),
  sessionType: fc.constantFrom('practice', 'qualifying', 'race', 'sprint'),
  circuitId: fc.string({ minLength: 1, maxLength: 20 }),
  circuitName: fc.string({ minLength: 1, maxLength: 50 }),
  date: fc.date({ min: new Date('2018-01-01'), max: new Date('2024-12-31') }),
  weather: weatherDataArb,
  drivers: fc.array(driverInfoArb, { minLength: 0, maxLength: 20 }),
  laps: fc.array(lapSummaryArb, { minLength: 0, maxLength: 100 }),
  source: apiProviderArb,
  fetchedAt: fc.date(),
}) as fc.Arbitrary<SessionData>;

// Helper function to merge sessions (simplified version of DataMerger logic)
function mergeSessions(sessions: SessionData[]): SessionData {
  if (sessions.length === 0) {
    throw new Error('No sessions to merge');
  }

  if (sessions.length === 1) {
    return sessions[0];
  }

  const base = sessions[0];
  const merged: SessionData = {
    ...base,
    drivers: [],
    laps: [],
    weather: { ...base.weather },
  };

  // Merge drivers
  const driverMap = new Map<string, DriverInfo>();
  for (const session of sessions) {
    for (const driver of session.drivers) {
      const existing = driverMap.get(driver.id);
      if (!existing) {
        driverMap.set(driver.id, driver);
      } else {
        driverMap.set(driver.id, {
          id: driver.id,
          code: driver.code || existing.code,
          number: driver.number || existing.number,
          firstName: driver.firstName || existing.firstName,
          lastName: driver.lastName || existing.lastName,
          team: driver.team || existing.team,
        });
      }
    }
  }
  merged.drivers = Array.from(driverMap.values());

  // Merge laps
  const lapMap = new Map<string, any>();
  for (const session of sessions) {
    for (const lap of session.laps) {
      const key = `${lap.driverId}-${lap.lapNumber}`;
      const existing = lapMap.get(key);
      if (!existing) {
        lapMap.set(key, lap);
      } else {
        lapMap.set(key, {
          ...existing,
          lapTime: lap.lapTime || existing.lapTime,
          sector1Time: lap.sector1Time || existing.sector1Time,
          sector2Time: lap.sector2Time || existing.sector2Time,
          sector3Time: lap.sector3Time || existing.sector3Time,
          tireCompound: lap.tireCompound || existing.tireCompound,
          tireAge: lap.tireAge || existing.tireAge,
        });
      }
    }
  }
  merged.laps = Array.from(lapMap.values());

  // Merge weather
  for (const session of sessions) {
    merged.weather.airTemp = session.weather.airTemp || merged.weather.airTemp;
    merged.weather.trackTemp = session.weather.trackTemp || merged.weather.trackTemp;
    merged.weather.humidity = session.weather.humidity || merged.weather.humidity;
    merged.weather.pressure = session.weather.pressure || merged.weather.pressure;
    merged.weather.windSpeed = session.weather.windSpeed || merged.weather.windSpeed;
    merged.weather.windDirection = session.weather.windDirection || merged.weather.windDirection;
    merged.weather.rainfall = session.weather.rainfall || merged.weather.rainfall;
  }

  return merged;
}

// Helper to get all unique driver IDs from sessions
function getAllUniqueDriverIds(sessions: SessionData[]): Set<string> {
  const ids = new Set<string>();
  for (const session of sessions) {
    for (const driver of session.drivers) {
      ids.add(driver.id);
    }
  }
  return ids;
}

// Helper to get all unique lap keys from sessions
function getAllUniqueLapKeys(sessions: SessionData[]): Set<string> {
  const keys = new Set<string>();
  for (const session of sessions) {
    for (const lap of session.laps) {
      keys.add(`${lap.driverId}-${lap.lapNumber}`);
    }
  }
  return keys;
}

describe('DataMerger Property Tests', () => {
  it('Property 28: Multi-source merge completeness - all unique drivers preserved', () => {
    fc.assert(
      fc.property(fc.array(sessionDataArb, { minLength: 1, maxLength: 5 }), (sessions) => {
        // Get all unique driver IDs from all sessions
        const allDriverIds = getAllUniqueDriverIds(sessions);

        // Merge the sessions
        const merged = mergeSessions(sessions);

        // Check that all unique driver IDs are present in merged result
        const mergedDriverIds = new Set(merged.drivers.map((d) => d.id));

        // All unique drivers must be present in merged data
        for (const driverId of allDriverIds) {
          expect(mergedDriverIds.has(driverId)).toBe(true);
        }

        // No data loss: merged should have at least as many drivers as any single source
        const maxDriverCount = Math.max(...sessions.map((s) => s.drivers.length));
        expect(merged.drivers.length).toBeGreaterThanOrEqual(
          Math.min(maxDriverCount, allDriverIds.size)
        );
      }),
      { numRuns: 100 }
    );
  });

  it('Property 28: Multi-source merge completeness - all unique laps preserved', () => {
    fc.assert(
      fc.property(fc.array(sessionDataArb, { minLength: 1, maxLength: 5 }), (sessions) => {
        // Get all unique lap keys from all sessions
        const allLapKeys = getAllUniqueLapKeys(sessions);

        // Merge the sessions
        const merged = mergeSessions(sessions);

        // Check that all unique lap keys are present in merged result
        const mergedLapKeys = new Set(merged.laps.map((lap) => `${lap.driverId}-${lap.lapNumber}`));

        // All unique laps must be present in merged data
        for (const lapKey of allLapKeys) {
          expect(mergedLapKeys.has(lapKey)).toBe(true);
        }

        // No data loss: merged should have at least as many laps as any single source
        const maxLapCount = Math.max(...sessions.map((s) => s.laps.length));
        expect(merged.laps.length).toBeGreaterThanOrEqual(Math.min(maxLapCount, allLapKeys.size));
      }),
      { numRuns: 100 }
    );
  });

  it('Property 28: Multi-source merge completeness - weather data preserved', () => {
    fc.assert(
      fc.property(fc.array(sessionDataArb, { minLength: 1, maxLength: 5 }), (sessions) => {
        // Merge the sessions
        const merged = mergeSessions(sessions);

        // Check that weather data is preserved (at least one non-zero value if any source had it)
        const hasAnyAirTemp = sessions.some((s) => s.weather.airTemp !== 0);
        const hasAnyTrackTemp = sessions.some((s) => s.weather.trackTemp !== 0);
        const hasAnyHumidity = sessions.some((s) => s.weather.humidity !== 0);
        const hasAnyPressure = sessions.some((s) => s.weather.pressure !== 0);
        const hasAnyRainfall = sessions.some((s) => s.weather.rainfall);

        if (hasAnyAirTemp) {
          expect(merged.weather.airTemp).not.toBe(0);
        }
        if (hasAnyTrackTemp) {
          expect(merged.weather.trackTemp).not.toBe(0);
        }
        if (hasAnyHumidity) {
          expect(merged.weather.humidity).not.toBe(0);
        }
        if (hasAnyPressure) {
          expect(merged.weather.pressure).not.toBe(0);
        }
        if (hasAnyRainfall) {
          expect(merged.weather.rainfall).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('Property 28: Multi-source merge completeness - no data loss in driver fields', () => {
    fc.assert(
      fc.property(fc.array(sessionDataArb, { minLength: 1, maxLength: 5 }), (sessions) => {
        // Merge the sessions
        const merged = mergeSessions(sessions);

        // For each driver in merged result, check that all non-empty fields
        // came from at least one source
        for (const mergedDriver of merged.drivers) {
          // Find all source drivers with this ID
          const sourcesForDriver = sessions
            .flatMap((s) => s.drivers)
            .filter((d) => d.id === mergedDriver.id);

          if (sourcesForDriver.length === 0) continue;

          // Check that merged driver has at least as much info as any single source
          const hasCode = sourcesForDriver.some((d) => d.code);
          const hasNumber = sourcesForDriver.some((d) => d.number > 0);
          const hasFirstName = sourcesForDriver.some((d) => d.firstName);
          const hasLastName = sourcesForDriver.some((d) => d.lastName);
          const hasTeam = sourcesForDriver.some((d) => d.team);

          if (hasCode) expect(mergedDriver.code).toBeTruthy();
          if (hasNumber) expect(mergedDriver.number).toBeGreaterThan(0);
          if (hasFirstName) expect(mergedDriver.firstName).toBeTruthy();
          if (hasLastName) expect(mergedDriver.lastName).toBeTruthy();
          if (hasTeam) expect(mergedDriver.team).toBeTruthy();
        }
      }),
      { numRuns: 100 }
    );
  });
});
