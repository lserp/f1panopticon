import React, { useState } from 'react';
import {
  ErrorBoundary,
  ErrorDisplay,
  LoadingSpinner,
  ProgressBar,
  CacheIndicator,
  ToastContainer,
  DataSourceIndicator,
} from '../components';
import { useErrorHandler, useLoadingState, useToast } from '../hooks';
import { createAppError } from '../utils';

/**
 * Example component demonstrating error handling and user feedback features
 */
export const ErrorHandlingExample: React.FC = () => {
  const { error, errorMessage, setError, clearError } = useErrorHandler();
  const { isLoading, progress, message, startLoading, stopLoading, setProgress, withLoading } =
    useLoadingState();
  const { toasts, showSuccess, showError, showWarning, showInfo, dismissToast } = useToast();
  const [cacheHit, setCacheHit] = useState(true);

  // Simulate API call with loading state
  const handleSimulateApiCall = async () => {
    await withLoading(async () => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      showSuccess('Data loaded successfully!', 'Success');
    }, 'Loading data from API...');
  };

  // Simulate API call with progress
  const handleSimulateProgress = async () => {
    startLoading('Processing data...');
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      setProgress(i, `Processing: ${i}%`);
    }
    stopLoading();
    showSuccess('Processing complete!');
  };

  // Simulate different error types
  const handleSimulateError = (errorType: string) => {
    const appError = createAppError(new Error('Simulated error'), errorType as any);
    setError(appError);
    showError(errorMessage?.message || 'An error occurred', errorMessage?.title);
  };

  // Simulate cache toggle
  const handleToggleCache = () => {
    setCacheHit(!cacheHit);
    showInfo(cacheHit ? 'Switched to live data' : 'Switched to cached data');
  };

  return (
    <ErrorBoundary>
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <h1>Error Handling & User Feedback Demo</h1>

        {/* Toast Container */}
        <ToastContainer toasts={toasts} onClose={dismissToast} position="top-right" />

        {/* Error Display */}
        {error && (
          <ErrorDisplay
            error={error}
            onRetry={() => {
              clearError();
              showInfo('Retrying...');
            }}
            onDismiss={clearError}
          />
        )}

        {/* Loading States */}
        <section style={{ marginTop: '2rem' }}>
          <h2>Loading States</h2>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <button onClick={handleSimulateApiCall}>Simulate API Call</button>
            <button onClick={handleSimulateProgress}>Simulate Progress</button>
          </div>

          {isLoading && (
            <div style={{ marginTop: '1rem' }}>
              <LoadingSpinner size="medium" message={message || undefined} />
              {progress !== null && (
                <ProgressBar progress={progress} message={message || undefined} />
              )}
            </div>
          )}
        </section>

        {/* Toast Notifications */}
        <section style={{ marginTop: '2rem' }}>
          <h2>Toast Notifications</h2>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button onClick={() => showSuccess('Operation completed successfully!')}>
              Show Success
            </button>
            <button onClick={() => showError('Something went wrong!')}>Show Error</button>
            <button onClick={() => showWarning('Please review your settings')}>Show Warning</button>
            <button onClick={() => showInfo('New data available')}>Show Info</button>
          </div>
        </section>

        {/* Error Simulation */}
        <section style={{ marginTop: '2rem' }}>
          <h2>Error Types</h2>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button onClick={() => handleSimulateError('API_CONNECTION_ERROR')}>
              Connection Error
            </button>
            <button onClick={() => handleSimulateError('API_RATE_LIMIT')}>Rate Limit Error</button>
            <button onClick={() => handleSimulateError('API_AUTHENTICATION_ERROR')}>
              Auth Error
            </button>
            <button onClick={() => handleSimulateError('CACHE_ERROR')}>Cache Error</button>
          </div>
        </section>

        {/* Indicators */}
        <section style={{ marginTop: '2rem' }}>
          <h2>Data Indicators</h2>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <CacheIndicator isHit={cacheHit} />
            <button onClick={handleToggleCache}>Toggle Cache</button>
            <DataSourceIndicator source="fastf1" fetchedAt={new Date(Date.now() - 300000)} />
            <DataSourceIndicator source="ergast" fetchedAt={new Date(Date.now() - 3600000)} />
            <DataSourceIndicator source="openf1" fetchedAt={new Date()} />
          </div>
        </section>

        {/* Progress Bar Examples */}
        <section style={{ marginTop: '2rem' }}>
          <h2>Progress Bars</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <ProgressBar progress={25} variant="default" message="Loading..." />
            <ProgressBar progress={50} variant="success" message="Processing..." />
            <ProgressBar progress={75} variant="warning" message="Almost done..." />
            <ProgressBar progress={100} variant="error" message="Failed" />
          </div>
        </section>
      </div>
    </ErrorBoundary>
  );
};
