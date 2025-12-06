import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ErrorBar,
} from 'recharts';
import type { StrategyComparison as StrategyComparisonType } from '../types';
import { StrategyTimeline } from './StrategyTimeline';

export interface StrategyComparisonProps {
  comparison: StrategyComparisonType;
  totalLaps: number;
  driverId?: string;
  height?: number;
}

interface ComparisonDataPoint {
  name: string;
  timeGain: number;
  predictedFinishTime: number;
  predictedPosition: number;
  confidenceLower: number;
  confidenceUpper: number;
  errorRange: [number, number];
}

export const StrategyComparison: React.FC<StrategyComparisonProps> = ({
  comparison,
  totalLaps,
  driverId,
  height = 600,
}) => {
  // Prepare comparison data
  const comparisonData: ComparisonDataPoint[] = React.useMemo(() => {
    const data: ComparisonDataPoint[] = [];

    // Add baseline
    data.push({
      name: 'Baseline',
      timeGain: 0,
      predictedFinishTime: comparison.baseline.predictedFinishTime,
      predictedPosition: comparison.baseline.predictedPosition,
      confidenceLower: comparison.baseline.confidenceInterval.lower,
      confidenceUpper: comparison.baseline.confidenceInterval.upper,
      errorRange: [
        comparison.baseline.confidenceInterval.lower - comparison.baseline.predictedFinishTime,
        comparison.baseline.confidenceInterval.upper - comparison.baseline.predictedFinishTime,
      ],
    });

    // Add alternatives
    comparison.alternatives.forEach((alt, index) => {
      data.push({
        name: `Alternative ${index + 1}`,
        timeGain: alt.timeGain,
        predictedFinishTime: alt.predictedFinishTime,
        predictedPosition: alt.predictedPosition,
        confidenceLower: alt.confidenceInterval.lower,
        confidenceUpper: alt.confidenceInterval.upper,
        errorRange: [
          alt.confidenceInterval.lower - alt.predictedFinishTime,
          alt.confidenceInterval.upper - alt.predictedFinishTime,
        ],
      });
    });

    return data;
  }, [comparison]);

  // Custom tooltip for time gain chart
  const TimeGainTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as ComparisonDataPoint;
      return (
        <div
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #ccc',
            padding: '10px',
            borderRadius: '4px',
          }}
        >
          <p style={{ margin: 0, fontWeight: 'bold' }}>{data.name}</p>
          <p style={{ margin: '4px 0' }}>
            Time Gain: {data.timeGain >= 0 ? '+' : ''}
            {data.timeGain.toFixed(2)}s
          </p>
          <p style={{ margin: '4px 0' }}>Finish Time: {data.predictedFinishTime.toFixed(2)}s</p>
          <p style={{ margin: '4px 0' }}>Predicted Position: P{data.predictedPosition}</p>
          <p style={{ margin: '4px 0', fontSize: '11px', color: '#666' }}>
            95% CI: [{data.confidenceLower.toFixed(2)}s, {data.confidenceUpper.toFixed(2)}s]
          </p>
        </div>
      );
    }
    return null;
  };

  // Get bar color based on time gain
  const getBarColor = (timeGain: number) => {
    if (timeGain > 0) return '#4caf50'; // Green for positive gain
    if (timeGain < 0) return '#f44336'; // Red for negative gain
    return '#9e9e9e'; // Gray for baseline
  };

  // All strategies to display (baseline + alternatives)
  const allStrategies = [comparison.baseline, ...comparison.alternatives];

  return (
    <div style={{ width: '100%' }}>
      {/* Time Gain Comparison Chart */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ textAlign: 'center', marginBottom: '10px' }}>Strategy Time Gain Comparison</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis label={{ value: 'Time Gain (seconds)', angle: -90, position: 'insideLeft' }} />
            <Tooltip content={<TimeGainTooltip />} />
            <Legend />
            <Bar dataKey="timeGain" name="Time Gain" radius={[8, 8, 0, 0]}>
              {comparisonData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.timeGain)} />
              ))}
              <ErrorBar
                dataKey="errorRange"
                width={4}
                strokeWidth={2}
                stroke="#000"
                direction="y"
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Side-by-side Strategy Timelines */}
      <div style={{ marginTop: '30px' }}>
        <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>Strategy Timeline Comparison</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(allStrategies.length, 2)}, 1fr)`,
            gap: '20px',
          }}
        >
          {allStrategies.map((strategy, index) => (
            <div
              key={index}
              style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '15px',
                backgroundColor: '#f9f9f9',
              }}
            >
              <h4 style={{ marginTop: 0, marginBottom: '10px', textAlign: 'center' }}>
                {index === 0 ? 'Baseline Strategy' : `Alternative ${index}`}
              </h4>
              <div style={{ marginBottom: '10px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Predicted Finish:</span>
                  <strong>{strategy.predictedFinishTime.toFixed(2)}s</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Predicted Position:</span>
                  <strong>P{strategy.predictedPosition}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Time Gain:</span>
                  <strong
                    style={{
                      color: strategy.timeGain >= 0 ? '#4caf50' : '#f44336',
                    }}
                  >
                    {strategy.timeGain >= 0 ? '+' : ''}
                    {strategy.timeGain.toFixed(2)}s
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Risk Level:</span>
                  <strong
                    style={{
                      color:
                        strategy.plan.riskLevel === 'low'
                          ? '#4caf50'
                          : strategy.plan.riskLevel === 'medium'
                            ? '#ff9800'
                            : '#f44336',
                    }}
                  >
                    {strategy.plan.riskLevel.toUpperCase()}
                  </strong>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    color: '#666',
                  }}
                >
                  <span>95% CI:</span>
                  <span>
                    [{strategy.confidenceInterval.lower.toFixed(2)}s,{' '}
                    {strategy.confidenceInterval.upper.toFixed(2)}s]
                  </span>
                </div>
              </div>
              <StrategyTimeline
                strategyPlan={strategy.plan}
                totalLaps={totalLaps}
                driverId={driverId}
                height={height / 2}
              />
              <div style={{ marginTop: '10px', fontSize: '13px' }}>
                <strong>Pit Stops:</strong>
                <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                  {strategy.plan.pitStops.map((pit, pitIndex) => (
                    <li key={pitIndex}>
                      Lap {pit.lap}: {pit.tireCompoundIn} → {pit.tireCompoundOut} (
                      {pit.duration.toFixed(1)}s)
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
