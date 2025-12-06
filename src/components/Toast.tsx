import React, { useEffect } from 'react';
import './Toast.css';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose,
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
    }
  };

  const ariaLive = type === 'error' ? 'assertive' : 'polite';
  const roleType = type === 'error' ? 'alert' : 'status';

  return (
    <div className={`toast toast--${type}`} role={roleType} aria-live={ariaLive} aria-atomic="true">
      <div className="toast__icon" aria-hidden="true">
        {getIcon()}
      </div>
      <div className="toast__content">
        {title && <h4 className="toast__title">{title}</h4>}
        <p className="toast__message">{message}</p>
      </div>
      <button
        className="toast__close"
        onClick={() => onClose(id)}
        aria-label={`Close ${type} notification: ${title || message}`}
      >
        ✕
      </button>
    </div>
  );
};
