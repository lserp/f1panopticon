import { APIClient } from './apiClient';
import type { SessionData, DriverInfo, LapSummary, WeatherData, SessionType } from '../types';

// Ergast API response types
interface ErgastResponse<T> {
  MRData: {
    xmlns: string;
    series: string;
    url: string;
    limit: string;
    offset: string;
    total: string;
  } & T;
}

interface ErgastRaceTable {
  RaceTable: {
    season: string;
    Races: ErgastRace[];
  };
}

interface ErgastRace {
  season: string;
  round: string;
  raceName: string;
  Circuit: {
    circuitId: string;
    circuitName: string;
    Location: {
      lat: string;
      long: string;
      locality: string;
      country: string;
    };
  };
  date: string;
  time?: string;
  Results?: ErgastResult[];
  QualifyingResults?: ErgastQualifyingResult[];
  SprintResults?: ErgastResult[];
}

interface ErgastResult {
  number: string;
  position: string;
  positionText: string;
  points: string;
  Driver: ErgastDriver;
  Constructor: ErgastConstructor;
  grid: string;
  laps: string;
  status: string;
  Time?: {
    millis: string;
    time: string;
  };
  FastestLap?: {
    rank: string;
    lap: string;
    Time: {
      time: string;
    };
    AverageSpeed: {
      units: string;
      speed: string;
    };
  };
}

interface ErgastQualifyingResult {
  number: string;
  position: string;
  Driver: ErgastDriver;
  Constructor: ErgastConstructor;
  Q1?: string;
  Q2?: string;
  Q3?: string;
}

interface ErgastDriver {
  driverId: string;
  permanentNumber?: string;
  code?: string;
  givenName: string;
  familyName: string;
  dateOfBirth: string;
  nationality: string;
}

interface ErgastConstructor {
  constructorId: string;
  name: string;
  nationality: string;
}

interface ErgastLapTable {
  RaceTable: {
    season: string;
    round: string;
    Races: Array<{
      season: string;
      round: string;
      raceName: string;
      Circuit: {
        circuitId: string;
        circuitName: string;
      };
      date: string;
      Laps: ErgastLap[];
    }>;
  };
}

interface ErgastLap {
  number: string;
  Timings: ErgastTiming[];
}

interface ErgastTiming {
  driverId: string;
  position: string;
  time: string;
}

export interface SessionFilter {
  season?: number;
  round?: number;
  sessionType?: SessionType;
  driverId?: string;
  constructorId?: string;
  circuitId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export class ErgastAPI {
  private client: APIClient;
  // Using Ergast.com (back online) - Jolpi.ca has CORS issues
  private baseURL = 'https://ergast.com/api/f1';

  constructor() {
    // Ergast rate limits: 4 req/sec, 200/hour
    this.client = new APIClient(this.baseURL, {
      maxRequestsPerSecond: 4,
      maxRequestsPerHour: 200,
    });
  }

  /**
   * List sessions with optional filtering
   */
  async listSessions(filter: SessionFilter = {}): Promise<SessionData[]> {
    const sessions: SessionData[] = [];

    // Build URL based on filters
    let url = '';
    if (filter.season) {
      url += `/${filter.season}`;
      if (filter.round) {
        url += `/${filter.round}`;
      }
    } else {
      url += '/current';
    }

    // Add circuit filter if specified
    if (filter.circuitId) {
      url += `/circuits/${filter.circuitId}`;
    }

    // Add driver filter if specified
    if (filter.driverId) {
      url += `/drivers/${filter.driverId}`;
    }

    // Add constructor filter if specified
    if (filter.constructorId) {
      url += `/constructors/${filter.constructorId}`;
    }

    url += '.json?limit=100';

    try {
      const response = await this.client.get<ErgastResponse<ErgastRaceTable>>(url);
      const races = response.data.MRData.RaceTable.Races;

      for (const race of races) {
        const raceDate = new Date(race.date);

        // Apply date filters
        if (filter.dateFrom && raceDate < filter.dateFrom) continue;
        if (filter.dateTo && raceDate > filter.dateTo) continue;

        // Create session for race
        if (!filter.sessionType || filter.sessionType === 'race') {
          // Fetch full race results to get driver list
          const raceSession = await this.fetchRaceSession(
            parseInt(race.season),
            parseInt(race.round)
          );
          if (raceSession) {
            sessions.push(raceSession);
          } else {
            // Fallback to basic race data without drivers
            sessions.push(this.convertRaceToSession(race, 'race'));
          }
        }

        // Create session for qualifying (fetch separately if needed)
        if (!filter.sessionType || filter.sessionType === 'qualifying') {
          const qualifyingSession = await this.fetchQualifyingSession(
            parseInt(race.season),
            parseInt(race.round)
          );
          if (qualifyingSession) {
            sessions.push(qualifyingSession);
          }
        }

        // Sprint sessions (if available)
        if (!filter.sessionType || filter.sessionType === 'sprint') {
          const sprintSession = await this.fetchSprintSession(
            parseInt(race.season),
            parseInt(race.round)
          );
          if (sprintSession) {
            sessions.push(sprintSession);
          }
        }
      }

      return sessions;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching sessions from Ergast:', error);
      }
      throw error;
    }
  }

  /**
   * Fetch race session data with results
   */
  private async fetchRaceSession(season: number, round: number): Promise<SessionData | null> {
    try {
      const url = `/${season}/${round}/results.json`;
      const response = await this.client.get<ErgastResponse<ErgastRaceTable>>(url);

      const races = response.data.MRData.RaceTable.Races;
      if (races.length === 0) return null;

      return this.convertRaceToSession(races[0], 'race');
    } catch (error) {
      return null;
    }
  }

  /**
   * Fetch qualifying session data
   */
  private async fetchQualifyingSession(season: number, round: number): Promise<SessionData | null> {
    try {
      const url = `/${season}/${round}/qualifying.json`;
      const response = await this.client.get<ErgastResponse<ErgastRaceTable>>(url);

      const races = response.data.MRData.RaceTable.Races;
      if (races.length === 0) return null;

      return this.convertRaceToSession(races[0], 'qualifying');
    } catch (error) {
      return null;
    }
  }

  /**
   * Fetch sprint session data
   */
  private async fetchSprintSession(season: number, round: number): Promise<SessionData | null> {
    try {
      const url = `/${season}/${round}/sprint.json`;
      const response = await this.client.get<ErgastResponse<ErgastRaceTable>>(url);

      const races = response.data.MRData.RaceTable.Races;
      if (races.length === 0) return null;

      return this.convertRaceToSession(races[0], 'sprint');
    } catch (error) {
      return null;
    }
  }

  /**
   * Fetch driver information
   */
  async fetchDriverInfo(driverId: string): Promise<DriverInfo | null> {
    try {
      const url = `/drivers/${driverId}.json`;
      const response =
        await this.client.get<ErgastResponse<{ DriverTable: { Drivers: ErgastDriver[] } }>>(url);

      const drivers = response.data.MRData.DriverTable.Drivers;
      if (drivers.length === 0) return null;

      return this.convertErgastDriver(drivers[0]);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(`Error fetching driver ${driverId}:`, error);
      }
      return null;
    }
  }

  /**
   * Fetch constructor (team) information
   */
  async fetchConstructorInfo(constructorId: string): Promise<{ id: string; name: string } | null> {
    try {
      const url = `/constructors/${constructorId}.json`;
      const response = await this.client.get<
        ErgastResponse<{
          ConstructorTable: { Constructors: ErgastConstructor[] };
        }>
      >(url);

      const constructors = response.data.MRData.ConstructorTable.Constructors;
      if (constructors.length === 0) return null;

      return {
        id: constructors[0].constructorId,
        name: constructors[0].name,
      };
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(`Error fetching constructor ${constructorId}:`, error);
      }
      return null;
    }
  }

  /**
   * Fetch lap times for a specific session
   */
  async fetchLapTimes(season: number, round: number, driverId?: string): Promise<LapSummary[]> {
    try {
      let url = `/${season}/${round}/laps`;
      if (driverId) {
        url = `/${season}/${round}/drivers/${driverId}/laps`;
      }
      url += '.json?limit=1000';

      const response = await this.client.get<ErgastResponse<ErgastLapTable>>(url);

      const races = response.data.MRData.RaceTable.Races;
      if (races.length === 0 || !races[0].Laps) {
        return [];
      }

      const laps = races[0].Laps;
      const lapSummaries: LapSummary[] = [];

      for (const lap of laps) {
        const lapNumber = parseInt(lap.number);

        for (const timing of lap.Timings) {
          lapSummaries.push({
            lapNumber,
            driverId: timing.driverId,
            lapTime: this.parseTimeToSeconds(timing.time),
            sector1Time: 0, // Ergast doesn't provide sector times
            sector2Time: 0,
            sector3Time: 0,
            tireCompound: 'unknown',
            tireAge: 0,
          });
        }
      }

      return lapSummaries;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching lap times:', error);
      }
      throw error;
    }
  }

  /**
   * Convert Ergast race data to SessionData
   */
  private convertRaceToSession(race: ErgastRace, sessionType: SessionType): SessionData {
    const drivers: DriverInfo[] = [];
    const laps: LapSummary[] = [];

    // Extract drivers from results
    const results = race.Results || race.QualifyingResults || race.SprintResults || [];
    for (const result of results) {
      if ('Driver' in result) {
        drivers.push(this.convertErgastDriver(result.Driver, result.Constructor));
      }
    }

    return {
      id: `${race.season}-${race.round}-${sessionType}`,
      season: parseInt(race.season),
      round: parseInt(race.round),
      sessionType,
      circuitId: race.Circuit.circuitId,
      circuitName: race.Circuit.circuitName,
      date: new Date(race.date),
      weather: this.getDefaultWeather(),
      drivers,
      laps,
      source: 'ergast',
      fetchedAt: new Date(),
    };
  }

  /**
   * Convert Ergast driver to DriverInfo
   */
  private convertErgastDriver(driver: ErgastDriver, constructor?: ErgastConstructor): DriverInfo {
    return {
      id: driver.driverId,
      code: driver.code || driver.driverId.substring(0, 3).toUpperCase(),
      number: parseInt(driver.permanentNumber || '0'),
      firstName: driver.givenName,
      lastName: driver.familyName,
      team: constructor?.name || 'Unknown',
    };
  }

  /**
   * Parse time string (e.g., "1:23.456") to seconds
   */
  private parseTimeToSeconds(timeStr: string): number {
    const parts = timeStr.split(':');
    if (parts.length === 2) {
      const minutes = parseInt(parts[0]);
      const seconds = parseFloat(parts[1]);
      return minutes * 60 + seconds;
    }
    return parseFloat(timeStr);
  }

  /**
   * Get default weather data (Ergast doesn't provide weather)
   */
  private getDefaultWeather(): WeatherData {
    return {
      airTemp: 0,
      trackTemp: 0,
      humidity: 0,
      pressure: 0,
      windSpeed: 0,
      windDirection: 0,
      rainfall: false,
    };
  }

  /**
   * Get rate limit status
   */
  getRateLimitStatus() {
    return this.client.getRateLimitStatus();
  }
}

// Export a singleton instance for convenience
export const ergastApi = new ErgastAPI();
