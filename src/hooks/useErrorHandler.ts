import { useState, useCallback } from 'react';
import type { AppError } from '../types';
import {
  createAppError,
  getUserFriendlyErrorMessage,
  logError,
} from '../utils/errorHandler';
import type { ErrorMessage } from '../utils/errorHandler';

export interface UseErrorHandlerReturn {
  error: AppError | null;
  errorMessage: ErrorMessage | null;
  setError: (error: unknown) => void;
  clearError: () => void;
  handleError: (error: unknown, context?: string) => void;
}

/**
 * Hook for managing errors in components
 */
export function useErrorHandler(): UseErrorHandlerReturn {
  const [error, setErrorState] = useState<AppError | null>(null);
  const [errorMessage, setErrorMessage] = useState<ErrorMessage | null>(null);

  const setError = useCallback((error: unknown) => {
    const appError = createAppError(error);
    setErrorState(appError);
    setErrorMessage(getUserFriendlyErrorMessage(appError));
  }, []);

  const clearError = useCallback(() => {
    setErrorState(null);
    setErrorMessage(null);
  }, []);

  const handleError = useCallback(
    (error: unknown, context?: string) => {
      const appError = createAppError(error);
      logError(appError, context);
      setError(appError);
    },
    [setError]
  );

  return {
    error,
    errorMessage,
    setError,
    clearError,
    handleError,
  };
}
