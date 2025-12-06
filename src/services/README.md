# API Client Manager

This directory contains the API Client Manager implementation for the F1 Analysis Platform.

## Components

### 1. APIClient (`apiClient.ts`)
Base API client built with Axios that provides:
- Request/response interceptors for logging
- Retry logic with exponential backoff (configurable)
- Request queuing for rate limit management
- Comprehensive error handling with typed errors
- Rate limit tracking and status reporting

**Features:**
- Configurable rate limits (requests per second and per hour)
- Automatic retry on transient failures
- Queue-based request management to respect rate limits
- Detailed logging for debugging

### 2. ErgastAPI (`ergastApi.ts`)
Integration with the Ergast F1 API for historical race data:
- Session listing and filtering (by season, round, driver, constructor, circuit, date)
- Race results and lap times
- Driver and constructor information
- Qualifying and sprint session data
- Respects Ergast rate limits (4 req/sec, 200/hour)

**Data Sources:**
- Historical data from 1950-present
- Race results, standings, lap times
- No telemetry data (timing information only)

### 3. OpenF1API (`openf1Api.ts`)
Integration with the OpenF1 API for recent telemetry data:
- Session data (2023-present)
- Real-time telemetry (speed, throttle, brake, gear, RPM, DRS)
- Driver information
- Weather data
- Live session data polling with configurable intervals

**Features:**
- Live data polling for active sessions
- Telemetry data fetching by session and driver
- Lap-by-lap data with sector times
- Weather information

### 4. DataMerger (`dataMerger.ts`)
Multi-source data merging with intelligent fallback:
- Combines data from multiple API sources
- Source prioritization (primary + fallbacks)
- Multiple merge strategies:
  - `prefer-primary`: Use primary source data
  - `merge-all`: Combine all sources
  - `most-complete`: Choose most complete data for each field
- Automatic fallback when primary source fails
- Completeness scoring for intelligent data selection

**Merge Logic:**
- Drivers: Merged by ID, preferring non-empty values
- Laps: Merged by driver+lap number, combining data
- Weather: Merged preferring non-zero values
- Tracks contributing sources and merged fields

## Testing

### Unit Tests
- `apiClient.test.ts`: Basic API client functionality
- `ergastApi.test.ts`: Ergast API instance creation
- `openf1Api.test.ts`: OpenF1 API instance and polling
- `dataMerger.test.ts`: Data merger instance creation

### Property-Based Tests
- `dataMerger.property.test.ts`: Property 28 - Multi-source merge completeness
  - Validates that all unique drivers are preserved across merges
  - Validates that all unique laps are preserved across merges
  - Validates that weather data is preserved without loss
  - Validates that driver field data is preserved without loss
  - Runs 100 iterations per property with randomly generated data

## Usage

```typescript
import { DataMerger } from './services';

// Create merger instance
const merger = new DataMerger();

// Fetch and merge session data
const session = await merger.fetchAndMergeSession(2024, 1, {
  primarySource: 'openf1',
  fallbackSources: ['ergast'],
  mergeStrategy: 'merge-all'
});

// Access individual APIs
const ergastApi = merger.getErgastApi();
const openf1Api = merger.getOpenF1Api();

// Check rate limit status
const status = ergastApi.getRateLimitStatus();
console.log(`Requests this second: ${status.requestsLastSecond}`);
```

## Rate Limits

- **Ergast API**: 4 requests/second, 200 requests/hour
- **OpenF1 API**: 10 requests/second, 1000 requests/hour (generous)

All rate limits are automatically managed by the APIClient queue system.

## Error Handling

All API errors are converted to typed `AppError` objects with:
- `type`: Error category (connection, rate limit, authentication, etc.)
- `message`: Human-readable error message
- `details`: Additional error context
- `timestamp`: When the error occurred
- `recoverable`: Whether the error can be recovered from
- `retryable`: Whether the request should be retried

## Requirements Validated

This implementation satisfies the following requirements:
- **1.1**: Real-time telemetry data collection (OpenF1 live polling)
- **1.2**: Data validation and storage within time limits
- **1.3**: Error handling and retry mechanisms
- **1.5**: Live session data polling
- **13.1**: Multiple API source integration
- **13.2**: Multi-source data merging (Property 28)
- **13.3**: Session listing and filtering
- **13.4**: Fallback mechanisms when sources fail
