/**
 * Adaptive Performance Utilities
 * Requirements: Bandwidth detection, reduce visualization resolution on limited bandwidth,
 * implement progressive loading
 */

export type NetworkSpeed = 'slow-2g' | '2g' | '3g' | '4g' | 'fast' | 'unknown';
export type PerformanceLevel = 'low' | 'medium' | 'high' | 'ultra';

export interface NetworkInformation {
  effectiveType?: NetworkSpeed;
  downlink?: number; // Mbps
  rtt?: number; // Round-trip time in ms
  saveData?: boolean;
}

export interface PerformanceConfig {
  level: PerformanceLevel;
  telemetryResolution: number; // Data point decimation factor (1 = full, 2 = half, etc.)
  chartAnimations: boolean;
  chartQuality: 'low' | 'medium' | 'high';
  maxConcurrentCharts: number;
  enableProgressiveLoading: boolean;
  imageQuality: number; // 0-1
  cacheStrategy: 'aggressive' | 'normal' | 'minimal';
}

/**
 * Get network information from browser API
 */
export function getNetworkInformation(): NetworkInformation {
  // @ts-ignore - Network Information API is not fully typed
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

  if (!connection) {
    return {};
  }

  return {
    effectiveType: connection.effectiveType as NetworkSpeed,
    downlink: connection.downlink,
    rtt: connection.rtt,
    saveData: connection.saveData,
  };
}

/**
 * Detect network speed category
 */
export function detectNetworkSpeed(): NetworkSpeed {
  const networkInfo = getNetworkInformation();

  if (networkInfo.effectiveType) {
    return networkInfo.effectiveType;
  }

  // Fallback: estimate based on downlink speed
  if (networkInfo.downlink !== undefined) {
    if (networkInfo.downlink < 0.5) return 'slow-2g';
    if (networkInfo.downlink < 1) return '2g';
    if (networkInfo.downlink < 5) return '3g';
    if (networkInfo.downlink < 10) return '4g';
    return 'fast';
  }

  return 'unknown';
}

/**
 * Check if user has enabled data saver mode
 */
export function isDataSaverEnabled(): boolean {
  const networkInfo = getNetworkInformation();
  return networkInfo.saveData === true;
}

/**
 * Determine performance level based on network and device capabilities
 */
export function determinePerformanceLevel(): PerformanceLevel {
  const networkSpeed = detectNetworkSpeed();
  const dataSaver = isDataSaverEnabled();

  // If data saver is enabled, always use low performance
  if (dataSaver) {
    return 'low';
  }

  // Determine based on network speed
  switch (networkSpeed) {
    case 'slow-2g':
    case '2g':
      return 'low';
    case '3g':
      return 'medium';
    case '4g':
      return 'high';
    case 'fast':
      return 'ultra';
    default:
      // Unknown network - use medium as safe default
      return 'medium';
  }
}

/**
 * Get performance configuration based on level
 */
export function getPerformanceConfig(level: PerformanceLevel): PerformanceConfig {
  const configs: Record<PerformanceLevel, PerformanceConfig> = {
    low: {
      level: 'low',
      telemetryResolution: 4, // Show 1/4 of data points
      chartAnimations: false,
      chartQuality: 'low',
      maxConcurrentCharts: 4,
      enableProgressiveLoading: true,
      imageQuality: 0.6,
      cacheStrategy: 'minimal',
    },
    medium: {
      level: 'medium',
      telemetryResolution: 2, // Show 1/2 of data points
      chartAnimations: true,
      chartQuality: 'medium',
      maxConcurrentCharts: 6,
      enableProgressiveLoading: true,
      imageQuality: 0.8,
      cacheStrategy: 'normal',
    },
    high: {
      level: 'high',
      telemetryResolution: 1, // Show all data points
      chartAnimations: true,
      chartQuality: 'high',
      maxConcurrentCharts: 8,
      enableProgressiveLoading: false,
      imageQuality: 0.9,
      cacheStrategy: 'normal',
    },
    ultra: {
      level: 'ultra',
      telemetryResolution: 1, // Show all data points
      chartAnimations: true,
      chartQuality: 'high',
      maxConcurrentCharts: 12,
      enableProgressiveLoading: false,
      imageQuality: 1.0,
      cacheStrategy: 'aggressive',
    },
  };

  return configs[level];
}

/**
 * Decimate telemetry data based on resolution factor
 */
export function decimateTelemetryData<T>(data: T[], factor: number): T[] {
  if (factor <= 1) return data;

  const result: T[] = [];
  for (let i = 0; i < data.length; i += factor) {
    result.push(data[i]);
  }

  // Always include the last point
  if (data.length > 0 && result[result.length - 1] !== data[data.length - 1]) {
    result.push(data[data.length - 1]);
  }

  return result;
}

/**
 * Progressive loading state machine
 */
export class ProgressiveLoader<T> {
  private data: T[];
  private chunkSize: number;
  private currentIndex: number = 0;
  private onChunkLoaded?: (chunk: T[], progress: number) => void;

  constructor(data: T[], chunkSize: number = 100) {
    this.data = data;
    this.chunkSize = chunkSize;
  }

  /**
   * Set callback for when a chunk is loaded
   */
  public onChunk(callback: (chunk: T[], progress: number) => void) {
    this.onChunkLoaded = callback;
  }

  /**
   * Load next chunk
   */
  public loadNext(): boolean {
    if (this.currentIndex >= this.data.length) {
      return false; // No more data
    }

    const endIndex = Math.min(this.currentIndex + this.chunkSize, this.data.length);
    const chunk = this.data.slice(this.currentIndex, endIndex);
    const progress = endIndex / this.data.length;

    this.currentIndex = endIndex;

    if (this.onChunkLoaded) {
      this.onChunkLoaded(chunk, progress);
    }

    return this.currentIndex < this.data.length;
  }

  /**
   * Load all remaining chunks
   */
  public async loadAll(delayMs: number = 0): Promise<void> {
    while (this.loadNext()) {
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  /**
   * Reset loader
   */
  public reset() {
    this.currentIndex = 0;
  }

  /**
   * Get progress (0-1)
   */
  public getProgress(): number {
    return this.data.length > 0 ? this.currentIndex / this.data.length : 1;
  }

  /**
   * Check if loading is complete
   */
  public isComplete(): boolean {
    return this.currentIndex >= this.data.length;
  }
}

/**
 * Monitor network changes and adjust performance
 */
export class NetworkMonitor {
  private listeners: Array<(speed: NetworkSpeed) => void> = [];
  private currentSpeed: NetworkSpeed = 'unknown';

  constructor() {
    this.currentSpeed = detectNetworkSpeed();
    this.attachListeners();
  }

  private attachListeners() {
    // Network Information API not in standard types
    const nav = navigator as any;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;

    if (connection) {
      connection.addEventListener('change', () => {
        const newSpeed = detectNetworkSpeed();
        if (newSpeed !== this.currentSpeed) {
          this.currentSpeed = newSpeed;
          this.notifyListeners(newSpeed);
        }
      });
    }
  }

  private notifyListeners(speed: NetworkSpeed) {
    this.listeners.forEach((listener) => listener(speed));
  }

  /**
   * Subscribe to network speed changes
   */
  public onChange(callback: (speed: NetworkSpeed) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  /**
   * Get current network speed
   */
  public getCurrentSpeed(): NetworkSpeed {
    return this.currentSpeed;
  }
}

/**
 * Estimate bandwidth by downloading a small resource
 */
export async function estimateBandwidth(testUrl?: string): Promise<number> {
  const url = testUrl || 'https://www.google.com/favicon.ico';
  const startTime = performance.now();

  try {
    const response = await fetch(url, { cache: 'no-store' });
    const blob = await response.blob();
    const endTime = performance.now();

    const durationSeconds = (endTime - startTime) / 1000;
    const sizeBytes = blob.size;
    const sizeMegabits = (sizeBytes * 8) / 1_000_000;
    const bandwidthMbps = sizeMegabits / durationSeconds;

    return bandwidthMbps;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Failed to estimate bandwidth:', error);
    }
    return 0;
  }
}

/**
 * Check if device has limited memory
 */
export function hasLimitedMemory(): boolean {
  // @ts-ignore - Device Memory API
  const deviceMemory = navigator.deviceMemory;

  if (deviceMemory !== undefined) {
    return deviceMemory < 4; // Less than 4GB RAM
  }

  return false;
}

/**
 * Get optimal chunk size for progressive loading based on performance
 */
export function getOptimalChunkSize(performanceLevel: PerformanceLevel): number {
  const chunkSizes: Record<PerformanceLevel, number> = {
    low: 50,
    medium: 100,
    high: 200,
    ultra: 500,
  };

  return chunkSizes[performanceLevel];
}
