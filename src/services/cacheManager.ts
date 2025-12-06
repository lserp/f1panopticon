/**
 * Cache Manager
 * 
 * Orchestrates caching strategy:
 * - Historical seasons (2020-2023): Permanent IndexedDB cache
 * - Current season: Temporary localStorage cache
 * - Smart fetching with progress tracking
 */

import { indexedDBCache, getHistoricalSeasons } from './indexedDBCache';
import { ergastApi } from './ergastApi';
import type { SessionData } from '../types';

export interface CacheProgress {
  season: number;
  current: number;
  total: number;
  percentage: number;
  status: 'fetching' | 'caching' | 'complete' | 'error';
  message: string;
}

export type CacheProgressCallback = (progress: CacheProgress) => void;

class CacheManager {
  private isCaching = false;
  private abortController: AbortController | null = null;

  /**
   * Initialize historical data cache
   * Fetches and caches all historical seasons if not already cached
   */
  async initializeHistoricalCache(
    onProgress?: CacheProgressCallback
  ): Promise<void> {
    if (this.isCaching) {
      console.log('Cache initialization already in progress');
      return;
    }

    this.isCaching = true;
    this.abortController = new AbortController();

    try {
      const historicalSeasons = getHistoricalSeasons();
      console.log(`Initializing cache for historical seasons:`, historicalSeasons);

      let successCount = 0;
      let errorCount = 0;

      for (const season of historicalSeasons) {
        // Check if already cached
        const isCached = await indexedDBCache.isSeasonCached(season);
        
        if (isCached) {
          console.log(`✓ Season ${season} already cached, skipping`);
          successCount++;
          continue;
        }

        // Fetch and cache this season
        try {
          await this.cacheSeasonData(season, onProgress);
          successCount++;
        } catch (seasonError) {
          console.error(`Failed to cache season ${season}:`, seasonError);
          errorCount++;
          
          // Report error but continue with other seasons
          onProgress?.({
            season,
            current: 0,
            total: 100,
            percentage: 0,
            status: 'error',
            message: `Failed to cache ${season}: ${seasonError instanceof Error ? seasonError.message : 'Unknown error'}`,
          });
          
          // Don't throw - continue with other seasons
        }
      }

      console.log(`✓ Historical cache initialization complete: ${successCount} succeeded, ${errorCount} failed`);
      
      // Only throw if all seasons failed
      if (successCount === 0 && errorCount > 0) {
        throw new Error('Failed to cache any historical seasons');
      }
    } catch (error) {
      console.error('Error initializing historical cache:', error);
      throw error;
    } finally {
      this.isCaching = false;
      this.abortController = null;
    }
  }

  /**
   * Cache all data for a specific season
   */
  private async cacheSeasonData(
    season: number,
    onProgress?: CacheProgressCallback
  ): Promise<void> {
    try {
      onProgress?.({
        season,
        current: 0,
        total: 100,
        percentage: 0,
        status: 'fetching',
        message: `Fetching ${season} season data...`,
      });

      // Fetch all sessions for this season
      const sessions = await ergastApi.listSessions({ season });
      
      console.log(`Fetched ${sessions.length} sessions for ${season}`);

      if (sessions.length === 0) {
        onProgress?.({
          season,
          current: 100,
          total: 100,
          percentage: 100,
          status: 'complete',
          message: `No data available for ${season}`,
        });
        return;
      }

      onProgress?.({
        season,
        current: 50,
        total: 100,
        percentage: 50,
        status: 'caching',
        message: `Caching ${sessions.length} sessions for ${season}...`,
      });

      // Store in IndexedDB
      await indexedDBCache.setSessions(sessions);

      onProgress?.({
        season,
        current: 100,
        total: 100,
        percentage: 100,
        status: 'complete',
        message: `✓ Cached ${sessions.length} sessions for ${season}`,
      });

      console.log(`✓ Cached ${sessions.length} sessions for season ${season}`);
    } catch (error) {
      console.error(`Error caching season ${season}:`, error);
      
      onProgress?.({
        season,
        current: 0,
        total: 100,
        percentage: 0,
        status: 'error',
        message: `Failed to cache ${season}: ${error}`,
      });
      
      throw error;
    }
  }

  /**
   * Get sessions for a season (from cache or fetch)
   */
  async getSessionsForSeason(season: number): Promise<SessionData[]> {
    const currentYear = new Date().getFullYear();
    
    // For historical seasons, try cache first
    if (season < currentYear) {
      const cachedSessions = await indexedDBCache.getSessionsBySeason(season);
      
      if (cachedSessions.length > 0) {
        console.log(`✓ Loaded ${cachedSessions.length} sessions for ${season} from cache`);
        return cachedSessions;
      }
      
      console.log(`Cache miss for season ${season}, fetching...`);
    }
    
    // Fetch from API (current season or cache miss)
    const sessions = await ergastApi.listSessions({ season });
    
    // Cache historical sessions
    if (season < currentYear && sessions.length > 0) {
      await indexedDBCache.setSessions(sessions);
      console.log(`✓ Cached ${sessions.length} sessions for ${season}`);
    }
    
    return sessions;
  }

  /**
   * Abort ongoing cache initialization
   */
  abortCaching(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.isCaching = false;
      console.log('Cache initialization aborted');
    }
  }

  /**
   * Check if caching is in progress
   */
  isCachingInProgress(): boolean {
    return this.isCaching;
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    const metadata = await indexedDBCache.getMetadata();
    const estimatedSize = await indexedDBCache.getEstimatedSize();
    
    return {
      ...metadata,
      estimatedSizeBytes: estimatedSize,
      estimatedSizeMB: (estimatedSize / (1024 * 1024)).toFixed(2),
    };
  }

  /**
   * Clear all cached data
   */
  async clearCache(): Promise<void> {
    await indexedDBCache.clear();
    console.log('✓ All cache cleared');
  }

  /**
   * Refresh cache for a specific season
   */
  async refreshSeason(season: number, onProgress?: CacheProgressCallback): Promise<void> {
    console.log(`Refreshing cache for season ${season}...`);
    
    // Note: IndexedDB will overwrite existing sessions with same ID
    // Fetch and cache fresh data
    await this.cacheSeasonData(season, onProgress);
  }
}

// Export singleton instance
export const cacheManager = new CacheManager();
