// @ts-nocheck - Placeholder hook, not currently used
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ergastApi } from '../services/ergastApi';
import { openf1Api } from '../services/openf1Api';
import { dataMerger } from '../services/dataMerger';

// Query keys for lap-related queries
export const lapKeys = {
  all: ['laps'] as const,
  lists: () => [...lapKeys.all, 'list'] as const,
  list: (sessionId: string, driverId?: string) =>
    [...lapKeys.lists(), sessionId, driverId] as const,
  details: () => [...lapKeys.all, 'detail'] as const,
  detail: (sessionId: string, driverId: string, lapNumber: number) =>
    [...lapKeys.details(), sessionId, driverId, lapNumber] as const,
};

/**
 * Hook to fetch laps for a session and driver
 */
export function useLaps(sessionId: string | null, driverId?: string) {
  return useQuery({
    queryKey: lapKeys.list(sessionId || '', driverId),
    queryFn: async () => {
      if (!sessionId) {
        throw new Error('Session ID is required');
      }

      const [season, round] = sessionId.split('-').map(Number);

      // Fetch from both APIs
      const [ergastLaps, openf1Laps] = await Promise.allSettled([
        ergastApi.getLaps(season, round, driverId),
        openf1Api.getLaps(season, round, driverId),
      ]);

      const ergastData = ergastLaps.status === 'fulfilled' ? ergastLaps.value : [];
      const openf1Data = openf1Laps.status === 'fulfilled' ? openf1Laps.value : [];

      // Merge lap data from both sources
      return dataMerger.mergeLaps(ergastData, openf1Data);
    },
    enabled: !!sessionId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

/**
 * Hook to fetch a specific lap with full telemetry
 */
export function useLap(
  sessionId: string | null,
  driverId: string | null,
  lapNumber: number | null
) {
  return useQuery({
    queryKey: lapKeys.detail(sessionId || '', driverId || '', lapNumber || 0),
    queryFn: async () => {
      if (!sessionId || !driverId || lapNumber === null) {
        throw new Error('Session ID, driver ID, and lap number are required');
      }

      const [season, round] = sessionId.split('-').map(Number);

      // Fetch telemetry data from OpenF1 (primary source for telemetry)
      try {
        const lapData = await openf1Api.getLapTelemetry(season, round, driverId, lapNumber);
        return lapData;
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn('OpenF1 telemetry unavailable, trying Ergast', error);
        }

        // Fallback to Ergast (limited telemetry)
        const lapData = await ergastApi.getLapData(season, round, driverId, lapNumber);
        return lapData;
      }
    },
    enabled: !!sessionId && !!driverId && lapNumber !== null,
    staleTime: 30 * 60 * 1000, // Telemetry data is static, cache for 30 minutes
  });
}

/**
 * Hook to fetch multiple laps for comparison
 */
export function useCompareLaps(
  laps: Array<{
    sessionId: string;
    driverId: string;
    lapNumber: number;
  }>
) {
  return useQuery({
    queryKey: [
      'laps',
      'compare',
      ...laps.map((l) => `${l.sessionId}-${l.driverId}-${l.lapNumber}`),
    ],
    queryFn: async () => {
      // Fetch all laps in parallel
      const lapPromises = laps.map(async ({ sessionId, driverId, lapNumber }) => {
        const [season, round] = sessionId.split('-').map(Number);

        try {
          return await openf1Api.getLapTelemetry(season, round, driverId, lapNumber);
        } catch (error) {
          if (import.meta.env.DEV) {
            console.warn(`Failed to fetch lap ${lapNumber} for ${driverId}`, error);
          }
          return await ergastApi.getLapData(season, round, driverId, lapNumber);
        }
      });

      return await Promise.all(lapPromises);
    },
    enabled: laps.length > 0,
    staleTime: 30 * 60 * 1000,
  });
}

/**
 * Hook to prefetch lap data (useful for optimistic loading)
 */
export function usePrefetchLap() {
  const queryClient = useQueryClient();

  return (sessionId: string, driverId: string, lapNumber: number) => {
    queryClient.prefetchQuery({
      queryKey: lapKeys.detail(sessionId, driverId, lapNumber),
      queryFn: async () => {
        const [season, round] = sessionId.split('-').map(Number);

        try {
          return await openf1Api.getLapTelemetry(season, round, driverId, lapNumber);
        } catch (error) {
          return await ergastApi.getLapData(season, round, driverId, lapNumber);
        }
      },
    });
  };
}

/**
 * Hook to invalidate lap queries
 */
export function useInvalidateLaps() {
  const queryClient = useQueryClient();

  return (sessionId?: string) => {
    if (sessionId) {
      queryClient.invalidateQueries({ queryKey: lapKeys.list(sessionId) });
    } else {
      queryClient.invalidateQueries({ queryKey: lapKeys.all });
    }
  };
}
