import React, { createContext, useContext, useState, useCallback } from 'react';
import { useKeyboardShortcuts, type KeyboardShortcut } from '../hooks/useKeyboardShortcuts';

interface KeyboardNavigationContextValue {
  shortcuts: KeyboardShortcut[];
  registerShortcut: (shortcut: KeyboardShortcut) => void;
  unregisterShortcut: (key: string) => void;
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

const KeyboardNavigationContext = createContext<KeyboardNavigationContextValue | null>(null);

export interface KeyboardNavigationProviderProps {
  children: React.ReactNode;
  defaultShortcuts?: KeyboardShortcut[];
}

export const KeyboardNavigationProvider: React.FC<KeyboardNavigationProviderProps> = ({
  children,
  defaultShortcuts = [],
}) => {
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>(defaultShortcuts);
  const [enabled, setEnabled] = useState(true);

  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    setShortcuts((prev) => {
      // Remove existing shortcut with same key combination
      const filtered = prev.filter(
        (s) =>
          !(
            s.key === shortcut.key &&
            s.ctrl === shortcut.ctrl &&
            s.shift === shortcut.shift &&
            s.alt === shortcut.alt &&
            s.meta === shortcut.meta
          )
      );
      return [...filtered, shortcut];
    });
  }, []);

  const unregisterShortcut = useCallback((key: string) => {
    setShortcuts((prev) => prev.filter((s) => s.key !== key));
  }, []);

  useKeyboardShortcuts({ shortcuts, enabled });

  const value: KeyboardNavigationContextValue = {
    shortcuts,
    registerShortcut,
    unregisterShortcut,
    enabled,
    setEnabled,
  };

  return (
    <KeyboardNavigationContext.Provider value={value}>
      {children}
    </KeyboardNavigationContext.Provider>
  );
};

export function useKeyboardNavigation(): KeyboardNavigationContextValue {
  const context = useContext(KeyboardNavigationContext);
  if (!context) {
    throw new Error('useKeyboardNavigation must be used within KeyboardNavigationProvider');
  }
  return context;
}
