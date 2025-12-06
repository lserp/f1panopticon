/**
 * React hooks for responsive design
 * Handles window resize events and provides responsive utilities
 */

import { useState, useEffect, useMemo } from 'react';
import {
  getCurrentBreakpoint,
  getBreakpointConfig,
  isBreakpoint,
  debounce,
  type Breakpoint,
  type BreakpointConfig,
} from '../utils/responsive';

export interface WindowSize {
  width: number;
  height: number;
}

/**
 * Hook to track window size with debounced updates
 * Requirements: Add window resize handling
 */
export function useWindowSize(debounceMs: number = 150): WindowSize {
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = debounce(() => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }, debounceMs);

    window.addEventListener('resize', handleResize);

    // Call handler right away so state gets updated with initial window size
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, [debounceMs]);

  return windowSize;
}

/**
 * Hook to get current breakpoint
 * Requirements: Support screen sizes from 768px to 3840px
 */
export function useBreakpoint(): Breakpoint {
  const { width } = useWindowSize();
  return useMemo(() => getCurrentBreakpoint(width), [width]);
}

/**
 * Hook to get breakpoint configuration
 */
export function useBreakpointConfig(): BreakpointConfig {
  const breakpoint = useBreakpoint();
  return useMemo(() => getBreakpointConfig(breakpoint), [breakpoint]);
}

/**
 * Hook to check if current viewport matches a specific breakpoint
 */
export function useIsBreakpoint(targetBreakpoint: Breakpoint): boolean {
  const { width } = useWindowSize();
  return useMemo(() => isBreakpoint(width, targetBreakpoint), [width, targetBreakpoint]);
}

/**
 * Hook to check if viewport is mobile/tablet size
 */
export function useIsMobile(): boolean {
  return useIsBreakpoint('tablet');
}

/**
 * Hook to check if viewport is desktop or larger
 */
export function useIsDesktop(): boolean {
  const breakpoint = useBreakpoint();
  return breakpoint !== 'tablet';
}

/**
 * Hook to get responsive value based on breakpoint
 * Usage: const fontSize = useResponsiveValue({ tablet: 14, desktop: 16, '4k': 24 })
 */
export function useResponsiveValue<T>(values: Partial<Record<Breakpoint, T>>): T | undefined {
  const breakpoint = useBreakpoint();

  return useMemo(() => {
    // Try to get exact breakpoint value
    if (values[breakpoint] !== undefined) {
      return values[breakpoint];
    }

    // Fallback to closest smaller breakpoint
    const breakpointOrder: Breakpoint[] = ['tablet', 'desktop', 'desktop-lg', 'desktop-xl', '4k'];
    const currentIndex = breakpointOrder.indexOf(breakpoint);

    for (let i = currentIndex - 1; i >= 0; i--) {
      const fallbackBreakpoint = breakpointOrder[i];
      if (values[fallbackBreakpoint] !== undefined) {
        return values[fallbackBreakpoint];
      }
    }

    return undefined;
  }, [breakpoint, values]);
}

/**
 * Hook to detect orientation changes
 */
export function useOrientation(): 'portrait' | 'landscape' {
  const { width, height } = useWindowSize();
  return width > height ? 'landscape' : 'portrait';
}

/**
 * Hook to get viewport aspect ratio
 */
export function useAspectRatio(): number {
  const { width, height } = useWindowSize();
  return width / height;
}

/**
 * Hook to check if viewport is high resolution (>= 1920px width)
 */
export function useIsHighResolution(): boolean {
  const { width } = useWindowSize();
  return width >= 1920;
}

/**
 * Hook to check if viewport is 4K or higher
 */
export function useIs4K(): boolean {
  const { width } = useWindowSize();
  return width >= 3840;
}
