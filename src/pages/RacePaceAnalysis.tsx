import { useState, useEffect } from 'react';
import { useSessionStore } from '../store/sessionStore';
import { openf1Api } from '../services/openf1Api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { DriverInfo } from '../types';
import './RacePaceAnalysis.css';

interface LapTimeData {
  lapNumber: number;
  lapTime: number;
}

interface DriverPaceData {
  driverNumber: number;
  driverName: string;
  teamColor: string;
  laps: LapTimeData[];
  averagePace: number;
  fastestLap: number;
  consistency: number; // standard deviation
}

export const RacePaceAnalysis: React.FC = () => {
  const { selectedSession } = useSessionStore();
  const [sessionKey, setSessionKey] = useState<number | null>(null);
  const [drivers, setDrivers] = useState<DriverInfo[]>([]);
  const [selectedDrivers, setSelectedDrivers] = useState<number[]>([]);
  const [paceData, setPaceData] = useState<DriverPaceData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [excludeOutliers, setExcludeOutliers] = useState(true);

  // Circuit name mapping for matching Ergast to OpenF1
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

  // Fetch OpenF1 session key
  useEffect(() => {
    const fetchSessionKey = async () => {
      if (!selectedSession) {
        setSessionKey(null);
        return;
      }
      
      try {
        console.log('Fetching OpenF1 sessions for:', selectedSession.season, selectedSession.sessionType);
        const sessions = await openf1Api.fetchSessions(selectedSession.season);
        
        // Filter by session type
        const sessionTypeMatches = sessions.filter(s => {
          const openf1Type = s.sessionType.toLowerCase();
          const selectedType = selectedSession.sessionType.toLowerCase();
          return openf1Type === selectedType;
        });
        
        console.log(`Found ${sessionTypeMatches.length} sessions matching type "${selectedSession.sessionType}"`);
        
        // Find matching circuit using aliases
        const matchingSession = sessionTypeMatches.find(s => {
          const sessionCircuit = s.circuitName.toLowerCase();
          const selectedCircuit = selectedSession.circuitName.toLowerCase();
          
          // Direct name match
          if (sessionCircuit.includes(selectedCircuit) || selectedCircuit.includes(sessionCircuit)) {
            return true;
          }
          
          // Check circuit mapping aliases
          for (const [, aliases] of Object.entries(circuitMapping)) {
            const sessionMatches = aliases.some(alias => sessionCircuit.includes(alias));
            const selectedMatches = aliases.some(alias => selectedCircuit.includes(alias));
            if (sessionMatches && selectedMatches) {
              console.log(`✓ Circuit match via alias: ${sessionCircuit} <-> ${selectedCircuit}`);
              return true;
            }
          }
          
          return false;
        });
        
        if (matchingSession) {
          const key = parseInt(matchingSession.id.replace('openf1-', ''));
          console.log('✓ Found OpenF1 session:', key, matchingSession.circuitName);
          setSessionKey(key);
          setError(null);
        } else {
          console.log('✗ No matching OpenF1 session found for:', selectedSession.circuitName);
          setError('This session does not have OpenF1 data. Please select a 2024 session.');
        }
      } catch (err) {
        console.error('Error fetching OpenF1 session:', err);
        setError('Failed to find OpenF1 session data');
      }
    };
    
    fetchSessionKey();
  }, [selectedSession]);

  // Load drivers when session is selected
  useEffect(() => {
    if (!selectedSession || !sessionKey) {
      setDrivers([]);
      return;
    }

    const loadDrivers = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Loading drivers for session:', selectedSession);

        // Try to get drivers from session data first
        if (selectedSession.drivers && selectedSession.drivers.length > 0) {
          console.log(`✓ Using ${selectedSession.drivers.length} drivers from session data`);
          setDrivers(selectedSession.drivers);
          return;
        }

        // Fetch from OpenF1 using matched session key
        console.log(`Fetching drivers from OpenF1 for session ${sessionKey}...`);
        const fetchedDrivers = await openf1Api.fetchDrivers(sessionKey);
        console.log(`✓ Loaded ${fetchedDrivers.length} drivers from OpenF1`);
        setDrivers(fetchedDrivers);
      } catch (err) {
        console.error('Error loading drivers:', err);
        setError(`Failed to load drivers: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    loadDrivers();
  }, [selectedSession]);

  // Load pace data when drivers are selected
  useEffect(() => {
    if (!selectedSession || !sessionKey || selectedDrivers.length === 0) {
      setPaceData([]);
      return;
    }

    const loadPaceData = async () => {
      try {
        setLoading(true);
        setError(null);

        const pacePromises = selectedDrivers.map(async (driverNumber) => {
          try {
            const laps = await openf1Api.fetchLaps(sessionKey, driverNumber);
            
            // Filter out invalid laps
            let validLaps = laps
              .filter(lap => 
                lap.lap_duration > 0 && 
                !lap.is_pit_out_lap &&
                lap.lap_duration < 200 // Exclude extremely slow laps (safety car, etc.)
              )
              .map(lap => ({
                lapNumber: lap.lap_number,
                lapTime: lap.lap_duration,
              }));

            // Optionally exclude outliers
            if (excludeOutliers && validLaps.length > 5) {
              const times = validLaps.map(l => l.lapTime);
              const mean = times.reduce((a, b) => a + b, 0) / times.length;
              const stdDev = Math.sqrt(
                times.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / times.length
              );
              
              // Exclude laps more than 2 standard deviations from mean
              validLaps = validLaps.filter(lap => 
                Math.abs(lap.lapTime - mean) <= 2 * stdDev
              );
            }

            if (validLaps.length === 0) {
              return null;
            }

            const driver = drivers.find(d => d.number === driverNumber);
            const times = validLaps.map(l => l.lapTime);
            const averagePace = times.reduce((a, b) => a + b, 0) / times.length;
            const fastestLap = Math.min(...times);
            
            // Calculate consistency (standard deviation)
            const variance = times.reduce((sq, n) => sq + Math.pow(n - averagePace, 2), 0) / times.length;
            const consistency = Math.sqrt(variance);

            return {
              driverNumber,
              driverName: driver ? `${driver.firstName} ${driver.lastName}` : `Driver ${driverNumber}`,
              teamColor: getTeamColor(driver?.team || ''),
              laps: validLaps,
              averagePace,
              fastestLap,
              consistency,
            };
          } catch (err) {
            console.error(`Error loading pace data for driver ${driverNumber}:`, err);
            return null;
          }
        });

        const results = await Promise.all(pacePromises);
        const validResults = results.filter((r): r is DriverPaceData => r !== null);
        setPaceData(validResults);
      } catch (err) {
        console.error('Error loading pace data:', err);
        setError('Failed to load pace data');
      } finally {
        setLoading(false);
      }
    };

    loadPaceData();
  }, [selectedSession, sessionKey, selectedDrivers, drivers, excludeOutliers]);

  const handleDriverToggle = (driverNumber: number) => {
    setSelectedDrivers(prev => {
      if (prev.includes(driverNumber)) {
        return prev.filter(d => d !== driverNumber);
      } else {
        if (prev.length >= 6) {
          alert('Maximum 6 drivers can be compared');
          return prev;
        }
        return [...prev, driverNumber];
      }
    });
  };

  const formatLapTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(3);
    return `${mins}:${secs.padStart(6, '0')}`;
  };

  const getTeamColor = (team: string): string => {
    const teamColors: Record<string, string> = {
      'Red Bull Racing': '#3671C6',
      'Ferrari': '#E8002D',
      'Mercedes': '#27F4D2',
      'McLaren': '#FF8000',
      'Aston Martin': '#229971',
      'Alpine': '#FF87BC',
      'Williams': '#64C4FF',
      'AlphaTauri': '#5E8FAA',
      'Alfa Romeo': '#C92D4B',
      'Haas F1 Team': '#B6BABD',
      'RB': '#6692FF',
      'Kick Sauber': '#52E252',
    };

    return teamColors[team] || '#FFFFFF';
  };

  // Prepare chart data - merge all laps into a single dataset
  const allLapNumbers = Array.from(
    new Set(paceData.flatMap(d => d.laps.map(l => l.lapNumber)))
  ).sort((a, b) => a - b);

  const chartData = allLapNumbers.map(lapNumber => {
    const dataPoint: any = { lapNumber };
    paceData.forEach(driver => {
      const lap = driver.laps.find(l => l.lapNumber === lapNumber);
      if (lap) {
        dataPoint[driver.driverName] = lap.lapTime;
      }
    });
    return dataPoint;
  });

  const formatYAxis = (value: number) => {
    const mins = Math.floor(value / 60);
    const secs = (value % 60).toFixed(0);
    return `${mins}:${secs.padStart(2, '0')}`;
  };

  const formatTooltip = (value: number) => {
    return formatLapTime(value);
  };

  if (!selectedSession) {
    return (
      <div className="race-pace-analysis">
        <div className="no-session">
          <h2>No Session Selected</h2>
          <p>Please select a session from the Session Browser to analyze race pace.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="race-pace-analysis">
      <div className="race-pace-header">
        <h2>Race Pace Analysis</h2>
        <p className="subtitle">Compare lap time consistency and race pace between drivers</p>
      </div>

      {error && (
        <div className="error-message">
          <span>⚠️ {error}</span>
        </div>
      )}

      <div className="race-pace-content">
        {/* Driver Selection */}
        <div className="driver-selection-section">
          <div className="section-header">
            <h3>Select Drivers to Compare (max 6)</h3>
            <label className="outlier-toggle">
              <input
                type="checkbox"
                checked={excludeOutliers}
                onChange={(e) => setExcludeOutliers(e.target.checked)}
              />
              <span>Exclude outliers (pit stops, safety cars)</span>
            </label>
          </div>
          <div className="driver-grid">
            {drivers.map(driver => (
              <button
                key={driver.number}
                className={`driver-card ${selectedDrivers.includes(driver.number) ? 'selected' : ''}`}
                onClick={() => handleDriverToggle(driver.number)}
                style={{
                  borderColor: selectedDrivers.includes(driver.number) 
                    ? getTeamColor(driver.team) 
                    : 'transparent',
                }}
              >
                <div className="driver-number" style={{ color: getTeamColor(driver.team) }}>
                  {driver.number}
                </div>
                <div className="driver-name">{driver.code}</div>
                <div className="driver-team">{driver.team}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Pace Chart */}
        {selectedDrivers.length > 0 && paceData.length > 0 && (
          <>
            <div className="pace-chart-section">
              <h3>Lap Time Evolution</h3>
              {loading && <div className="loading-spinner">Loading pace data...</div>}
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="lapNumber" 
                      label={{ value: 'Lap Number', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      tickFormatter={formatYAxis}
                      label={{ value: 'Lap Time', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip formatter={formatTooltip} />
                    <Legend />
                    {paceData.map(driver => (
                      <Line
                        key={driver.driverNumber}
                        type="monotone"
                        dataKey={driver.driverName}
                        stroke={driver.teamColor}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Statistics Table */}
            <div className="pace-stats-section">
              <h3>Pace Statistics</h3>
              <div className="stats-table-container">
                <table className="stats-table">
                  <thead>
                    <tr>
                      <th>Driver</th>
                      <th>Laps Analyzed</th>
                      <th>Average Pace</th>
                      <th>Fastest Lap</th>
                      <th>Consistency</th>
                      <th>Delta to Best</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paceData
                      .sort((a, b) => a.averagePace - b.averagePace)
                      .map((driver, index) => {
                        const bestAverage = paceData[0].averagePace;
                        const delta = driver.averagePace - bestAverage;
                        return (
                          <tr key={driver.driverNumber}>
                            <td>
                              <div className="driver-cell">
                                <div 
                                  className="driver-color-bar" 
                                  style={{ backgroundColor: driver.teamColor }}
                                />
                                <span>{driver.driverName}</span>
                              </div>
                            </td>
                            <td>{driver.laps.length}</td>
                            <td className={index === 0 ? 'best-time' : ''}>
                              {formatLapTime(driver.averagePace)}
                            </td>
                            <td>{formatLapTime(driver.fastestLap)}</td>
                            <td>±{driver.consistency.toFixed(3)}s</td>
                            <td>
                              {index === 0 ? '-' : `+${delta.toFixed(3)}s`}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pace-insights">
              <h4>Insights</h4>
              <ul>
                <li>📊 <strong>Average Pace:</strong> Mean lap time across all valid laps</li>
                <li>⚡ <strong>Fastest Lap:</strong> Single fastest lap time</li>
                <li>📈 <strong>Consistency:</strong> Lower values indicate more consistent pace (standard deviation)</li>
                <li>🎯 <strong>Delta to Best:</strong> Time difference to the driver with best average pace</li>
                <li>🔧 Outliers (pit stops, safety cars) are {excludeOutliers ? 'excluded' : 'included'}</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
