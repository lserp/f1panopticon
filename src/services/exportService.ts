/**
 * Export Service
 * Handles exporting telemetry data and analysis results to various formats
 */

import type { LapData, SessionData, WeatherData, APIProvider } from '../types';

/**
 * Metadata included with all exports
 */
export interface ExportMetadata {
  exportedAt: Date;
  sessionId: string;
  sessionDate: Date;
  circuitName: string;
  sessionType: string;
  dataSource: APIProvider;
  dataFetchedAt: Date;
  weather?: WeatherData;
}

/**
 * Telemetry export data structure
 */
export interface TelemetryExport {
  metadata: ExportMetadata;
  lapData: LapData[];
}

/**
 * Correlation analysis result for export
 */
export interface CorrelationExportData {
  metadata: ExportMetadata;
  correlations: CorrelationExportResult[];
}

export interface CorrelationExportResult {
  parameter: string;
  correlationCoefficient: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  pValue: number;
  sampleSize: number;
}

/**
 * Export Service Class
 */
export class ExportService {
  /**
   * Export telemetry data to CSV format
   */
  exportTelemetryToCSV(data: TelemetryExport): string {
    const lines: string[] = [];

    // Add metadata header
    lines.push('# Metadata');
    lines.push(`# Exported At: ${data.metadata.exportedAt.toISOString()}`);
    lines.push(`# Session ID: ${data.metadata.sessionId}`);
    lines.push(`# Session Date: ${data.metadata.sessionDate.toISOString()}`);
    lines.push(`# Circuit: ${data.metadata.circuitName}`);
    lines.push(`# Session Type: ${data.metadata.sessionType}`);
    lines.push(`# Data Source: ${data.metadata.dataSource}`);
    lines.push(`# Data Fetched At: ${data.metadata.dataFetchedAt.toISOString()}`);

    if (data.metadata.weather) {
      lines.push(`# Air Temperature: ${data.metadata.weather.airTemp}°C`);
      lines.push(`# Track Temperature: ${data.metadata.weather.trackTemp}°C`);
      lines.push(`# Humidity: ${data.metadata.weather.humidity}%`);
      lines.push(`# Pressure: ${data.metadata.weather.pressure} mbar`);
      lines.push(`# Wind Speed: ${data.metadata.weather.windSpeed} m/s`);
      lines.push(`# Wind Direction: ${data.metadata.weather.windDirection} degrees`);
      lines.push(`# Rainfall: ${data.metadata.weather.rainfall}`);
    }

    lines.push('');

    // Add telemetry data header
    lines.push(
      'Lap Number,Driver ID,Lap Time,Sector 1,Sector 2,Sector 3,Tire Compound,Tire Age,Fuel Load,Track Status,Distance,Time,Speed,Throttle,Brake,Gear,RPM,DRS,N Gear'
    );

    // Add telemetry data rows
    for (const lap of data.lapData) {
      const telemetry = lap.telemetry;
      const dataPoints = telemetry.distance.length;

      // Handle empty telemetry by adding at least one row with lap metadata
      if (dataPoints === 0) {
        const row = [
          lap.lapNumber,
          lap.driverId,
          lap.lapTime,
          lap.sector1Time,
          lap.sector2Time,
          lap.sector3Time,
          lap.tireCompound,
          lap.tireAge,
          lap.fuelLoad,
          lap.trackStatus,
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '', // Empty telemetry values
        ];
        lines.push(row.join(','));
      } else {
        for (let i = 0; i < dataPoints; i++) {
          const row = [
            lap.lapNumber,
            lap.driverId,
            lap.lapTime,
            lap.sector1Time,
            lap.sector2Time,
            lap.sector3Time,
            lap.tireCompound,
            lap.tireAge,
            lap.fuelLoad,
            lap.trackStatus,
            telemetry.distance[i],
            telemetry.time[i],
            telemetry.speed[i],
            telemetry.throttle[i],
            telemetry.brake[i],
            telemetry.gear[i],
            telemetry.rpm[i],
            telemetry.drs[i],
            telemetry.nGear[i],
          ];
          lines.push(row.join(','));
        }
      }
    }

    return lines.join('\n');
  }

  /**
   * Export telemetry data to JSON format
   */
  exportTelemetryToJSON(data: TelemetryExport): string {
    return JSON.stringify(data, null, 2);
  }

  /**
   * Parse CSV telemetry data back to TelemetryExport format
   */
  parseTelemetryFromCSV(csv: string): TelemetryExport {
    const lines = csv.split('\n');
    let lineIndex = 0;

    // Parse metadata
    const metadata: Partial<ExportMetadata> = {};
    const weather: Partial<WeatherData> = {};

    while (lineIndex < lines.length && lines[lineIndex].startsWith('#')) {
      const line = lines[lineIndex].trim();

      if (line.includes('Exported At:')) {
        metadata.exportedAt = new Date(line.split('Exported At: ')[1]);
      } else if (line.includes('Session ID:')) {
        metadata.sessionId = line.split('Session ID: ')[1];
      } else if (line.includes('Session Date:')) {
        metadata.sessionDate = new Date(line.split('Session Date: ')[1]);
      } else if (line.includes('Circuit:')) {
        metadata.circuitName = line.split('Circuit: ')[1];
      } else if (line.includes('Session Type:')) {
        metadata.sessionType = line.split('Session Type: ')[1];
      } else if (line.includes('Data Source:')) {
        metadata.dataSource = line.split('Data Source: ')[1] as APIProvider;
      } else if (line.includes('Data Fetched At:')) {
        metadata.dataFetchedAt = new Date(line.split('Data Fetched At: ')[1]);
      } else if (line.includes('Air Temperature:')) {
        weather.airTemp = parseFloat(line.split('Air Temperature: ')[1]);
      } else if (line.includes('Track Temperature:')) {
        weather.trackTemp = parseFloat(line.split('Track Temperature: ')[1]);
      } else if (line.includes('Humidity:')) {
        weather.humidity = parseFloat(line.split('Humidity: ')[1]);
      } else if (line.includes('Pressure:')) {
        weather.pressure = parseFloat(line.split('Pressure: ')[1]);
      } else if (line.includes('Wind Speed:')) {
        weather.windSpeed = parseFloat(line.split('Wind Speed: ')[1]);
      } else if (line.includes('Wind Direction:')) {
        weather.windDirection = parseFloat(line.split('Wind Direction: ')[1]);
      } else if (line.includes('Rainfall:')) {
        weather.rainfall = line.split('Rainfall: ')[1] === 'true';
      }

      lineIndex++;
    }

    // Skip empty lines
    while (lineIndex < lines.length && lines[lineIndex].trim() === '') {
      lineIndex++;
    }

    // Skip header line
    lineIndex++;

    // Parse telemetry data
    const lapDataMap = new Map<string, LapData>();

    while (lineIndex < lines.length) {
      const line = lines[lineIndex].trim();
      if (!line) {
        lineIndex++;
        continue;
      }

      const values = line.split(',');
      const lapNumber = parseInt(values[0]);
      const driverId = values[1];
      const lapKey = `${driverId}-${lapNumber}`;

      if (!lapDataMap.has(lapKey)) {
        lapDataMap.set(lapKey, {
          sessionId: metadata.sessionId!,
          lapNumber,
          driverId,
          lapTime: parseFloat(values[2]),
          sector1Time: parseFloat(values[3]),
          sector2Time: parseFloat(values[4]),
          sector3Time: parseFloat(values[5]),
          tireCompound: values[6],
          tireAge: parseInt(values[7]),
          fuelLoad: parseFloat(values[8]),
          trackStatus: values[9] as 'green' | 'yellow' | 'red',
          telemetry: {
            distance: [],
            time: [],
            speed: [],
            throttle: [],
            brake: [],
            gear: [],
            rpm: [],
            drs: [],
            nGear: [],
          },
        });
      }

      const lap = lapDataMap.get(lapKey)!;

      // Only add telemetry data if values are present (not empty strings)
      if (values[10] !== '') {
        lap.telemetry.distance.push(parseFloat(values[10]));
        lap.telemetry.time.push(parseFloat(values[11]));
        lap.telemetry.speed.push(parseFloat(values[12]));
        lap.telemetry.throttle.push(parseFloat(values[13]));
        lap.telemetry.brake.push(parseFloat(values[14]));
        lap.telemetry.gear.push(parseInt(values[15]));
        lap.telemetry.rpm.push(parseFloat(values[16]));
        lap.telemetry.drs.push(parseFloat(values[17]));
        lap.telemetry.nGear.push(parseFloat(values[18]));
      }

      lineIndex++;
    }

    return {
      metadata: {
        ...metadata,
        weather: Object.keys(weather).length > 0 ? (weather as WeatherData) : undefined,
      } as ExportMetadata,
      lapData: Array.from(lapDataMap.values()),
    };
  }

  /**
   * Parse JSON telemetry data back to TelemetryExport format
   */
  parseTelemetryFromJSON(json: string): TelemetryExport {
    const parsed = JSON.parse(json);

    // Convert date strings back to Date objects
    return {
      metadata: {
        ...parsed.metadata,
        exportedAt: new Date(parsed.metadata.exportedAt),
        sessionDate: new Date(parsed.metadata.sessionDate),
        dataFetchedAt: new Date(parsed.metadata.dataFetchedAt),
      },
      lapData: parsed.lapData,
    };
  }

  /**
   * Create metadata from session data
   */
  createMetadata(session: SessionData): ExportMetadata {
    return {
      exportedAt: new Date(),
      sessionId: session.id,
      sessionDate: session.date,
      circuitName: session.circuitName,
      sessionType: session.sessionType,
      dataSource: session.source,
      dataFetchedAt: session.fetchedAt,
      weather: session.weather,
    };
  }

  /**
   * Export correlation analysis to CSV
   */
  exportCorrelationToCSV(data: CorrelationExportData): string {
    const lines: string[] = [];

    // Add metadata header
    lines.push('# Metadata');
    lines.push(`# Exported At: ${data.metadata.exportedAt.toISOString()}`);
    lines.push(`# Session ID: ${data.metadata.sessionId}`);
    lines.push(`# Session Date: ${data.metadata.sessionDate.toISOString()}`);
    lines.push(`# Circuit: ${data.metadata.circuitName}`);
    lines.push(`# Session Type: ${data.metadata.sessionType}`);
    lines.push(`# Data Source: ${data.metadata.dataSource}`);
    lines.push(`# Data Fetched At: ${data.metadata.dataFetchedAt.toISOString()}`);
    lines.push('');

    // Add correlation data header
    lines.push(
      'Parameter,Correlation Coefficient,Confidence Interval Lower,Confidence Interval Upper,P-Value,Sample Size'
    );

    // Add correlation data rows
    for (const corr of data.correlations) {
      const row = [
        corr.parameter,
        corr.correlationCoefficient,
        corr.confidenceInterval.lower,
        corr.confidenceInterval.upper,
        corr.pValue,
        corr.sampleSize,
      ];
      lines.push(row.join(','));
    }

    return lines.join('\n');
  }

  /**
   * Parse correlation CSV back to CorrelationExportData format
   */
  parseCorrelationFromCSV(csv: string): CorrelationExportData {
    const lines = csv.split('\n');
    let lineIndex = 0;

    // Parse metadata
    const metadata: Partial<ExportMetadata> = {};

    while (lineIndex < lines.length && lines[lineIndex].startsWith('#')) {
      const line = lines[lineIndex].trim();

      if (line.includes('Exported At:')) {
        metadata.exportedAt = new Date(line.split('Exported At: ')[1]);
      } else if (line.includes('Session ID:')) {
        metadata.sessionId = line.split('Session ID: ')[1];
      } else if (line.includes('Session Date:')) {
        metadata.sessionDate = new Date(line.split('Session Date: ')[1]);
      } else if (line.includes('Circuit:')) {
        metadata.circuitName = line.split('Circuit: ')[1];
      } else if (line.includes('Session Type:')) {
        metadata.sessionType = line.split('Session Type: ')[1];
      } else if (line.includes('Data Source:')) {
        metadata.dataSource = line.split('Data Source: ')[1] as APIProvider;
      } else if (line.includes('Data Fetched At:')) {
        metadata.dataFetchedAt = new Date(line.split('Data Fetched At: ')[1]);
      }

      lineIndex++;
    }

    // Skip empty lines
    while (lineIndex < lines.length && lines[lineIndex].trim() === '') {
      lineIndex++;
    }

    // Skip header line
    lineIndex++;

    // Parse correlation data
    const correlations: CorrelationExportResult[] = [];

    while (lineIndex < lines.length) {
      const line = lines[lineIndex].trim();
      if (!line) {
        lineIndex++;
        continue;
      }

      const values = line.split(',');
      correlations.push({
        parameter: values[0],
        correlationCoefficient: parseFloat(values[1]),
        confidenceInterval: {
          lower: parseFloat(values[2]),
          upper: parseFloat(values[3]),
        },
        pValue: parseFloat(values[4]),
        sampleSize: parseInt(values[5]),
      });

      lineIndex++;
    }

    return {
      metadata: metadata as ExportMetadata,
      correlations,
    };
  }

  /**
   * Export chart to PNG format
   * Uses Plotly's built-in toImage functionality
   */
  async exportChartToPNG(
    plotlyDiv: HTMLElement,
    options: {
      width?: number;
      height?: number;
      filename?: string;
    } = {}
  ): Promise<Blob> {
    const { width = 1920, height = 1080 } = options;

    // Use Plotly's toImage to export
    const Plotly = (window as any).Plotly;
    if (!Plotly) {
      throw new Error('Plotly is not loaded');
    }

    const imageDataUrl = await Plotly.toImage(plotlyDiv, {
      format: 'png',
      width,
      height,
    });

    // Convert data URL to Blob
    const response = await fetch(imageDataUrl);
    return response.blob();
  }

  /**
   * Export chart to SVG format
   * Uses Plotly's built-in toImage functionality
   */
  async exportChartToSVG(
    plotlyDiv: HTMLElement,
    options: {
      width?: number;
      height?: number;
      filename?: string;
    } = {}
  ): Promise<Blob> {
    const { width = 1920, height = 1080 } = options;

    // Use Plotly's toImage to export
    const Plotly = (window as any).Plotly;
    if (!Plotly) {
      throw new Error('Plotly is not loaded');
    }

    const svgString = await Plotly.toImage(plotlyDiv, {
      format: 'svg',
      width,
      height,
    });

    // Convert SVG string to Blob
    return new Blob([svgString], { type: 'image/svg+xml' });
  }

  /**
   * Batch export multiple laps/sessions
   * Returns a map of filenames to blobs
   */
  async batchExportTelemetry(
    exports: Array<{
      data: TelemetryExport;
      format: 'csv' | 'json';
      filename: string;
    }>
  ): Promise<Map<string, Blob>> {
    const results = new Map<string, Blob>();

    for (const exportItem of exports) {
      let content: string;

      if (exportItem.format === 'csv') {
        content = this.exportTelemetryToCSV(exportItem.data);
      } else {
        content = this.exportTelemetryToJSON(exportItem.data);
      }

      const blob = new Blob([content], {
        type: exportItem.format === 'csv' ? 'text/csv' : 'application/json',
      });

      results.set(exportItem.filename, blob);
    }

    return results;
  }

  /**
   * Batch export multiple charts
   * Returns a map of filenames to blobs
   */
  async batchExportCharts(
    charts: Array<{
      element: HTMLElement;
      format: 'png' | 'svg';
      filename: string;
      width?: number;
      height?: number;
    }>
  ): Promise<Map<string, Blob>> {
    const results = new Map<string, Blob>();

    for (const chart of charts) {
      let blob: Blob;

      if (chart.format === 'png') {
        blob = await this.exportChartToPNG(chart.element, {
          width: chart.width,
          height: chart.height,
          filename: chart.filename,
        });
      } else {
        blob = await this.exportChartToSVG(chart.element, {
          width: chart.width,
          height: chart.height,
          filename: chart.filename,
        });
      }

      results.set(chart.filename, blob);
    }

    return results;
  }

  /**
   * Download a blob as a file
   */
  downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Download multiple files as a ZIP (requires JSZip library)
   * For now, downloads files individually
   */
  async downloadMultipleFiles(files: Map<string, Blob>): Promise<void> {
    for (const [filename, blob] of files.entries()) {
      this.downloadBlob(blob, filename);
      // Add small delay between downloads to avoid browser blocking
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  /**
   * Generate PDF report combining visualizations and summaries
   * Note: This is a basic implementation. For production use, consider using
   * a library like jsPDF or pdfmake for more advanced features.
   */
  async generatePDFReport(options: {
    title: string;
    summary: string;
    charts: Array<{
      title: string;
      imageDataUrl: string;
      width?: number;
      height?: number;
    }>;
    annotations?: string[];
    metadata?: ExportMetadata;
  }): Promise<Blob> {
    // This is a placeholder implementation
    // In a real implementation, you would use jsPDF or similar library

    // For now, create an HTML-based report that can be printed to PDF
    const html = this.generateHTMLReport(options);

    // Convert HTML to Blob
    return new Blob([html], { type: 'text/html' });
  }

  /**
   * Generate HTML report that can be printed to PDF
   */
  private generateHTMLReport(options: {
    title: string;
    summary: string;
    charts: Array<{
      title: string;
      imageDataUrl: string;
      width?: number;
      height?: number;
    }>;
    annotations?: string[];
    metadata?: ExportMetadata;
  }): string {
    const { title, summary, charts, annotations = [], metadata } = options;

    let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 40px;
      color: #333;
    }
    h1 {
      color: #e10600;
      border-bottom: 3px solid #e10600;
      padding-bottom: 10px;
    }
    h2 {
      color: #333;
      margin-top: 30px;
    }
    .metadata {
      background-color: #f5f5f5;
      padding: 15px;
      border-radius: 5px;
      margin: 20px 0;
    }
    .metadata p {
      margin: 5px 0;
    }
    .summary {
      margin: 20px 0;
      line-height: 1.6;
    }
    .chart {
      margin: 30px 0;
      page-break-inside: avoid;
    }
    .chart img {
      max-width: 100%;
      height: auto;
      border: 1px solid #ddd;
      border-radius: 5px;
    }
    .chart h3 {
      margin-bottom: 10px;
    }
    .annotations {
      margin: 20px 0;
      padding: 15px;
      background-color: #fff9e6;
      border-left: 4px solid #ffc107;
    }
    .annotations h3 {
      margin-top: 0;
    }
    .annotations ul {
      margin: 10px 0;
    }
    @media print {
      body {
        margin: 20px;
      }
      .chart {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <h1>${title}</h1>
`;

    // Add metadata if provided
    if (metadata) {
      html += `
  <div class="metadata">
    <h2>Session Information</h2>
    <p><strong>Circuit:</strong> ${metadata.circuitName}</p>
    <p><strong>Session Type:</strong> ${metadata.sessionType}</p>
    <p><strong>Session Date:</strong> ${metadata.sessionDate.toLocaleDateString()}</p>
    <p><strong>Data Source:</strong> ${metadata.dataSource}</p>
    <p><strong>Report Generated:</strong> ${metadata.exportedAt.toLocaleString()}</p>
  </div>
`;
    }

    // Add summary
    html += `
  <div class="summary">
    <h2>Summary</h2>
    <p>${summary}</p>
  </div>
`;

    // Add charts
    if (charts.length > 0) {
      html += `
  <h2>Visualizations</h2>
`;
      for (const chart of charts) {
        html += `
  <div class="chart">
    <h3>${chart.title}</h3>
    <img src="${chart.imageDataUrl}" alt="${chart.title}" />
  </div>
`;
      }
    }

    // Add annotations if provided
    if (annotations.length > 0) {
      html += `
  <div class="annotations">
    <h3>Annotations</h3>
    <ul>
`;
      for (const annotation of annotations) {
        html += `      <li>${annotation}</li>\n`;
      }
      html += `
    </ul>
  </div>
`;
    }

    html += `
</body>
</html>
`;

    return html;
  }
}

// Export singleton instance
export const exportService = new ExportService();
