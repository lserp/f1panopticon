import { useState, useEffect } from 'react';
import { useSessionStore } from '../store/sessionStore';
import { openf1Api } from '../services/openf1Api';
import type { DriverInfo } from '../types';
import './SectorAnalysis.css';

interface SectorTime {
  driverNumber: number;
  driverName: string;
  teamColor: string;
  sector1: number | null;
  sector2: number | null;
  sector3: number | null;
  lapTime: number | null;
}

interface LapInfo {
  lapNumber: number;
  lapTime: string;
}

export const SectorAnalysis: React.FC = () => {
  const { selectedSession } = useSessionStore();
  const [sessionKey, setSessionKey] = useState<number | null>(null);
  const [drivers, setDrivers] = useState<DriverInfo[]>([]);
  const [selectedDrivers, setSelectedDrivers] = useState<number[]>([]);
  const [availableLaps, setAvailableLaps] = useState<LapInfo[]>([]);
  const [selectedLap, setSelectedLap] = useState<number | null>(null);
  const [sectorData, setSectorData] = useState<SectorTime[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  }, [selectedSession, sessionKey]);

  // Load available laps when drivers are selected
  useEffect(() => {
    if (!selectedSession || !sessionKey || selectedDrivers.length === 0) {
      setAvailableLaps([]);
      return;
    }

    const loadLaps = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch laps for the first selected driver
        const laps = await openf1Api.fetchLaps(sessionKey, selectedDrivers[0]);
        
        console.log(`✓ Loaded ${laps.length} laps for driver ${selectedDrivers[0]}`);

        const lapInfo: LapInfo[] = laps.map(lap => ({
          lapNumber: lap.lap_number,
          lapTime: lap.lap_duration ? formatLapTime(lap.lap_duration) : 'N/A',
        }));

        setAvailableLaps(lapInfo);
      } catch (err) {
        console.error('Error loading laps:', err);
        setError('Failed to load laps');
      } finally {
        setLoading(false);
      }
    };

    loadLaps();
  }, [selectedSession, sessionKey, selectedDrivers]);

  // Load sector data when lap is selected
  useEffect(() => {
    if (!selectedSession || !sessionKey || selectedDrivers.length === 0 || selectedLap === null) {
      setSectorData([]);
      return;
    }

    const loadSectorData = async () => {
      try {
        setLoading(true);
        setError(null);

        const sectorPromises = selectedDrivers.map(async (driverNumber) => {
          try {
            const laps = await openf1Api.fetchLaps(sessionKey, driverNumber);
            const lap = laps.find(l => l.lap_number === selectedLap);

            if (!lap) {
              return null;
            }

            const driver = drivers.find(d => d.number === driverNumber);

            return {
              driverNumber,
              driverName: driver ? `${driver.firstName} ${driver.lastName}` : `Driver ${driverNumber}`,
              teamColor: getTeamColor(driver?.team || ''),
              sector1: lap.duration_sector_1 || null,
              sector2: lap.duration_sector_2 || null,
              sector3: lap.duration_sector_3 || null,
              lapTime: lap.lap_duration || null,
            };
          } catch (err) {
            console.error(`Error loading sector data for driver ${driverNumber}:`, err);
            return null;
          }
        });

        const results = await Promise.all(sectorPromises);
        const validResults = results.filter((r): r is SectorTime => r !== null);
        setSectorData(validResults);
      } catch (err) {
        console.error('Error loading sector data:', err);
        setError('Failed to load sector data');
      } finally {
        setLoading(false);
      }
    };

    loadSectorData();
  }, [selectedSession, sessionKey, selectedDrivers, selectedLap, drivers]);

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

  const formatSectorTime = (seconds: number | null): string => {
    if (seconds === null) return 'N/A';
    return seconds.toFixed(3) + 's';
  };

  const getBestSectorTime = (sectorIndex: 1 | 2 | 3): number | null => {
    const times = sectorData
      .map(d => sectorIndex === 1 ? d.sector1 : sectorIndex === 2 ? d.sector2 : d.sector3)
      .filter((t): t is number => t !== null);
    
    return times.length > 0 ? Math.min(...times) : null;
  };

  const isBestSector = (time: number | null, sectorIndex: 1 | 2 | 3): boolean => {
    if (time === null) return false;
    const bestTime = getBestSectorTime(sectorIndex);
    return bestTime !== null && Math.abs(time - bestTime) < 0.001;
  };

  const getDeltaToBest = (time: number | null, sectorIndex: 1 | 2 | 3): string => {
    if (time === null) return '';
    const bestTime = getBestSectorTime(sectorIndex);
    if (bestTime === null) return '';
    const delta = time - bestTime;
    if (Math.abs(delta) < 0.001) return '';
    return `+${delta.toFixed(3)}`;
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

  if (!selectedSession) {
    return (
      <div className="sector-analysis">
        <div className="no-session">
          <h2>No Session Selected</h2>
          <p>Please select a session from the Session Browser to analyze sector times.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sector-analysis">
      <div className="sector-analysis-header">
        <h2>Sector Analysis</h2>
        <p className="subtitle">Compare sector times between drivers for a specific lap</p>
      </div>

      {error && (
        <div className="error-message">
          <span>⚠️ {error}</span>
        </div>
      )}

      <div className="sector-analysis-content">
        {/* Driver Selection */}
        <div className="driver-selection-section">
          <h3>Select Drivers to Compare (max 6)</h3>
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

        {/* Lap Selection */}
        {selectedDrivers.length > 0 && (
          <div className="lap-selection-section">
            <h3>Select Lap</h3>
            {loading && <div className="loading-spinner">Loading laps...</div>}
            <div className="lap-buttons-container">
              {availableLaps.map(lap => (
                <button
                  key={lap.lapNumber}
                  className={`lap-button ${selectedLap === lap.lapNumber ? 'selected' : ''}`}
                  onClick={() => setSelectedLap(lap.lapNumber)}
                >
                  <div className="lap-number">Lap {lap.lapNumber}</div>
                  <div className="lap-time">{lap.lapTime}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sector Comparison Table */}
        {selectedLap !== null && sectorData.length > 0 && (
          <div className="sector-comparison-section">
            <h3>Sector Times - Lap {selectedLap}</h3>
            {loading && <div className="loading-spinner">Loading sector data...</div>}
            <div className="sector-table-container">
              <table className="sector-table">
                <thead>
                  <tr>
                    <th>Driver</th>
                    <th>Sector 1</th>
                    <th>Sector 2</th>
                    <th>Sector 3</th>
                    <th>Lap Time</th>
                  </tr>
                </thead>
                <tbody>
                  {sectorData.map(data => (
                    <tr key={data.driverNumber}>
                      <td>
                        <div className="driver-cell">
                          <div 
                            className="driver-color-bar" 
                            style={{ backgroundColor: data.teamColor }}
                          />
                          <span>{data.driverName}</span>
                        </div>
                      </td>
                      <td className={isBestSector(data.sector1, 1) ? 'best-time' : ''}>
                        <div className="time-cell">
                          <span className="time">{formatSectorTime(data.sector1)}</span>
                          <span className="delta">{getDeltaToBest(data.sector1, 1)}</span>
                        </div>
                      </td>
                      <td className={isBestSector(data.sector2, 2) ? 'best-time' : ''}>
                        <div className="time-cell">
                          <span className="time">{formatSectorTime(data.sector2)}</span>
                          <span className="delta">{getDeltaToBest(data.sector2, 2)}</span>
                        </div>
                      </td>
                      <td className={isBestSector(data.sector3, 3) ? 'best-time' : ''}>
                        <div className="time-cell">
                          <span className="time">{formatSectorTime(data.sector3)}</span>
                          <span className="delta">{getDeltaToBest(data.sector3, 3)}</span>
                        </div>
                      </td>
                      <td>
                        <span className="time">{data.lapTime ? formatLapTime(data.lapTime) : 'N/A'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="sector-insights">
              <h4>Insights</h4>
              <ul>
                <li>🟢 Green highlight indicates the fastest sector time</li>
                <li>⏱️ Delta shows time difference to the fastest sector</li>
                <li>📊 Compare where drivers gain or lose time on track</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
