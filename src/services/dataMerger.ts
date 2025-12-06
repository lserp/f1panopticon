import type { SessionData, DriverInfo, WeatherData, APIProvider, AppError } from '../types';
import { ErgastAPI, type SessionFilter } from './ergastApi';
import { OpenF1API } from './openf1Api';

export interface MergeOptions {
  primarySource?: APIProvider;
  fallbackSources?: APIProvider[];
  mergeStrategy?: 'prefer-primary' | 'merge-all' | 'most-complete';
}

export interface MergedSessionData extends SessionData {
  sources: APIProvider[];
  mergeMetadata: {
    primarySource: APIProvider;
    contributingSources: APIProvider[];
    mergedFields: string[];
  };
}

export class DataMerger {
  private ergastApi: ErgastAPI;
  private openf1Api: OpenF1API;

  constructor() {
    this.ergastApi = new ErgastAPI();
    this.openf1Api = new OpenF1API();
  }

  /**
   * Fetch session data from multiple sources and merge
   */
  async fetchAndMergeSession(
    season: number,
    round: number,
    options: MergeOptions = {}
  ): Promise<MergedSessionData> {
    const {
      primarySource = 'openf1',
      fallbackSources = ['ergast'],
      mergeStrategy = 'merge-all',
    } = options;

    const sessionDataMap = new Map<APIProvider, SessionData>();
    const errors = new Map<APIProvider, AppError>();

    // Try primary source first
    try {
      const primaryData = await this.fetchFromSource(primarySource, season, round);
      if (primaryData) {
        sessionDataMap.set(primarySource, primaryData);
      }
    } catch (error) {
      errors.set(primarySource, error as AppError);
      if (import.meta.env.DEV) {
        console.warn(`Primary source ${primarySource} failed:`, error);
      }
    }

    // Try fallback sources
    for (const source of fallbackSources) {
      try {
        const fallbackData = await this.fetchFromSource(source, season, round);
        if (fallbackData) {
          sessionDataMap.set(source, fallbackData);
        }
      } catch (error) {
        errors.set(source, error as AppError);
        if (import.meta.env.DEV) {
          console.warn(`Fallback source ${source} failed:`, error);
        }
      }
    }

    // If no data was fetched, throw error
    if (sessionDataMap.size === 0) {
      throw {
        type: 'API_CONNECTION_ERROR',
        message: 'Failed to fetch data from all sources',
        details: { errors: Array.from(errors.entries()) },
        timestamp: new Date(),
        recoverable: true,
        retryable: true,
      } as AppError;
    }

    // Merge the data
    return this.mergeSessions(Array.from(sessionDataMap.values()), primarySource, mergeStrategy);
  }

  /**
   * Fetch session data from a specific source
   */
  private async fetchFromSource(
    source: APIProvider,
    season: number,
    round: number
  ): Promise<SessionData | null> {
    switch (source) {
      case 'ergast': {
        const filter: SessionFilter = { season, round };
        const sessions = await this.ergastApi.listSessions(filter);
        return sessions.length > 0 ? sessions[0] : null;
      }

      case 'openf1': {
        const sessions = await this.openf1Api.fetchSessions(season);
        // Find the session matching the round (approximate)
        return sessions.length > 0 ? sessions[0] : null;
      }

      case 'fastf1':
        // FastF1 would require Python backend
        if (import.meta.env.DEV) {
          console.warn('FastF1 source not implemented in browser');
        }
        return null;

      default:
        return null;
    }
  }

  /**
   * Merge multiple session data objects
   */
  private mergeSessions(
    sessions: SessionData[],
    primarySource: APIProvider,
    strategy: 'prefer-primary' | 'merge-all' | 'most-complete'
  ): MergedSessionData {
    if (sessions.length === 0) {
      throw new Error('No sessions to merge');
    }

    if (sessions.length === 1) {
      return {
        ...sessions[0],
        sources: [sessions[0].source],
        mergeMetadata: {
          primarySource: sessions[0].source,
          contributingSources: [sessions[0].source],
          mergedFields: [],
        },
      };
    }

    // Find primary session
    const primarySession = sessions.find((s) => s.source === primarySource) || sessions[0];

    // Start with primary session as base
    const merged: MergedSessionData = {
      ...primarySession,
      sources: sessions.map((s) => s.source),
      mergeMetadata: {
        primarySource: primarySession.source,
        contributingSources: sessions.map((s) => s.source),
        mergedFields: [],
      },
    };

    // Merge based on strategy
    switch (strategy) {
      case 'prefer-primary':
        // Already using primary, just add sources metadata
        break;

      case 'merge-all':
        merged.drivers = this.mergeDrivers(sessions.map((s) => s.drivers));
        merged.laps = this.mergeLaps(sessions.map((s) => s.laps));
        merged.weather = this.mergeWeather(sessions.map((s) => s.weather));
        merged.mergeMetadata.mergedFields = ['drivers', 'laps', 'weather'];
        break;

      case 'most-complete':
        // Choose the most complete data for each field
        const mostCompleteLaps = this.getMostCompleteLaps(sessions);
        const mostCompleteDrivers = this.getMostCompleteDrivers(sessions);
        const mostCompleteWeather = this.getMostCompleteWeather(sessions);

        merged.laps = mostCompleteLaps;
        merged.drivers = mostCompleteDrivers;
        merged.weather = mostCompleteWeather;
        merged.mergeMetadata.mergedFields = ['drivers', 'laps', 'weather'];
        break;
    }

    return merged;
  }

  /**
   * Merge driver lists from multiple sources
   */
  private mergeDrivers(driverLists: DriverInfo[][]): DriverInfo[] {
    const driverMap = new Map<string, DriverInfo>();

    for (const drivers of driverLists) {
      for (const driver of drivers) {
        const existing = driverMap.get(driver.id);
        if (!existing) {
          driverMap.set(driver.id, driver);
        } else {
          // Merge driver info, preferring non-empty values
          driverMap.set(driver.id, {
            id: driver.id,
            code: driver.code || existing.code,
            number: driver.number || existing.number,
            firstName: driver.firstName || existing.firstName,
            lastName: driver.lastName || existing.lastName,
            team: driver.team !== 'Unknown' ? driver.team : existing.team,
          });
        }
      }
    }

    return Array.from(driverMap.values());
  }

  /**
   * Merge lap lists from multiple sources
   */
  private mergeLaps(lapLists: any[][]): any[] {
    const lapMap = new Map<string, any>();

    for (const laps of lapLists) {
      for (const lap of laps) {
        const key = `${lap.driverId}-${lap.lapNumber}`;
        const existing = lapMap.get(key);

        if (!existing) {
          lapMap.set(key, lap);
        } else {
          // Merge lap data, preferring non-zero values
          lapMap.set(key, {
            ...existing,
            lapTime: lap.lapTime || existing.lapTime,
            sector1Time: lap.sector1Time || existing.sector1Time,
            sector2Time: lap.sector2Time || existing.sector2Time,
            sector3Time: lap.sector3Time || existing.sector3Time,
            tireCompound: lap.tireCompound !== 'unknown' ? lap.tireCompound : existing.tireCompound,
            tireAge: lap.tireAge || existing.tireAge,
          });
        }
      }
    }

    return Array.from(lapMap.values());
  }

  /**
   * Merge weather data from multiple sources
   */
  private mergeWeather(weatherList: WeatherData[]): WeatherData {
    // Prefer non-zero values
    const merged: WeatherData = {
      airTemp: 0,
      trackTemp: 0,
      humidity: 0,
      pressure: 0,
      windSpeed: 0,
      windDirection: 0,
      rainfall: false,
    };

    for (const weather of weatherList) {
      merged.airTemp = weather.airTemp || merged.airTemp;
      merged.trackTemp = weather.trackTemp || merged.trackTemp;
      merged.humidity = weather.humidity || merged.humidity;
      merged.pressure = weather.pressure || merged.pressure;
      merged.windSpeed = weather.windSpeed || merged.windSpeed;
      merged.windDirection = weather.windDirection || merged.windDirection;
      merged.rainfall = weather.rainfall || merged.rainfall;
    }

    return merged;
  }

  /**
   * Get the most complete lap data from sessions
   */
  private getMostCompleteLaps(sessions: SessionData[]): any[] {
    let mostComplete: any[] = [];
    let maxCompleteness = 0;

    for (const session of sessions) {
      const completeness = this.calculateLapCompleteness(session.laps);
      if (completeness > maxCompleteness) {
        maxCompleteness = completeness;
        mostComplete = session.laps;
      }
    }

    return mostComplete;
  }

  /**
   * Get the most complete driver data from sessions
   */
  private getMostCompleteDrivers(sessions: SessionData[]): DriverInfo[] {
    let mostComplete: DriverInfo[] = [];
    let maxCompleteness = 0;

    for (const session of sessions) {
      const completeness = this.calculateDriverCompleteness(session.drivers);
      if (completeness > maxCompleteness) {
        maxCompleteness = completeness;
        mostComplete = session.drivers;
      }
    }

    return mostComplete;
  }

  /**
   * Get the most complete weather data from sessions
   */
  private getMostCompleteWeather(sessions: SessionData[]): WeatherData {
    let mostComplete: WeatherData = sessions[0].weather;
    let maxCompleteness = 0;

    for (const session of sessions) {
      const completeness = this.calculateWeatherCompleteness(session.weather);
      if (completeness > maxCompleteness) {
        maxCompleteness = completeness;
        mostComplete = session.weather;
      }
    }

    return mostComplete;
  }

  /**
   * Calculate completeness score for lap data
   */
  private calculateLapCompleteness(laps: any[]): number {
    if (laps.length === 0) return 0;

    let score = laps.length * 10; // Base score for number of laps

    for (const lap of laps) {
      if (lap.lapTime > 0) score += 1;
      if (lap.sector1Time > 0) score += 1;
      if (lap.sector2Time > 0) score += 1;
      if (lap.sector3Time > 0) score += 1;
      if (lap.tireCompound !== 'unknown') score += 1;
    }

    return score;
  }

  /**
   * Calculate completeness score for driver data
   */
  private calculateDriverCompleteness(drivers: DriverInfo[]): number {
    if (drivers.length === 0) return 0;

    let score = drivers.length * 10;

    for (const driver of drivers) {
      if (driver.code) score += 1;
      if (driver.number > 0) score += 1;
      if (driver.firstName) score += 1;
      if (driver.lastName) score += 1;
      if (driver.team !== 'Unknown') score += 1;
    }

    return score;
  }

  /**
   * Calculate completeness score for weather data
   */
  private calculateWeatherCompleteness(weather: WeatherData): number {
    let score = 0;

    if (weather.airTemp > 0) score += 1;
    if (weather.trackTemp > 0) score += 1;
    if (weather.humidity > 0) score += 1;
    if (weather.pressure > 0) score += 1;
    if (weather.windSpeed > 0) score += 1;
    if (weather.windDirection > 0) score += 1;

    return score;
  }

  /**
   * Get Ergast API instance
   */
  getErgastApi(): ErgastAPI {
    return this.ergastApi;
  }

  /**
   * Get OpenF1 API instance
   */
  getOpenF1Api(): OpenF1API {
    return this.openf1Api;
  }
}

// Export a singleton instance for convenience
export const dataMerger = new DataMerger();
