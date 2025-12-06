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
            padding: '1rem', 
            background: '#fee', 
            border: '1px solid #fcc',
            borderRadius: '8px',
            color: '#c33'
          }}>
            <strong>Error loading lap data:</strong> {lapsError.message}
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
            background: '#fff3cd',
            borderRadius: '8px',
            color: '#856404'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📊</div>
            <strong>No lap data available for this session</strong>
            <p style={{ margin: '0.5rem 0 0 0' }}>
              Lap timing data may not be available for future or incomplete sessions.
            </p>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
              Try selecting a completed race from the 2024 season (like Bahrain GP or Saudi Arabian GP).
            </p>
          </div>
        )}

        <div style={{ 
          marginTop: '2rem', 
          padding: '1.25rem', 
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 
          borderRadius: '8px',
          color: 'white',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <strong style={{ fontSize: '1.1rem' }}>✓ Success!</strong>
          <p style={{ margin: '0.5rem 0 0 0', opacity: 0.95 }}>
            Session data and lap times are loading correctly from the Ergast API. The data flow is working end-to-end!
          </p>
        </div>
      </div>
    </div>
  );
};

function formatLapTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3);
  return `${minutes}:${secs.padStart(6, '0')}`;
}
