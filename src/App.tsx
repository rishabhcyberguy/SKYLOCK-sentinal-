import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AirspaceProvider, useAirspace, scenarioMeta } from './context/AirspaceContext';
import { SystemGate } from './components/SystemGate';
import { Topbar } from './components/Topbar';
import { Sidebar } from './components/Sidebar';
import { RadarStage } from './components/RadarStage';
import { ThreatQueue } from './components/ThreatQueue';
import { TrackCatalogue } from './components/TrackCatalogue';
import { InvestigationLens } from './components/InvestigationLens';
import { LocationIntel } from './components/LocationIntel';
import { IncidentModal } from './components/IncidentModal';
import { WatchlistModal } from './components/WatchlistModal';
import { StandaloneRadarPage } from './components/StandaloneRadarPage';
import { StandaloneLocationPage } from './components/StandaloneLocationPage';
import { TacticalDrone3D } from './components/TacticalDrone3D';
import { ScenarioType, SpeedType } from './types/airspace';

const AirspaceDashboard: React.FC = () => {
  const { user, isDemoSession } = useAuth();
  const {
    tracks,
    scenario,
    setScenario,
    speed,
    setSpeed,
    paused,
    togglePause,
    resetSimulation,
    tick,
    setSelectedTrackId,
    firebaseConnected,
  } = useAirspace();

  const [activeView, setActiveView] = useState<string>('overview');
  const [booting, setBooting] = useState<boolean>(true);
  const [isIncidentOpen, setIsIncidentOpen] = useState<boolean>(false);
  const [isWatchlistOpen, setIsWatchlistOpen] = useState<boolean>(false);

  // Pre-fill target for incident modal if opened from investigation lens
  const [incidentTarget, setIncidentTarget] = useState<{
    trackId: string;
    callsign: string;
    level: string;
  }>({
    trackId: 'AX-204',
    callsign: 'RAVEN',
    level: 'critical',
  });

  const [standaloneView, setStandaloneView] = useState<string | null>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('view') || urlParams.get('page');
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const autostart = urlParams.get('autostart') === '1';

    const timer = setTimeout(() => {
      setBooting(false);
    }, autostart ? 100 : 1200);

    return () => clearTimeout(timer);
  }, []);

  if (standaloneView === 'radar') {
    return <StandaloneRadarPage />;
  }

  if (standaloneView === 'location-intel' || standaloneView === 'location') {
    return <StandaloneLocationPage />;
  }

  const openIncidentForTrack = (trackId: string, callsign: string, level: string) => {
    setIncidentTarget({ trackId, callsign, level });
    setIsIncidentOpen(true);
  };

  const criticalAlerts = tracks.filter((t) => t.level === 'critical' || t.level === 'high');

  return (
    <>
      {/* System Access Security Gate */}
      <SystemGate onAccessGranted={() => setBooting(false)} />

      {/* Terminal Boot Sequence Loader */}
      <div
        className={`boot-loader ${!booting ? 'is-ready' : ''}`}
        id="boot-loader"
        role="status"
        aria-live="polite"
      >
        <div className="terminal-loader">
          <div className="terminal-header">
            <div className="terminal-title">SKYLOCK / BOOT SEQUENCE</div>
            <div className="terminal-controls">
              <span className="control close"></span>
              <span className="control minimize"></span>
              <span className="control maximize"></span>
            </div>
          </div>
          <div className="text">connecting cloud firestore...</div>
        </div>
        <div className="boot-caption">
          <span className="pulse-dot"></span>INITIALIZING DEFENSE AIRSPACE PICTURE
        </div>
      </div>

      {/* Main Command Shell */}
      <div className="app-shell">
        <Sidebar
          activeView={activeView}
          setActiveView={setActiveView}
          onOpenIncidentModal={() => setIsIncidentOpen(true)}
          onOpenWatchlistModal={() => setIsWatchlistOpen(true)}
        />

        <main className="main-content">
          <Topbar />

          {/* Hero Banner with Stock Orbital Asset */}
          <section className="hero-banner" id="overview-section">
            <img className="hero-image" src="/assets/earth-orbit.webp" alt="Night Earth from orbit" />
            <div className="hero-scrim"></div>
            <div className="hero-content">
              <div className="eyebrow">
                <span className="eyebrow-line"></span>COUNTER-DRONE MONITORING / REAL-TIME CLOUD DECK
              </div>
              <h1>
                See the airspace
                <br />
                <em>before it becomes a threat.</em>
              </h1>
              <p>
                Track signals, project trajectories, and store synchronized incident logs with real-time Firebase database.
              </p>
              <div className="hero-tags flex flex-wrap gap-2 pt-2">
                <span className="tag tag-cyan flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${firebaseConnected ? 'bg-[#1da98a]' : 'bg-[#e59c2b]'}`}></span>
                  FIRESTORE DB {firebaseConnected ? 'ONLINE' : 'CONNECTING'}
                </span>
                <span className="tag">PREDICTIVE PATHING</span>
                <span className="tag">LOW-BANDWIDTH READY</span>
              </div>
            </div>
            <div className="hero-asset-card">
              <img src="/assets/fighter.webp" alt="Fighter aircraft on runway" />
              <div className="hero-asset-overlay">
                <span>REFERENCE PLATE / 01</span>
                <strong>FIXED-WING PROFILE</strong>
                <small>CLASSIFICATION LIBRARY</small>
              </div>
            </div>
          </section>

          {/* Simulation Control Strip */}
          <section className="control-strip" aria-label="Simulation controls">
            <div className="control-context flex-wrap gap-2 sm:gap-3">
              <span className="mini-label">SCENARIO</span>

              {/* Scenario Selection with Digital Green Checkboxes */}
              <div className="scenario-checkbox-group flex items-center gap-2">
                {([
                  { id: 'normal', label: 'NORMAL' },
                  { id: 'anomalous', label: 'ANOMALOUS' },
                  { id: 'high-threat', label: 'HIGH THREAT' },
                ] as const).map((s) => {
                  const isChecked = scenario === s.id;
                  return (
                    <label
                      key={s.id}
                      className={`scenario-checkbox-item flex items-center gap-1.5 cursor-pointer select-none text-[10px] font-mono font-bold tracking-wider px-2 py-1 rounded border transition-all ${
                        isChecked
                          ? 'border-[#00ff66] bg-[#00ff66]/15 text-[#00ff66] shadow-[0_0_10px_rgba(0,255,102,0.3)]'
                          : 'border-[#1b5961] bg-[#04141b]/80 text-[#8aa0a8] hover:border-[#72dbc2]/50 hover:text-[#dffbfa]'
                      }`}
                      title={`Switch scenario to ${s.label}`}
                    >
                      <span
                        className={`scenario-checkbox-box flex items-center justify-center w-3.5 h-3.5 rounded-[2px] border transition-all ${
                          isChecked
                            ? 'border-[#00ff66] bg-[#04141b] shadow-[0_0_8px_rgba(0,255,102,0.6)]'
                            : 'border-[#2d5564] bg-[#04141b]'
                        }`}
                      >
                        {isChecked && (
                          <span
                            className="scenario-checkbox-inner w-2 h-2 rounded-[1px] bg-[#00ff66] shadow-[0_0_6px_#00ff66]"
                            style={{ backgroundColor: '#00ff66' }}
                          />
                        )}
                      </span>
                      <input
                        type="checkbox"
                        name="scenario-column-toggle"
                        checked={isChecked}
                        onChange={() => setScenario(s.id)}
                        className="sr-only"
                      />
                      <span>{s.label}</span>
                    </label>
                  );
                })}
              </div>

              {/* Accessible hidden select for standard references */}
              <select
                id="scenario-select"
                value={scenario}
                onChange={(e) => setScenario(e.target.value as ScenarioType)}
                className="sr-only"
                aria-label="Scenario"
              >
                <option value="normal">Normal / baseline</option>
                <option value="anomalous">Anomalous / probing</option>
                <option value="high-threat">High threat / incursion</option>
              </select>

              <span className="control-separator"></span>
              <span className="mini-label">TICK</span>
              <strong id="last-tick">#{tick}</strong>
            </div>

            <div className="control-actions flex flex-wrap items-center gap-2">
              <label className="select-control compact">
                <span className="sr-only">Update speed</span>
                <select
                  id="speed-select"
                  value={speed}
                  onChange={(e) => setSpeed(e.target.value as SpeedType)}
                >
                  <option value="slow">0.5×</option>
                  <option value="normal">1×</option>
                  <option value="fast">2×</option>
                </select>
              </label>

              <button
                className="control-button"
                id="pause-button"
                type="button"
                onClick={togglePause}
              >
                <span className="button-icon">{paused ? '▶' : 'Ⅱ'}</span>
                <span>{paused ? 'Resume' : 'Pause'}</span>
              </button>

              <button
                className="control-button quiet"
                id="reset-button"
                type="button"
                onClick={resetSimulation}
              >
                <span className="button-icon">↻</span>
                <span>Reset</span>
              </button>
            </div>
          </section>

          {/* Metric Grid */}
          <section className="metric-grid" aria-label="Airspace metrics">
            <article className="metric-card metric-accent-cyan">
              <div className="metric-top">
                <span className="metric-label">ACTIVE TRACKS</span>
                <span className="metric-glyph">◈</span>
              </div>
              <div className="metric-value" id="metric-active">
                {String(tracks.length).padStart(2, '0')}
              </div>
              <div className="metric-footer">
                <span className="delta positive">+2.4%</span>
                <span>vs previous sweep</span>
              </div>
            </article>

            <article className="metric-card metric-accent-amber">
              <div className="metric-top">
                <span className="metric-label">PRIORITY ALERTS</span>
                <span className="metric-glyph">!</span>
              </div>
              <div className="metric-value" id="metric-alerts">
                {String(criticalAlerts.length).padStart(2, '0')}
              </div>
              <div className="metric-footer">
                <span className="delta warning">{criticalAlerts.length} elevated</span>
                <span>requires review</span>
              </div>
            </article>

            <article className="metric-card metric-accent-violet">
              <div className="metric-top">
                <span className="metric-label">PREDICTION CONFIDENCE</span>
                <span className="metric-glyph">⌁</span>
              </div>
              <div className="metric-value" id="metric-confidence">
                91.2<span className="metric-unit">%</span>
              </div>
              <div className="metric-footer">
                <span className="delta positive">+4.8%</span>
                <span>vector model</span>
              </div>
            </article>

            <article className="metric-card metric-accent-blue">
              <div className="metric-top">
                <span className="metric-label">AIRSPACE STATUS</span>
                <span className="metric-glyph">○</span>
              </div>
              <div className="metric-value status-value">
                <span className="status-bullet"></span>
                <span id="metric-status">GUARDED</span>
              </div>
              <div className="metric-footer">
                <span id="metric-zone-count">02 restricted zones</span>
                <span>radius 12 km</span>
              </div>
            </article>
          </section>

          {/* Location Intelligence Panel */}
          <LocationIntel />

          {/* Radar and Threat Priority Workspace */}
          <section className="workspace-grid">
            <RadarStage />
            <ThreatQueue />
          </section>

          {/* Lower Portion of the Website with Animated Cyber Rain Background */}
          <section className="lower-portion-container relative overflow-hidden -mx-8 px-8 py-12 mt-12 border-t border-[rgba(247,247,243,0.18)]">
            <div className="cyber-rain-container" aria-hidden="true"></div>

            <div className="relative z-10 space-y-12">
              {/* Lower Grid: Objects Catalog and Detailed Lens */}
              <div className="lower-grid">
                <TrackCatalogue />
                <InvestigationLens onOpenIncidentModal={openIncidentForTrack} />
              </div>

              {/* Asset Briefing Section */}
              <div className="asset-briefing">
                <div className="briefing-copy">
                  <div className="panel-kicker">VISUAL REFERENCE / AIRSPACE CONTEXT</div>
                  <h2>Mission imagery, one common defense picture.</h2>
                  <p>
                    Reference imagery anchors the operational context. Features persistent real-time database state and authentication powered by Google Firebase.
                  </p>
                  <div className="briefing-foot flex flex-wrap gap-4 pt-2">
                    <span>
                      <i className="tiny-check">✓</i> Firebase Auth & Real-Time Firestore
                    </span>
                    <span>
                      <i className="tiny-check">✓</i> Explainable threat scoring
                    </span>
                    <span>
                      <i className="tiny-check">✓</i> Low-bandwidth ready
                    </span>
                  </div>
                </div>
                <div className="briefing-image-strip">
                  <div className="brief-image">
                    <img src="/assets/fighter.webp" alt="Fixed-wing reference aircraft" />
                    <span>FIXED-WING / PLATE 01</span>
                  </div>
                  <div className="brief-image">
                    <img src="/assets/helicopter.webp" alt="Rotary-wing reference helicopter" />
                    <span>ROTARY-WING / PLATE 02</span>
                  </div>
                </div>
              </div>

              {/* 3D Tactical Drone Model at the Very Bottom of Website */}
              <TacticalDrone3D />

              {/* Footer */}
              <footer className="main-footer flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <img src="/assets/logo.png" alt="SKYLOCK SENITAL" className="w-5 h-5 object-contain opacity-80" />
                  <span>SKYLOCK SENITAL / CLOUD RUNTIME BUILD 02</span>
                </div>
                <span>REAL-TIME FIREBASE FIRESTORE · AIRSPACE DEFENSE DECK</span>
                <span>© 2026 SKYLOCK SENITAL</span>
              </footer>
            </div>
          </section>
        </main>
      </div>

      {/* Modals */}
      <IncidentModal
        isOpen={isIncidentOpen}
        onClose={() => setIsIncidentOpen(false)}
        initialTrackId={incidentTarget.trackId}
        initialCallsign={incidentTarget.callsign}
        initialSeverity={incidentTarget.level}
      />

      <WatchlistModal
        isOpen={isWatchlistOpen}
        onClose={() => setIsWatchlistOpen(false)}
        onSelectTrack={(id) => setSelectedTrackId(id)}
      />
    </>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AirspaceProvider>
        <AirspaceDashboard />
      </AirspaceProvider>
    </AuthProvider>
  );
}
