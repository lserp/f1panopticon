import type { LapData, TelemetryData } from '../types';

export interface PerformanceGap {
  startDistance: number;
  endDistance: number;
  gap: number; // seconds
  fasterLapIndex: number;
}

/**
 * Calculate performance gaps between two laps
 * @param lap1 - First lap data
 * @param lap2 - Second lap data
 * @param threshold - Minimum gap in seconds to be considered significant (default: 0.1)
 * @returns Array of performance gaps exceeding the threshold
 */
export function calculatePerformanceGaps(
  lap1: LapData,
  lap2: LapData,
  threshold: number = 0.1
): PerformanceGap[] {
  const gaps: PerformanceGap[] = [];

  // Get telemetry data
  const tel1 = lap1.telemetry;
  const tel2 = lap2.telemetry;

  // Find common distance range
  const minDistance = Math.max(tel1.distance[0], tel2.distance[0]);
  const maxDistance = Math.min(
    tel1.distance[tel1.distance.length - 1],
    tel2.distance[tel2.distance.length - 1]
  );

  // Sample at regular intervals
  const sampleInterval = 50; // meters
  let currentGap: PerformanceGap | null = null;

  for (let distance = minDistance; distance <= maxDistance; distance += sampleInterval) {
    // Interpolate time at this distance for both laps
    const time1 = interpolateTimeAtDistance(tel1, distance);
    const time2 = interpolateTimeAtDistance(tel2, distance);

    if (time1 === null || time2 === null) continue;

    // Calculate time gap
    const gap = Math.abs(time1 - time2);
    const fasterLapIndex = time1 < time2 ? 0 : 1;

    if (gap > threshold) {
      if (currentGap && currentGap.fasterLapIndex === fasterLapIndex) {
        // Extend current gap
        currentGap.endDistance = distance;
        currentGap.gap = Math.max(currentGap.gap, gap);
      } else {
        // Start new gap
        if (currentGap) {
          gaps.push(currentGap);
        }
        currentGap = {
          startDistance: distance,
          endDistance: distance,
          gap,
          fasterLapIndex,
        };
      }
    } else {
      // Gap below threshold, close current gap if exists
      if (currentGap) {
        gaps.push(currentGap);
        currentGap = null;
      }
    }
  }

  // Add final gap if exists
  if (currentGap) {
    gaps.push(currentGap);
  }

  return gaps;
}

/**
 * Interpolate time at a specific distance
 * @param telemetry - Telemetry data
 * @param distance - Distance in meters
 * @returns Interpolated time in seconds, or null if distance is out of range
 */
function interpolateTimeAtDistance(telemetry: TelemetryData, distance: number): number | null {
  const distances = telemetry.distance;
  const times = telemetry.time;

  // Check if distance is in range
  if (distance < distances[0] || distance > distances[distances.length - 1]) {
    return null;
  }

  // Find surrounding points
  let i = 0;
  while (i < distances.length - 1 && distances[i + 1] < distance) {
    i++;
  }

  // If exact match
  if (distances[i] === distance) {
    return times[i];
  }

  // If at end
  if (i === distances.length - 1) {
    return times[i];
  }

  // Linear interpolation
  const d1 = distances[i];
  const d2 = distances[i + 1];
  const t1 = times[i];
  const t2 = times[i + 1];

  const ratio = (distance - d1) / (d2 - d1);
  return t1 + ratio * (t2 - t1);
}

/**
 * Check if a distance falls within any performance gap
 * @param distance - Distance in meters
 * @param gaps - Array of performance gaps
 * @returns The gap containing this distance, or undefined
 */
export function findGapAtDistance(
  distance: number,
  gaps: PerformanceGap[]
): PerformanceGap | undefined {
  return gaps.find((gap) => distance >= gap.startDistance && distance <= gap.endDistance);
}

/**
 * Get all gaps where a specific lap is faster
 * @param gaps - Array of performance gaps
 * @param lapIndex - Index of the lap (0 or 1)
 * @returns Filtered array of gaps where the specified lap is faster
 */
export function getGapsForLap(gaps: PerformanceGap[], lapIndex: number): PerformanceGap[] {
  return gaps.filter((gap) => gap.fasterLapIndex === lapIndex);
}
