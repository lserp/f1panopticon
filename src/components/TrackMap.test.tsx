import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { TrackMap } from './TrackMap';
import type { TrackData, PitExitAnalysis } from '../types';

describe('TrackMap Component', () => {
  const mockTrackData: TrackData = {
    circuitId: 'monaco',
    circuitName: 'Monaco',
    length: 3337,
    corners: [
      { number: 1, name: 'Sainte Devote', distance: 100, type: 'slow', angle: 90 },
      { number: 2, name: 'Massenet', distance: 500, type: 'medium', angle: 45 },
    ],
    sectors: [
      { number: 1, startDistance: 0, endDistance: 1000 },
      { number: 2, startDistance: 1000, endDistance: 2000 },
      { number: 3, startDistance: 2000, endDistance: 3337 },
    ],
    pitEntry: 2800,
    pitExit: 3000,
    drsZones: [{ number: 1, detectionPoint: 1500, activationPoint: 1600, endPoint: 1900 }],
    coordinates: [
      { distance: 0, x: 0, y: 0 },
      { distance: 100, x: 100, y: 0 },
      { distance: 200, x: 200, y: 50 },
      { distance: 500, x: 300, y: 100 },
      { distance: 1000, x: 400, y: 200 },
      { distance: 2000, x: 300, y: 300 },
      { distance: 3000, x: 100, y: 200 },
      { distance: 3337, x: 0, y: 100 },
    ],
  };

  it('should render without crashing', () => {
    const { container } = render(<TrackMap trackData={mockTrackData} />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeTruthy();
  });

  it('should render with specified dimensions', () => {
    const { container } = render(<TrackMap trackData={mockTrackData} width={1000} height={800} />);
    const canvas = container.querySelector('canvas');
    expect(canvas?.width).toBe(1000);
    expect(canvas?.height).toBe(800);
  });

  it('should render with pit exit analysis', () => {
    const pitExitAnalysis: PitExitAnalysis = {
      pitLap: 15,
      exitDistance: 3000,
      exitTime: new Date(),
      positionBefore: 5,
      positionAfter: 4,
      carsAhead: [{ driverId: 'VER', position: 3, distance: 3200, gap: 2.5 }],
      carsBehind: [{ driverId: 'SAI', position: 5, distance: 2800, gap: -1.8 }],
      gapAhead: 2.5,
      gapBehind: 1.8,
      trafficImpact: 'minor',
    };

    const { container } = render(
      <TrackMap trackData={mockTrackData} pitExitAnalysis={pitExitAnalysis} />
    );
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeTruthy();
  });

  it('should handle empty track coordinates', () => {
    const emptyTrack: TrackData = {
      ...mockTrackData,
      coordinates: [],
    };

    const { container } = render(<TrackMap trackData={emptyTrack} />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeTruthy();
  });
});
