# Strategy Visualization Components

This document describes the strategy visualization components implemented for the F1 Analysis Platform.

## Components

### StrategyTimeline

A comprehensive timeline visualization component that displays race strategy information including pit stops, tire stints, position changes, safety car periods, and weather conditions.

**Features:**
- Visual representation of tire stints with color-coded compounds
- Pit stop markers with timing information
- Position changes over the race
- Safety car and virtual safety car period highlighting
- Weather condition indicators
- Interactive tooltips with detailed information

**Props:**
- `strategyPlan`: The strategy plan containing pit stops and tire allocation
- `positionChanges`: Optional array of position changes throughout the race
- `safetyCarPeriods`: Optional array of safety car periods
- `weatherConditions`: Optional array of weather conditions
- `totalLaps`: Total number of laps in the race
- `driverId`: Optional driver identifier
- `height`: Optional custom height (default: 400px)

**Example Usage:**
```tsx
import { StrategyTimeline } from './components';

<StrategyTimeline
  strategyPlan={myStrategyPlan}
  positionChanges={positionData}
  safetyCarPeriods={safetyCarData}
  weatherConditions={weatherData}
  totalLaps={50}
  height={500}
/>
```

### StrategyComparison

A side-by-side comparison component that displays multiple strategy scenarios with time gain analysis and confidence intervals.

**Features:**
- Bar chart showing time gains/losses for each strategy
- Confidence interval visualization with error bars
- Side-by-side strategy timeline comparisons
- Detailed metrics for each strategy (finish time, position, risk level)
- Color-coded indicators for positive/negative time gains
- Pit stop details for each strategy

**Props:**
- `comparison`: Strategy comparison object containing baseline and alternatives
- `totalLaps`: Total number of laps in the race
- `driverId`: Optional driver identifier
- `height`: Optional custom height for individual timelines (default: 600px)

**Example Usage:**
```tsx
import { StrategyComparison } from './components';

<StrategyComparison
  comparison={strategyComparisonData}
  totalLaps={50}
  height={800}
/>
```

## Data Types

### StrategyPlan
```typescript
interface StrategyPlan {
  pitStops: PitStop[];
  tireAllocation: TireStint[];
  estimatedFinishTime: number;
  riskLevel: 'low' | 'medium' | 'high';
}
```

### StrategyResult
```typescript
interface StrategyResult {
  plan: StrategyPlan;
  predictedFinishTime: number;
  predictedPosition: number;
  timeGain: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
}
```

### StrategyComparison
```typescript
interface StrategyComparison {
  baseline: StrategyResult;
  alternatives: StrategyResult[];
}
```

## Tire Compound Colors

The components use F1-standard tire compound colors:
- **Soft**: Red (#FF0000)
- **Medium**: Yellow (#FFD700)
- **Hard**: White (#FFFFFF)
- **Intermediate**: Green (#00FF00)
- **Wet**: Blue (#0000FF)

## Requirements Validation

These components satisfy the following requirements from the design document:

- **Requirement 5.1**: Strategy simulation with tire degradation and pit stop windows
- **Requirement 5.4**: Display strategy simulations with visual timeline representations
- **Requirement 5.5**: Safety car periods and weather conditions visualization
- **Requirement 5.3**: Alternative strategy comparison with time gains/losses
- **Requirement 5.4**: Confidence intervals and risk assessment

## Testing

Both components have comprehensive unit tests covering:
- Basic rendering
- Props handling
- Multiple scenarios (single/multiple pit stops, alternatives)
- Edge cases (empty data, custom heights)
- Data display verification

Run tests with:
```bash
npm test -- src/components/StrategyTimeline.test.tsx src/components/StrategyComparison.test.tsx
```
