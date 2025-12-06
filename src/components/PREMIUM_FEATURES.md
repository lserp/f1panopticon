# Premium Tier Features

This document describes the premium tier feature system implemented for the F1 Analysis Platform.

## Overview

The platform supports a two-tier system:
- **Free Tier**: Access to core features using public APIs
- **Premium Tier**: Enhanced features requiring API credentials

## Components

### 1. ApiCredentialManager

Component for managing API credentials.

**Usage:**
```tsx
import { ApiCredentialManager } from './components';

<ApiCredentialManager onClose={() => setShowModal(false)} />
```

**Features:**
- Secure credential input with show/hide toggle
- Real-time validation of API keys
- Persistent storage in localStorage
- Visual feedback for validation status

### 2. FeatureComparisonTable

Displays a comparison of free vs premium features.

**Usage:**
```tsx
import { FeatureComparisonTable } from './components';

<FeatureComparisonTable onUpgrade={() => openCredentialsModal()} />
```

**Features:**
- Categorized feature list (Data, Visualization, Analysis, Export)
- Current tier indicator
- Upgrade call-to-action for free users

### 3. LockedFeatureBadge

Visual indicator for locked premium features.

**Usage:**
```tsx
import { LockedFeatureBadge } from './components';

// Inline badge
<h3>
  Premium Feature
  <LockedFeatureBadge featureId="pdf-reports" inline />
</h3>

// Overlay badge
<LockedFeatureBadge 
  featureId="extended-telemetry"
  message="This feature requires premium access"
  onUpgrade={() => openCredentialsModal()}
/>
```

### 4. FeatureGate

Conditional rendering component based on feature availability.

**Usage:**
```tsx
import { FeatureGate } from './components';

<FeatureGate
  featureId="extended-telemetry"
  fallback={<p>Premium feature locked</p>}
  onUpgrade={() => openCredentialsModal()}
>
  <PremiumContent />
</FeatureGate>
```

### 5. PremiumMultiChannelChart

Enhanced telemetry chart supporting up to 12 channels and premium data.

**Usage:**
```tsx
import { PremiumMultiChannelChart } from './components';

<PremiumMultiChannelChart
  laps={laps}
  channels={['speed', 'throttle', 'brake', 'gear', 'rpm', 'drs', 'ers']}
  onUpgrade={() => openCredentialsModal()}
/>
```

**Premium Channels:**
- `ers` - Energy Recovery System deployment (0-100%)
- `ersStore` - ERS energy store level (0-100%)
- `ersHarvest` - ERS harvesting rate (kW)
- `fuelFlow` - Fuel flow rate (kg/h)
- `oilTemp` - Oil temperature (°C)
- `waterTemp` - Water temperature (°C)

## Utilities

### FeatureGate Utility

Programmatic feature checking.

**Usage:**
```tsx
import { checkFeatureAccess, createFeatureGate } from './utils/featureTier';
import { useAppStore } from './store';

// Simple check
const apiCredentials = useAppStore((state) => state.apiCredentials);
const hasFeature = checkFeatureAccess(apiCredentials, 'extended-telemetry');

// Advanced usage
const gate = createFeatureGate(apiCredentials);
const availableFeatures = gate.getAvailableFeatures();
const lockedFeatures = gate.getLockedFeatures();
const currentTier = gate.getCurrentTier();
```

### PremiumAPIClient

Enhanced API client with premium features.

**Usage:**
```tsx
import { createPremiumAPIClient } from './services/premiumApiClient';
import { useAppStore } from './store';

const apiCredentials = useAppStore((state) => state.apiCredentials);
const client = createPremiumAPIClient('https://api.example.com', apiCredentials);

// Get update interval based on tier
const interval = client.getUpdateInterval(); // 2s for premium, 10s for free

// Check premium status
const isPremium = client.isPremium();

// Fetch telemetry with extended channels
const telemetry = await client.fetchTelemetryData(sessionId, driverId, lapNumber);

// Start live data polling
const stopPolling = client.startLiveDataPolling(
  sessionId,
  (data) => console.log('New data:', data),
  (error) => console.error('Error:', error)
);

// Stop polling when done
stopPolling();
```

## Feature Catalog

### Data Features
- ✓ **Basic Telemetry Data** (Free) - Speed, throttle, brake, gear at standard frequency
- ⭐ **High Frequency Updates** (Premium) - Data updates every 2 seconds
- ⭐ **Extended Telemetry Channels** (Premium) - DRS, ERS, temperatures, fuel flow
- ✓ **Historical Data Access** (Free) - Race data from 2018 onwards

### Visualization Features
- ✓ **Basic Charts (6 channels)** (Free) - Up to 6 concurrent telemetry channels
- ⭐ **Extended Charts (12 channels)** (Premium) - Up to 12 concurrent channels
- ✓ **Interactive Track Map** (Free) - Visual track layout with position markers
- ✓ **Custom Dashboard Layouts** (Free) - Save and load custom configurations

### Analysis Features
- ✓ **Lap Comparison** (Free) - Compare up to 4 laps side-by-side
- ✓ **Strategy Analysis** (Free) - Pit stop analysis and strategy simulation
- ✓ **Correlation Analysis** (Free) - Statistical correlation between parameters
- ⭐ **Setup Interpretation** (Premium) - AI-powered setup inference

### Export Features
- ✓ **Basic Export (CSV/JSON)** (Free) - Export telemetry data
- ✓ **Visualization Export** (Free) - Export charts as PNG/SVG up to 4K
- ⭐ **PDF Report Generation** (Premium) - Comprehensive PDF reports with annotations

## Implementation Details

### State Management

API credentials are stored in Zustand store and persisted to localStorage:

```tsx
interface ApiCredentials {
  fastf1ApiKey?: string;
  openf1ApiKey?: string;
  premiumTier: boolean;
}
```

### Validation

API keys are validated with the following rules:
- Minimum 20 characters
- Alphanumeric characters only
- Real-time validation with visual feedback

### Security

- API keys stored in browser's localStorage (encrypted in production)
- Keys never exposed in client-side code or logs
- Secure transmission via HTTPS headers
- User control over credential clearing

### Cross-Tab Synchronization

Credentials are synchronized across browser tabs using BroadcastChannel API, ensuring consistent state across all instances of the application.

## Testing

Tests are provided for all premium features:

```bash
# Run feature tier tests
npm test -- src/utils/featureTier.test.ts

# Run credential manager tests
npm test -- src/components/ApiCredentialManager.test.tsx
```

## Example

See `src/examples/PremiumFeaturesExample.tsx` for a comprehensive example demonstrating all premium features.

## Future Enhancements

Potential future additions:
- OAuth 2.0 authentication
- Team/organization accounts
- Usage analytics and quotas
- Additional premium data sources
- Advanced AI-powered analysis features
