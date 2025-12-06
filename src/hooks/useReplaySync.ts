import { useEffect, useMemo } from 'react';
import { useAppStore } from '../store';
import type { TelemetryData } from '../types';

/**
 * Finds the closest telemetry data point for a given time
 * @param telemetry - The telemetry data array
 * @param time - The target time in seconds
 * @returns The index of the closest data point and the corresponding distance
 */
export function findTelemetryPointAtTime(
  telemetry: TelemetryData,
  time: number
): { index: number; distance: number } | null {
  if (!telemetry.time || telemetry.time.length === 0) {
    return null;
  }

  // Binary search for the closest time
  let left = 0;
  let right = telemetry.time.length - 1;

  // Handle edge cases
  if (time <= telemetry.time[0]) {
    return { index: 0, distance: telemetry.distance[0] };
  }
  if (time >= telemetry.time[right]) {
    return { index: right, distance: telemetry.distance[right] };
  }

  // Binary search
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const midTime = telemetry.time[mid];

    if (midTime === time) {
      return { index: mid, distance: telemetry.distance[mid] };
    } else if (midTime < time) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  // Find the closest of the two candidates
  const leftTime = telemetry.time[right];
  const rightTime = telemetry.time[left];

  const leftDiff = Math.abs(time - leftTime);
  const rightDiff = Math.abs(time - rightTime);

  const closestIndex = leftDiff < rightDiff ? right : left;

  return {
    index: closestIndex,
    distance: telemetry.distance[closestIndex],
  };
}

/**
 * Hook for synchronizing telemetry visualizations to replay time
 * Updates the store's currentDistance based on the replay time
 */
export function useReplaySync(telemetry: TelemetryData | null) {
  const currentTime = useAppStore((state) => state.currentTime);
  const setCurrentDistance = useAppStore((state) => state.setCurrentDistance);

  // Calculate the distance corresponding to the current replay time
  const currentDistance = useMemo(() => {
    if (!telemetry) {
      return 0;
    }

    const point = findTelemetryPointAtTime(telemetry, currentTime);
    return point?.distance ?? 0;
  }, [telemetry, currentTime]);

  // Update the store whenever the distance changes
  useEffect(() => {
    setCurrentDistance(currentDistance);
  }, [currentDistance, setCurrentDistance]);

  return {
    currentTime,
    currentDistance,
  };
}

/**
 * Hook for synchronizing multiple telemetry channels to replay time
 * Returns the current time and distance for all channels
 */
export function useMultiChannelReplaySync(telemetryChannels: TelemetryData[]) {
  const currentTime = useAppStore((state) => state.currentTime);
  const setCurrentDistance = useAppStore((state) => state.setCurrentDistance);

  // Calculate distances for all channels at the current time
  const channelDistances = useMemo(() => {
    return telemetryChannels.map((telemetry) => {
      const point = findTelemetryPointAtTime(telemetry, currentTime);
      return point?.distance ?? 0;
    });
  }, [telemetryChannels, currentTime]);

  // Use the first channel's distance as the primary distance
  // (all channels should be synchronized to the same distance axis)
  const primaryDistance = channelDistances[0] ?? 0;

  useEffect(() => {
    setCurrentDistance(primaryDistance);
  }, [primaryDistance, setCurrentDistance]);

  return {
    currentTime,
    currentDistance: primaryDistance,
    channelDistances,
  };
}

/**
 * Hook for getting telemetry values at the current replay time
 * Returns the actual telemetry values (speed, throttle, etc.) at the current time
 */
export function useTelemetryAtTime(telemetry: TelemetryData | null) {
  const currentTime = useAppStore((state) => state.currentTime);

  const telemetryValues = useMemo(() => {
    if (!telemetry) {
      return null;
    }

    const point = findTelemetryPointAtTime(telemetry, currentTime);
    if (!point) {
      return null;
    }

    const { index } = point;

    return {
      distance: telemetry.distance[index],
      time: telemetry.time[index],
      speed: telemetry.speed[index],
      throttle: telemetry.throttle[index],
      brake: telemetry.brake[index],
      gear: telemetry.gear[index],
      rpm: telemetry.rpm[index],
      drs: telemetry.drs[index],
      nGear: telemetry.nGear[index],
    };
  }, [telemetry, currentTime]);

  return telemetryValues;
}
