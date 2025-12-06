import React, { useState, useCallback } from 'react';
import { useAppStore } from '../store';
import type { ApiCredentials } from '../store/types';
import './ApiCredentialManager.css';

export interface ApiCredentialManagerProps {
  onClose?: () => void;
}

export const ApiCredentialManager: React.FC<ApiCredentialManagerProps> = ({ onClose }) => {
  const apiCredentials = useAppStore((state) => state.apiCredentials);
  const setApiCredentials = useAppStore((state) => state.setApiCredentials);

  const [fastf1ApiKey, setFastf1ApiKey] = useState(apiCredentials.fastf1ApiKey || '');
  const [openf1ApiKey, setOpenf1ApiKey] = useState(apiCredentials.openf1ApiKey || '');
  const [showFastf1Key, setShowFastf1Key] = useState(false);
  const [showOpenf1Key, setShowOpenf1Key] = useState(false);
  const [validationStatus, setValidationStatus] = useState<{
    fastf1: 'idle' | 'validating' | 'valid' | 'invalid';
    openf1: 'idle' | 'validating' | 'valid' | 'invalid';
  }>({
    fastf1: 'idle',
    openf1: 'idle',
  });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Validate FastF1 API key
  const validateFastf1Key = useCallback(async (key: string): Promise<boolean> => {
    if (!key || key.trim().length === 0) {
      return false;
    }

    setValidationStatus((prev) => ({ ...prev, fastf1: 'validating' }));

    try {
      // Simulate API validation - in real implementation, this would call the API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Basic validation: check if key has valid format (alphanumeric, min 20 chars)
      const isValid = /^[a-zA-Z0-9]{20,}$/.test(key);

      setValidationStatus((prev) => ({ ...prev, fastf1: isValid ? 'valid' : 'invalid' }));
      return isValid;
    } catch {
      setValidationStatus((prev) => ({ ...prev, fastf1: 'invalid' }));
      return false;
    }
  }, []);

  // Validate OpenF1 API key
  const validateOpenf1Key = useCallback(async (key: string): Promise<boolean> => {
    if (!key || key.trim().length === 0) {
      return false;
    }

    setValidationStatus((prev) => ({ ...prev, openf1: 'validating' }));

    try {
      // Simulate API validation - in real implementation, this would call the API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Basic validation: check if key has valid format (alphanumeric, min 20 chars)
      const isValid = /^[a-zA-Z0-9]{20,}$/.test(key);

      setValidationStatus((prev) => ({ ...prev, openf1: isValid ? 'valid' : 'invalid' }));
      return isValid;
    } catch {
      setValidationStatus((prev) => ({ ...prev, openf1: 'invalid' }));
      return false;
    }
  }, []);

  // Handle save credentials
  const handleSave = useCallback(async () => {
    setSaveStatus('saving');

    try {
      // Validate keys if provided
      let fastf1Valid = true;
      let openf1Valid = true;

      if (fastf1ApiKey.trim()) {
        fastf1Valid = await validateFastf1Key(fastf1ApiKey);
      }

      if (openf1ApiKey.trim()) {
        openf1Valid = await validateOpenf1Key(openf1ApiKey);
      }

      if (!fastf1Valid || !openf1Valid) {
        setSaveStatus('error');
        return;
      }

      // Determine if premium tier is enabled
      const premiumTier = !!(fastf1ApiKey.trim() || openf1ApiKey.trim());

      // Save credentials to store (which persists to localStorage)
      const newCredentials: ApiCredentials = {
        fastf1ApiKey: fastf1ApiKey.trim() || undefined,
        openf1ApiKey: openf1ApiKey.trim() || undefined,
        premiumTier,
      };

      setApiCredentials(newCredentials);
      setSaveStatus('saved');

      // Reset save status after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to save credentials:', error);
      }
      setSaveStatus('error');
    }
  }, [fastf1ApiKey, openf1ApiKey, validateFastf1Key, validateOpenf1Key, setApiCredentials]);

  // Handle clear credentials
  const handleClear = useCallback(() => {
    setFastf1ApiKey('');
    setOpenf1ApiKey('');
    setValidationStatus({ fastf1: 'idle', openf1: 'idle' });
    setApiCredentials({ premiumTier: false });
    setSaveStatus('idle');
  }, [setApiCredentials]);

  return (
    <div className="api-credential-manager">
      <div className="credential-header">
        <h2>API Credentials</h2>
        {onClose && (
          <button className="close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        )}
      </div>

      <div className="credential-content">
        <p className="credential-description">
          Configure your API credentials to unlock premium features including higher frequency data
          updates, additional telemetry channels, and more concurrent dashboard channels.
        </p>

        {/* FastF1 API Key */}
        <div className="credential-field">
          <label htmlFor="fastf1-key">
            FastF1 API Key
            <span className="optional-label">(Optional)</span>
          </label>
          <div className="input-group">
            <input
              id="fastf1-key"
              type={showFastf1Key ? 'text' : 'password'}
              value={fastf1ApiKey}
              onChange={(e) => {
                setFastf1ApiKey(e.target.value);
                setValidationStatus((prev) => ({ ...prev, fastf1: 'idle' }));
              }}
              placeholder="Enter your FastF1 API key"
              className={`credential-input ${
                validationStatus.fastf1 === 'valid'
                  ? 'valid'
                  : validationStatus.fastf1 === 'invalid'
                    ? 'invalid'
                    : ''
              }`}
            />
            <button
              className="toggle-visibility-btn"
              onClick={() => setShowFastf1Key(!showFastf1Key)}
              aria-label={showFastf1Key ? 'Hide key' : 'Show key'}
            >
              {showFastf1Key ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          {validationStatus.fastf1 === 'validating' && (
            <span className="validation-message validating">Validating...</span>
          )}
          {validationStatus.fastf1 === 'valid' && (
            <span className="validation-message valid">✓ Valid API key</span>
          )}
          {validationStatus.fastf1 === 'invalid' && (
            <span className="validation-message invalid">✗ Invalid API key format</span>
          )}
        </div>

        {/* OpenF1 API Key */}
        <div className="credential-field">
          <label htmlFor="openf1-key">
            OpenF1 API Key
            <span className="optional-label">(Optional)</span>
          </label>
          <div className="input-group">
            <input
              id="openf1-key"
              type={showOpenf1Key ? 'text' : 'password'}
              value={openf1ApiKey}
              onChange={(e) => {
                setOpenf1ApiKey(e.target.value);
                setValidationStatus((prev) => ({ ...prev, openf1: 'idle' }));
              }}
              placeholder="Enter your OpenF1 API key"
              className={`credential-input ${
                validationStatus.openf1 === 'valid'
                  ? 'valid'
                  : validationStatus.openf1 === 'invalid'
                    ? 'invalid'
                    : ''
              }`}
            />
            <button
              className="toggle-visibility-btn"
              onClick={() => setShowOpenf1Key(!showOpenf1Key)}
              aria-label={showOpenf1Key ? 'Hide key' : 'Show key'}
            >
              {showOpenf1Key ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          {validationStatus.openf1 === 'validating' && (
            <span className="validation-message validating">Validating...</span>
          )}
          {validationStatus.openf1 === 'valid' && (
            <span className="validation-message valid">✓ Valid API key</span>
          )}
          {validationStatus.openf1 === 'invalid' && (
            <span className="validation-message invalid">✗ Invalid API key format</span>
          )}
        </div>

        {/* Current Status */}
        <div className="credential-status">
          <h3>Current Status</h3>
          <div className="status-info">
            <span className="status-label">Tier:</span>
            <span className={`status-value ${apiCredentials.premiumTier ? 'premium' : 'free'}`}>
              {apiCredentials.premiumTier ? '⭐ Premium' : 'Free'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="credential-actions">
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
          >
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? '✓ Saved' : 'Save'}
          </button>
          <button className="btn btn-secondary" onClick={handleClear}>
            Clear All
          </button>
        </div>

        {saveStatus === 'error' && (
          <div className="error-message">
            Failed to save credentials. Please check your API keys and try again.
          </div>
        )}
      </div>
    </div>
  );
};
