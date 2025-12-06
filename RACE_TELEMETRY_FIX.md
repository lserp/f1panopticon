# Race Telemetry Fix

## Problem
Telemetry data was not available for race sessions, even though the OpenF1 session was found and the session key was set correctly. The issue was that no drivers were showing up in the "Add Drivers to Compare" section.

## Root Cause
The Ergast API endpoint used to list sessions (`/${season}.json`) returns basic race information but **does not include the Results array** which contains the driver list. 

In `ergastApi.ts`, the `convertRaceToSession` method extracts drivers from:
```typescript
const results = race.Results || race.QualifyingResults || race.SprintResults || [];
```

For race sessions, `race.Results` was undefined because we weren't fetching the full race results.

## Solution
1. **Created `fetchRaceSession()` method** in `src/services/ergastApi.ts`:
   - Fetches race data from `/${season}/${round}/results.json` endpoint
   - This endpoint includes the full Results array with driver information
   - Returns SessionData with populated drivers array

2. **Updated `listSessions()` method**:
   - Changed from directly calling `convertRaceToSession(race, 'race')`
   - Now calls `fetchRaceSession()` to get full race data with drivers
   - Falls back to basic race data if fetch fails

## Changes Made
- `src/services/ergastApi.ts`:
  - Added `fetchRaceSession()` method (similar to existing `fetchQualifyingSession()`)
  - Modified `listSessions()` to use `fetchRaceSession()` for race sessions
  
- `src/pages/TelemetryComparison.tsx`:
  - Added extensive console logging to debug lap fetching
  - Logs show session key, driver count, and lap counts

## Result
- Race sessions now have driver lists populated
- Drivers appear in the "Add Drivers to Compare" section
- Lap data can be fetched from OpenF1 for each driver
- Telemetry comparison works for both qualifying and race sessions

## Cache Invalidation
Added cache versioning to automatically clear outdated session data:
- `src/store/sessionStore.ts`:
  - Added `CURRENT_CACHE_VERSION` constant (set to 2)
  - Added `cacheVersion` field to store
  - On rehydration, checks version and clears cache if outdated
  - This ensures old cached sessions without drivers are discarded

## Testing
After this fix:
1. **Refresh the page** (Cmd+Shift+R to clear browser cache)
2. The console should show "Cache version outdated, clearing cache"
3. Select a race session (e.g., Red Bull Ring 2025 - race)
4. You should see "✓ OpenF1 session found (Key: XXXX) - Telemetry data available"
5. Driver buttons should appear with lap counts (e.g., "VER - Max Verstappen (57)")
6. Clicking a driver adds them to the comparison
7. Selecting a lap loads telemetry data and displays charts

## Technical Details
The Ergast API has different endpoints for different data:
- `/${season}.json` - Basic race calendar (no driver details)
- `/${season}/${round}/results.json` - Full race results with drivers
- `/${season}/${round}/qualifying.json` - Qualifying results with drivers
- `/${season}/${round}/sprint.json` - Sprint results with drivers

We now fetch the appropriate endpoint for each session type to ensure driver data is included.
