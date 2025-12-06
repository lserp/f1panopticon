import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StrategyComparison } from './StrategyComparison';
import type { StrategyComparison as StrategyComparisonType, StrategyResult } from '../types';

describe('StrategyComparison', () => {
  const mockBaseline: StrategyResult = {
    plan: {
      pitStops: [
        {
          lap: 20,
          duration: 2.5,
          tireCompoundIn: 'soft',
          tireCompoundOut: 'medium',
          reason: 'planned',
        },
      ],
      tireAllocation: [
        { startLap: 1, endLap: 20, compound: 'soft', expectedLaps: 20 },
        { startLap: 21, endLap: 50, compound: 'medium', expectedLaps: 30 },
      ],
      estimatedFinishTime: 5400,
      riskLevel: 'medium',
    },
    predictedFinishTime: 5400,
    predictedPosition: 5,
    timeGain: 0,
    confidenceInterval: {
      lower: 5395,
      upper: 5405,
    },
  };

  const mockAlternative1: StrategyResult = {
    plan: {
      pitStops: [
        {
          lap: 15,
          duration: 2.3,
          tireCompoundIn: 'soft',
          tireCompoundOut: 'hard',
          reason: 'planned',
        },
      ],
      tireAllocation: [
        { startLap: 1, endLap: 15, compound: 'soft', expectedLaps: 15 },
        { startLap: 16, endLap: 50, compound: 'hard', expectedLaps: 35 },
      ],
      estimatedFinishTime: 5390,
      riskLevel: 'low',
    },
    predictedFinishTime: 5390,
    predictedPosition: 4,
    timeGain: 10,
    confidenceInterval: {
      lower: 5385,
      upper: 5395,
    },
  };

  const mockAlternative2: StrategyResult = {
    plan: {
      pitStops: [
        {
          lap: 25,
          duration: 2.6,
          tireCompoundIn: 'soft',
          tireCompoundOut: 'soft',
          reason: 'planned',
        },
      ],
      tireAllocation: [
        { startLap: 1, endLap: 25, compound: 'soft', expectedLaps: 25 },
        { startLap: 26, endLap: 50, compound: 'soft', expectedLaps: 25 },
      ],
      estimatedFinishTime: 5410,
      riskLevel: 'high',
    },
    predictedFinishTime: 5410,
    predictedPosition: 6,
    timeGain: -10,
    confidenceInterval: {
      lower: 5400,
      upper: 5420,
    },
  };

  const mockComparison: StrategyComparisonType = {
    baseline: mockBaseline,
    alternatives: [mockAlternative1, mockAlternative2],
  };

  it('renders without crashing', () => {
    render(<StrategyComparison comparison={mockComparison} totalLaps={50} />);
  });

  it('displays comparison title', () => {
    render(<StrategyComparison comparison={mockComparison} totalLaps={50} />);

    expect(screen.getByText('Strategy Time Gain Comparison')).toBeInTheDocument();
    expect(screen.getByText('Strategy Timeline Comparison')).toBeInTheDocument();
  });

  it('displays baseline strategy', () => {
    render(<StrategyComparison comparison={mockComparison} totalLaps={50} />);

    expect(screen.getByText('Baseline Strategy')).toBeInTheDocument();
  });

  it('displays alternative strategies', () => {
    render(<StrategyComparison comparison={mockComparison} totalLaps={50} />);

    expect(screen.getByText('Alternative 1')).toBeInTheDocument();
    expect(screen.getByText('Alternative 2')).toBeInTheDocument();
  });

  it('displays time gain information', () => {
    render(<StrategyComparison comparison={mockComparison} totalLaps={50} />);

    // Check for time gain text in the strategy cards instead of chart legend
    expect(screen.getAllByText(/Time Gain:/i).length).toBeGreaterThan(0);
  });

  it('displays predicted positions', () => {
    render(<StrategyComparison comparison={mockComparison} totalLaps={50} />);

    // Check for position displays in the strategy cards
    const positionElements = screen.getAllByText(/P\d+/);
    expect(positionElements.length).toBeGreaterThan(0);
  });

  it('displays risk levels', () => {
    render(<StrategyComparison comparison={mockComparison} totalLaps={50} />);

    expect(screen.getByText('MEDIUM')).toBeInTheDocument();
    expect(screen.getByText('LOW')).toBeInTheDocument();
    expect(screen.getByText('HIGH')).toBeInTheDocument();
  });

  it('displays pit stop details', () => {
    render(<StrategyComparison comparison={mockComparison} totalLaps={50} />);

    const pitStopHeaders = screen.getAllByText('Pit Stops:');
    expect(pitStopHeaders.length).toBe(3); // baseline + 2 alternatives
  });

  it('handles single alternative', () => {
    const singleAltComparison: StrategyComparisonType = {
      baseline: mockBaseline,
      alternatives: [mockAlternative1],
    };

    render(<StrategyComparison comparison={singleAltComparison} totalLaps={50} />);

    expect(screen.getByText('Alternative 1')).toBeInTheDocument();
    expect(screen.queryByText('Alternative 2')).not.toBeInTheDocument();
  });

  it('renders with custom height', () => {
    render(<StrategyComparison comparison={mockComparison} totalLaps={50} height={800} />);
  });

  it('displays confidence intervals', () => {
    render(<StrategyComparison comparison={mockComparison} totalLaps={50} />);

    // Check for CI text
    const ciElements = screen.getAllByText(/95% CI:/);
    expect(ciElements.length).toBeGreaterThan(0);
  });
});
