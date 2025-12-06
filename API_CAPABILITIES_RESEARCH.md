# F1 API Capabilities Research

## Date: December 5, 2025

## Question: Can we pull driver team radio communications?

### OpenF1 API Investigation

**Tested Endpoints:**
- `/team_radio` - Returns empty array `[]`
- `/radio` - Returns empty array `[]`
- `/race_control` - Returns empty array `[]`

**Sessions Tested:**
- 2024 Abu Dhabi GP Race (session_key: 9662)
- 2024 Abu Dhabi GP Qualifying (session_key: 9658)
- 2024 Monza Race (session_key: 9590)

**Result:** ❌ Team radio data is **NOT available** in OpenF1 API

### Why Team Radio Might Not Be Available

1. **Licensing/Rights Issues**: Team radio communications are likely proprietary content owned by F1/FOM
2. **Privacy Concerns**: Teams may not want all communications publicly accessible
3. **Commercial Value**: F1 TV Pro subscribers pay for access to team radio
4. **API Scope**: OpenF1 focuses on telemetry and timing data, not broadcast content

### What IS Available in OpenF1 API

Based on our current implementation and testing:

✅ **Available Data:**
- Session information (dates, locations, circuits)
- Driver information (names, numbers, teams, team colors)
- Car telemetry data (speed, throttle, brake, gear, RPM, DRS)
- Location data (X, Y, Z coordinates for distance calculation)
- Lap timing data (lap times, sector times, speeds)
- Weather data (air temp, track temp, humidity, wind, rainfall)
- Position data (real-time positions during session)

❌ **NOT Available:**
- Team radio communications
- Pit stop data (endpoint exists but returns empty)
- Stint data (endpoint exists but returns empty)
- Race control messages

### Alternative Data Sources for Team Radio

**Option 1: F1 TV Pro API (Unofficial)**
- Some unofficial APIs scrape F1 TV Pro
- Requires F1 TV Pro subscription
- Legal gray area
- Not recommended for public app

**Option 2: Manual Transcription**
- Manually transcribe notable radio messages from broadcasts
- Store in local database
- Time-consuming but legal
- Limited coverage

**Option 3: Community-Sourced**
- Allow users to submit radio transcripts
- Moderation required
- Incomplete coverage
- Community engagement opportunity

### Recommendation

**Do NOT pursue team radio feature** because:
1. Data is not available through free APIs
2. Would require paid F1 TV Pro access (expensive)
3. Legal/licensing concerns
4. Not core to telemetry analysis functionality

### Alternative Features to Explore

Instead of team radio, consider these features using available data:

1. **Pit Stop Analysis** ✅
   - Calculate pit stop times from lap data
   - Compare pit strategies between drivers
   - Visualize pit windows

2. **Tire Strategy Visualization** ✅
   - Track tire compounds used (if available)
   - Analyze tire degradation from lap times
   - Compare strategies

3. **Weather Impact Analysis** ✅
   - Correlate weather data with lap times
   - Show how rain affects performance
   - Track temperature changes

4. **Position Changes Timeline** ✅
   - Visualize position changes throughout race
   - Show overtakes and battles
   - Create race flow diagram

5. **Sector Analysis** ✅
   - Compare sector times between drivers
   - Identify strongest/weakest sectors
   - Show where time is gained/lost

6. **Speed Trap Comparison** ✅
   - Compare top speeds at different points
   - Analyze DRS effectiveness
   - Show speed differentials

7. **Race Pace Analysis** ✅
   - Compare race pace vs qualifying pace
   - Fuel-corrected lap times
   - Tire degradation curves

8. **Gap Analysis** ✅
   - Track gaps between drivers over time
   - Show when gaps increase/decrease
   - Identify key moments

All of these features can be built using the data we already have access to!

## Next Steps

Would you like to implement any of these alternative features instead?
