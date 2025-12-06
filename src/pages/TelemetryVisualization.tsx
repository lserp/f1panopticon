import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSessionStore } from '../store/sessionStore';
import { useLapData } from '../hooks/useLapData';
import { openf1Api } from '../services/openf1Api';
import type { TelemetryData } from '../types';

export const TelemetryVisualization: React.FC = () => {
  const { selectedSession } = useSessionStore();
  const [selectedDriver, setSelectedDriver] = useState<string | undefined>(undefined);
  const [selectedLap, setSelectedLap] = useState<number | undefined>(undefined);
  const [telemetryData, setTelemetryData] = useState<TelemetryData | null>(null);
  const [loadingTelemetry, setLoadingTelemetry] = useState(false);
  const [telemetryError, setTelemetryError] = useState<string | null>(null);
  const [sessionKey, setSessionKey] = useState<number | null>(null);
  
  const { laps } = useLapData({
    season: selectedSession?.season || 0,
    round: selectedSession?.round || 0,
    driverId: selectedDriver,
    autoFetch: !!selectedSession,
  });

  // Try to find OpenF1 session key for telemetry
  useEffect(() => {
    const fetchSessionKey = async () => {
      if (!selectedSession) return;
      
      try {
        // Capitalize session type for OpenF1 API (expects "Race", "Qualifying", etc.)
        const sessionType = selectedSession.sessionType.charAt(0).toUpperCase() + selectedSession.sessionType.slice(1);
        console.log('Fetching OpenF1 sessions for:', selectedSession.season, sessionType);
        const sessions = await openf1Api.fetchSessions(
          selectedSession.season,
          sessionType
        );
        
        console.log('Found OpenF1 sessions:', sessions.length);
        
        // Circuit name mapping for better matching
        const circuitMapping: Record<string, string[]> = {
          'bahrain': ['sakhir', 'bahrain'],
          'jeddah': ['jeddah', 'saudi'],
          'melbourne': ['melbourne', 'albert park', 'australia'],
          'suzuka': ['suzuka', 'japan'],
          'shanghai': ['shanghai', 'china'],
          'miami': ['miami'],
          'imola': ['imola', 'emilia'],
          'monaco': ['monaco', 'monte carlo'],
          'montreal': ['montreal', 'canada', 'gilles'],
          'barcelona': ['barcelona', 'catalunya', 'spain'],
          'spielberg': ['spielberg', 'austria', 'red bull ring'],
          'silverstone': ['silverstone', 'britain', 'great britain'],
          'budapest': ['budapest', 'hungaroring', 'hungary'],
          'spa': ['spa', 'francorchamps', 'belgium'],
          'zandvoort': ['zandvoort', 'netherlands'],
          'monza': ['monza', 'italy'],
          'baku': ['baku', 'azerbaijan'],
          'singapore': ['singapore', 'marina bay'],
          'austin': ['austin', 'americas', 'cota'],
          'mexico': ['mexico', 'rodriguez'],
          'interlagos': ['interlagos', 'brazil', 'sao paulo', 'são paulo'],
          'las vegas': ['las vegas', 'vegas'],
          'lusail': ['lusail', 'qatar'],
          'yas': ['yas', 'abu dhabi', 'emirates']
        };
        
        // Find matching session by circuit
        const matchingSession = sessions.find(s => {
          const sessionCircuit = s.circuitName.toLowerCase();
          const selectedCircuit = selectedSession.circuitName.toLowerCase();
          
          console.log('Comparing:', sessionCircuit, 'with', selectedCircuit);
          
          // Direct match
          if (sessionCircuit.includes(selectedCircuit) || selectedCircuit.includes(sessionCircuit)) {
            return true;
          }
          
          // Check mapping
          for (const [, aliases] of Object.entries(circuitMapping)) {
            const matchesKey = aliases.some(alias => 
              sessionCircuit.includes(alias) || selectedCircuit.includes(alias)
            );
            if (matchesKey) {
              return true;
            }
          }
          
          // Match by round number if available
          if (selectedSession.round === s.round) {
            return true;
          }
          
          return false;
        });
        
        if (matchingSession) {
          console.log('Matched OpenF1 session:', matchingSession.circuitName, matchingSession.id);
          // Extract session_key from the OpenF1 session ID
          const keyMatch = matchingSession.id.match(/openf1-(\d+)/);
          if (keyMatch) {
            const key = parseInt(keyMatch[1]);
            console.log('Setting session key:', key);
            setSessionKey(key);
          }
        } else {
          console.log('No matching OpenF1 session found');
        }
      } catch (error) {
        console.log('Could not fetch OpenF1 session key:', error);
      }
    };
    
    fetchSessionKey();
  }, [selectedSession]);

  // Fetch telemetry when lap is selected
  useEffect(() => {
    const fetchTelemetry = async () => {
      if (!sessionKey || !selectedDriver || selectedLap === undefined) {
        setTelemetryData(null);
        return;
      }

      setLoadingTelemetry(true);
      setTelemetryError(null);

      try {
        // Find the driver's number from the session data
        const driver = selectedSession?.drivers.find(d => d.id === selectedDriver);
        if (!driver) {
          throw new Error('Driver not found');
        }

        const driverNumber = driver.number;
        console.log('Fetching telemetry for driver:', driver.code, 'number:', driverNumber, 'lap:', selectedLap);

        const telemetry = await openf1Api.fetchTelemetry(sessionKey, driverNumber, selectedLap);
        console.log('Telemetry data received:', telemetry.speed.length, 'data points');
        setTelemetryData(telemetry);
      } catch (error) {
        console.error('Error fetching telemetry:', error);
        setTelemetryError('Telemetry data not available for this lap. OpenF1 API may have limitations on historical data.');
        setTelemetryData(null);
      } finally {
        setLoadingTelemetry(false);
      }
    };

    fetchTelemetry();
  }, [sessionKey, selectedDriver, selectedLap, selectedSession]);

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

  const filteredLaps = selectedDriver 
    ? laps.filter(l => l.driverId === selectedDriver)
    : laps;

  return (
    <div style={{ padding: '2rem', background: '#f8f9fa', minHeight: '100vh' }}>
      <h1 style={{ color: '#2c3e50', marginBottom: '1.5rem' }}>
        🏎️ Telemetry Visualization
      </h1>
      
      <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
        <h2 style={{ color: '#34495e', borderBottom: '3px solid #3498db', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
          {selectedSession.circuitName} - {selectedSession.sessionType}
        </h2>

        {/* Driver Selection */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ color: '#34495e', marginBottom: '1rem' }}>Select Driver</h3>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {selectedSession.drivers.map((driver) => {
              const driverLaps = laps.filter(l => l.driverId === driver.id);
              
              return (
                <button
                  key={driver.id}
                  onClick={() => {
                    setSelectedDriver(driver.id);
                    setSelectedLap(undefined);
                  }}
                  style={{
                    padding: '0.75rem 1.25rem',
                    background: selectedDriver === driver.id ? '#3498db' : '#ecf0f1',
                    color: selectedDriver === driver.id ? 'white' : '#2c3e50',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    transition: 'all 0.2s',
                    fontSize: '1rem'
                  }}
                  title={driverLaps.length > 0 ? `${driverLaps.length} laps available` : 'Loading laps...'}
                >
                  {driver.code} - {driver.firstName} {driver.lastName}
                  {driverLaps.length > 0 && ` (${driverLaps.length})`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Lap Selection */}
        {selectedDriver && filteredLaps.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ color: '#34495e', marginBottom: '1rem' }}>
              Select Lap ({filteredLaps.length} laps available)
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', 
              gap: '0.5rem',
              maxHeight: '200px',
              overflowY: 'auto',
              padding: '0.5rem',
              background: '#f8f9fa',
              borderRadius: '8px'
            }}>
              {filteredLaps.map((lap) => (
                <button
                  key={lap.lapNumber}
                  onClick={() => setSelectedLap(lap.lapNumber)}
                  style={{
                    padding: '0.5rem',
                    background: selectedLap === lap.lapNumber ? '#e74c3c' : 'white',
                    color: selectedLap === lap.lapNumber ? 'white' : '#2c3e50',
                    border: '2px solid ' + (selectedLap === lap.lapNumber ? '#e74c3c' : '#ddd'),
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    transition: 'all 0.2s',
                    fontSize: '0.9rem'
                  }}
                >
                  Lap {lap.lapNumber}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Telemetry Status */}
        {sessionKey && (
          <div style={{ 
            padding: '1rem', 
            background: '#e8f5e9', 
            borderRadius: '8px',
            marginBottom: '1rem',
            color: '#2e7d32'
          }}>
            ✓ OpenF1 session found (Key: {sessionKey}) - Telemetry data available
          </div>
        )}

        {!sessionKey && (
          <div style={{ 
            padding: '1rem', 
            background: '#fff3cd', 
            borderRadius: '8px',
            marginBottom: '1rem',
            color: '#856404'
          }}>
            ⚠️ OpenF1 session not found - Only lap times available (no telemetry)
          </div>
        )}

        {/* Telemetry Display */}
        {loadingTelemetry && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#7f8c8d' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏱️</div>
            Loading telemetry data...
          </div>
        )}

        {telemetryError && (
          <div style={{ 
            padding: '1rem', 
            background: '#fee', 
            border: '1px solid #fcc',
            borderRadius: '8px',
            color: '#c33',
            marginTop: '1rem'
          }}>
            <strong>Telemetry Error:</strong> {telemetryError}
          </div>
        )}

        {telemetryData && !loadingTelemetry && (
          <div style={{ marginTop: '2rem' }}>
            <h3 style={{ color: '#34495e', borderBottom: '3px solid #27ae60', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
              Telemetry Data - Lap {selectedLap}
            </h3>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              <div style={{ padding: '1rem', background: '#e3f2fd', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.875rem', color: '#1976d2', marginBottom: '0.5rem' }}>Data Points</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0d47a1' }}>
                  {telemetryData.speed.length}
                </div>
              </div>
              <div style={{ padding: '1rem', background: '#f3e5f5', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.875rem', color: '#7b1fa2', marginBottom: '0.5rem' }}>Max Speed</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4a148c' }}>
                  {Math.max(...telemetryData.speed).toFixed(0)} km/h
                </div>
              </div>
              <div style={{ padding: '1rem', background: '#e8f5e9', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.875rem', color: '#388e3c', marginBottom: '0.5rem' }}>Max Throttle</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1b5e20' }}>
                  {Math.max(...telemetryData.throttle).toFixed(0)}%
                </div>
              </div>
              <div style={{ padding: '1rem', background: '#ffebee', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.875rem', color: '#d32f2f', marginBottom: '0.5rem' }}>Max Brake</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#b71c1c' }}>
                  {Math.max(...telemetryData.brake).toFixed(0)}%
                </div>
              </div>
            </div>

            {/* Simple telemetry charts */}
            <div style={{ marginTop: '2rem' }}>
              <TelemetryChart 
                data={telemetryData.speed} 
                label="Speed (km/h)" 
                color="#3498db"
              />
              <TelemetryChart 
                data={telemetryData.throttle} 
                label="Throttle (%)" 
                color="#27ae60"
              />
              <TelemetryChart 
                data={telemetryData.brake} 
                label="Brake (%)" 
                color="#e74c3c"
              />
              <TelemetryChart 
                data={telemetryData.gear} 
                label="Gear" 
                color="#f39c12"
              />
            </div>
          </div>
        )}

        {/* Lap Times Table */}
        {!selectedLap && selectedDriver && filteredLaps.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <h3 style={{ color: '#34495e', borderBottom: '3px solid #f39c12', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
              Lap Times
            </h3>
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
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Time</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLaps.map((lap, index) => (
                    <tr key={lap.lapNumber} style={{ 
                      background: index % 2 === 0 ? 'white' : '#f8f9fa',
                      borderBottom: '1px solid #ecf0f1'
                    }}>
                      <td style={{ padding: '0.75rem', fontWeight: '600', color: '#2c3e50' }}>
                        Lap {lap.lapNumber}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: '600', color: '#27ae60' }}>
                        {formatLapTime(lap.lapTime)}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <button
                          onClick={() => setSelectedLap(lap.lapNumber)}
                          style={{
                            padding: '0.5rem 1rem',
                            background: '#3498db',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '0.875rem'
                          }}
                        >
                          View Telemetry
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Simple telemetry chart component
const TelemetryChart: React.FC<{ data: number[]; label: string; color: string }> = ({ 
  data, 
  label, 
  color 
}) => {
  if (data.length === 0) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1; // Avoid division by zero

  // Sample data if too many points (for performance)
  const maxPoints = 1000;
  const sampledData = data.length > maxPoints 
    ? data.filter((_, i) => i % Math.ceil(data.length / maxPoints) === 0)
    : data;

  const width = 800;
  const height = 120;

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h4 style={{ color: '#34495e', marginBottom: '0.5rem' }}>{label}</h4>
      <div style={{ 
        position: 'relative', 
        height: '150px', 
        background: 'white', 
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '1rem',
        overflow: 'hidden'
      }}>
        <svg 
          width="100%" 
          height="100%" 
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          style={{ display: 'block' }}
        >
          <polyline
            points={sampledData.map((value, index) => {
              const x = (index / (sampledData.length - 1)) * width;
              const y = height - ((value - min) / range) * height;
              return `${x},${y}`;
            }).join(' ')}
            fill="none"
            stroke={color}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <div style={{ 
          position: 'absolute', 
          top: '1rem', 
          right: '1rem', 
          fontSize: '0.875rem',
          color: '#7f8c8d',
          background: 'rgba(255,255,255,0.9)',
          padding: '0.25rem 0.5rem',
          borderRadius: '4px'
        }}>
          Max: {max.toFixed(1)} | Min: {min.toFixed(1)}
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
