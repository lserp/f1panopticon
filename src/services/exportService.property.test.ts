/**
 * Property-based tests for Export Service
 * Tests universal properties that should hold across all inputs
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  ExportService,
  type TelemetryExport,
  type CorrelationExportData,
  type ExportMetadata,
  type CorrelationExportResult,
} from './exportService';
import type { LapData, TelemetryData, APIProvider, WeatherData } from '../types';

const exportService = new ExportService();

// Arbitraries for generating test data

const apiProviderArb = fc.constantFrom<APIProvider>('fastf1', 'ergast', 'openf1');

const trackStatusArb = fc.constantFrom<'green' | 'yellow' | 'red'>('green', 'yellow', 'red');

const weatherDataArb: fc.Arbitrary<WeatherData> = fc.record({
  airTemp: fc.float({ min: -10, max: 50, noNaN: true }),
  trackTemp: fc.float({ min: 0, max: 70, noNaN: true }),
  humidity: fc.float({ min: 0, max: 100, noNaN: true }),
  pressure: fc.float({ min: 900, max: 1100, noNaN: true }),
  windSpeed: fc.float({ min: 0, max: 30, noNaN: true }),
  windDirection: fc.float({ min: 0, max: 360, noNaN: true }),
  rainfall: fc.boolean(),
});

const telemetryDataArb: fc.Arbitrary<TelemetryData> = fc.nat({ max: 100 }).chain((length) =>
  fc.record({
    distance: fc.array(fc.float({ min: 0, max: 6000, noNaN: true }), {
      minLength: length,
      maxLength: length,
    }),
    time: fc.array(fc.float({ min: 0, max: 200, noNaN: true }), {
      minLength: length,
      maxLength: length,
    }),
    speed: fc.array(fc.float({ min: 0, max: 350, noNaN: true }), {
      minLength: length,
      maxLength: length,
    }),
    throttle: fc.array(fc.float({ min: 0, max: 100, noNaN: true }), {
      minLength: length,
      maxLength: length,
    }),
    brake: fc.array(fc.float({ min: 0, max: 100, noNaN: true }), {
      minLength: length,
      maxLength: length,
    }),
    gear: fc.array(fc.integer({ min: 1, max: 8 }), {
      minLength: length,
      maxLength: length,
    }),
    rpm: fc.array(fc.float({ min: 0, max: 20000, noNaN: true }), {
      minLength: length,
      maxLength: length,
    }),
    drs: fc.array(fc.float({ min: 0, max: 14, noNaN: true }), {
      minLength: length,
      maxLength: length,
    }),
    nGear: fc.array(fc.float({ min: 0, max: 1, noNaN: true }), {
      minLength: length,
      maxLength: length,
    }),
  })
);

const lapDataArb: fc.Arbitrary<LapData> = fc.record({
  sessionId: fc.uuid(),
  lapNumber: fc.integer({ min: 1, max: 70 }),
  driverId: fc.constantFrom('VER', 'HAM', 'LEC', 'NOR', 'PER'),
  lapTime: fc.float({ min: 60, max: 150, noNaN: true }),
  sector1Time: fc.float({ min: 15, max: 40, noNaN: true }),
  sector2Time: fc.float({ min: 15, max: 40, noNaN: true }),
  sector3Time: fc.float({ min: 15, max: 40, noNaN: true }),
  tireCompound: fc.constantFrom('SOFT', 'MEDIUM', 'HARD', 'INTERMEDIATE', 'WET'),
  tireAge: fc.integer({ min: 0, max: 50 }),
  fuelLoad: fc.float({ min: 0, max: 110, noNaN: true }),
  trackStatus: trackStatusArb,
  telemetry: telemetryDataArb,
});

// Generate valid dates (not NaN)
const validDateArb = fc.date().filter((d) => !Number.isNaN(d.getTime()));

const exportMetadataArb: fc.Arbitrary<ExportMetadata> = fc.record({
  exportedAt: validDateArb,
  sessionId: fc.uuid(),
  sessionDate: validDateArb,
  circuitName: fc.constantFrom('Monaco', 'Silverstone', 'Monza', 'Spa-Francorchamps', 'Suzuka'),
  sessionType: fc.constantFrom('practice', 'qualifying', 'race', 'sprint'),
  dataSource: apiProviderArb,
  dataFetchedAt: validDateArb,
  weather: fc.option(weatherDataArb, { nil: undefined }),
});

const telemetryExportArb: fc.Arbitrary<TelemetryExport> = exportMetadataArb.chain((metadata) =>
  fc.array(lapDataArb, { minLength: 1, maxLength: 5 }).map((lapData) => {
    // Ensure unique driver + lap number combinations
    const seen = new Set<string>();
    const uniqueLaps = lapData.filter((lap) => {
      const key = `${lap.driverId}-${lap.lapNumber}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // If all laps were duplicates, keep at least one
    const finalLaps = uniqueLaps.length > 0 ? uniqueLaps : [lapData[0]];

    return {
      metadata,
      lapData: finalLaps.map((lap) => ({
        ...lap,
        sessionId: metadata.sessionId,
      })),
    };
  })
);

const correlationResultArb: fc.Arbitrary<CorrelationExportResult> = fc.record({
  parameter: fc.constantFrom('speed', 'throttle', 'brake', 'gear', 'rpm'),
  correlationCoefficient: fc.float({ min: -1, max: 1, noNaN: true }),
  confidenceInterval: fc.record({
    lower: fc.float({ min: -1, max: 1, noNaN: true }),
    upper: fc.float({ min: -1, max: 1, noNaN: true }),
  }),
  pValue: fc.float({ min: 0, max: 1, noNaN: true }),
  sampleSize: fc.integer({ min: 10, max: 1000 }),
});

// Metadata without weather for correlation exports
const correlationMetadataArb: fc.Arbitrary<ExportMetadata> = fc.record({
  exportedAt: validDateArb,
  sessionId: fc.uuid(),
  sessionDate: validDateArb,
  circuitName: fc.constantFrom('Monaco', 'Silverstone', 'Monza', 'Spa-Francorchamps', 'Suzuka'),
  sessionType: fc.constantFrom('practice', 'qualifying', 'race', 'sprint'),
  dataSource: apiProviderArb,
  dataFetchedAt: validDateArb,
  weather: fc.constant(undefined),
});

const correlationExportDataArb: fc.Arbitrary<CorrelationExportData> = fc.record({
  metadata: correlationMetadataArb,
  correlations: fc.array(correlationResultArb, { minLength: 1, maxLength: 10 }),
});

// Helper function to compare telemetry data with tolerance
function compareTelemetryData(actual: TelemetryData, expected: TelemetryData): boolean {
  const tolerance = 0.0001;

  if (actual.distance.length !== expected.distance.length) return false;

  for (let i = 0; i < actual.distance.length; i++) {
    if (Math.abs(actual.distance[i] - expected.distance[i]) > tolerance) return false;
    if (Math.abs(actual.time[i] - expected.time[i]) > tolerance) return false;
    if (Math.abs(actual.speed[i] - expected.speed[i]) > tolerance) return false;
    if (Math.abs(actual.throttle[i] - expected.throttle[i]) > tolerance) return false;
    if (Math.abs(actual.brake[i] - expected.brake[i]) > tolerance) return false;
    if (actual.gear[i] !== expected.gear[i]) return false;
    if (Math.abs(actual.rpm[i] - expected.rpm[i]) > tolerance) return false;
    if (Math.abs(actual.drs[i] - expected.drs[i]) > tolerance) return false;
    if (Math.abs(actual.nGear[i] - expected.nGear[i]) > tolerance) return false;
  }

  return true;
}

// Helper function to compare numbers with NaN support
function compareNumbers(a: number, b: number, tolerance: number): boolean {
  if (Number.isNaN(a) && Number.isNaN(b)) return true;
  if (Number.isNaN(a) || Number.isNaN(b)) return false;
  return Math.abs(a - b) < tolerance;
}

// Helper function to compare lap data
function compareLapData(actual: LapData, expected: LapData): boolean {
  const tolerance = 0.0001;

  return (
    actual.sessionId === expected.sessionId &&
    actual.lapNumber === expected.lapNumber &&
    actual.driverId === expected.driverId &&
    compareNumbers(actual.lapTime, expected.lapTime, tolerance) &&
    compareNumbers(actual.sector1Time, expected.sector1Time, tolerance) &&
    compareNumbers(actual.sector2Time, expected.sector2Time, tolerance) &&
    compareNumbers(actual.sector3Time, expected.sector3Time, tolerance) &&
    actual.tireCompound === expected.tireCompound &&
    actual.tireAge === expected.tireAge &&
    compareNumbers(actual.fuelLoad, expected.fuelLoad, tolerance) &&
    actual.trackStatus === expected.trackStatus &&
    compareTelemetryData(actual.telemetry, expected.telemetry)
  );
}

// Helper function to compare metadata
function compareMetadata(actual: ExportMetadata, expected: ExportMetadata): boolean {
  const dateMatch =
    actual.exportedAt.getTime() === expected.exportedAt.getTime() &&
    actual.sessionDate.getTime() === expected.sessionDate.getTime() &&
    actual.dataFetchedAt.getTime() === expected.dataFetchedAt.getTime();

  const basicMatch =
    actual.sessionId === expected.sessionId &&
    actual.circuitName === expected.circuitName &&
    actual.sessionType === expected.sessionType &&
    actual.dataSource === expected.dataSource;

  const weatherMatch =
    (actual.weather === undefined && expected.weather === undefined) ||
    (actual.weather !== undefined &&
      expected.weather !== undefined &&
      ((Number.isNaN(actual.weather.airTemp) && Number.isNaN(expected.weather.airTemp)) ||
        Math.abs(actual.weather.airTemp - expected.weather.airTemp) < 0.0001) &&
      ((Number.isNaN(actual.weather.trackTemp) && Number.isNaN(expected.weather.trackTemp)) ||
        Math.abs(actual.weather.trackTemp - expected.weather.trackTemp) < 0.0001) &&
      ((Number.isNaN(actual.weather.humidity) && Number.isNaN(expected.weather.humidity)) ||
        Math.abs(actual.weather.humidity - expected.weather.humidity) < 0.0001) &&
      ((Number.isNaN(actual.weather.pressure) && Number.isNaN(expected.weather.pressure)) ||
        Math.abs(actual.weather.pressure - expected.weather.pressure) < 0.0001) &&
      ((Number.isNaN(actual.weather.windSpeed) && Number.isNaN(expected.weather.windSpeed)) ||
        Math.abs(actual.weather.windSpeed - expected.weather.windSpeed) < 0.0001) &&
      ((Number.isNaN(actual.weather.windDirection) &&
        Number.isNaN(expected.weather.windDirection)) ||
        Math.abs(actual.weather.windDirection - expected.weather.windDirection) < 0.0001) &&
      actual.weather.rainfall === expected.weather.rainfall);

  return dateMatch && basicMatch && weatherMatch;
}

describe('ExportService Property Tests', () => {
  /**
   * Feature: f1-analysis-platform, Property 5: Export round-trip for CSV
   * For any telemetry data exported to CSV format, parsing the CSV back
   * into the data model should produce equivalent data with all telemetry
   * information and metadata preserved.
   * Validates: Requirements 2.5
   */
  it('Property 5: CSV export round-trip preserves all data', () => {
    fc.assert(
      fc.property(telemetryExportArb, (telemetryExport) => {
        // Export to CSV
        const csv = exportService.exportTelemetryToCSV(telemetryExport);

        // Parse back from CSV
        const parsed = exportService.parseTelemetryFromCSV(csv);

        // Verify metadata is preserved
        expect(compareMetadata(parsed.metadata, telemetryExport.metadata)).toBe(true);

        // Verify lap data is preserved
        expect(parsed.lapData.length).toBe(telemetryExport.lapData.length);

        for (let i = 0; i < parsed.lapData.length; i++) {
          expect(compareLapData(parsed.lapData[i], telemetryExport.lapData[i])).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: f1-analysis-platform, Property 6: Export round-trip for JSON
   * For any telemetry data exported to JSON format, parsing the JSON back
   * into the data model should produce equivalent data with all telemetry
   * information and metadata preserved.
   * Validates: Requirements 2.5
   */
  it('Property 6: JSON export round-trip preserves all data', () => {
    fc.assert(
      fc.property(telemetryExportArb, (telemetryExport) => {
        // Export to JSON
        const json = exportService.exportTelemetryToJSON(telemetryExport);

        // Parse back from JSON
        const parsed = exportService.parseTelemetryFromJSON(json);

        // Verify metadata is preserved
        expect(compareMetadata(parsed.metadata, telemetryExport.metadata)).toBe(true);

        // Verify lap data is preserved
        expect(parsed.lapData.length).toBe(telemetryExport.lapData.length);

        for (let i = 0; i < parsed.lapData.length; i++) {
          expect(compareLapData(parsed.lapData[i], telemetryExport.lapData[i])).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: f1-analysis-platform, Property 26: Export metadata presence
   * For any telemetry data export, the exported file must include metadata
   * fields for session conditions, data sources, and timestamp information.
   * Validates: Requirements 11.3
   */
  it('Property 26: All exports contain required metadata', () => {
    fc.assert(
      fc.property(telemetryExportArb, (telemetryExport) => {
        // Test CSV export
        const csv = exportService.exportTelemetryToCSV(telemetryExport);

        // Verify metadata is present in CSV
        expect(csv).toContain('# Metadata');
        expect(csv).toContain('# Exported At:');
        expect(csv).toContain('# Session ID:');
        expect(csv).toContain('# Session Date:');
        expect(csv).toContain('# Circuit:');
        expect(csv).toContain('# Session Type:');
        expect(csv).toContain('# Data Source:');
        expect(csv).toContain('# Data Fetched At:');

        // Test JSON export
        const json = exportService.exportTelemetryToJSON(telemetryExport);
        const parsed = JSON.parse(json);

        // Verify metadata is present in JSON
        expect(parsed.metadata).toBeDefined();
        expect(parsed.metadata.exportedAt).toBeDefined();
        expect(parsed.metadata.sessionId).toBeDefined();
        expect(parsed.metadata.sessionDate).toBeDefined();
        expect(parsed.metadata.circuitName).toBeDefined();
        expect(parsed.metadata.sessionType).toBeDefined();
        expect(parsed.metadata.dataSource).toBeDefined();
        expect(parsed.metadata.dataFetchedAt).toBeDefined();
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: f1-analysis-platform, Property 8: Correlation export round-trip
   * For any correlation analysis results exported to CSV, parsing the CSV
   * should preserve all correlation coefficients and statistical confidence
   * metrics.
   * Validates: Requirements 8.5
   */
  it('Property 8: Correlation CSV export round-trip preserves all data', () => {
    fc.assert(
      fc.property(correlationExportDataArb, (correlationData) => {
        // Export to CSV
        const csv = exportService.exportCorrelationToCSV(correlationData);

        // Parse back from CSV
        const parsed = exportService.parseCorrelationFromCSV(csv);

        // Verify metadata is preserved
        expect(compareMetadata(parsed.metadata, correlationData.metadata)).toBe(true);

        // Verify correlation data is preserved
        expect(parsed.correlations.length).toBe(correlationData.correlations.length);

        const tolerance = 0.0001;
        for (let i = 0; i < parsed.correlations.length; i++) {
          const actual = parsed.correlations[i];
          const expected = correlationData.correlations[i];

          expect(actual.parameter).toBe(expected.parameter);
          expect(
            compareNumbers(
              actual.correlationCoefficient,
              expected.correlationCoefficient,
              tolerance
            )
          ).toBe(true);
          expect(
            compareNumbers(
              actual.confidenceInterval.lower,
              expected.confidenceInterval.lower,
              tolerance
            )
          ).toBe(true);
          expect(
            compareNumbers(
              actual.confidenceInterval.upper,
              expected.confidenceInterval.upper,
              tolerance
            )
          ).toBe(true);
          expect(compareNumbers(actual.pValue, expected.pValue, tolerance)).toBe(true);
          expect(actual.sampleSize).toBe(expected.sampleSize);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: f1-analysis-platform, Property 27: Batch export consistency
   * For any batch export of multiple laps or sessions, all exported items
   * must follow the same formatting rules and naming convention pattern.
   * Validates: Requirements 11.4
   */
  it('Property 27: Batch export follows consistent formatting', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(telemetryExportArb, { minLength: 2, maxLength: 5 }),
        fc.constantFrom('csv' as const, 'json' as const),
        async (telemetryExports, format) => {
          // Create batch export items with consistent naming pattern
          const exportItems = telemetryExports.map((data, index) => ({
            data,
            format,
            filename: `telemetry_${index + 1}.${format}`,
          }));

          // Perform batch export
          const results = await exportService.batchExportTelemetry(exportItems);

          // Verify all items were exported
          expect(results.size).toBe(exportItems.length);

          // Verify all filenames follow the pattern
          const filenamePattern = /^telemetry_\d+\.(csv|json)$/;
          for (const filename of results.keys()) {
            expect(filenamePattern.test(filename)).toBe(true);
          }

          // Verify all files have the same format
          for (const [_filename, blob] of results.entries()) {
            if (format === 'csv') {
              expect(blob.type).toBe('text/csv');
            } else {
              expect(blob.type).toBe('application/json');
            }
          }

          // Verify all files can be parsed back correctly
          for (let i = 0; i < exportItems.length; i++) {
            const filename = `telemetry_${i + 1}.${format}`;
            const blob = results.get(filename);
            expect(blob).toBeDefined();

            // Read blob content using FileReader API
            const content = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsText(blob!);
            });

            if (format === 'csv') {
              const parsed = exportService.parseTelemetryFromCSV(content);
              expect(compareMetadata(parsed.metadata, exportItems[i].data.metadata)).toBe(true);
            } else {
              const parsed = exportService.parseTelemetryFromJSON(content);
              expect(compareMetadata(parsed.metadata, exportItems[i].data.metadata)).toBe(true);
            }
          }
        }
      ),
      { numRuns: 50 } // Reduced runs for async tests
    );
  });

  /**
   * Feature: f1-analysis-platform, Property 25: Export completeness
   * For any complete analysis session export, the exported data must contain
   * all charts, data selections, and user annotations that were present in
   * the session at export time.
   * Validates: Requirements 11.2
   */
  it('Property 25: PDF report contains all provided elements', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 100 }),
          summary: fc.string({ minLength: 1, maxLength: 500 }),
          charts: fc.array(
            fc.record({
              title: fc.string({ minLength: 1, maxLength: 50 }),
              imageDataUrl: fc.constant(
                'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
              ),
              width: fc.integer({ min: 100, max: 2000 }),
              height: fc.integer({ min: 100, max: 2000 }),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          annotations: fc.array(fc.string({ minLength: 1, maxLength: 200 }), {
            minLength: 0,
            maxLength: 10,
          }),
          metadata: fc.option(exportMetadataArb, { nil: undefined }),
        }),
        async (reportOptions) => {
          // Generate PDF report (HTML format)
          const blob = await exportService.generatePDFReport(reportOptions);

          // Read the HTML content
          const html = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsText(blob);
          });

          // Verify title is present
          expect(html).toContain(reportOptions.title);

          // Verify summary is present
          expect(html).toContain(reportOptions.summary);

          // Verify all charts are present
          for (const chart of reportOptions.charts) {
            expect(html).toContain(chart.title);
            expect(html).toContain(chart.imageDataUrl);
          }

          // Verify all annotations are present
          for (const annotation of reportOptions.annotations) {
            expect(html).toContain(annotation);
          }

          // Verify metadata is present if provided
          if (reportOptions.metadata) {
            expect(html).toContain(reportOptions.metadata.circuitName);
            expect(html).toContain(reportOptions.metadata.sessionType);
            expect(html).toContain(reportOptions.metadata.dataSource);
          }
        }
      ),
      { numRuns: 50 } // Reduced runs for async tests
    );
  });
});
