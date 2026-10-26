import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useAirspace } from '../context/AirspaceContext';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  onOpenIncidentModal: () => void;
  onOpenWatchlistModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  onOpenIncidentModal,
  onOpenWatchlistModal,
}) => {
  const { user, profile, demoOperator, signOutOperator } = useAuth();
  const { tracks, incidents, watchlist, firebaseConnected } = useAirspace();

  const alertCount = tracks.filter((t) => t.level === 'critical' || t.level === 'high').length;
  const watchlistCount = Object.keys(watchlist).length;

  const scrollToSection = (id: string, viewName: string) => {
    setActiveView(viewName);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <aside className="sidebar" aria-label="Primary navigation">
      {/* Brand lockup */}
      <div className="brand-lockup flex items-center gap-3">
        <img
          src="/assets/logo.png"
          alt="SKYLOCK SENITAL"
          className="w-9 h-9 object-contain drop-shadow-[0_0_8px_rgba(0,167,189,0.5)] shrink-0"
        />
        <div>
          <p className="brand-name font-mono font-bold tracking-wider text-[#f7f7f3]">SKYLOCK</p>
          <p className="brand-subtitle font-mono text-[9px] tracking-widest text-[#00a7bd]">SENITAL</p>
        </div>
      </div>

      <div className="mission-tag">
        <span className="pulse-dot"></span>
        <span>OPS-01 · SKYLOCK SENITAL</span>
      </div>

      {/* Nav items */}
      <nav className="primary-nav space-y-1">
        <button
          className={`nav-item ${activeView === 'overview' ? 'active' : ''}`}
          onClick={() => scrollToSection('overview-section', 'overview')}
        >
          <span className="nav-icon">⌁</span>
          <span>Overview</span>
          <kbd>01</kbd>
        </button>

        <button
          className={`nav-item ${activeView === 'tracks' ? 'active' : ''}`}
          onClick={() => scrollToSection('tracks-section', 'tracks')}
        >
          <span className="nav-icon">◈</span>
          <span>Track library</span>
          <kbd>02</kbd>
        </button>

        <button
          className={`nav-item ${activeView === 'alerts' ? 'active' : ''}`}
          onClick={() => scrollToSection('alerts-section', 'alerts')}
        >
          <span className="nav-icon">!</span>
          <span>Alert queue</span>
          {alertCount > 0 && <span className="nav-count">{alertCount}</span>}
        </button>

        <button
          className={`nav-item ${activeView === 'location' ? 'active' : ''}`}
          onClick={() => scrollToSection('location-section', 'location')}
        >
          <span className="nav-icon">⌖</span>
          <span>Location intel</span>
          <kbd>03</kbd>
        </button>

        <button
          className={`nav-item ${activeView === 'systems' ? 'active' : ''}`}
          onClick={() => scrollToSection('systems-section', 'systems')}
        >
          <span className="nav-icon">◌</span>
          <span>Investigation</span>
          <kbd>04</kbd>
        </button>

        <button
          className={`nav-item ${activeView === 'uav' ? 'active' : ''}`}
          onClick={() => scrollToSection('tactical-drone-section', 'uav')}
        >
          <span className="nav-icon text-[#00ff66]">✈</span>
          <span>3D Tactical Drone</span>
          <kbd>05</kbd>
        </button>

        {/* Dedicated Standalone Pop-out Pages */}
        <div className="pt-2 mt-2 border-t border-[#d7e6eb]/15">
          <div className="px-3 py-1 text-[9px] font-mono font-bold text-[#8aa0a8] tracking-wider uppercase">
            STANDALONE FULL PAGES
          </div>
          <a
            href="?view=radar"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-item text-[#72dbc2] hover:bg-[#00a7bd]/15 w-full flex items-center justify-between transition-colors"
            title="Open Operational Radar in a new window"
          >
            <div className="flex items-center gap-2">
              <span className="nav-icon text-[#00ff66]">◈</span>
              <span>Radar View</span>
            </div>
            <span className="text-[#00ff66] font-bold text-xs">↗</span>
          </a>

          <a
            href="?view=location-intel"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-item text-[#72dbc2] hover:bg-[#00a7bd]/15 w-full flex items-center justify-between transition-colors"
            title="Open Open Location Intelligence in a new window"
          >
            <div className="flex items-center gap-2">
              <span className="nav-icon text-[#00ff66]">⌖</span>
              <span>Location Intel</span>
            </div>
            <span className="text-[#00ff66] font-bold text-xs">↗</span>
          </a>
        </div>

        {/* Real-time incident logs and watchlist */}
        <div className="pt-2 mt-2 border-t border-[#d7e6eb]/15">
          <button
            className="nav-item text-[#d65458] hover:bg-[#d65458]/10 hover:text-[#d65458] w-full"
            onClick={onOpenIncidentModal}
          >
            <span className="nav-icon">⚠</span>
            <span>Cloud Incidents</span>
            {incidents.length > 0 && (
              <span className="nav-count bg-[#d65458]">{incidents.length}</span>
            )}
          </button>

          <button
            className="nav-item text-[#e59c2b] hover:bg-[#e59c2b]/10 hover:text-[#e59c2b] w-full"
            onClick={onOpenWatchlistModal}
          >
            <span className="nav-icon">★</span>
            <span>Watchlist</span>
            {watchlistCount > 0 && (
              <span className="nav-count bg-[#e59c2b] text-[#081a27] font-bold">
                {watchlistCount}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* Visual feed */}
      <div className="sidebar-asset mt-auto">
        <img src="/assets/helicopter.webp" alt="Helicopter in flight" />
        <div className="asset-caption">
          <span>VISUAL FEED</span>
          <strong>ROTARY WING / 02</strong>
        </div>
      </div>

      {/* Operator session footer */}
      <div className="sidebar-footer">
        <div className="operator-row flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="operator-avatar">
              {user ? (profile?.callsign?.slice(0, 2) || 'OP') : 'OP'}
            </div>
            <div>
              <strong>{user ? (profile?.displayName || 'Commander') : demoOperator.callsign}</strong>
              <span className="text-[9px] text-[#8aa0a8]">
                {user ? user.email : demoOperator.role}
              </span>
            </div>
          </div>
          <span
            className={`online-dot ${firebaseConnected ? 'bg-[#1da98a]' : 'bg-[#e59c2b]'}`}
            title={firebaseConnected ? 'Firebase Connected' : 'Connecting to Firebase'}
          ></span>
        </div>

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#d7e6eb]/10">
          <p className="text-[9px] text-[#8aa0a8] m-0">
            {user ? 'Firebase Auth: Active' : 'Local Demo Mode'}
          </p>
          <button
            onClick={() => signOutOperator()}
            className="text-[9px] font-mono text-[#d65458] hover:underline cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
};
