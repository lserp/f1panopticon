import { useEffect, useState } from 'react';
import { cacheManager, type CacheProgress } from '../services/cacheManager';
import './CacheInitializer.css';

export const CacheInitializer: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState(false);
  const [progress, setProgress] = useState<CacheProgress | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // DISABLED: Automatic cache initialization causes CORS errors
    // The Ergast API blocks CORS requests from browsers
    // Cache will be populated on-demand as users browse sessions
    
    console.log('ℹ️ Automatic cache initialization disabled due to CORS restrictions');
    console.log('ℹ️ Historical data will be cached on-demand as you browse');
    
    // Check if cache is already populated
    const checkCache = async () => {
      try {
        const stats = await cacheManager.getCacheStats();
        if (stats.seasons.length > 0) {
          console.log(`✓ Cache contains ${stats.totalSessions} sessions from ${stats.seasons.length} seasons`);
        }
      } catch (err) {
        console.log('Could not check cache stats:', err);
      }
    };
    
    checkCache();
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  const handleCancel = () => {
    cacheManager.abortCaching();
    setIsInitializing(false);
    setProgress(null);
    setIsDismissed(true);
  };

  // Component disabled - no UI to show
  return null;

  /* DISABLED - Keeping code for future use
  if (!isInitializing || isDismissed) {
    return null;
  }

  return (
    <div className="cache-initializer">
      <div className="cache-initializer-content">
        <div className="cache-initializer-header">
          <h3>📦 Caching Historical Data</h3>
          <button 
            className="cache-initializer-close"
            onClick={handleDismiss}
            aria-label="Minimize"
            title="Minimize (caching continues in background)"
          >
            −
          </button>
        </div>

        {progress ? (
          <div className="cache-initializer-progress">
            <div className="progress-info">
              <span className="progress-season">Season {progress.season}</span>
              <span className="progress-percentage">{progress.percentage}%</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-bar-fill"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            <p className="progress-message">{progress.message}</p>
          </div>
        ) : (
          <div className="cache-initializer-loading">
            <p>Preparing to cache historical data...</p>
          </div>
        )}

        <div className="cache-initializer-footer">
          <p className="cache-initializer-note">
            This happens once to speed up future browsing. You can continue using the app.
          </p>
          <button 
            className="cache-initializer-cancel"
            onClick={handleCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
  */
};
