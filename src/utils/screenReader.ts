/**
 * Screen reader utilities for accessibility
 */

/**
 * Announce a message to screen readers
 * Creates a live region that screen readers will announce
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  // Find or create the live region
  let liveRegion = document.getElementById('sr-live-region');

  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = 'sr-live-region';
    liveRegion.setAttribute('role', 'status');
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.style.position = 'absolute';
    liveRegion.style.left = '-10000px';
    liveRegion.style.width = '1px';
    liveRegion.style.height = '1px';
    liveRegion.style.overflow = 'hidden';
    document.body.appendChild(liveRegion);
  }

  // Update the aria-live priority if needed
  if (liveRegion.getAttribute('aria-live') !== priority) {
    liveRegion.setAttribute('aria-live', priority);
  }

  // Clear and set the message
  liveRegion.textContent = '';

  // Use setTimeout to ensure the screen reader picks up the change
  setTimeout(() => {
    if (liveRegion) {
      liveRegion.textContent = message;
    }
  }, 100);
}

/**
 * Create a visually hidden element for screen readers
 */
export function createScreenReaderOnly(text: string): HTMLSpanElement {
  const span = document.createElement('span');
  span.className = 'sr-only';
  span.textContent = text;
  return span;
}

/**
 * Add screen reader only text to an element
 */
export function addScreenReaderText(element: HTMLElement, text: string): void {
  const srText = createScreenReaderOnly(text);
  element.appendChild(srText);
}

/**
 * Generate descriptive alt text for a chart/visualization
 */
export function generateChartAltText(
  chartType: string,
  dataPoints: number,
  summary?: string
): string {
  let altText = `${chartType} chart`;

  if (dataPoints > 0) {
    altText += ` with ${dataPoints} data points`;
  }

  if (summary) {
    altText += `. ${summary}`;
  }

  return altText;
}

/**
 * Format a number for screen readers
 */
export function formatNumberForScreenReader(
  value: number,
  unit?: string,
  precision: number = 2
): string {
  const formatted = value.toFixed(precision);
  return unit ? `${formatted} ${unit}` : formatted;
}

/**
 * Create ARIA label for a data point
 */
export function createDataPointLabel(
  x: number | string,
  y: number,
  xLabel: string = 'x',
  yLabel: string = 'y',
  yUnit?: string
): string {
  const yFormatted = formatNumberForScreenReader(y, yUnit);
  return `${xLabel}: ${x}, ${yLabel}: ${yFormatted}`;
}

/**
 * Announce loading state changes
 */
export function announceLoadingState(isLoading: boolean, itemName: string = 'content'): void {
  if (isLoading) {
    announceToScreenReader(`Loading ${itemName}`, 'polite');
  } else {
    announceToScreenReader(`${itemName} loaded`, 'polite');
  }
}

/**
 * Announce error messages
 */
export function announceError(errorMessage: string): void {
  announceToScreenReader(`Error: ${errorMessage}`, 'assertive');
}

/**
 * Announce success messages
 */
export function announceSuccess(message: string): void {
  announceToScreenReader(message, 'polite');
}

/**
 * Create ARIA description for a complex visualization
 */
export function createVisualizationDescription(
  type: string,
  details: {
    dataPoints?: number;
    range?: { min: number; max: number };
    trend?: 'increasing' | 'decreasing' | 'stable';
    summary?: string;
  }
): string {
  let description = `${type} visualization`;

  if (details.dataPoints) {
    description += ` showing ${details.dataPoints} data points`;
  }

  if (details.range) {
    description += `, ranging from ${details.range.min} to ${details.range.max}`;
  }

  if (details.trend) {
    description += `, with a ${details.trend} trend`;
  }

  if (details.summary) {
    description += `. ${details.summary}`;
  }

  return description;
}
