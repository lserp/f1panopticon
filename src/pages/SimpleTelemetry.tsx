import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSessionStore } from '../store/sessionStore';
import { useLapData } from '../hooks/useLapData';

export const SimpleTelemetry: React.FC = () => {
  const { selectedSession } = useSessionStore();
  const [selectedDriver, setSelectedDriver] = useState<string | undefined>(undefined);
  
  const { laps, loading: lapsLoading, error: lapsError } = useLapData({
    season: selectedSession?.season || 0,
    round: selectedSession?.round || 0,
    driverId: selectedDriver,
    autoFetch: !!selectedSession,
  });

  if (!selectedSession) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>No Session Selected</h2>
        <p>Please select a session from the Session Browser.</p>
        <Link to="/sessions" style={{ color: '#4a90e2' }}>
          Go to Session Browser
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', background: '#f8f9fa', minHeight: '100vh' }}>
      <h1 style={{ color: '#2c3e50', marginBottom: '1.5rem' }}>Telemetry Analysis</h1>
      
      <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h2 style={{ color: '#34495e', borderBottom: '3px solid #3498db', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
          Selected Session Details
        </h2>
        <table style={{ width: '100%', marginTop: '1rem', borderCollapse: 'separate', borderSpacing: '0 0.5rem' }}>
          <tbody>
            <tr style={{ background: '#f8f9fa' }}>
              <td style={{ padding: '0.75rem', fontWeight: '600', color: '#2c3e50', width: '200px', borderRadius: '4px 0 0 4px' }}>Circuit:</td>
              <td style={{ padding: '0.75rem', color: '#34495e', borderRadius: '0 4px 4px 0' }}>{selectedSession.circuitName}</td>
            </tr>
            <tr style={{ background: '#f8f9fa' }}>
              <td style={{ padding: '0.75rem', fontWeight: '600', color: '#2c3e50', borderRadius: '4px 0 0 4px' }}>Session Type:</td>
              <td style={{ padding: '0.75rem', color: '#34495e', borderRadius: '0 4px 4px 0' }}>
                <span style={{ 
                  background: '#3498db', 
                  color: 'white', 
                  padding: '0.25rem 0.75rem', 
                  borderRadius: '12px', 
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  textTransform: 'uppercase'
                }}>
                  {selectedSession.sessionType}
                </span>
              </td>
            </tr>
            <tr style={{ background: '#f8f9fa' }}>
              <td style={{ padding: '0.75rem', fontWeight: '600', color: '#2c3e50', borderRadius: '4px 0 0 4px' }}>Season:</td>
              <td style={{ padding: '0.75rem', color: '#34495e', borderRadius: '0 4px 4px 0' }}>{selectedSession.season}</td>
            </tr>
            <tr style={{ background: '#f8f9fa' }}>
              <td style={{ padding: '0.75rem', fontWeight: '600', color: '#2c3e50', borderRadius: '4px 0 0 4px' }}>Round:</td>
              <td style={{ padding: '0.75rem', color: '#34495e', borderRadius: '0 4px 4px 0' }}>{selectedSession.round}</td>
            </tr>
            <tr style={{ background: '#f8f9fa' }}>
              <td style={{ padding: '0.75rem', fontWeight: '600', color: '#2c3e50', borderRadius: '4px 0 0 4px' }}>Date:</td>
              <td style={{ padding: '0.75rem', color: '#34495e', borderRadius: '0 4px 4px 0' }}>{new Date(selectedSession.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
            </tr>
            <tr style={{ background: '#f8f9fa' }}>
              <td style={{ padding: '0.75rem', fontWeight: '600', color: '#2c3e50', borderRadius: '4px 0 0 4px' }}>Data Source:</td>
              <td style={{ padding: '0.75rem', color: '#34495e', borderRadius: '0 4px 4px 0' }}>
                <span style={{ 
                  background: '#27ae60', 
                  color: 'white', 
                  padding: '0.25rem 0.75rem', 
                  borderRadius: '12px', 
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  textTransform: 'uppercase'
                }}>
                  {selectedSession.source}
                </span>
              </td>
            </tr>
            <tr style={{ background: '#f8f9fa' }}>
              <td style={{ padding: '0.75rem', fontWeight: '600', color: '#2c3e50', borderRadius: '4px 0 0 4px' }}>Total Drivers:</td>
              <td style={{ padding: '0.75rem', color: '#34495e', borderRadius: '0 4px 4px 0', fontSize: '1.25rem', fontWeight: 'bold' }}>{selectedSession.drivers.length}</td>
            </tr>
          </tbody>
        </table>

        <h3 style={{ marginTop: '2.5rem', color: '#34495e', borderBottom: '3px solid #e74c3c', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
          Drivers in Session
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          {selectedSession.drivers.map((driver) => (
            <div key={driver.id} style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
              padding: '1.25rem', 
              borderRadius: '8px', 
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              color: 'white',
              transition: 'transform 0.2s',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ fontWeight: 'bold', fontSize: '1.5rem', marginBottom: '0.5rem' }}>{driver.code}</div>
              <div style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{driver.firstName} {driver.lastName}</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.25rem' }}>#{driver.number}</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9, background: 'rgba(255,255,255,0.2)', padding: '0.25rem 0.5rem', borderRadius: '4px', marginTop: '0.5rem' }}>
                {driver.team}
              </div>
            </div>
          ))}
        </div>

        <h3 style={{ marginTop: '2.5rem', color: '#34495e', borderBottom: '3px solid #f39c12', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
          Lap Times
        </h3>

        {lapsLoading && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#7f8c8d' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏱️</div>
            Loading lap data...
          </div>
        )}

        {lapsError && (
          <div style={{ 
            padding: '1.5rem', 
            background: '#4a1515', 
            border: '1px solid #e53e3e',
            borderRadius: '8px',
            color: '#fc8181'
          }}>
            <strong style={{ fontSize: '1.1rem' }}>⚠️ Error loading lap data</strong>
            <p style={{ margin: '0.75rem 0 0 0', color: '#fca5a5' }}>
              {lapsError.message.includes('CORS') || lapsError.message.includes('Network') 
                ? 'The Ergast API is blocking requests from the browser (CORS issue).'
                : lapsError.message}
            </p>
            {selectedSession && selectedSession.season >= 2025 && (
              <p style={{ margin: '0.75rem 0 0 0', color: '#fca5a5' }}>
                <strong>Note:</strong> You selected a {selectedSession.season} session. Ergast API only has historical data (up to 2024).
              </p>
            )}
            <p style={{ margin: '0.75rem 0 0 0', color: '#a0aec0', fontSize: '0.9rem' }}>
              💡 <strong>Tip:</strong> For lap times, try selecting a <strong>2024 race</strong> from the Session Browser. 
              For detailed telemetry analysis, use the <Link to="/telemetry-viz" style={{ color: '#63b3ed' }}>Telemetry Viz</Link> or <Link to="/race-pace" style={{ color: '#63b3ed' }}>Race Pace</Link> pages which use the OpenF1 API.
            </p>
          </div>
        )}

        {!lapsLoading && !lapsError && laps.length > 0 && (
          <>
            <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => setSelectedDriver(undefined)}
                style={{
                  padding: '0.5rem 1rem',
                  background: !selectedDriver ? '#3498db' : '#ecf0f1',
                  color: !selectedDriver ? 'white' : '#2c3e50',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'all 0.2s'
                }}
              >
                All Drivers ({laps.length} laps)
              </button>
              {selectedSession.drivers.map((driver) => {
                const driverLaps = laps.filter(l => l.driverId === driver.id);
                if (driverLaps.length === 0) return null;
                return (
                  <button
                    key={driver.id}
                    onClick={() => setSelectedDriver(driver.id)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: selectedDriver === driver.id ? '#3498db' : '#ecf0f1',
                      color: selectedDriver === driver.id ? 'white' : '#2c3e50',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      transition: 'all 0.2s'
                    }}
                  >
                    {driver.code} ({driverLaps.length})
                  </button>
                );
              })}
            </div>

            <div style={{ 
              maxHeight: '400px', 
              overflowY: 'auto', 
              background: '#f8f9fa', 
              borderRadius: '8px',
              padding: '1rem'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, background: '#34495e', color: 'white' }}>
                  <tr>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Lap</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Driver</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {laps.map((lap, index) => {
                    const driver = selectedSession.drivers.find(d => d.id === lap.driverId);
                    return (
                      <tr key={`${lap.driverId}-${lap.lapNumber}`} style={{ 
                        background: index % 2 === 0 ? 'white' : '#f8f9fa',
                        borderBottom: '1px solid #ecf0f1'
                      }}>
                        <td style={{ padding: '0.75rem', fontWeight: '600', color: '#2c3e50' }}>
                          {lap.lapNumber}
                        </td>
                        <td style={{ padding: '0.75rem', color: '#34495e' }}>
                          <span style={{ 
                            background: '#3498db', 
                            color: 'white', 
                            padding: '0.25rem 0.5rem', 
                            borderRadius: '4px',
                            fontWeight: '600',
                            marginRight: '0.5rem'
                          }}>
                            {driver?.code || lap.driverId}
                          </span>
                          {driver?.firstName} {driver?.lastName}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: '600', color: '#27ae60' }}>
                          {formatLapTime(lap.lapTime)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ 
              marginTop: '1rem', 
              padding: '1rem', 
              background: '#e8f5e9', 
              borderRadius: '8px',
              color: '#2e7d32',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <strong>Total Laps:</strong> {laps.length}
              </div>
              {laps.length > 0 && (
                <div>
                  <strong>Fastest Lap:</strong> {formatLapTime(Math.min(...laps.map(l => l.lapTime)))}
                </div>
              )}
            </div>
          </>
        )}

        {!lapsLoading && !lapsError && laps.length === 0 && (
          <div style={{ 
            padding: '2rem', 
            textAlign: 'center',
            background: '#2d3748',
            borderRadius: '8px',
            color: '#e0e0e0',
            border: '1px solid #4a5568'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📊</div>
            <strong>No lap data available for this session</strong>
            <p style={{ margin: '0.75rem 0 0 0', color: '#a0aec0' }}>
              {selectedSession && selectedSession.season >= 2025 
                ? `The Ergast API doesn't have ${selectedSession.season} data yet. It only contains historical data.`
                : 'Lap timing data may not be available for this session.'}
            </p>
            <p style={{ margin: '0.75rem 0 0 0', fontSize: '0.9rem', color: '#a0aec0' }}>
              💡 Try selecting a completed race from the <strong>2024 season</strong> (like Bahrain GP or Saudi Arabian GP).
            </p>
            <p style={{ margin: '0.75rem 0 0 0', fontSize: '0.9rem', color: '#a0aec0' }}>
              For 2024+ telemetry data, use <Link to="/telemetry-viz" style={{ color: '#63b3ed' }}>Telemetry Viz</Link> or <Link to="/race-pace" style={{ color: '#63b3ed' }}>Race Pace</Link> which use the OpenF1 API.
            </p>
          </div>
        )}

        {!lapsError && laps.length > 0 && (
          <div style={{ 
            marginTop: '2rem', 
            padding: '1.25rem', 
            background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)', 
            borderRadius: '8px',
            color: 'white',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <strong style={{ fontSize: '1.1rem' }}>✓ Data loaded successfully!</strong>
            <p style={{ margin: '0.5rem 0 0 0', opacity: 0.95 }}>
              Lap times loaded from the Ergast API. For detailed telemetry (speed, throttle, brake), use the Telemetry Viz page.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

function formatLapTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3);
  return `${minutes}:${secs.padStart(6, '0')}`;
}
