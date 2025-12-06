import { useState, useEffect } from 'react';
import type { LapSummary } from '../types';
import { ergastApi } from '../services/ergastApi';

interface UseLapDataOptions {
  season: number;
  round: number;
  driverId?: string;
  autoFetch?: boolean;
}

interface UseLapDataResult {
  laps: LapSummary[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useLapData(options: UseLapDataOptions): UseLapDataResult {
  const { season, round, driverId, autoFetch = true } = options;
  
  const [laps, setLaps] = useState<LapSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchLaps = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log(`Fetching lap data for ${season} Round ${round}${driverId ? ` Driver ${driverId}` : ''}...`);
      const fetchedLaps = await ergastApi.fetchLapTimes(season, round, driverId);
      console.log(`✓ Successfully fetched ${fetchedLaps.length} laps`);
      setLaps(fetchedLaps);
    } catch (err) {
      console.error('✗ Failed to fetch lap data:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch && season && round) {
      fetchLaps();
    }
  }, [season, round, driverId, autoFetch]);

  return {
    laps,
    loading,
    error,
    refetch: fetchLaps,
  };
}
