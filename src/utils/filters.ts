import type { SessionData, LapData, LapSummary, SessionType, AppError } from '../types';

/**
 * Session filter criteria
 */
export interface SessionFilterCriteria {
  season?: number;
  race?: number; // round number
  sessionType?: SessionType;
  driver?: string; // driver ID
  dateFrom?: Date;
  dateTo?: Date;
  circuitId?: string;
}

/**
 * Performance metrics filter criteria
 */
export interface PerformanceFilterCriteria {
  sector?: number; // 1, 2, or 3
  tireCompound?: string;
  fuelLoadMin?: number;
  fuelLoadMax?: number;
  lapNumberMin?: number;
  lapNumberMax?: number;
}

/**
 * Filter validation error
 */
export class FilterValidationError extends Error implements AppError {
  type: 'DATA_VALIDATION_ERROR' = 'DATA_VALIDATION_ERROR';
  details?: unknown;
  timestamp: Date;
  recoverable = true;
  retryable = false;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = 'FilterValidationError';
    this.details = details;
    this.timestamp = new Date();
  }
}

/**
 * Validate session filter criteria
 */
export function validateSessionFilter(filter: SessionFilterCriteria): void {
  if (filter.season !== undefined) {
    if (
      !Number.isInteger(filter.season) ||
      filter.season < 1950 ||
      filter.season > new Date().getFullYear() + 1
    ) {
      throw new FilterValidationError(
        `Invalid season: ${filter.season}. Must be between 1950 and ${new Date().getFullYear() + 1}`,
        { field: 'season', value: filter.season }
      );
    }
  }

  if (filter.race !== undefined) {
    if (!Number.isInteger(filter.race) || filter.race < 1 || filter.race > 30) {
      throw new FilterValidationError(
        `Invalid race number: ${filter.race}. Must be between 1 and 30`,
        { field: 'race', value: filter.race }
      );
    }
  }

  if (filter.sessionType !== undefined) {
    const validTypes: SessionType[] = ['practice', 'qualifying', 'race', 'sprint'];
    if (!validTypes.includes(filter.sessionType)) {
      throw new FilterValidationError(
        `Invalid session type: ${filter.sessionType}. Must be one of: ${validTypes.join(', ')}`,
        { field: 'sessionType', value: filter.sessionType }
      );
    }
  }

  if (filter.dateFrom !== undefined) {
    if (!(filter.dateFrom instanceof Date)) {
      throw new FilterValidationError('Invalid dateFrom: must be a Date object', {
        field: 'dateFrom',
        value: filter.dateFrom,
      });
    }
    if (Number.isNaN(filter.dateFrom.getTime())) {
      throw new FilterValidationError('Invalid dateFrom: must be a valid Date', {
        field: 'dateFrom',
        value: filter.dateFrom,
      });
    }
  }

  if (filter.dateTo !== undefined) {
    if (!(filter.dateTo instanceof Date)) {
      throw new FilterValidationError('Invalid dateTo: must be a Date object', {
        field: 'dateTo',
        value: filter.dateTo,
      });
    }
    if (Number.isNaN(filter.dateTo.getTime())) {
      throw new FilterValidationError('Invalid dateTo: must be a valid Date', {
        field: 'dateTo',
        value: filter.dateTo,
      });
    }
  }

  if (filter.dateFrom && filter.dateTo && filter.dateFrom > filter.dateTo) {
    throw new FilterValidationError(
      'Invalid date range: dateFrom must be before or equal to dateTo',
      { dateFrom: filter.dateFrom, dateTo: filter.dateTo }
    );
  }

  if (filter.driver !== undefined && typeof filter.driver !== 'string') {
    throw new FilterValidationError('Invalid driver: must be a string', {
      field: 'driver',
      value: filter.driver,
    });
  }

  if (filter.circuitId !== undefined && typeof filter.circuitId !== 'string') {
    throw new FilterValidationError('Invalid circuitId: must be a string', {
      field: 'circuitId',
      value: filter.circuitId,
    });
  }
}

/**
 * Validate performance filter criteria
 */
export function validatePerformanceFilter(filter: PerformanceFilterCriteria): void {
  if (filter.sector !== undefined) {
    if (!Number.isInteger(filter.sector) || filter.sector < 1 || filter.sector > 3) {
      throw new FilterValidationError(`Invalid sector: ${filter.sector}. Must be 1, 2, or 3`, {
        field: 'sector',
        value: filter.sector,
      });
    }
  }

  if (filter.tireCompound !== undefined && typeof filter.tireCompound !== 'string') {
    throw new FilterValidationError('Invalid tireCompound: must be a string', {
      field: 'tireCompound',
      value: filter.tireCompound,
    });
  }

  if (filter.fuelLoadMin !== undefined) {
    if (
      typeof filter.fuelLoadMin !== 'number' ||
      filter.fuelLoadMin < 0 ||
      filter.fuelLoadMin > 110
    ) {
      throw new FilterValidationError(
        `Invalid fuelLoadMin: ${filter.fuelLoadMin}. Must be between 0 and 110`,
        { field: 'fuelLoadMin', value: filter.fuelLoadMin }
      );
    }
  }

  if (filter.fuelLoadMax !== undefined) {
    if (
      typeof filter.fuelLoadMax !== 'number' ||
      filter.fuelLoadMax < 0 ||
      filter.fuelLoadMax > 110
    ) {
      throw new FilterValidationError(
        `Invalid fuelLoadMax: ${filter.fuelLoadMax}. Must be between 0 and 110`,
        { field: 'fuelLoadMax', value: filter.fuelLoadMax }
      );
    }
  }

  if (
    filter.fuelLoadMin !== undefined &&
    filter.fuelLoadMax !== undefined &&
    filter.fuelLoadMin > filter.fuelLoadMax
  ) {
    throw new FilterValidationError(
      'Invalid fuel load range: fuelLoadMin must be less than or equal to fuelLoadMax',
      { fuelLoadMin: filter.fuelLoadMin, fuelLoadMax: filter.fuelLoadMax }
    );
  }

  if (filter.lapNumberMin !== undefined) {
    if (!Number.isInteger(filter.lapNumberMin) || filter.lapNumberMin < 1) {
      throw new FilterValidationError(
        `Invalid lapNumberMin: ${filter.lapNumberMin}. Must be a positive integer`,
        { field: 'lapNumberMin', value: filter.lapNumberMin }
      );
    }
  }

  if (filter.lapNumberMax !== undefined) {
    if (!Number.isInteger(filter.lapNumberMax) || filter.lapNumberMax < 1) {
      throw new FilterValidationError(
        `Invalid lapNumberMax: ${filter.lapNumberMax}. Must be a positive integer`,
        { field: 'lapNumberMax', value: filter.lapNumberMax }
      );
    }
  }

  if (
    filter.lapNumberMin !== undefined &&
    filter.lapNumberMax !== undefined &&
    filter.lapNumberMin > filter.lapNumberMax
  ) {
    throw new FilterValidationError(
      'Invalid lap number range: lapNumberMin must be less than or equal to lapNumberMax',
      { lapNumberMin: filter.lapNumberMin, lapNumberMax: filter.lapNumberMax }
    );
  }
}

/**
 * Filter sessions based on criteria
 */
export function filterSessions(
  sessions: SessionData[],
  filter: SessionFilterCriteria
): SessionData[] {
  // Validate filter first
  validateSessionFilter(filter);

  return sessions.filter((session) => {
    // Filter by season
    if (filter.season !== undefined && session.season !== filter.season) {
      return false;
    }

    // Filter by race (round)
    if (filter.race !== undefined && session.round !== filter.race) {
      return false;
    }

    // Filter by session type
    if (filter.sessionType !== undefined && session.sessionType !== filter.sessionType) {
      return false;
    }

    // Filter by driver
    if (filter.driver !== undefined) {
      const hasDriver = session.drivers.some((driver) => driver.id === filter.driver);
      if (!hasDriver) {
        return false;
      }
    }

    // Filter by date range (skip sessions with invalid dates)
    if (filter.dateFrom !== undefined) {
      if (Number.isNaN(session.date.getTime()) || session.date < filter.dateFrom) {
        return false;
      }
    }

    if (filter.dateTo !== undefined) {
      if (Number.isNaN(session.date.getTime()) || session.date > filter.dateTo) {
        return false;
      }
    }

    // Filter by circuit
    if (filter.circuitId !== undefined && session.circuitId !== filter.circuitId) {
      return false;
    }

    return true;
  });
}

/**
 * Filter lap data based on performance criteria
 */
export function filterLapData(laps: LapData[], filter: PerformanceFilterCriteria): LapData[] {
  // Validate filter first
  validatePerformanceFilter(filter);

  return laps.filter((lap) => {
    // Filter by tire compound
    if (filter.tireCompound !== undefined && lap.tireCompound !== filter.tireCompound) {
      return false;
    }

    // Filter by fuel load range (skip laps with NaN fuel load)
    if (filter.fuelLoadMin !== undefined) {
      if (Number.isNaN(lap.fuelLoad) || lap.fuelLoad < filter.fuelLoadMin) {
        return false;
      }
    }

    if (filter.fuelLoadMax !== undefined) {
      if (Number.isNaN(lap.fuelLoad) || lap.fuelLoad > filter.fuelLoadMax) {
        return false;
      }
    }

    // Filter by lap number range
    if (filter.lapNumberMin !== undefined && lap.lapNumber < filter.lapNumberMin) {
      return false;
    }

    if (filter.lapNumberMax !== undefined && lap.lapNumber > filter.lapNumberMax) {
      return false;
    }

    // Filter by sector (requires checking sector times)
    if (filter.sector !== undefined) {
      // Sector filter means we want laps with valid sector times (not NaN and > 0)
      if (filter.sector === 1 && (Number.isNaN(lap.sector1Time) || lap.sector1Time <= 0)) {
        return false;
      }
      if (filter.sector === 2 && (Number.isNaN(lap.sector2Time) || lap.sector2Time <= 0)) {
        return false;
      }
      if (filter.sector === 3 && (Number.isNaN(lap.sector3Time) || lap.sector3Time <= 0)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Filter lap summaries based on performance criteria
 */
export function filterLapSummaries(
  laps: LapSummary[],
  filter: PerformanceFilterCriteria
): LapSummary[] {
  // Validate filter first
  validatePerformanceFilter(filter);

  return laps.filter((lap) => {
    // Filter by tire compound
    if (filter.tireCompound !== undefined && lap.tireCompound !== filter.tireCompound) {
      return false;
    }

    // Filter by lap number range
    if (filter.lapNumberMin !== undefined && lap.lapNumber < filter.lapNumberMin) {
      return false;
    }

    if (filter.lapNumberMax !== undefined && lap.lapNumber > filter.lapNumberMax) {
      return false;
    }

    // Filter by sector (requires checking sector times)
    if (filter.sector !== undefined) {
      // Sector filter means we want laps with valid sector times (not NaN and > 0)
      if (filter.sector === 1 && (Number.isNaN(lap.sector1Time) || lap.sector1Time <= 0)) {
        return false;
      }
      if (filter.sector === 2 && (Number.isNaN(lap.sector2Time) || lap.sector2Time <= 0)) {
        return false;
      }
      if (filter.sector === 3 && (Number.isNaN(lap.sector3Time) || lap.sector3Time <= 0)) {
        return false;
      }
    }

    return true;
  });
}
