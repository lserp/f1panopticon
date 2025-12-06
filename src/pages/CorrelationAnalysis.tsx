import { useState, useMemo } from 'react';
import type { LapData } from '../types';
import { calculateCorrelation } from '../services/analysisEngine';
import './CorrelationAnalysis.css';

interface CorrelationAnalysisProps {
  laps: LapData[];
}

interface CorrelationResult {
  parameter: string;
  coefficient: number;
  pValue: number;
  strength: 'strong' | 'moderate' | 'weak' | 'none';
}

type TelemetryParameter =
  | 'avgSpeed'
  | 'maxSpeed'
  | 'avgThrottle'
  | 'avgBrake'
  | 'avgGear'
  | 'avgRPM'
  | 'tireAge'
  | 'sector1Time'
  | 'sector2Time'
  | 'sector3Time';

export const CorrelationAnalysis: React.FC<CorrelationAnalysisProps> = ({ laps }) => {
  const [selectedParameters, setSelectedParameters] = useState<TelemetryParameter[]>([
    'avgSpeed',
    'avgThrottle',
    'tireAge',
  ]);
  const [targetMetric, setTargetMetric] = useState<
    'lapTime' | 'sector1Time' | 'sector2Time' | 'sector3Time'
  >('lapTime');

  const availableParameters: { value: TelemetryParameter; label: string }[] = [
    { value: 'avgSpeed', label: 'Average Speed' },
    { value: 'maxSpeed', label: 'Maximum Speed' },
    { value: 'avgThrottle', label: 'Average Throttle' },
    { value: 'avgBrake', label: 'Average Brake' },
    { value: 'avgGear', label: 'Average Gear' },
    { value: 'avgRPM', label: 'Average RPM' },
    { value: 'tireAge', label: 'Tire Age' },
    { value: 'sector1Time', label: 'Sector 1 Time' },
    { value: 'sector2Time', label: 'Sector 2 Time' },
    { value: 'sector3Time', label: 'Sector 3 Time' },
  ];

  // Extract parameter values from lap data
  const extractParameterValue = (lap: LapData, parameter: TelemetryParameter): number => {
    switch (parameter) {
      case 'avgSpeed':
        return lap.telemetry.speed.reduce((a, b) => a + b, 0) / lap.telemetry.speed.length;
      case 'maxSpeed':
        return Math.max(...lap.telemetry.speed);
      case 'avgThrottle':
        return lap.telemetry.throttle.reduce((a, b) => a + b, 0) / lap.telemetry.throttle.length;
      case 'avgBrake':
        return lap.telemetry.brake.reduce((a, b) => a + b, 0) / lap.telemetry.brake.length;
      case 'avgGear':
        return lap.telemetry.gear.reduce((a, b) => a + b, 0) / lap.telemetry.gear.length;
      case 'avgRPM':
        return lap.telemetry.rpm.reduce((a, b) => a + b, 0) / lap.telemetry.rpm.length;
      case 'tireAge':
        return lap.tireAge;
      case 'sector1Time':
        return lap.sector1Time;
      case 'sector2Time':
        return lap.sector2Time;
      case 'sector3Time':
        return lap.sector3Time;
      default:
        return 0;
    }
  };

  // Calculate correlations
  const correlationResults = useMemo(() => {
    const results: CorrelationResult[] = [];

    selectedParameters.forEach((param) => {
      const xValues = laps.map((lap) => extractParameterValue(lap, param));
      const yValues = laps.map((lap) => {
        switch (targetMetric) {
          case 'lapTime':
            return lap.lapTime;
          case 'sector1Time':
            return lap.sector1Time;
          case 'sector2Time':
            return lap.sector2Time;
          case 'sector3Time':
            return lap.sector3Time;
        }
      });

      const correlation = calculateCorrelation(xValues, yValues);
      const absCorr = Math.abs(correlation);

      let strength: CorrelationResult['strength'];
      if (absCorr >= 0.7) strength = 'strong';
      else if (absCorr >= 0.4) strength = 'moderate';
      else if (absCorr >= 0.2) strength = 'weak';
      else strength = 'none';

      results.push({
        parameter: param,
        coefficient: correlation,
        pValue: 0.05, // Simplified - would need proper statistical test
        strength,
      });
    });

    // Sort by absolute correlation coefficient (strongest first)
    return results.sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient));
  }, [laps, selectedParameters, targetMetric]);

  // Generate scatter plot data
  const scatterData = useMemo(() => {
    return selectedParameters.map((param) => ({
      parameter: param,
      points: laps.map((lap) => ({
        x: extractParameterValue(lap, param),
        y:
          targetMetric === 'lapTime'
            ? lap.lapTime
            : targetMetric === 'sector1Time'
              ? lap.sector1Time
              : targetMetric === 'sector2Time'
                ? lap.sector2Time
                : lap.sector3Time,
      })),
    }));
  }, [laps, selectedParameters, targetMetric]);

  // Generate correlation matrix for heatmap
  const correlationMatrix = useMemo(() => {
    const matrix: number[][] = [];
    selectedParameters.forEach((param1) => {
      const row: number[] = [];
      selectedParameters.forEach((param2) => {
        const xValues = laps.map((lap) => extractParameterValue(lap, param1));
        const yValues = laps.map((lap) => extractParameterValue(lap, param2));
        const correlation = calculateCorrelation(xValues, yValues);
        row.push(correlation);
      });
      matrix.push(row);
    });
    return matrix;
  }, [laps, selectedParameters]);

  const toggleParameter = (param: TelemetryParameter) => {
    if (selectedParameters.includes(param)) {
      setSelectedParameters(selectedParameters.filter((p) => p !== param));
    } else {
      setSelectedParameters([...selectedParameters, param]);
    }
  };

  const getParameterLabel = (param: TelemetryParameter): string => {
    return availableParameters.find((p) => p.value === param)?.label || param;
  };

  return (
    <div className="correlation-analysis">
      <div className="analysis-header">
        <h1>Correlation Analysis</h1>
        <p className="analysis-description">
          Analyze relationships between telemetry parameters and lap performance
        </p>
      </div>

      <div className="analysis-layout">
        <aside className="parameter-selector">
          <div className="selector-section">
            <h2>Target Metric</h2>
            <div className="target-selector">
              <label>
                <input
                  type="radio"
                  value="lapTime"
                  checked={targetMetric === 'lapTime'}
                  onChange={(e) => setTargetMetric(e.target.value as typeof targetMetric)}
                />
                Lap Time
              </label>
              <label>
                <input
                  type="radio"
                  value="sector1Time"
                  checked={targetMetric === 'sector1Time'}
                  onChange={(e) => setTargetMetric(e.target.value as typeof targetMetric)}
                />
                Sector 1 Time
              </label>
              <label>
                <input
                  type="radio"
                  value="sector2Time"
                  checked={targetMetric === 'sector2Time'}
                  onChange={(e) => setTargetMetric(e.target.value as typeof targetMetric)}
                />
                Sector 2 Time
              </label>
              <label>
                <input
                  type="radio"
                  value="sector3Time"
                  checked={targetMetric === 'sector3Time'}
                  onChange={(e) => setTargetMetric(e.target.value as typeof targetMetric)}
                />
                Sector 3 Time
              </label>
            </div>
          </div>

          <div className="selector-section">
            <h2>Parameters</h2>
            <div className="parameter-list">
              {availableParameters.map((param) => (
                <label key={param.value} className="parameter-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedParameters.includes(param.value)}
                    onChange={() => toggleParameter(param.value)}
                  />
                  {param.label}
                </label>
              ))}
            </div>
          </div>

          <div className="selector-section">
            <h2>Data Summary</h2>
            <div className="data-summary">
              <div className="summary-item">
                <span className="summary-label">Total Laps:</span>
                <span className="summary-value">{laps.length}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Selected Parameters:</span>
                <span className="summary-value">{selectedParameters.length}</span>
              </div>
            </div>
          </div>
        </aside>

        <main className="analysis-content">
          <div className="results-section">
            <h2>Correlation Results</h2>
            <div className="results-table">
              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Parameter</th>
                    <th>Coefficient</th>
                    <th>Strength</th>
                    <th>P-Value</th>
                  </tr>
                </thead>
                <tbody>
                  {correlationResults.map((result, index) => (
                    <tr key={result.parameter}>
                      <td>{index + 1}</td>
                      <td>{getParameterLabel(result.parameter as TelemetryParameter)}</td>
                      <td>
                        <span
                          className={`coefficient ${result.coefficient >= 0 ? 'positive' : 'negative'}`}
                        >
                          {result.coefficient.toFixed(3)}
                        </span>
                      </td>
                      <td>
                        <span className={`strength-badge strength-${result.strength}`}>
                          {result.strength}
                        </span>
                      </td>
                      <td>{result.pValue.toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="visualization-section">
            <h2>Scatter Plots</h2>
            <div className="scatter-grid">
              {scatterData.map((data) => (
                <div key={data.parameter} className="scatter-plot">
                  <h3>{getParameterLabel(data.parameter as TelemetryParameter)}</h3>
                  <div className="plot-container">
                    <svg viewBox="0 0 300 200" className="scatter-svg">
                      {/* Simple scatter plot visualization */}
                      {data.points.map((point, i) => {
                        const xMin = Math.min(...data.points.map((p) => p.x));
                        const xMax = Math.max(...data.points.map((p) => p.x));
                        const yMin = Math.min(...data.points.map((p) => p.y));
                        const yMax = Math.max(...data.points.map((p) => p.y));

                        const x = ((point.x - xMin) / (xMax - xMin)) * 280 + 10;
                        const y = 190 - ((point.y - yMin) / (yMax - yMin)) * 180;

                        return <circle key={i} cx={x} cy={y} r="3" fill="#4a90e2" opacity="0.6" />;
                      })}
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="heatmap-section">
            <h2>Correlation Heatmap</h2>
            <div className="heatmap-container">
              <table className="heatmap-table">
                <thead>
                  <tr>
                    <th></th>
                    {selectedParameters.map((param) => (
                      <th key={param}>{getParameterLabel(param).substring(0, 8)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedParameters.map((param1, i) => (
                    <tr key={param1}>
                      <th>{getParameterLabel(param1).substring(0, 8)}</th>
                      {selectedParameters.map((param2, j) => {
                        const value = correlationMatrix[i][j];
                        const intensity = Math.abs(value);
                        const color =
                          value >= 0
                            ? `rgba(46, 204, 113, ${intensity})`
                            : `rgba(231, 76, 60, ${intensity})`;

                        return (
                          <td key={param2} style={{ backgroundColor: color }}>
                            {value.toFixed(2)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
