import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { KeyboardNavigationProvider } from './contexts/KeyboardNavigationContext';
import { KeyboardShortcutsHelp } from './components/KeyboardShortcutsHelp';
import { SelectedSessionBanner } from './components/SelectedSessionBanner';
import { CacheInitializer } from './components/CacheInitializer';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { SessionBrowser } from './pages/SessionBrowser';
import { SessionReplay } from './pages/SessionReplay';
import { SimpleTelemetry } from './pages/SimpleTelemetry';
import { TelemetryComparison } from './pages/TelemetryComparison';
import { SectorAnalysis } from './pages/SectorAnalysis';
import { RacePaceAnalysis } from './pages/RacePaceAnalysis';
import { Settings } from './pages/Settings';
import './App.css';

function Navigation() {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <nav className="app-nav" role="navigation" aria-label="Main navigation">
      <Link 
        to="/sessions" 
        className={`nav-link ${isActive('/sessions') ? 'active' : ''}`}
        aria-current={isActive('/sessions') ? 'page' : undefined}
      >
        Session Browser
      </Link>
      <Link 
        to="/telemetry" 
        className={`nav-link ${isActive('/telemetry') ? 'active' : ''}`}
        aria-current={isActive('/telemetry') ? 'page' : undefined}
      >
        Lap Times
      </Link>
      <Link 
        to="/telemetry-viz" 
        className={`nav-link ${isActive('/telemetry-viz') ? 'active' : ''}`}
        aria-current={isActive('/telemetry-viz') ? 'page' : undefined}
      >
        Telemetry Viz
      </Link>
      <Link 
        to="/sector-analysis" 
        className={`nav-link ${isActive('/sector-analysis') ? 'active' : ''}`}
        aria-current={isActive('/sector-analysis') ? 'page' : undefined}
      >
        Sector Analysis
      </Link>
      <Link 
        to="/race-pace" 
        className={`nav-link ${isActive('/race-pace') ? 'active' : ''}`}
        aria-current={isActive('/race-pace') ? 'page' : undefined}
      >
        Race Pace
      </Link>
      <Link 
        to="/replay" 
        className={`nav-link ${isActive('/replay') ? 'active' : ''}`}
        aria-current={isActive('/replay') ? 'page' : undefined}
      >
        Session Replay
      </Link>
      <Link 
        to="/settings" 
        className={`nav-link ${isActive('/settings') ? 'active' : ''}`}
        aria-current={isActive('/settings') ? 'page' : undefined}
      >
        Settings
      </Link>
    </nav>
  );
}

function AppContent() {
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  // Global keyboard shortcuts
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: '?',
        shift: true,
        description: 'Show keyboard shortcuts help',
        action: () => setShowShortcutsHelp(true),
      },
      {
        key: 'Escape',
        description: 'Close modal or dialog',
        action: () => setShowShortcutsHelp(false),
        preventDefault: false,
      },
    ],
  });

  return (
    <div className="app-container">
      <a href="#main-content" className="skip-to-main">
        Skip to main content
      </a>
      <header className="app-header" role="banner">
        <h1>F1 Analysis Platform</h1>
        <button
          className="help-button"
          onClick={() => setShowShortcutsHelp(true)}
          aria-label="Show keyboard shortcuts"
          title="Keyboard shortcuts (Shift+?)"
        >
          ?
        </button>
      </header>
      <Navigation />
      <SelectedSessionBanner />
      <main id="main-content" className="app-main" role="main">
        <Routes>
          <Route path="/" element={<Navigate to="/sessions" replace />} />
          <Route path="/sessions" element={<SessionBrowser />} />
          <Route path="/telemetry" element={<SimpleTelemetry />} />
          <Route path="/telemetry-viz" element={<TelemetryComparison />} />
          <Route path="/sector-analysis" element={<SectorAnalysis />} />
          <Route path="/race-pace" element={<RacePaceAnalysis />} />
          <Route path="/replay" element={<SessionReplay />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
      <KeyboardShortcutsHelp
        isOpen={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
      />
      <CacheInitializer />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <KeyboardNavigationProvider>
        <AppContent />
      </KeyboardNavigationProvider>
    </BrowserRouter>
  );
}

export default App;
