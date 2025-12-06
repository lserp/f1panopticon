import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StrategyTimeline } from './StrategyTimeline';
import type { StrategyPlan, PositionChange, SafetyCarPeriod, WeatherCondition } from '../types';

describe('StrategyTimeline', () => {
  const mockStrategyPlan: StrategyPlan = {
    pitStops: [
      {
        lap: 15,
        duration: 2.3,
        tireCompoundIn: 'soft',
        tireCompoundOut: 'medium',
        reason: 'planned',
      },
      {
        lap: 35,
        duration: 2.5,
        tireCompoundIn: 'medium',
        tireCompoundOut: 'hard',
        reason: 'planned',
      },
    ],
    tireAllocation: [
      { startLap: 1, endLap: 15, compound: 'soft', expectedLaps: 15 },
      { startLap: 16, endLap: 35, compound: 'medium', expectedLaps: 20 },
      { startLap: 36, endLap: 50, compound: 'hard', expectedLaps: 15 },
    ],
    estimatedFinishTime: 5400,
    riskLevel: 'medium',
  };

  const mockPositionChanges: PositionChange[] = [
    { lap: 1, position: 5, driverId: 'VER' },
    { lap: 10, position: 4, driverId: 'VER' },
    { lap: 20, position: 3, driverId: 'VER' },
  ];

  const mockSafetyCarPeriods: SafetyCarPeriod[] = [
    { startLap: 25, endLap: 28, type: 'safety_car' },
  ];

  const mockWeatherConditions: WeatherCondition[] = [
    { lap: 1, condition: 'dry', rainfall: false, temperature: 25 },
    { lap: 30, condition: 'wet', rainfall: true, temperature: 22 },
  ];

  it('renders without crashing', () => {
    render(<StrategyTimeline strategyPlan={mockStrategyPlan} totalLaps={50} />);
  });

  it('displays tire compound legend', () => {
    render(<StrategyTimeline strategyPlan={mockStrategyPlan} totalLaps={50} />);

    expect(screen.getByText('soft')).toBeInTheDocument();
    expect(screen.getByText('medium')).toBeInTheDocument();
    expect(screen.getByText('hard')).toBeInTheDocument();
  });

  it('renders with position changes', () => {
    const { container } = render(
      <StrategyTimeline
        strategyPlan={mockStrategyPlan}
        positionChanges={mockPositionChanges}
        totalLaps={50}
      />
    );

    // Just verify it renders without crashing when position changes are provided
    expect(container).toBeTruthy();
  });

  it('renders with safety car periods', () => {
    render(
      <StrategyTimeline
        strategyPlan={mockStrategyPlan}
        safetyCarPeriods={mockSafetyCarPeriods}
        totalLaps={50}
      />
    );
  });

  it('renders with weather conditions', () => {
    render(
      <StrategyTimeline
        strategyPlan={mockStrategyPlan}
        weatherConditions={mockWeatherConditions}
        totalLaps={50}
      />
    );
  });

  it('renders with custom height', () => {
    const { container } = render(
      <StrategyTimeline strategyPlan={mockStrategyPlan} totalLaps={50} height={600} />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.height).toBe('600px');
  });

  it('handles empty position changes', () => {
    render(
      <StrategyTimeline strategyPlan={mockStrategyPlan} positionChanges={[]} totalLaps={50} />
    );
  });

  it('handles multiple pit stops', () => {
    const planWithMultiplePits: StrategyPlan = {
      ...mockStrategyPlan,
      pitStops: [
        {
          lap: 10,
          duration: 2.2,
          tireCompoundIn: 'soft',
          tireCompoundOut: 'medium',
          reason: 'planned',
        },
        {
          lap: 20,
          duration: 2.4,
          tireCompoundIn: 'medium',
          tireCompoundOut: 'hard',
          reason: 'planned',
        },
        {
          lap: 30,
          duration: 2.3,
          tireCompoundIn: 'hard',
          tireCompoundOut: 'soft',
          reason: 'planned',
        },
      ],
    };

    render(<StrategyTimeline strategyPlan={planWithMultiplePits} totalLaps={50} />);
  });
});
