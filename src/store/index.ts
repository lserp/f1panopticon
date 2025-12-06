import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AppStore, ChartLayout } from './types';

// Initial state values
const initialChartLayout: ChartLayout = {
  columns: 2,
  rows: 2,
  charts: [
    {
      id: 'speed',
      type: 'speed',
      position: { x: 0, y: 0, w: 1, h: 1 },
      visible: true,
    },
    {
      id: 'throttle',
      type: 'throttle',
      position: { x: 1, y: 0, w: 1, h: 1 },
      visible: true,
    },
    {
      id: 'brake',
      type: 'brake',
      position: { x: 0, y: 1, w: 1, h: 1 },
      visible: true,
    },
    {
      id: 'gear',
      type: 'gear',
      position: { x: 1, y: 1, w: 1, h: 1 },
      visible: true,
    },
  ],
};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Session state
      currentSession: null,
      selectedLaps: [],
      sessionHistory: [],
      setCurrentSession: (session) => set({ currentSession: session }),
      addSelectedLap: (lap) =>
        set((state) => ({
          selectedLaps: [...state.selectedLaps, lap],
        })),
      removeSelectedLap: (lapNumber) =>
        set((state) => ({
          selectedLaps: state.selectedLaps.filter((lap) => lap.lapNumber !== lapNumber),
        })),
      clearSelectedLaps: () => set({ selectedLaps: [] }),
      addToHistory: (session) =>
        set((state) => ({
          sessionHistory: [session, ...state.sessionHistory.slice(0, 19)], // Keep last 20
        })),

      // Telemetry state
      activeTelemetry: null,
      comparisonTelemetry: [],
      currentDistance: 0,
      currentTime: 0,
      setActiveTelemetry: (telemetry) => set({ activeTelemetry: telemetry }),
      addComparisonTelemetry: (telemetry) =>
        set((state) => ({
          comparisonTelemetry: [...state.comparisonTelemetry, telemetry],
        })),
      removeComparisonTelemetry: (index) =>
        set((state) => ({
          comparisonTelemetry: state.comparisonTelemetry.filter((_, i) => i !== index),
        })),
      clearComparisonTelemetry: () => set({ comparisonTelemetry: [] }),
      setCurrentDistance: (distance) => set({ currentDistance: distance }),
      setCurrentTime: (time) => set({ currentTime: time }),

      // UI state
      sidebarOpen: true,
      fullscreenChart: null,
      activeView: 'telemetry',
      chartLayout: initialChartLayout,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setFullscreenChart: (chartId) => set({ fullscreenChart: chartId }),
      setActiveView: (view) => set({ activeView: view }),
      setChartLayout: (layout) => set({ chartLayout: layout }),

      // User preferences state
      theme: 'auto',
      units: 'metric',
      dashboardConfigs: {},
      recentSessions: [],
      apiCredentials: { premiumTier: false },
      setTheme: (theme) => set({ theme }),
      setUnits: (units) => set({ units }),
      saveDashboardConfig: (name, config) =>
        set((state) => ({
          dashboardConfigs: {
            ...state.dashboardConfigs,
            [name]: { ...config, updatedAt: new Date() },
          },
        })),
      loadDashboardConfig: (name) => {
        const config = get().dashboardConfigs[name];
        if (config) {
          set({ chartLayout: config.layout, currentTime: config.syncTime });
        }
        return config;
      },
      deleteDashboardConfig: (name) =>
        set((state) => {
          const { [name]: _, ...rest } = state.dashboardConfigs;
          return { dashboardConfigs: rest };
        }),
      addRecentSession: (sessionId) =>
        set((state) => ({
          recentSessions: [
            sessionId,
            ...state.recentSessions.filter((id) => id !== sessionId).slice(0, 9),
          ], // Keep last 10
        })),
      setApiCredentials: (credentials) => set({ apiCredentials: credentials }),
    }),
    {
      name: 'f1-analysis-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist user preferences and dashboard configs
      partialize: (state) => ({
        theme: state.theme,
        units: state.units,
        dashboardConfigs: state.dashboardConfigs,
        recentSessions: state.recentSessions,
        apiCredentials: state.apiCredentials,
        chartLayout: state.chartLayout,
      }),
    }
  )
);

// Broadcast channel for cross-tab synchronization
const channel = new BroadcastChannel('f1-analysis-sync');

// Listen for changes from other tabs
channel.onmessage = (event) => {
  if (event.data.type === 'STATE_UPDATE') {
    useAppStore.setState(event.data.state);
  }
};

// Subscribe to store changes and broadcast to other tabs
useAppStore.subscribe((state) => {
  // Only broadcast persisted state to avoid unnecessary updates
  const persistedState = {
    theme: state.theme,
    units: state.units,
    dashboardConfigs: state.dashboardConfigs,
    recentSessions: state.recentSessions,
    apiCredentials: state.apiCredentials,
    chartLayout: state.chartLayout,
  };

  channel.postMessage({
    type: 'STATE_UPDATE',
    state: persistedState,
  });
});

// Export selectors for common state access patterns
export const selectCurrentSession = (state: AppStore) => state.currentSession;
export const selectSelectedLaps = (state: AppStore) => state.selectedLaps;
export const selectActiveTelemetry = (state: AppStore) => state.activeTelemetry;
export const selectChartLayout = (state: AppStore) => state.chartLayout;
export const selectDashboardConfigs = (state: AppStore) => state.dashboardConfigs;
export const selectCurrentTime = (state: AppStore) => state.currentTime;
