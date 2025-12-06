import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSessionData } from './useSessionData';
import { ergastApi } from '../services/ergastApi';
import { openf1Api } from '../services/openf1Api';

// Mock the API services
vi.mock('../services/ergastApi');
vi.mock('../services/openf1Api');

describe('useSessionData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch sessions from OpenF1 API', async () => {
    const mockSessions = [
      {
        id: 'test-session',
        season: 2024,
        round: 1,
        sessionType: 'race' as const,
        circuitId: 'bahrain',
        circuitName: 'Bahrain International Circuit',
        date: new Date('2024-03-02'),
        weather: {
          airTemp: 25,
          trackTemp: 30,
          humidity: 50,
          pressure: 1013,
          windSpeed: 10,
          windDirection: 180,
          rainfall: false,
        },
        drivers: [],
        laps: [],
        source: 'openf1' as const,
        fetchedAt: new Date(),
      },
    ];

    vi.mocked(openf1Api.fetchSessions).mockResolvedValue(mockSessions);

    const { result } = renderHook(() => useSessionData({ season: 2024 }));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.sessions).toEqual(mockSessions);
    expect(result.current.error).toBeNull();
  });

  it('should fallback to Ergast API if OpenF1 fails', async () => {
    const mockSessions = [
      {
        id: 'test-session',
        season: 2024,
        round: 1,
        sessionType: 'race' as const,
        circuitId: 'bahrain',
        circuitName: 'Bahrain International Circuit',
        date: new Date('2024-03-02'),
        weather: {
          airTemp: 0,
          trackTemp: 0,
          humidity: 0,
          pressure: 0,
          windSpeed: 0,
          windDirection: 0,
          rainfall: false,
        },
        drivers: [],
        laps: [],
        source: 'ergast' as const,
        fetchedAt: new Date(),
      },
    ];

    vi.mocked(openf1Api.fetchSessions).mockRejectedValue(new Error('OpenF1 failed'));
    vi.mocked(ergastApi.listSessions).mockResolvedValue(mockSessions);

    const { result } = renderHook(() => useSessionData({ season: 2024 }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.sessions).toEqual(mockSessions);
    expect(result.current.error).toBeNull();
  });

  it('should set error if both APIs fail', async () => {
    vi.mocked(openf1Api.fetchSessions).mockRejectedValue(new Error('OpenF1 failed'));
    vi.mocked(ergastApi.listSessions).mockRejectedValue(new Error('Ergast failed'));

    const { result } = renderHook(() => useSessionData({ season: 2024 }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.sessions).toEqual([]);
    expect(result.current.error).toBeTruthy();
  });
});
