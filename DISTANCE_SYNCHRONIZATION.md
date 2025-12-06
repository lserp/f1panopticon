# Distance-Based Telemetry Synchronization

## Problem

When comparing telemetry from multiple drivers, plotting by **time** (array index) doesn't align the data correctly because:
- Drivers complete laps at different speeds
- Same corner happens at different times for each driver
- Can't compare "apples to apples" at the same track location

## Solution

Plot telemetry by **distance** around the track instead of time. This ensures all drivers' data is synchronized to the same physical location on track.

## Implementation

### 1. Data Sources

OpenF1 API provides two endpoints:
- `/car_data`: Speed, throttle, brake, gear, RPM, DRS
- `/location`: X, Y, Z coordinates on track

### 2. Distance Calculation

```typescript
// Calculate cumulative distance from X,Y coordinates
let cumulativeDistance = 0;
for (let i = 1; i < locations.length; i++) {
  const dx = locations[i].x - locations[i-1].x;
  const dy = locations[i].y - locations[i-1].y;
  const segmentDistance = Math.sqrt(dx*dx + dy*dy);
  cumulativeDistance += segmentDistance;
}
```

### 3. Data Merging

Merge car_data with location data by timestamp:
1. Sort both datasets by timestamp
2. For each car_data point, find closest location points
3. Interpolate distance based on timestamp
4. Store telemetry with distance values

### 4. Synchronized Plotting

```typescript
// X-axis: distance (same for all drivers)
const x = (point.distance / globalMaxDistance) * width;

// Y-axis: telemetry value
const y = height - ((point.value - globalMin) / range) * height;
```

## Benefits

### ✅ Accurate Comparison
- Same X position = same track location for all drivers
- Compare corner entry/exit at exact same spot
- See who brakes earlier/later at same point

### ✅ Visual Clarity
- Overlaid traces align at corners and straights
- Easy to spot differences in driving style
- Clear visualization of time gained/lost

### ✅ Professional Analysis
- Industry-standard approach
- Used by F1 teams for telemetry analysis
- Matches what engineers see

## Example

### Before (Time-Based)
```
Driver A: Fast lap (90s) - data spread across full width
Driver B: Slow lap (95s) - data spread across full width
Result: Corner 1 for A doesn't align with Corner 1 for B
```

### After (Distance-Based)
```
Driver A: 5,412m lap - data plotted by distance
Driver B: 5,412m lap - data plotted by distance
Result: Corner 1 at 1,200m aligns perfectly for both
```

## Technical Details

### Distance Calculation
- Uses Euclidean distance: `√(Δx² + Δy²)`
- Cumulative sum gives total distance traveled
- Typically ~5,000-6,000m for F1 circuits

### Interpolation
- Binary search to find closest location timestamps
- Linear interpolation between points
- Handles different sampling rates between car_data and location

### Performance
- Location data: ~17,000 points per lap
- Car data: ~17,000 points per lap
- Merged efficiently with O(n log n) complexity
- Sampled to 1,000 points for rendering

## Limitations

### Data Availability
- Requires both car_data and location data
- Some laps may not have location data
- Falls back to time-based if location unavailable

### Accuracy
- Depends on GPS/location data quality
- ~1-2m accuracy typical
- Good enough for corner-level analysis

### Track Limits
- Distance resets at start/finish line
- Doesn't account for off-track excursions
- Assumes drivers follow racing line

## Verification

To verify synchronization is working:

1. **Check distance values**: Should be similar across drivers (~5,000-6,000m)
2. **Visual alignment**: Corners should align vertically
3. **Speed traces**: Should show similar patterns at same X position
4. **Brake points**: Should align at same distance for same corner

## Future Enhancements

### Potential Improvements:
1. **Track map overlay**: Show current position on track
2. **Sector markers**: Vertical lines at sector boundaries
3. **Corner labels**: Annotate specific corners
4. **Delta time**: Show time difference at each distance point
5. **Normalized distance**: Scale to 0-100% for different track lengths

## References

- OpenF1 API: https://openf1.org/
- F1 Telemetry Analysis: Industry standard practice
- GPS-based synchronization: Used in motorsport analysis tools
