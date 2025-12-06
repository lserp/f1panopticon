import React, { useMemo } from 'react';
import { useAppStore } from '../store';
import { FEATURES, createFeatureGate, type Feature } from '../utils/featureTier';
import './FeatureComparisonTable.css';

export interface FeatureComparisonTableProps {
  onUpgrade?: () => void;
}

export const FeatureComparisonTable: React.FC<FeatureComparisonTableProps> = ({ onUpgrade }) => {
  const apiCredentials = useAppStore((state) => state.apiCredentials);

  const featureGate = useMemo(() => createFeatureGate(apiCredentials), [apiCredentials]);

  // Group features by category
  const featuresByCategory = useMemo(() => {
    const categories: Record<Feature['category'], Feature[]> = {
      data: [],
      visualization: [],
      analysis: [],
      export: [],
    };

    FEATURES.forEach((feature) => {
      categories[feature.category].push(feature);
    });

    return categories;
  }, []);

  const categoryLabels: Record<Feature['category'], string> = {
    data: 'Data Access',
    visualization: 'Visualization',
    analysis: 'Analysis Tools',
    export: 'Export Options',
  };

  const currentTier = featureGate.getCurrentTier();

  return (
    <div className="feature-comparison-table">
      <div className="table-header">
        <h2>Feature Comparison</h2>
        <p className="table-description">Compare features available in Free and Premium tiers</p>
      </div>

      <div className="comparison-grid">
        {/* Header row */}
        <div className="grid-header">
          <div className="feature-column">Feature</div>
          <div className="tier-column free-tier">
            <div className="tier-label">Free</div>
            <div className="tier-price">$0</div>
          </div>
          <div className="tier-column premium-tier">
            <div className="tier-label">Premium</div>
            <div className="tier-price">API Key Required</div>
          </div>
        </div>

        {/* Feature rows grouped by category */}
        {Object.entries(featuresByCategory).map(([category, features]) => (
          <div key={category} className="category-section">
            <div className="category-header">{categoryLabels[category as Feature['category']]}</div>
            {features.map((feature) => (
              <div key={feature.id} className="feature-row">
                <div className="feature-info">
                  <div className="feature-name">{feature.name}</div>
                  <div className="feature-description">{feature.description}</div>
                </div>
                <div className="tier-cell free-tier">
                  {feature.tier === 'free' ? (
                    <span className="check-icon" aria-label="Available">
                      ✓
                    </span>
                  ) : (
                    <span className="cross-icon" aria-label="Not available">
                      ✗
                    </span>
                  )}
                </div>
                <div className="tier-cell premium-tier">
                  <span className="check-icon" aria-label="Available">
                    ✓
                  </span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Current tier indicator */}
      <div className="current-tier-indicator">
        <span className="indicator-label">Your current tier:</span>
        <span className={`indicator-value ${currentTier}`}>
          {currentTier === 'premium' ? '⭐ Premium' : 'Free'}
        </span>
      </div>

      {/* Upgrade CTA */}
      {currentTier === 'free' && onUpgrade && (
        <div className="upgrade-cta">
          <p>Unlock premium features with your API credentials</p>
          <button className="upgrade-btn" onClick={onUpgrade}>
            Configure API Keys
          </button>
        </div>
      )}
    </div>
  );
};
