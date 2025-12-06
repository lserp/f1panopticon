import type { ApiCredentials } from '../store/types';

// Feature tier definitions
export type FeatureTier = 'free' | 'premium';

export interface Feature {
  id: string;
  name: string;
  description: string;
  tier: FeatureTier;
  category: 'data' | 'visualization' | 'analysis' | 'export';
}

// Feature catalog
export const FEATURES: Feature[] = [
  // Data features
  {
    id: 'basic-telemetry',
    name: 'Basic Telemetry Data',
    description: 'Speed, throttle, brake, gear data at standard frequency',
    tier: 'free',
    category: 'data',
  },
  {
    id: 'high-frequency-updates',
    name: 'High Frequency Updates',
    description: 'Data updates every 2 seconds instead of 10 seconds',
    tier: 'premium',
    category: 'data',
  },
  {
    id: 'extended-telemetry',
    name: 'Extended Telemetry Channels',
    description: 'DRS, energy recovery, and additional sensor data',
    tier: 'premium',
    category: 'data',
  },
  {
    id: 'historical-data',
    name: 'Historical Data Access',
    description: 'Access to race data from 2018 onwards',
    tier: 'free',
    category: 'data',
  },

  // Visualization features
  {
    id: 'basic-charts',
    name: 'Basic Charts (6 channels)',
    description: 'Display up to 6 concurrent telemetry channels',
    tier: 'free',
    category: 'visualization',
  },
  {
    id: 'extended-charts',
    name: 'Extended Charts (12 channels)',
    description: 'Display up to 12 concurrent telemetry channels',
    tier: 'premium',
    category: 'visualization',
  },
  {
    id: 'track-map',
    name: 'Interactive Track Map',
    description: 'Visual track layout with position markers',
    tier: 'free',
    category: 'visualization',
  },
  {
    id: 'custom-dashboards',
    name: 'Custom Dashboard Layouts',
    description: 'Save and load custom dashboard configurations',
    tier: 'free',
    category: 'visualization',
  },

  // Analysis features
  {
    id: 'lap-comparison',
    name: 'Lap Comparison',
    description: 'Compare up to 4 laps side-by-side',
    tier: 'free',
    category: 'analysis',
  },
  {
    id: 'strategy-analysis',
    name: 'Strategy Analysis',
    description: 'Pit stop analysis and strategy simulation',
    tier: 'free',
    category: 'analysis',
  },
  {
    id: 'correlation-analysis',
    name: 'Correlation Analysis',
    description: 'Statistical correlation between telemetry parameters',
    tier: 'free',
    category: 'analysis',
  },
  {
    id: 'setup-interpretation',
    name: 'Setup Interpretation',
    description: 'AI-powered setup characteristic inference',
    tier: 'premium',
    category: 'analysis',
  },

  // Export features
  {
    id: 'basic-export',
    name: 'Basic Export (CSV/JSON)',
    description: 'Export telemetry data in CSV and JSON formats',
    tier: 'free',
    category: 'export',
  },
  {
    id: 'visualization-export',
    name: 'Visualization Export',
    description: 'Export charts as PNG/SVG up to 4K resolution',
    tier: 'free',
    category: 'export',
  },
  {
    id: 'pdf-reports',
    name: 'PDF Report Generation',
    description: 'Generate comprehensive PDF reports with annotations',
    tier: 'premium',
    category: 'export',
  },
];

// Feature gating utility
export class FeatureGate {
  private credentials: ApiCredentials;

  constructor(credentials: ApiCredentials) {
    this.credentials = credentials;
  }

  /**
   * Check if a feature is available based on current credentials
   */
  isFeatureAvailable(featureId: string): boolean {
    const feature = FEATURES.find((f) => f.id === featureId);
    if (!feature) {
      if (import.meta.env.DEV) {
        console.warn(`Unknown feature: ${featureId}`);
      }
      return false;
    }

    // Free features are always available
    if (feature.tier === 'free') {
      return true;
    }

    // Premium features require valid credentials
    return this.credentials.premiumTier;
  }

  /**
   * Get the current tier
   */
  getCurrentTier(): FeatureTier {
    return this.credentials.premiumTier ? 'premium' : 'free';
  }

  /**
   * Get all features for a specific tier
   */
  getFeaturesForTier(tier: FeatureTier): Feature[] {
    return FEATURES.filter((f) => f.tier === tier);
  }

  /**
   * Get all available features based on current credentials
   */
  getAvailableFeatures(): Feature[] {
    return FEATURES.filter((f) => this.isFeatureAvailable(f.id));
  }

  /**
   * Get all locked features based on current credentials
   */
  getLockedFeatures(): Feature[] {
    return FEATURES.filter((f) => !this.isFeatureAvailable(f.id));
  }

  /**
   * Get features by category
   */
  getFeaturesByCategory(category: Feature['category']): Feature[] {
    return FEATURES.filter((f) => f.category === category);
  }
}

/**
 * Create a feature gate instance from credentials
 */
export function createFeatureGate(credentials: ApiCredentials): FeatureGate {
  return new FeatureGate(credentials);
}

/**
 * Hook-friendly feature check
 */
export function checkFeatureAccess(credentials: ApiCredentials, featureId: string): boolean {
  const gate = new FeatureGate(credentials);
  return gate.isFeatureAvailable(featureId);
}
