// Filter utilities
export {
  filterSessions,
  filterLapData,
  filterLapSummaries,
  validateSessionFilter,
  validatePerformanceFilter,
  FilterValidationError,
} from './filters';

export type { SessionFilterCriteria, PerformanceFilterCriteria } from './filters';

// Track mapping utilities
export {
  distanceToPosition,
  positionToDistance,
  interpolatePosition,
  distanceToPositionInterpolated,
  validateRoundTrip,
} from './trackMapping';

export type { TrackPosition } from './trackMapping';

// Tooltip utilities
export { findCornerAtDistance, formatTooltip, TooltipSynchronizer } from './tooltipHelpers';

// Performance gap utilities
export { calculatePerformanceGaps, findGapAtDistance, getGapsForLap } from './performanceGap';

export type { PerformanceGap } from './performanceGap';

// Feature tier utilities
export {
  FEATURES,
  FeatureGate as FeatureGateUtil,
  createFeatureGate,
  checkFeatureAccess,
} from './featureTier';

export type { FeatureTier, Feature } from './featureTier';

// Responsive design utilities
export {
  BREAKPOINTS,
  getCurrentBreakpoint,
  getBreakpointConfig,
  isBreakpoint,
  getGridBreakpoints,
  getGridCols,
  getResponsiveFontSize,
  getResponsiveSpacing,
  debounce,
  throttle,
} from './responsive';

export type { Breakpoint, BreakpointConfig } from './responsive';

// Touch gesture utilities
export {
  getTouchDistance,
  getTouchCenter,
  detectSwipe,
  detectPinch,
  isTap,
  TouchGestureHandler,
  makeTouchFriendly,
  preventDefaultTouch,
} from './touchGestures';

export type { TouchPoint, SwipeGesture, PinchGesture, TapGesture } from './touchGestures';

// Adaptive performance utilities
export {
  getNetworkInformation,
  detectNetworkSpeed,
  isDataSaverEnabled,
  determinePerformanceLevel,
  getPerformanceConfig,
  decimateTelemetryData,
  ProgressiveLoader,
  NetworkMonitor,
  estimateBandwidth,
  hasLimitedMemory,
  getOptimalChunkSize,
} from './adaptivePerformance';

export type {
  NetworkSpeed,
  PerformanceLevel,
  NetworkInformation,
  PerformanceConfig,
} from './adaptivePerformance';

// Error handling utilities
export {
  getUserFriendlyErrorMessage,
  createAppError,
  isAppError,
  logError,
  retryWithBackoff,
} from './errorHandler';

export type { ErrorMessage } from './errorHandler';

// Focus management utilities
export {
  trapFocus,
  getFocusableElements,
  saveFocus,
  focusFirstElement,
  moveFocus,
  isFocusable,
  canTrapFocus,
} from './focusManagement';

// Screen reader utilities
export {
  announceToScreenReader,
  createScreenReaderOnly,
  addScreenReaderText,
  generateChartAltText,
  formatNumberForScreenReader,
  createDataPointLabel,
  announceLoadingState,
  announceError,
  announceSuccess,
  createVisualizationDescription,
} from './screenReader';
