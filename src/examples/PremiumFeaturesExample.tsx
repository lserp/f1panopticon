/**
 * Example demonstrating how to use Premium Tier Features
 *
 * This file shows how to:
 * 1. Configure API credentials
 * 2. Use feature gating
 * 3. Display feature comparison
 * 4. Use premium telemetry channels
 */

import React, { useState } from 'react';
import {
  ApiCredentialManager,
  FeatureComparisonTable,
  LockedFeatureBadge,
  FeatureGate,
  PremiumMultiChannelChart,
} from '../components';
import { useAppStore } from '../store';
import { checkFeatureAccess } from '../utils/featureTier';
import type { LapData } from '../types';

export const PremiumFeaturesExample: React.FC = () => {
  const [showCredentials, setShowCredentials] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const apiCredentials = useAppStore((state) => state.apiCredentials);

  // Example: Check if specific features are available
  const hasExtendedTelemetry = checkFeatureAccess(apiCredentials, 'extended-telemetry');
  const hasExtendedCharts = checkFeatureAccess(apiCredentials, 'extended-charts');
  const hasPdfReports = checkFeatureAccess(apiCredentials, 'pdf-reports');

  // Mock lap data for demonstration
  const mockLaps: LapData[] = []; // In real app, this would come from API

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Premium Features Demo</h1>

      {/* Current Tier Status */}
      <div
        style={{
          marginBottom: '30px',
          padding: '20px',
          background: '#f5f5f5',
          borderRadius: '8px',
        }}
      >
        <h2>Current Tier</h2>
        <p>
          You are currently on the{' '}
          <strong>{apiCredentials.premiumTier ? '⭐ Premium' : 'Free'}</strong> tier
        </p>
        <button onClick={() => setShowCredentials(!showCredentials)}>
          {showCredentials ? 'Hide' : 'Show'} API Credentials Manager
        </button>
        <button onClick={() => setShowComparison(!showComparison)} style={{ marginLeft: '10px' }}>
          {showComparison ? 'Hide' : 'Show'} Feature Comparison
        </button>
      </div>

      {/* API Credentials Manager */}
      {showCredentials && (
        <div style={{ marginBottom: '30px' }}>
          <ApiCredentialManager onClose={() => setShowCredentials(false)} />
        </div>
      )}

      {/* Feature Comparison Table */}
      {showComparison && (
        <div style={{ marginBottom: '30px' }}>
          <FeatureComparisonTable onUpgrade={() => setShowCredentials(true)} />
        </div>
      )}

      {/* Example 1: Feature Gating with FeatureGate Component */}
      <div style={{ marginBottom: '30px' }}>
        <h2>Example 1: Feature Gating</h2>
        <FeatureGate
          featureId="extended-telemetry"
          onUpgrade={() => setShowCredentials(true)}
          fallback={
            <div style={{ padding: '20px', background: '#fff3e0', borderRadius: '8px' }}>
              <p>Extended telemetry channels are only available in the premium tier.</p>
            </div>
          }
        >
          <div style={{ padding: '20px', background: '#e8f5e9', borderRadius: '8px' }}>
            <p>✓ You have access to extended telemetry channels!</p>
            <ul>
              <li>ERS Deployment</li>
              <li>ERS Store Level</li>
              <li>ERS Harvesting</li>
              <li>Fuel Flow</li>
              <li>Oil & Water Temperature</li>
              <li>Brake Temperatures</li>
            </ul>
          </div>
        </FeatureGate>
      </div>

      {/* Example 2: Inline Feature Badges */}
      <div style={{ marginBottom: '30px' }}>
        <h2>Example 2: Inline Feature Badges</h2>
        <div style={{ padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
          <h3>
            PDF Report Generation
            <LockedFeatureBadge featureId="pdf-reports" inline />
          </h3>
          <p>Generate comprehensive PDF reports with visualizations and annotations.</p>

          <h3>
            Setup Interpretation
            <LockedFeatureBadge featureId="setup-interpretation" inline />
          </h3>
          <p>AI-powered analysis to infer car setup characteristics from telemetry.</p>
        </div>
      </div>

      {/* Example 3: Conditional Rendering Based on Features */}
      <div style={{ marginBottom: '30px' }}>
        <h2>Example 3: Conditional Rendering</h2>
        <div style={{ padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
          <h3>Available Features:</h3>
          <ul>
            <li>✓ Basic Telemetry (Speed, Throttle, Brake, Gear)</li>
            <li>✓ Track Map Visualization</li>
            <li>✓ Lap Comparison (up to 4 laps)</li>
            <li>✓ Strategy Analysis</li>
            {hasExtendedTelemetry && <li>✓ Extended Telemetry Channels (ERS, Fuel, Temps)</li>}
            {hasExtendedCharts && <li>✓ Extended Dashboard (12 concurrent channels)</li>}
            {hasPdfReports && <li>✓ PDF Report Generation</li>}
          </ul>

          {!apiCredentials.premiumTier && (
            <button
              onClick={() => setShowCredentials(true)}
              style={{
                marginTop: '10px',
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Unlock Premium Features
            </button>
          )}
        </div>
      </div>

      {/* Example 4: Premium Multi-Channel Chart */}
      <div style={{ marginBottom: '30px' }}>
        <h2>Example 4: Premium Multi-Channel Chart</h2>
        <div style={{ padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
          <p>
            This chart supports up to {hasExtendedCharts ? '12' : '6'} concurrent channels
            {hasExtendedTelemetry && ' including premium channels like ERS and temperature data'}.
          </p>
          {mockLaps.length > 0 ? (
            <PremiumMultiChannelChart
              laps={mockLaps}
              channels={['speed', 'throttle', 'brake', 'gear', 'rpm', 'drs', 'ers']}
              onUpgrade={() => setShowCredentials(true)}
            />
          ) : (
            <p style={{ fontStyle: 'italic', color: '#666' }}>
              Load lap data to see the premium multi-channel chart in action
            </p>
          )}
        </div>
      </div>

      {/* Example 5: Feature Status Summary */}
      <div style={{ marginBottom: '30px' }}>
        <h2>Example 5: Feature Status Summary</h2>
        <div style={{ padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd' }}>
                <th style={{ textAlign: 'left', padding: '10px' }}>Feature</th>
                <th style={{ textAlign: 'center', padding: '10px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '10px' }}>Extended Telemetry Channels</td>
                <td style={{ textAlign: 'center', padding: '10px' }}>
                  {hasExtendedTelemetry ? '✓ Available' : '✗ Locked'}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '10px' }}>12 Concurrent Channels</td>
                <td style={{ textAlign: 'center', padding: '10px' }}>
                  {hasExtendedCharts ? '✓ Available' : '✗ Locked'}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '10px' }}>High Frequency Updates (2s)</td>
                <td style={{ textAlign: 'center', padding: '10px' }}>
                  {checkFeatureAccess(apiCredentials, 'high-frequency-updates')
                    ? '✓ Available'
                    : '✗ Locked'}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '10px' }}>PDF Report Generation</td>
                <td style={{ textAlign: 'center', padding: '10px' }}>
                  {hasPdfReports ? '✓ Available' : '✗ Locked'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
