import { APIClient } from './apiClient';
import type { ApiCredentials } from '../store/types';
import type { TelemetryData } from '../types';

export interface PremiumDataConfig {
  updateInterval: number; // milliseconds
  enableExtendedChannels: boolean;
  maxConcurrentChannels: number;
}

export interface ExtendedTelemetryData extends TelemetryData {
  // Premium channels
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

export class PremiumAPIClient extends APIClient {
  private credentials: ApiCredentials;
  private premiumConfig: PremiumDataConfig;

  constructor(
    baseURL: string,
    credentials: ApiCredentials,
    premiumConfig?: Partial<PremiumDataConfig>
  ) {
    // Adjust rate limits based on premium tier
    const rateLimitConfig = credentials.premiumTier
      ? {
          maxRequestsPerSecond: 10, // Higher rate for premium
          maxRequestsPerHour: 1000,
        }
      : {
          maxRequestsPerSecond: 4,
          maxRequestsPerHour: 200,
        };

    super(baseURL, rateLimitConfig);

    this.credentials = credentials;
    this.premiumConfig = {
      updateInterval: credentials.premiumTier ? 2000 : 10000, // 2s vs 10s
      enableExtendedChannels: credentials.premiumTier,
      maxConcurrentChannels: credentials.premiumTier ? 12 : 6,
      ...premiumConfig,
    };
  }

  /**
   * Get the update interval based on tier
   */
  public getUpdateInterval(): number {
    return this.premiumConfig.updateInterval;
  }

  /**
   * Check if extended telemetry channels are available
   */
  public hasExtendedChannels(): boolean {
    return this.premiumConfig.enableExtendedChannels;
  }

  /**
   * Get maximum concurrent channels allowed
   */
  public getMaxConcurrentChannels(): number {
    return this.premiumConfig.maxConcurrentChannels;
  }

  /**
   * Fetch telemetry data with premium channels if available
   */
  public async fetchTelemetryData(
    sessionId: string,
    driverId: string,
    lapNumber: number
  ): Promise<TelemetryData | ExtendedTelemetryData> {
    const config = {
      url: `/telemetry/${sessionId}/${driverId}/${lapNumber}`,
      params: {
        extended: this.premiumConfig.enableExtendedChannels,
      },
      headers: this.getAuthHeaders(),
    };

    const response = await this.get<TelemetryData | ExtendedTelemetryData>(config.url, {
      params: config.params,
      headers: config.headers,
    });

    return response.data;
  }

  /**
   * Fetch live session data with premium update frequency
   */
  public async fetchLiveSessionData(sessionId: string): Promise<any> {
    const config = {
      url: `/live/${sessionId}`,
      headers: this.getAuthHeaders(),
    };

    const response = await this.get(config.url, {
      headers: config.headers,
    });

    return response.data;
  }

  /**
   * Start polling for live data with appropriate interval
   */
  public startLiveDataPolling(
    sessionId: string,
    callback: (data: any) => void,
    onError?: (error: Error) => void
  ): () => void {
    let isPolling = true;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const poll = async () => {
      if (!isPolling) return;

      try {
        const data = await this.fetchLiveSessionData(sessionId);
        callback(data);
      } catch (error) {
        if (onError) {
          onError(error as Error);
        }
      }

      if (isPolling) {
        timeoutId = setTimeout(poll, this.premiumConfig.updateInterval);
      }
    };

    // Start polling
    poll();

    // Return cleanup function
    return () => {
      isPolling = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }

  /**
   * Get authentication headers for premium API requests
   */
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    if (this.credentials.fastf1ApiKey) {
      headers['X-FastF1-API-Key'] = this.credentials.fastf1ApiKey;
    }

    if (this.credentials.openf1ApiKey) {
      headers['X-OpenF1-API-Key'] = this.credentials.openf1ApiKey;
    }

    return headers;
  }

  /**
   * Get premium configuration
   */
  public getPremiumConfig(): PremiumDataConfig {
    return { ...this.premiumConfig };
  }

  /**
   * Check if user has premium access
   */
  public isPremium(): boolean {
    return this.credentials.premiumTier;
  }

  /**
   * Update credentials (useful when user adds/removes API keys)
   */
  public updateCredentials(credentials: ApiCredentials): void {
    this.credentials = credentials;
    this.premiumConfig = {
      ...this.premiumConfig,
      updateInterval: credentials.premiumTier ? 2000 : 10000,
      enableExtendedChannels: credentials.premiumTier,
      maxConcurrentChannels: credentials.premiumTier ? 12 : 6,
    };
  }
}

/**
 * Factory function to create a premium API client
 */
export function createPremiumAPIClient(
  baseURL: string,
  credentials: ApiCredentials,
  config?: Partial<PremiumDataConfig>
): PremiumAPIClient {
  return new PremiumAPIClient(baseURL, credentials, config);
}
