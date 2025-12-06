/**
 * Focus management utilities for accessibility
 */

/**
 * Trap focus within a container (useful for modals and overlays)
 */
export function trapFocus(container: HTMLElement): () => void {
  const focusableElements = getFocusableElements(container);
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstFocusable) {
        event.preventDefault();
        lastFocusable?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastFocusable) {
        event.preventDefault();
        firstFocusable?.focus();
      }
    }
  };

  container.addEventListener('keydown', handleKeyDown);

  // Focus first element
  firstFocusable?.focus();

  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter((element) => {
    // Check if element is visible
    return (
      element.offsetWidth > 0 &&
      element.offsetHeight > 0 &&
      window.getComputedStyle(element).visibility !== 'hidden'
    );
  });
}

/**
 * Save current focus and return a function to restore it
 */
export function saveFocus(): () => void {
  const activeElement = document.activeElement as HTMLElement;

  return () => {
    if (activeElement && typeof activeElement.focus === 'function') {
      activeElement.focus();
    }
  };
}

/**
 * Focus the first focusable element in a container
 */
export function focusFirstElement(container: HTMLElement): void {
  const focusableElements = getFocusableElements(container);
  focusableElements[0]?.focus();
}

/**
 * Move focus to next/previous focusable element
 */
export function moveFocus(
  direction: 'next' | 'previous',
  container: HTMLElement = document.body
): void {
  const focusableElements = getFocusableElements(container);
  const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);

  if (currentIndex === -1) {
    focusableElements[0]?.focus();
    return;
  }

  let nextIndex: number;
  if (direction === 'next') {
    nextIndex = (currentIndex + 1) % focusableElements.length;
  } else {
    nextIndex = (currentIndex - 1 + focusableElements.length) % focusableElements.length;
  }

  focusableElements[nextIndex]?.focus();
}

/**
 * Check if an element is focusable
 */
export function isFocusable(element: HTMLElement): boolean {
  const focusableElements = getFocusableElements(element.parentElement || document.body);
  return focusableElements.includes(element);
}

/**
 * Check if element has focus trap capability
 */
export function canTrapFocus(element: HTMLElement | null): boolean {
  if (!element) return false;
  const focusableElements = getFocusableElements(element);
  return focusableElements.length > 0;
}
