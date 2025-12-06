import { useState, useCallback } from 'react';
import type { ToastType, ToastProps } from '../components/Toast';

export interface ToastOptions {
  type?: ToastType;
  title?: string;
  duration?: number;
}

export interface UseToastReturn {
  toasts: Omit<ToastProps, 'onClose'>[];
  showToast: (message: string, options?: ToastOptions) => string;
  showSuccess: (message: string, title?: string) => string;
  showError: (message: string, title?: string) => string;
  showWarning: (message: string, title?: string) => string;
  showInfo: (message: string, title?: string) => string;
  dismissToast: (id: string) => void;
  clearAllToasts: () => void;
}

let toastIdCounter = 0;

/**
 * Hook for managing toast notifications
 */
export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<Omit<ToastProps, 'onClose'>[]>([]);

  const showToast = useCallback((message: string, options: ToastOptions = {}): string => {
    const id = `toast-${++toastIdCounter}`;
    const newToast: Omit<ToastProps, 'onClose'> = {
      id,
      type: options.type || 'info',
      title: options.title,
      message,
      duration: options.duration !== undefined ? options.duration : 5000,
    };

    setToasts((prev) => [...prev, newToast]);
    return id;
  }, []);

  const showSuccess = useCallback(
    (message: string, title?: string): string => {
      return showToast(message, { type: 'success', title });
    },
    [showToast]
  );

  const showError = useCallback(
    (message: string, title?: string): string => {
      return showToast(message, { type: 'error', title });
    },
    [showToast]
  );

  const showWarning = useCallback(
    (message: string, title?: string): string => {
      return showToast(message, { type: 'warning', title });
    },
    [showToast]
  );

  const showInfo = useCallback(
    (message: string, title?: string): string => {
      return showToast(message, { type: 'info', title });
    },
    [showToast]
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    dismissToast,
    clearAllToasts,
  };
}
