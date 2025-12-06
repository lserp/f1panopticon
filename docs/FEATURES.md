# Feature Documentation

This guide provides detailed information about all major features of the F1 Analysis Platform and how to use them effectively.

## Table of Contents

- [Session Browser](#session-browser)
- [Telemetry Analysis](#telemetry-analysis)
- [Strategy Analysis](#strategy-analysis)
- [Driver Comparison](#driver-comparison)
- [Correlation Analysis](#correlation-analysis)
- [Session Replay](#session-replay)
- [Dashboard Customization](#dashboard-customization)
- [Data Export](#data-export)

## Session Browser

The Session Browser is your starting point for accessing F1 data.

### Features

- **Browse Sessions**: View all available F1 sessions from 2018 onwards
- **Advanced Filtering**: Filter by season, race, session type, driver, and date
- **Data Source Attribution**: See which API provided each piece of data
- **Quick Search**: Find specific sessions quickly

### How to Use

1. **Navigate to Session Browser**: Click "Sessions" in the main navigation
2. **Apply Filters**:
   - **Season**: Select year (e.g., 2024)
   - **Race**: Choose specific Grand Prix
   - **Session Type**: Practice, Qualifying, Sprint, or Race
   - **Driver**: Filter by specific driver
   - **Date Range**: Select custom date range
3. **Select Session**: Click on any session to view details
4. **View Session Info**: See weather conditions, track status, and available data

### Tips

- Use multiple filters together for precise results
- Check data source indicators to understand data availability
- Recent sessions (2023+) have more detailed telemetry from OpenF1
- Historical sessions use Ergast API for timing data

---

## Telemetry Analysis

Analyze detailed car telemetry data with interactive visualizations.

### Features

- **Multi-Channel Telemetry**: View speed, throttle, brake, gear, RPM, and DRS
- **Multi-Lap Overlay**: Compare up to 4 laps simultaneously
- **Track Map Integration**: See telemetry synchronized with track position
- **Interactive Tooltips**: Hover for exact values at any point
- **Zoom and Pan**: Focus on specific track sections
- **Performance Gap Highlighting**: Automatically highlight significant differences

### Telemetry Channels

#### Standard Channels (Free Tier)
- **Speed**: Car velocity in km/h
- **Throttle**: Throttle position (0-100%)
- **Brake**: Brake pressure (0-100%)
- **Gear**: Current gear (1-8)
- **RPM**: Engine revolutions per minute
- **Distance**: Position on track in meters

#### Premium Channels (Premium Tier)
- **DRS**: DRS activation status
- **Energy Recovery**: ERS deployment and harvesting
- **Additional sensors**: Tire temperatures, suspension travel

### Workflow: Analyzing a Lap

1. **Select Session**: Choose session from Session Browser
2. **Choose Driver**: Select driver from dropdown
3. **Pick Lap**: Select lap number to analyze
4. **View Telemetry**: Charts render automatically
5. **Explore Track Map**: Click on track to jump to that position
6. **Add Comparisons**: Select additional laps to overlay (up to 4 total)

### Workflow: Comparing Laps

1. **Load First Lap**: Select driver and lap as baseline
2. **Add Comparison Laps**: Click "Add Lap" and select up to 3 more
3. **Synchronized View**: All laps align to same distance axis
4. **Identify Differences**: Look for gaps in speed traces
5. **Analyze Sections**: Zoom into corners or straights
6. **Check Track Map**: See position differences visually

### Understanding the Visualizations

#### Speed Trace
- **Higher is faster**: Look for areas where one lap is consistently higher
- **Braking zones**: Sharp drops indicate braking points
- **Acceleration**: Steep climbs show acceleration out of corners

#### Throttle and Brake
- **Throttle application**: How aggressively driver applies power
- **Brake points**: Where and how hard driver brakes
- **Overlap**: Throttle and brake should rarely overlap (except trail braking)

#### Gear Changes
- **Shift points**: When driver changes gears
- **Gear selection**: Which gear used in each corner
- **Consistency**: Similar laps should have similar shift patterns

### Tips

- Start with speed trace to identify major differences
- Use throttle/brake to understand driving technique
- Check gear selection for setup clues (longer gears = less downforce)
- Zoom into specific corners for detailed analysis
- Use track map to understand context (elevation, corner type)

---

## Strategy Analysis

Optimize race strategy with tire degradation analysis and pit stop simulation.

### Features

- **Tire Degradation Tracking**: Calculate degradation rates from lap times
- **Pit Stop Analysis**: Analyze pit stop timing and outcomes
- **Pit Exit Visualization**: See track position after pit stops
- **Strategy Simulation**: Compare alternative strategies
- **Strategy Timeline**: Visual representation of race strategy
- **Traffic Impact Assessment**: Understand pit exit traffic

### Workflow: Analyzing Race Strategy

1. **Select Race Session**: Choose a race from Session Browser
2. **Navigate to Strategy Analysis**: Click "Strategy" tab
3. **View Strategy Timeline**: See all pit stops and tire stints
4. **Analyze Pit Stops**: Click on pit stop markers for details
5. **Check Degradation**: View tire degradation curves
6. **Compare Strategies**: Select multiple drivers to compare

### Strategy Timeline

The timeline shows:
- **Tire Stints**: Color-coded by compound (Soft, Medium, Hard)
- **Pit Stops**: Markers showing pit stop timing and duration
- **Position Changes**: Track position throughout race
- **Safety Cars**: Yellow highlights for safety car periods
- **Weather**: Icons showing weather conditions

### Pit Stop Analysis

For each pit stop, view:
- **Lap Number**: When pit stop occurred
- **Duration**: Time spent in pit lane
- **Tire Change**: Compound in → compound out
- **Position Before/After**: Track position change
- **Gap to Cars Ahead/Behind**: Time gaps at pit exit
- **Traffic Impact**: Whether pit exit was clear or congested

### Pit Exit Visualization

The track map shows:
- **Pit Exit Point**: Where car rejoins track
- **Car Positions**: Location of all cars at pit exit moment
- **Gap Indicators**: Visual representation of time gaps
- **Traffic Assessment**: Color-coded impact (green=clear, yellow=minor, red=significant)

### Strategy Simulation

Simulate alternative strategies:

1. **Select Base Strategy**: Choose actual strategy as baseline
2. **Modify Parameters**: Change pit stop laps or tire compounds
3. **Run Simulation**: Calculate predicted outcome
4. **Compare Results**: See time gained/lost vs actual strategy
5. **View Confidence**: Check confidence intervals for predictions

### Tips

- Look for degradation patterns to predict optimal pit windows
- Compare strategies of drivers who finished close together
- Check if early/late pit stops avoided traffic
- Consider safety car probability in strategy decisions
- Use simulation to test "what if" scenarios

---

## Driver Comparison

Compare driver performance with synchronized telemetry and statistical analysis.

### Features

- **Teammate Comparison**: Direct comparison of drivers in same car
- **Synchronized Overlays**: Perfectly aligned telemetry traces
- **Driving Style Metrics**: Quantify driving technique differences
- **Consistency Analysis**: Statistical measures of lap time variation
- **Performance Gap Highlighting**: Automatic identification of significant differences
- **Sector-by-Sector Analysis**: Break down performance by track section

### Workflow: Comparing Teammates

1. **Select Session**: Choose session with both drivers
2. **Navigate to Driver Comparison**: Click "Comparison" tab
3. **Select Drivers**: Choose two drivers (ideally teammates)
4. **Pick Laps**: Select comparable laps (similar conditions)
5. **View Overlays**: Telemetry displays synchronized
6. **Analyze Differences**: Review metrics and highlighted sections

### Driving Style Metrics

#### Braking Metrics
- **Braking Point**: Average distance from corner where braking starts
- **Peak Brake Pressure**: Maximum brake application
- **Brake Duration**: How long brakes are applied
- **Trail Braking**: Overlap between braking and steering

#### Throttle Metrics
- **Throttle Application**: How aggressively power is applied
- **Full Throttle Time**: Percentage of lap at 100% throttle
- **Partial Throttle**: Use of intermediate throttle positions
- **Throttle Smoothness**: Variation in throttle application

#### Cornering Metrics
- **Minimum Corner Speed**: Slowest point in each corner
- **Corner Entry Speed**: Speed when turning in
- **Corner Exit Speed**: Speed when straightening wheel
- **Time to Full Throttle**: Delay from apex to full power

### Consistency Statistics

- **Lap Time Standard Deviation**: Measure of lap time consistency
- **Sector Time Variation**: Consistency in each track section
- **Coefficient of Variation**: Normalized consistency metric
- **Outlier Detection**: Identification of anomalous laps

### Performance Gap Analysis

Gaps are highlighted when:
- **Speed difference > 5 km/h**: Significant speed advantage
- **Time difference > 0.1 seconds**: Meaningful time gap in section
- **Consistent pattern**: Gap appears across multiple laps

### Tips

- Compare laps with similar tire age and fuel load
- Look for consistent patterns, not one-off differences
- Check if gaps correlate with specific corners or sections
- Use driving style metrics to understand technique differences
- Consider track evolution and changing conditions

---

## Correlation Analysis

Discover relationships between telemetry parameters and lap time performance.

### Features

- **Correlation Coefficients**: Statistical measure of relationships
- **Scatter Plots**: Visual representation of correlations
- **Heat Maps**: Matrix view of all parameter relationships
- **Multivariate Analysis**: Examine multiple parameters simultaneously
- **Ranking by Impact**: Sort parameters by influence on lap time
- **Statistical Confidence**: Confidence intervals for correlations

### Workflow: Finding Performance Factors

1. **Select Session**: Choose session with multiple laps
2. **Navigate to Correlation Analysis**: Click "Correlation" tab
3. **Choose Parameters**: Select telemetry channels to analyze
4. **Set Target**: Usually lap time, but can be sector time
5. **Run Analysis**: Calculate correlations
6. **Review Results**: Examine scatter plots and rankings
7. **Export Data**: Save results for further analysis

### Understanding Correlation Results

#### Correlation Coefficient (r)
- **r = 1.0**: Perfect positive correlation
- **r = 0.5 to 1.0**: Strong positive correlation
- **r = 0.0**: No correlation
- **r = -0.5 to -1.0**: Strong negative correlation
- **r = -1.0**: Perfect negative correlation

#### Interpreting Results

**Positive Correlation**: Higher parameter value → Higher lap time (slower)
- Example: More braking → Slower lap time

**Negative Correlation**: Higher parameter value → Lower lap time (faster)
- Example: Higher minimum corner speed → Faster lap time

### Common Correlations

#### Strong Correlations (typically found)
- **Minimum corner speed** ↔ Lap time (negative, strong)
- **Time on brakes** ↔ Lap time (positive, moderate)
- **Full throttle time** ↔ Lap time (negative, moderate)

#### Weak Correlations (setup dependent)
- **Peak brake pressure** ↔ Lap time (varies by track)
- **Gear selection** ↔ Lap time (depends on setup philosophy)

### Multivariate Analysis

Examine multiple parameters together:
- **Partial correlations**: Correlation while controlling for other variables
- **Interaction effects**: How parameters influence each other
- **Combined impact**: Total effect of multiple factors

### Tips

- Use multiple laps from same session for reliable results
- Filter out outlier laps (mistakes, traffic, yellow flags)
- Consider track-specific factors (Monaco vs Monza very different)
- Look for unexpected correlations that reveal setup issues
- Export results to compare across different sessions

---

## Session Replay

Replay sessions with synchronized visualizations and playback controls.

### Features

- **Playback Controls**: Play, pause, resume, and scrub through session
- **Speed Adjustment**: 0.25x to 16x playback speed
- **Timeline Scrubber**: Jump to any point in session
- **Synchronized Visualizations**: All charts update together
- **Real-time Updates**: See telemetry change as replay progresses
- **Lap Markers**: Visual indicators for lap boundaries

### Workflow: Replaying a Session

1. **Select Session**: Choose session from Session Browser
2. **Navigate to Replay**: Click "Replay" tab
3. **Choose Driver**: Select driver to follow
4. **Configure View**: Set up dashboard with desired channels
5. **Start Playback**: Click play button
6. **Adjust Speed**: Use speed controls as needed
7. **Pause and Analyze**: Stop at interesting moments

### Playback Controls

#### Basic Controls
- **Play/Pause**: Start or stop playback
- **Speed**: Adjust from 0.25x (slow motion) to 16x (fast forward)
- **Timeline**: Click or drag to jump to specific time
- **Lap Selector**: Jump to start of any lap

#### Advanced Controls
- **Loop**: Repeat specific section continuously
- **Step Frame**: Move forward/backward by single data points
- **Bookmark**: Mark interesting moments for later review
- **Sync Lock**: Keep multiple drivers synchronized

### Synchronized Visualizations

During replay, all elements update together:
- **Telemetry Charts**: Show current values
- **Track Map**: Car position updates
- **Data Displays**: Current speed, gear, etc.
- **Timeline**: Progress indicator moves

### Use Cases

#### Race Analysis
- Watch entire race at 8x-16x speed
- Pause at key moments (pit stops, overtakes, incidents)
- Compare strategies as they unfold

#### Qualifying Analysis
- Review all qualifying laps sequentially
- Identify where time was gained/lost
- Compare different run strategies

#### Practice Session Review
- Watch setup changes take effect
- See how drivers learn the track
- Identify consistent problem areas

### Tips

- Start at 4x-8x speed for overview
- Slow to 1x-2x for detailed analysis
- Use 0.25x-0.5x for critical moments
- Pause frequently to examine data
- Use bookmarks to mark interesting points
- Sync multiple drivers to compare side-by-side

---

## Dashboard Customization

Create personalized layouts for different analysis scenarios.

### Features

- **Drag-and-Drop Layout**: Rearrange charts freely
- **Resizable Panels**: Adjust chart sizes
- **Channel Selection**: Choose which telemetry to display
- **Save Configurations**: Store custom layouts
- **Load Presets**: Quick access to common layouts
- **Full-Screen Mode**: Maximize individual charts
- **Multi-Monitor Support**: Span dashboard across screens

### Creating Custom Dashboards

1. **Start with Template**: Choose preset layout or blank canvas
2. **Add Charts**: Click "Add Chart" and select type
3. **Arrange Layout**: Drag charts to desired positions
4. **Resize Panels**: Drag edges to adjust sizes
5. **Configure Channels**: Select telemetry for each chart
6. **Save Configuration**: Name and save your layout

### Preset Layouts

#### Overview Layout
- 4 main charts: Speed, Throttle, Brake, Gear
- Track map in corner
- Lap selector at top
- **Best for**: General analysis

#### Detailed Analysis Layout
- 8 channels displayed
- Smaller charts in grid
- More data visible simultaneously
- **Best for**: Deep dives into specific laps

#### Comparison Layout
- Split screen for two drivers
- Synchronized charts
- Side-by-side track maps
- **Best for**: Driver comparison

#### Strategy Layout
- Strategy timeline prominent
- Tire degradation chart
- Pit stop analysis panel
- **Best for**: Race strategy analysis

### Dashboard Settings

#### Display Options
- **Theme**: Light or dark mode
- **Color Scheme**: Chart color palettes
- **Font Size**: Adjust for readability
- **Grid Density**: Spacing between charts

#### Performance Options
- **Chart Resolution**: Balance quality vs performance
- **Update Frequency**: How often charts refresh
- **Data Decimation**: Reduce points for smoother rendering
- **Animation**: Enable/disable chart animations

### Saving and Loading

#### Save Configuration
1. Click "Save Dashboard"
2. Enter name (e.g., "Monaco Analysis")
3. Optionally set as default
4. Configuration saved to browser storage

#### Load Configuration
1. Click "Load Dashboard"
2. Select from saved configurations
3. Dashboard instantly reconfigures
4. All settings restored

### Tips

- Create different layouts for different tracks
- Save configurations before experimenting
- Use full-screen mode for presentations
- Reduce channels if performance is slow
- Export configurations to share with team

---

## Data Export

Export analysis results and visualizations for reports and further analysis.

### Export Formats

#### Telemetry Data
- **CSV**: Spreadsheet-compatible format
- **JSON**: Structured data for programming
- **Includes**: All telemetry channels, metadata, timestamps

#### Visualizations
- **PNG**: Raster images up to 4K resolution
- **SVG**: Vector graphics for scaling
- **PDF**: Multi-page reports with annotations

#### Analysis Results
- **Correlation Data**: CSV with coefficients and confidence intervals
- **Strategy Reports**: PDF with timeline and analysis
- **Comparison Reports**: Side-by-side driver analysis

### Workflow: Exporting Data

1. **Prepare Analysis**: Complete your analysis
2. **Select Export Type**: Choose format
3. **Configure Options**: Set resolution, metadata, etc.
4. **Export**: Click export button
5. **Save File**: Choose location on your computer

### Export Options

#### Telemetry Export
- **Channels**: Select which telemetry to include
- **Metadata**: Include session info, weather, setup notes
- **Format**: CSV or JSON
- **Compression**: Optional ZIP for large exports

#### Visualization Export
- **Resolution**: 1080p, 1440p, 4K
- **Format**: PNG or SVG
- **Background**: Transparent or solid
- **Annotations**: Include or exclude labels

#### Batch Export
- **Multiple Laps**: Export several laps at once
- **Multiple Sessions**: Export entire race weekend
- **Consistent Naming**: Automatic file naming
- **Folder Structure**: Organized by session/driver

### PDF Reports

Generate comprehensive reports:

#### Report Contents
- **Cover Page**: Session info and summary
- **Telemetry Charts**: Key visualizations
- **Statistical Summary**: Performance metrics
- **Annotations**: Your notes and observations
- **Data Tables**: Lap times, sector times

#### Customization
- **Layout**: Choose from templates
- **Branding**: Add team logos
- **Sections**: Select what to include
- **Page Size**: A4, Letter, or custom

### Tips

- Export at highest resolution for presentations
- Use CSV for further analysis in Excel/Python
- Include metadata for future reference
- Use batch export for efficiency
- Save PDF reports for sharing with non-technical team members

---

## Keyboard Shortcuts

Press `?` or `h` in the application to view all keyboard shortcuts.

### Common Shortcuts

- **Space**: Play/Pause replay
- **←/→**: Step backward/forward in replay
- **↑/↓**: Adjust playback speed
- **F**: Toggle full-screen mode
- **E**: Export current view
- **S**: Save dashboard configuration
- **L**: Load dashboard configuration
- **?**: Show keyboard shortcuts help

---

## Getting Help

If you need assistance with any feature:

1. Check this documentation for detailed guidance
2. Review the [Getting Started Guide](./GETTING_STARTED.md) for basics
3. See [API Configuration](./API_CONFIGURATION.md) for setup help
4. Consult [Developer Documentation](./DEVELOPER.md) for technical details
5. Open an issue on GitHub with specific questions

---

**Ready to explore?** Start with the Session Browser and work through these features at your own pace!
