import { useState, useEffect } from 'react';
import { ApiCredentialManager } from '../components/ApiCredentialManager';
import { cacheManager } from '../services/cacheManager';
import './Settings.css';

interface CacheStats {
  totalSessions: number;
  seasons: number[];
  estimatedSizeBytes: number;
  estimatedSizeMB: string;
  lastUpdated: Date;
}

interface SettingsProps {
  onThemeChange?: (theme: 'light' | 'dark' | 'auto') => void;
  onUnitsChange?: (units: 'metric' | 'imperial') => void;
}

export const Settings: React.FC<SettingsProps> = ({ onThemeChange, onUnitsChange }) => {
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('auto');
  const [units, setUnits] = useState<'metric' | 'imperial'>('metric');
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'api' | 'cache' | 'display'>('general');

  useEffect(() => {
    // Load settings from localStorage
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'auto' | null;
    const savedUnits = localStorage.getItem('units') as 'metric' | 'imperial' | null;

    if (savedTheme) setTheme(savedTheme);
    if (savedUnits) setUnits(savedUnits);

    // Load cache stats
    loadCacheStats();
  }, []);

  const loadCacheStats = async () => {
    try {
      const stats = await cacheManager.getCacheStats();
      setCacheStats(stats);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to load cache stats:', error);
      }
    }
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'auto') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    onThemeChange?.(newTheme);
  };

  const handleUnitsChange = (newUnits: 'metric' | 'imperial') => {
    setUnits(newUnits);
    localStorage.setItem('units', newUnits);
    onUnitsChange?.(newUnits);
  };

  const handleClearCache = async () => {
    if (!confirm('Are you sure you want to clear all cached historical data? This will require re-downloading data on next use.')) {
      return;
    }

    setIsClearing(true);
    try {
      await cacheManager.clearCache();
      await loadCacheStats();
      alert('Cache cleared successfully. Historical data will be re-downloaded when needed.');
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to clear cache:', error);
      }
      alert('Failed to clear cache. Please try again.');
    } finally {
      setIsClearing(false);
    }
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className="settings">
      <div className="settings-header">
        <h1>Settings</h1>
        <p className="settings-description">Configure your F1 Analysis Platform preferences</p>
      </div>

      <div className="settings-layout">
        <aside className="settings-sidebar">
          <nav className="settings-nav">
            <button
              onClick={() => setActiveTab('general')}
              className={`nav-button ${activeTab === 'general' ? 'active' : ''}`}
            >
              <span className="nav-icon">⚙️</span>
              General
            </button>
            <button
              onClick={() => setActiveTab('api')}
              className={`nav-button ${activeTab === 'api' ? 'active' : ''}`}
            >
              <span className="nav-icon">🔑</span>
              API Credentials
            </button>
            <button
              onClick={() => setActiveTab('cache')}
              className={`nav-button ${activeTab === 'cache' ? 'active' : ''}`}
            >
              <span className="nav-icon">💾</span>
              Cache Management
            </button>
            <button
              onClick={() => setActiveTab('display')}
              className={`nav-button ${activeTab === 'display' ? 'active' : ''}`}
            >
              <span className="nav-icon">🎨</span>
              Display
            </button>
          </nav>
        </aside>

        <main className="settings-content">
          {activeTab === 'general' && (
            <div className="settings-section">
              <h2>General Settings</h2>

              <div className="setting-group">
                <label className="setting-label">Units</label>
                <p className="setting-description">
                  Choose your preferred unit system for displaying measurements
                </p>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="units"
                      value="metric"
                      checked={units === 'metric'}
                      onChange={(e) => handleUnitsChange(e.target.value as 'metric' | 'imperial')}
                    />
                    Metric (km/h, °C)
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="units"
                      value="imperial"
                      checked={units === 'imperial'}
                      onChange={(e) => handleUnitsChange(e.target.value as 'metric' | 'imperial')}
                    />
                    Imperial (mph, °F)
                  </label>
                </div>
              </div>

              <div className="setting-group">
                <label className="setting-label">Language</label>
                <p className="setting-description">Select your preferred language</p>
                <select className="setting-select" defaultValue="en">
                  <option value="en">English</option>
                  <option value="es" disabled>
                    Spanish (Coming Soon)
                  </option>
                  <option value="fr" disabled>
                    French (Coming Soon)
                  </option>
                  <option value="de" disabled>
                    German (Coming Soon)
                  </option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="settings-section">
              <h2>API Credentials</h2>
              <p className="section-description">
                Configure your API credentials to access premium features and higher rate limits
              </p>
              <ApiCredentialManager />
            </div>
          )}

          {activeTab === 'cache' && (
            <div className="settings-section">
              <h2>Cache Management</h2>
              <p className="section-description">
                Manage locally cached data to improve performance and reduce API calls
              </p>

              {cacheStats && (
                <div className="cache-stats">
                  <div className="stat-card">
                    <div className="stat-icon">📊</div>
                    <div className="stat-content">
                      <div className="stat-label">Cached Sessions</div>
                      <div className="stat-value">{cacheStats.totalSessions}</div>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon">💾</div>
                    <div className="stat-content">
                      <div className="stat-label">Cache Size</div>
                      <div className="stat-value">{cacheStats.estimatedSizeMB} MB</div>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon">📅</div>
                    <div className="stat-content">
                      <div className="stat-label">Cached Seasons</div>
                      <div className="stat-value">{cacheStats.seasons.join(', ') || 'None'}</div>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon">🕐</div>
                    <div className="stat-content">
                      <div className="stat-label">Last Updated</div>
                      <div className="stat-value">{formatDate(cacheStats.lastUpdated)}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="cache-actions">
                <button
                  onClick={handleClearCache}
                  disabled={isClearing}
                  className="clear-cache-btn"
                >
                  {isClearing ? 'Clearing...' : 'Clear All Cache'}
                </button>
                <button onClick={loadCacheStats} className="refresh-stats-btn">
                  Refresh Statistics
                </button>
              </div>

              <div className="cache-info">
                <h3>About Historical Cache</h3>
                <p>
                  Historical F1 data (past seasons) is permanently cached in IndexedDB for instant access.
                  This dramatically improves browsing speed and reduces API calls.
                </p>
                <ul>
                  <li>✅ Past seasons (2020-2023) are cached permanently</li>
                  <li>⏱️ Current season data refreshes automatically</li>
                  <li>💾 Typical cache size: 8-15 MB for 4 years of data</li>
                  <li>🚀 Instant browsing after initial download</li>
                  <li>📡 Works offline for historical data</li>
                </ul>
                <p className="cache-note">
                  <strong>Note:</strong> Clearing the cache will require re-downloading all historical data,
                  which may take 1-2 minutes depending on your connection speed.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'display' && (
            <div className="settings-section">
              <h2>Display Settings</h2>

              <div className="setting-group">
                <label className="setting-label">Theme</label>
                <p className="setting-description">Choose your preferred color theme</p>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="theme"
                      value="light"
                      checked={theme === 'light'}
                      onChange={(e) => handleThemeChange(e.target.value as typeof theme)}
                    />
                    Light
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="theme"
                      value="dark"
                      checked={theme === 'dark'}
                      onChange={(e) => handleThemeChange(e.target.value as typeof theme)}
                    />
                    Dark
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="theme"
                      value="auto"
                      checked={theme === 'auto'}
                      onChange={(e) => handleThemeChange(e.target.value as typeof theme)}
                    />
                    Auto (System)
                  </label>
                </div>
              </div>

              <div className="setting-group">
                <label className="setting-label">Chart Animation</label>
                <p className="setting-description">
                  Enable or disable animations in charts and visualizations
                </p>
                <label className="checkbox-label">
                  <input type="checkbox" defaultChecked />
                  Enable chart animations
                </label>
              </div>

              <div className="setting-group">
                <label className="setting-label">Data Density</label>
                <p className="setting-description">
                  Adjust the amount of information displayed in charts
                </p>
                <select className="setting-select" defaultValue="normal">
                  <option value="compact">Compact</option>
                  <option value="normal">Normal</option>
                  <option value="comfortable">Comfortable</option>
                </select>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
