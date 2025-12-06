# F1 Telemetry Visualization Guide

## Overview

The F1 Panopticon now supports real telemetry data visualization, allowing you to analyze driver performance with detailed speed, throttle, brake, and gear data.

## Data Sources

### 1. Lap Times (Always Available)
- **Source**: Ergast API via Jolpi.ca mirror
- **Data**: Lap times for all drivers in a session
- **Coverage**: Historical data from 1950-present
- **Reliability**: ✅ Highly reliable

### 2. Telemetry Data (When Available)
- **Source**: OpenF1 API
- **Data**: Speed, throttle, brake, gear, RPM, DRS
- **Coverage**: 2023-present (limited historical data)
- **Reliability**: ⚠️ Subject to API limitations

## Features

### Page 1: Lap Times (`/telemetry`)
**Purpose**: Quick overview of lap times for a session

**Features**:
- Session details display
- All drivers with team information
- Lap times table with filtering
- Driver-specific lap filtering
- Fastest lap statistics

**Best For**:
- Quick lap time comparisons
- Identifying fastest laps
- Checking driver performance

### Page 2: Telemetry Visualization (`/telemetry-viz`)
**Purpose**: Detailed telemetry analysis with charts

**Features**:
- Driver selection
- Lap selection
- Real telemetry charts:
  - Speed (km/h)
  - Throttle (%)
  - Brake (%)
  - Gear
- Telemetry statistics
- Data point count

**Best For**:
- Analyzing driving style
- Comparing throttle/brake application
- Understanding gear changes
- Studying corner entry/exit

## How to Use

### Step 1: Select a Session
1. Go to **Session Browser** (`/sessions`)
2. Choose a season (2024 recommended for telemetry)
3. Click on a race (e.g., "Bahrain Grand Prix")
4. You'll be redirected to the Lap Times page

### Step 2: View Lap Times
- On the Lap Times page, you can:
  - See all drivers in the session
  - Filter laps by driver
  - View lap times in a table
  - See fastest lap statistics

### Step 3: View Telemetry (Optional)
1. Navigate to **Telemetry Viz** in the menu
2. Select a driver from the buttons
3. Select a lap number
4. If telemetry data is available, you'll see:
   - Speed chart
   - Throttle chart
   - Brake chart
   - Gear chart
   - Statistics panel

## Understanding the Data

### Speed Chart
- **Y-axis**: Speed in km/h
- **X-axis**: Time through the lap
- **Interpretation**:
  - High peaks = straights
  - Low valleys = slow corners
  - Smooth transitions = good driving

### Throttle Chart
- **Y-axis**: Throttle position (0-100%)
- **X-axis**: Time through the lap
- **Interpretation**:
  - 100% = full throttle
  - 0% = no throttle
  - Gradual application = smooth driving

### Brake Chart
- **Y-axis**: Brake pressure (0-100%)
- **X-axis**: Time through the lap
- **Interpretation**:
  - 100% = maximum braking
  - 0% = no braking
  - Sharp spikes = heavy braking zones

### Gear Chart
- **Y-axis**: Gear number (1-8)
- **X-axis**: Time through the lap
- **Interpretation**:
  - Higher gears = faster sections
  - Lower gears = slower corners
  - Gear changes = acceleration/deceleration

## Troubleshooting

### "OpenF1 session not found"
**Cause**: The session is not available in OpenF1's database

**Solution**:
- Try a more recent session (2024 races)
- Use the Lap Times page instead
- Check if the session has been completed

### "Telemetry data not available for this lap"
**Cause**: OpenF1 API has limitations on data retrieval

**Solutions**:
- Try a different lap number
- Try a different driver
- Use a more recent session
- The API may have rate limits or data size limits

### "Failed to retrieve information. You're likely asking for too much data at once"
**Cause**: OpenF1 API limits the amount of data per request

**Solution**:
- This is handled automatically by the app
- If you see this, try refreshing the page
- Select a different lap

## Best Sessions for Telemetry

### Recommended Sessions (2024):
1. **Bahrain GP** (Round 1) - ✅ Good telemetry availability
2. **Saudi Arabian GP** (Round 2) - ✅ Good telemetry availability
3. **Australian GP** (Round 3) - ✅ Good telemetry availability
4. **Japanese GP** (Round 4) - ✅ Good telemetry availability

### Why These Work Well:
- Recent races (2024 season)
- Complete race data
- OpenF1 has full coverage
- All drivers have telemetry

## API Limitations

### Ergast API (Lap Times)
- **Rate Limit**: 4 requests/second, 200 requests/hour
- **Coverage**: 1950-present
- **Reliability**: Very high
- **Data**: Lap times, sector times, positions

### OpenF1 API (Telemetry)
- **Rate Limit**: 10 requests/second, 1000 requests/hour
- **Coverage**: 2023-present (limited)
- **Reliability**: Medium (subject to data availability)
- **Data**: Speed, throttle, brake, gear, RPM, DRS
- **Limitation**: Cannot fetch entire race telemetry at once

## Future Enhancements

### Planned Features:
1. **Multi-driver comparison**: Overlay telemetry from multiple drivers
2. **Corner analysis**: Identify and analyze specific corners
3. **Lap comparison**: Compare two laps side-by-side
4. **Telemetry export**: Download telemetry data as CSV
5. **Advanced charts**: Use Recharts library for interactive charts
6. **Sector analysis**: Break down telemetry by sector
7. **Tire data**: Show tire compound and age
8. **Track map**: Visualize telemetry on track layout

### Potential Data Sources:
- **Fast-F1**: Python library with extensive F1 data (requires backend)
- **F1 Live Timing**: Real-time data during races (requires authentication)
- **Custom data**: Upload your own telemetry files

## Technical Details

### Data Flow:
```
User selects session
  ↓
Fetch lap times from Ergast API
  ↓
User selects driver and lap
  ↓
Find OpenF1 session key
  ↓
Fetch telemetry from OpenF1 API
  ↓
Display charts
```

### File Structure:
- `src/pages/SimpleTelemetry.tsx` - Lap times page
- `src/pages/TelemetryVisualization.tsx` - Telemetry charts page
- `src/hooks/useLapData.ts` - Lap data fetching hook
- `src/services/ergastApi.ts` - Ergast API client
- `src/services/openf1Api.ts` - OpenF1 API client

### Key Components:
- **TelemetryChart**: Simple SVG-based chart component
- **useLapData**: React hook for fetching lap times
- **openf1Api.fetchTelemetry**: Fetches telemetry for specific lap

## Tips for Best Results

1. **Use recent sessions**: 2024 races have the best telemetry coverage
2. **Start with Bahrain GP**: Round 1 of 2024 is well-documented
3. **Try different laps**: Not all laps have telemetry available
4. **Check the session key indicator**: Green = telemetry available, Yellow = lap times only
5. **Be patient**: Telemetry fetching can take a few seconds
6. **Use lap times first**: Get familiar with the session before diving into telemetry

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify the session is from 2024
3. Try a different lap or driver
4. Refresh the page
5. Check if OpenF1 API is online: https://api.openf1.org/v1/sessions

## Credits

- **Ergast API**: Historical F1 data (via Jolpi.ca mirror)
- **OpenF1 API**: Real-time and telemetry data
- **F1 Panopticon**: Built with React, TypeScript, and Vite
