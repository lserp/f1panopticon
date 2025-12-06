import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAccessibility, useHighContrast, useReducedMotion } from './useAccessibility';

describe('useAccessibility', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    document.documentElement.style.fontSize = '';
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    document.documentElement.style.fontSize = '';
  });

  it('should initialize with default preferences', () => {
    const { result } = renderHook(() => useAccessibility());

    expect(result.current.preferences).toBeDefined();
    expect(typeof result.current.preferences.highContrast).toBe('boolean');
    expect(typeof result.current.preferences.reducedMotion).toBe('boolean');
    expect(typeof result.current.preferences.largeText).toBe('boolean');
    expect(typeof result.current.preferences.keyboardNavigation).toBe('boolean');
  });

  it('should toggle high contrast mode', () => {
    const { result } = renderHook(() => useAccessibility());

    const initialValue = result.current.preferences.highContrast;

    act(() => {
      result.current.toggleHighContrast();
    });

    expect(result.current.preferences.highContrast).toBe(!initialValue);
  });

  it('should toggle reduced motion', () => {
    const { result } = renderHook(() => useAccessibility());

    const initialValue = result.current.preferences.reducedMotion;

    act(() => {
      result.current.toggleReducedMotion();
    });

    expect(result.current.preferences.reducedMotion).toBe(!initialValue);
  });

  it('should toggle large text', () => {
    const { result } = renderHook(() => useAccessibility());

    const initialValue = result.current.preferences.largeText;

    act(() => {
      result.current.toggleLargeText();
    });

    expect(result.current.preferences.largeText).toBe(!initialValue);
  });

  it('should reset preferences', () => {
    const { result } = renderHook(() => useAccessibility());

    act(() => {
      result.current.toggleHighContrast();
      result.current.toggleReducedMotion();
      result.current.toggleLargeText();
    });

    act(() => {
      result.current.resetPreferences();
    });

    expect(result.current.preferences.highContrast).toBe(false);
    expect(result.current.preferences.reducedMotion).toBe(false);
    expect(result.current.preferences.largeText).toBe(false);
    expect(result.current.preferences.keyboardNavigation).toBe(false);
  });

  it('should apply high contrast class to document', () => {
    const { result } = renderHook(() => useAccessibility());

    act(() => {
      result.current.toggleHighContrast();
    });

    if (result.current.preferences.highContrast) {
      expect(document.documentElement.classList.contains('high-contrast')).toBe(true);
    }
  });

  it('should persist preferences to localStorage', () => {
    const { result } = renderHook(() => useAccessibility());

    act(() => {
      result.current.toggleHighContrast();
    });

    const stored = localStorage.getItem('accessibility-preferences');
    expect(stored).toBeTruthy();

    if (stored) {
      const parsed = JSON.parse(stored);
      expect(parsed.highContrast).toBe(result.current.preferences.highContrast);
    }
  });
});

describe('useHighContrast', () => {
  it('should return boolean value', () => {
    const { result } = renderHook(() => useHighContrast());
    expect(typeof result.current).toBe('boolean');
  });
});

describe('useReducedMotion', () => {
  it('should return boolean value', () => {
    const { result } = renderHook(() => useReducedMotion());
    expect(typeof result.current).toBe('boolean');
  });
});
