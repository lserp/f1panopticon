import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import type { LapData, Corner } from '../types';
import { calculatePerformanceGaps } from '../utils/performanceGap';

export interface TelemetryComparisonChartProps {
  laps: [LapData, LapData]; // Exactly 2 laps for comparison
  channel: 'speed' | 'throttle' | 'brake' | 'gear';
  corners?: Corner[];
  gapThreshold?: number; // seconds, default 0.1
  showGapHighlights?: boolean;
  onHover?: (distance: number, lapIndex: number) => void;
  highlightDistance?: number;
  width?: number;
  height?: number;
}

const CHANNEL_CONFIG = {
  speed: {
    title: 'Speed (km/h)',
    color: '#1f77b4',
  },
  throttle: {
    title: 'Throttle (%)',
    color: '#2ca02c',
  },
  brake: {
    title: 'Brake (%)',
    color: '#d62728',
  },
  gear: {
    title: 'Gear',
    color: '#ff7f0e',
  },
};

const LAP_COLORS = ['#1f77b4', '#ff7f0e'];
const GAP_HIGHLIGHT_COLORS = ['rgba(31, 119, 180, 0.2)', 'rgba(255, 127, 14, 0.2)'];

export const TelemetryComparisonChart: React.FC<TelemetryComparisonChartProps> = ({
  laps,
  channel,
  corners = [],
  gapThreshold = 0.1,
  showGapHighlights = true,
  onHover,
  highlightDistance,
  width = 1200,
  height = 400,
}) => {
  // Calculate performance gaps
  const performanceGaps = useMemo(() => {
    if (!showGapHighlights) return [];
    return calculatePerformanceGaps(laps[0], laps[1], gapThreshold);
  }, [laps, gapThreshold, showGapHighlights]);

  const traces = useMemo(() => {
    return laps.map((lap, index) => {
      const telemetry = lap.telemetry;
      const data = telemetry[channel];

      return {
        x: telemetry.distance,
        y: data,
        type: 'scatter' as const,
        mode: 'lines' as const,
        name: `Lap ${lap.lapNumber} - ${lap.driverId}`,
        line: {
          color: LAP_COLORS[index],
          width: 2,
        },
        hovertemplate:
          `<b>Lap ${lap.lapNumber}</b><br>` +
          `Distance: %{x:.0f}m<br>` +
          `${CHANNEL_CONFIG[channel].title}: %{y:.1f}<br>` +
          `<extra></extra>`,
      };
    });
  }, [laps, channel]);

  const layout = useMemo(() => {
    // Create shapes for gap highlights and other markers
    const shapes: Partial<Plotly.Shape>[] = [];

    // Add gap highlight rectangles
    if (showGapHighlights) {
      performanceGaps.forEach((gap) => {
        shapes.push({
          type: 'rect',
          x0: gap.startDistance,
          x1: gap.endDistance,
          y0: 0,
          y1: 1,
          yref: 'paper',
          fillcolor: GAP_HIGHLIGHT_COLORS[gap.fasterLapIndex],
          line: {
            width: 0,
          },
          layer: 'below',
        });
      });
    }

    // Add highlight line if distance is specified
    if (highlightDistance !== undefined) {
      shapes.push({
        type: 'line',
        x0: highlightDistance,
        x1: highlightDistance,
        y0: 0,
        y1: 1,
        yref: 'paper',
        line: {
          color: 'rgba(255, 0, 0, 0.5)',
          width: 2,
          dash: 'dash',
        },
      });
    }

    // Add corner markers
    corners.forEach((corner) => {
      shapes.push({
        type: 'line',
        x0: corner.distance,
        x1: corner.distance,
        y0: 0,
        y1: 1,
        yref: 'paper',
        line: {
          color: 'rgba(128, 128, 128, 0.2)',
          width: 1,
        },
      });
    });

    return {
      title: { text: `${CHANNEL_CONFIG[channel].title} Comparison` },
      xaxis: {
        title: { text: 'Distance (m)' },
        showgrid: true,
        zeroline: false,
      },
      yaxis: {
        title: { text: CHANNEL_CONFIG[channel].title },
        showgrid: true,
        zeroline: false,
      },
      hovermode: 'x unified' as const,
      showlegend: true,
      legend: {
        x: 1.05,
        y: 1,
        xanchor: 'left' as const,
        yanchor: 'top' as const,
      },
      margin: {
        l: 60,
        r: 150,
        t: 50,
        b: 60,
      },
      width,
      height,
      shapes,
      annotations: showGapHighlights
        ? performanceGaps.map((gap) => ({
            x: (gap.startDistance + gap.endDistance) / 2,
            y: 1,
            yref: 'paper' as const,
            text: `Δ ${gap.gap.toFixed(2)}s`,
            showarrow: false,
            font: {
              size: 10,
              color: LAP_COLORS[gap.fasterLapIndex],
            },
            yanchor: 'bottom' as const,
          }))
        : [],
    };
  }, [channel, width, height, highlightDistance, corners, showGapHighlights, performanceGaps]);

  const config = useMemo(
    () => ({
      responsive: true,
      displayModeBar: true,
      modeBarButtonsToRemove: ['lasso2d', 'select2d'] as Plotly.ModeBarDefaultButtons[],
      displaylogo: false,
    }),
    []
  );

  const handleHover = (event: Readonly<Plotly.PlotHoverEvent>) => {
    if (onHover && event.points && event.points.length > 0) {
      const point = event.points[0];
      const distance = point.x as number;
      const lapIndex = point.curveNumber;
      onHover(distance, lapIndex);
    }
  };

  return <Plot data={traces} layout={layout} config={config} onHover={handleHover} />;
};
