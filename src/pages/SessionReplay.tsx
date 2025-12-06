import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSessionStore } from '../store/sessionStore';
import type { LapData } from '../types';
import './SessionReplay.css';

export const SessionReplay: React.FC = () => {
  const { selectedSession } = useSessionStore();
  
  if (!selectedSession) {
    return (
      <div className="session-replay-empty">
        <h2>No Session Selected</h2>
        <p>Please select a session from the Session Browser to view replay data.</p>
        <Link to="/sessions" className="select-session-btn">
          Go to Session Browser
        </Link>
      </div>
    );
  }

  const session = selectedSession;
  const laps: LapData[] = []; // TODO: Fetch lap data for the session
  const [selectedLaps, setSelectedLaps] = useState<LapData[]>([]);

  const handleLapSelect = (lap: LapData) => {
    if (selectedLaps.find((l) => l.lapNumber === lap.lapNumber)) {
      setSelectedLaps(selectedLaps.filter((l) => l.lapNumber !== lap.lapNumber));
    } else {
      setSelectedLaps([...selectedLaps, lap]);
    }
  };

  const handleClearSelection = () => {
    setSelectedLaps([]);
  };

  // Group laps by driver
  const lapsByDriver = laps.reduce(
    (acc, lap) => {
      if (!acc[lap.driverId]) {
        acc[lap.driverId] = [];
      }
      acc[lap.driverId].push(lap);
      return acc;
    },
    {} as Record<string, LapData[]>
  );

  const getDriverInfo = (driverId: string) => {
    return session.drivers.find((d) => d.id === driverId);
  };

  return (
    <div className="session-replay">
      <div className="replay-header">
        <h1>Session Replay</h1>
        <div className="session-info">
          <span className="circuit-name">{session.circuitName}</span>
          <span className="session-details">
            {session.season} - Round {session.round} - {session.sessionType}
          </span>
        </div>
      </div>

      <div className="replay-layout">
        <aside className="lap-selector">
          <div className="selector-header">
            <h2>Laps</h2>
            {selectedLaps.length > 0 && (
              <button onClick={handleClearSelection} className="clear-btn">
                Clear
              </button>
            )}
          </div>

          <div className="driver-groups">
            {Object.entries(lapsByDriver).map(([driverId, driverLaps]) => {
              const driver = getDriverInfo(driverId);
              return (
                <div key={driverId} className="driver-group">
                  <h3 className="driver-name">
                    {driver?.code || '???'} - {driver?.firstName} {driver?.lastName}
                  </h3>
                  <div className="lap-list">
                    {driverLaps.map((lap) => {
                      const isSelected = selectedLaps.some((l) => l.lapNumber === lap.lapNumber);
                      return (
                        <button
                          key={lap.lapNumber}
                          onClick={() => handleLapSelect(lap)}
                          className={`lap-button ${isSelected ? 'selected' : ''}`}
                        >
                          <span className="lap-number">Lap {lap.lapNumber}</span>
                          <span className="lap-time">{lap.lapTime.toFixed(3)}s</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        <main className="replay-content">
          <div className="replay-visualization">
            <div className="coming-soon">
              <h3>Replay Visualization Coming Soon</h3>
              <p>Lap data and telemetry replay will be available here.</p>
              <p className="session-details-text">
                Currently viewing: <strong>{session.circuitName}</strong> - {session.sessionType} - {session.season}
              </p>
            </div>
          </div>

          <div className="replay-info">
            <div className="info-panel">
              <h3>Playback Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Total Laps:</span>
                  <span className="info-value">{laps.length}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Selected Laps:</span>
                  <span className="info-value">
                    {selectedLaps.length > 0 ? selectedLaps.length : 'All'}
                  </span>
                </div>
              </div>
            </div>

            {selectedLaps.length > 0 && (
              <div className="info-panel">
                <h3>Selected Laps</h3>
                <div className="selected-laps-list">
                  {selectedLaps.map((lap) => {
                    const driver = getDriverInfo(lap.driverId);
                    return (
                      <div key={lap.lapNumber} className="selected-lap-item">
                        <span className="driver-code">{driver?.code || '???'}</span>
                        <span className="lap-number">Lap {lap.lapNumber}</span>
                        <span className="lap-time">{lap.lapTime.toFixed(3)}s</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
