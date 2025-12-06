import React from 'react';
import { useAppStore } from '../store';
import { checkFeatureAccess } from '../utils/featureTier';
import './LockedFeatureBadge.css';

export interface LockedFeatureBadgeProps {
  featureId: string;
  featureName?: string;
  message?: string;
  onUpgrade?: () => void;
  inline?: boolean;
}

export const LockedFeatureBadge: React.FC<LockedFeatureBadgeProps> = ({
  featureId,
  featureName,
  message,
  onUpgrade,
  inline = false,
}) => {
  const apiCredentials = useAppStore((state) => state.apiCredentials);
  const isAvailable = checkFeatureAccess(apiCredentials, featureId);

  // If feature is available, don't show the badge
  if (isAvailable) {
    return null;
  }

  const defaultMessage = message || `${featureName || 'This feature'} requires a premium account`;

  if (inline) {
    return (
      <span className="locked-feature-badge inline">
        <span className="lock-icon">🔒</span>
        <span className="badge-text">Premium</span>
      </span>
    );
  }

  return (
    <div className="locked-feature-overlay">
      <div className="locked-content">
        <div className="lock-icon-large">🔒</div>
        <h3 className="locked-title">Premium Feature</h3>
        <p className="locked-message">{defaultMessage}</p>
        {onUpgrade && (
          <button className="unlock-btn" onClick={onUpgrade}>
            Unlock with API Key
          </button>
        )}
      </div>
    </div>
  );
};

export interface FeatureGateProps {
  featureId: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onUpgrade?: () => void;
}

/**
 * Component that conditionally renders children based on feature availability
 */
export const FeatureGate: React.FC<FeatureGateProps> = ({
  featureId,
  children,
  fallback,
  onUpgrade,
}) => {
  const apiCredentials = useAppStore((state) => state.apiCredentials);
  const isAvailable = checkFeatureAccess(apiCredentials, featureId);

  if (isAvailable) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="feature-gate-locked">
      <LockedFeatureBadge featureId={featureId} onUpgrade={onUpgrade} />
    </div>
  );
};
