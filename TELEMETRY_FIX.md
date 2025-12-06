# Telemetry Visualization Fix

## Issues Fixed

### 1. OpenF1 Session Matching Not Working
**Problem**: The page showed "OpenF1 session not found" even for valid sessions like Bahrain 2024.

**Root Cause**: Circuit name mismatch between Ergast and OpenF1:
- Ergast: "Bahrain International Circuit"
- OpenF1: "Sakhir"

**Solution**: Implemented comprehensive circuit name mapping with aliases:
```typescript
const circuitMapping: Record<string, string[]> = {
  'bahrain': ['sakhir', 'bahrain'],
  'jeddah': ['jeddah', 'saudi'],
  'melbourne': ['melbourne', 'albert park', 'australia'],
  // ... etc
};
```

Now matches circuits by:
1. Direct name comparison
2. Circuit aliases (e.g., "Sakhir" → "Bahrain")
3. Round number fallback

### 2. Driver Buttons Not Showing
**Problem**: No driver buttons appeared on the page.

**Root Cause**: Buttons were only rendered if `driverLaps.length > 0`, but laps might still be loading.

**Solution**: Show all drivers immediately, with lap count when available:
```typescript
{driver.code} - {driver.firstName} {driver.lastName}
{driverLaps.length > 0 && ` (${driverLaps.length})`}
```

### 3. Driver ID vs Driver Number Mismatch
**Problem**: Telemetry fetching would fail because of ID mismatch:
- Ergast uses driver IDs: "max_verstappen", "perez", "sainz"
- OpenF1 uses driver numbers: 1, 11, 55

**Solution**: Look up driver number from session data:
```typescript
const driver = selectedSession?.drivers.find(d => d.id === selectedDriver);
const driverNumber = driver.number;
await openf1Api.fetchTelemetry(sessionKey, driverNumber, selectedLap);
```

## Testing

### Test the Fix:
1. Go to http://localhost:5173/sessions
2. Select "Bahrain Grand Prix 2024"
3. Click "Telemetry Viz" in the menu
4. You should now see:
   - ✅ "OpenF1 session found (Key: 9472)"
   - ✅ All 20 driver buttons
   - ✅ Lap count for each driver

5. Click on "VER - Max Verstappen"
6. Select "Lap 10"
7. Telemetry charts should load (if available)

## Console Logs Added

For debugging, the following console logs were added:
- `Fetching OpenF1 sessions for: [season] [sessionType]`
- `Found OpenF1 sessions: [count]`
- `Comparing: [sessionCircuit] with [selectedCircuit]`
- `Matched OpenF1 session: [circuitName] [id]`
- `Setting session key: [key]`
- `Fetching telemetry for driver: [code] number: [number] lap: [lap]`
- `Telemetry data received: [count] data points`

## What Works Now

✅ Session matching for all 2024 races
✅ Driver selection buttons appear immediately
✅ Lap count displayed for each driver
✅ Telemetry fetching uses correct driver numbers
✅ Clear status indicators (green/yellow)
✅ Proper error messages

## Known Limitations

⚠️ OpenF1 API still has data size limits
⚠️ Not all laps may have telemetry available
⚠️ Historical data (pre-2023) may be limited

## Files Modified

- `src/pages/TelemetryVisualization.tsx`
  - Added circuit name mapping
  - Fixed driver button rendering
  - Fixed driver ID → number conversion
  - Added debug console logs
