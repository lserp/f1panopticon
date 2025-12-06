# Error Handling and User Feedback System

This document describes the error handling and user feedback components implemented for the F1 Analysis Platform.

## Overview

The error handling system provides comprehensive error management, loading states, progress tracking, and user notifications throughout the application. It includes:

1. **Error Boundaries** - Catch and handle React component errors
2. **Error Display** - Show user-friendly error messages
3. **Loading States** - Indicate data fetching and processing
4. **Progress Tracking** - Show progress for long-running operations
5. **Toast Notifications** - Provide feedback for user actions
6. **Data Indicators** - Show cache status and data sources

## Components

### ErrorBoundary

A React error boundary component that catches errors in child components and displays a fallback UI.

```tsx
import { ErrorBoundary } from './components';

<ErrorBoundary
  fallback={(error, errorInfo, retry) => (
    <CustomErrorUI error={error} onRetry={retry} />
  )}
  onError={(error, errorInfo) => {
    // Log to error tracking service
  }}
>
  <YourApp />
</ErrorBoundary>
```

**Features:**
- Catches React component errors
- Provides default error UI with retry functionality
- Supports custom fallback UI
- Logs errors to console and error tracking services
- Allows error recovery without full page reload

### ErrorDisplay

An inline component for displaying errors with user-friendly messages.

```tsx
import { ErrorDisplay } from './components';
import { useErrorHandler } from './hooks';

const MyComponent = () => {
  const { error, clearError } = useErrorHandler();

  if (error) {
    return (
      <ErrorDisplay
        error={error}
        onRetry={() => {
          clearError();
          // Retry logic
        }}
        onDismiss={clearError}
        compact={false}
      />
    );
  }

  return <div>Content</div>;
};
```

**Features:**
- Converts technical errors to user-friendly messages
- Shows retry button for recoverable errors
- Displays technical details in collapsible section
- Supports compact mode for inline display

### LoadingSpinner

A spinner component for indicating loading states.

```tsx
import { LoadingSpinner } from './components';

<LoadingSpinner
  size="medium"
  message="Loading telemetry data..."
  fullScreen={false}
/>
```

**Props:**
- `size`: 'small' | 'medium' | 'large'
- `message`: Optional loading message
- `fullScreen`: Display as full-screen overlay

### ProgressBar

A progress bar component for showing operation progress.

```tsx
import { ProgressBar } from './components';

<ProgressBar
  progress={75}
  message="Processing lap data..."
  showPercentage={true}
  variant="default"
  size="medium"
/>
```

**Props:**
- `progress`: 0-100
- `message`: Optional progress message
- `showPercentage`: Show percentage text
- `variant`: 'default' | 'success' | 'warning' | 'error'
- `size`: 'small' | 'medium' | 'large'

### Toast Notifications

Toast notifications for user feedback.

```tsx
import { ToastContainer } from './components';
import { useToast } from './hooks';

const MyComponent = () => {
  const { toasts, showSuccess, showError, dismissToast } = useToast();

  const handleAction = async () => {
    try {
      await performAction();
      showSuccess('Action completed successfully!', 'Success');
    } catch (error) {
      showError('Action failed. Please try again.', 'Error');
    }
  };

  return (
    <>
      <ToastContainer
        toasts={toasts}
        onClose={dismissToast}
        position="top-right"
      />
      <button onClick={handleAction}>Perform Action</button>
    </>
  );
};
```

**Toast Types:**
- `success`: Green toast for successful operations
- `error`: Red toast for errors
- `warning`: Orange toast for warnings
- `info`: Blue toast for informational messages

### CacheIndicator

Shows whether data was loaded from cache or fetched live.

```tsx
import { CacheIndicator } from './components';

<CacheIndicator
  isHit={true}
  showLabel={true}
  compact={false}
/>
```

**Features:**
- Visual indicator for cache hits/misses
- Helps users understand data freshness
- Compact mode for inline display

### DataSourceIndicator

Shows which API provided the data and when it was fetched.

```tsx
import { DataSourceIndicator } from './components';

<DataSourceIndicator
  source="fastf1"
  fetchedAt={new Date()}
  showTimestamp={true}
  compact={false}
/>
```

**Features:**
- Shows data source (FastF1, Ergast, OpenF1)
- Displays relative timestamp (e.g., "5m ago")
- Color-coded by source
- Compact mode for inline display

## Hooks

### useErrorHandler

Hook for managing errors in components.

```tsx
import { useErrorHandler } from './hooks';

const MyComponent = () => {
  const { error, errorMessage, setError, clearError, handleError } = useErrorHandler();

  const fetchData = async () => {
    try {
      const data = await api.fetchData();
    } catch (err) {
      handleError(err, 'Failed to fetch data');
    }
  };

  return (
    <>
      {error && <ErrorDisplay error={error} onDismiss={clearError} />}
      <button onClick={fetchData}>Fetch Data</button>
    </>
  );
};
```

**Returns:**
- `error`: Current AppError or null
- `errorMessage`: User-friendly error message
- `setError`: Set an error
- `clearError`: Clear the current error
- `handleError`: Handle and log an error

### useLoadingState

Hook for managing loading states with optional progress tracking.

```tsx
import { useLoadingState } from './hooks';

const MyComponent = () => {
  const { isLoading, progress, message, startLoading, stopLoading, setProgress, withLoading } =
    useLoadingState();

  const fetchData = async () => {
    await withLoading(async () => {
      const data = await api.fetchData();
      return data;
    }, 'Loading data...');
  };

  const processData = async () => {
    startLoading('Processing data...');
    for (let i = 0; i <= 100; i += 10) {
      await processChunk(i);
      setProgress(i, `Processing: ${i}%`);
    }
    stopLoading();
  };

  return (
    <>
      {isLoading && (
        <>
          <LoadingSpinner message={message || undefined} />
          {progress !== null && <ProgressBar progress={progress} />}
        </>
      )}
      <button onClick={fetchData}>Fetch Data</button>
      <button onClick={processData}>Process Data</button>
    </>
  );
};
```

**Returns:**
- `isLoading`: Boolean loading state
- `progress`: Current progress (0-100) or null
- `message`: Loading message or null
- `startLoading`: Start loading with optional message
- `stopLoading`: Stop loading
- `setProgress`: Update progress and message
- `withLoading`: Wrap async function with loading state

### useToast

Hook for managing toast notifications.

```tsx
import { useToast } from './hooks';

const MyComponent = () => {
  const {
    toasts,
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    dismissToast,
    clearAllToasts,
  } = useToast();

  const handleSave = async () => {
    try {
      await saveData();
      showSuccess('Data saved successfully!');
    } catch (error) {
      showError('Failed to save data');
    }
  };

  return (
    <>
      <ToastContainer toasts={toasts} onClose={dismissToast} />
      <button onClick={handleSave}>Save</button>
    </>
  );
};
```

**Returns:**
- `toasts`: Array of active toasts
- `showToast`: Show a toast with custom options
- `showSuccess`: Show success toast
- `showError`: Show error toast
- `showWarning`: Show warning toast
- `showInfo`: Show info toast
- `dismissToast`: Dismiss a specific toast
- `clearAllToasts`: Clear all toasts

## Utilities

### Error Handler Utilities

```tsx
import {
  getUserFriendlyErrorMessage,
  createAppError,
  isAppError,
  logError,
  retryWithBackoff,
} from './utils';

// Convert error to user-friendly message
const message = getUserFriendlyErrorMessage(appError);

// Create AppError from any error
const appError = createAppError(error, 'API_CONNECTION_ERROR');

// Check if error is AppError
if (isAppError(error)) {
  // Handle AppError
}

// Log error with context
logError(appError, 'Failed to fetch session data');

// Retry with exponential backoff
const data = await retryWithBackoff(
  () => api.fetchData(),
  {
    maxRetries: 3,
    initialDelayMs: 1000,
    onRetry: (attempt, error) => {
      console.log(`Retry attempt ${attempt}`, error);
    },
  }
);
```

## Error Types

The system supports the following error types:

- `API_CONNECTION_ERROR`: Network or connection issues
- `API_RATE_LIMIT`: Rate limit exceeded
- `API_AUTHENTICATION_ERROR`: Invalid credentials
- `DATA_VALIDATION_ERROR`: Invalid data format
- `CACHE_ERROR`: Storage issues
- `VISUALIZATION_ERROR`: Rendering issues
- `ANALYSIS_ERROR`: Calculation errors

Each error type has:
- User-friendly title and message
- Suggested action
- Recoverable flag
- Retryable flag

## Best Practices

1. **Wrap your app in ErrorBoundary**
   ```tsx
   <ErrorBoundary>
     <App />
   </ErrorBoundary>
   ```

2. **Use useErrorHandler for component-level errors**
   ```tsx
   const { handleError } = useErrorHandler();
   try {
     await operation();
   } catch (error) {
     handleError(error, 'Operation failed');
   }
   ```

3. **Show loading states for async operations**
   ```tsx
   const { withLoading } = useLoadingState();
   await withLoading(() => fetchData(), 'Loading...');
   ```

4. **Provide user feedback with toasts**
   ```tsx
   const { showSuccess, showError } = useToast();
   try {
     await save();
     showSuccess('Saved successfully!');
   } catch (error) {
     showError('Save failed');
   }
   ```

5. **Show data source and cache status**
   ```tsx
   <DataSourceIndicator source={data.source} fetchedAt={data.fetchedAt} />
   <CacheIndicator isHit={fromCache} />
   ```

## Example Usage

See `src/examples/ErrorHandlingExample.tsx` for a complete example demonstrating all features.

## Requirements Validation

This implementation satisfies the following requirements:

- **Requirement 1.3**: Error handling with retry mechanisms for recoverable errors
- **Requirement 2.1**: Loading states for data fetching operations
- **Requirement 2.4**: Cache hit/miss indicators
- **Requirement 12.2**: User notifications for actions and feedback
- **Requirement 13.4**: User-friendly error messages
- **Requirement 13.5**: Data source attribution and freshness information
