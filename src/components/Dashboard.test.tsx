import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Dashboard } from './Dashboard';
import { useAppStore } from '../store';

describe('Dashboard', () => {
  beforeEach(() => {
    // Reset store to initial state
    useAppStore.setState({
      chartLayout: {
        columns: 2,
        rows: 2,
        charts: [
          {
            id: 'speed',
            type: 'speed',
            position: { x: 0, y: 0, w: 1, h: 1 },
            visible: true,
          },
          {
            id: 'throttle',
            type: 'throttle',
            position: { x: 1, y: 0, w: 1, h: 1 },
            visible: true,
          },
        ],
      },
      fullscreenChart: null,
      selectedLaps: [],
    });
  });

  it('should render dashboard with visible charts', () => {
    render(<Dashboard />);

    // Check that chart titles are rendered
    expect(screen.getByText('Speed')).toBeDefined();
    expect(screen.getByText('Throttle')).toBeDefined();
  });

  it('should render fullscreen buttons for each chart', () => {
    render(<Dashboard />);

    const fullscreenButtons = screen.getAllByLabelText(/Enter fullscreen/i);
    expect(fullscreenButtons.length).toBe(2);
  });

  it('should only render visible charts', () => {
    useAppStore.setState({
      chartLayout: {
        columns: 2,
        rows: 2,
        charts: [
          {
            id: 'speed',
            type: 'speed',
            position: { x: 0, y: 0, w: 1, h: 1 },
            visible: true,
          },
          {
            id: 'throttle',
            type: 'throttle',
            position: { x: 1, y: 0, w: 1, h: 1 },
            visible: false,
          },
        ],
      },
    });

    render(<Dashboard />);

    expect(screen.getByText('Speed')).toBeDefined();
    expect(screen.queryByText('Throttle')).toBeNull();
  });
});
