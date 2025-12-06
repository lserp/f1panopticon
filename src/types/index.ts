// Core data types for the F1 Analysis Platform
// These will be expanded as we implement more features

export type SessionType = 'practice' | 'qualifying' | 'race' | 'sprint';
export type TrackStatus = 'green' | 'yellow' | 'red';
export type APIProvider = 'fastf1' | 'ergast' | 'openf1';

export interface SessionData {
  id: string;
  season: number;
  round: number;
  sessionType: SessionType;
  circuitId: string;
  circuitName: string;
  date: Date;
  weather: WeatherData;
  drivers: DriverInfo[];
  laps: LapSummary[];
  source: APIProvider;
  fetchedAt: Date;
}

export interface WeatherData {
  airTemp: number; // Celsius
  trackTemp: number; // Celsius
  humidity: number; // percentage
  pressure: number; // mbar
  windSpeed: number; // m/s
  windDirection: number; // degrees
  rainfall: boolean;
}

export interface DriverInfo {
  id: string;
  code: string; // e.g., "VER", "HAM"
  number: number;
  firstName: string;
  lastName: string;
  team: string;
}

export interface LapSummary {
  lapNumber: number;
  driverId: string;
  lapTime: number; // seconds
  sector1Time: number;
  sector2Time: number;
  sector3Time: number;
  tireCompound: string;
  tireAge: number;
}

export interface LapData extends LapSummary {
  sessionId: string;
  telemetry: TelemetryData;
  fuelLoad: number; // estimated
  trackStatus: TrackStatus;
}

export interface TelemetryData {
  distance: number[]; // meters from start line
  time: number[]; // seconds from lap start
  speed: number[]; // km/h
  throttle: number[]; // 0-100%
  brake: number[]; // 0-100%
  gear: number[]; // 1-8
  rpm: number[]; // revolutions per minute
  drs: number[]; // 0-14 (0=off, 1-14=various DRS states)
  nGear: number[]; // normalized gear position
}

// Extended telemetry data with premium channels
export interface ExtendedTelemetryData extends TelemetryData {
  ers?: number[]; // Energy Recovery System deployment (0-100%)
  ersStore?: number[]; // ERS energy store level (0-100%)
  ersHarvest?: number[]; // ERS harvesting rate (kW)
  fuelFlow?: number[]; // Fuel flow rate (kg/h)
  oilTemp?: number[]; // Oil temperature (Celsius)
  waterTemp?: number[]; // Water temperature (Celsius)
  brakeTemp?: {
    // Brake temperatures per corner
    frontLeft: number[];
    frontRight: number[];
    rearLeft: number[];
    rearRight: number[];
  };
}

// Cache-related types
export interface CacheEntry<T = unknown> {
  key: string;
  value: T;
  timestamp: Date;
  ttl: number; // milliseconds
  size: number; // bytes
  accessCount: number;
  lastAccessed: Date;
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number; // bytes
  hitRate: number; // 0-1
  oldestEntry: Date;
  newestEntry: Date;
}

// Track-related types
export interface TrackData {
  circuitId: string;
  circuitName: string;
  length: number; // meters
  corners: Corner[];
  sectors: Sector[];
  pitEntry: number; // distance in meters
  pitExit: number; // distance in meters
  drsZones: DRSZone[];
  coordinates: TrackCoordinate[]; // for map rendering
}

export interface Corner {
  number: number;
  name: string;
  distance: number; // meters from start line
  type: 'slow' | 'medium' | 'fast';
  angle: number; // degrees
}

export interface Sector {
  number: number;
  startDistance: number; // meters from start line
  endDistance: number; // meters from start line
}

export interface DRSZone {
  number: number;
  detectionPoint: number; // meters from start line
  activationPoint: number; // meters from start line
  endPoint: number; // meters from start line
}

export interface TrackCoordinate {
  distance: number; // meters from start line
  x: number; // coordinate for map rendering
  y: number; // coordinate for map rendering
}

// Strategy-related types
export interface StrategyPlan {
  pitStops: PitStop[];
  tireAllocation: TireStint[];
  estimatedFinishTime: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface PitStop {
  lap: number;
  duration: number; // seconds
  tireCompoundIn: string;
  tireCompoundOut: string;
  reason: 'planned' | 'damage' | 'safety_car';
}

export interface TireStint {
  startLap: number;
  endLap: number;
  compound: string;
  expectedLaps: number;
}

export interface PositionChange {
  lap: number;
  position: number;
  driverId: string;
}

export interface SafetyCarPeriod {
  startLap: number;
  endLap: number;
  type: 'safety_car' | 'virtual_safety_car';
}

export interface WeatherCondition {
  lap: number;
  condition: 'dry' | 'wet' | 'mixed';
  rainfall: boolean;
  temperature: number;
}

export interface StrategyResult {
  plan: StrategyPlan;
  predictedFinishTime: number;
  predictedPosition: number;
  timeGain: number; // compared to baseline
  confidenceInterval: {
    lower: number;
    upper: number;
  };
}

export interface StrategyComparison {
  baseline: StrategyResult;
  alternatives: StrategyResult[];
}

export interface PitExitAnalysis {
  pitLap: number;
  exitDistance: number; // meters from start line
  exitTime: Date;
  positionBefore: number;
  positionAfter: number;
  carsAhead: CarPosition[];
  carsBehind: CarPosition[];
  gapAhead: number; // seconds
  gapBehind: number; // seconds
  trafficImpact: 'clear' | 'minor' | 'significant';
}

export interface CarPosition {
  driverId: string;
  position: number;
  distance: number; // meters from start line
  gap: number; // seconds to reference car
}

// Setup interpretation types
export interface SetupInterpretation {
  downforceLevel: 'low' | 'medium' | 'high';
  downforceConfidence: number; // 0-1
  brakeBalanceTendency: 'front' | 'neutral' | 'rear';
  brakeBalanceConfidence: number;
  differentialSetting: 'open' | 'balanced' | 'locked';
  differentialConfidence: number;
  observations: string[]; // explanatory text
  telemetryEvidence: TelemetryEvidence[];
}

export interface TelemetryEvidence {
  parameter: string;
  observation: string;
  setupImplication: string;
  cornerExamples: number[]; // corner numbers where this is evident
}

// Error types
export type ErrorType =
  | 'API_CONNECTION_ERROR'
  | 'API_RATE_LIMIT'
  | 'API_AUTHENTICATION_ERROR'
  | 'DATA_VALIDATION_ERROR'
  | 'CACHE_ERROR'
  | 'VISUALIZATION_ERROR'
  | 'ANALYSIS_ERROR';

export interface AppError {
  type: ErrorType;
  message: string;
  details?: unknown;
  timestamp: Date;
  recoverable: boolean;
  retryable: boolean;
}
