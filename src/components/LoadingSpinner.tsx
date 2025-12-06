import React from 'react';
import './LoadingSpinner.css';

export interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  message,
  fullScreen = false,
}) => {
  const ariaLabel = message || 'Loading';

  const spinner = (
    <div
      className={`loading-spinner loading-spinner--${size}`}
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
    >
      <div className="loading-spinner__circle" aria-hidden="true">
        <div className="loading-spinner__inner"></div>
      </div>
      {message && (
        <p className="loading-spinner__message" aria-live="polite">
          {message}
        </p>
      )}
      <span className="sr-only">{ariaLabel}</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="loading-spinner__fullscreen" role="alert" aria-busy="true">
        {spinner}
      </div>
    );
  }

  return spinner;
};
