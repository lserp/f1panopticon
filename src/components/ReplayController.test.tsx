import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReplayController } from './ReplayController';

describe('ReplayController', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('renders with initial stopped state', () => {
    render(<ReplayController sessionDuration={100} />);

    expect(screen.getByLabelText('Play')).toBeInTheDocument();
    expect(screen.getByLabelText('Stop')).toBeInTheDocument();
    expect(screen.getByLabelText('Timeline scrubber')).toBeInTheDocument();
  });

  it('displays formatted time correctly', () => {
    render(<ReplayController sessionDuration={125.5} />);

    // Should show 00:00.00 initially
    expect(screen.getByText('00:00.00')).toBeInTheDocument();
    // Should show duration as 02:05.50
    expect(screen.getByText('02:05.50')).toBeInTheDocument();
  });

  it('changes to pause button when playing', () => {
    render(<ReplayController sessionDuration={100} />);

    const playButton = screen.getByLabelText('Play');
    fireEvent.click(playButton);

    expect(screen.getByLabelText('Pause')).toBeInTheDocument();
  });

  it('allows speed adjustment', () => {
    render(<ReplayController sessionDuration={100} />);

    const speedSelect = screen.getByLabelText('Speed:');
    fireEvent.change(speedSelect, { target: { value: '2' } });

    expect(speedSelect).toHaveValue('2');
  });

  it('allows seeking via scrubber', () => {
    const onTimeChange = vi.fn();
    render(<ReplayController sessionDuration={100} onTimeChange={onTimeChange} />);

    const scrubber = screen.getByLabelText('Timeline scrubber');
    fireEvent.change(scrubber, { target: { value: '0.5' } });

    // Should seek to 50 seconds (50% of 100)
    waitFor(() => {
      expect(onTimeChange).toHaveBeenCalledWith(50);
    });
  });

  it('stops playback when stop button is clicked', () => {
    render(<ReplayController sessionDuration={100} />);

    const playButton = screen.getByLabelText('Play');
    fireEvent.click(playButton);

    const stopButton = screen.getByLabelText('Stop');
    fireEvent.click(stopButton);

    expect(screen.getByLabelText('Play')).toBeInTheDocument();
  });

  it('calls onTimeChange callback when time updates', async () => {
    const onTimeChange = vi.fn();
    render(<ReplayController sessionDuration={100} onTimeChange={onTimeChange} />);

    expect(onTimeChange).toHaveBeenCalled();
  });

  it('has all speed options available', () => {
    render(<ReplayController sessionDuration={100} />);

    const speedSelect = screen.getByLabelText('Speed:') as HTMLSelectElement;
    const options = Array.from(speedSelect.options).map((opt) => opt.value);

    expect(options).toEqual(['0.25', '0.5', '1', '2', '4', '8', '16']);
  });
});
