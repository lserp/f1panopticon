import React from 'react';
import { useKeyboardNavigation } from '../contexts/KeyboardNavigationContext';
import { formatShortcut } from '../hooks/useKeyboardShortcuts';
import { useFocusTrap } from '../hooks/useFocusTrap';
import './KeyboardShortcutsHelp.css';

export interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({
  isOpen,
  onClose,
}) => {
  const { shortcuts } = useKeyboardNavigation();
  const modalRef = useFocusTrap<HTMLDivElement>(isOpen);

  if (!isOpen) return null;

  return (
    <div className="keyboard-shortcuts-overlay" onClick={onClose}>
      <div
        ref={modalRef}
        className="keyboard-shortcuts-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
      >
        <div className="keyboard-shortcuts-header">
          <h2 id="shortcuts-title">Keyboard Shortcuts</h2>
          <button
            className="keyboard-shortcuts-close"
            onClick={onClose}
            aria-label="Close keyboard shortcuts help"
          >
            ✕
          </button>
        </div>
        <div className="keyboard-shortcuts-content">
          {shortcuts.length === 0 ? (
            <p>No keyboard shortcuts available</p>
          ) : (
            <table className="keyboard-shortcuts-table">
              <thead>
                <tr>
                  <th>Shortcut</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {shortcuts.map((shortcut, index) => (
                  <tr key={index}>
                    <td>
                      <kbd className="keyboard-shortcut-key">{formatShortcut(shortcut)}</kbd>
                    </td>
                    <td>{shortcut.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
