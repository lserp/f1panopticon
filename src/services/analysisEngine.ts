/**
 * Analysis Engine
 * Provides data analysis capabilities including lap delta calculations,
 * correlation analysis, and statistical computations.
 */

import type {
  LapData,
  TelemetryData,
  Corner,
  TrackData,
  SetupInterpretation,
  TelemetryEvidence,
} from '../types';

/**
 * Delta data representing differences between two laps
 */
export interface DeltaData {
  lapTime: number; // seconds (positive means lap2 is slower)
  sector1: number; // seconds
  sector2: number; // seconds
  sector3: number; // seconds
  speedDifferential: SpeedDifferential[];
}

/**
 * Speed differential at specific track positions
 */
export interface SpeedDifferential {
  distance: number; // meters from start line
  speedDelta: number; // km/h (positive means lap2 is faster)
  lap1Speed: number; // km/h
  lap2Speed: number; // km/h
}

/**
 * Calculate lap time delta between two laps
 * Delta is calculated as lap2 - lap1
 * Positive delta means lap2 is slower
 *
 * @param lap1 - First lap data
 * @param lap2 - Second lap data
 * @returns Delta data with lap time and sector differences
 */
export function calculateLapDelta(lap1: LapData, lap2: LapData): DeltaData {
  // Calculate lap time delta
  const lapTimeDelta = lap2.lapTime - lap1.lapTime;

  // Calculate sector time deltas
  const sector1Delta = lap2.sector1Time - lap1.sector1Time;
  const sector2Delta = lap2.sector2Time - lap1.sector2Time;
  const sector3Delta = lap2.sector3Time - lap1.sector3Time;

  // Calculate speed differentials
  const speedDifferentials = calculateSpeedDifferentials(lap1.telemetry, lap2.telemetry);

  return {
    lapTime: lapTimeDelta,
    sector1: sector1Delta,
    sector2: sector2Delta,
    sector3: sector3Delta,
    speedDifferential: speedDifferentials,
  };
}

/**
 * Calculate speed differentials between two telemetry traces
 * Aligns telemetry data by distance and computes speed differences
 *
 * @param telemetry1 - First lap telemetry
 * @param telemetry2 - Second lap telemetry
 * @returns Array of speed differentials at aligned distances
 */
export function calculateSpeedDifferentials(
  telemetry1: TelemetryData,
  telemetry2: TelemetryData
): SpeedDifferential[] {
  const differentials: SpeedDifferential[] = [];

  // Find common distance range
  const minDistance = Math.max(telemetry1.distance[0] || 0, telemetry2.distance[0] || 0);
  const maxDistance = Math.min(
    telemetry1.distance[telemetry1.distance.length - 1] || 0,
    telemetry2.distance[telemetry2.distance.length - 1] || 0
  );

  // Sample at regular intervals (every 10 meters)
  const sampleInterval = 10; // meters

  for (let distance = minDistance; distance <= maxDistance; distance += sampleInterval) {
    const speed1 = interpolateSpeed(telemetry1, distance);
    const speed2 = interpolateSpeed(telemetry2, distance);

    if (speed1 !== null && speed2 !== null) {
      differentials.push({
        distance,
        speedDelta: speed2 - speed1, // positive means lap2 is faster
        lap1Speed: speed1,
        lap2Speed: speed2,
      });
    }
  }

  return differentials;
}

/**
 * Interpolate speed at a specific distance from telemetry data
 * Uses linear interpolation between adjacent data points
 *
 * @param telemetry - Telemetry data
 * @param targetDistance - Distance to interpolate at
 * @returns Interpolated speed or null if distance is out of range
 */
function interpolateSpeed(telemetry: TelemetryData, targetDistance: number): number | null {
  const { distance, speed } = telemetry;

  if (distance.length === 0 || speed.length === 0) {
    return null;
  }

  // Check if target is within range
  if (targetDistance < distance[0] || targetDistance > distance[distance.length - 1]) {
    return null;
  }

  // Find the two points to interpolate between
  for (let i = 0; i < distance.length - 1; i++) {
    if (distance[i] <= targetDistance && targetDistance <= distance[i + 1]) {
      // Linear interpolation
      const t = (targetDistance - distance[i]) / (distance[i + 1] - distance[i]);
      return speed[i] + t * (speed[i + 1] - speed[i]);
    }
  }

  // If we reach here, return the last speed value
  return speed[speed.length - 1];
}

/**
 * Correlation analysis types and functions
 */

/**
 * Result of correlation analysis between a parameter and lap time
 */
export interface CorrelationResult {
  parameter: string;
  coefficient: number; // Pearson correlation coefficient (-1 to 1)
  strength: 'weak' | 'moderate' | 'strong';
  direction: 'positive' | 'negative' | 'none';
}

/**
 * Multivariate correlation analysis result
 */
export interface MultivariateCorrelationResult {
  parameters: string[];
  correlationMatrix: number[][]; // NxN matrix of correlation coefficients
  partialCorrelations: Map<string, number>; // Partial correlations with lap time
}

/**
 * Ranked correlation results
 */
export interface RankedCorrelations {
  results: CorrelationResult[];
  sortedByStrength: CorrelationResult[];
}

/**
 * Calculate Pearson correlation coefficient between two arrays
 *
 * @param x - First array of values
 * @param y - Second array of values
 * @returns Correlation coefficient between -1 and 1
 */
export function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) {
    throw new Error('Arrays must have the same non-zero length');
  }

  const n = x.length;

  // Calculate means
  const meanX = x.reduce((sum, val) => sum + val, 0) / n;
  const meanY = y.reduce((sum, val) => sum + val, 0) / n;

  // Calculate covariance and standard deviations
  let covariance = 0;
  let varianceX = 0;
  let varianceY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    covariance += dx * dy;
    varianceX += dx * dx;
    varianceY += dy * dy;
  }

  // Handle edge case where one variable has no variance
  if (varianceX === 0 || varianceY === 0) {
    return 0;
  }

  // Pearson correlation coefficient
  return covariance / Math.sqrt(varianceX * varianceY);
}

/**
 * Analyze correlation between telemetry parameters and lap times
 *
 * @param laps - Array of lap data
 * @param parameters - Telemetry parameters to analyze (e.g., 'speed', 'throttle')
 * @returns Array of correlation results
 */
export function analyzeCorrelations(
  laps: LapData[],
  parameters: Array<keyof TelemetryData>
): CorrelationResult[] {
  if (laps.length === 0) {
    return [];
  }

  const lapTimes = laps.map((lap) => lap.lapTime);
  const results: CorrelationResult[] = [];

  for (const param of parameters) {
    // Calculate average value of this parameter across each lap
    const paramValues = laps.map((lap) => {
      const telemetry = lap.telemetry;
      const values = telemetry[param] as number[];

      if (!Array.isArray(values) || values.length === 0) {
        return 0;
      }

      // Use average value for the lap
      return values.reduce((sum, val) => sum + val, 0) / values.length;
    });

    const coefficient = calculateCorrelation(paramValues, lapTimes);

    results.push({
      parameter: param,
      coefficient,
      strength: getCorrelationStrength(Math.abs(coefficient)),
      direction: getCorrelationDirection(coefficient),
    });
  }

  return results;
}

/**
 * Perform multivariate correlation analysis
 * Computes correlation matrix between all parameters and partial correlations
 *
 * @param laps - Array of lap data
 * @param parameters - Telemetry parameters to analyze
 * @returns Multivariate correlation results
 */
export function analyzeMultivariateCorrelations(
  laps: LapData[],
  parameters: Array<keyof TelemetryData>
): MultivariateCorrelationResult {
  if (laps.length === 0 || parameters.length === 0) {
    return {
      parameters: [],
      correlationMatrix: [],
      partialCorrelations: new Map(),
    };
  }

  // Extract parameter values for each lap
  const parameterData: number[][] = parameters.map((param) => {
    return laps.map((lap) => {
      const telemetry = lap.telemetry;
      const values = telemetry[param] as number[];

      if (!Array.isArray(values) || values.length === 0) {
        return 0;
      }

      return values.reduce((sum, val) => sum + val, 0) / values.length;
    });
  });

  // Build correlation matrix
  const n = parameters.length;
  const correlationMatrix: number[][] = Array(n)
    .fill(0)
    .map(() => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        correlationMatrix[i][j] = 1.0; // Self-correlation is always 1
      } else {
        correlationMatrix[i][j] = calculateCorrelation(parameterData[i], parameterData[j]);
      }
    }
  }

  // Calculate partial correlations with lap time
  // For simplicity, we use the univariate correlations as partial correlations
  // A full implementation would control for other variables
  const lapTimes = laps.map((lap) => lap.lapTime);
  const partialCorrelations = new Map<string, number>();

  for (let i = 0; i < parameters.length; i++) {
    const param = parameters[i];
    const correlation = calculateCorrelation(parameterData[i], lapTimes);
    partialCorrelations.set(param, correlation);
  }

  return {
    parameters: parameters as string[],
    correlationMatrix,
    partialCorrelations,
  };
}

/**
 * Rank correlation results by strength
 *
 * @param results - Array of correlation results
 * @returns Ranked correlation results
 */
export function rankCorrelationsByStrength(results: CorrelationResult[]): RankedCorrelations {
  const sortedByStrength = [...results].sort((a, b) => {
    return Math.abs(b.coefficient) - Math.abs(a.coefficient);
  });

  return {
    results,
    sortedByStrength,
  };
}

/**
 * Determine correlation strength from coefficient
 */
function getCorrelationStrength(absCoefficient: number): 'weak' | 'moderate' | 'strong' {
  if (absCoefficient >= 0.7) {
    return 'strong';
  } else if (absCoefficient >= 0.4) {
    return 'moderate';
  } else {
    return 'weak';
  }
}

/**
 * Determine correlation direction from coefficient
 */
function getCorrelationDirection(coefficient: number): 'positive' | 'negative' | 'none' {
  if (Math.abs(coefficient) < 0.1) {
    return 'none';
  } else if (coefficient > 0) {
    return 'positive';
  } else {
    return 'negative';
  }
}

/**
 * Statistical calculation types and functions
 */

/**
 * Statistical summary of a dataset
 */
export interface StatisticalSummary {
  mean: number;
  standardDeviation: number;
  variance: number;
  min: number;
  max: number;
  count: number;
}

/**
 * Confidence interval
 */
export interface ConfidenceInterval {
  lower: number;
  upper: number;
  confidence: number; // e.g., 0.95 for 95% confidence
  mean: number;
}

/**
 * Driving style metrics
 */
export interface DrivingStyleMetrics {
  averageBrakingPoint: number; // meters before corner
  averageThrottleApplication: number; // percentage
  corneringSpeed: number; // average speed through corners (km/h)
  brakingConsistency: number; // standard deviation of braking points
  throttleConsistency: number; // standard deviation of throttle application
  overallConsistency: number; // lap time standard deviation
}

/**
 * Consistency metrics
 */
export interface ConsistencyMetrics {
  lapTimeStdDev: number; // seconds
  sector1StdDev: number; // seconds
  sector2StdDev: number; // seconds
  sector3StdDev: number; // seconds
  consistencyScore: number; // 0-100, higher is more consistent
}

/**
 * Calculate mean of an array of numbers
 *
 * @param values - Array of numbers
 * @returns Mean value
 */
export function calculateMean(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Calculate standard deviation of an array of numbers
 *
 * @param values - Array of numbers
 * @returns Standard deviation
 */
export function calculateStandardDeviation(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const mean = calculateMean(values);
  const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;

  return Math.sqrt(variance);
}

/**
 * Calculate variance of an array of numbers
 *
 * @param values - Array of numbers
 * @returns Variance
 */
export function calculateVariance(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const mean = calculateMean(values);
  const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));

  return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Calculate statistical summary of a dataset
 *
 * @param values - Array of numbers
 * @returns Statistical summary
 */
export function calculateStatisticalSummary(values: number[]): StatisticalSummary {
  if (values.length === 0) {
    return {
      mean: 0,
      standardDeviation: 0,
      variance: 0,
      min: 0,
      max: 0,
      count: 0,
    };
  }

  const mean = calculateMean(values);
  const stdDev = calculateStandardDeviation(values);
  const variance = calculateVariance(values);
  const min = Math.min(...values);
  const max = Math.max(...values);

  return {
    mean,
    standardDeviation: stdDev,
    variance,
    min,
    max,
    count: values.length,
  };
}

/**
 * Calculate confidence interval for a dataset
 * Uses t-distribution for small samples (n < 30) and normal distribution for large samples
 *
 * @param values - Array of numbers
 * @param confidence - Confidence level (e.g., 0.95 for 95%)
 * @returns Confidence interval
 */
export function calculateConfidenceInterval(
  values: number[],
  confidence: number = 0.95
): ConfidenceInterval {
  if (values.length === 0) {
    return {
      lower: 0,
      upper: 0,
      confidence,
      mean: 0,
    };
  }

  const mean = calculateMean(values);
  const stdDev = calculateStandardDeviation(values);
  const n = values.length;

  // For simplicity, use z-score approximation
  // For 95% confidence: z = 1.96
  // For 99% confidence: z = 2.576
  const zScore = confidence === 0.99 ? 2.576 : 1.96;

  const marginOfError = zScore * (stdDev / Math.sqrt(n));

  return {
    lower: mean - marginOfError,
    upper: mean + marginOfError,
    confidence,
    mean,
  };
}

/**
 * Calculate driving style metrics from lap data
 *
 * @param laps - Array of lap data
 * @param corners - Array of corner data for the track
 * @returns Driving style metrics
 */
export function calculateDrivingStyleMetrics(
  laps: LapData[],
  _corners?: Corner[]
): DrivingStyleMetrics {
  if (laps.length === 0) {
    return {
      averageBrakingPoint: 0,
      averageThrottleApplication: 0,
      corneringSpeed: 0,
      brakingConsistency: 0,
      throttleConsistency: 0,
      overallConsistency: 0,
    };
  }

  // Calculate average throttle application across all laps
  const throttleValues: number[] = [];
  const brakingPoints: number[] = [];
  const corneringSpeeds: number[] = [];

  for (const lap of laps) {
    const telemetry = lap.telemetry;

    // Average throttle
    if (telemetry.throttle.length > 0) {
      const avgThrottle = calculateMean(telemetry.throttle);
      throttleValues.push(avgThrottle);
    }

    // Find braking points (where brake > 50%)
    for (let i = 0; i < telemetry.brake.length; i++) {
      if (telemetry.brake[i] > 50) {
        brakingPoints.push(telemetry.distance[i]);
      }
    }

    // Calculate cornering speeds (speed when throttle < 50% and brake < 50%)
    for (let i = 0; i < telemetry.speed.length; i++) {
      if (telemetry.throttle[i] < 50 && telemetry.brake[i] < 50) {
        corneringSpeeds.push(telemetry.speed[i]);
      }
    }
  }

  const lapTimes = laps.map((lap) => lap.lapTime);

  return {
    averageBrakingPoint: brakingPoints.length > 0 ? calculateMean(brakingPoints) : 0,
    averageThrottleApplication: throttleValues.length > 0 ? calculateMean(throttleValues) : 0,
    corneringSpeed: corneringSpeeds.length > 0 ? calculateMean(corneringSpeeds) : 0,
    brakingConsistency: brakingPoints.length > 0 ? calculateStandardDeviation(brakingPoints) : 0,
    throttleConsistency: throttleValues.length > 0 ? calculateStandardDeviation(throttleValues) : 0,
    overallConsistency: calculateStandardDeviation(lapTimes),
  };
}

/**
 * Calculate consistency metrics from lap data
 *
 * @param laps - Array of lap data
 * @returns Consistency metrics
 */
export function calculateConsistencyMetrics(laps: LapData[]): ConsistencyMetrics {
  if (laps.length === 0) {
    return {
      lapTimeStdDev: 0,
      sector1StdDev: 0,
      sector2StdDev: 0,
      sector3StdDev: 0,
      consistencyScore: 0,
    };
  }

  const lapTimes = laps.map((lap) => lap.lapTime);
  const sector1Times = laps.map((lap) => lap.sector1Time);
  const sector2Times = laps.map((lap) => lap.sector2Time);
  const sector3Times = laps.map((lap) => lap.sector3Time);

  const lapTimeStdDev = calculateStandardDeviation(lapTimes);
  const sector1StdDev = calculateStandardDeviation(sector1Times);
  const sector2StdDev = calculateStandardDeviation(sector2Times);
  const sector3StdDev = calculateStandardDeviation(sector3Times);

  // Calculate consistency score (0-100)
  // Lower standard deviation = higher consistency
  // Normalize by mean lap time
  const meanLapTime = calculateMean(lapTimes);
  const normalizedStdDev = meanLapTime > 0 ? lapTimeStdDev / meanLapTime : 0;
  const consistencyScore = Math.max(0, Math.min(100, 100 * (1 - normalizedStdDev * 10)));

  return {
    lapTimeStdDev,
    sector1StdDev,
    sector2StdDev,
    sector3StdDev,
    consistencyScore,
  };
}

/**
 * Setup interpretation functions
 */

/**
 * Infer car setup characteristics from telemetry patterns
 * Analyzes telemetry data to estimate downforce level, brake balance, and differential settings
 *
 * @param laps - Array of lap data to analyze
 * @param trackData - Optional track data for corner-specific analysis
 * @returns Setup interpretation with confidence levels
 */
export function inferSetupCharacteristics(
  laps: LapData[],
  _trackData?: TrackData
): SetupInterpretation {
  if (laps.length === 0) {
    return {
      downforceLevel: 'medium',
      downforceConfidence: 0,
      brakeBalanceTendency: 'neutral',
      brakeBalanceConfidence: 0,
      differentialSetting: 'balanced',
      differentialConfidence: 0,
      observations: ['Insufficient data for setup interpretation'],
      telemetryEvidence: [],
    };
  }

  const telemetryEvidence: TelemetryEvidence[] = [];
  const observations: string[] = [];

  // Analyze downforce level
  const downforceAnalysis = analyzeDownforceLevel(laps, _trackData);
  telemetryEvidence.push(...downforceAnalysis.evidence);
  observations.push(...downforceAnalysis.observations);

  // Analyze brake balance
  const brakeBalanceAnalysis = analyzeBrakeBalance(laps, _trackData);
  telemetryEvidence.push(...brakeBalanceAnalysis.evidence);
  observations.push(...brakeBalanceAnalysis.observations);

  // Analyze differential setting
  const differentialAnalysis = analyzeDifferentialSetting(laps, _trackData);
  telemetryEvidence.push(...differentialAnalysis.evidence);
  observations.push(...differentialAnalysis.observations);

  return {
    downforceLevel: downforceAnalysis.level,
    downforceConfidence: downforceAnalysis.confidence,
    brakeBalanceTendency: brakeBalanceAnalysis.tendency,
    brakeBalanceConfidence: brakeBalanceAnalysis.confidence,
    differentialSetting: differentialAnalysis.setting,
    differentialConfidence: differentialAnalysis.confidence,
    observations,
    telemetryEvidence,
  };
}

/**
 * Analyze downforce level from telemetry patterns
 */
function analyzeDownforceLevel(
  laps: LapData[],
  _trackData?: TrackData
): {
  level: 'low' | 'medium' | 'high';
  confidence: number;
  evidence: TelemetryEvidence[];
  observations: string[];
} {
  const evidence: TelemetryEvidence[] = [];
  const observations: string[] = [];

  // Calculate average top speed and cornering speed
  let totalTopSpeed = 0;
  let totalCorneringSpeed = 0;
  let speedSampleCount = 0;
  let corneringSampleCount = 0;

  for (const lap of laps) {
    const telemetry = lap.telemetry;

    // Find top speed (max speed on straights - throttle > 90%)
    for (let i = 0; i < telemetry.speed.length; i++) {
      if (telemetry.throttle[i] > 90) {
        totalTopSpeed += telemetry.speed[i];
        speedSampleCount++;
      }
    }

    // Find cornering speed (speed when throttle < 50% and brake < 50%)
    for (let i = 0; i < telemetry.speed.length; i++) {
      if (telemetry.throttle[i] < 50 && telemetry.brake[i] < 50) {
        totalCorneringSpeed += telemetry.speed[i];
        corneringSampleCount++;
      }
    }
  }

  const avgTopSpeed = speedSampleCount > 0 ? totalTopSpeed / speedSampleCount : 0;
  const avgCorneringSpeed =
    corneringSampleCount > 0 ? totalCorneringSpeed / corneringSampleCount : 0;

  // Determine downforce level based on speed ratio
  // High downforce: lower top speed, higher cornering speed
  // Low downforce: higher top speed, lower cornering speed
  const speedRatio = avgTopSpeed > 0 ? avgCorneringSpeed / avgTopSpeed : 0;

  let level: 'low' | 'medium' | 'high';
  let confidence: number;

  if (speedRatio > 0.5) {
    level = 'high';
    confidence = Math.min(0.9, speedRatio);
    observations.push(
      `High downforce setup indicated by high cornering speeds (avg ${avgCorneringSpeed.toFixed(1)} km/h) relative to top speed (${avgTopSpeed.toFixed(1)} km/h)`
    );
  } else if (speedRatio > 0.4) {
    level = 'medium';
    confidence = 0.7;
    observations.push(
      `Medium downforce setup with balanced speed profile (cornering: ${avgCorneringSpeed.toFixed(1)} km/h, top: ${avgTopSpeed.toFixed(1)} km/h)`
    );
  } else {
    level = 'low';
    confidence = Math.min(0.9, 1 - speedRatio);
    observations.push(
      `Low downforce setup indicated by high top speeds (${avgTopSpeed.toFixed(1)} km/h) and lower cornering speeds (${avgCorneringSpeed.toFixed(1)} km/h)`
    );
  }

  evidence.push({
    parameter: 'speed',
    observation: `Speed ratio (cornering/top): ${speedRatio.toFixed(3)}`,
    setupImplication: `Indicates ${level} downforce configuration`,
    cornerExamples: [], // Would need corner data to populate
  });

  return { level, confidence, evidence, observations };
}

/**
 * Analyze brake balance from telemetry patterns
 */
function analyzeBrakeBalance(
  laps: LapData[],
  _trackData?: TrackData
): {
  tendency: 'front' | 'neutral' | 'rear';
  confidence: number;
  evidence: TelemetryEvidence[];
  observations: string[];
} {
  const evidence: TelemetryEvidence[] = [];
  const observations: string[] = [];

  // Analyze brake application patterns
  // Front bias: earlier, harder braking
  // Rear bias: later, gentler braking

  let totalBrakePressure = 0;
  let brakeSampleCount = 0;
  let earlyBrakingCount = 0;
  let lateBrakingCount = 0;

  for (const lap of laps) {
    const telemetry = lap.telemetry;

    for (let i = 0; i < telemetry.brake.length; i++) {
      if (telemetry.brake[i] > 10) {
        totalBrakePressure += telemetry.brake[i];
        brakeSampleCount++;

        // Check if braking while speed is still high (early braking)
        if (telemetry.speed[i] > 250) {
          earlyBrakingCount++;
        } else if (telemetry.speed[i] < 150) {
          lateBrakingCount++;
        }
      }
    }
  }

  const avgBrakePressure = brakeSampleCount > 0 ? totalBrakePressure / brakeSampleCount : 0;
  const earlyBrakingRatio = brakeSampleCount > 0 ? earlyBrakingCount / brakeSampleCount : 0;

  let tendency: 'front' | 'neutral' | 'rear';
  let confidence: number;

  if (earlyBrakingRatio > 0.4 && avgBrakePressure > 60) {
    tendency = 'front';
    confidence = 0.75;
    observations.push(
      `Front brake bias indicated by early, hard braking (avg pressure: ${avgBrakePressure.toFixed(1)}%)`
    );
  } else if (earlyBrakingRatio < 0.2 && avgBrakePressure < 50) {
    tendency = 'rear';
    confidence = 0.75;
    observations.push(
      `Rear brake bias indicated by later, gentler braking (avg pressure: ${avgBrakePressure.toFixed(1)}%)`
    );
  } else {
    tendency = 'neutral';
    confidence = 0.6;
    observations.push(
      `Neutral brake balance with moderate braking patterns (avg pressure: ${avgBrakePressure.toFixed(1)}%)`
    );
  }

  evidence.push({
    parameter: 'brake',
    observation: `Average brake pressure: ${avgBrakePressure.toFixed(1)}%, early braking ratio: ${earlyBrakingRatio.toFixed(3)}`,
    setupImplication: `Suggests ${tendency} brake balance`,
    cornerExamples: [],
  });

  return { tendency, confidence, evidence, observations };
}

/**
 * Analyze differential setting from telemetry patterns
 */
function analyzeDifferentialSetting(
  laps: LapData[],
  _trackData?: TrackData
): {
  setting: 'open' | 'balanced' | 'locked';
  confidence: number;
  evidence: TelemetryEvidence[];
  observations: string[];
} {
  const evidence: TelemetryEvidence[] = [];
  const observations: string[] = [];

  // Analyze throttle application in corners
  // Open diff: earlier throttle application, more gradual
  // Locked diff: later throttle application, more aggressive

  const cornerThrottleApplications: number[] = [];
  const cornerThrottleRates: number[] = [];

  for (const lap of laps) {
    const telemetry = lap.telemetry;

    // Find corner exit phases (low speed transitioning to high speed with throttle)
    for (let i = 1; i < telemetry.speed.length - 1; i++) {
      const isCornerExit =
        telemetry.speed[i] < 200 &&
        telemetry.speed[i + 1] > telemetry.speed[i] &&
        telemetry.throttle[i] > 20;

      if (isCornerExit) {
        cornerThrottleApplications.push(telemetry.throttle[i]);

        // Calculate throttle rate of change
        const throttleRate = telemetry.throttle[i + 1] - telemetry.throttle[i];
        cornerThrottleRates.push(throttleRate);
      }
    }
  }

  const avgCornerThrottle =
    cornerThrottleApplications.length > 0 ? calculateMean(cornerThrottleApplications) : 0;
  const avgThrottleRate = cornerThrottleRates.length > 0 ? calculateMean(cornerThrottleRates) : 0;

  let setting: 'open' | 'balanced' | 'locked';
  let confidence: number;

  if (avgCornerThrottle > 60 && avgThrottleRate > 5) {
    setting = 'open';
    confidence = 0.7;
    observations.push(
      `Open differential indicated by early, aggressive throttle application on corner exit (avg: ${avgCornerThrottle.toFixed(1)}%)`
    );
  } else if (avgCornerThrottle < 40 && avgThrottleRate < 3) {
    setting = 'locked';
    confidence = 0.7;
    observations.push(
      `Locked differential indicated by cautious throttle application on corner exit (avg: ${avgCornerThrottle.toFixed(1)}%)`
    );
  } else {
    setting = 'balanced';
    confidence = 0.6;
    observations.push(
      `Balanced differential with moderate throttle application patterns (avg: ${avgCornerThrottle.toFixed(1)}%)`
    );
  }

  evidence.push({
    parameter: 'throttle',
    observation: `Corner exit throttle: ${avgCornerThrottle.toFixed(1)}%, rate of change: ${avgThrottleRate.toFixed(2)}%/sample`,
    setupImplication: `Suggests ${setting} differential setting`,
    cornerExamples: [],
  });

  return { setting, confidence, evidence, observations };
}
