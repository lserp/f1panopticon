import React, { useCallback, useMemo } from 'react';
import { Responsive, WidthProvider, type Layout } from 'react-grid-layout';
import { useAppStore } from '../store';
import { TelemetryChart } from './TelemetryChart';
import type { ChartConfig } from '../store/types';
import { useBreakpointConfig, useIsMobile } from '../hooks/useResponsive';
import { getGridBreakpoints, getGridCols } from '../utils/responsive';
import 'react-grid-layout/css/styles.css';
import './Dashboard.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

export interface DashboardProps {
  className?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ className = '' }) => {
  const chartLayout = useAppStore((state) => state.chartLayout);
  const setChartLayout = useAppStore((state) => state.setChartLayout);
  const fullscreenChart = useAppStore((state) => state.fullscreenChart);
  const setFullscreenChart = useAppStore((state) => state.setFullscreenChart);
  const selectedLaps = useAppStore((state) => state.selectedLaps);

  // Get responsive breakpoint configuration
  const breakpointConfig = useBreakpointConfig();
  const isMobile = useIsMobile();

  // Convert ChartConfig to react-grid-layout Layout format
  const layouts = useMemo(() => {
    const layout: Layout[] = chartLayout.charts
      .filter((chart) => chart.visible)
      .map((chart) => ({
        i: chart.id,
        x: chart.position.x,
        y: chart.position.y,
        w: chart.position.w,
        h: chart.position.h,
        minW: 1,
        minH: 1,
      }));

    return { lg: layout, md: layout, sm: layout, xs: layout, xxs: layout };
  }, [chartLayout.charts]);

  // Handle layout changes from drag/drop or resize
  const handleLayoutChange = useCallback(
    (newLayout: Layout[]) => {
      const updatedCharts: ChartConfig[] = chartLayout.charts.map((chart) => {
        const layoutItem = newLayout.find((item) => item.i === chart.id);
        if (layoutItem) {
          return {
            ...chart,
            position: {
              x: layoutItem.x,
              y: layoutItem.y,
              w: layoutItem.w,
              h: layoutItem.h,
            },
          };
        }
        return chart;
      });

      setChartLayout({
        ...chartLayout,
        charts: updatedCharts,
      });
    },
    [chartLayout, setChartLayout]
  );

  // Toggle fullscreen for a chart
  const handleFullscreen = useCallback(
    (chartId: string) => {
      setFullscreenChart(fullscreenChart === chartId ? null : chartId);
    },
    [fullscreenChart, setFullscreenChart]
  );

  // Handle keyboard navigation for charts
  const handleChartKeyDown = useCallback(
    (event: React.KeyboardEvent, chartId: string) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleFullscreen(chartId);
      } else if (event.key === 'Escape' && fullscreenChart === chartId) {
        event.preventDefault();
        setFullscreenChart(null);
      }
    },
    [handleFullscreen, fullscreenChart, setFullscreenChart]
  );

  // Render individual chart based on type
  const renderChart = useCallback(
    (chart: ChartConfig) => {
      const isFullscreen = fullscreenChart === chart.id;
      const containerClass = `dashboard-chart ${isFullscreen ? 'fullscreen' : ''}`;

      return (
        <div
          key={chart.id}
          className={containerClass}
          tabIndex={0}
          role="region"
          aria-label={`${getChartTitle(chart.type)} chart`}
          onKeyDown={(e) => handleChartKeyDown(e, chart.id)}
        >
          <div className="chart-header">
            <h3 className="chart-title">{getChartTitle(chart.type)}</h3>
            <button
              className="fullscreen-btn"
              onClick={() => handleFullscreen(chart.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleFullscreen(chart.id);
                }
              }}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              tabIndex={0}
            >
              {isFullscreen ? '✕' : '⛶'}
            </button>
          </div>
          <div className="chart-content">
            {chart.type === 'trackMap' ? (
              <div className="placeholder-message">
                Track map will be displayed when track data is loaded
              </div>
            ) : ['speed', 'throttle', 'brake', 'gear'].includes(chart.type) ? (
              <TelemetryChart
                laps={selectedLaps}
                channel={chart.type as 'speed' | 'throttle' | 'brake' | 'gear'}
              />
            ) : (
              <div className="placeholder-message">
                {getChartTitle(chart.type)} chart will be displayed when data is loaded
              </div>
            )}
          </div>
        </div>
      );
    },
    [selectedLaps, fullscreenChart, handleFullscreen, handleChartKeyDown]
  );

  // If a chart is in fullscreen mode, render only that chart
  if (fullscreenChart) {
    const fullscreenChartConfig = chartLayout.charts.find((chart) => chart.id === fullscreenChart);
    if (fullscreenChartConfig) {
      return (
        <div className={`dashboard-fullscreen ${className}`}>
          {renderChart(fullscreenChartConfig)}
        </div>
      );
    }
  }

  // Render grid layout with responsive configuration
  // On mobile/tablet, make dragging and resizing more touch-friendly
  return (
    <div className={`dashboard ${className}`}>
      <ResponsiveGridLayout
        className="dashboard-grid"
        layouts={layouts}
        breakpoints={getGridBreakpoints()}
        cols={getGridCols()}
        rowHeight={breakpointConfig.rowHeight}
        margin={breakpointConfig.margin}
        containerPadding={breakpointConfig.containerPadding}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".chart-header"
        isDraggable={!isMobile} // Disable drag on mobile to prevent conflicts with touch scrolling
        isResizable={!isMobile} // Disable resize on mobile for better touch experience
        compactType="vertical"
        preventCollision={false}
      >
        {chartLayout.charts
          .filter((chart) => chart.visible)
          .map((chart) => (
            <div key={chart.id}>{renderChart(chart)}</div>
          ))}
      </ResponsiveGridLayout>
    </div>
  );
};

// Helper function to get chart title
function getChartTitle(type: ChartConfig['type']): string {
  const titles: Record<ChartConfig['type'], string> = {
    speed: 'Speed',
    throttle: 'Throttle',
    brake: 'Brake',
    gear: 'Gear',
    rpm: 'RPM',
    drs: 'DRS',
    trackMap: 'Track Map',
  };
  return titles[type] || type;
}
