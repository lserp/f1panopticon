import { useState, useCallback } from 'react';

export interface LoadingState {
  isLoading: boolean;
  progress: number | null;
  message: string | null;
}

export interface UseLoadingStateReturn extends LoadingState {
  startLoading: (message?: string) => void;
  stopLoading: () => void;
  setProgress: (progress: number, message?: string) => void;
  withLoading: <T>(fn: () => Promise<T>, message?: string) => Promise<T>;
}

/**
 * Hook for managing loading states with optional progress tracking
 */
export function useLoadingState(): UseLoadingStateReturn {
  const [state, setState] = useState<LoadingState>({
    isLoading: false,
    progress: null,
    message: null,
  });

  const startLoading = useCallback((message?: string) => {
    setState({
      isLoading: true,
      progress: null,
      message: message || null,
    });
  }, []);

  const stopLoading = useCallback(() => {
    setState({
      isLoading: false,
      progress: null,
      message: null,
    });
  }, []);

  const setProgress = useCallback((progress: number, message?: string) => {
    setState((prev) => ({
      ...prev,
      progress,
      message: message !== undefined ? message : prev.message,
    }));
  }, []);

  const withLoading = useCallback(
    async <T>(fn: () => Promise<T>, message?: string): Promise<T> => {
      startLoading(message);
      try {
        const result = await fn();
        return result;
      } finally {
        stopLoading();
      }
    },
    [startLoading, stopLoading]
  );

  return {
    ...state,
    startLoading,
    stopLoading,
    setProgress,
    withLoading,
  };
}
