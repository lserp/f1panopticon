import React, { useMemo, useState } from 'react';
import Plot from 'react-plotly.js';
import { useAppStore } from '../store';
import { checkFeatureAccess } from '../utils/featureTier';
import { LockedFeatureBadge } from './LockedFeatureBadge';
import type { LapData, Corner } from '../types';
import type { ExtendedTelemetryData } from '../services/premiumApiClient';
import { findCornerAtDistance } from '../utils/tooltipHelpers';

export type TelemetryChannel =
  | 'speed'
  | 'throttle'
  | 'brake'
  | 'gear'
  | 'rpm'
  | 'drs'
  | 'ers'
  | 'ersStore'
  | 'ersHarvest'
  | 'fuelFlow'
  | 'oilTemp'
  | 'waterTemp';

export interface PremiumMultiChannelChartProps {
  laps: LapData[];
  channels: TelemetryChannel[];
  corners?: Corner[];
  onHover?: (distance: number, lapIndex: number, cornerName?: string) => void;
  highlightDistance?: number;
  width?: number;
  height?: number;
  syncTooltips?: boolean;
  onUpgrade?: () => void;
}

const CHANNEL_CONFIG: Record<TelemetryChannel, { title: string; color: string; premium: boolean }> =
  {
    speed: { title: 'Speed (km/h)', color: '#1f77b4', premium: false },
    throttle: { title: 'Throttle (%)', color: '#2ca02c', premium: false },
    brake: { title: 'Brake (%)', color: '#d62728', premium: false },
    gear: { title: 'Gear', color: '#ff7f0e', premium: false },
    rpm: { title: 'RPM', color: '#9467bd', premium: false },
    drs: { title: 'DRS', color: '#8c564b', premium: true },
    ers: { title: 'ERS Deployment (%)', color: '#e377c2', premium: true },
    ersStore: { title: 'ERS Store (%)', color: '#7f7f7f', premium: true },
    ersHarvest: { title: 'ERS Harvest (kW)', color: '#bcbd22', premium: true },
    fuelFlow: { title: 'Fuel Flow (kg/h)', color: '#17becf', premium: true },
    oilTemp: { title: 'Oil Temp (°C)', color: '#ff9896', premium: true },
    waterTemp: { title: 'Water Temp (°C)', color: '#98df8a', premium: true },
  };

const LAP_COLORS = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728'];

export const PremiumMultiChannelChart: React.FC<PremiumMultiChannelChartProps> = ({
  laps,
  channels,
  corners = [],
  onHover,
  highlightDistance,
  width = 1200,
  height = 300,
  syncTooltips = true,
  onUpgrade,
}) => {
  const apiCredentials = useAppStore((state) => state.apiCredentials);
  const [hoveredDistance, setHoveredDistance] = useState<number | undefined>();

  // Check if extended channels are available
  const hasExtendedChannels = checkFeatureAccess(apiCredentials, 'extended-telemetry');
  const maxChannels = checkFeatureAccess(apiCredentials, 'extended-charts') ? 12 : 6;

  // Filter channels based on availability and limits
  const availableChannels = useMemo(() => {
    const filtered = channels.filter((channel) => {
      const config = CHANNEL_CONFIG[channel];
      // Allow non-premium channels or premium channels if user has access
      return !config.premium || hasExtendedChannels;
    });

    // Limit to max channels
    return filtered.slice(0, maxChannels);
  }, [channels, hasExtendedChannels, maxChannels]);

  // Check if any requested channels are locked
  const lockedChannels = useMemo(() => {
    return channels.filter((channel) => {
      const config = CHANNEL_CONFIG[channel];
      return config.premium && !hasExtendedChannels;
    });
  }, [channels, hasExtendedChannels]);

  // Check if channel limit exceeded
  const channelLimitExceeded = channels.length > maxChannels;

  const traces = useMemo(() => {
    const allTraces: Plotly.Data[] = [];

    availableChannels.forEach((channel, channelIndex) => {
      laps.forEach((lap, lapIndex) => {
        const telemetry = lap.telemetry as ExtendedTelemetryData;

        // Get data for the channel
        let data: number[] | undefined;
        if (channel in telemetry) {
          data = telemetry[channel as keyof typeof telemetry] as number[];
        }

        if (!data || !Array.isArray(data)) {
          return; // Skip if data not available
        }

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
  }, [laps, availableChannels]);

  const layout = useMemo(() => {
    const yaxes: Record<string, Partial<Plotly.LayoutAxis>> = {};

    availableChannels.forEach((channel, index) => {
      const yaxisKey = index === 0 ? 'yaxis' : `yaxis${index + 1}`;
      yaxes[yaxisKey] = {
        title: { text: CHANNEL_CONFIG[channel].title },
        showgrid: true,
        zeroline: false,
        domain: [
          (availableChannels.length - index - 1) / availableChannels.length,
          (availableChannels.length - index) / availableChannels.length - 0.05,
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
      height: height * availableChannels.length,
      shapes,
    };
  }, [availableChannels, corners, width, height, highlightDistance, hoveredDistance, syncTooltips]);

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
      const lapIndex = Math.floor(point.curveNumber / availableChannels.length);

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

  // Show warning if channels are locked or limit exceeded
  if (lockedChannels.length > 0 || channelLimitExceeded) {
    return (
      <div style={{ position: 'relative', minHeight: '400px' }}>
        <Plot
          data={traces}
          layout={layout}
          config={config}
          onHover={handleHover}
          onUnhover={handleUnhover}
          style={{ opacity: 0.3 }}
        />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          <LockedFeatureBadge
            featureId="extended-telemetry"
            message={
              lockedChannels.length > 0
                ? `Premium channels (${lockedChannels.map((c) => CHANNEL_CONFIG[c].title).join(', ')}) require a premium account`
                : `You can display up to ${maxChannels} channels. Upgrade to premium for 12 concurrent channels.`
            }
            onUpgrade={onUpgrade}
          />
        </div>
      </div>
    );
  }

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
