import React from 'react';
import { useAccessibility } from '../hooks/useAccessibility';
import './AccessibilitySettings.css';

export interface AccessibilitySettingsProps {
  className?: string;
}

export const AccessibilitySettings: React.FC<AccessibilitySettingsProps> = ({ className = '' }) => {
  const {
    preferences,
    toggleHighContrast,
    toggleReducedMotion,
    toggleLargeText,
    resetPreferences,
  } = useAccessibility();

  return (
    <div className={`accessibility-settings ${className}`}>
      <h2>Accessibility Settings</h2>
      <p className="accessibility-settings__description">
        Customize the interface to meet your accessibility needs
      </p>

      <div className="accessibility-settings__options">
        <div className="accessibility-setting">
          <label htmlFor="high-contrast-toggle" className="accessibility-setting__label">
            <span className="accessibility-setting__title">High Contrast Mode</span>
            <span className="accessibility-setting__description">
              Increases contrast between text and background for better visibility
            </span>
          </label>
          <button
            id="high-contrast-toggle"
            className={`accessibility-toggle ${preferences.highContrast ? 'active' : ''}`}
            onClick={toggleHighContrast}
            role="switch"
            aria-checked={preferences.highContrast}
            aria-label="Toggle high contrast mode"
          >
            <span className="accessibility-toggle__slider"></span>
          </button>
        </div>

        <div className="accessibility-setting">
          <label htmlFor="reduced-motion-toggle" className="accessibility-setting__label">
            <span className="accessibility-setting__title">Reduce Motion</span>
            <span className="accessibility-setting__description">
              Minimizes animations and transitions for users sensitive to motion
            </span>
          </label>
          <button
            id="reduced-motion-toggle"
            className={`accessibility-toggle ${preferences.reducedMotion ? 'active' : ''}`}
            onClick={toggleReducedMotion}
            role="switch"
            aria-checked={preferences.reducedMotion}
            aria-label="Toggle reduced motion"
          >
            <span className="accessibility-toggle__slider"></span>
          </button>
        </div>

        <div className="accessibility-setting">
          <label htmlFor="large-text-toggle" className="accessibility-setting__label">
            <span className="accessibility-setting__title">Large Text</span>
            <span className="accessibility-setting__description">
              Increases the base font size for easier reading
            </span>
          </label>
          <button
            id="large-text-toggle"
            className={`accessibility-toggle ${preferences.largeText ? 'active' : ''}`}
            onClick={toggleLargeText}
            role="switch"
            aria-checked={preferences.largeText}
            aria-label="Toggle large text"
          >
            <span className="accessibility-toggle__slider"></span>
          </button>
        </div>

        <div className="accessibility-setting">
          <div className="accessibility-setting__label">
            <span className="accessibility-setting__title">Keyboard Navigation</span>
            <span className="accessibility-setting__description">
              Enhanced focus indicators when navigating with keyboard (auto-detected)
            </span>
          </div>
          <span
            className={`accessibility-status ${preferences.keyboardNavigation ? 'active' : ''}`}
            aria-label={`Keyboard navigation is ${preferences.keyboardNavigation ? 'active' : 'inactive'}`}
          >
            {preferences.keyboardNavigation ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      <div className="accessibility-settings__actions">
        <button
          className="accessibility-settings__reset"
          onClick={resetPreferences}
          aria-label="Reset all accessibility settings to defaults"
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  );
};
