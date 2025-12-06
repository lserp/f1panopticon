import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import * as fc from 'fast-check';
import { SessionBrowser } from './SessionBrowser';
import type { APIProvider, SessionType } from '../types';

// Mock the useSessionData hook
vi.mock('../hooks/useSessionData');

/**
 * Feature: f1-analysis-platform, Property 29: Data attribution presence
 *
 * For any displayed information in the Web Application, the UI must include
 * attribution indicating which API source provided the data and when it was
 * last fetched.
 *
 * Validates: Requirements 13.5
 */

// Arbitraries for generating test data
const apiProviderArb = fc.constantFrom<APIProvider>('fastf1', 'ergast', 'openf1');
const sessionTypeArb = fc.constantFrom<SessionType>('practice', 'qualifying', 'race', 'sprint');

const driverInfoArb = fc.record({
  id: fc.uuid(),
  code: fc.string({ minLength: 3, maxLength: 3 }).map((s) => s.toUpperCase()),
  number: fc.integer({ min: 1, max: 99 }),
  firstName: fc.string({ minLength: 3, maxLength: 15 }),
  lastName: fc.string({ minLength: 3, maxLength: 15 }),
  team: fc.string({ minLength: 5, maxLength: 20 }),
});

const weatherDataArb = fc.record({
  airTemp: fc.float({ min: -10, max: 50 }),
  trackTemp: fc.float({ min: 0, max: 70 }),
  humidity: fc.float({ min: 0, max: 100 }),
  pressure: fc.float({ min: 900, max: 1100 }),
  windSpeed: fc.float({ min: 0, max: 30 }),
  windDirection: fc.float({ min: 0, max: 360 }),
  rainfall: fc.boolean(),
});

const lapSummaryArb = fc.record({
  lapNumber: fc.integer({ min: 1, max: 70 }),
  driverId: fc.uuid(),
  lapTime: fc.float({ min: 60, max: 150 }),
  sector1Time: fc.float({ min: 15, max: 40 }),
  sector2Time: fc.float({ min: 15, max: 40 }),
  sector3Time: fc.float({ min: 15, max: 40 }),
  tireCompound: fc.constantFrom('soft', 'medium', 'hard', 'intermediate', 'wet'),
  tireAge: fc.integer({ min: 0, max: 50 }),
});

const sessionDataArb = fc.record({
  id: fc.uuid(),
  season: fc.integer({ min: 2018, max: 2024 }),
  round: fc.integer({ min: 1, max: 24 }),
  sessionType: sessionTypeArb,
  circuitId: fc.uuid(),
  circuitName: fc.string({ minLength: 5, maxLength: 30 }),
  date: fc.date({ min: new Date('2018-01-01'), max: new Date('2024-12-31') }),
  weather: weatherDataArb,
  drivers: fc.array(driverInfoArb, { minLength: 2, maxLength: 20 }),
  laps: fc.array(lapSummaryArb, { minLength: 1, maxLength: 50 }),
  source: apiProviderArb,
  fetchedAt: fc.date({ min: new Date('2023-01-01'), max: new Date() }),
});

describe('SessionBrowser - Property 29: Data attribution presence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('should display data source attribution for all sessions', async () => {
    fc.assert(
      fc.property(fc.array(sessionDataArb, { minLength: 1, maxLength: 10 }), (sessions) => {
        // Mock the hook to return our test data
        const { useSessionData } = await import('../hooks/useSessionData');
        vi.mocked(useSessionData).mockReturnValue({
          sessions,
          loading: false,
          error: null,
          refetch: vi.fn(),
        });

        const { container } = render(
          <SessionBrowser onSessionSelect={() => {}} />
        );

        // Get all attribution elements
        const attributionElements = container.querySelectorAll('[data-testid="data-attribution"]');

        // Should have one attribution element per session
        expect(attributionElements.length).toBe(sessions.length);

        // Check each attribution element contains the required information
        attributionElements.forEach((element, index) => {
          const session = sessions[index];
          const text = element.textContent || '';

          // Must contain the data source
          expect(text).toContain(session.source);

          // Must contain some indication of when it was fetched
          // The component displays the fetched date, so we check for "Fetched:"
          expect(text).toContain('Fetched:');
        });
      }),
      { numRuns: 100 }
    );
  });

  it('should display correct API provider for each session', () => {
    fc.assert(
      fc.property(fc.array(sessionDataArb, { minLength: 1, maxLength: 5 }), (sessions) => {
        // Mock the hook to return our test data
        const { useSessionData } = require('../hooks/useSessionData');
        useSessionData.mockReturnValue({
          sessions,
          loading: false,
          error: null,
          refetch: vi.fn(),
        });

        const { container } = render(
          <SessionBrowser onSessionSelect={() => {}} />
        );

        const attributionElements = container.querySelectorAll('.attribution-value');

        attributionElements.forEach((element, index) => {
          const session = sessions[index];
          const displayedSource = element.textContent || '';

          // The displayed source should match the session's source
          expect(displayedSource.toLowerCase()).toBe(session.source.toLowerCase());
        });
      }),
      { numRuns: 100 }
    );
  });

  it('should display fetched timestamp for each session', () => {
    fc.assert(
      fc.property(fc.array(sessionDataArb, { minLength: 1, maxLength: 5 }), (sessions) => {
        // Mock the hook to return our test data
        const { useSessionData } = require('../hooks/useSessionData');
        useSessionData.mockReturnValue({
          sessions,
          loading: false,
          error: null,
          refetch: vi.fn(),
        });

        const { container } = render(
          <SessionBrowser onSessionSelect={() => {}} />
        );

        const attributionTimeElements = container.querySelectorAll('.attribution-time');

        // Should have one timestamp per session
        expect(attributionTimeElements.length).toBe(sessions.length);

        attributionTimeElements.forEach((element) => {
          const text = element.textContent || '';

          // Must contain "Fetched:" label
          expect(text).toContain('Fetched:');

          // Must contain some date/time information (not empty after "Fetched:")
          const afterFetched = text.split('Fetched:')[1];
          expect(afterFetched).toBeTruthy();
          expect(afterFetched.trim().length).toBeGreaterThan(0);
        });
      }),
      { numRuns: 100 }
    );
  });
});
