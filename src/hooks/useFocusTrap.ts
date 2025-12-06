import { useEffect, useRef } from 'react';
import { trapFocus, saveFocus } from '../utils/focusManagement';

/**
 * Hook to trap focus within a container (useful for modals and overlays)
 */
export function useFocusTrap<T extends HTMLElement>(
  active: boolean = true
): React.RefObject<T | null> {
  const containerRef = useRef<T | null>(null);
  const restoreFocusRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    // Save current focus to restore later
    restoreFocusRef.current = saveFocus();

    // Trap focus within container
    const cleanup = trapFocus(containerRef.current);

    return () => {
      cleanup();
      // Restore focus when unmounting
      if (restoreFocusRef.current) {
        restoreFocusRef.current();
        restoreFocusRef.current = null;
      }
    };
  }, [active]);

  return containerRef;
}
