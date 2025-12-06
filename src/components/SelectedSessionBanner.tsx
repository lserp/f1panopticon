import { useSessionStore } from '../store/sessionStore';
import './SelectedSessionBanner.css';

export const SelectedSessionBanner: React.FC = () => {
  const { selectedSession, setSelectedSession } = useSessionStore();

  if (!selectedSession) {
    return null;
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="selected-session-banner">
      <div className="banner-content">
        <span className="banner-label">Selected Session:</span>
        <span className="banner-circuit">{selectedSession.circuitName}</span>
        <span className="banner-type">{selectedSession.sessionType}</span>
        <span className="banner-date">{formatDate(selectedSession.date)}</span>
        <span className="banner-season">{selectedSession.season}</span>
      </div>
      <button 
        className="banner-clear"
        onClick={() => setSelectedSession(null)}
        title="Clear selection"
      >
        ✕
      </button>
    </div>
  );
};
