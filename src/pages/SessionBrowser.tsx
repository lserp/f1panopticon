import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SessionData } from '../types';
import { useSessionData } from '../hooks/useSessionData';
import { useSessionStore } from '../store/sessionStore';
import './SessionBrowser.css';

interface SessionBrowserProps {
  onSessionSelect?: (session: SessionData) => void;
}

interface FilterState {
  season: string;
  race: string;
  driver: string;
  sessionType: string;
  searchQuery: string;
}

export const SessionBrowser: React.FC<SessionBrowserProps> = ({ 
  onSessionSelect 
}) => {
  // Default to 2025 (current season)
  const [selectedSeason, setSelectedSeason] = useState<number>(2025);
  const navigate = useNavigate();
  const { setSelectedSession, selectedSession } = useSessionStore();
  
  const { sessions, loading, error, refetch } = useSessionData({ 
    season: selectedSeason,
    autoFetch: true 
  });

  const handleSessionClick = (session: SessionData) => {
    setSelectedSession(session);
    if (onSessionSelect) {
      onSessionSelect(session);
    }
    // Navigate to telemetry analysis with the selected session
    navigate('/telemetry');
  };
  const [filters, setFilters] = useState<FilterState>({
    season: '',
    race: '',
    driver: '',
    sessionType: '',
    searchQuery: '',
  });

  // Extract unique values for filter dropdowns
  const filterOptions = useMemo(() => {
    const seasons = Array.from(new Set(sessions.map((s) => s.season))).sort((a, b) => b - a);
    const races = Array.from(new Set(sessions.map((s) => s.circuitName))).sort();
    const drivers = Array.from(
      new Set(sessions.flatMap((s) => s.drivers.map((d) => `${d.firstName} ${d.lastName}`)))
    ).sort();
    const sessionTypes = Array.from(new Set(sessions.map((s) => s.sessionType))).sort();

    return { seasons, races, drivers, sessionTypes };
  }, [sessions]);

  // Filter sessions based on current filter state
  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      // Season filter
      if (filters.season && session.season.toString() !== filters.season) {
        return false;
      }

      // Race filter
      if (filters.race && session.circuitName !== filters.race) {
        return false;
      }

      // Driver filter
      if (filters.driver) {
        const hasDriver = session.drivers.some(
          (d) => `${d.firstName} ${d.lastName}` === filters.driver
        );
        if (!hasDriver) return false;
      }

      // Session type filter
      if (filters.sessionType && session.sessionType !== filters.sessionType) {
        return false;
      }

      // Search query filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesCircuit = session.circuitName.toLowerCase().includes(query);
        const matchesDriver = session.drivers.some(
          (d) =>
            d.firstName.toLowerCase().includes(query) ||
            d.lastName.toLowerCase().includes(query) ||
            d.code.toLowerCase().includes(query)
        );
        if (!matchesCircuit && !matchesDriver) return false;
      }

      return true;
    });
  }, [sessions, filters]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      season: '',
      race: '',
      driver: '',
      sessionType: '',
      searchQuery: '',
    });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="session-browser">
      <div className="session-browser-header">
        <h1>Session Browser</h1>
        {loading ? (
          <p className="session-count">Loading sessions...</p>
        ) : error ? (
          <p className="session-count error">Error loading sessions</p>
        ) : (
          <p className="session-count">
            Showing {filteredSessions.length} of {sessions.length} sessions
          </p>
        )}
      </div>

      {error && (
        <div className="error-banner">
          <div className="error-content">
            <h3>⚠️ Unable to Load F1 Data</h3>
            <p><strong>Error:</strong> {error.message}</p>
            <p className="error-details">
              The F1 data APIs (OpenF1 and Ergast) are currently unavailable. This could be due to:
            </p>
            <ul className="error-list">
              <li>API services are temporarily down</li>
              <li>Network connectivity issues</li>
              <li>API rate limits have been exceeded</li>
            </ul>
            <p className="error-action">Please try again in a few minutes.</p>
          </div>
          <button onClick={refetch} className="retry-btn">Retry Connection</button>
        </div>
      )}

      <div className="filter-controls">
        <div className="filter-row">
          <div className="filter-group">
            <label htmlFor="search">Search</label>
            <input
              id="search"
              type="text"
              placeholder="Search by circuit or driver..."
              value={filters.searchQuery}
              onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-group">
            <label htmlFor="season">Season</label>
            <select
              id="season"
              value={selectedSeason}
              onChange={(e) => {
                const newSeason = parseInt(e.target.value);
                setSelectedSeason(newSeason);
                setFilters({ ...filters, season: e.target.value });
              }}
            >
              {[2025, 2024, 2023, 2022, 2021, 2020].map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="race">Race</label>
            <select
              id="race"
              value={filters.race}
              onChange={(e) => handleFilterChange('race', e.target.value)}
            >
              <option value="">All Races</option>
              {filterOptions.races.map((race) => (
                <option key={race} value={race}>
                  {race}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="driver">Driver</label>
            <select
              id="driver"
              value={filters.driver}
              onChange={(e) => handleFilterChange('driver', e.target.value)}
            >
              <option value="">All Drivers</option>
              {filterOptions.drivers.map((driver) => (
                <option key={driver} value={driver}>
                  {driver}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="sessionType">Session Type</label>
            <select
              id="sessionType"
              value={filters.sessionType}
              onChange={(e) => handleFilterChange('sessionType', e.target.value)}
            >
              <option value="">All Types</option>
              {filterOptions.sessionTypes.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <button onClick={clearFilters} className="clear-filters-btn">
            Clear Filters
          </button>
        </div>
      </div>

      <div className="session-list">
        {loading ? (
          <div className="loading-sessions">
            <div className="spinner"></div>
            <p>Loading F1 session data...</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="no-sessions">
            <p>No sessions found matching your filters.</p>
          </div>
        ) : (
          filteredSessions.map((session) => (
            <div 
              key={session.id} 
              className={`session-card ${selectedSession?.id === session.id ? 'selected' : ''}`}
              onClick={() => handleSessionClick(session)}
            >
              <div className="session-card-header">
                <h3>{session.circuitName}</h3>
                <span className="session-type-badge">{session.sessionType}</span>
              </div>

              <div className="session-card-body">
                <div className="session-info">
                  <div className="info-item">
                    <span className="info-label">Season:</span>
                    <span className="info-value">{session.season}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Round:</span>
                    <span className="info-value">{session.round}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Date:</span>
                    <span className="info-value">{formatDate(session.date)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Drivers:</span>
                    <span className="info-value">{session.drivers.length}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Laps:</span>
                    <span className="info-value">{session.laps.length}</span>
                  </div>
                </div>

                <div className="session-attribution" data-testid="data-attribution">
                  <span className="attribution-label">Data Source:</span>
                  <span className="attribution-value">{session.source}</span>
                  <span className="attribution-time">
                    Fetched: {formatDate(session.fetchedAt)} at {formatTime(session.fetchedAt)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
