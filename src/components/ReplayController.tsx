import React from 'react';
import { useReplayController } from '../hooks/useReplayController';
import type { PlaybackSpeed } from '../hooks/useReplayController';

export interface ReplayControllerProps {
  sessionDuration: number;
  onTimeChange?: (time: number) => void;
}

/**
 * ReplayController component provides UI controls for session replay
 * Features:
 * - Play/Pause/Stop buttons
 * - Playback speed adjustment (0.25x to 16x)
 * - Timeline scrubber for seeking
 * - Current time and duration display
 */
export const ReplayController: React.FC<ReplayControllerProps> = ({
  sessionDuration,
  onTimeChange,
}) => {
  const controller = useReplayController(sessionDuration);

  // Notify parent of time changes
  React.useEffect(() => {
    if (onTimeChange) {
      onTimeChange(controller.currentTime);
    }
  }, [controller.currentTime, onTimeChange]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const speedOptions: PlaybackSpeed[] = [0.25, 0.5, 1, 2, 4, 8, 16];

  const handlePlayPause = () => {
    if (controller.playbackState === 'playing') {
      controller.pause();
    } else if (controller.playbackState === 'paused') {
      controller.resume();
    } else {
      controller.play();
    }
  };

  const handleScrubberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const progress = parseFloat(e.target.value);
    controller.seekToProgress(progress);
  };

  return (
    <div className="replay-controller" style={styles.container}>
      {/* Playback controls */}
      <div style={styles.controls}>
        <button
          onClick={handlePlayPause}
          style={styles.button}
          aria-label={controller.playbackState === 'playing' ? 'Pause' : 'Play'}
        >
          {controller.playbackState === 'playing' ? '⏸' : '▶'}
        </button>

        <button
          onClick={controller.stop}
          style={styles.button}
          aria-label="Stop"
          disabled={controller.playbackState === 'stopped'}
        >
          ⏹
        </button>

        {/* Speed selector */}
        <div style={styles.speedControl}>
          <label htmlFor="speed-select" style={styles.label}>
            Speed:
          </label>
          <select
            id="speed-select"
            value={controller.playbackSpeed}
            onChange={(e) => controller.setSpeed(parseFloat(e.target.value) as PlaybackSpeed)}
            style={styles.select}
          >
            {speedOptions.map((speed) => (
              <option key={speed} value={speed}>
                {speed}x
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Timeline scrubber */}
      <div style={styles.timeline}>
        <span style={styles.timeDisplay}>{formatTime(controller.currentTime)}</span>

        <input
          type="range"
          min="0"
          max="1"
          step="0.001"
          value={controller.progress}
          onChange={handleScrubberChange}
          style={styles.scrubber}
          aria-label="Timeline scrubber"
        />

        <span style={styles.timeDisplay}>{formatTime(controller.duration)}</span>
      </div>

      {/* Progress bar */}
      <div style={styles.progressBar}>
        <div
          style={{
            ...styles.progressFill,
            width: `${controller.progress * 100}%`,
          }}
        />
      </div>
    </div>
  );
};

// Basic inline styles for the component
const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  button: {
    padding: '8px 16px',
    fontSize: '18px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    backgroundColor: '#fff',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  speedControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginLeft: 'auto',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
  },
  select: {
    padding: '4px 8px',
    fontSize: '14px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    backgroundColor: '#fff',
    cursor: 'pointer',
  },
  timeline: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  timeDisplay: {
    fontSize: '14px',
    fontFamily: 'monospace',
    minWidth: '80px',
  },
  scrubber: {
    flex: 1,
    cursor: 'pointer',
  },
  progressBar: {
    height: '4px',
    backgroundColor: '#e0e0e0',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2196F3',
    transition: 'width 0.1s linear',
  },
};
