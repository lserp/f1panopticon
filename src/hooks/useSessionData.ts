import { useState, useEffect } from 'react';
import type { SessionData } from '../types';
import { cacheManager } from '../services/cacheManager';
import { useSessionStore } from '../store/sessionStore';

interface UseSessionDataOptions {
  season?: number;
  autoFetch?: boolean;
}

interface UseSessionDataResult {
  sessions: SessionData[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useSessionData(options: UseSessionDataOptions = {}): UseSessionDataResult {
  const { season = new Date().getFullYear(), autoFetch = true } = options;
  
  const { getCachedSessions, setCachedSessions } = useSessionStore();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchSessions = async () => {
    // Check localStorage cache first (for current season)
    const currentYear = new Date().getFullYear();
    if (season === currentYear) {
      const cached = getCachedSessions(season);
      if (cached && cached.length > 0) {
        console.log(`✓ Using localStorage cache for current season ${season} (${cached.length} sessions)`);
        setSessions(cached);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      // Use cache manager which handles IndexedDB for historical data
      console.log(`Fetching sessions for season ${season}...`);
      const fetchedSessions = await cacheManager.getSessionsForSeason(season);
      console.log(`✓ Loaded ${fetchedSessions.length} sessions for ${season}`);
      
      setSessions(fetchedSessions);
      
      // Cache current season in localStorage for quick access
      if (season === currentYear) {
        setCachedSessions(season, fetchedSessions);
      }
    } catch (err) {
      console.error(`✗ Failed to fetch sessions for ${season}:`, err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchSessions();
    }
  }, [season, autoFetch]);

  return {
    sessions,
    loading,
    error,
    refetch: fetchSessions,
  };
}
