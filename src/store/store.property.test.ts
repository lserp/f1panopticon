/**
 * Property-based tests for state management
 * Feature: f1-analysis-platform
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { useAppStore } from './index';
import type { DashboardConfig, ChartLayout, ChartConfig } from './types';

describe('State Management Property Tests', () => {
  // Clear store before each test
  beforeEach(() => {
    localStorage.clear();
    useAppStore.setState({
      currentSession: null,
      selectedLaps: [],
      sessionHistory: [],
      activeTelemetry: null,
      comparisonTelemetry: [],
      currentDistance: 0,
      currentTime: 0,
      sidebarOpen: true,
      fullscreenChart: null,
      activeView: 'telemetry',
      chartLayout: {
        columns: 2,
        rows: 2,
        charts: [],
      },
      theme: 'auto',
      units: 'metric',
      dashboardConfigs: {},
      recentSessions: [],
      apiCredentials: { premiumTier: false },
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  /**
   * Property 7: Dashboard configuration round-trip
   * Validates: Requirements 6.2
   *
   * For any dashboard configuration saved by a user, loading that configuration
   * should restore the exact same layout, channel selections, and settings.
   */
  describe('Property 7: Dashboard configuration round-trip', () => {
    // Arbitrary for ChartConfig
    const chartConfigArb = fc.record({
      id: fc.string({ minLength: 1, maxLength: 20 }),
      type: fc.constantFrom('speed', 'throttle', 'brake', 'gear', 'rpm', 'drs', 'trackMap'),
      position: fc.record({
        x: fc.integer({ min: 0, max: 10 }),
        y: fc.integer({ min: 0, max: 10 }),
        w: fc.integer({ min: 1, max: 5 }),
        h: fc.integer({ min: 1, max: 5 }),
      }),
      visible: fc.boolean(),
    });

    // Arbitrary for ChartLayout
    const chartLayoutArb = fc.record({
      columns: fc.integer({ min: 1, max: 6 }),
      rows: fc.integer({ min: 1, max: 6 }),
      charts: fc.array(chartConfigArb, { minLength: 0, maxLength: 12 }),
    });

    // Arbitrary for DashboardConfig
    const dashboardConfigArb = fc.record({
      name: fc.string({ minLength: 1, maxLength: 50 }),
      layout: chartLayoutArb,
      syncTime: fc.float({ min: 0, max: 10000 }),
      createdAt: fc.date(),
      updatedAt: fc.date(),
    });

    it('should preserve dashboard configuration after save and load', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          dashboardConfigArb,
          (configName, config) => {
            // Save the configuration
            useAppStore.getState().saveDashboardConfig(configName, config);

            // Load the configuration
            const loadedConfig = useAppStore.getState().loadDashboardConfig(configName);

            // Verify the loaded config matches the saved config
            expect(loadedConfig).toBeDefined();
            expect(loadedConfig?.name).toBe(config.name);
            expect(loadedConfig?.layout.columns).toBe(config.layout.columns);
            expect(loadedConfig?.layout.rows).toBe(config.layout.rows);
            expect(loadedConfig?.layout.charts.length).toBe(config.layout.charts.length);
            expect(loadedConfig?.syncTime).toBe(config.syncTime);

            // Verify each chart in the layout
            config.layout.charts.forEach((chart, index) => {
              const loadedChart = loadedConfig?.layout.charts[index];
              expect(loadedChart?.id).toBe(chart.id);
              expect(loadedChart?.type).toBe(chart.type);
              expect(loadedChart?.position.x).toBe(chart.position.x);
              expect(loadedChart?.position.y).toBe(chart.position.y);
              expect(loadedChart?.position.w).toBe(chart.position.w);
              expect(loadedChart?.position.h).toBe(chart.position.h);
              expect(loadedChart?.visible).toBe(chart.visible);
            });

            // Verify the chart layout was applied to the store
            const currentLayout = useAppStore.getState().chartLayout;
            expect(currentLayout.columns).toBe(config.layout.columns);
            expect(currentLayout.rows).toBe(config.layout.rows);
            expect(currentLayout.charts.length).toBe(config.layout.charts.length);

            // Verify the sync time was applied
            const currentTime = useAppStore.getState().currentTime;
            expect(currentTime).toBe(config.syncTime);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle multiple dashboard configurations independently', () => {
      fc.assert(
        fc.property(
          fc.array(fc.tuple(fc.string({ minLength: 1, maxLength: 50 }), dashboardConfigArb), {
            minLength: 1,
            maxLength: 10,
          }),
          (configs) => {
            // Create a map to deduplicate configs by name (last one wins)
            const uniqueConfigs = new Map<string, (typeof configs)[0]>();
            configs.forEach((config) => {
              uniqueConfigs.set(config[0], config);
            });

            // Save all configurations
            uniqueConfigs.forEach(([name, config]) => {
              useAppStore.getState().saveDashboardConfig(name, config);
            });

            // Load and verify each configuration
            uniqueConfigs.forEach(([name, originalConfig]) => {
              const loadedConfig = useAppStore.getState().loadDashboardConfig(name);
              expect(loadedConfig).toBeDefined();
              expect(loadedConfig?.name).toBe(originalConfig.name);
              expect(loadedConfig?.layout.columns).toBe(originalConfig.layout.columns);
              expect(loadedConfig?.layout.rows).toBe(originalConfig.layout.rows);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 11: Time synchronization preservation
   * Validates: Requirements 6.3
   *
   * For any dashboard view switch, if all charts were synchronized to time T
   * before the switch, all charts must remain synchronized to time T after the switch.
   */
  describe('Property 11: Time synchronization preservation', () => {
    it('should preserve time synchronization across view switches', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 10000 }),
          fc.constantFrom('telemetry', 'strategy', 'comparison', 'correlation', 'replay'),
          fc.constantFrom('telemetry', 'strategy', 'comparison', 'correlation', 'replay'),
          (syncTime, view1, view2) => {
            // Set initial time and view
            useAppStore.getState().setCurrentTime(syncTime);
            useAppStore.getState().setActiveView(view1);

            // Verify time is set
            expect(useAppStore.getState().currentTime).toBe(syncTime);

            // Switch to another view
            useAppStore.getState().setActiveView(view2);

            // Verify time is preserved after view switch
            expect(useAppStore.getState().currentTime).toBe(syncTime);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve time synchronization across multiple view switches', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 10000 }),
          fc.array(
            fc.constantFrom('telemetry', 'strategy', 'comparison', 'correlation', 'replay'),
            { minLength: 2, maxLength: 10 }
          ),
          (syncTime, views) => {
            // Set initial time
            useAppStore.getState().setCurrentTime(syncTime);

            // Switch through all views
            views.forEach((view) => {
              useAppStore.getState().setActiveView(view);
              // Time should remain constant
              expect(useAppStore.getState().currentTime).toBe(syncTime);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve time synchronization when loading dashboard configs', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 10000 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }),
            layout: fc.record({
              columns: fc.integer({ min: 1, max: 6 }),
              rows: fc.integer({ min: 1, max: 6 }),
              charts: fc.array(
                fc.record({
                  id: fc.string({ minLength: 1, maxLength: 20 }),
                  type: fc.constantFrom(
                    'speed',
                    'throttle',
                    'brake',
                    'gear',
                    'rpm',
                    'drs',
                    'trackMap'
                  ),
                  position: fc.record({
                    x: fc.integer({ min: 0, max: 10 }),
                    y: fc.integer({ min: 0, max: 10 }),
                    w: fc.integer({ min: 1, max: 5 }),
                    h: fc.integer({ min: 1, max: 5 }),
                  }),
                  visible: fc.boolean(),
                }),
                { minLength: 0, maxLength: 12 }
              ),
            }),
            syncTime: fc.float({ min: 0, max: 10000 }),
            createdAt: fc.date(),
            updatedAt: fc.date(),
          }),
          (initialTime, configName, config) => {
            // Set initial time
            useAppStore.getState().setCurrentTime(initialTime);

            // Save and load a dashboard config (which has its own syncTime)
            useAppStore.getState().saveDashboardConfig(configName, config);
            useAppStore.getState().loadDashboardConfig(configName);

            // After loading, the time should be updated to the config's syncTime
            expect(useAppStore.getState().currentTime).toBe(config.syncTime);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 24: Cross-device configuration sync
   * Validates: Requirements 10.3
   *
   * For any user preference or dashboard configuration changed on device A,
   * querying the same preference or configuration on device B for the same
   * user account must reflect the change.
   *
   * Note: We simulate cross-device sync using BroadcastChannel and localStorage
   */
  describe('Property 24: Cross-device configuration sync', () => {
    it('should sync theme changes across tabs via localStorage', () => {
      fc.assert(
        fc.property(fc.constantFrom('light', 'dark', 'auto'), (theme) => {
          // Set theme
          useAppStore.getState().setTheme(theme);

          // Simulate reading from localStorage (as another tab would)
          const stored = localStorage.getItem('f1-analysis-storage');
          expect(stored).toBeDefined();

          const parsed = JSON.parse(stored!);
          expect(parsed.state.theme).toBe(theme);
        }),
        { numRuns: 100 }
      );
    });

    it('should sync units changes across tabs via localStorage', () => {
      fc.assert(
        fc.property(fc.constantFrom('metric', 'imperial'), (units) => {
          // Set units
          useAppStore.getState().setUnits(units);

          // Simulate reading from localStorage (as another tab would)
          const stored = localStorage.getItem('f1-analysis-storage');
          expect(stored).toBeDefined();

          const parsed = JSON.parse(stored!);
          expect(parsed.state.units).toBe(units);
        }),
        { numRuns: 100 }
      );
    });

    it('should sync dashboard configs across tabs via localStorage', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }),
            layout: fc.record({
              columns: fc.integer({ min: 1, max: 6 }),
              rows: fc.integer({ min: 1, max: 6 }),
              charts: fc.array(
                fc.record({
                  id: fc.string({ minLength: 1, maxLength: 20 }),
                  type: fc.constantFrom(
                    'speed',
                    'throttle',
                    'brake',
                    'gear',
                    'rpm',
                    'drs',
                    'trackMap'
                  ),
                  position: fc.record({
                    x: fc.integer({ min: 0, max: 10 }),
                    y: fc.integer({ min: 0, max: 10 }),
                    w: fc.integer({ min: 1, max: 5 }),
                    h: fc.integer({ min: 1, max: 5 }),
                  }),
                  visible: fc.boolean(),
                }),
                { minLength: 0, maxLength: 12 }
              ),
            }),
            syncTime: fc.float({ min: 0, max: 10000 }),
            createdAt: fc.date(),
            updatedAt: fc.date(),
          }),
          (configName, config) => {
            // Save dashboard config
            useAppStore.getState().saveDashboardConfig(configName, config);

            // Simulate reading from localStorage (as another tab would)
            const stored = localStorage.getItem('f1-analysis-storage');
            expect(stored).toBeDefined();

            const parsed = JSON.parse(stored!);
            expect(parsed.state.dashboardConfigs[configName]).toBeDefined();
            expect(parsed.state.dashboardConfigs[configName].name).toBe(config.name);
            expect(parsed.state.dashboardConfigs[configName].layout.columns).toBe(
              config.layout.columns
            );
            expect(parsed.state.dashboardConfigs[configName].layout.rows).toBe(config.layout.rows);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should sync API credentials across tabs via localStorage', () => {
      fc.assert(
        fc.property(
          fc.record({
            fastf1ApiKey: fc.option(fc.string({ minLength: 10, maxLength: 50 }), { nil: undefined }),
            openf1ApiKey: fc.option(fc.string({ minLength: 10, maxLength: 50 }), { nil: undefined }),
            premiumTier: fc.boolean(),
          }),
          (credentials) => {
            // Set API credentials
            useAppStore.getState().setApiCredentials(credentials);

            // Simulate reading from localStorage (as another tab would)
            const stored = localStorage.getItem('f1-analysis-storage');
            expect(stored).toBeDefined();

            const parsed = JSON.parse(stored!);
            expect(parsed.state.apiCredentials.premiumTier).toBe(credentials.premiumTier);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should sync chart layout across tabs via localStorage', () => {
      fc.assert(
        fc.property(
          fc.record({
            columns: fc.integer({ min: 1, max: 6 }),
            rows: fc.integer({ min: 1, max: 6 }),
            charts: fc.array(
              fc.record({
                id: fc.string({ minLength: 1, maxLength: 20 }),
                type: fc.constantFrom(
                  'speed',
                  'throttle',
                  'brake',
                  'gear',
                  'rpm',
                  'drs',
                  'trackMap'
                ),
                position: fc.record({
                  x: fc.integer({ min: 0, max: 10 }),
                  y: fc.integer({ min: 0, max: 10 }),
                  w: fc.integer({ min: 1, max: 5 }),
                  h: fc.integer({ min: 1, max: 5 }),
                }),
                visible: fc.boolean(),
              }),
              { minLength: 0, maxLength: 12 }
            ),
          }),
          (layout) => {
            // Set chart layout
            useAppStore.getState().setChartLayout(layout);

            // Simulate reading from localStorage (as another tab would)
            const stored = localStorage.getItem('f1-analysis-storage');
            expect(stored).toBeDefined();

            const parsed = JSON.parse(stored!);
            expect(parsed.state.chartLayout.columns).toBe(layout.columns);
            expect(parsed.state.chartLayout.rows).toBe(layout.rows);
            expect(parsed.state.chartLayout.charts.length).toBe(layout.charts.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
