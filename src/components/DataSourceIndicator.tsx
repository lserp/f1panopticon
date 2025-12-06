import React from 'react';
import type { APIProvider } from '../types';
import './DataSourceIndicator.css';

export interface DataSourceIndicatorProps {
  source: APIProvider;
  fetchedAt: Date;
  showTimestamp?: boolean;
  compact?: boolean;
}

const SOURCE_LABELS: Record<APIProvider, string> = {
  fastf1: 'FastF1',
  ergast: 'Ergast',
  openf1: 'OpenF1',
};

const SOURCE_COLORS: Record<APIProvider, string> = {
  fastf1: '#667eea',
  ergast: '#48bb78',
  openf1: '#ed8936',
};

export const DataSourceIndicator: React.FC<DataSourceIndicatorProps> = ({
  source,
  fetchedAt,
  showTimestamp = true,
  compact = false,
}) => {
  const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'just now';
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (compact) {
    return (
      <span
        className="data-source-indicator data-source-indicator--compact"
        style={{ borderColor: SOURCE_COLORS[source] }}
        title={`Source: ${SOURCE_LABELS[source]} • Fetched ${formatTimestamp(fetchedAt)}`}
      >
        {SOURCE_LABELS[source]}
      </span>
    );
  }

  return (
    <div className="data-source-indicator">
      <div className="data-source-indicator__badge" style={{ background: SOURCE_COLORS[source] }}>
        <span className="data-source-indicator__label">{SOURCE_LABELS[source]}</span>
      </div>
      {showTimestamp && (
        <span className="data-source-indicator__timestamp">{formatTimestamp(fetchedAt)}</span>
      )}
    </div>
  );
};
