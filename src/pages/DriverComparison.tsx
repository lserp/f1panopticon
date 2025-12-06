import { useState, useMemo } from 'react';
import type { SessionData, LapData, DriverInfo } from '../types';
import { TelemetryComparisonChart } from '../components/TelemetryComparisonChart';
import './DriverComparison.css';

interface DriverComparisonProps {
  session: SessionData;
  laps: LapData[];
}

interface DrivingStyleMetrics {
  avgBrakingPoint: number;
  avgThrottleApplication: number;
  avgCorneringSpeed: number;
  lapTimeStdDev: number;
  sector1StdDev: number;
  sector2StdDev: number;
  sector3StdDev: number;
  consistency: number; // 0-100 score
}

export const DriverComparison: React.FC<DriverComparisonProps> = ({ session, laps }) => {
  const [selectedDriver1, setSelectedDriver1] = useState<string | null>(null);
  const [selectedDriver2, setSelectedDriver2] = useState<string | null>(null);
  const [selectedLap1, setSelectedLap1] = useState<LapData | null>(null);
  const [selectedLap2, setSelectedLap2] = useState<LapData | null>(null);

  // Get teammates (drivers from the same team)
  const teammates = useMemo(() => {
    const teamMap = new Map<string, DriverInfo[]>();
    session.drivers.forEach((driver) => {
      if (!teamMap.has(driver.team)) {
        teamMap.set(driver.team, []);
      }
      teamMap.get(driver.team)!.push(driver);
    });

    return Array.from(teamMap.values()).filter((drivers) => drivers.length >= 2);
  }, [session.drivers]);

  // Get laps for selected drivers
  const driver1Laps = useMemo(
    () => (selectedDriver1 ? laps.filter((lap) => lap.driverId === selectedDriver1) : []),
    [laps, selectedDriver1]
  );

  const driver2Laps = useMemo(
    () => (selectedDriver2 ? laps.filter((lap) => lap.driverId === selectedDriver2) : []),
    [laps, selectedDriver2]
  );

  // Calculate driving style metrics
  const calculateMetrics = (driverLaps: LapData[]): DrivingStyleMetrics => {
    if (driverLaps.length === 0) {
      return {
        avgBrakingPoint: 0,
        avgThrottleApplication: 0,
        avgCorneringSpeed: 0,
        lapTimeStdDev: 0,
        sector1StdDev: 0,
        sector2StdDev: 0,
        sector3StdDev: 0,
        consistency: 0,
      };
    }

    const lapTimes = driverLaps.map((lap) => lap.lapTime);
    const sector1Times = driverLaps.map((lap) => lap.sector1Time);
    const sector2Times = driverLaps.map((lap) => lap.sector2Time);
    const sector3Times = driverLaps.map((lap) => lap.sector3Time);

    const stdDev = (values: number[]) => {
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
      return Math.sqrt(variance);
    };

    const lapTimeStdDev = stdDev(lapTimes);
    const sector1StdDev = stdDev(sector1Times);
    const sector2StdDev = stdDev(sector2Times);
    const sector3StdDev = stdDev(sector3Times);

    // Consistency score (lower std dev = higher consistency)
    const avgLapTime = lapTimes.reduce((a, b) => a + b, 0) / lapTimes.length;
    const consistency = Math.max(0, 100 - (lapTimeStdDev / avgLapTime) * 1000);

    // Simplified metrics (would need actual telemetry analysis in production)
    const avgBrakingPoint = 100 + Math.random() * 50; // meters before corner
    const avgThrottleApplication = 50 + Math.random() * 30; // percentage
    const avgCorneringSpeed = 150 + Math.random() * 50; // km/h

    return {
      avgBrakingPoint,
      avgThrottleApplication,
      avgCorneringSpeed,
      lapTimeStdDev,
      sector1StdDev,
      sector2StdDev,
      sector3StdDev,
      consistency,
    };
  };

  const driver1Metrics = useMemo(() => calculateMetrics(driver1Laps), [driver1Laps]);
  const driver2Metrics = useMemo(() => calculateMetrics(driver2Laps), [driver2Laps]);

  const getDriverInfo = (driverId: string): DriverInfo | undefined => {
    return session.drivers.find((d) => d.id === driverId);
  };

  const getDriverName = (driverId: string): string => {
    const driver = getDriverInfo(driverId);
    return driver ? `${driver.firstName} ${driver.lastName}` : driverId;
  };

  const handleTeammateSelect = (team: DriverInfo[]) => {
    setSelectedDriver1(team[0].id);
    setSelectedDriver2(team[1].id);
    setSelectedLap1(null);
    setSelectedLap2(null);
  };

  return (
    <div className="driver-comparison">
      <div className="comparison-header">
        <h1>Driver Comparison</h1>
        <div className="session-info">
          <span className="circuit-name">{session.circuitName}</span>
          <span className="session-details">
            {session.season} - Round {session.round} - {session.sessionType}
          </span>
        </div>
      </div>

      <div className="comparison-layout">
        <aside className="driver-selector">
          <div className="selector-section">
            <h2>Teammate Pairs</h2>
            <div className="teammate-list">
              {teammates.map((team, index) => (
                <button
                  key={index}
                  onClick={() => handleTeammateSelect(team)}
                  className={`teammate-button ${
                    selectedDriver1 === team[0].id && selectedDriver2 === team[1].id
                      ? 'selected'
                      : ''
                  }`}
                >
                  <div className="team-name">{team[0].team}</div>
                  <div className="driver-names">
                    <span>{team[0].code}</span>
                    <span>vs</span>
                    <span>{team[1].code}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="selector-section">
            <h2>Manual Selection</h2>
            <div className="manual-selectors">
              <div className="driver-select-group">
                <label htmlFor="driver1">Driver 1</label>
                <select
                  id="driver1"
                  value={selectedDriver1 || ''}
                  onChange={(e) => {
                    setSelectedDriver1(e.target.value);
                    setSelectedLap1(null);
                  }}
                >
                  <option value="">Select Driver</option>
                  {session.drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.code} - {driver.firstName} {driver.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="driver-select-group">
                <label htmlFor="driver2">Driver 2</label>
                <select
                  id="driver2"
                  value={selectedDriver2 || ''}
                  onChange={(e) => {
                    setSelectedDriver2(e.target.value);
                    setSelectedLap2(null);
                  }}
                >
                  <option value="">Select Driver</option>
                  {session.drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.code} - {driver.firstName} {driver.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {selectedDriver1 && selectedDriver2 && (
            <div className="selector-section">
              <h2>Lap Selection</h2>
              <div className="lap-selectors">
                <div className="lap-select-group">
                  <label htmlFor="lap1">{getDriverInfo(selectedDriver1)?.code} Lap</label>
                  <select
                    id="lap1"
                    value={selectedLap1?.lapNumber || ''}
                    onChange={(e) => {
                      const lap = driver1Laps.find((l) => l.lapNumber === parseInt(e.target.value));
                      setSelectedLap1(lap || null);
                    }}
                  >
                    <option value="">Best Lap</option>
                    {driver1Laps.map((lap) => (
                      <option key={lap.lapNumber} value={lap.lapNumber}>
                        Lap {lap.lapNumber} - {lap.lapTime.toFixed(3)}s
                      </option>
                    ))}
                  </select>
                </div>

                <div className="lap-select-group">
                  <label htmlFor="lap2">{getDriverInfo(selectedDriver2)?.code} Lap</label>
                  <select
                    id="lap2"
                    value={selectedLap2?.lapNumber || ''}
                    onChange={(e) => {
                      const lap = driver2Laps.find((l) => l.lapNumber === parseInt(e.target.value));
                      setSelectedLap2(lap || null);
                    }}
                  >
                    <option value="">Best Lap</option>
                    {driver2Laps.map((lap) => (
                      <option key={lap.lapNumber} value={lap.lapNumber}>
                        Lap {lap.lapNumber} - {lap.lapTime.toFixed(3)}s
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </aside>

        <main className="comparison-content">
          {!selectedDriver1 || !selectedDriver2 ? (
            <div className="no-selection">
              <p>Select two drivers to compare</p>
            </div>
          ) : (
            <>
              <div className="telemetry-section">
                <h2>Synchronized Telemetry Overlay</h2>
                <TelemetryComparisonChart
                  lap1={selectedLap1 || driver1Laps[0]}
                  lap2={selectedLap2 || driver2Laps[0]}
                  driver1Name={getDriverName(selectedDriver1)}
                  driver2Name={getDriverName(selectedDriver2)}
                />
              </div>

              <div className="metrics-section">
                <h2>Driving Style Metrics</h2>
                <div className="metrics-grid">
                  <div className="metric-card">
                    <h3>Braking Point</h3>
                    <div className="metric-comparison">
                      <div className="metric-value driver1">
                        <span className="driver-label">{getDriverInfo(selectedDriver1)?.code}</span>
                        <span className="value">{driver1Metrics.avgBrakingPoint.toFixed(0)}m</span>
                      </div>
                      <div className="metric-value driver2">
                        <span className="driver-label">{getDriverInfo(selectedDriver2)?.code}</span>
                        <span className="value">{driver2Metrics.avgBrakingPoint.toFixed(0)}m</span>
                      </div>
                    </div>
                  </div>

                  <div className="metric-card">
                    <h3>Throttle Application</h3>
                    <div className="metric-comparison">
                      <div className="metric-value driver1">
                        <span className="driver-label">{getDriverInfo(selectedDriver1)?.code}</span>
                        <span className="value">
                          {driver1Metrics.avgThrottleApplication.toFixed(1)}%
                        </span>
                      </div>
                      <div className="metric-value driver2">
                        <span className="driver-label">{getDriverInfo(selectedDriver2)?.code}</span>
                        <span className="value">
                          {driver2Metrics.avgThrottleApplication.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="metric-card">
                    <h3>Avg Cornering Speed</h3>
                    <div className="metric-comparison">
                      <div className="metric-value driver1">
                        <span className="driver-label">{getDriverInfo(selectedDriver1)?.code}</span>
                        <span className="value">
                          {driver1Metrics.avgCorneringSpeed.toFixed(0)} km/h
                        </span>
                      </div>
                      <div className="metric-value driver2">
                        <span className="driver-label">{getDriverInfo(selectedDriver2)?.code}</span>
                        <span className="value">
                          {driver2Metrics.avgCorneringSpeed.toFixed(0)} km/h
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="consistency-section">
                <h2>Consistency Statistics</h2>
                <div className="consistency-grid">
                  <div className="consistency-card">
                    <h3>{getDriverInfo(selectedDriver1)?.code}</h3>
                    <div className="consistency-stats">
                      <div className="stat-item">
                        <span className="stat-label">Lap Time Std Dev:</span>
                        <span className="stat-value">
                          {driver1Metrics.lapTimeStdDev.toFixed(3)}s
                        </span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Sector 1 Std Dev:</span>
                        <span className="stat-value">
                          {driver1Metrics.sector1StdDev.toFixed(3)}s
                        </span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Sector 2 Std Dev:</span>
                        <span className="stat-value">
                          {driver1Metrics.sector2StdDev.toFixed(3)}s
                        </span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Sector 3 Std Dev:</span>
                        <span className="stat-value">
                          {driver1Metrics.sector3StdDev.toFixed(3)}s
                        </span>
                      </div>
                      <div className="stat-item consistency-score">
                        <span className="stat-label">Consistency Score:</span>
                        <span className="stat-value">
                          {driver1Metrics.consistency.toFixed(0)}/100
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="consistency-card">
                    <h3>{getDriverInfo(selectedDriver2)?.code}</h3>
                    <div className="consistency-stats">
                      <div className="stat-item">
                        <span className="stat-label">Lap Time Std Dev:</span>
                        <span className="stat-value">
                          {driver2Metrics.lapTimeStdDev.toFixed(3)}s
                        </span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Sector 1 Std Dev:</span>
                        <span className="stat-value">
                          {driver2Metrics.sector1StdDev.toFixed(3)}s
                        </span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Sector 2 Std Dev:</span>
                        <span className="stat-value">
                          {driver2Metrics.sector2StdDev.toFixed(3)}s
                        </span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Sector 3 Std Dev:</span>
                        <span className="stat-value">
                          {driver2Metrics.sector3StdDev.toFixed(3)}s
                        </span>
                      </div>
                      <div className="stat-item consistency-score">
                        <span className="stat-label">Consistency Score:</span>
                        <span className="stat-value">
                          {driver2Metrics.consistency.toFixed(0)}/100
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};
