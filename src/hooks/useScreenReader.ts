import { useEffect, useCallback } from 'react';
import {
  announceToScreenReader,
  announceLoadingState,
  announceError,
  announceSuccess,
} from '../utils/screenReader';

/**
 * Hook for making screen reader announcements
 */
export function useScreenReader() {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    announceToScreenReader(message, priority);
  }, []);

  const announceLoading = useCallback((isLoading: boolean, itemName?: string) => {
    announceLoadingState(isLoading, itemName);
  }, []);

  const announceErrorMessage = useCallback((errorMessage: string) => {
    announceError(errorMessage);
  }, []);

  const announceSuccessMessage = useCallback((message: string) => {
    announceSuccess(message);
  }, []);

  return {
    announce,
    announceLoading,
    announceError: announceErrorMessage,
    announceSuccess: announceSuccessMessage,
  };
}

/**
 * Hook to announce when a value changes
 */
export function useAnnounceChange<T>(
  value: T,
  formatter: (value: T) => string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  useEffect(() => {
    const message = formatter(value);
    if (message) {
      announceToScreenReader(message, priority);
    }
  }, [value, formatter, priority]);
}

/**
 * Hook to announce loading states
 */
export function useAnnounceLoading(isLoading: boolean, itemName: string = 'content'): void {
  useEffect(() => {
    announceLoadingState(isLoading, itemName);
  }, [isLoading, itemName]);
}
