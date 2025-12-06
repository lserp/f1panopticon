import React from 'react';
import { ReplayController } from './ReplayController';
import { MultiChannelTelemetryChart } from './MultiChannelTelemetryChart';
import { useReplaySync } from '../hooks/useReplaySync';
import type { LapData, Corner } from '../types';

export interface ReplayViewProps {
  laps: LapData[];
  channels?: Array<'speed' | 'throttle' | 'brake' | 'gear'>;
  corners?: Corner[];
  width?: number;
  height?: number;
}

/**
 * ReplayView component combines the replay controller with synchronized telemetry visualization
 * All telemetry channels are synchronized to the replay time
 */
export const ReplayView: React.FC<ReplayViewProps> = ({
  laps,
  channels = ['speed', 'throttle', 'brake', 'gear'],
  corners = [],
  width = 1200,
  height = 300,
}) => {
  // Calculate session duration from the longest lap
  const sessionDuration = React.useMemo(() => {
    if (laps.length === 0) return 0;

    return Math.max(
      ...laps.map((lap) => {
        const telemetry = lap.telemetry;
        if (!telemetry.time || telemetry.time.length === 0) return 0;
        return telemetry.time[telemetry.time.length - 1];
      })
    );
  }, [laps]);

  // Use the first lap's telemetry for synchronization
  const primaryTelemetry = laps[0]?.telemetry ?? null;

  // Synchronize to replay time
  const { currentDistance } = useReplaySync(primaryTelemetry);

  return (
    <div style={styles.container}>
      <div style={styles.chartContainer}>
        <MultiChannelTelemetryChart
          laps={laps}
          channels={channels}
          corners={corners}
          highlightDistance={currentDistance}
          width={width}
          height={height}
          syncTooltips={true}
        />
      </div>

      <div style={styles.controllerContainer}>
        <ReplayController sessionDuration={sessionDuration} />
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '16px',
  },
  chartContainer: {
    flex: 1,
    overflow: 'auto',
  },
  controllerContainer: {
    flexShrink: 0,
  },
};
