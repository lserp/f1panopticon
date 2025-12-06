import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSessionStore } from '../store/sessionStore';
import { useLapData } from '../hooks/useLapData';
import { openf1Api } from '../services/openf1Api';
import type { TelemetryData } from '../types';

interface DriverSelection {
  driverId: string;
  driverName: string;
  driverCode: string;
  team: string;
  driverNumber: number;
  lapNumber: number | null;
  telemetry: TelemetryData | null;
  loading: boolean;
  color: string;
}

interface LapInfo {
  lapNumber: number;
  lapTime?: number; // in seconds
}

// F1 2024 team colors
const TEAM_COLORS: Record<string, string> = {
  'red bull': '#3671C6',
  'ferrari': '#E8002D',
  'mercedes': '#27F4D2',
  'mclaren': '#FF8000',
  'aston martin': '#229971',
  'alpine': '#FF87BC',
  'williams': '#64C4FF',
  'rb': '#6692FF',
  'kick sauber': '#52E252',
  'haas': '#B6BABD',
  // Fallback colors
  'default': '#888888',
};

const getTeamColor = (team: string): string => {
  const teamLower = team.toLowerCase();
  for (const [key, color] of Object.entries(TEAM_COLORS)) {
    if (teamLower.includes(key)) {
      return color;
    }
  }
  return TEAM_COLORS.default;
};

export const TelemetryComparison: React.FC = () => {
  const { selectedSession } = useSessionStore();
  const [sessionKey, setSessionKey] = useState<number | null>(null);
  const [selectedDrivers, setSelectedDrivers] = useState<DriverSelection[]>([]);
  const [availableLaps, setAvailableLaps] = useState<Record<string, LapInfo[]>>({});
  
  // Debug: Log selected session
  console.log('Selected session:', selectedSession);
  console.log('Selected session drivers:', selectedSession?.drivers?.length || 0);
  
  const { laps } = useLapData({
    season: selectedSession?.season || 0,
    round: selectedSession?.round || 0,
    autoFetch: !!selectedSession,
  });

  // Fetch available laps from OpenF1 and merge with Ergast lap times
  useEffect(() => {
    console.log('fetchAvailableLaps effect triggered', { sessionKey, hasSession: !!selectedSession, driverCount: selectedSession?.drivers?.length || 0, lapCount: laps.length });
    
    const fetchAvailableLaps = async () => {
      if (!sessionKey || !selectedSession) {
        console.log('Skipping lap fetch - no session key or selected session', { sessionKey, hasSession: !!selectedSession });
        return;
      }
      
      if (!selectedSession.drivers || selectedSession.drivers.length === 0) {
        console.error('⚠️ Selected session has NO DRIVERS!', selectedSession);
        return;
      }
      
      console.log(`=== FETCHING LAPS ===`);
      console.log(`Session key: ${sessionKey}`);
      console.log(`Drivers: ${selectedSession.drivers.length}`);
      console.log(`Ergast laps loaded: ${laps.length}`);
      
      try {
        const lapsByDriver: Record<string, LapInfo[]> = {};
        
        // Fetch laps from OpenF1 for each driver
        for (const driver of selectedSession.drivers) {
          try {
            console.log(`Fetching OpenF1 laps for driver ${driver.code} (number: ${driver.number})`);
            const openf1Laps = await openf1Api.fetchLaps(sessionKey, driver.number);
            console.log(`  → Got ${openf1Laps.length} laps from OpenF1`);
            
            // Get lap times from Ergast data
            const ergastLapTimes: Record<number, number> = {};
            laps.forEach(lap => {
              if (lap.driverId === driver.id) {
                ergastLapTimes[lap.lapNumber] = lap.lapTime;
              }
            });
            console.log(`  → Got ${Object.keys(ergastLapTimes).length} lap times from Ergast`);
            
            // Combine OpenF1 lap numbers with lap times (from OpenF1 or Ergast)
            const driverLaps: LapInfo[] = openf1Laps.map(lap => ({
              lapNumber: lap.lap_number,
              lapTime: lap.lap_duration || ergastLapTimes[lap.lap_number],
            }));
            
            // Sort by lap number
            driverLaps.sort((a, b) => a.lapNumber - b.lapNumber);
            
            if (driverLaps.length > 0) {
              lapsByDriver[driver.id] = driverLaps;
              console.log(`  ✓ Added ${driverLaps.length} laps for ${driver.code}`);
            } else {
              console.log(`  ✗ No laps available for ${driver.code}`);
            }
          } catch (error) {
            console.log(`Could not fetch OpenF1 laps for driver ${driver.code}:`, error);
            // Fallback to Ergast data only
            const ergastLaps: LapInfo[] = laps
              .filter(lap => lap.driverId === driver.id)
              .map(lap => ({
                lapNumber: lap.lapNumber,
                lapTime: lap.lapTime,
              }));
            
            if (ergastLaps.length > 0) {
              lapsByDriver[driver.id] = ergastLaps;
              console.log(`  ✓ Fallback: Added ${ergastLaps.length} Ergast laps for ${driver.code}`);
            } else {
              console.log(`  ✗ No Ergast laps available for ${driver.code}`);
            }
          }
        }
        
        console.log('Final lap counts by driver:', Object.entries(lapsByDriver).map(([id, laps]) => `${id}: ${laps.length}`));
        setAvailableLaps(lapsByDriver);
      } catch (error) {
        console.error('Error fetching available laps:', error);
        // Fallback to Ergast data only
        const lapsByDriver: Record<string, LapInfo[]> = {};
        laps.forEach(lap => {
          if (!lapsByDriver[lap.driverId]) {
            lapsByDriver[lap.driverId] = [];
          }
          lapsByDriver[lap.driverId].push({
            lapNumber: lap.lapNumber,
            lapTime: lap.lapTime,
          });
        });
        console.log('Using Ergast-only fallback:', Object.entries(lapsByDriver).map(([id, laps]) => `${id}: ${laps.length}`));
        setAvailableLaps(lapsByDriver);
      }
    };
    
    if (sessionKey) {
      fetchAvailableLaps();
    } else {
      // No OpenF1 session, use Ergast data only
      console.log('No session key - using Ergast data only');
      const lapsByDriver: Record<string, LapInfo[]> = {};
      laps.forEach(lap => {
        if (!lapsByDriver[lap.driverId]) {
          lapsByDriver[lap.driverId] = [];
        }
        lapsByDriver[lap.driverId].push({
          lapNumber: lap.lapNumber,
          lapTime: lap.lapTime,
        });
      });
      console.log('Ergast lap counts:', Object.entries(lapsByDriver).map(([id, laps]) => `${id}: ${laps.length}`));
      setAvailableLaps(lapsByDriver);
    }
  }, [sessionKey, selectedSession, laps]);

  // Fetch OpenF1 session key
  useEffect(() => {
    const fetchSessionKey = async () => {
      if (!selectedSession) return;
      
      try {
        // OpenF1 uses specific session type names - try without filtering first
        console.log('Fetching OpenF1 sessions for:', selectedSession.season, selectedSession.sessionType);
        const sessions = await openf1Api.fetchSessions(
          selectedSession.season
        );
        console.log('All OpenF1 sessions:', sessions.map(s => ({ 
          circuit: s.circuitName, 
          type: s.sessionType,
          id: s.id 
        })));
        
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
        
        console.log(`Found ${sessions.length} OpenF1 sessions`);
        
        // Filter by session type first
        const sessionTypeMatches = sessions.filter(s => {
          const openf1Type = s.sessionType.toLowerCase();
          const selectedType = selectedSession.sessionType.toLowerCase();
          console.log('Session type comparison:', openf1Type, 'vs', selectedType);
          return openf1Type === selectedType;
        });
        
        console.log(`Found ${sessionTypeMatches.length} sessions matching type "${selectedSession.sessionType}"`);
        
        const matchingSession = sessionTypeMatches.find(s => {
          const sessionCircuit = s.circuitName.toLowerCase();
          const selectedCircuit = selectedSession.circuitName.toLowerCase();
          
          console.log('Comparing OpenF1:', sessionCircuit, 'with Ergast:', selectedCircuit);
          
          // Direct name match
          if (sessionCircuit.includes(selectedCircuit) || selectedCircuit.includes(sessionCircuit)) {
            console.log('  ✓ Direct match');
            return true;
          }
          
          // Check circuit mapping aliases
          for (const [, aliases] of Object.entries(circuitMapping)) {
            const sessionMatches = aliases.some(alias => sessionCircuit.includes(alias));
            const selectedMatches = aliases.some(alias => selectedCircuit.includes(alias));
            
            if (sessionMatches && selectedMatches) {
              console.log('  ✓ Alias match');
              return true;
            }
          }
          
          console.log('  ✗ No match');
          return false;
        });
        
        if (matchingSession) {
          const keyMatch = matchingSession.id.match(/openf1-(\d+)/);
          if (keyMatch) {
            const key = parseInt(keyMatch[1]);
            console.log('Setting session key:', key);
            setSessionKey(key);
          }
        }
      } catch (error) {
        console.log('Could not fetch OpenF1 session key:', error);
      }
    };
    
    fetchSessionKey();
  }, [selectedSession]);

  const addDriver = (driverId: string) => {
    if (selectedDrivers.length >= 6) {
      alert('Maximum 6 drivers can be compared');
      return;
    }
    
    const driver = selectedSession?.drivers.find(d => d.id === driverId);
    if (!driver) return;
    
    const color = getTeamColor(driver.team);
    
    setSelectedDrivers([...selectedDrivers, {
      driverId: driver.id,
      driverName: `${driver.firstName} ${driver.lastName}`,
      driverCode: driver.code,
      team: driver.team,
      driverNumber: driver.number,
      lapNumber: null,
      telemetry: null,
      loading: false,
      color,
    }]);
  };

  const removeDriver = (driverId: string) => {
    setSelectedDrivers(selectedDrivers.filter(d => d.driverId !== driverId));
  };

  const setDriverLap = async (driverId: string, lapNumber: number) => {
    if (!sessionKey || !selectedSession) return;
    
    const driverIndex = selectedDrivers.findIndex(d => d.driverId === driverId);
    if (driverIndex === -1) return;
    
    // Update loading state
    const updatedDrivers = [...selectedDrivers];
    updatedDrivers[driverIndex] = {
      ...updatedDrivers[driverIndex],
      lapNumber,
      loading: true,
    };
    setSelectedDrivers(updatedDrivers);
    
    try {
      const driver = selectedSession.drivers.find(d => d.id === driverId);
      if (!driver) throw new Error('Driver not found');
      
      console.log('Fetching telemetry for:', driver.code, 'lap:', lapNumber);
      const telemetry = await openf1Api.fetchTelemetry(sessionKey, driver.number, lapNumber);
      
      const finalDrivers = [...selectedDrivers];
      const finalIndex = finalDrivers.findIndex(d => d.driverId === driverId);
      finalDrivers[finalIndex] = {
        ...finalDrivers[finalIndex],
        lapNumber,
        telemetry,
        loading: false,
      };
      setSelectedDrivers(finalDrivers);
    } catch (error) {
      console.error('Error fetching telemetry:', error);
      const errorDrivers = [...selectedDrivers];
      const errorIndex = errorDrivers.findIndex(d => d.driverId === driverId);
      errorDrivers[errorIndex] = {
        ...errorDrivers[errorIndex],
        loading: false,
      };
      setSelectedDrivers(errorDrivers);
      alert('Failed to load telemetry for this lap. Try a different lap.');
    }
  };

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

  const availableDrivers = selectedSession.drivers.filter(
    d => !selectedDrivers.find(sd => sd.driverId === d.id)
  );

  const driversWithTelemetry = selectedDrivers.filter(d => d.telemetry !== null);

  return (
    <div style={{ padding: '2rem', background: '#f8f9fa', minHeight: '100vh' }}>
      <h1 style={{ color: '#2c3e50', marginBottom: '1.5rem' }}>
        🏎️ Telemetry Comparison
      </h1>
      
      <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
        <h2 style={{ color: '#34495e', borderBottom: '3px solid #3498db', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
          {selectedSession.circuitName} - {selectedSession.sessionType}
        </h2>

        {/* Session Status */}
        {sessionKey ? (
          <div style={{ 
            padding: '1rem', 
            background: '#e8f5e9', 
            borderRadius: '8px',
            marginBottom: '1.5rem',
            color: '#2e7d32'
          }}>
            ✓ OpenF1 session found (Key: {sessionKey}) - Telemetry data available
          </div>
        ) : (
          <div style={{ 
            padding: '1rem', 
            background: '#fff3cd', 
            borderRadius: '8px',
            marginBottom: '1.5rem',
            color: '#856404'
          }}>
            ⚠️ OpenF1 session not found - Only lap times available (no telemetry)
          </div>
        )}

        {/* Add Driver Section */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ color: '#34495e', marginBottom: '1rem' }}>
            Add Drivers to Compare ({selectedDrivers.length}/6)
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {availableDrivers.map((driver) => {
              const driverLaps = availableLaps[driver.id] || [];
              const color = getTeamColor(driver.team);
              
              return (
                <button
                  key={driver.id}
                  onClick={() => addDriver(driver.id)}
                  disabled={selectedDrivers.length >= 6 || driverLaps.length === 0}
                  style={{
                    padding: '0.75rem 1.25rem',
                    background: selectedDrivers.length >= 6 || driverLaps.length === 0 ? '#ddd' : color,
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: selectedDrivers.length >= 6 || driverLaps.length === 0 ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    transition: 'all 0.2s',
                    fontSize: '1rem',
                    opacity: selectedDrivers.length >= 6 || driverLaps.length === 0 ? 0.5 : 1
                  }}
                  title={driverLaps.length > 0 ? `${driverLaps.length} laps available` : 'No laps available'}
                >
                  {driver.code} - {driver.firstName} {driver.lastName}
                  {driverLaps.length > 0 && ` (${driverLaps.length})`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Drivers */}
        {selectedDrivers.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ color: '#34495e', marginBottom: '1rem' }}>Selected Drivers</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {selectedDrivers.map((driver) => {
                const driverLaps = availableLaps[driver.driverId] || [];
                
                return (
                  <div 
                    key={driver.driverId}
                    style={{ 
                      padding: '1.5rem', 
                      background: '#f8f9fa', 
                      borderRadius: '8px',
                      borderLeft: `4px solid ${driver.color}`
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <div>
                        <span style={{ 
                          fontSize: '1.25rem', 
                          fontWeight: 'bold', 
                          color: driver.color,
                          marginRight: '1rem'
                        }}>
                          {driver.driverCode}
                        </span>
                        <span style={{ fontSize: '1rem', color: '#34495e' }}>
                          {driver.driverName}
                        </span>
                        <span style={{ 
                          marginLeft: '1rem', 
                          fontSize: '0.875rem', 
                          color: '#7f8c8d',
                          background: 'white',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px'
                        }}>
                          {driver.team}
                        </span>
                      </div>
                      <button
                        onClick={() => removeDriver(driver.driverId)}
                        style={{
                          padding: '0.5rem 1rem',
                          background: '#e74c3c',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                    
                    {/* Lap Selection */}
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#34495e' }}>
                        Select Lap:
                      </label>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', maxHeight: '300px', overflowY: 'auto' }}>
                        {driverLaps.map(lapInfo => (
                          <button
                            key={lapInfo.lapNumber}
                            onClick={() => setDriverLap(driver.driverId, lapInfo.lapNumber)}
                            disabled={driver.loading}
                            style={{
                              padding: '0.5rem 0.75rem',
                              background: driver.lapNumber === lapInfo.lapNumber ? driver.color : 'white',
                              color: driver.lapNumber === lapInfo.lapNumber ? 'white' : '#2c3e50',
                              border: `2px solid ${driver.color}`,
                              borderRadius: '6px',
                              cursor: driver.loading ? 'wait' : 'pointer',
                              fontWeight: '600',
                              fontSize: '0.875rem',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              minWidth: '80px'
                            }}
                            title={lapInfo.lapTime ? `Lap ${lapInfo.lapNumber}: ${formatLapTime(lapInfo.lapTime)}` : `Lap ${lapInfo.lapNumber}`}
                          >
                            <div>Lap {lapInfo.lapNumber}</div>
                            {lapInfo.lapTime && (
                              <div style={{ fontSize: '0.75rem', opacity: 0.9, marginTop: '0.25rem' }}>
                                {formatLapTime(lapInfo.lapTime)}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                      {driver.loading && (
                        <div style={{ marginTop: '0.5rem', color: '#7f8c8d', fontSize: '0.875rem' }}>
                          Loading telemetry...
                        </div>
                      )}
                      {driver.lapNumber && driver.telemetry && (
                        <div style={{ marginTop: '0.5rem', color: '#27ae60', fontSize: '0.875rem', fontWeight: '600' }}>
                          ✓ Lap {driver.lapNumber} loaded ({driver.telemetry.speed.length} data points)
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Telemetry Charts */}
        {driversWithTelemetry.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <h3 style={{ color: '#34495e', borderBottom: '3px solid #27ae60', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
              Telemetry Comparison
            </h3>
            
            {/* Legend */}
            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              flexWrap: 'wrap', 
              marginBottom: '2rem',
              padding: '1rem',
              background: '#f8f9fa',
              borderRadius: '8px'
            }}>
              {driversWithTelemetry.map(driver => (
                <div key={driver.driverId} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ 
                    width: '20px', 
                    height: '4px', 
                    background: driver.color,
                    borderRadius: '2px'
                  }} />
                  <span style={{ fontWeight: '600', color: '#2c3e50' }}>
                    {driver.driverCode} (Lap {driver.lapNumber})
                  </span>
                </div>
              ))}
            </div>

            {/* Charts */}
            <ComparisonChart 
              drivers={driversWithTelemetry}
              dataKey="speed"
              label="Speed (km/h)"
            />
            <ComparisonChart 
              drivers={driversWithTelemetry}
              dataKey="throttle"
              label="Throttle (%)"
            />
            <ComparisonChart 
              drivers={driversWithTelemetry}
              dataKey="brake"
              label="Brake (%)"
            />
            <ComparisonChart 
              drivers={driversWithTelemetry}
              dataKey="gear"
              label="Gear"
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to format lap time
function formatLapTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3);
  return `${minutes}:${secs.padStart(6, '0')}`;
}

// Comparison chart component with hover tooltip
const ComparisonChart: React.FC<{ 
  drivers: DriverSelection[]; 
  dataKey: keyof TelemetryData;
  label: string;
}> = ({ drivers, dataKey, label }) => {
  const [hoverData, setHoverData] = useState<{
    x: number;
    distance: number;
    values: { driverCode: string; value: number; color: string }[];
  } | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const width = 800;
  const height = 120;

  // Find global min/max across all drivers for the data values
  let globalMinValue = Infinity;
  let globalMaxValue = -Infinity;
  let globalMaxDistance = 0;

  // Pre-compute data for each driver
  const driverData = drivers.map(driver => {
    if (!driver.telemetry) return null;
    
    const data = driver.telemetry[dataKey];
    const distances = driver.telemetry.distance;
    
    const min = Math.min(...data);
    const max = Math.max(...data);
    globalMinValue = Math.min(globalMinValue, min);
    globalMaxValue = Math.max(globalMaxValue, max);
    
    const maxDist = Math.max(...distances);
    globalMaxDistance = Math.max(globalMaxDistance, maxDist);
    
    return {
      driver,
      data,
      distances,
    };
  }).filter(Boolean);

  const range = globalMaxValue - globalMinValue || 1;

  // Find value at a given distance using binary search
  const getValueAtDistance = (distances: number[], data: number[], targetDistance: number): number => {
    if (distances.length === 0) return 0;
    
    // Binary search for closest distance
    let left = 0;
    let right = distances.length - 1;
    
    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (distances[mid] < targetDistance) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }
    
    // Interpolate between two closest points
    if (left === 0) return data[0];
    if (left >= distances.length) return data[data.length - 1];
    
    const d1 = distances[left - 1];
    const d2 = distances[left];
    const v1 = data[left - 1];
    const v2 = data[left];
    
    const ratio = (targetDistance - d1) / (d2 - d1);
    return v1 + (v2 - v1) * ratio;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || globalMaxDistance === 0) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const relativeX = x / rect.width;
    const distance = relativeX * globalMaxDistance;
    
    const values = driverData.map(dd => {
      if (!dd) return null;
      const value = getValueAtDistance(dd.distances, dd.data, distance);
      return {
        driverCode: dd.driver.driverCode,
        value,
        color: dd.driver.color,
      };
    }).filter(Boolean) as { driverCode: string; value: number; color: string }[];
    
    setHoverData({ x, distance, values });
  };

  const handleMouseLeave = () => {
    setHoverData(null);
  };

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h4 style={{ color: '#34495e', marginBottom: '0.5rem' }}>{label}</h4>
      <div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ 
          position: 'relative', 
          height: '150px', 
          background: 'white', 
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '1rem',
          overflow: 'hidden',
          cursor: 'crosshair'
        }}
      >
        <svg 
          width="100%" 
          height="100%" 
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          style={{ display: 'block', pointerEvents: 'none' }}
        >
          {driverData.map(dd => {
            if (!dd) return null;
            
            // Create distance-value pairs
            const points = dd.data.map((value, i) => ({
              distance: dd.distances[i] || 0,
              value: value,
            }));

            // Sample data for performance
            const maxPoints = 1000;
            const sampledPoints = points.length > maxPoints 
              ? points.filter((_, i) => i % Math.ceil(points.length / maxPoints) === 0)
              : points;

            return (
              <polyline
                key={dd.driver.driverId}
                points={sampledPoints.map(point => {
                  const x = globalMaxDistance > 0 
                    ? (point.distance / globalMaxDistance) * width 
                    : 0;
                  const y = height - ((point.value - globalMinValue) / range) * height;
                  return `${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke={dd.driver.color}
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>
        
        {/* Hover line and tooltip */}
        {hoverData && (
          <>
            {/* Vertical line */}
            <div style={{
              position: 'absolute',
              left: `${hoverData.x}px`,
              top: 0,
              bottom: 0,
              width: '1px',
              background: 'rgba(0,0,0,0.3)',
              pointerEvents: 'none'
            }} />
            
            {/* Tooltip */}
            <div style={{
              position: 'absolute',
              left: hoverData.x > (containerRef.current?.clientWidth || 0) / 2 
                ? `${hoverData.x - 140}px` 
                : `${hoverData.x + 10}px`,
              top: '10px',
              background: 'rgba(0,0,0,0.85)',
              color: 'white',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              pointerEvents: 'none',
              zIndex: 10,
              minWidth: '120px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
            }}>
              <div style={{ 
                fontWeight: 'bold', 
                marginBottom: '6px',
                borderBottom: '1px solid rgba(255,255,255,0.2)',
                paddingBottom: '4px'
              }}>
                {hoverData.distance.toFixed(0)}m
              </div>
              {hoverData.values.map(v => (
                <div key={v.driverCode} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '4px'
                }}>
                  <span style={{ 
                    color: v.color, 
                    fontWeight: 'bold',
                    marginRight: '12px'
                  }}>
                    {v.driverCode}
                  </span>
                  <span style={{ fontFamily: 'monospace' }}>
                    {v.value.toFixed(dataKey === 'gear' ? 0 : 1)}
                    {dataKey === 'speed' ? ' km/h' : dataKey === 'throttle' || dataKey === 'brake' ? '%' : ''}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
        
        <div style={{ 
          position: 'absolute', 
          top: '1rem', 
          right: '1rem', 
          fontSize: '0.875rem',
          color: '#7f8c8d',
          background: 'rgba(255,255,255,0.9)',
          padding: '0.25rem 0.5rem',
          borderRadius: '4px',
          pointerEvents: 'none'
        }}>
          Max: {globalMaxValue.toFixed(1)} | Min: {globalMinValue.toFixed(1)}
        </div>
        <div style={{ 
          position: 'absolute', 
          bottom: '1rem', 
          left: '1rem', 
          fontSize: '0.875rem',
          color: '#7f8c8d',
          background: 'rgba(255,255,255,0.9)',
          padding: '0.25rem 0.5rem',
          borderRadius: '4px',
          pointerEvents: 'none'
        }}>
          Distance: {globalMaxDistance.toFixed(0)}m
        </div>
      </div>
    </div>
  );
};


