// Store types for state management
import type { SessionData, LapData, TelemetryData } from '../types';

// Session state slice
export interface SessionState {
  currentSession: SessionData | null;
  selectedLaps: LapData[];
  sessionHistory: SessionData[];
  setCurrentSession: (session: SessionData | null) => void;
  addSelectedLap: (lap: LapData) => void;
  removeSelectedLap: (lapNumber: number) => void;
  clearSelectedLaps: () => void;
  addToHistory: (session: SessionData) => void;
}

// Telemetry state slice
export interface TelemetryState {
  activeTelemetry: TelemetryData | null;
  comparisonTelemetry: TelemetryData[];
  currentDistance: number;
  currentTime: number;
  setActiveTelemetry: (telemetry: TelemetryData | null) => void;
  addComparisonTelemetry: (telemetry: TelemetryData) => void;
  removeComparisonTelemetry: (index: number) => void;
  clearComparisonTelemetry: () => void;
  setCurrentDistance: (distance: number) => void;
  setCurrentTime: (time: number) => void;
}

// UI state slice
export interface UIState {
  sidebarOpen: boolean;
  fullscreenChart: string | null;
  activeView: 'telemetry' | 'strategy' | 'comparison' | 'correlation' | 'replay';
  chartLayout: ChartLayout;
  setSidebarOpen: (open: boolean) => void;
  setFullscreenChart: (chartId: string | null) => void;
  setActiveView: (view: UIState['activeView']) => void;
  setChartLayout: (layout: ChartLayout) => void;
}

export interface ChartLayout {
  columns: number;
  rows: number;
  charts: ChartConfig[];
}

export interface ChartConfig {
  id: string;
  type: 'speed' | 'throttle' | 'brake' | 'gear' | 'rpm' | 'drs' | 'trackMap';
  position: { x: number; y: number; w: number; h: number };
  visible: boolean;
}

// User preferences state slice
export interface UserPreferencesState {
  theme: 'light' | 'dark' | 'auto';
  units: 'metric' | 'imperial';
  dashboardConfigs: Record<string, DashboardConfig>;
  recentSessions: string[];
  apiCredentials: ApiCredentials;
  setTheme: (theme: UserPreferencesState['theme']) => void;
  setUnits: (units: UserPreferencesState['units']) => void;
  saveDashboardConfig: (name: string, config: DashboardConfig) => void;
  loadDashboardConfig: (name: string) => DashboardConfig | undefined;
  deleteDashboardConfig: (name: string) => void;
  addRecentSession: (sessionId: string) => void;
  setApiCredentials: (credentials: ApiCredentials) => void;
}

export interface DashboardConfig {
  name: string;
  layout: ChartLayout;
  syncTime: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiCredentials {
  fastf1ApiKey?: string;
  openf1ApiKey?: string;
  premiumTier: boolean;
}

// Combined store type
export interface AppStore extends SessionState, TelemetryState, UIState, UserPreferencesState {}
