import type { AppError, ErrorType } from '../types';

export interface ErrorMessage {
  title: string;
  message: string;
  action?: string;
}

/**
 * Convert an AppError into a user-friendly error message
 */
export function getUserFriendlyErrorMessage(error: AppError): ErrorMessage {
  switch (error.type) {
    case 'API_CONNECTION_ERROR':
      return {
        title: 'Connection Error',
        message:
          'Unable to connect to the F1 data service. Please check your internet connection and try again.',
        action: 'Retry',
      };

    case 'API_RATE_LIMIT':
      return {
        title: 'Rate Limit Exceeded',
        message:
          'Too many requests have been made to the F1 data service. Please wait a moment and try again.',
        action: 'Wait and Retry',
      };

    case 'API_AUTHENTICATION_ERROR':
      return {
        title: 'Authentication Error',
        message:
          'Your API credentials are invalid or have expired. Please check your settings and update your credentials.',
        action: 'Update Credentials',
      };

    case 'DATA_VALIDATION_ERROR':
      return {
        title: 'Invalid Data',
        message:
          'The data received from the service is invalid or corrupted. This may be a temporary issue.',
        action: 'Retry',
      };

    case 'CACHE_ERROR':
      return {
        title: 'Storage Error',
        message:
          'Unable to access local storage. Your browser may be in private mode or storage may be full.',
        action: 'Clear Cache',
      };

    case 'VISUALIZATION_ERROR':
      return {
        title: 'Display Error',
        message:
          'Unable to render the visualization. This may be due to invalid data or browser compatibility issues.',
        action: 'Refresh',
      };

    case 'ANALYSIS_ERROR':
      return {
        title: 'Analysis Error',
        message: 'Unable to complete the analysis. The data may be incomplete or invalid.',
        action: 'Try Different Data',
      };

    default:
      return {
        title: 'Unexpected Error',
        message: 'An unexpected error occurred. Please try again.',
        action: 'Retry',
      };
  }
}

/**
 * Create an AppError from a generic error
 */
export function createAppError(error: unknown, type: ErrorType = 'API_CONNECTION_ERROR'): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return {
      type,
      message: error.message,
      details: {
        name: error.name,
        stack: error.stack,
      },
      timestamp: new Date(),
      recoverable: true,
      retryable: true,
    };
  }

  return {
    type,
    message: String(error),
    details: error,
    timestamp: new Date(),
    recoverable: true,
    retryable: true,
  };
}

/**
 * Type guard to check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    'message' in error &&
    'timestamp' in error &&
    'recoverable' in error &&
    'retryable' in error
  );
}

/**
 * Log an error with context
 */
export function logError(error: AppError, context?: string): void {
  const logData = {
    type: error.type,
    message: error.message,
    timestamp: error.timestamp,
    recoverable: error.recoverable,
    retryable: error.retryable,
    context,
    details: error.details,
  };

  if (import.meta.env.DEV) {
    console.error('[Error]', logData);
  }

  // In production, send to error tracking service
  if (import.meta.env.PROD) {
    // Example: Sentry.captureException(error, { extra: logData });
  }
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    backoffMultiplier?: number;
    onRetry?: (attempt: number, error: AppError) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 10000,
    backoffMultiplier = 2,
    onRetry,
  } = options;

  let lastError: AppError | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = createAppError(error);

      // Don't retry if not retryable or if this was the last attempt
      if (!lastError.retryable || attempt === maxRetries) {
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(initialDelayMs * Math.pow(backoffMultiplier, attempt), maxDelayMs);

      // Call retry callback if provided
      if (onRetry) {
        onRetry(attempt + 1, lastError);
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
