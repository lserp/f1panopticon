import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { TelemetryChart } from './TelemetryChart';
import { MultiChannelTelemetryChart } from './MultiChannelTelemetryChart';
import { TelemetryComparisonChart } from './TelemetryComparisonChart';
import type { LapData } from '../types';

// Mock Plotly to avoid canvas issues in tests
vi.mock('react-plotly.js', () => ({
  default: () => <div data-testid="plotly-chart">Mocked Plotly Chart</div>,
}));

describe('TelemetryChart', () => {
  const mockLap: LapData = {
    sessionId: 'test-session',
    driverId: 'VER',
    lapNumber: 1,
    lapTime: 90.5,
    sector1Time: 30.0,
    sector2Time: 30.0,
    sector3Time: 30.5,
    tireCompound: 'SOFT',
    tireAge: 5,
    telemetry: {
      distance: [0, 100, 200, 300, 400, 500],
      time: [0, 1, 2, 3, 4, 5],
      speed: [100, 150, 200, 250, 300, 280],
      throttle: [50, 70, 90, 100, 100, 80],
      brake: [0, 0, 0, 0, 0, 20],
      gear: [3, 4, 5, 6, 7, 7],
      rpm: [10000, 11000, 12000, 13000, 14000, 13500],
      drs: [0, 0, 1, 1, 1, 0],
      nGear: [0.3, 0.4, 0.5, 0.6, 0.7, 0.7],
    },
    fuelLoad: 100,
    trackStatus: 'green',
  };

  it('should render without crashing', () => {
    const { getByTestId } = render(<TelemetryChart laps={[mockLap]} channel="speed" />);
    expect(getByTestId('plotly-chart')).toBeDefined();
  });

  it('should accept multiple channels', () => {
    const channels: Array<'speed' | 'throttle' | 'brake' | 'gear'> = [
      'speed',
      'throttle',
      'brake',
      'gear',
    ];

    channels.forEach((channel) => {
      const { getByTestId, unmount } = render(
        <TelemetryChart laps={[mockLap]} channel={channel} />
      );
      expect(getByTestId('plotly-chart')).toBeDefined();
      unmount();
    });
  });
});

describe('MultiChannelTelemetryChart', () => {
  const mockLap: LapData = {
    sessionId: 'test-session',
    driverId: 'VER',
    lapNumber: 1,
    lapTime: 90.5,
    sector1Time: 30.0,
    sector2Time: 30.0,
    sector3Time: 30.5,
    tireCompound: 'SOFT',
    tireAge: 5,
    telemetry: {
      distance: [0, 100, 200, 300, 400, 500],
      time: [0, 1, 2, 3, 4, 5],
      speed: [100, 150, 200, 250, 300, 280],
      throttle: [50, 70, 90, 100, 100, 80],
      brake: [0, 0, 0, 0, 0, 20],
      gear: [3, 4, 5, 6, 7, 7],
      rpm: [10000, 11000, 12000, 13000, 14000, 13500],
      drs: [0, 0, 1, 1, 1, 0],
      nGear: [0.3, 0.4, 0.5, 0.6, 0.7, 0.7],
    },
    fuelLoad: 100,
    trackStatus: 'green',
  };

  it('should render with multiple channels', () => {
    const { getByTestId } = render(
      <MultiChannelTelemetryChart laps={[mockLap]} channels={['speed', 'throttle']} />
    );
    expect(getByTestId('plotly-chart')).toBeDefined();
  });

  it('should support up to 4 laps', () => {
    const laps = [
      { ...mockLap, lapNumber: 1 },
      { ...mockLap, lapNumber: 2 },
      { ...mockLap, lapNumber: 3 },
      { ...mockLap, lapNumber: 4 },
    ];

    const { getByTestId } = render(<MultiChannelTelemetryChart laps={laps} channels={['speed']} />);
    expect(getByTestId('plotly-chart')).toBeDefined();
  });
});

describe('TelemetryComparisonChart', () => {
  const mockLap1: LapData = {
    sessionId: 'test-session',
    driverId: 'VER',
    lapNumber: 1,
    lapTime: 90.5,
    sector1Time: 30.0,
    sector2Time: 30.0,
    sector3Time: 30.5,
    tireCompound: 'SOFT',
    tireAge: 5,
    telemetry: {
      distance: [0, 100, 200, 300, 400, 500],
      time: [0, 1, 2, 3, 4, 5],
      speed: [100, 150, 200, 250, 300, 280],
      throttle: [50, 70, 90, 100, 100, 80],
      brake: [0, 0, 0, 0, 0, 20],
      gear: [3, 4, 5, 6, 7, 7],
      rpm: [10000, 11000, 12000, 13000, 14000, 13500],
      drs: [0, 0, 1, 1, 1, 0],
      nGear: [0.3, 0.4, 0.5, 0.6, 0.7, 0.7],
    },
    fuelLoad: 100,
    trackStatus: 'green',
  };

  const mockLap2: LapData = {
    ...mockLap1,
    driverId: 'HAM',
    lapNumber: 2,
    lapTime: 91.0,
  };

  it('should render comparison chart', () => {
    const { getByTestId } = render(
      <TelemetryComparisonChart laps={[mockLap1, mockLap2]} channel="speed" />
    );
    expect(getByTestId('plotly-chart')).toBeDefined();
  });

  it('should support gap highlighting', () => {
    const { getByTestId } = render(
      <TelemetryComparisonChart
        laps={[mockLap1, mockLap2]}
        channel="speed"
        showGapHighlights={true}
        gapThreshold={0.1}
      />
    );
    expect(getByTestId('plotly-chart')).toBeDefined();
  });
});
