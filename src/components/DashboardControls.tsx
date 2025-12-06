import React, { useCallback } from 'react';
import { useAppStore } from '../store';
import type { ChartConfig } from '../store/types';
import './DashboardControls.css';

export interface DashboardControlsProps {
  className?: string;
}

export const DashboardControls: React.FC<DashboardControlsProps> = ({ className = '' }) => {
  const chartLayout = useAppStore((state) => state.chartLayout);
  const setChartLayout = useAppStore((state) => state.setChartLayout);

  // Available chart types
  const availableChartTypes: ChartConfig['type'][] = [
    'speed',
    'throttle',
    'brake',
    'gear',
    'rpm',
    'drs',
    'trackMap',
  ];

  // Toggle chart visibility
  const toggleChartVisibility = useCallback(
    (chartId: string) => {
      const updatedCharts = chartLayout.charts.map((chart) =>
        chart.id === chartId ? { ...chart, visible: !chart.visible } : chart
      );
      setChartLayout({ ...chartLayout, charts: updatedCharts });
    },
    [chartLayout, setChartLayout]
  );

  // Add a new chart
  const addChart = useCallback(
    (type: ChartConfig['type']) => {
      // Find the next available position
      const maxY = Math.max(...chartLayout.charts.map((c) => c.position.y + c.position.h), 0);
      const newChart: ChartConfig = {
        id: `${type}-${Date.now()}`,
        type,
        position: { x: 0, y: maxY, w: 6, h: 2 },
        visible: true,
      };

      setChartLayout({
        ...chartLayout,
        charts: [...chartLayout.charts, newChart],
      });
    },
    [chartLayout, setChartLayout]
  );

  // Remove a chart
  const removeChart = useCallback(
    (chartId: string) => {
      const updatedCharts = chartLayout.charts.filter((chart) => chart.id !== chartId);
      setChartLayout({ ...chartLayout, charts: updatedCharts });
    },
    [chartLayout, setChartLayout]
  );

  // Count visible charts
  const visibleChartCount = chartLayout.charts.filter((c) => c.visible).length;

  return (
    <div className={`dashboard-controls ${className}`}>
      <div className="controls-section">
        <h3>Active Charts ({visibleChartCount})</h3>
        <div className="chart-list">
          {chartLayout.charts.map((chart) => (
            <div key={chart.id} className="chart-item">
              <label className="chart-checkbox">
                <input
                  type="checkbox"
                  checked={chart.visible}
                  onChange={() => toggleChartVisibility(chart.id)}
                />
                <span>{getChartLabel(chart.type)}</span>
              </label>
              <button
                className="remove-btn"
                onClick={() => removeChart(chart.id)}
                aria-label={`Remove ${getChartLabel(chart.type)}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="controls-section">
        <h3>Add Chart</h3>
        <div className="add-chart-buttons">
          {availableChartTypes.map((type) => (
            <button
              key={type}
              className="add-chart-btn"
              onClick={() => addChart(type)}
              disabled={visibleChartCount >= 12}
            >
              + {getChartLabel(type)}
            </button>
          ))}
        </div>
        {visibleChartCount >= 12 && <p className="warning-text">Maximum of 12 charts reached</p>}
      </div>
    </div>
  );
};

// Helper function to get chart label
function getChartLabel(type: ChartConfig['type']): string {
  const labels: Record<ChartConfig['type'], string> = {
    speed: 'Speed',
    throttle: 'Throttle',
    brake: 'Brake',
    gear: 'Gear',
    rpm: 'RPM',
    drs: 'DRS',
    trackMap: 'Track Map',
  };
  return labels[type] || type;
}
