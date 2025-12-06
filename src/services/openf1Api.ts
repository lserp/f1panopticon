import { APIClient } from './apiClient';
import type {
  SessionData,
  LapData,
  TelemetryData,
  DriverInfo,
  WeatherData,
  SessionType,
} from '../types';

// OpenF1 API response types
interface OpenF1Session {
  session_key: number;
  session_name: string;
  date_start: string;
  date_end: string;
  gmt_offset: string;
  session_type: string;
  meeting_key: number;
  location: string;
  country_name: string;
  circuit_key: number;
  circuit_short_name: string;
  year: number;
}

interface OpenF1Driver {
  driver_number: number;
  broadcast_name: string;
  full_name: string;
  name_acronym: string;
  team_name: string;
  team_colour: string;
  first_name: string;
  last_name: string;
  headshot_url: string;
  country_code: string;
  session_key: number;
}

interface OpenF1CarData {
  date: string;
  driver_number: number;
  meeting_key: number;
  session_key: number;
  speed: number;
  rpm: number;
  n_gear: number;
  throttle: number;
  brake: number;
  drs: number;
}

interface OpenF1Location {
  date: string;
  driver_number: number;
  meeting_key: number;
  session_key: number;
  x: number;
  y: number;
  z: number;
}

// interface OpenF1Position {
//   date: string;
//   driver_number: number;
//   meeting_key: number;
//   session_key: number;
//   position: number;
// }

interface OpenF1Lap {
  date_start: string;
  driver_number: number;
  duration_sector_1: number;
  duration_sector_2: number;
  duration_sector_3: number;
  i1_speed: number;
  i2_speed: number;
  is_pit_out_lap: boolean;
  lap_duration: number;
  lap_number: number;
  meeting_key: number;
  segments_sector_1: number[];
  segments_sector_2: number[];
  segments_sector_3: number[];
  session_key: number;
  st_speed: number;
}

interface OpenF1Weather {
  air_temperature: number;
  date: string;
  humidity: number;
  meeting_key: number;
  pressure: number;
  rainfall: number;
  session_key: number;
  track_temperature: number;
  wind_direction: number;
  wind_speed: number;
}

export interface LiveSessionOptions {
  sessionKey: number;
  pollingIntervalMs?: number;
}

export class OpenF1API {
  private client: APIClient;
  private baseURL = 'https://api.openf1.org/v1';
  private pollingIntervals: Map<number, ReturnType<typeof setInterval>> = new Map();

  constructor() {
    // OpenF1 has generous rate limits (when available)
    this.client = new APIClient(this.baseURL, {
      maxRequestsPerSecond: 10,
      maxRequestsPerHour: 1000,
    });
  }

  /**
   * Fetch available sessions
   */
  async fetchSessions(year?: number, sessionType?: string): Promise<SessionData[]> {
    try {
      let url = '/sessions';
      const params: string[] = [];

      if (year) {
        params.push(`year=${year}`);
      }
      if (sessionType) {
        params.push(`session_type=${sessionType}`);
      }

      if (params.length > 0) {
        url += '?' + params.join('&');
      }

      const response = await this.client.get<OpenF1Session[]>(url);
      const sessions = response.data;

      return sessions.map((session) => this.convertOpenF1Session(session));
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching sessions from OpenF1:', error);
      }
      throw error;
    }
  }

  /**
   * Fetch drivers for a specific session
   */
  async fetchDrivers(sessionKey: number): Promise<DriverInfo[]> {
    try {
      const url = `/drivers?session_key=${sessionKey}`;
      const response = await this.client.get<OpenF1Driver[]>(url);

      return response.data.map((driver) => this.convertOpenF1Driver(driver));
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching drivers from OpenF1:', error);
      }
      throw error;
    }
  }

  /**
   * Fetch telemetry data for a specific driver and lap
   */
  async fetchTelemetry(
    sessionKey: number,
    driverNumber: number,
    lapNumber?: number
  ): Promise<TelemetryData> {
    try {
      let carDataUrl = `/car_data?session_key=${sessionKey}&driver_number=${driverNumber}`;
      let locationUrl = `/location?session_key=${sessionKey}&driver_number=${driverNumber}`;
      let startDate: Date | null = null;
      let endDate: Date | null = null;

      if (lapNumber !== undefined) {
        // We need to fetch lap timing to get the time range
        const lapUrl = `/laps?session_key=${sessionKey}&driver_number=${driverNumber}&lap_number=${lapNumber}`;
        const lapResponse = await this.client.get<OpenF1Lap[]>(lapUrl);

        if (lapResponse.data.length > 0) {
          const lap = lapResponse.data[0];
          startDate = new Date(lap.date_start);
          endDate = new Date(startDate.getTime() + lap.lap_duration * 1000);

          const startISO = startDate.toISOString();
          const endISO = endDate.toISOString();
          carDataUrl += `&date>=${startISO}&date<=${endISO}`;
          locationUrl += `&date>=${startISO}&date<=${endISO}`;
        }
      }

      // Fetch both car data and location data
      const [carDataResponse, locationResponse] = await Promise.all([
        this.client.get<OpenF1CarData[]>(carDataUrl),
        this.client.get<OpenF1Location[]>(locationUrl),
      ]);

      return this.convertToTelemetryDataWithDistance(
        carDataResponse.data,
        locationResponse.data
      );
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching telemetry from OpenF1:', error);
      }
      throw error;
    }
  }

  /**
   * Fetch lap information (without telemetry) for a session
   */
  async fetchLaps(sessionKey: number, driverNumber?: number): Promise<OpenF1Lap[]> {
    try {
      let url = `/laps?session_key=${sessionKey}`;
      if (driverNumber !== undefined) {
        url += `&driver_number=${driverNumber}`;
      }

      const response = await this.client.get<OpenF1Lap[]>(url);
      return response.data;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching laps from OpenF1:', error);
      }
      throw error;
    }
  }

  /**
   * Fetch lap data for a session (with telemetry - expensive!)
   */
  async fetchLapData(sessionKey: number, driverNumber?: number): Promise<LapData[]> {
    try {
      let url = `/laps?session_key=${sessionKey}`;
      if (driverNumber !== undefined) {
        url += `&driver_number=${driverNumber}`;
      }

      const response = await this.client.get<OpenF1Lap[]>(url);
      const laps = response.data;

      const lapDataPromises = laps.map(async (lap) => {
        // Fetch telemetry for this lap
        const telemetry = await this.fetchTelemetry(sessionKey, lap.driver_number, lap.lap_number);

        return {
          sessionId: `openf1-${sessionKey}`,
          driverId: lap.driver_number.toString(),
          lapNumber: lap.lap_number,
          lapTime: lap.lap_duration,
          sector1Time: lap.duration_sector_1 || 0,
          sector2Time: lap.duration_sector_2 || 0,
          sector3Time: lap.duration_sector_3 || 0,
          telemetry,
          tireCompound: 'unknown',
          tireAge: 0,
          fuelLoad: 0,
          trackStatus: 'green' as const,
        };
      });

      return Promise.all(lapDataPromises);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching lap data from OpenF1:', error);
      }
      throw error;
    }
  }

  /**
   * Fetch weather data for a session
   */
  async fetchWeather(sessionKey: number): Promise<WeatherData> {
    try {
      const url = `/weather?session_key=${sessionKey}`;
      const response = await this.client.get<OpenF1Weather[]>(url);

      if (response.data.length === 0) {
        return this.getDefaultWeather();
      }

      // Get the most recent weather data
      const weather = response.data[response.data.length - 1];

      return {
        airTemp: weather.air_temperature,
        trackTemp: weather.track_temperature,
        humidity: weather.humidity,
        pressure: weather.pressure,
        windSpeed: weather.wind_speed,
        windDirection: weather.wind_direction,
        rainfall: weather.rainfall > 0,
      };
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching weather from OpenF1:', error);
      }
      return this.getDefaultWeather();
    }
  }

  /**
   * Start polling for live session data
   */
  startLiveDataPolling(
    sessionKey: number,
    callback: (data: OpenF1CarData[]) => void,
    intervalMs: number = 2000
  ): void {
    // Stop existing polling for this session if any
    this.stopLiveDataPolling(sessionKey);

    const poll = async () => {
      try {
        // Fetch data from the last 5 seconds
        const fiveSecondsAgo = new Date(Date.now() - 5000);
        const url = `/car_data?session_key=${sessionKey}&date>=${fiveSecondsAgo.toISOString()}`;

        const response = await this.client.get<OpenF1CarData[]>(url);
        callback(response.data);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Error polling live data:', error);
        }
      }
    };

    // Initial poll
    poll();

    // Set up interval
    const interval = setInterval(poll, intervalMs);
    this.pollingIntervals.set(sessionKey, interval);
  }

  /**
   * Stop polling for live session data
   */
  stopLiveDataPolling(sessionKey: number): void {
    const interval = this.pollingIntervals.get(sessionKey);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(sessionKey);
    }
  }

  /**
   * Stop all polling
   */
  stopAllPolling(): void {
    for (const interval of this.pollingIntervals.values()) {
      clearInterval(interval);
    }
    this.pollingIntervals.clear();
  }

  /**
   * Convert OpenF1 session to SessionData
   */
  private convertOpenF1Session(session: OpenF1Session): SessionData {
    return {
      id: `openf1-${session.session_key}`,
      season: session.year,
      round: session.meeting_key,
      sessionType: this.mapSessionType(session.session_type),
      circuitId: session.circuit_short_name.toLowerCase().replace(/\s+/g, '_'),
      circuitName: session.location,
      date: new Date(session.date_start),
      weather: this.getDefaultWeather(),
      drivers: [],
      laps: [],
      source: 'openf1',
      fetchedAt: new Date(),
    };
  }

  /**
   * Convert OpenF1 driver to DriverInfo
   */
  private convertOpenF1Driver(driver: OpenF1Driver): DriverInfo {
    return {
      id: driver.driver_number.toString(),
      code: driver.name_acronym,
      number: driver.driver_number,
      firstName: driver.first_name,
      lastName: driver.last_name,
      team: driver.team_name,
    };
  }

  /**
   * Convert OpenF1 car data to TelemetryData with distance calculation
   */
  private convertToTelemetryDataWithDistance(
    carData: OpenF1CarData[],
    locationData: OpenF1Location[]
  ): TelemetryData {
    const telemetry: TelemetryData = {
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

    // Sort both datasets by date
    const sortedCarData = [...carData].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const sortedLocationData = [...locationData].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    if (sortedCarData.length === 0) return telemetry;

    const startTime = new Date(sortedCarData[0].date);

    // Calculate cumulative distance from location data
    let cumulativeDistance = 0;
    const locationWithDistance: Array<{ date: Date; distance: number; x: number; y: number }> = [];

    for (let i = 0; i < sortedLocationData.length; i++) {
      const loc = sortedLocationData[i];
      
      if (i > 0) {
        const prevLoc = sortedLocationData[i - 1];
        const dx = loc.x - prevLoc.x;
        const dy = loc.y - prevLoc.y;
        const segmentDistance = Math.sqrt(dx * dx + dy * dy);
        cumulativeDistance += segmentDistance;
      }

      locationWithDistance.push({
        date: new Date(loc.date),
        distance: cumulativeDistance,
        x: loc.x,
        y: loc.y,
      });
    }

    // Merge car data with distance by interpolating based on timestamp
    for (const data of sortedCarData) {
      const timestamp = new Date(data.date);
      const timeSeconds = (timestamp.getTime() - startTime.getTime()) / 1000;

      // Find closest location data points
      let distance = 0;
      if (locationWithDistance.length > 0) {
        // Binary search for closest timestamp
        let left = 0;
        let right = locationWithDistance.length - 1;
        
        while (left < right) {
          const mid = Math.floor((left + right) / 2);
          if (locationWithDistance[mid].date.getTime() < timestamp.getTime()) {
            left = mid + 1;
          } else {
            right = mid;
          }
        }

        // Interpolate distance
        if (left === 0) {
          distance = locationWithDistance[0].distance;
        } else if (left >= locationWithDistance.length) {
          distance = locationWithDistance[locationWithDistance.length - 1].distance;
        } else {
          const before = locationWithDistance[left - 1];
          const after = locationWithDistance[left];
          const timeDiff = after.date.getTime() - before.date.getTime();
          const timeOffset = timestamp.getTime() - before.date.getTime();
          const ratio = timeDiff > 0 ? timeOffset / timeDiff : 0;
          distance = before.distance + (after.distance - before.distance) * ratio;
        }
      }

      telemetry.time.push(timeSeconds);
      telemetry.distance.push(distance);
      telemetry.speed.push(data.speed || 0);
      telemetry.throttle.push(data.throttle || 0);
      telemetry.brake.push(data.brake ? 100 : 0);
      telemetry.gear.push(data.n_gear || 0);
      telemetry.rpm.push(data.rpm || 0);
      telemetry.drs.push(data.drs || 0);
      telemetry.nGear.push(data.n_gear || 0);
    }

    return telemetry;
  }



  /**
   * Map OpenF1 session type to our SessionType
   */
  private mapSessionType(sessionType: string): SessionType {
    const type = sessionType.toLowerCase();
    if (type.includes('race')) return 'race';
    if (type.includes('qualifying')) return 'qualifying';
    if (type.includes('sprint')) return 'sprint';
    return 'practice';
  }

  /**
   * Get default weather data
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
export const openf1Api = new OpenF1API();
