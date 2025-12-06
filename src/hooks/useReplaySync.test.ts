import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { findTelemetryPointAtTime, useReplaySync } from './useReplaySync';
import type { TelemetryData } from '../types';

describe('findTelemetryPointAtTime', () => {
  const mockTelemetry: TelemetryData = {
    distance: [0, 100, 200, 300, 400, 500],
    time: [0, 1, 2, 3, 4, 5],
    speed: [100, 150, 200, 180, 160, 140],
    throttle: [50, 80, 100, 90, 70, 60],
    brake: [0, 0, 0, 20, 40, 50],
    gear: [3, 4, 5, 5, 4, 3],
    rpm: [8000, 9000, 10000, 9500, 8500, 7500],
    drs: [0, 0, 1, 1, 0, 0],
    nGear: [0.5, 0.6, 0.8, 0.8, 0.6, 0.5],
  };

  it('returns null for empty telemetry', () => {
    const emptyTelemetry: TelemetryData = {
      distance: [],
      time: [],
      speed: [],
      throttle: [],
      brake: [],
      gear: [],
      rpm: [],
      drs: [],
      nGear: [],
    };

    const result = findTelemetryPointAtTime(emptyTelemetry, 2.5);
    expect(result).toBeNull();
  });

  it('returns first point for time before start', () => {
    const result = findTelemetryPointAtTime(mockTelemetry, -1);
    expect(result).toEqual({ index: 0, distance: 0 });
  });

  it('returns last point for time after end', () => {
    const result = findTelemetryPointAtTime(mockTelemetry, 10);
    expect(result).toEqual({ index: 5, distance: 500 });
  });

  it('returns exact point for exact time match', () => {
    const result = findTelemetryPointAtTime(mockTelemetry, 3);
    expect(result).toEqual({ index: 3, distance: 300 });
  });

  it('returns closest point for time between samples', () => {
    const result = findTelemetryPointAtTime(mockTelemetry, 2.3);
    // Should be closer to index 2 (time=2) than index 3 (time=3)
    expect(result).toEqual({ index: 2, distance: 200 });
  });

  it('returns closest point for time exactly between samples', () => {
    const result = findTelemetryPointAtTime(mockTelemetry, 2.5);
    // When exactly between, should return the earlier index
    expect(result?.index).toBeGreaterThanOrEqual(2);
    expect(result?.index).toBeLessThanOrEqual(3);
  });

  it('handles time at start', () => {
    const result = findTelemetryPointAtTime(mockTelemetry, 0);
    expect(result).toEqual({ index: 0, distance: 0 });
  });

  it('handles time at end', () => {
    const result = findTelemetryPointAtTime(mockTelemetry, 5);
    expect(result).toEqual({ index: 5, distance: 500 });
  });
});

describe('useReplaySync', () => {
  const mockTelemetry: TelemetryData = {
    distance: [0, 100, 200, 300, 400, 500],
    time: [0, 1, 2, 3, 4, 5],
    speed: [100, 150, 200, 180, 160, 140],
    throttle: [50, 80, 100, 90, 70, 60],
    brake: [0, 0, 0, 20, 40, 50],
    gear: [3, 4, 5, 5, 4, 3],
    rpm: [8000, 9000, 10000, 9500, 8500, 7500],
    drs: [0, 0, 1, 1, 0, 0],
    nGear: [0.5, 0.6, 0.8, 0.8, 0.6, 0.5],
  };

  it('returns zero distance for null telemetry', () => {
    const { result } = renderHook(() => useReplaySync(null));
    expect(result.current.currentDistance).toBe(0);
  });

  it('returns current time and distance', () => {
    const { result } = renderHook(() => useReplaySync(mockTelemetry));
    expect(result.current).toHaveProperty('currentTime');
    expect(result.current).toHaveProperty('currentDistance');
  });
});
