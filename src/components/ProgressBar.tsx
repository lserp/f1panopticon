import React from 'react';
import './ProgressBar.css';

export interface ProgressBarProps {
  progress: number; // 0-100
  message?: string;
  showPercentage?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'error';
  size?: 'small' | 'medium' | 'large';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  message,
  showPercentage = true,
  variant = 'default',
  size = 'medium',
}) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={`progress-bar progress-bar--${size}`}>
      {message && <p className="progress-bar__message">{message}</p>}
      <div className="progress-bar__container">
        <div
          className={`progress-bar__fill progress-bar__fill--${variant}`}
          style={{ width: `${clampedProgress}%` }}
        >
          {showPercentage && (
            <span className="progress-bar__percentage">{Math.round(clampedProgress)}%</span>
          )}
        </div>
      </div>
    </div>
  );
};
