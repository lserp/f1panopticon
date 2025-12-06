import React, { useMemo, useState } from 'react';
import Plot from 'react-plotly.js';
import type { LapData, Corner } from '../types';
import { findCornerAtDistance } from '../utils/tooltipHelpers';

export interface MultiChannelTelemetryChartProps {
  laps: LapData[];
  channels: Array<'speed' | 'throttle' | 'brake' | 'gear'>;
  corners?: Corner[];
  onHover?: (distance: number, lapIndex: number, cornerName?: string) => void;
  highlightDistance?: number;
  width?: number;
  height?: number;
  syncTooltips?: boolean;
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

const LAP_COLORS = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728'];

export const MultiChannelTelemetryChart: React.FC<MultiChannelTelemetryChartProps> = ({
  laps,
  channels,
  corners = [],
  onHover,
  highlightDistance,
  width = 1200,
  height = 300,
  syncTooltips = true,
}) => {
  const [hoveredDistance, setHoveredDistance] = useState<number | undefined>();

  const traces = useMemo(() => {
    const allTraces: Plotly.Data[] = [];

    channels.forEach((channel, channelIndex) => {
      laps.forEach((lap, lapIndex) => {
        const telemetry = lap.telemetry;
        const data = telemetry[channel];

        allTraces.push({
          x: telemetry.distance,
          y: data,
          type: 'scatter',
          mode: 'lines',
          name: `${CHANNEL_CONFIG[channel].title} - Lap ${lap.lapNumber}`,
          line: {
            color: LAP_COLORS[lapIndex % LAP_COLORS.length],
            width: 2,
          },
          yaxis: channelIndex === 0 ? 'y' : `y${channelIndex + 1}`,
          legendgroup: `lap${lapIndex}`,
          showlegend: channelIndex === 0,
          hovertemplate:
            `<b>Lap ${lap.lapNumber} - ${lap.driverId}</b><br>` +
            `Distance: %{x:.0f}m<br>` +
            `${CHANNEL_CONFIG[channel].title}: %{y:.1f}<br>` +
            `<extra></extra>`,
        });
      });
    });

    return allTraces;
  }, [laps, channels]);

  const layout = useMemo(() => {
    const yaxes: Record<string, Partial<Plotly.LayoutAxis>> = {};

    channels.forEach((channel, index) => {
      const yaxisKey = index === 0 ? 'yaxis' : `yaxis${index + 1}`;
      yaxes[yaxisKey] = {
        title: { text: CHANNEL_CONFIG[channel].title },
        showgrid: true,
        zeroline: false,
        domain: [
          (channels.length - index - 1) / channels.length,
          (channels.length - index) / channels.length - 0.05,
        ],
      };
    });

    const shapes: Partial<Plotly.Shape>[] = [];

    // Add highlight line if distance is specified
    if (highlightDistance !== undefined || hoveredDistance !== undefined) {
      const distance = highlightDistance ?? hoveredDistance;
      shapes.push({
        type: 'line',
        x0: distance,
        x1: distance,
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
      xaxis: {
        title: { text: 'Distance (m)' },
        showgrid: true,
        zeroline: false,
        domain: [0, 1],
      },
      ...yaxes,
      hovermode: syncTooltips ? ('x unified' as const) : ('closest' as const),
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
        t: 30,
        b: 60,
      },
      width,
      height: height * channels.length,
      shapes,
    };
  }, [channels, corners, width, height, highlightDistance, hoveredDistance, syncTooltips]);

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
    if (event.points && event.points.length > 0) {
      const point = event.points[0];
      const distance = point.x as number;
      const lapIndex = Math.floor(point.curveNumber / channels.length);

      setHoveredDistance(distance);

      if (onHover) {
        const corner = findCornerAtDistance(distance, corners);
        onHover(distance, lapIndex, corner?.name);
      }
    }
  };

  const handleUnhover = () => {
    setHoveredDistance(undefined);
  };

  return (
    <Plot
      data={traces}
      layout={layout}
      config={config}
      onHover={handleHover}
      onUnhover={handleUnhover}
    />
  );
};
