/**
 * Responsive Design Utilities
 * Supports screen sizes from 768px to 3840px (tablet to 4K)
 * Optimized for desktop resolutions (1920x1080 to 4K)
 */

export type Breakpoint = 'tablet' | 'desktop' | 'desktop-lg' | 'desktop-xl' | '4k';

export interface BreakpointConfig {
  name: Breakpoint;
  minWidth: number;
  maxWidth?: number;
  cols: number;
  rowHeight: number;
  margin: [number, number];
  containerPadding: [number, number];
}

/**
 * Breakpoint definitions optimized for F1 Analysis Platform
 * Requirements: Support 768px to 3840px, optimize for 1920x1080 to 4K
 */
export const BREAKPOINTS: Record<Breakpoint, BreakpointConfig> = {
  tablet: {
    name: 'tablet',
    minWidth: 768,
    maxWidth: 1279,
    cols: 6,
    rowHeight: 120,
    margin: [8, 8],
    containerPadding: [8, 8],
  },
  desktop: {
    name: 'desktop',
    minWidth: 1280,
    maxWidth: 1919,
    cols: 12,
    rowHeight: 150,
    margin: [12, 12],
    containerPadding: [16, 16],
  },
  'desktop-lg': {
    name: 'desktop-lg',
    minWidth: 1920,
    maxWidth: 2559,
    cols: 12,
    rowHeight: 180,
    margin: [16, 16],
    containerPadding: [20, 20],
  },
  'desktop-xl': {
    name: 'desktop-xl',
    minWidth: 2560,
    maxWidth: 3839,
    cols: 16,
    rowHeight: 200,
    margin: [20, 20],
    containerPadding: [24, 24],
  },
  '4k': {
    name: '4k',
    minWidth: 3840,
    cols: 20,
    rowHeight: 220,
    margin: [24, 24],
    containerPadding: [32, 32],
  },
};

/**
 * Get current breakpoint based on window width
 */
export function getCurrentBreakpoint(width: number): Breakpoint {
  if (width >= BREAKPOINTS['4k'].minWidth) return '4k';
  if (width >= BREAKPOINTS['desktop-xl'].minWidth) return 'desktop-xl';
  if (width >= BREAKPOINTS['desktop-lg'].minWidth) return 'desktop-lg';
  if (width >= BREAKPOINTS.desktop.minWidth) return 'desktop';
  return 'tablet';
}

/**
 * Get breakpoint configuration
 */
export function getBreakpointConfig(breakpoint: Breakpoint): BreakpointConfig {
  return BREAKPOINTS[breakpoint];
}

/**
 * Check if current width matches a specific breakpoint
 */
export function isBreakpoint(width: number, breakpoint: Breakpoint): boolean {
  const config = BREAKPOINTS[breakpoint];
  if (config.maxWidth) {
    return width >= config.minWidth && width <= config.maxWidth;
  }
  return width >= config.minWidth;
}

/**
 * Get responsive grid layout breakpoints for react-grid-layout
 */
export function getGridBreakpoints(): Record<string, number> {
  return {
    '4k': BREAKPOINTS['4k'].minWidth,
    'desktop-xl': BREAKPOINTS['desktop-xl'].minWidth,
    'desktop-lg': BREAKPOINTS['desktop-lg'].minWidth,
    desktop: BREAKPOINTS.desktop.minWidth,
    tablet: BREAKPOINTS.tablet.minWidth,
  };
}

/**
 * Get responsive grid columns for react-grid-layout
 */
export function getGridCols(): Record<string, number> {
  return {
    '4k': BREAKPOINTS['4k'].cols,
    'desktop-xl': BREAKPOINTS['desktop-xl'].cols,
    'desktop-lg': BREAKPOINTS['desktop-lg'].cols,
    desktop: BREAKPOINTS.desktop.cols,
    tablet: BREAKPOINTS.tablet.cols,
  };
}

/**
 * Calculate optimal font size based on viewport
 */
export function getResponsiveFontSize(baseSize: number, breakpoint: Breakpoint): number {
  const scaleFactor: Record<Breakpoint, number> = {
    tablet: 0.875, // 87.5% of base
    desktop: 1.0, // 100% of base
    'desktop-lg': 1.125, // 112.5% of base
    'desktop-xl': 1.25, // 125% of base
    '4k': 1.5, // 150% of base
  };

  return baseSize * scaleFactor[breakpoint];
}

/**
 * Calculate optimal spacing based on viewport
 */
export function getResponsiveSpacing(baseSpacing: number, breakpoint: Breakpoint): number {
  const scaleFactor: Record<Breakpoint, number> = {
    tablet: 0.75,
    desktop: 1.0,
    'desktop-lg': 1.25,
    'desktop-xl': 1.5,
    '4k': 2.0,
  };

  return baseSpacing * scaleFactor[breakpoint];
}

/**
 * Debounce function for resize handlers
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for resize handlers
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
