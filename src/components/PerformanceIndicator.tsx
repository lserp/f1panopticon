/**
 * Performance Indicator Component
 * Shows current network speed and performance level to users
 */

import React from 'react';
import {
  useNetworkSpeed,
  usePerformanceLevel,
  useDataSaver,
} from '../hooks/useAdaptivePerformance';
import './PerformanceIndicator.css';

export interface PerformanceIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export const PerformanceIndicator: React.FC<PerformanceIndicatorProps> = ({
  className = '',
  showDetails = false,
}) => {
  const networkSpeed = useNetworkSpeed();
  const performanceLevel = usePerformanceLevel();
  const dataSaver = useDataSaver();

  const getNetworkIcon = () => {
    switch (networkSpeed) {
      case 'slow-2g':
      case '2g':
        return '📶';
      case '3g':
        return '📶📶';
      case '4g':
        return '📶📶📶';
      case 'fast':
        return '📶📶📶📶';
      default:
        return '❓';
    }
  };

  const getPerformanceColor = () => {
    switch (performanceLevel) {
      case 'low':
        return '#d62728';
      case 'medium':
        return '#ff7f0e';
      case 'high':
        return '#2ca02c';
      case 'ultra':
        return '#1f77b4';
      default:
        return '#666';
    }
  };

  const getPerformanceLabel = () => {
    if (dataSaver) return 'Data Saver Mode';
    return `${performanceLevel.charAt(0).toUpperCase() + performanceLevel.slice(1)} Performance`;
  };

  return (
    <div className={`performance-indicator ${className}`}>
      <div
        className="performance-badge"
        style={{ backgroundColor: getPerformanceColor() }}
        title={getPerformanceLabel()}
      >
        <span className="network-icon">{getNetworkIcon()}</span>
        {showDetails && <span className="performance-label">{getPerformanceLabel()}</span>}
      </div>
      {dataSaver && (
        <div className="data-saver-badge" title="Data Saver Enabled">
          💾
        </div>
      )}
    </div>
  );
};
