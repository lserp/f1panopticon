import type { TrackData, TrackCoordinate } from '../types';

/**
 * Utility functions for bidirectional mapping between track distance and track position
 */

export interface TrackPosition {
  x: number;
  y: number;
  distance: number;
}

/**
 * Find the track coordinate closest to a given distance
 * @param trackData The track data containing coordinates
 * @param distance The distance in meters from start line
 * @returns The closest track coordinate or null if no coordinates exist
 */
export function distanceToPosition(trackData: TrackData, distance: number): TrackPosition | null {
  if (trackData.coordinates.length === 0) {
    return null;
  }

  // Handle wrap-around for distances beyond track length
  const normalizedDistance = distance % trackData.length;

  let closestCoord: TrackCoordinate | null = null;
  let minDiff = Infinity;

  for (const coord of trackData.coordinates) {
    const diff = Math.abs(coord.distance - normalizedDistance);
    if (diff < minDiff) {
      minDiff = diff;
      closestCoord = coord;
    }
  }

  if (!closestCoord) {
    return null;
  }

  return {
    x: closestCoord.x,
    y: closestCoord.y,
    distance: closestCoord.distance,
  };
}

/**
 * Find the distance closest to a given track position
 * @param trackData The track data containing coordinates
 * @param x The x coordinate
 * @param y The y coordinate
 * @returns The distance in meters from start line or null if no coordinates exist
 */
export function positionToDistance(trackData: TrackData, x: number, y: number): number | null {
  if (trackData.coordinates.length === 0) {
    return null;
  }

  let closestDistance: number | null = null;
  let minDist = Infinity;

  for (const coord of trackData.coordinates) {
    const dist = Math.sqrt(Math.pow(coord.x - x, 2) + Math.pow(coord.y - y, 2));
    if (dist < minDist) {
      minDist = dist;
      closestDistance = coord.distance;
    }
  }

  return closestDistance;
}

/**
 * Interpolate position between two track coordinates
 * @param coord1 First coordinate
 * @param coord2 Second coordinate
 * @param targetDistance Target distance to interpolate to
 * @returns Interpolated position
 */
export function interpolatePosition(
  coord1: TrackCoordinate,
  coord2: TrackCoordinate,
  targetDistance: number
): TrackPosition {
  const distRange = coord2.distance - coord1.distance;
  const ratio = (targetDistance - coord1.distance) / distRange;

  return {
    x: coord1.x + (coord2.x - coord1.x) * ratio,
    y: coord1.y + (coord2.y - coord1.y) * ratio,
    distance: targetDistance,
  };
}

/**
 * Get track position with interpolation for more accurate positioning
 * @param trackData The track data containing coordinates
 * @param distance The distance in meters from start line
 * @returns Interpolated track position or null if insufficient data
 */
export function distanceToPositionInterpolated(
  trackData: TrackData,
  distance: number
): TrackPosition | null {
  if (trackData.coordinates.length < 2) {
    return distanceToPosition(trackData, distance);
  }

  const normalizedDistance = distance % trackData.length;

  // Find the two coordinates that bracket the target distance
  let before: TrackCoordinate | null = null;
  let after: TrackCoordinate | null = null;

  for (let i = 0; i < trackData.coordinates.length; i++) {
    const coord = trackData.coordinates[i];
    if (coord.distance <= normalizedDistance) {
      if (!before || coord.distance > before.distance) {
        before = coord;
      }
    }
    if (coord.distance >= normalizedDistance) {
      if (!after || coord.distance < after.distance) {
        after = coord;
      }
    }
  }

  // If we found both bracketing coordinates, interpolate
  if (before && after && before.distance !== after.distance) {
    return interpolatePosition(before, after, normalizedDistance);
  }

  // Fall back to nearest neighbor
  return distanceToPosition(trackData, distance);
}

/**
 * Validate bidirectional mapping consistency
 * This is used for testing the round-trip property
 * @param trackData The track data
 * @param distance The original distance
 * @param tolerance Acceptable error in meters
 * @returns True if round-trip is consistent within tolerance
 */
export function validateRoundTrip(
  trackData: TrackData,
  distance: number,
  tolerance: number = 10
): boolean {
  const position = distanceToPosition(trackData, distance);
  if (!position) {
    return false;
  }

  const roundTripDistance = positionToDistance(trackData, position.x, position.y);
  if (roundTripDistance === null) {
    return false;
  }

  return Math.abs(roundTripDistance - position.distance) <= tolerance;
}
