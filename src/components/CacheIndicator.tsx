import React from 'react';
import './CacheIndicator.css';

export interface CacheIndicatorProps {
  isHit: boolean;
  showLabel?: boolean;
  compact?: boolean;
}

export const CacheIndicator: React.FC<CacheIndicatorProps> = ({
  isHit,
  showLabel = true,
  compact = false,
}) => {
  if (compact) {
    return (
      <span
        className={`cache-indicator cache-indicator--compact ${
          isHit ? 'cache-indicator--hit' : 'cache-indicator--miss'
        }`}
        title={isHit ? 'Loaded from cache' : 'Fetched from API'}
      >
        {isHit ? '⚡' : '🌐'}
      </span>
    );
  }

  return (
    <div className={`cache-indicator ${isHit ? 'cache-indicator--hit' : 'cache-indicator--miss'}`}>
      <span className="cache-indicator__icon">{isHit ? '⚡' : '🌐'}</span>
      {showLabel && <span className="cache-indicator__label">{isHit ? 'Cached' : 'Live'}</span>}
    </div>
  );
};
