import { useState } from 'react';
import type { LapData, SessionData } from '../types';
import { TelemetryChart } from '../components/TelemetryChart';
import { TrackMap } from '../components/TrackMap';
import './TelemetryAnalysis.css';

interface TelemetryAnalysisProps {
  session: SessionData;
  availableLaps: LapData[];
}

export const TelemetryAnalysis: React.FC<TelemetryAnalysisProps> = ({ session, availableLaps }) => {
  const [selectedLaps, setSelectedLaps] = useState<LapData[]>([]);
  const [currentDistance, setCurrentDistance] = useState<number>(0);
  const [activeChannel, setActiveChannel] = useState<'speed' | 'throttle' | 'brake' | 'gear'>(
    'speed'
  );

  // Limit to 4 laps for comparison
  const maxLaps = 4;

  const handleLapSelect = (lap: LapData) => {
    if (selectedLaps.find((l) => l.lapNumber === lap.lapNumber)) {
      // Remove lap if already selected
      setSelectedLaps(selectedLaps.filter((l) => l.lapNumber !== lap.lapNumber));
    } else if (selectedLaps.length < maxLaps) {
      // Add lap if under limit
      setSelectedLaps([...selectedLaps, lap]);
    }
  };

  const handleClearSelection = () => {
    setSelectedLaps([]);
  };

  const handleDistanceChange = (distance: number) => {
    setCurrentDistance(distance);
  };

  // Group laps by driver for easier selection
  const lapsByDriver = availableLaps.reduce(
    (acc, lap) => {
      if (!acc[lap.driverId]) {
        acc[lap.driverId] = [];
      }
      acc[lap.driverId].push(lap);
      return acc;
    },
    {} as Record<string, LapData[]>
  );

  const getDriverName = (driverId: string) => {
    const driver = session.drivers.find((d) => d.id === driverId);
    return driver ? `${driver.firstName} ${driver.lastName}` : driverId;
  };

  const getDriverCode = (driverId: string) => {
    const driver = session.drivers.find((d) => d.id === driverId);
    return driver?.code || '???';
  };

  return (
    <div className="telemetry-analysis">
      <div className="analysis-header">
        <h1>Telemetry Analysis</h1>
        <div className="session-info">
          <span className="circuit-name">{session.circuitName}</span>
          <span className="session-details">
            {session.season} - Round {session.round} - {session.sessionType}
          </span>
        </div>
      </div>

      <div className="analysis-layout">
        <aside className="lap-selector">
          <div className="selector-header">
            <h2>Lap Selection</h2>
            <span className="selection-count">
              {selectedLaps.length} / {maxLaps} selected
            </span>
          </div>

          {selectedLaps.length > 0 && (
            <button onClick={handleClearSelection} className="clear-selection-btn">
              Clear Selection
            </button>
          )}

          <div className="driver-groups">
            {Object.entries(lapsByDriver).map(([driverId, laps]) => (
              <div key={driverId} className="driver-group">
                <h3 className="driver-name">
                  {getDriverCode(driverId)} - {getDriverName(driverId)}
                </h3>
                <div className="lap-list">
                  {laps.map((lap) => {
                    const isSelected = selectedLaps.some((l) => l.lapNumber === lap.lapNumber);
                    const isDisabled = !isSelected && selectedLaps.length >= maxLaps;

                    return (
                      <button
                        key={lap.lapNumber}
                        onClick={() => handleLapSelect(lap)}
                        disabled={isDisabled}
                        className={`lap-button ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                      >
                        <span className="lap-number">Lap {lap.lapNumber}</span>
                        <span className="lap-time">{lap.lapTime.toFixed(3)}s</span>
                        <span className="tire-info">{lap.tireCompound}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <main className="analysis-content">
          <div className="track-map-container">
            <TrackMap
              circuitId={session.circuitId}
              currentDistance={currentDistance}
              onDistanceChange={handleDistanceChange}
            />
          </div>

          <div className="telemetry-controls">
            <div className="channel-selector">
              <button
                onClick={() => setActiveChannel('speed')}
                className={`channel-btn ${activeChannel === 'speed' ? 'active' : ''}`}
              >
                Speed
              </button>
              <button
                onClick={() => setActiveChannel('throttle')}
                className={`channel-btn ${activeChannel === 'throttle' ? 'active' : ''}`}
              >
                Throttle
              </button>
              <button
                onClick={() => setActiveChannel('brake')}
                className={`channel-btn ${activeChannel === 'brake' ? 'active' : ''}`}
              >
                Brake
              </button>
              <button
                onClick={() => setActiveChannel('gear')}
                className={`channel-btn ${activeChannel === 'gear' ? 'active' : ''}`}
              >
                Gear
              </button>
            </div>
          </div>

          <div className="telemetry-chart-container">
            {selectedLaps.length === 0 ? (
              <div className="no-selection">
                <p>Select up to {maxLaps} laps to compare telemetry data</p>
              </div>
            ) : (
              <TelemetryChart
                laps={selectedLaps}
                channel={activeChannel}
                currentDistance={currentDistance}
                onDistanceChange={handleDistanceChange}
              />
            )}
          </div>

          {selectedLaps.length > 0 && (
            <div className="comparison-summary">
              <h3>Lap Comparison</h3>
              <div className="comparison-grid">
                {selectedLaps.map((lap, index) => (
                  <div key={lap.lapNumber} className="comparison-card">
                    <div className="card-header" style={{ borderLeftColor: getColor(index) }}>
                      <span className="driver-code">{getDriverCode(lap.driverId)}</span>
                      <span className="lap-number">Lap {lap.lapNumber}</span>
                    </div>
                    <div className="card-body">
                      <div className="stat">
                        <span className="stat-label">Lap Time:</span>
                        <span className="stat-value">{lap.lapTime.toFixed(3)}s</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">S1:</span>
                        <span className="stat-value">{lap.sector1Time.toFixed(3)}s</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">S2:</span>
                        <span className="stat-value">{lap.sector2Time.toFixed(3)}s</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">S3:</span>
                        <span className="stat-value">{lap.sector3Time.toFixed(3)}s</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Tire:</span>
                        <span className="stat-value">{lap.tireCompound}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Age:</span>
                        <span className="stat-value">{lap.tireAge} laps</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

// Helper function to get consistent colors for lap traces
function getColor(index: number): string {
  const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12'];
  return colors[index % colors.length];
}
