import { useState } from 'react';
import type { SessionData, StrategyPlan, PitExitAnalysis } from '../types';
import { StrategyTimeline } from '../components/StrategyTimeline';
import { StrategyComparison } from '../components/StrategyComparison';
import { TrackMap } from '../components/TrackMap';
import './StrategyAnalysis.css';

interface StrategyAnalysisProps {
  session: SessionData;
  strategies: StrategyPlan[];
  pitExitAnalyses?: PitExitAnalysis[];
}

export const StrategyAnalysis: React.FC<StrategyAnalysisProps> = ({
  session,
  strategies,
  pitExitAnalyses = [],
}) => {
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyPlan | null>(
    strategies[0] || null
  );
  const [selectedPitExit, setSelectedPitExit] = useState<PitExitAnalysis | null>(null);
  const [comparisonMode, setComparisonMode] = useState<boolean>(false);
  const [comparisonStrategies, setComparisonStrategies] = useState<StrategyPlan[]>([]);

  const handleStrategySelect = (strategy: StrategyPlan) => {
    setSelectedStrategy(strategy);
    if (comparisonMode && !comparisonStrategies.includes(strategy)) {
      setComparisonStrategies([...comparisonStrategies, strategy]);
    }
  };

  const handlePitExitSelect = (pitExit: PitExitAnalysis) => {
    setSelectedPitExit(pitExit);
  };

  const toggleComparisonMode = () => {
    if (comparisonMode) {
      setComparisonStrategies([]);
    } else if (selectedStrategy) {
      setComparisonStrategies([selectedStrategy]);
    }
    setComparisonMode(!comparisonMode);
  };

  const removeFromComparison = (strategy: StrategyPlan) => {
    setComparisonStrategies(comparisonStrategies.filter((s) => s !== strategy));
  };

  return (
    <div className="strategy-analysis">
      <div className="analysis-header">
        <h1>Strategy Analysis</h1>
        <div className="session-info">
          <span className="circuit-name">{session.circuitName}</span>
          <span className="session-details">
            {session.season} - Round {session.round} - {session.sessionType}
          </span>
        </div>
      </div>

      <div className="strategy-layout">
        <aside className="strategy-sidebar">
          <div className="sidebar-section">
            <div className="section-header">
              <h2>Strategies</h2>
              <button onClick={toggleComparisonMode} className="comparison-toggle-btn">
                {comparisonMode ? 'Exit Comparison' : 'Compare'}
              </button>
            </div>

            {comparisonMode && comparisonStrategies.length > 0 && (
              <div className="comparison-list">
                <h3>Comparing ({comparisonStrategies.length})</h3>
                {comparisonStrategies.map((strategy, index) => (
                  <div key={index} className="comparison-item">
                    <span>Strategy {index + 1}</span>
                    <button
                      onClick={() => removeFromComparison(strategy)}
                      className="remove-btn"
                      aria-label="Remove from comparison"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="strategy-list">
              {strategies.map((strategy, index) => {
                const isSelected = selectedStrategy === strategy;
                const isInComparison = comparisonStrategies.includes(strategy);

                return (
                  <button
                    key={index}
                    onClick={() => handleStrategySelect(strategy)}
                    className={`strategy-button ${isSelected ? 'selected' : ''} ${isInComparison ? 'in-comparison' : ''}`}
                  >
                    <div className="strategy-header">
                      <span className="strategy-name">Strategy {index + 1}</span>
                      <span className={`risk-badge risk-${strategy.riskLevel}`}>
                        {strategy.riskLevel}
                      </span>
                    </div>
                    <div className="strategy-details">
                      <div className="detail-item">
                        <span className="detail-label">Pit Stops:</span>
                        <span className="detail-value">{strategy.pitStops.length}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Est. Finish:</span>
                        <span className="detail-value">
                          {formatTime(strategy.estimatedFinishTime)}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {pitExitAnalyses.length > 0 && (
            <div className="sidebar-section">
              <h2>Pit Exit Analysis</h2>
              <div className="pit-exit-list">
                {pitExitAnalyses.map((pitExit, index) => (
                  <button
                    key={index}
                    onClick={() => handlePitExitSelect(pitExit)}
                    className={`pit-exit-button ${selectedPitExit === pitExit ? 'selected' : ''}`}
                  >
                    <div className="pit-exit-header">
                      <span className="pit-lap">Lap {pitExit.pitLap}</span>
                      <span className={`traffic-badge traffic-${pitExit.trafficImpact}`}>
                        {pitExit.trafficImpact}
                      </span>
                    </div>
                    <div className="pit-exit-details">
                      <div className="detail-item">
                        <span className="detail-label">Position:</span>
                        <span className="detail-value">
                          {pitExit.positionBefore} → {pitExit.positionAfter}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Gap Ahead:</span>
                        <span className="detail-value">{pitExit.gapAhead.toFixed(2)}s</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        <main className="strategy-content">
          {comparisonMode && comparisonStrategies.length > 1 ? (
            <div className="comparison-view">
              <h2>Strategy Comparison</h2>
              <StrategyComparison strategies={comparisonStrategies} />
            </div>
          ) : selectedStrategy ? (
            <>
              <div className="timeline-section">
                <h2>Strategy Timeline</h2>
                <StrategyTimeline strategy={selectedStrategy} sessionData={session} />
              </div>

              {selectedPitExit && (
                <div className="pit-exit-section">
                  <h2>Pit Exit Analysis - Lap {selectedPitExit.pitLap}</h2>
                  <div className="pit-exit-content">
                    <div className="pit-exit-map">
                      <TrackMap
                        circuitId={session.circuitId}
                        currentDistance={selectedPitExit.exitDistance}
                        highlightedPositions={[
                          ...selectedPitExit.carsAhead.map((car) => ({
                            distance: car.distance,
                            label: car.driverId,
                          })),
                          ...selectedPitExit.carsBehind.map((car) => ({
                            distance: car.distance,
                            label: car.driverId,
                          })),
                          {
                            distance: selectedPitExit.exitDistance,
                            label: 'Exit',
                            highlight: true,
                          },
                        ]}
                      />
                    </div>

                    <div className="pit-exit-stats">
                      <div className="stat-card">
                        <h3>Position Change</h3>
                        <div className="position-change">
                          <span className="position-before">P{selectedPitExit.positionBefore}</span>
                          <span className="arrow">→</span>
                          <span className="position-after">P{selectedPitExit.positionAfter}</span>
                        </div>
                      </div>

                      <div className="stat-card">
                        <h3>Traffic Impact</h3>
                        <span className={`impact-badge impact-${selectedPitExit.trafficImpact}`}>
                          {selectedPitExit.trafficImpact.toUpperCase()}
                        </span>
                      </div>

                      <div className="stat-card">
                        <h3>Gaps</h3>
                        <div className="gaps">
                          <div className="gap-item">
                            <span className="gap-label">Ahead:</span>
                            <span className="gap-value">
                              {selectedPitExit.gapAhead.toFixed(2)}s
                            </span>
                          </div>
                          <div className="gap-item">
                            <span className="gap-label">Behind:</span>
                            <span className="gap-value">
                              {selectedPitExit.gapBehind.toFixed(2)}s
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="no-selection">
              <p>Select a strategy to view details</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
