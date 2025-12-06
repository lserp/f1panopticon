import React, { useState, useCallback } from 'react';
import { useAppStore } from '../store';
import type { DashboardConfig } from '../store/types';
import './DashboardConfigManager.css';

export interface DashboardConfigManagerProps {
  className?: string;
}

export const DashboardConfigManager: React.FC<DashboardConfigManagerProps> = ({
  className = '',
}) => {
  const chartLayout = useAppStore((state) => state.chartLayout);
  const currentTime = useAppStore((state) => state.currentTime);
  const dashboardConfigs = useAppStore((state) => state.dashboardConfigs);
  const saveDashboardConfig = useAppStore((state) => state.saveDashboardConfig);
  const loadDashboardConfig = useAppStore((state) => state.loadDashboardConfig);
  const deleteDashboardConfig = useAppStore((state) => state.deleteDashboardConfig);

  const [configName, setConfigName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<string | null>(null);

  // Handle save configuration
  const handleSave = useCallback(() => {
    if (!configName.trim()) {
      alert('Please enter a configuration name');
      return;
    }

    const config: DashboardConfig = {
      name: configName.trim(),
      layout: chartLayout,
      syncTime: currentTime,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    saveDashboardConfig(configName.trim(), config);
    setConfigName('');
    setShowSaveDialog(false);
    alert(`Configuration "${configName.trim()}" saved successfully!`);
  }, [configName, chartLayout, currentTime, saveDashboardConfig]);

  // Handle load configuration
  const handleLoad = useCallback(
    (name: string) => {
      const config = loadDashboardConfig(name);
      if (config) {
        setSelectedConfig(name);
        alert(`Configuration "${name}" loaded successfully!`);
      } else {
        alert(`Failed to load configuration "${name}"`);
      }
    },
    [loadDashboardConfig]
  );

  // Handle delete configuration
  const handleDelete = useCallback(
    (name: string) => {
      if (window.confirm(`Are you sure you want to delete configuration "${name}"?`)) {
        deleteDashboardConfig(name);
        if (selectedConfig === name) {
          setSelectedConfig(null);
        }
        alert(`Configuration "${name}" deleted successfully!`);
      }
    },
    [deleteDashboardConfig, selectedConfig]
  );

  // Get list of saved configurations
  const configList = Object.values(dashboardConfigs);

  return (
    <div className={`dashboard-config-manager ${className}`}>
      <div className="config-header">
        <h3>Dashboard Configurations</h3>
        <button className="save-btn" onClick={() => setShowSaveDialog(true)}>
          💾 Save Current
        </button>
      </div>

      {showSaveDialog && (
        <div className="save-dialog">
          <input
            type="text"
            placeholder="Enter configuration name..."
            value={configName}
            onChange={(e) => setConfigName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSave()}
            autoFocus
          />
          <div className="dialog-buttons">
            <button className="confirm-btn" onClick={handleSave}>
              Save
            </button>
            <button className="cancel-btn" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="config-list">
        {configList.length === 0 ? (
          <p className="empty-message">No saved configurations yet</p>
        ) : (
          configList.map((config) => (
            <div
              key={config.name}
              className={`config-item ${selectedConfig === config.name ? 'active' : ''}`}
            >
              <div className="config-info">
                <h4>{config.name}</h4>
                <p className="config-meta">
                  {config.layout.charts.filter((c) => c.visible).length} charts •{' '}
                  {new Date(config.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="config-actions">
                <button
                  className="load-btn"
                  onClick={() => handleLoad(config.name)}
                  title="Load configuration"
                >
                  📂
                </button>
                <button
                  className="delete-btn"
                  onClick={() => handleDelete(config.name)}
                  title="Delete configuration"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="preset-templates">
        <h4>Preset Templates</h4>
        <div className="template-buttons">
          <button
            className="template-btn"
            onClick={() => loadPresetTemplate('basic')}
            title="Basic 4-chart layout"
          >
            Basic (4 charts)
          </button>
          <button
            className="template-btn"
            onClick={() => loadPresetTemplate('advanced')}
            title="Advanced 6-chart layout"
          >
            Advanced (6 charts)
          </button>
          <button
            className="template-btn"
            onClick={() => loadPresetTemplate('full')}
            title="Full 12-chart layout"
          >
            Full (12 charts)
          </button>
        </div>
      </div>
    </div>
  );

  // Load preset template
  function loadPresetTemplate(template: 'basic' | 'advanced' | 'full') {
    const presets = getPresetTemplates();
    const preset = presets[template];
    if (preset) {
      saveDashboardConfig(`Preset: ${preset.name}`, preset);
      loadDashboardConfig(`Preset: ${preset.name}`);
      alert(`Loaded ${preset.name} template`);
    }
  }
};

// Get preset dashboard templates
function getPresetTemplates(): Record<string, DashboardConfig> {
  return {
    basic: {
      name: 'Basic Layout',
      layout: {
        columns: 2,
        rows: 2,
        charts: [
          {
            id: 'speed',
            type: 'speed',
            position: { x: 0, y: 0, w: 6, h: 2 },
            visible: true,
          },
          {
            id: 'throttle',
            type: 'throttle',
            position: { x: 6, y: 0, w: 6, h: 2 },
            visible: true,
          },
          {
            id: 'brake',
            type: 'brake',
            position: { x: 0, y: 2, w: 6, h: 2 },
            visible: true,
          },
          {
            id: 'gear',
            type: 'gear',
            position: { x: 6, y: 2, w: 6, h: 2 },
            visible: true,
          },
        ],
      },
      syncTime: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    advanced: {
      name: 'Advanced Layout',
      layout: {
        columns: 3,
        rows: 2,
        charts: [
          {
            id: 'speed',
            type: 'speed',
            position: { x: 0, y: 0, w: 4, h: 2 },
            visible: true,
          },
          {
            id: 'throttle',
            type: 'throttle',
            position: { x: 4, y: 0, w: 4, h: 2 },
            visible: true,
          },
          {
            id: 'brake',
            type: 'brake',
            position: { x: 8, y: 0, w: 4, h: 2 },
            visible: true,
          },
          {
            id: 'gear',
            type: 'gear',
            position: { x: 0, y: 2, w: 4, h: 2 },
            visible: true,
          },
          {
            id: 'rpm',
            type: 'rpm',
            position: { x: 4, y: 2, w: 4, h: 2 },
            visible: true,
          },
          {
            id: 'trackMap',
            type: 'trackMap',
            position: { x: 8, y: 2, w: 4, h: 2 },
            visible: true,
          },
        ],
      },
      syncTime: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    full: {
      name: 'Full Layout',
      layout: {
        columns: 4,
        rows: 3,
        charts: [
          {
            id: 'speed',
            type: 'speed',
            position: { x: 0, y: 0, w: 3, h: 2 },
            visible: true,
          },
          {
            id: 'throttle',
            type: 'throttle',
            position: { x: 3, y: 0, w: 3, h: 2 },
            visible: true,
          },
          {
            id: 'brake',
            type: 'brake',
            position: { x: 6, y: 0, w: 3, h: 2 },
            visible: true,
          },
          {
            id: 'gear',
            type: 'gear',
            position: { x: 9, y: 0, w: 3, h: 2 },
            visible: true,
          },
          {
            id: 'rpm',
            type: 'rpm',
            position: { x: 0, y: 2, w: 3, h: 2 },
            visible: true,
          },
          {
            id: 'drs',
            type: 'drs',
            position: { x: 3, y: 2, w: 3, h: 2 },
            visible: true,
          },
          {
            id: 'trackMap',
            type: 'trackMap',
            position: { x: 6, y: 2, w: 6, h: 2 },
            visible: true,
          },
          {
            id: 'speed-2',
            type: 'speed',
            position: { x: 0, y: 4, w: 3, h: 2 },
            visible: true,
          },
          {
            id: 'throttle-2',
            type: 'throttle',
            position: { x: 3, y: 4, w: 3, h: 2 },
            visible: true,
          },
          {
            id: 'brake-2',
            type: 'brake',
            position: { x: 6, y: 4, w: 3, h: 2 },
            visible: true,
          },
          {
            id: 'gear-2',
            type: 'gear',
            position: { x: 9, y: 4, w: 3, h: 2 },
            visible: true,
          },
          {
            id: 'rpm-2',
            type: 'rpm',
            position: { x: 0, y: 6, w: 6, h: 2 },
            visible: true,
          },
        ],
      },
      syncTime: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };
}
