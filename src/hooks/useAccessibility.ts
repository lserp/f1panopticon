import { useState, useEffect, useCallback } from 'react';

export interface AccessibilityPreferences {
  highContrast: boolean;
  reducedMotion: boolean;
  largeText: boolean;
  keyboardNavigation: boolean;
}

const STORAGE_KEY = 'accessibility-preferences';

/**
 * Hook for managing accessibility preferences
 */
export function useAccessibility() {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(() => {
    // Load from localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // Fall through to defaults
      }
    }

    // Detect system preferences
    return {
      highContrast: window.matchMedia('(prefers-contrast: high)').matches,
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      largeText: false,
      keyboardNavigation: false,
    };
  });

  // Save to localStorage when preferences change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  // Apply high contrast mode
  useEffect(() => {
    if (preferences.highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [preferences.highContrast]);

  // Apply large text mode
  useEffect(() => {
    if (preferences.largeText) {
      document.documentElement.style.fontSize = '120%';
    } else {
      document.documentElement.style.fontSize = '';
    }
  }, [preferences.largeText]);

  // Apply keyboard navigation mode
  useEffect(() => {
    if (preferences.keyboardNavigation) {
      document.documentElement.classList.add('keyboard-navigation');
    } else {
      document.documentElement.classList.remove('keyboard-navigation');
    }
  }, [preferences.keyboardNavigation]);

  // Detect keyboard usage
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setPreferences((prev) => ({ ...prev, keyboardNavigation: true }));
      }
    };

    const handleMouseDown = () => {
      setPreferences((prev) => ({ ...prev, keyboardNavigation: false }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  // Listen for system preference changes
  useEffect(() => {
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleContrastChange = (e: MediaQueryListEvent) => {
      setPreferences((prev) => ({ ...prev, highContrast: e.matches }));
    };

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setPreferences((prev) => ({ ...prev, reducedMotion: e.matches }));
    };

    contrastQuery.addEventListener('change', handleContrastChange);
    motionQuery.addEventListener('change', handleMotionChange);

    return () => {
      contrastQuery.removeEventListener('change', handleContrastChange);
      motionQuery.removeEventListener('change', handleMotionChange);
    };
  }, []);

  const toggleHighContrast = useCallback(() => {
    setPreferences((prev) => ({ ...prev, highContrast: !prev.highContrast }));
  }, []);

  const toggleReducedMotion = useCallback(() => {
    setPreferences((prev) => ({ ...prev, reducedMotion: !prev.reducedMotion }));
  }, []);

  const toggleLargeText = useCallback(() => {
    setPreferences((prev) => ({ ...prev, largeText: !prev.largeText }));
  }, []);

  const resetPreferences = useCallback(() => {
    setPreferences({
      highContrast: false,
      reducedMotion: false,
      largeText: false,
      keyboardNavigation: false,
    });
  }, []);

  return {
    preferences,
    toggleHighContrast,
    toggleReducedMotion,
    toggleLargeText,
    resetPreferences,
  };
}

/**
 * Hook to check if high contrast mode is enabled
 */
export function useHighContrast(): boolean {
  const [highContrast, setHighContrast] = useState(() => {
    return (
      document.documentElement.classList.contains('high-contrast') ||
      window.matchMedia('(prefers-contrast: high)').matches
    );
  });

  useEffect(() => {
    const query = window.matchMedia('(prefers-contrast: high)');
    const handleChange = (e: MediaQueryListEvent) => {
      setHighContrast(e.matches);
    };

    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, []);

  return highContrast;
}

/**
 * Hook to check if reduced motion is preferred
 */
export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(() => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, []);

  return reducedMotion;
}
