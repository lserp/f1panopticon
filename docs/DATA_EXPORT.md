# Data Export Guide

This guide explains all export formats and options available in the F1 Analysis Platform, how to generate reports, and provides examples of exported data.

## Table of Contents

- [Export Overview](#export-overview)
- [Telemetry Data Export](#telemetry-data-export)
- [Visualization Export](#visualization-export)
- [Analysis Results Export](#analysis-results-export)
- [PDF Report Generation](#pdf-report-generation)
- [Batch Export](#batch-export)
- [Export Examples](#export-examples)
- [Best Practices](#best-practices)

## Export Overview

The F1 Analysis Platform supports multiple export formats to suit different use cases:

### Export Types

| Export Type | Formats | Use Case |
|-------------|---------|----------|
| Telemetry Data | CSV, JSON | Further analysis, spreadsheets |
| Visualizations | PNG, SVG | Presentations, reports |
| Correlation Results | CSV | Statistical analysis |
| Strategy Analysis | PDF | Team sharing, reports |
| Complete Sessions | ZIP | Archival, backup |

### Quick Access

Export options are available:
- **Individual Charts**: Click export icon on any chart
- **Current View**: Export button in toolbar
- **Batch Export**: Settings → Export → Batch Operations
- **Reports**: Tools → Generate Report

## Telemetry Data Export

Export raw telemetry data for analysis in external tools.

### CSV Format

**Best For**: Excel, Google Sheets, data analysis tools

#### Features
- Human-readable format
- Compatible with all spreadsheet applications
- Includes headers with column names
- Metadata in separate rows or file

#### Export Process

1. **Select Data**:
   - Navigate to telemetry view
   - Select driver and lap(s)
   - Choose telemetry channels to include

2. **Configure Export**:
   - Click **Export** button
   - Select **CSV** format
   - Choose options:
     - Include metadata (recommended)
     - Decimal precision (default: 3)
     - Delimiter (comma, semicolon, tab)

3. **Export**:
   - Click **Export CSV**
   - Choose save location
   - File downloads automatically

#### CSV Structure

```csv
# Metadata
Session: 2024 Monaco Grand Prix - Qualifying
Driver: VER
Lap: 12
Date: 2024-05-25
Weather: Dry, 24°C
Source: OpenF1 API
Exported: 2024-12-04 10:30:00

# Telemetry Data
Distance,Time,Speed,Throttle,Brake,Gear,RPM
0.0,0.000,285.4,100,0,8,11500
10.5,0.125,287.2,100,0,8,11520
21.0,0.250,289.1,100,0,8,11540
...
```

### JSON Format

**Best For**: Programming, APIs, data pipelines

#### Features
- Structured data format
- Easy to parse programmatically
- Preserves data types
- Nested metadata structure

#### Export Process

1. **Select Data**: Same as CSV
2. **Configure Export**:
   - Select **JSON** format
   - Choose options:
     - Pretty print (readable) or compact
     - Include metadata
     - Array or object format

3. **Export**: Click **Export JSON**

#### JSON Structure

```json
{
  "metadata": {
    "session": {
      "name": "2024 Monaco Grand Prix",
      "type": "Qualifying",
      "date": "2024-05-25",
      "circuit": "Monaco",
      "weather": {
        "condition": "Dry",
        "temperature": 24,
        "humidity": 65
      }
    },
    "driver": {
      "code": "VER",
      "name": "Max Verstappen",
      "team": "Red Bull Racing"
    },
    "lap": 12,
    "source": "OpenF1 API",
    "exported": "2024-12-04T10:30:00Z"
  },
  "telemetry": {
    "distance": [0.0, 10.5, 21.0, ...],
    "time": [0.000, 0.125, 0.250, ...],
    "speed": [285.4, 287.2, 289.1, ...],
    "throttle": [100, 100, 100, ...],
    "brake": [0, 0, 0, ...],
    "gear": [8, 8, 8, ...],
    "rpm": [11500, 11520, 11540, ...]
  },
  "statistics": {
    "lapTime": 72.345,
    "maxSpeed": 312.5,
    "minSpeed": 78.2,
    "avgSpeed": 185.3
  }
}
```

### Metadata Options

Choose what metadata to include:

- **Session Information**: Date, circuit, weather
- **Driver Details**: Name, team, car number
- **Lap Context**: Lap number, tire compound, tire age
- **Data Source**: API provider, fetch timestamp
- **Track Information**: Circuit length, corners, sectors
- **Setup Notes**: Any annotations you've added

### Channel Selection

Select which telemetry channels to export:

**Standard Channels**:
- ✅ Distance (always included)
- ✅ Time (always included)
- ☐ Speed
- ☐ Throttle
- ☐ Brake
- ☐ Gear
- ☐ RPM
- ☐ Steering Angle

**Premium Channels** (if available):
- ☐ DRS Status
- ☐ Energy Recovery
- ☐ Tire Temperature
- ☐ Suspension Travel

## Visualization Export

Export charts and graphs as images for presentations and reports.

### PNG Format

**Best For**: Presentations, documents, web use

#### Features
- Raster image format
- Universal compatibility
- Adjustable resolution
- Transparent or solid background

#### Resolution Options

| Resolution | Dimensions | Use Case |
|------------|------------|----------|
| 1080p | 1920×1080 | Standard presentations |
| 1440p | 2560×1440 | High-quality displays |
| 4K | 3840×2160 | Professional reports |
| Custom | User-defined | Specific requirements |

#### Export Process

1. **Prepare Visualization**:
   - Configure chart as desired
   - Adjust zoom and view
   - Add annotations if needed

2. **Configure Export**:
   - Click export icon on chart
   - Select **PNG** format
   - Choose resolution
   - Select background (transparent/white/black)

3. **Export**:
   - Click **Export PNG**
   - Image downloads automatically
   - Filename: `{session}_{driver}_{lap}_{channel}_{timestamp}.png`

### SVG Format

**Best For**: Vector graphics, scalable images, print

#### Features
- Vector format (infinite scaling)
- Small file size
- Editable in design software
- Perfect for print

#### Export Process

1. **Prepare Visualization**: Same as PNG
2. **Configure Export**:
   - Select **SVG** format
   - Choose to include/exclude:
     - Fonts (embedded or system)
     - Metadata
     - Compression

3. **Export**: Click **Export SVG**

### Export Options

#### Visual Elements
- **Grid Lines**: Include or exclude
- **Axis Labels**: Show or hide
- **Legend**: Include or exclude
- **Title**: Add custom title
- **Annotations**: Include user notes

#### Styling
- **Color Scheme**: Match application theme or custom
- **Font Size**: Adjust for readability
- **Line Width**: Thicker for presentations
- **Markers**: Show data points or smooth lines

## Analysis Results Export

Export correlation analysis and statistical results.

### Correlation Export

**Format**: CSV with correlation coefficients

#### Structure

```csv
# Correlation Analysis Results
Session: 2024 Monaco Grand Prix - Qualifying
Driver: VER
Laps Analyzed: 15
Target Variable: Lap Time
Analysis Date: 2024-12-04

Parameter,Correlation Coefficient,P-Value,Confidence Interval Lower,Confidence Interval Upper,Sample Size
Minimum Corner Speed,-0.847,0.001,-0.912,-0.723,15
Time on Brakes,0.623,0.013,0.412,0.781,15
Full Throttle Time,-0.556,0.031,-0.742,-0.289,15
Peak Brake Pressure,0.234,0.401,-0.156,0.567,15
Average Gear,0.089,0.753,-0.298,0.445,15
```

#### Export Process

1. **Complete Analysis**: Run correlation analysis
2. **Review Results**: Verify results are correct
3. **Export**:
   - Click **Export Results**
   - Select **CSV** format
   - Choose to include:
     - Statistical confidence metrics
     - Scatter plot data
     - Raw data points

### Strategy Analysis Export

**Format**: CSV with strategy data

#### Structure

```csv
# Strategy Analysis
Session: 2024 Monaco Grand Prix - Race
Driver: VER
Analysis Date: 2024-12-04

Lap,Tire Compound,Tire Age,Lap Time,Degradation Rate,Position,Gap to Leader
1,Soft,0,78.234,0.000,1,0.000
2,Soft,1,77.891,0.343,1,0.000
3,Soft,2,78.012,-0.121,1,0.000
...
18,Medium,0,77.456,0.000,1,2.345
19,Medium,1,77.623,-0.167,1,2.512
...

# Pit Stops
Lap,Duration,Tire In,Tire Out,Position Before,Position After,Time Lost
17,2.3,Soft,Medium,1,3,22.5
```

## PDF Report Generation

Create comprehensive reports combining visualizations and analysis.

### Report Types

#### Quick Report
- **Contents**: Key visualizations and summary
- **Pages**: 2-4 pages
- **Generation Time**: < 30 seconds
- **Best For**: Quick sharing

#### Detailed Report
- **Contents**: All visualizations, full analysis, statistics
- **Pages**: 10-20 pages
- **Generation Time**: 1-2 minutes
- **Best For**: Comprehensive documentation

#### Custom Report
- **Contents**: User-selected sections
- **Pages**: Variable
- **Generation Time**: Variable
- **Best For**: Specific requirements

### Report Sections

Available sections to include:

1. **Cover Page**
   - Session information
   - Date and time
   - Author/team name
   - Custom logo

2. **Executive Summary**
   - Key findings
   - Performance highlights
   - Recommendations

3. **Telemetry Analysis**
   - Speed traces
   - Throttle/brake analysis
   - Gear selection
   - Track map with highlights

4. **Performance Comparison**
   - Driver comparison charts
   - Lap time analysis
   - Sector breakdown
   - Gap analysis

5. **Strategy Analysis**
   - Strategy timeline
   - Pit stop analysis
   - Tire degradation
   - Alternative strategies

6. **Statistical Summary**
   - Lap time statistics
   - Consistency metrics
   - Correlation results
   - Performance trends

7. **Annotations**
   - User notes
   - Observations
   - Recommendations
   - Action items

8. **Appendix**
   - Raw data tables
   - Methodology
   - Data sources
   - Glossary

### Generating a Report

#### Step 1: Select Report Type

1. Navigate to **Tools → Generate Report**
2. Choose report type:
   - Quick Report
   - Detailed Report
   - Custom Report

#### Step 2: Configure Report

For Custom Reports:
1. Select sections to include
2. Choose visualizations
3. Add custom text/annotations
4. Configure layout

#### Step 3: Customize Appearance

1. **Layout**:
   - Page size (A4, Letter, Legal)
   - Orientation (Portrait, Landscape)
   - Margins

2. **Branding**:
   - Add team logo
   - Custom color scheme
   - Header/footer text

3. **Content**:
   - Chart resolution
   - Table formatting
   - Font sizes

#### Step 4: Generate

1. Click **Generate Report**
2. Wait for processing (progress bar shown)
3. Preview report
4. Download PDF

### Report Example Structure

```
┌─────────────────────────────────────┐
│         COVER PAGE                  │
│  F1 Analysis Platform Report        │
│  2024 Monaco Grand Prix             │
│  Qualifying Analysis                │
│  Generated: 2024-12-04              │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│      EXECUTIVE SUMMARY              │
│  • Fastest lap: 1:10.234            │
│  • Key finding: Strong sector 2     │
│  • Recommendation: Optimize S3      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│     TELEMETRY ANALYSIS              │
│  [Speed Trace Chart]                │
│  [Throttle/Brake Chart]             │
│  [Track Map]                        │
└─────────────────────────────────────┘

... (additional sections)
```

## Batch Export

Export multiple laps or sessions at once.

### Batch Telemetry Export

Export multiple laps in one operation:

1. **Select Sessions/Laps**:
   - Navigate to Session Browser
   - Select multiple sessions or laps
   - Use Ctrl+Click or Shift+Click

2. **Configure Batch Export**:
   - Choose format (CSV or JSON)
   - Select channels
   - Configure naming convention

3. **Export**:
   - Click **Batch Export**
   - All files download as ZIP
   - Organized folder structure

### Folder Structure

```
export_2024-12-04_103000.zip
├── metadata.json
├── 2024_Monaco_Qualifying/
│   ├── VER_lap_12.csv
│   ├── VER_lap_13.csv
│   ├── VER_lap_14.csv
│   └── session_info.json
├── 2024_Monaco_Race/
│   ├── VER_lap_1.csv
│   ├── VER_lap_2.csv
│   └── session_info.json
└── README.txt
```

### Naming Conventions

Choose from preset naming patterns:

- **Descriptive**: `2024_Monaco_Qualifying_VER_Lap12.csv`
- **Compact**: `MON_Q_VER_12.csv`
- **Sequential**: `export_001.csv`, `export_002.csv`
- **Custom**: Define your own pattern

## Export Examples

### Example 1: Telemetry for Excel Analysis

**Goal**: Export lap data for statistical analysis in Excel

**Steps**:
1. Select lap in telemetry view
2. Click Export → CSV
3. Include all channels
4. Include metadata
5. Open in Excel
6. Create pivot tables and charts

**Result**: `2024_Monaco_Q_VER_Lap12.csv` ready for Excel

### Example 2: Chart for Presentation

**Goal**: High-quality chart for PowerPoint

**Steps**:
1. Configure chart with desired view
2. Add annotations
3. Export → PNG
4. Select 1440p resolution
5. Transparent background
6. Insert into PowerPoint

**Result**: `speed_trace_1440p.png` ready for slides

### Example 3: Complete Session Report

**Goal**: PDF report for team meeting

**Steps**:
1. Complete analysis of session
2. Add annotations and notes
3. Tools → Generate Report
4. Select Detailed Report
5. Add team logo
6. Generate and download

**Result**: `2024_Monaco_Qualifying_Report.pdf` ready to share

### Example 4: Correlation Data for Python

**Goal**: Export correlation results for machine learning

**Steps**:
1. Run correlation analysis
2. Export Results → CSV
3. Include all statistical metrics
4. Load in Python with pandas
5. Use for ML model training

**Result**: `correlation_results.csv` ready for Python

## Best Practices

### File Organization

**Recommended Structure**:
```
F1_Analysis_Exports/
├── 2024/
│   ├── Monaco/
│   │   ├── Qualifying/
│   │   │   ├── telemetry/
│   │   │   ├── visualizations/
│   │   │   └── reports/
│   │   └── Race/
│   └── Silverstone/
└── 2023/
```

### Naming Conventions

**Best Practices**:
- Include date in ISO format (YYYY-MM-DD)
- Use consistent abbreviations
- Include session type
- Add driver code
- Use descriptive names
- Avoid special characters

**Good**: `2024-05-25_Monaco_Q_VER_Lap12_Speed.csv`
**Bad**: `export (1).csv`

### Metadata Management

**Always Include**:
- Session date and time
- Data source and fetch time
- Driver and team information
- Weather conditions
- Tire compound and age
- Any relevant notes

### Version Control

**For Important Exports**:
- Add version numbers
- Include export date
- Document any processing
- Keep original raw data
- Track changes in README

### Storage Recommendations

**File Sizes** (approximate):
- Single lap CSV: 100-500 KB
- Single lap JSON: 200-800 KB
- PNG chart (1080p): 200-500 KB
- SVG chart: 50-200 KB
- PDF report: 2-10 MB
- Batch export ZIP: 5-50 MB

**Storage Tips**:
- Compress old exports
- Archive to external drive
- Use cloud storage for sharing
- Delete unnecessary exports
- Keep only final versions

### Sharing Exports

**For Team Sharing**:
- Use PDF reports for non-technical audience
- Share CSV for engineers who want to analyze
- Include README with context
- Compress large batches
- Use secure file sharing

**For Public Sharing**:
- Remove sensitive information
- Include proper attribution
- Add license information
- Provide context and methodology
- Consider privacy implications

## Troubleshooting

### Issue: Export Fails

**Solutions**:
- Check available disk space
- Try smaller resolution
- Export fewer channels
- Close other applications
- Try different format

### Issue: Large File Sizes

**Solutions**:
- Reduce resolution for images
- Export fewer channels
- Use CSV instead of JSON
- Compress with ZIP
- Reduce decimal precision

### Issue: Missing Metadata

**Solutions**:
- Ensure "Include Metadata" is checked
- Verify session data is complete
- Re-fetch session if needed
- Check data source availability

### Issue: Corrupted Export

**Solutions**:
- Re-export the data
- Try different format
- Check disk space
- Verify file integrity
- Clear browser cache

## Quick Reference

### Export Shortcuts

- **Ctrl+E**: Export current view
- **Ctrl+Shift+E**: Batch export
- **Ctrl+P**: Generate PDF report
- **Ctrl+S**: Save current configuration

### Format Comparison

| Format | Size | Compatibility | Editability | Best For |
|--------|------|---------------|-------------|----------|
| CSV | Small | Universal | High | Data analysis |
| JSON | Medium | Programming | High | APIs, code |
| PNG | Medium | Universal | Low | Presentations |
| SVG | Small | Design tools | High | Print, scaling |
| PDF | Large | Universal | Low | Reports, sharing |

---

**Ready to export?** Start with simple CSV exports and progress to comprehensive PDF reports as you become familiar with the options!
