# Lap List Display Fix

## Problem
The telemetry comparison page was only showing 4-6 laps instead of all available laps (should be 10-15 for qualifying, 50-70 for race).

## Root Cause
The code was calling `openf1Api.fetchLapData()` which fetches full telemetry for every lap - an expensive operation that was likely timing out or failing for large lap counts.

## Solution
1. **Created new `fetchLaps()` method** in `src/services/openf1Api.ts`:
   - Fetches only lap metadata (lap number, lap time, sectors) without telemetry
   - Much faster and lighter weight
   - Returns `OpenF1Lap[]` instead of `LapData[]`

2. **Updated `TelemetryComparison.tsx`**:
   - Changed from `fetchLapData()` to `fetchLaps()` for getting available laps
   - Now uses `lap.lap_number` and `lap.lap_duration` from OpenF1 response
   - Merges OpenF1 lap times with Ergast lap times as fallback
   - Telemetry is only fetched when user selects a specific lap

3. **Removed unused code**:
   - Deleted legacy `convertToTelemetryData()` method that wasn't being used

## Result
- All available laps now display for each driver
- Lap times shown under lap numbers (e.g., "Lap 12" with "1:32.456" below)
- 2-line button format with scrollable container
- Telemetry only fetched on-demand when user clicks a lap
- Much faster initial load time

## Testing
User should now see:
- **Qualifying**: 10-15 laps per driver
- **Race**: 50-70 laps per driver
- Lap times displayed under each lap number
- Scrollable lap selection area (max height 300px)
