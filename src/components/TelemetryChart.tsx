import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import type { LapData, Corner } from '../types';
import { useAnimationsEnabled, useChartQuality } from '../hooks/useAdaptivePerformance';

export interface TelemetryChartProps {
  laps: LapData[];
  channel: 'speed' | 'throttle' | 'brake' | 'gear';
  corners?: Corner[];
  onHover?: (distance: number, lapIndex: number) => void;
  highlightDistance?: number;
  width?: number;
  height?: number;
}

const CHANNEL_CONFIG = {
  speed: {
    title: 'Speed (km/h)',
    yaxis: 'y',
    color: '#1f77b4',
  },
  throttle: {
    title: 'Throttle (%)',
    yaxis: 'y2',
    color: '#2ca02c',
  },
  brake: {
    title: 'Brake (%)',
    yaxis: 'y3',
    color: '#d62728',
  },
  gear: {
    title: 'Gear',
    yaxis: 'y4',
    color: '#ff7f0e',
  },
};

const LAP_COLORS = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728'];

export const TelemetryChart: React.FC<TelemetryChartProps> = ({
  laps,
  channel,
  onHover,
  highlightDistance,
  width = 1200,
  height = 400,
}) => {
  // Adaptive performance hooks
  const animationsEnabled = useAnimationsEnabled();
  const chartQuality = useChartQuality();

  const traces = useMemo(() => {
    return laps.map((lap, index) => {
      const telemetry = lap.telemetry;
      const data = telemetry[channel];

      // Apply adaptive data decimation based on chart quality
      const adaptiveDistance =
        chartQuality === 'low'
          ? telemetry.distance.filter((_, i) => i % 4 === 0)
          : chartQuality === 'medium'
            ? telemetry.distance.filter((_, i) => i % 2 === 0)
            : telemetry.distance;

      const adaptiveData =
        chartQuality === 'low'
          ? data.filter((_, i) => i % 4 === 0)
          : chartQuality === 'medium'
            ? data.filter((_, i) => i % 2 === 0)
            : data;

      return {
        x: adaptiveDistance,
        y: adaptiveData,
        type: 'scatter' as const,
        mode: 'lines' as const,
        name: `Lap ${lap.lapNumber} - ${lap.driverId}`,
        line: {
          color: LAP_COLORS[index % LAP_COLORS.length],
          width: chartQuality === 'low' ? 1 : 2,
        },
        hovertemplate:
          `<b>Lap ${lap.lapNumber}</b><br>` +
          `Distance: %{x:.0f}m<br>` +
          `${CHANNEL_CONFIG[channel].title}: %{y:.1f}<br>` +
          `<extra></extra>`,
      };
    });
  }, [laps, channel, chartQuality]);

  const layout = useMemo(() => {
    return {
      title: { text: CHANNEL_CONFIG[channel].title },
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
      shapes:
        highlightDistance !== undefined
          ? [
              {
                type: 'line' as const,
                x0: highlightDistance,
                x1: highlightDistance,
                y0: 0,
                y1: 1,
                yref: 'paper' as const,
                line: {
                  color: 'rgba(255, 0, 0, 0.5)',
                  width: 2,
                  dash: 'dash' as const,
                },
              },
            ]
          : [],
    };
  }, [channel, width, height, highlightDistance]);

  const config = useMemo(
    () => ({
      responsive: true,
      displayModeBar: true,
      modeBarButtonsToRemove: ['lasso2d', 'select2d'] as Plotly.ModeBarDefaultButtons[],
      displaylogo: false,
    }),
    []
  );

  // Apply animation settings based on performance
  const layoutWithAnimations = useMemo(
    () => ({
      ...layout,
      transition: animationsEnabled
        ? {
            duration: 300,
            easing: 'cubic-in-out' as const,
          }
        : undefined,
    }),
    [layout, animationsEnabled]
  );

  const handleHover = (event: Readonly<Plotly.PlotHoverEvent>) => {
    if (onHover && event.points && event.points.length > 0) {
      const point = event.points[0];
      const distance = point.x as number;
      const lapIndex = point.curveNumber;
      onHover(distance, lapIndex);
    }
  };

  // Generate accessible description for the chart
  const chartDescription = useMemo(() => {
    if (laps.length === 0) return 'No data available';

    const lapDescriptions = laps.map((lap) => `Lap ${lap.lapNumber} by ${lap.driverId}`).join(', ');

    return `${CHANNEL_CONFIG[channel].title} chart showing ${lapDescriptions}`;
  }, [laps, channel]);

  return (
    <div role="img" aria-label={chartDescription} style={{ width: '100%', height: '100%' }}>
      <Plot
        data={traces}
        layout={layoutWithAnimations}
        config={config}
        onHover={handleHover}
        useResizeHandler={true}
        style={{ width: '100%', height: '100%' }}
      />
      <span className="sr-only">{chartDescription}</span>
    </div>
  );
};
