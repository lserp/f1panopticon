/**
 * Strategy Engine
 * Provides race strategy analysis capabilities including tire degradation,
 * pit exit position calculation, and strategy simulation.
 */

import type {
  LapData,
  StrategyPlan,
  PitExitAnalysis,
  CarPosition,
} from '../types';

/**
 * Tire degradation rate data
 */
export interface TireDegradationRate {
  compound: string;
  degradationPerLap: number; // seconds per lap
  stintStartLap: number;
  stintEndLap: number;
  stintLength: number; // number of laps
  averageLapTime: number; // seconds
  projectedEndOfStintLapTime: number; // seconds
  confidence: number; // 0-1
}

/**
 * Stint analysis data
 */
export interface StintAnalysis {
  compound: string;
  startLap: number;
  endLap: number;
  lapCount: number;
  lapTimes: number[];
  degradationRate: number; // seconds per lap
  totalDegradation: number; // seconds over the stint
  averageLapTime: number;
  fastestLap: number;
  slowestLap: number;
}

/**
 * Tire compound performance tracking
 */
export interface TireCompoundPerformance {
  compound: string;
  totalLaps: number;
  averageLapTime: number;
  bestLapTime: number;
  worstLapTime: number;
  averageDegradationRate: number; // seconds per lap
  stints: StintAnalysis[];
}

/**
 * Calculate tire degradation rate from lap time data
 * Analyzes lap times within a stint to determine degradation rate
 *
 * @param laps - Array of lap data for a single stint
 * @returns Tire degradation rate data
 */
export function calculateTireDegradation(laps: LapData[]): TireDegradationRate {
  if (laps.length === 0) {
    return {
      compound: 'unknown',
      degradationPerLap: 0,
      stintStartLap: 0,
      stintEndLap: 0,
      stintLength: 0,
      averageLapTime: 0,
      projectedEndOfStintLapTime: 0,
      confidence: 0,
    };
  }

  // Get compound from first lap
  const compound = laps[0].tireCompound;
  const stintStartLap = laps[0].lapNumber;
  const stintEndLap = laps[laps.length - 1].lapNumber;
  const stintLength = laps.length;

  // Extract lap times
  const lapTimes = laps.map((lap) => lap.lapTime);
  const averageLapTime = lapTimes.reduce((sum, time) => sum + time, 0) / lapTimes.length;

  // Calculate degradation using linear regression
  // y = mx + b, where y is lap time, x is lap number in stint
  const degradationPerLap = calculateLinearDegradation(lapTimes);

  // Project end of stint lap time
  const projectedEndOfStintLapTime = lapTimes[0] + degradationPerLap * (stintLength - 1);

  // Calculate confidence based on R-squared of linear fit
  const confidence = calculateDegradationConfidence(lapTimes, degradationPerLap);

  return {
    compound,
    degradationPerLap,
    stintStartLap,
    stintEndLap,
    stintLength,
    averageLapTime,
    projectedEndOfStintLapTime,
    confidence,
  };
}

/**
 * Calculate linear degradation rate using least squares regression
 *
 * @param lapTimes - Array of lap times in chronological order
 * @returns Degradation rate in seconds per lap
 */
function calculateLinearDegradation(lapTimes: number[]): number {
  if (lapTimes.length < 2) {
    return 0;
  }

  const n = lapTimes.length;

  // Create x values (lap indices: 0, 1, 2, ...)
  const xValues = Array.from({ length: n }, (_, i) => i);

  // Calculate means
  const meanX = xValues.reduce((sum, x) => sum + x, 0) / n;
  const meanY = lapTimes.reduce((sum, y) => sum + y, 0) / n;

  // Calculate slope (degradation per lap)
  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    numerator += (xValues[i] - meanX) * (lapTimes[i] - meanY);
    denominator += Math.pow(xValues[i] - meanX, 2);
  }

  return denominator !== 0 ? numerator / denominator : 0;
}

/**
 * Calculate confidence in degradation estimate using R-squared
 *
 * @param lapTimes - Array of lap times
 * @param degradationRate - Calculated degradation rate
 * @returns Confidence value between 0 and 1
 */
function calculateDegradationConfidence(lapTimes: number[], degradationRate: number): number {
  if (lapTimes.length < 2) {
    return 0;
  }

  const n = lapTimes.length;
  const meanLapTime = lapTimes.reduce((sum, time) => sum + time, 0) / n;

  // Calculate predicted values
  const predictedTimes = lapTimes.map((_, i) => lapTimes[0] + degradationRate * i);

  // Calculate R-squared
  let ssRes = 0; // Sum of squared residuals
  let ssTot = 0; // Total sum of squares

  for (let i = 0; i < n; i++) {
    ssRes += Math.pow(lapTimes[i] - predictedTimes[i], 2);
    ssTot += Math.pow(lapTimes[i] - meanLapTime, 2);
  }

  const rSquared = ssTot !== 0 ? 1 - ssRes / ssTot : 0;

  // Ensure R-squared is between 0 and 1
  return Math.max(0, Math.min(1, rSquared));
}

/**
 * Analyze a tire stint
 *
 * @param laps - Array of lap data for the stint
 * @returns Stint analysis data
 */
export function analyzeStint(laps: LapData[]): StintAnalysis {
  if (laps.length === 0) {
    return {
      compound: 'unknown',
      startLap: 0,
      endLap: 0,
      lapCount: 0,
      lapTimes: [],
      degradationRate: 0,
      totalDegradation: 0,
      averageLapTime: 0,
      fastestLap: 0,
      slowestLap: 0,
    };
  }

  const compound = laps[0].tireCompound;
  const startLap = laps[0].lapNumber;
  const endLap = laps[laps.length - 1].lapNumber;
  const lapCount = laps.length;
  const lapTimes = laps.map((lap) => lap.lapTime);

  const degradationRate = calculateLinearDegradation(lapTimes);
  const totalDegradation = degradationRate * (lapCount - 1);
  const averageLapTime = lapTimes.reduce((sum, time) => sum + time, 0) / lapCount;
  const fastestLap = Math.min(...lapTimes);
  const slowestLap = Math.max(...lapTimes);

  return {
    compound,
    startLap,
    endLap,
    lapCount,
    lapTimes,
    degradationRate,
    totalDegradation,
    averageLapTime,
    fastestLap,
    slowestLap,
  };
}

/**
 * Track tire compound performance across multiple stints
 *
 * @param laps - Array of all lap data
 * @returns Map of compound name to performance data
 */
export function trackTireCompoundPerformance(
  laps: LapData[]
): Map<string, TireCompoundPerformance> {
  const compoundMap = new Map<string, TireCompoundPerformance>();

  if (laps.length === 0) {
    return compoundMap;
  }

  // Group laps by compound and stint
  const stintsByCompound = groupLapsByCompoundAndStint(laps);

  // Analyze each compound
  for (const [compound, stints] of stintsByCompound.entries()) {
    const allLapTimes: number[] = [];
    const stintAnalyses: StintAnalysis[] = [];
    let totalDegradationRate = 0;

    for (const stintLaps of stints) {
      const stintAnalysis = analyzeStint(stintLaps);
      stintAnalyses.push(stintAnalysis);
      allLapTimes.push(...stintAnalysis.lapTimes);
      totalDegradationRate += stintAnalysis.degradationRate;
    }

    const totalLaps = allLapTimes.length;
    const averageLapTime = allLapTimes.reduce((sum, time) => sum + time, 0) / totalLaps;
    const bestLapTime = Math.min(...allLapTimes);
    const worstLapTime = Math.max(...allLapTimes);
    const averageDegradationRate = stints.length > 0 ? totalDegradationRate / stints.length : 0;

    compoundMap.set(compound, {
      compound,
      totalLaps,
      averageLapTime,
      bestLapTime,
      worstLapTime,
      averageDegradationRate,
      stints: stintAnalyses,
    });
  }

  return compoundMap;
}

/**
 * Group laps by tire compound and stint
 * A new stint starts when the tire compound changes
 *
 * @param laps - Array of lap data
 * @returns Map of compound to array of stints (each stint is an array of laps)
 */
function groupLapsByCompoundAndStint(laps: LapData[]): Map<string, LapData[][]> {
  const compoundMap = new Map<string, LapData[][]>();

  if (laps.length === 0) {
    return compoundMap;
  }

  let currentCompound = laps[0].tireCompound;
  let currentStint: LapData[] = [laps[0]];

  for (let i = 1; i < laps.length; i++) {
    const lap = laps[i];

    if (lap.tireCompound === currentCompound) {
      // Same compound, add to current stint
      currentStint.push(lap);
    } else {
      // Compound changed, save current stint and start new one
      if (!compoundMap.has(currentCompound)) {
        compoundMap.set(currentCompound, []);
      }
      compoundMap.get(currentCompound)!.push(currentStint);

      currentCompound = lap.tireCompound;
      currentStint = [lap];
    }
  }

  // Save the last stint
  if (currentStint.length > 0) {
    if (!compoundMap.has(currentCompound)) {
      compoundMap.set(currentCompound, []);
    }
    compoundMap.get(currentCompound)!.push(currentStint);
  }

  return compoundMap;
}

/**
 * Race state at a specific moment in time
 */
export interface RaceState {
  lap: number;
  positions: CarPosition[];
  timestamp: Date;
}

/**
 * Calculate pit exit position and analyze traffic impact
 *
 * @param pitLap - Lap number when pit stop occurred
 * @param pitDuration - Duration of pit stop in seconds
 * @param raceState - State of the race when pit stop occurred
 * @param pitExitDistance - Distance from start line where pit exit is located (meters)
 * @param driverId - ID of driver making pit stop
 * @returns Pit exit analysis with position and traffic impact
 */
export function calculatePitExitPosition(
  pitLap: number,
  pitDuration: number,
  raceState: RaceState,
  pitExitDistance: number,
  driverId: string
): PitExitAnalysis {
  // Find the driver's position before pit stop
  const driverPosition = raceState.positions.find((pos) => pos.driverId === driverId);

  if (!driverPosition) {
    return {
      pitLap,
      exitDistance: pitExitDistance,
      exitTime: raceState.timestamp,
      positionBefore: 0,
      positionAfter: 0,
      carsAhead: [],
      carsBehind: [],
      gapAhead: 0,
      gapBehind: 0,
      trafficImpact: 'clear',
    };
  }

  const positionBefore = driverPosition.position;

  // Calculate where other cars will be when this driver exits the pits
  // Assume average lap time of 90 seconds for estimation
  const averageLapTime = 90;
  const distancePerSecond = pitExitDistance / averageLapTime;

  // Calculate how far other cars travel during pit stop
  const distanceTraveledDuringPit = distancePerSecond * pitDuration;

  // Update positions of all cars
  const updatedPositions: CarPosition[] = raceState.positions
    .map((pos) => {
      if (pos.driverId === driverId) {
        // Driver exiting pit
        return {
          ...pos,
          distance: pitExitDistance,
          gap: 0, // Will be recalculated
        };
      } else {
        // Other cars continue on track
        return {
          ...pos,
          distance: pos.distance + distanceTraveledDuringPit,
          gap: 0, // Will be recalculated
        };
      }
    })
    .sort((a, b) => b.distance - a.distance); // Sort by distance (leader first)

  // Recalculate positions
  updatedPositions.forEach((pos, index) => {
    pos.position = index + 1;
  });

  // Find driver's new position
  const driverNewPosition = updatedPositions.find((pos) => pos.driverId === driverId);
  const positionAfter = driverNewPosition?.position || 0;

  // Calculate gaps to cars ahead and behind
  const driverIndex = updatedPositions.findIndex((pos) => pos.driverId === driverId);

  const carsAhead: CarPosition[] = [];
  const carsBehind: CarPosition[] = [];
  let gapAhead = 0;
  let gapBehind = 0;

  if (driverIndex > 0) {
    // There are cars ahead
    const carAhead = updatedPositions[driverIndex - 1];
    const distanceGap = carAhead.distance - (driverNewPosition?.distance || 0);
    gapAhead = distanceGap / distancePerSecond; // Convert to time gap

    carsAhead.push({
      ...carAhead,
      gap: gapAhead,
    });
  }

  if (driverIndex < updatedPositions.length - 1) {
    // There are cars behind
    const carBehind = updatedPositions[driverIndex + 1];
    const distanceGap = (driverNewPosition?.distance || 0) - carBehind.distance;
    gapBehind = distanceGap / distancePerSecond; // Convert to time gap

    carsBehind.push({
      ...carBehind,
      gap: gapBehind,
    });
  }

  // Assess traffic impact
  const trafficImpact = assessTrafficImpact(gapAhead, gapBehind);

  // Calculate exit time
  const exitTime = new Date(raceState.timestamp.getTime() + pitDuration * 1000);

  return {
    pitLap,
    exitDistance: pitExitDistance,
    exitTime,
    positionBefore,
    positionAfter,
    carsAhead,
    carsBehind,
    gapAhead,
    gapBehind,
    trafficImpact,
  };
}

/**
 * Calculate time gaps between cars
 *
 * @param positions - Array of car positions sorted by position
 * @param averageLapTime - Average lap time in seconds
 * @param trackLength - Track length in meters
 * @returns Updated positions with gap information
 */
export function calculateTimeGaps(
  positions: CarPosition[],
  averageLapTime: number,
  trackLength: number
): CarPosition[] {
  if (positions.length === 0) {
    return [];
  }

  // Sort by distance (leader first)
  const sortedPositions = [...positions].sort((a, b) => b.distance - a.distance);

  // Calculate gaps relative to leader
  const leader = sortedPositions[0];
  const distancePerSecond = trackLength / averageLapTime;

  return sortedPositions.map((pos, index) => {
    if (index === 0) {
      // Leader has no gap
      return {
        ...pos,
        gap: 0,
      };
    }

    // Calculate distance gap to leader
    const distanceGap = leader.distance - pos.distance;
    const timeGap = distanceGap / distancePerSecond;

    return {
      ...pos,
      gap: timeGap,
    };
  });
}

/**
 * Assess traffic impact based on gaps to cars ahead and behind
 *
 * @param gapAhead - Time gap to car ahead in seconds
 * @param gapBehind - Time gap to car behind in seconds
 * @returns Traffic impact assessment
 */
function assessTrafficImpact(
  gapAhead: number,
  gapBehind: number
): 'clear' | 'minor' | 'significant' {
  // Clear: gaps > 3 seconds on both sides
  // Minor: gaps between 1-3 seconds
  // Significant: gaps < 1 second

  const minGap = Math.min(
    gapAhead === 0 ? Infinity : gapAhead,
    gapBehind === 0 ? Infinity : gapBehind
  );

  if (minGap > 3) {
    return 'clear';
  } else if (minGap > 1) {
    return 'minor';
  } else {
    return 'significant';
  }
}

/**
 * Race data for strategy simulation
 */
export interface RaceData {
  totalLaps: number;
  trackLength: number; // meters
  averageLapTime: number; // seconds
  currentLap: number;
  positions: CarPosition[];
  weatherConditions: 'dry' | 'wet' | 'mixed';
  safetyCarProbability: number; // 0-1
}

/**
 * Strategy simulation result
 */
export interface StrategyResult {
  strategy: StrategyPlan;
  predictedFinishTime: number; // seconds from race start
  predictedPosition: number;
  confidenceInterval: {
    lower: number; // seconds
    upper: number; // seconds
    confidence: number; // e.g., 0.95
  };
  riskAssessment: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
  };
  alternativeOutcomes: AlternativeOutcome[];
}

/**
 * Alternative outcome scenario
 */
export interface AlternativeOutcome {
  scenario: string;
  probability: number; // 0-1
  finishTime: number; // seconds
  position: number;
}

/**
 * Strategy comparison result
 */
export interface StrategyComparison {
  strategies: StrategyResult[];
  recommended: number; // index of recommended strategy
  reasoning: string[];
}

/**
 * Simulate a race strategy
 * Calculates predicted finish times and positions based on strategy plan
 *
 * @param race - Current race data
 * @param strategy - Strategy plan to simulate
 * @returns Strategy simulation result with predictions and confidence intervals
 */
export function simulateStrategy(race: RaceData, strategy: StrategyPlan): StrategyResult {
  // Calculate base race time without pit stops
  const remainingLaps = race.totalLaps - race.currentLap;
  let totalRaceTime = race.currentLap * race.averageLapTime;

  // Simulate each stint
  const stints = strategy.tireAllocation;
  let currentLap = race.currentLap;

  for (const stint of stints) {
    const stintLaps = stint.endLap - stint.startLap + 1;

    // Estimate lap time for this compound
    // Different compounds have different base lap times
    const compoundDelta = getCompoundLapTimeDelta(stint.compound);
    const baseLapTime = race.averageLapTime + compoundDelta;

    // Apply tire degradation over the stint
    // Assume 0.05 seconds per lap degradation
    const degradationRate = 0.05;

    for (let i = 0; i < stintLaps; i++) {
      const lapTime = baseLapTime + degradationRate * i;
      totalRaceTime += lapTime;
      currentLap++;
    }
  }

  // Add pit stop times
  for (const pitStop of strategy.pitStops) {
    totalRaceTime += pitStop.duration;
  }

  // Calculate predicted position
  // Simplified: assume position based on total time relative to average
  const averageTotalRaceTime = race.totalLaps * race.averageLapTime;
  const timeDelta = totalRaceTime - averageTotalRaceTime;

  // Rough estimate: 0.3 seconds per position
  const positionDelta = Math.round(timeDelta / 0.3);
  const currentPosition = race.positions.find((p) => p.position === 1)?.position || 1;
  const predictedPosition = Math.max(1, Math.min(20, currentPosition + positionDelta));

  // Calculate confidence interval
  // Uncertainty increases with number of pit stops and remaining laps
  const baseUncertainty = 2.0; // seconds
  const pitStopUncertainty = strategy.pitStops.length * 1.5;
  const lapUncertainty = remainingLaps * 0.1;
  const totalUncertainty = baseUncertainty + pitStopUncertainty + lapUncertainty;

  const confidenceInterval = {
    lower: totalRaceTime - totalUncertainty,
    upper: totalRaceTime + totalUncertainty,
    confidence: 0.95,
    mean: totalRaceTime,
  };

  // Assess risk
  const riskAssessment = assessStrategyRisk(strategy, race);

  // Generate alternative outcomes
  const alternativeOutcomes = generateAlternativeOutcomes(
    race,
    strategy,
    totalRaceTime,
    predictedPosition
  );

  return {
    strategy,
    predictedFinishTime: totalRaceTime,
    predictedPosition,
    confidenceInterval,
    riskAssessment,
    alternativeOutcomes,
  };
}

/**
 * Get lap time delta for tire compound
 * Softer compounds are faster but degrade more
 *
 * @param compound - Tire compound name
 * @returns Lap time delta in seconds (negative is faster)
 */
function getCompoundLapTimeDelta(compound: string): number {
  const compoundMap: Record<string, number> = {
    soft: -0.5,
    medium: 0,
    hard: 0.5,
    intermediate: 2.0,
    wet: 5.0,
  };

  const normalizedCompound = compound.toLowerCase();
  return compoundMap[normalizedCompound] || 0;
}

/**
 * Assess risk level of a strategy
 *
 * @param strategy - Strategy plan
 * @param race - Race data
 * @returns Risk assessment
 */
function assessStrategyRisk(
  _strategy: StrategyPlan,
  race: RaceData
): {
  level: 'low' | 'medium' | 'high';
  factors: string[];
} {
  const factors: string[] = [];
  let riskScore = 0;

  // More pit stops = higher risk
  if (_strategy.pitStops.length > 2) {
    factors.push('Multiple pit stops increase risk of lost time');
    riskScore += 2;
  } else if (_strategy.pitStops.length === 0) {
    factors.push('No pit stops is very risky for tire management');
    riskScore += 3;
  }

  // Safety car probability affects risk
  if (race.safetyCarProbability > 0.3) {
    factors.push('High safety car probability adds uncertainty');
    riskScore += 1;
  }

  // Weather conditions
  if (race.weatherConditions === 'mixed') {
    factors.push('Mixed weather conditions increase strategy risk');
    riskScore += 2;
  } else if (race.weatherConditions === 'wet') {
    factors.push('Wet conditions add tire strategy complexity');
    riskScore += 1;
  }

  // Long stints on soft tires are risky
  for (const stint of _strategy.tireAllocation) {
    const stintLength = stint.endLap - stint.startLap + 1;
    if (stint.compound.toLowerCase() === 'soft' && stintLength > 20) {
      factors.push('Long stint on soft tires may cause excessive degradation');
      riskScore += 2;
    }
  }

  // Determine risk level
  let level: 'low' | 'medium' | 'high';
  if (riskScore >= 5) {
    level = 'high';
  } else if (riskScore >= 3) {
    level = 'medium';
  } else {
    level = 'low';
  }

  return { level, factors };
}

/**
 * Generate alternative outcome scenarios
 *
 * @param race - Race data
 * @param strategy - Strategy plan
 * @param baseFinishTime - Base predicted finish time
 * @param basePosition - Base predicted position
 * @returns Array of alternative outcomes
 */
function generateAlternativeOutcomes(
  race: RaceData,
  _strategy: StrategyPlan,
  baseFinishTime: number,
  basePosition: number
): AlternativeOutcome[] {
  const outcomes: AlternativeOutcome[] = [];

  // Scenario 1: Safety car during pit window
  if (race.safetyCarProbability > 0.1) {
    outcomes.push({
      scenario: 'Safety car during pit window',
      probability: race.safetyCarProbability,
      finishTime: baseFinishTime - 10, // Gain time under safety car
      position: Math.max(1, basePosition - 2),
    });
  }

  // Scenario 2: No safety car (if probability is significant)
  if (race.safetyCarProbability > 0.3) {
    outcomes.push({
      scenario: 'No safety car',
      probability: 1 - race.safetyCarProbability,
      finishTime: baseFinishTime,
      position: basePosition,
    });
  }

  // Scenario 3: Faster tire degradation than expected
  outcomes.push({
    scenario: 'Faster tire degradation',
    probability: 0.2,
    finishTime: baseFinishTime + 5,
    position: Math.min(20, basePosition + 1),
  });

  // Scenario 4: Slower tire degradation than expected
  outcomes.push({
    scenario: 'Slower tire degradation',
    probability: 0.2,
    finishTime: baseFinishTime - 3,
    position: Math.max(1, basePosition - 1),
  });

  return outcomes;
}

/**
 * Compare multiple strategy options
 *
 * @param race - Race data
 * @param strategies - Array of strategy plans to compare
 * @returns Strategy comparison with recommendation
 */
export function compareStrategies(race: RaceData, strategies: StrategyPlan[]): StrategyComparison {
  // Simulate each strategy
  const results = strategies.map((strategy) => simulateStrategy(race, strategy));

  // Find the best strategy
  // Prioritize: lowest risk, then fastest time, then best position
  let recommendedIndex = 0;
  let bestScore = -Infinity;

  for (let i = 0; i < results.length; i++) {
    const result = results[i];

    // Calculate score
    let score = 0;

    // Risk penalty
    if (result.riskAssessment.level === 'low') {
      score += 100;
    } else if (result.riskAssessment.level === 'medium') {
      score += 50;
    }

    // Time bonus (faster is better)
    score -= result.predictedFinishTime / 10;

    // Position bonus (lower position number is better)
    score += (21 - result.predictedPosition) * 5;

    if (score > bestScore) {
      bestScore = score;
      recommendedIndex = i;
    }
  }

  // Generate reasoning
  const reasoning: string[] = [];
  const recommended = results[recommendedIndex];

  reasoning.push(`Recommended strategy has ${recommended.riskAssessment.level} risk level`);
  reasoning.push(`Predicted finish time: ${recommended.predictedFinishTime.toFixed(1)}s`);
  reasoning.push(`Predicted position: P${recommended.predictedPosition}`);
  reasoning.push(`${strategies[recommendedIndex].pitStops.length} pit stop(s) planned`);

  return {
    strategies: results,
    recommended: recommendedIndex,
    reasoning,
  };
}
