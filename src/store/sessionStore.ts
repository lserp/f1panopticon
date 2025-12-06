import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SessionData } from '../types';

interface SessionStore {
  selectedSession: SessionData | null;
  cachedSessions: Map<number, SessionData[]>;
  cacheVersion: number;
  setSelectedSession: (session: SessionData | null) => void;
  getCachedSessions: (season: number) => SessionData[] | undefined;
  setCachedSessions: (season: number, sessions: SessionData[]) => void;
  clearCache: () => void;
}

// Increment this when cache format changes
const CURRENT_CACHE_VERSION = 2;

export const useSessionStore = create<SessionStore>()(
  persist(
    (set, get) => ({
      selectedSession: null,
      cachedSessions: new Map(),
      cacheVersion: CURRENT_CACHE_VERSION,

      setSelectedSession: (session) => set({ selectedSession: session }),

      getCachedSessions: (season) => {
        return get().cachedSessions.get(season);
      },

      setCachedSessions: (season, sessions) => {
        const newCache = new Map(get().cachedSessions);
        newCache.set(season, sessions);
        set({ cachedSessions: newCache });
      },

      clearCache: () => set({ cachedSessions: new Map(), cacheVersion: CURRENT_CACHE_VERSION }),
    }),
    {
      name: 'f1-session-storage',
      version: CURRENT_CACHE_VERSION,
      partialize: (state) => ({
        selectedSession: state.selectedSession,
        cacheVersion: state.cacheVersion,
        // Convert Map to array for serialization
        cachedSessions: Array.from(state.cachedSessions.entries()),
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Check cache version and clear if outdated
          if (!state.cacheVersion || state.cacheVersion < CURRENT_CACHE_VERSION) {
            console.log('Cache version outdated, clearing cache');
            state.cachedSessions = new Map();
            state.selectedSession = null;
            state.cacheVersion = CURRENT_CACHE_VERSION;
          }
          
          // Convert array back to Map
          if (Array.isArray(state.cachedSessions)) {
            state.cachedSessions = new Map(state.cachedSessions as [number, SessionData[]][]);
          }
        }
      },
    }
  )
);
