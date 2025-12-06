import React from 'react';
import type { AppError } from '../types';
import { getUserFriendlyErrorMessage } from '../utils/errorHandler';
import './ErrorDisplay.css';

export interface ErrorDisplayProps {
  error: AppError;
  onRetry?: () => void;
  onDismiss?: () => void;
  compact?: boolean;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  onDismiss,
  compact = false,
}) => {
  const { title, message, action } = getUserFriendlyErrorMessage(error);

  if (compact) {
    return (
      <div className="error-display error-display--compact" role="alert" aria-live="assertive">
        <div className="error-display__icon" aria-hidden="true">
          ⚠️
        </div>
        <div className="error-display__content">
          <p className="error-display__message">{message}</p>
        </div>
        {(onRetry || onDismiss) && (
          <div className="error-display__actions">
            {onRetry && error.retryable && (
              <button
                className="error-display__button error-display__button--small"
                onClick={onRetry}
                aria-label={`${action || 'Retry'} after error`}
              >
                {action || 'Retry'}
              </button>
            )}
            {onDismiss && (
              <button
                className="error-display__button error-display__button--small error-display__button--text"
                onClick={onDismiss}
                aria-label="Dismiss error message"
              >
                Dismiss
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="error-display"
      role="alert"
      aria-live="assertive"
      aria-labelledby="error-title"
      aria-describedby="error-message"
    >
      <div className="error-display__icon" aria-hidden="true">
        ⚠️
      </div>
      <div className="error-display__content">
        <h3 id="error-title" className="error-display__title">
          {title}
        </h3>
        <p id="error-message" className="error-display__message">
          {message}
        </p>
        {error.details && (
          <details className="error-display__details">
            <summary>Technical details</summary>
            <pre className="error-display__details-content" aria-label="Error technical details">
              {JSON.stringify(error.details, null, 2)}
            </pre>
          </details>
        )}
      </div>
      {(onRetry || onDismiss) && (
        <div className="error-display__actions">
          {onRetry && error.retryable && (
            <button
              className="error-display__button error-display__button--primary"
              onClick={onRetry}
              aria-label={`${action || 'Retry'} after error`}
            >
              {action || 'Retry'}
            </button>
          )}
          {onDismiss && (
            <button
              className="error-display__button error-display__button--secondary"
              onClick={onDismiss}
              aria-label="Dismiss error message"
            >
              Dismiss
            </button>
          )}
        </div>
      )}
    </div>
  );
};
