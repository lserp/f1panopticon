/**
 * IndexedDB Cache for F1 Historical Data
 * 
 * Provides persistent storage for completed F1 sessions that won't change.
 * Uses IndexedDB for larger storage capacity compared to localStorage.
 */

import type { SessionData } from '../types';

const DB_NAME = 'f1-analysis-cache';
const DB_VERSION = 1;
const STORE_NAME = 'sessions';

export interface CacheMetadata {
  lastUpdated: Date;
  version: number;
  totalSessions: number;
  seasons: number[];
}

class IndexedDBCache {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize the IndexedDB database
   */
  async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB failed to open:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✓ IndexedDB initialized');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store for sessions
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          
          // Create indexes for efficient querying
          store.createIndex('season', 'season', { unique: false });
          store.createIndex('circuitId', 'circuitId', { unique: false });
          store.createIndex('sessionType', 'sessionType', { unique: false });
          store.createIndex('date', 'date', { unique: false });
          
          console.log('✓ IndexedDB object store created');
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Store a session in the cache
   */
  async setSession(session: SessionData): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(session);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Store multiple sessions in a batch
   */
  async setSessions(sessions: SessionData[]): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      let completed = 0;
      const total = sessions.length;

      sessions.forEach((session) => {
        const request = store.put(session);
        request.onsuccess = () => {
          completed++;
          if (completed === total) {
            resolve();
          }
        };
        request.onerror = () => reject(request.error);
      });

      if (sessions.length === 0) {
        resolve();
      }
    });
  }

  /**
   * Get a specific session by ID
   */
  async getSession(sessionId: string): Promise<SessionData | null> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(sessionId);

      request.onsuccess = () => {
        const session = request.result as SessionData | undefined;
        resolve(session || null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all sessions for a specific season
   */
  async getSessionsBySeason(season: number): Promise<SessionData[]> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('season');
      const request = index.getAll(season);

      request.onsuccess = () => {
        resolve(request.result as SessionData[]);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all cached sessions
   */
  async getAllSessions(): Promise<SessionData[]> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result as SessionData[]);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Check if a season is fully cached
   */
  async isSeasonCached(season: number): Promise<boolean> {
    const sessions = await this.getSessionsBySeason(season);
    // A season typically has 20-24 races, each with multiple session types
    // We'll consider it cached if we have at least 40 sessions (conservative estimate)
    return sessions.length >= 40;
  }

  /**
   * Get cache metadata
   */
  async getMetadata(): Promise<CacheMetadata> {
    const sessions = await this.getAllSessions();
    const seasons = Array.from(new Set(sessions.map(s => s.season))).sort((a, b) => b - a);

    return {
      lastUpdated: new Date(),
      version: DB_VERSION,
      totalSessions: sessions.length,
      seasons,
    };
  }

  /**
   * Clear all cached data
   */
  async clear(): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('✓ IndexedDB cache cleared');
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete the entire database
   */
  async deleteDatabase(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(DB_NAME);
      
      request.onsuccess = () => {
        console.log('✓ IndexedDB database deleted');
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get estimated cache size (approximate)
   */
  async getEstimatedSize(): Promise<number> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return estimate.usage || 0;
    }
    return 0;
  }
}

// Export singleton instance
export const indexedDBCache = new IndexedDBCache();

/**
 * Utility: Check if a session is from a completed (historical) season
 */
export function isHistoricalSession(session: SessionData): boolean {
  const currentYear = new Date().getFullYear();
  return session.season < currentYear;
}

/**
 * Utility: Check if a session is complete (safe to cache permanently)
 */
export function isSessionComplete(session: SessionData): boolean {
  const now = new Date();
  const sessionDate = new Date(session.date);
  
  // Past seasons are always complete
  if (session.season < now.getFullYear()) {
    return true;
  }
  
  // Current season: wait 24 hours after session date
  const hoursSinceSession = (now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60);
  return hoursSinceSession > 24;
}

/**
 * Utility: Get list of historical seasons to cache
 */
export function getHistoricalSeasons(): number[] {
  const currentYear = new Date().getFullYear();
  const startYear = 2020; // Start from 2020
  const seasons: number[] = [];
  
  for (let year = startYear; year < currentYear; year++) {
    seasons.push(year);
  }
  
  return seasons.reverse(); // Most recent first
}
