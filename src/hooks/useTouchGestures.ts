/**
 * React hooks for touch gesture handling
 * Requirements: Touch-friendly interactions, chart manipulation for touch, touch gestures
 */

import { useEffect, useRef, useCallback } from 'react';
import {
  TouchGestureHandler,
  type SwipeGesture,
  type PinchGesture,
  type TapGesture,
} from '../utils/touchGestures';

export interface TouchGestureHandlers {
  onSwipe?: (gesture: SwipeGesture) => void;
  onPinch?: (gesture: PinchGesture) => void;
  onTap?: (gesture: TapGesture) => void;
  onDoubleTap?: (gesture: TapGesture) => void;
}

/**
 * Hook to handle touch gestures on an element
 */
export function useTouchGestures<T extends HTMLElement>(
  handlers: TouchGestureHandlers
): React.RefObject<T | null> {
  const elementRef = useRef<T | null>(null);
  const gestureHandlerRef = useRef<TouchGestureHandler | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Create gesture handler
    const gestureHandler = new TouchGestureHandler(element);
    gestureHandlerRef.current = gestureHandler;

    // Set up handlers
    if (handlers.onSwipe) {
      gestureHandler.setSwipeHandler(handlers.onSwipe);
    }
    if (handlers.onPinch) {
      gestureHandler.setPinchHandler(handlers.onPinch);
    }
    if (handlers.onTap) {
      gestureHandler.setTapHandler(handlers.onTap);
    }
    if (handlers.onDoubleTap) {
      gestureHandler.setDoubleTapHandler(handlers.onDoubleTap);
    }

    // Cleanup
    return () => {
      gestureHandler.destroy();
      gestureHandlerRef.current = null;
    };
  }, [handlers.onSwipe, handlers.onPinch, handlers.onTap, handlers.onDoubleTap]);

  return elementRef;
}

/**
 * Hook for swipe gestures only
 */
export function useSwipe<T extends HTMLElement>(
  onSwipe: (gesture: SwipeGesture) => void
): React.RefObject<T | null> {
  return useTouchGestures<T>({ onSwipe });
}

/**
 * Hook for pinch zoom gestures
 */
export function usePinchZoom<T extends HTMLElement>(
  onPinch: (gesture: PinchGesture) => void
): React.RefObject<T | null> {
  return useTouchGestures<T>({ onPinch });
}

/**
 * Hook for tap gestures
 */
export function useTap<T extends HTMLElement>(
  onTap: (gesture: TapGesture) => void,
  onDoubleTap?: (gesture: TapGesture) => void
): React.RefObject<T | null> {
  return useTouchGestures<T>({ onTap, onDoubleTap });
}

/**
 * Hook to detect if device supports touch
 */
export function useIsTouchDevice(): boolean {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore - msMaxTouchPoints is IE specific
    navigator.msMaxTouchPoints > 0
  );
}

/**
 * Hook to make buttons and interactive elements touch-friendly
 */
export function useTouchFriendly<T extends HTMLElement>(
  minSize: number = 44
): React.RefObject<T | null> {
  const elementRef = useRef<T | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const currentWidth = element.offsetWidth;
    const currentHeight = element.offsetHeight;

    if (currentWidth < minSize || currentHeight < minSize) {
      element.style.minWidth = `${minSize}px`;
      element.style.minHeight = `${minSize}px`;
      element.style.display = 'inline-flex';
      element.style.alignItems = 'center';
      element.style.justifyContent = 'center';
    }
  }, [minSize]);

  return elementRef;
}

/**
 * Hook for chart manipulation with touch
 * Combines pinch zoom and swipe for chart navigation
 */
export function useChartTouch<T extends HTMLElement>(options: {
  onZoom?: (scale: number, center: { x: number; y: number }) => void;
  onPan?: (direction: 'left' | 'right' | 'up' | 'down', distance: number) => void;
  onReset?: () => void;
}): React.RefObject<T | null> {
  const handlePinch = useCallback(
    (gesture: PinchGesture) => {
      if (options.onZoom) {
        options.onZoom(gesture.scale, gesture.center);
      }
    },
    [options]
  );

  const handleSwipe = useCallback(
    (gesture: SwipeGesture) => {
      if (options.onPan) {
        options.onPan(gesture.direction, gesture.distance);
      }
    },
    [options]
  );

  const handleDoubleTap = useCallback(() => {
    if (options.onReset) {
      options.onReset();
    }
  }, [options]);

  return useTouchGestures<T>({
    onPinch: handlePinch,
    onSwipe: handleSwipe,
    onDoubleTap: handleDoubleTap,
  });
}
