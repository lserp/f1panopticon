/**
 * React hooks for adaptive performance
 * Requirements: Bandwidth detection, adaptive visualization, progressive loading
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  detectNetworkSpeed,
  determinePerformanceLevel,
  getPerformanceConfig,
  isDataSaverEnabled,
  NetworkMonitor,
  ProgressiveLoader,
  decimateTelemetryData,
  getOptimalChunkSize,
  type NetworkSpeed,
  type PerformanceLevel,
  type PerformanceConfig,
} from '../utils/adaptivePerformance';

/**
 * Hook to detect and monitor network speed
 */
export function useNetworkSpeed(): NetworkSpeed {
  const [networkSpeed, setNetworkSpeed] = useState<NetworkSpeed>(() => detectNetworkSpeed());

  useEffect(() => {
    const monitor = new NetworkMonitor();
    const unsubscribe = monitor.onChange((speed) => {
      setNetworkSpeed(speed);
    });

    return unsubscribe;
  }, []);

  return networkSpeed;
}

/**
 * Hook to get current performance level
 */
export function usePerformanceLevel(): PerformanceLevel {
  const networkSpeed = useNetworkSpeed();
  const [performanceLevel, setPerformanceLevel] = useState<PerformanceLevel>(() =>
    determinePerformanceLevel()
  );

  useEffect(() => {
    const newLevel = determinePerformanceLevel();
    if (newLevel !== performanceLevel) {
      setPerformanceLevel(newLevel);
    }
  }, [networkSpeed, performanceLevel]);

  return performanceLevel;
}

/**
 * Hook to get performance configuration
 */
export function usePerformanceConfig(): PerformanceConfig {
  const performanceLevel = usePerformanceLevel();
  return useMemo(() => getPerformanceConfig(performanceLevel), [performanceLevel]);
}

/**
 * Hook to check if data saver is enabled
 */
export function useDataSaver(): boolean {
  const [dataSaver, setDataSaver] = useState(() => isDataSaverEnabled());

  useEffect(() => {
    const monitor = new NetworkMonitor();
    const unsubscribe = monitor.onChange(() => {
      setDataSaver(isDataSaverEnabled());
    });

    return unsubscribe;
  }, []);

  return dataSaver;
}

/**
 * Hook to decimate data based on performance level
 */
export function useAdaptiveData<T>(data: T[]): T[] {
  const config = usePerformanceConfig();

  return useMemo(() => {
    if (config.telemetryResolution <= 1) {
      return data;
    }
    return decimateTelemetryData(data, config.telemetryResolution);
  }, [data, config.telemetryResolution]);
}

/**
 * Hook for progressive data loading
 */
export function useProgressiveLoading<T>(
  data: T[],
  enabled: boolean = true
): {
  loadedData: T[];
  progress: number;
  isComplete: boolean;
  loadMore: () => void;
  reset: () => void;
} {
  const config = usePerformanceConfig();
  const chunkSize = getOptimalChunkSize(config.level);

  const [loadedData, setLoadedData] = useState<T[]>([]);
  const [progress, setProgress] = useState(0);
  const [loader, setLoader] = useState<ProgressiveLoader<T> | null>(null);

  // Initialize loader when data changes
  useEffect(() => {
    if (!enabled || data.length === 0) {
      setLoadedData(data);
      setProgress(1);
      setLoader(null);
      return;
    }

    const newLoader = new ProgressiveLoader(data, chunkSize);
    newLoader.onChunk((chunk, prog) => {
      setLoadedData((prev) => [...prev, ...chunk]);
      setProgress(prog);
    });

    setLoader(newLoader);
    setLoadedData([]);
    setProgress(0);

    // Load first chunk immediately
    newLoader.loadNext();
  }, [data, chunkSize, enabled]);

  const loadMore = useCallback(() => {
    if (loader && !loader.isComplete()) {
      loader.loadNext();
    }
  }, [loader]);

  const reset = useCallback(() => {
    if (loader) {
      loader.reset();
      setLoadedData([]);
      setProgress(0);
      loader.loadNext();
    }
  }, [loader]);

  const isComplete = loader ? loader.isComplete() : true;

  return {
    loadedData,
    progress,
    isComplete,
    loadMore,
    reset,
  };
}

/**
 * Hook to automatically load data progressively with intersection observer
 */
export function useAutoProgressiveLoading<T>(
  data: T[],
  enabled: boolean = true
): {
  loadedData: T[];
  progress: number;
  isComplete: boolean;
  loadMoreRef: React.RefObject<HTMLDivElement | null>;
} {
  const { loadedData, progress, isComplete, loadMore } = useProgressiveLoading(data, enabled);
  const loadMoreRef = React.useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!enabled || isComplete) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const element = loadMoreRef.current;
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [enabled, isComplete, loadMore]);

  return {
    loadedData,
    progress,
    isComplete,
    loadMoreRef,
  };
}

/**
 * Hook to check if animations should be enabled
 */
export function useAnimationsEnabled(): boolean {
  const config = usePerformanceConfig();
  return config.chartAnimations;
}

/**
 * Hook to get optimal number of concurrent charts
 */
export function useMaxConcurrentCharts(): number {
  const config = usePerformanceConfig();
  return config.maxConcurrentCharts;
}

/**
 * Hook to get chart quality setting
 */
export function useChartQuality(): 'low' | 'medium' | 'high' {
  const config = usePerformanceConfig();
  return config.chartQuality;
}

/**
 * Hook to check if progressive loading should be enabled
 */
export function useProgressiveLoadingEnabled(): boolean {
  const config = usePerformanceConfig();
  return config.enableProgressiveLoading;
}
