// @ts-nocheck - Placeholder hook, not currently used
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ergastApi } from '../services/ergastApi';
import { openf1Api } from '../services/openf1Api';
import { dataMerger } from '../services/dataMerger';
import { useAppStore } from '../store';

// Query keys for session-related queries
export const sessionKeys = {
  all: ['sessions'] as const,
  lists: () => [...sessionKeys.all, 'list'] as const,
  list: (filters: SessionFilters) => [...sessionKeys.lists(), filters] as const,
  details: () => [...sessionKeys.all, 'detail'] as const,
  detail: (id: string) => [...sessionKeys.details(), id] as const,
};

export interface SessionFilters {
  season?: number;
  round?: number;
  sessionType?: string;
  driverId?: string;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Hook to fetch a list of sessions with optional filtering
 */
export function useSessionList(filters: SessionFilters = {}) {
  return useQuery({
    queryKey: sessionKeys.list(filters),
    queryFn: async () => {
      // Fetch from Ergast API (historical data)
      const ergastSessions = await ergastApi.getSessions(filters.season, filters.round);

      // For recent sessions, also fetch from OpenF1
      const currentYear = new Date().getFullYear();
      let openf1Sessions: SessionData[] = [];

      if (!filters.season || filters.season >= currentYear - 1) {
        try {
          openf1Sessions = await openf1Api.getSessions(filters.season || currentYear);
        } catch (error) {
          if (import.meta.env.DEV) {
            console.warn('OpenF1 API unavailable, using Ergast only', error);
          }
        }
      }

      // Merge data from both sources
      const mergedSessions = dataMerger.mergeSessions(ergastSessions, openf1Sessions);

      // Apply additional filters
      return mergedSessions.filter((session) => {
        if (filters.sessionType && session.sessionType !== filters.sessionType) {
          return false;
        }
        if (filters.startDate && session.date < filters.startDate) {
          return false;
        }
        if (filters.endDate && session.date > filters.endDate) {
          return false;
        }
        return true;
      });
    },
    staleTime: 10 * 60 * 1000, // Sessions don't change often, cache for 10 minutes
  });
}

/**
 * Hook to fetch a specific session by ID
 */
export function useSession(sessionId: string | null) {
  const addToHistory = useAppStore((state) => state.addToHistory);

  return useQuery({
    queryKey: sessionKeys.detail(sessionId || ''),
    queryFn: async () => {
      if (!sessionId) {
        throw new Error('Session ID is required');
      }

      // Parse session ID to extract season and round
      const [season, round] = sessionId.split('-').map(Number);

      // Fetch from both APIs
      const [ergastData, openf1Data] = await Promise.allSettled([
        ergastApi.getSession(season, round),
        openf1Api.getSession(season, round),
      ]);

      const ergastSession = ergastData.status === 'fulfilled' ? ergastData.value : null;
      const openf1Session = openf1Data.status === 'fulfilled' ? openf1Data.value : null;

      if (!ergastSession && !openf1Session) {
        throw new Error('Session not found in any data source');
      }

      // Merge session data
      const mergedSession = dataMerger.mergeSessionData(ergastSession, openf1Session);

      return mergedSession;
    },
    enabled: !!sessionId,
    staleTime: 15 * 60 * 1000, // Cache session details for 15 minutes
    // Add to history when successfully fetched
    onSuccess: (data) => {
      if (data) {
        addToHistory(data);
      }
    },
  });
}

/**
 * Hook to prefetch a session (useful for optimistic loading)
 */
export function usePrefetchSession() {
  const queryClient = useQueryClient();

  return (sessionId: string) => {
    queryClient.prefetchQuery({
      queryKey: sessionKeys.detail(sessionId),
      queryFn: async () => {
        const [season, round] = sessionId.split('-').map(Number);
        const [ergastData, openf1Data] = await Promise.allSettled([
          ergastApi.getSession(season, round),
          openf1Api.getSession(season, round),
        ]);

        const ergastSession = ergastData.status === 'fulfilled' ? ergastData.value : null;
        const openf1Session = openf1Data.status === 'fulfilled' ? openf1Data.value : null;

        return dataMerger.mergeSessionData(ergastSession, openf1Session);
      },
    });
  };
}

/**
 * Mutation hook for updating session data (optimistic updates)
 */
export function useUpdateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (session: SessionData) => {
      // In a real app, this would update the backend
      // For now, we just update the cache
      return session;
    },
    onMutate: async (newSession) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: sessionKeys.detail(newSession.id),
      });

      // Snapshot previous value
      const previousSession = queryClient.getQueryData(sessionKeys.detail(newSession.id));

      // Optimistically update cache
      queryClient.setQueryData(sessionKeys.detail(newSession.id), newSession);

      return { previousSession };
    },
    onError: (err, newSession, context) => {
      // Rollback on error
      if (context?.previousSession) {
        queryClient.setQueryData(sessionKeys.detail(newSession.id), context.previousSession);
      }
    },
    onSettled: (newSession) => {
      // Refetch after mutation
      if (newSession) {
        queryClient.invalidateQueries({
          queryKey: sessionKeys.detail(newSession.id),
        });
      }
    },
  });
}

/**
 * Hook to invalidate session queries (useful after cache updates)
 */
export function useInvalidateSessions() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: sessionKeys.all });
  };
}
