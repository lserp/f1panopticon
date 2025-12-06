import React from 'react';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import type { StrategyPlan, PositionChange, SafetyCarPeriod, WeatherCondition } from '../types';

export interface StrategyTimelineProps {
  strategyPlan: StrategyPlan;
  positionChanges?: PositionChange[];
  safetyCarPeriods?: SafetyCarPeriod[];
  weatherConditions?: WeatherCondition[];
  totalLaps: number;
  driverId?: string;
  height?: number;
}

// Tire compound colors matching F1 standards
const TIRE_COLORS: Record<string, string> = {
  soft: '#FF0000',
  medium: '#FFD700',
  hard: '#FFFFFF',
  intermediate: '#00FF00',
  wet: '#0000FF',
  unknown: '#808080',
};

interface TimelineDataPoint {
  lap: number;
  position?: number;
  tireCompound?: string;
  isPitStop?: boolean;
  pitStopDuration?: number;
  isSafetyCar?: boolean;
  safetyCarType?: string;
  weatherCondition?: string;
  rainfall?: boolean;
}

export const StrategyTimeline: React.FC<StrategyTimelineProps> = ({
  strategyPlan,
  positionChanges = [],
  safetyCarPeriods = [],
  weatherConditions = [],
  totalLaps,
  height = 400,
}) => {
  // Build timeline data by combining all information
  const timelineData: TimelineDataPoint[] = React.useMemo(() => {
    const data: TimelineDataPoint[] = [];

    for (let lap = 1; lap <= totalLaps; lap++) {
      const dataPoint: TimelineDataPoint = { lap };

      // Add position data
      const positionChange = positionChanges.find((pc) => pc.lap === lap);
      if (positionChange) {
        dataPoint.position = positionChange.position;
      }

      // Add tire compound for this lap
      const currentStint = strategyPlan.tireAllocation.find(
        (stint) => lap >= stint.startLap && lap <= stint.endLap
      );
      if (currentStint) {
        dataPoint.tireCompound = currentStint.compound;
      }

      // Mark pit stops
      const pitStop = strategyPlan.pitStops.find((ps) => ps.lap === lap);
      if (pitStop) {
        dataPoint.isPitStop = true;
        dataPoint.pitStopDuration = pitStop.duration;
      }

      // Mark safety car periods
      const safetyCar = safetyCarPeriods.find((sc) => lap >= sc.startLap && lap <= sc.endLap);
      if (safetyCar) {
        dataPoint.isSafetyCar = true;
        dataPoint.safetyCarType = safetyCar.type;
      }

      // Add weather conditions
      const weather = weatherConditions.find((w) => w.lap === lap);
      if (weather) {
        dataPoint.weatherCondition = weather.condition;
        dataPoint.rainfall = weather.rainfall;
      }

      data.push(dataPoint);
    }

    return data;
  }, [strategyPlan, positionChanges, safetyCarPeriods, weatherConditions, totalLaps]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as TimelineDataPoint;
      return (
        <div
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #ccc',
            padding: '10px',
            borderRadius: '4px',
          }}
        >
          <p style={{ margin: 0, fontWeight: 'bold' }}>Lap {data.lap}</p>
          {data.position && <p style={{ margin: '4px 0' }}>Position: P{data.position}</p>}
          {data.tireCompound && (
            <p style={{ margin: '4px 0' }}>
              Tire:{' '}
              <span
                style={{
                  color: TIRE_COLORS[data.tireCompound.toLowerCase()] || TIRE_COLORS.unknown,
                  fontWeight: 'bold',
                }}
              >
                {data.tireCompound.toUpperCase()}
              </span>
            </p>
          )}
          {data.isPitStop && (
            <p style={{ margin: '4px 0', color: '#ff6b6b' }}>
              PIT STOP ({data.pitStopDuration?.toFixed(1)}s)
            </p>
          )}
          {data.isSafetyCar && (
            <p style={{ margin: '4px 0', color: '#ffa500' }}>
              {data.safetyCarType === 'virtual_safety_car' ? 'VSC' : 'SAFETY CAR'}
            </p>
          )}
          {data.weatherCondition && (
            <p style={{ margin: '4px 0' }}>
              Weather: {data.weatherCondition}
              {data.rainfall && ' 🌧️'}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Render tire stint bars
  const renderTireStints = () => {
    return strategyPlan.tireAllocation.map((stint, index) => {
      const color = TIRE_COLORS[stint.compound.toLowerCase()] || TIRE_COLORS.unknown;
      const startX = stint.startLap;
      const endX = stint.endLap;

      return (
        <ReferenceArea
          key={`stint-${index}`}
          x1={startX}
          x2={endX}
          y1={0}
          y2={25}
          fill={color}
          fillOpacity={0.3}
          stroke={color}
          strokeWidth={2}
          label={{
            value: stint.compound.toUpperCase(),
            position: 'center',
            fill: '#000',
            fontSize: 12,
            fontWeight: 'bold',
          }}
        />
      );
    });
  };

  // Render safety car periods
  const renderSafetyCarPeriods = () => {
    return safetyCarPeriods.map((period, index) => (
      <ReferenceArea
        key={`sc-${index}`}
        x1={period.startLap}
        x2={period.endLap}
        y1={0}
        y2={25}
        fill="#ffa500"
        fillOpacity={0.2}
        stroke="#ffa500"
        strokeWidth={1}
        strokeDasharray="3 3"
      />
    ));
  };

  // Render pit stop markers
  const renderPitStops = () => {
    return strategyPlan.pitStops.map((pitStop, index) => (
      <ReferenceLine
        key={`pit-${index}`}
        x={pitStop.lap}
        stroke="#ff6b6b"
        strokeWidth={3}
        strokeDasharray="5 5"
        label={{
          value: 'PIT',
          position: 'top',
          fill: '#ff6b6b',
          fontSize: 10,
          fontWeight: 'bold',
        }}
      />
    ));
  };

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={timelineData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="lap"
            label={{ value: 'Lap', position: 'insideBottom', offset: -10 }}
            type="number"
            domain={[1, totalLaps]}
          />
          <YAxis
            yAxisId="position"
            label={{ value: 'Position', angle: -90, position: 'insideLeft' }}
            reversed
            domain={[1, 20]}
            ticks={[1, 5, 10, 15, 20]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />

          {/* Render tire stints as background */}
          {renderTireStints()}

          {/* Render safety car periods */}
          {renderSafetyCarPeriods()}

          {/* Render pit stop markers */}
          {renderPitStops()}

          {/* Position line */}
          {positionChanges.length > 0 && (
            <Line
              yAxisId="position"
              type="monotone"
              dataKey="position"
              stroke="#8884d8"
              strokeWidth={2}
              dot={{ r: 4 }}
              name="Position"
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>

      {/* Tire compound legend */}
      <div style={{ marginTop: '10px', display: 'flex', gap: '15px', justifyContent: 'center' }}>
        {Object.entries(TIRE_COLORS).map(([compound, color]) => (
          <div key={compound} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div
              style={{
                width: '20px',
                height: '20px',
                backgroundColor: color,
                border: '1px solid #000',
              }}
            />
            <span style={{ fontSize: '12px', textTransform: 'capitalize' }}>{compound}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
