# Telemetry Comparison Feature

## Overview

The new Telemetry Comparison page allows you to compare telemetry data from multiple drivers (up to 6) on the same charts, making it easy to analyze driving styles and performance differences.

## Features

### ✅ Multi-Driver Selection
- Select up to 6 drivers to compare
- Each driver gets their team's color
- Easy add/remove interface

### ✅ Individual Lap Selection
- Each driver can have a different lap selected
- Choose the best lap, qualifying lap, or any specific lap
- Lap availability shown for each driver

### ✅ Team Colors
- **Red Bull**: Blue (#3671C6)
- **Ferrari**: Red (#E8002D)
- **Mercedes**: Turquoise (#27F4D2)
- **McLaren**: Orange (#FF8000)
- **Aston Martin**: Green (#229971)
- **Alpine**: Pink (#FF87BC)
- **Williams**: Light Blue (#64C4FF)
- **RB**: Blue (#6692FF)
- **Kick Sauber**: Green (#52E252)
- **Haas**: Silver (#B6BABD)

### ✅ Overlay Charts
- All drivers' telemetry overlaid on the same chart
- Speed, Throttle, Brake, and Gear charts
- Color-coded legend
- Global min/max scaling for accurate comparison

## How to Use

### Step 1: Select a Session
1. Go to **Session Browser**
2. Select a session (Practice, Qualifying, or Race)
3. Navigate to **Telemetry Viz**

### Step 2: Add Drivers
1. Click on driver buttons to add them (up to 6)
2. Each driver appears in their team color
3. Drivers with no lap data are disabled

### Step 3: Select Laps
1. For each driver, select a lap number
2. Telemetry loads automatically
3. Green checkmark shows when loaded

### Step 4: Compare
1. View all drivers' telemetry overlaid on charts
2. Use the legend to identify each driver
3. Analyze differences in:
   - **Speed**: Who's faster where?
   - **Throttle**: Who's more aggressive?
   - **Brake**: Who brakes later/harder?
   - **Gear**: Different gear strategies?

## Use Cases

### 1. Qualifying Analysis
**Goal**: Compare fastest laps from different drivers

**Steps**:
1. Select Qualifying session
2. Add 2-3 drivers (e.g., VER, HAM, LEC)
3. Select each driver's fastest lap (usually Q3)
4. Compare where time is gained/lost

### 2. Race Pace Comparison
**Goal**: Compare race pace on similar tire age

**Steps**:
1. Select Race session
2. Add drivers to compare
3. Select laps with similar tire age (e.g., lap 10 for all)
4. Compare consistency and pace

### 3. Teammate Battle
**Goal**: Compare teammates' performance

**Steps**:
1. Select any session
2. Add both teammates (e.g., VER + PER)
3. Select same lap number for both
4. Analyze driving style differences

### 4. Setup Analysis
**Goal**: Understand setup differences

**Steps**:
1. Select Practice session
2. Add same driver multiple times (if testing different setups)
3. Compare different laps
4. Look for differences in corner speeds, braking points

## Tips

### Getting the Best Comparison
1. **Use same lap numbers** when comparing race pace
2. **Use fastest laps** when comparing ultimate pace
3. **Check tire compounds** - different compounds affect performance
4. **Consider track evolution** - later laps may be faster due to track rubber

### Interpreting the Charts

**Speed Chart**:
- Higher = faster
- Look for differences in corner entry/exit speeds
- Straight-line speed differences

**Throttle Chart**:
- 100% = full throttle
- Compare throttle application smoothness
- Earlier throttle = better corner exit

**Brake Chart**:
- 100% = maximum braking
- Compare braking points (when brake applied)
- Braking duration and intensity

**Gear Chart**:
- Higher gear = faster section
- Compare gear selection in corners
- Different strategies for same corner

## Limitations

### OpenF1 API Limitations
- Not all laps have telemetry data
- Historical data may be limited
- Data size limits may affect some laps

### Performance
- Charts sample data to 1000 points per driver
- Maximum 6 drivers to prevent performance issues
- Large datasets may take time to load

## Troubleshooting

### "No laps available" for a driver
- Driver may not have completed any laps
- Try a different session
- Check if it's a DNS (Did Not Start) situation

### Telemetry fails to load
- Try a different lap number
- OpenF1 may not have data for that specific lap
- Check browser console for errors

### Charts look wrong
- Ensure all drivers have loaded telemetry
- Check if data ranges are very different
- Try removing and re-adding the driver

## Examples

### Example 1: Verstappen vs Hamilton Qualifying
```
Session: Bahrain 2024 Qualifying
Drivers: VER (Lap 18), HAM (Lap 17)
Result: Compare Q3 fastest laps
```

### Example 2: Ferrari Teammates
```
Session: Bahrain 2024 Race
Drivers: LEC (Lap 20), SAI (Lap 20)
Result: Compare race pace on same lap
```

### Example 3: Top 3 Comparison
```
Session: Bahrain 2024 Qualifying
Drivers: VER, LEC, SAI (all Q3 fastest laps)
Result: See where each driver gains/loses time
```

## Future Enhancements

Potential features for future versions:
- Sector-by-sector comparison
- Delta time visualization
- Corner-by-corner analysis
- Tire compound indicators
- Track map with telemetry overlay
- Export comparison data
- Save favorite comparisons
- Share comparison links

## Technical Details

### Data Flow
```
User selects session
  ↓
User adds drivers (up to 6)
  ↓
User selects lap for each driver
  ↓
Fetch telemetry from OpenF1 API
  ↓
Overlay all telemetry on same charts
  ↓
Display with color-coded legend
```

### Team Color Mapping
Colors are automatically assigned based on team name matching. The system looks for team keywords in the driver's team name and assigns the corresponding color.

### Performance Optimization
- Data sampling: 17,000+ points → 1,000 points per driver
- Lazy loading: Telemetry only fetched when lap selected
- Efficient rendering: SVG with viewBox for scaling
