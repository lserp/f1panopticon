import type { Corner } from '../types';

/**
 * Find the corner closest to a given distance on the track
 * @param distance - Distance in meters from start line
 * @param corners - Array of corners on the track
 * @param threshold - Maximum distance in meters to consider a corner (default: 50m)
 * @returns The closest corner within threshold, or undefined
 */
export function findCornerAtDistance(
  distance: number,
  corners: Corner[],
  threshold: number = 50
): Corner | undefined {
  let closestCorner: Corner | undefined;
  let minDistance = threshold;

  for (const corner of corners) {
    const dist = Math.abs(corner.distance - distance);
    if (dist < minDistance) {
      minDistance = dist;
      closestCorner = corner;
    }
  }

  return closestCorner;
}

/**
 * Format a tooltip message with telemetry data and optional corner information
 * @param lapNumber - Lap number
 * @param driverId - Driver identifier
 * @param distance - Distance in meters
 * @param value - Telemetry value
 * @param channel - Telemetry channel name
 * @param corner - Optional corner information
 * @returns Formatted tooltip string
 */
export function formatTooltip(
  lapNumber: number,
  driverId: string,
  distance: number,
  value: number,
  channel: string,
  corner?: Corner
): string {
  let tooltip = `<b>Lap ${lapNumber} - ${driverId}</b><br>`;
  tooltip += `Distance: ${distance.toFixed(0)}m<br>`;

  if (corner) {
    tooltip += `Corner: ${corner.name} (T${corner.number})<br>`;
  }

  tooltip += `${channel}: ${value.toFixed(1)}`;

  return tooltip;
}

/**
 * Synchronize tooltip position across multiple charts
 * This utility helps maintain consistent hover state across multiple chart instances
 */
export class TooltipSynchronizer {
  private listeners: Set<(distance: number) => void> = new Set();
  private currentDistance: number | undefined;

  /**
   * Register a listener for tooltip position changes
   */
  subscribe(listener: (distance: number) => void): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Update the current tooltip position and notify all listeners
   */
  update(distance: number): void {
    if (this.currentDistance !== distance) {
      this.currentDistance = distance;
      this.listeners.forEach((listener) => listener(distance));
    }
  }

  /**
   * Clear the current tooltip position
   */
  clear(): void {
    this.currentDistance = undefined;
  }

  /**
   * Get the current tooltip position
   */
  getCurrent(): number | undefined {
    return this.currentDistance;
  }
}
