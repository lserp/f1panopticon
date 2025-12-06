import { useState, useEffect } from 'react';
import { useSessionStore } from '../store/sessionStore';
import { openf1Api, type RaceControlEvent, type StintData } from '../services/openf1Api';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine,
} from 'recharts';
import type { DriverInfo } from '../types';
import './RacePaceAnalysis.css';

interface LapTimeData {
  lapNumber: number;
  lapTime: number;
  compound?: string;
}

interface CompoundPace {
  compound: string;
  laps: number;
  averagePace: number;
  fastestLap: number;
}

interface DriverPaceData {
  driverNumber: number;
  driverName: string;
  driverCode: string;
  teamColor: string;
  laps: LapTimeData[];
  stints: StintData[];
  pitStops: number[];
  averagePace: number;
  fastestLap: number;
  consistency: number;
  compoundPaces: CompoundPace[];
}

interface SafetyCarPeriod {
  startLap: number;
  endLap: number;
  type: 'SC' | 'VSC' | 'RED_FLAG';
}

export const RacePaceAnalysis: React.FC = () => {
  const { selectedSession } = useSessionStore();
  const [sessionKey, setSessionKey] = useState<number | null>(null);
  const [drivers, setDrivers] = useState<DriverInfo[]>([]);
  const [selectedDrivers, setSelectedDrivers] = useState<number[]>([]);
  const [paceData, setPaceData] = useState<DriverPaceData[]>([]);
  const [safetyCarPeriods, setSafetyCarPeriods] = useState<SafetyCarPeriod[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [excludeOutliers, setExcludeOutliers] = useState(true);

  // Circuit name mapping for matching Ergast to OpenF1
  const circuitMapping: Record<string, string[]> = {
    bahrain: ['sakhir', 'bahrain'],
    jeddah: ['jeddah', 'saudi'],
    melbourne: ['melbourne', 'albert park', 'australia'],
    suzuka: ['suzuka', 'japan'],
    shanghai: ['shanghai', 'china'],
    miami: ['miami'],
    imola: ['imola', 'emilia'],
    monaco: ['monaco', 'monte carlo'],
    montreal: ['montreal', 'canada', 'gilles'],
    barcelona: ['barcelona', 'catalunya', 'spain'],
    spielberg: ['spielberg', 'austria', 'red bull ring'],
    silverstone: ['silverstone', 'britain', 'great britain'],
    budapest: ['budapest', 'hungaroring', 'hungary'],
    spa: ['spa', 'francorchamps', 'belgium'],
    zandvoort: ['zandvoort', 'netherlands'],
    monza: ['monza', 'italy'],
    baku: ['baku', 'azerbaijan'],
    singapore: ['singapore', 'marina bay'],
    austin: ['austin', 'americas', 'cota'],
    mexico: ['mexico', 'rodriguez'],
    interlagos: ['interlagos', 'brazil', 'sao paulo', 'são paulo'],
    'las vegas': ['las vegas', 'vegas'],
    lusail: ['lusail', 'qatar'],
    yas: ['yas', 'abu dhabi', 'emirates'],
  };

  // Fetch OpenF1 session key
  useEffect(() => {
    const fetchSessionKey = async () => {
      if (!selectedSession) {
        setSessionKey(null);
        return;
      }

      try {
        const sessions = await openf1Api.fetchSessions(selectedSession.season);
        const sessionTypeMatches = sessions.filter((s) => {
          const openf1Type = s.sessionType.toLowerCase();
          const selectedType = selectedSession.sessionType.toLowerCase();
          return openf1Type === selectedType;
        });

        const matchingSession = sessionTypeMatches.find((s) => {
          const sessionCircuit = s.circuitName.toLowerCase();
          const selectedCircuit = selectedSession.circuitName.toLowerCase();

          if (
            sessionCircuit.includes(selectedCircuit) ||
            selectedCircuit.includes(sessionCircuit)
          ) {
            return true;
          }

          for (const [, aliases] of Object.entries(circuitMapping)) {
            const sessionMatches = aliases.some((alias) =>
              sessionCircuit.includes(alias)
            );
            const selectedMatches = aliases.some((alias) =>
              selectedCircuit.includes(alias)
            );
            if (sessionMatches && selectedMatches) {
              return true;
            }
          }
          return false;
        });

        if (matchingSession) {
          const key = parseInt(matchingSession.id.replace('openf1-', ''));
          setSessionKey(key);
          setError(null);
        } else {
          setError(
            'This session does not have OpenF1 data. Please select a 2024 session.'
          );
        }
      } catch (err) {
        console.error('Error fetching OpenF1 session:', err);
        setError('Failed to find OpenF1 session data');
      }
    };

    fetchSessionKey();
  }, [selectedSession]);

  // Load drivers and race control data when session key is available
  useEffect(() => {
    if (!selectedSession || !sessionKey) {
      setDrivers([]);
      setSafetyCarPeriods([]);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load drivers
        if (selectedSession.drivers && selectedSession.drivers.length > 0) {
          setDrivers(selectedSession.drivers);
        } else {
          const fetchedDrivers = await openf1Api.fetchDrivers(sessionKey);
          setDrivers(fetchedDrivers);
        }

        // Load race control data for SC/VSC periods
        const raceControl = await openf1Api.fetchRaceControl(sessionKey);
        const periods = extractSafetyCarPeriods(raceControl);
        setSafetyCarPeriods(periods);
      } catch (err) {
        console.error('Error loading data:', err);
        setError(
          `Failed to load data: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedSession, sessionKey]);

  // Extract SC/VSC periods from race control events
  const extractSafetyCarPeriods = (
    events: RaceControlEvent[]
  ): SafetyCarPeriod[] => {
    const periods: SafetyCarPeriod[] = [];
    let currentPeriod: { startLap: number; type: 'SC' | 'VSC' | 'RED_FLAG' } | null = null;

    for (const event of events) {
      const message = event.message.toUpperCase();

      // SC deployed
      if (
        (message.includes('SAFETY CAR DEPLOYED') ||
          message.includes('SAFETY CAR IN THIS LAP')) &&
        !message.includes('VIRTUAL')
      ) {
        if (!currentPeriod && event.lapNumber) {
          currentPeriod = { startLap: event.lapNumber, type: 'SC' };
        }
      }
      // VSC deployed
      else if (
        message.includes('VIRTUAL SAFETY CAR DEPLOYED') ||
        message.includes('VSC DEPLOYED')
      ) {
        if (!currentPeriod && event.lapNumber) {
          currentPeriod = { startLap: event.lapNumber, type: 'VSC' };
        }
      }
      // SC/VSC ending
      else if (
        message.includes('SAFETY CAR IN THIS LAP') ||
        message.includes('VSC ENDING') ||
        message.includes('GREEN FLAG')
      ) {
        if (currentPeriod && event.lapNumber) {
          periods.push({
            ...currentPeriod,
            endLap: event.lapNumber,
          });
          currentPeriod = null;
        }
      }
    }

    // Close any open period at the last lap
    if (currentPeriod) {
      const maxLap = Math.max(...events.filter(e => e.lapNumber).map(e => e.lapNumber!), 0);
      if (maxLap > 0) {
        periods.push({ ...currentPeriod, endLap: maxLap });
      }
    }

    return periods;
  };

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
            // Fetch laps, pit stops, and stints in parallel
            const [laps, pitStops, stints] = await Promise.all([
              openf1Api.fetchLaps(sessionKey, driverNumber),
              openf1Api.fetchPitStops(sessionKey, driverNumber),
              openf1Api.fetchStints(sessionKey, driverNumber),
            ]);

            // Get pit stop lap numbers
            const pitLapNumbers = pitStops.map((p) => p.lapNumber);

            // Helper to find compound for a lap
            const getCompoundForLap = (lapNumber: number): string | undefined => {
              const stint = stints.find(
                (s) => lapNumber >= s.lapStart && lapNumber <= s.lapEnd
              );
              return stint?.compound;
            };

            let validLaps = laps
              .filter(
                (lap) =>
                  lap.lap_duration > 0 &&
                  !lap.is_pit_out_lap &&
                  lap.lap_duration < 200
              )
              .map((lap) => ({
                lapNumber: lap.lap_number,
                lapTime: lap.lap_duration,
                compound: getCompoundForLap(lap.lap_number),
              }));

            if (excludeOutliers && validLaps.length > 5) {
              const times = validLaps.map((l) => l.lapTime);
              const mean = times.reduce((a, b) => a + b, 0) / times.length;
              const stdDev = Math.sqrt(
                times.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) /
                  times.length
              );
              validLaps = validLaps.filter(
                (lap) => Math.abs(lap.lapTime - mean) <= 2 * stdDev
              );
            }

            if (validLaps.length === 0) return null;

            const driver = drivers.find((d) => d.number === driverNumber);
            const times = validLaps.map((l) => l.lapTime);
            const averagePace = times.reduce((a, b) => a + b, 0) / times.length;
            const fastestLap = Math.min(...times);
            const variance =
              times.reduce((sq, n) => sq + Math.pow(n - averagePace, 2), 0) /
              times.length;
            const consistency = Math.sqrt(variance);

            // Calculate pace per compound
            const compoundPaces: CompoundPace[] = [];
            const compounds = [...new Set(validLaps.map((l) => l.compound).filter(Boolean))] as string[];
            
            for (const compound of compounds) {
              const compoundLaps = validLaps.filter((l) => l.compound === compound);
              if (compoundLaps.length > 0) {
                const compoundTimes = compoundLaps.map((l) => l.lapTime);
                compoundPaces.push({
                  compound,
                  laps: compoundLaps.length,
                  averagePace: compoundTimes.reduce((a, b) => a + b, 0) / compoundTimes.length,
                  fastestLap: Math.min(...compoundTimes),
                });
              }
            }

            return {
              driverNumber,
              driverName: driver
                ? `${driver.firstName} ${driver.lastName}`
                : `Driver ${driverNumber}`,
              driverCode: driver?.code || `#${driverNumber}`,
              teamColor: getTeamColor(driver?.team || ''),
              laps: validLaps,
              stints,
              pitStops: pitLapNumbers,
              averagePace,
              fastestLap,
              consistency,
              compoundPaces,
            };
          } catch (err) {
            console.error(
              `Error loading pace data for driver ${driverNumber}:`,
              err
            );
            return null;
          }
        });

        const results = await Promise.all(pacePromises);
        const validResults = results.filter((r) => r !== null) as DriverPaceData[];
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
    setSelectedDrivers((prev) => {
      if (prev.includes(driverNumber)) {
        return prev.filter((d) => d !== driverNumber);
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
      Ferrari: '#E8002D',
      Mercedes: '#27F4D2',
      McLaren: '#FF8000',
      'Aston Martin': '#229971',
      Alpine: '#FF87BC',
      Williams: '#64C4FF',
      AlphaTauri: '#5E8FAA',
      'Alfa Romeo': '#C92D4B',
      'Haas F1 Team': '#B6BABD',
      RB: '#6692FF',
      'Kick Sauber': '#52E252',
    };
    return teamColors[team] || '#FFFFFF';
  };

  const getCompoundColor = (compound: string): string => {
    const compoundColors: Record<string, string> = {
      SOFT: '#e8002d',
      MEDIUM: '#f6e05e',
      HARD: '#e0e0e0',
      INTERMEDIATE: '#48bb78',
      WET: '#4299e1',
    };
    return compoundColors[compound?.toUpperCase()] || '#a0aec0';
  };

  const getCompoundShort = (compound: string): string => {
    const shorts: Record<string, string> = {
      SOFT: 'S',
      MEDIUM: 'M',
      HARD: 'H',
      INTERMEDIATE: 'I',
      WET: 'W',
    };
    return shorts[compound?.toUpperCase()] || '?';
  };

  // Prepare chart data
  const allLapNumbers = Array.from(
    new Set(paceData.flatMap((d) => d.laps.map((l) => l.lapNumber)))
  ).sort((a, b) => a - b);

  const chartData = allLapNumbers.map((lapNumber) => {
    const dataPoint: Record<string, number> = { lapNumber };
    paceData.forEach((driver) => {
      const lap = driver.laps.find((l) => l.lapNumber === lapNumber);
      if (lap) {
        dataPoint[driver.driverName] = lap.lapTime;
      }
    });
    return dataPoint;
  });

  // Calculate Y-axis domain for meaningful visualization
  const allTimes = paceData.flatMap((d) => d.laps.map((l) => l.lapTime));
  const minTime = allTimes.length > 0 ? Math.min(...allTimes) : 90;
  const maxTime = allTimes.length > 0 ? Math.max(...allTimes) : 100;
  const timeRange = maxTime - minTime;
  const padding = Math.max(timeRange * 0.1, 1); // At least 1 second padding
  const yMin = Math.floor(minTime - padding);
  const yMax = Math.ceil(maxTime + padding);

  // Calculate X-axis ticks - consistent intervals
  const maxLap = allLapNumbers.length > 0 ? Math.max(...allLapNumbers) : 57;
  const tickInterval = maxLap > 40 ? 5 : maxLap > 20 ? 2 : 1;
  const xTicks = Array.from(
    { length: Math.ceil(maxLap / tickInterval) + 1 },
    (_, i) => i * tickInterval
  ).filter((t) => t > 0 && t <= maxLap);

  const formatYAxis = (value: number) => {
    const mins = Math.floor(value / 60);
    const secs = (value % 60).toFixed(0);
    return `${mins}:${secs.padStart(2, '0')}`;
  };

  // Custom tooltip with dark theme
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    return (
      <div
        style={{
          background: '#1a202c',
          border: '1px solid #4a5568',
          borderRadius: '8px',
          padding: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        }}
      >
        <div
          style={{
            color: '#e0e0e0',
            fontWeight: 'bold',
            marginBottom: '8px',
            borderBottom: '1px solid #4a5568',
            paddingBottom: '6px',
          }}
        >
          Lap {label}
        </div>
        {payload.map((entry: any, index: number) => (
          <div
            key={index}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '16px',
              padding: '4px 0',
            }}
          >
            <span style={{ color: entry.color, fontWeight: '600' }}>
              {entry.name}
            </span>
            <span style={{ color: '#e0e0e0', fontFamily: 'monospace' }}>
              {formatLapTime(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (!selectedSession) {
    return (
      <div className="race-pace-analysis">
        <div className="no-session">
          <h2>No Session Selected</h2>
          <p>
            Please select a session from the Session Browser to analyze race
            pace.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="race-pace-analysis">
      <div className="race-pace-header">
        <h2>Race Pace Analysis</h2>
        <p className="subtitle">
          Compare lap time consistency and race pace between drivers
        </p>
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
            {drivers.map((driver) => (
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
                <div
                  className="driver-number"
                  style={{ color: getTeamColor(driver.team) }}
                >
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
              <div className="chart-legend">
                {safetyCarPeriods.length > 0 && (
                  <>
                    <span className="sc-indicator sc">🚗 Safety Car</span>
                    <span className="sc-indicator vsc">⚠️ Virtual SC</span>
                  </>
                )}
                {paceData.some((d) => d.pitStops.length > 0) && (
                  <span className="sc-indicator pit">🔧 Pit Stop</span>
                )}
              </div>
              {loading && (
                <div className="loading-spinner">Loading pace data...</div>
              )}
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                    
                    {/* Safety Car periods as shaded areas */}
                    {safetyCarPeriods.map((period, idx) => (
                      <ReferenceArea
                        key={`sc-${idx}`}
                        x1={period.startLap}
                        x2={period.endLap}
                        fill={period.type === 'SC' ? '#f6e05e' : '#fc8181'}
                        fillOpacity={0.2}
                        stroke={period.type === 'SC' ? '#f6e05e' : '#fc8181'}
                        strokeOpacity={0.5}
                      />
                    ))}
                    
                    {/* Pit stop markers as vertical dashed lines */}
                    {paceData.flatMap((driver) =>
                      driver.pitStops.map((lapNumber) => (
                        <ReferenceLine
                          key={`pit-${driver.driverNumber}-${lapNumber}`}
                          x={lapNumber}
                          stroke={driver.teamColor}
                          strokeDasharray="4 4"
                          strokeWidth={2}
                          strokeOpacity={0.7}
                        />
                      ))
                    )}
                    
                    <XAxis
                      dataKey="lapNumber"
                      ticks={xTicks}
                      tick={{ fill: '#a0aec0' }}
                      axisLine={{ stroke: '#4a5568' }}
                      tickLine={{ stroke: '#4a5568' }}
                      label={{
                        value: 'Lap Number',
                        position: 'insideBottom',
                        offset: -10,
                        fill: '#a0aec0',
                      }}
                    />
                    <YAxis
                      domain={[yMin, yMax]}
                      tickFormatter={formatYAxis}
                      tick={{ fill: '#a0aec0' }}
                      axisLine={{ stroke: '#4a5568' }}
                      tickLine={{ stroke: '#4a5568' }}
                      label={{
                        value: 'Lap Time',
                        angle: -90,
                        position: 'insideLeft',
                        fill: '#a0aec0',
                      }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      wrapperStyle={{ color: '#e0e0e0' }}
                      formatter={(value) => (
                        <span style={{ color: '#e0e0e0' }}>{value}</span>
                      )}
                    />
                    {paceData.map((driver) => (
                      <Line
                        key={driver.driverNumber}
                        type="monotone"
                        dataKey={driver.driverName}
                        stroke={driver.teamColor}
                        strokeWidth={2}
                        dot={{ r: 3, fill: driver.teamColor }}
                        activeDot={{ r: 6 }}
                        connectNulls
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
                      <th>Laps</th>
                      <th>Average Pace</th>
                      <th>Fastest Lap</th>
                      <th>Consistency</th>
                      <th>Delta to Best</th>
                      <th>Stints</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paceData
                      .sort((a, b) => a.averagePace - b.averagePace)
                      .map((driver, index) => {
                        const bestAverage = paceData.sort(
                          (a, b) => a.averagePace - b.averagePace
                        )[0].averagePace;
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
                            <td>
                              <div className="stint-badges">
                                {driver.stints.map((stint, idx) => (
                                  <span
                                    key={idx}
                                    className="stint-badge"
                                    style={{
                                      backgroundColor: getCompoundColor(stint.compound),
                                      color: stint.compound?.toUpperCase() === 'HARD' ? '#1a202c' : '#fff',
                                    }}
                                    title={`${stint.compound}: Laps ${stint.lapStart}-${stint.lapEnd}`}
                                  >
                                    {getCompoundShort(stint.compound)}
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Compound Pace Analysis */}
            {paceData.some((d) => d.compoundPaces.length > 0) && (
              <div className="pace-stats-section">
                <h3>Pace by Tire Compound</h3>
                <div className="stats-table-container">
                  <table className="stats-table compound-table">
                    <thead>
                      <tr>
                        <th>Driver</th>
                        {['SOFT', 'MEDIUM', 'HARD'].map((compound) => (
                          <th key={compound} className="compound-header">
                            <span
                              className="compound-dot"
                              style={{ backgroundColor: getCompoundColor(compound) }}
                            />
                            {compound}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paceData
                        .sort((a, b) => a.averagePace - b.averagePace)
                        .map((driver) => {
                          // Find best pace for each compound across all drivers
                          const getBestForCompound = (compound: string) => {
                            const allPaces = paceData
                              .flatMap((d) => d.compoundPaces)
                              .filter((cp) => cp.compound.toUpperCase() === compound);
                            return allPaces.length > 0
                              ? Math.min(...allPaces.map((cp) => cp.averagePace))
                              : null;
                          };

                          return (
                            <tr key={driver.driverNumber}>
                              <td>
                                <div className="driver-cell">
                                  <div
                                    className="driver-color-bar"
                                    style={{ backgroundColor: driver.teamColor }}
                                  />
                                  <span>{driver.driverCode}</span>
                                </div>
                              </td>
                              {['SOFT', 'MEDIUM', 'HARD'].map((compound) => {
                                const compoundPace = driver.compoundPaces.find(
                                  (cp) => cp.compound.toUpperCase() === compound
                                );
                                const bestPace = getBestForCompound(compound);
                                const isBest =
                                  compoundPace &&
                                  bestPace &&
                                  Math.abs(compoundPace.averagePace - bestPace) < 0.001;

                                return (
                                  <td
                                    key={compound}
                                    className={isBest ? 'best-time' : ''}
                                  >
                                    {compoundPace ? (
                                      <div className="compound-pace-cell">
                                        <span className="pace-value">
                                          {formatLapTime(compoundPace.averagePace)}
                                        </span>
                                        <span className="lap-count">
                                          ({compoundPace.laps} laps)
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="no-data">-</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="pace-insights">
              <h4>Insights</h4>
              <ul>
                <li>
                  📊 <strong>Average Pace:</strong> Mean lap time across all
                  valid laps
                </li>
                <li>
                  ⚡ <strong>Fastest Lap:</strong> Single fastest lap time
                </li>
                <li>
                  📈 <strong>Consistency:</strong> Lower values indicate more
                  consistent pace (standard deviation)
                </li>
                <li>
                  🎯 <strong>Delta to Best:</strong> Time difference to the
                  driver with best average pace
                </li>
                <li>
                  🔧 Outliers (pit stops, safety cars) are{' '}
                  {excludeOutliers ? 'excluded' : 'included'}
                </li>
                {safetyCarPeriods.length > 0 && (
                  <li>
                    🚗 Yellow shading = Safety Car periods, Red shading = VSC
                    periods
                  </li>
                )}
                {paceData.some((d) => d.pitStops.length > 0) && (
                  <li>
                    🔧 Dashed vertical lines indicate pit stops (color matches
                    driver)
                  </li>
                )}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
