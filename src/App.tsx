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
import { useScrollReveal } from './hooks/useScrollReveal';
import { ScenarioType, SpeedType } from './types/airspace';

const AirspaceDashboard: React.FC = () => {
  useScrollReveal();
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
              <div className="eyebrow scroll-reveal-text">
                <span className="eyebrow-line"></span>COUNTER-DRONE MONITORING / REAL-TIME CLOUD DECK
              </div>
              <h1 className="scroll-reveal-title">
                See the airspace
                <br />
                <em>before it becomes a threat.</em>
              </h1>
              <p className="scroll-reveal-text">
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

              {/* Scenario Selection: Enhanced Solid Military Control (Zero Gradients, Zero Fuzzy Glow) */}
              <div className="scenario-checkbox-group flex items-center gap-1.5 p-1 bg-[#020609] border border-[#1b3a47] rounded-[2px]">
                {([
                  { id: 'normal', label: 'NORMAL', defcon: 'DEFCON 4', code: '01' },
                  { id: 'anomalous', label: 'ANOMALOUS', defcon: 'DEFCON 3', code: '02' },
                  { id: 'high-threat', label: 'HIGH THREAT', defcon: 'DEFCON 1', code: '03' },
                ] as const).map((s) => {
                  const isChecked = scenario === s.id;
                  let borderStyle = 'border-[#1b3a47]';
                  let bgStyle = 'bg-[#050e13]';
                  let textStyle = 'text-[#7d939e]';
                  let dotColor = 'bg-[#2d5564]';

                  if (isChecked) {
                    if (s.id === 'normal') {
                      borderStyle = 'border-[#00ff66]';
                      bgStyle = 'bg-[#002b12]';
                      textStyle = 'text-[#00ff66]';
                      dotColor = 'bg-[#00ff66]';
                    } else if (s.id === 'anomalous') {
                      borderStyle = 'border-[#f5f0d4]';
                      bgStyle = 'bg-[#2b2405]';
                      textStyle = 'text-[#f5f0d4]';
                      dotColor = 'bg-[#f5f0d4]';
                    } else if (s.id === 'high-threat') {
                      borderStyle = 'border-[#ef4a3f]';
                      bgStyle = 'bg-[#33080b]';
                      textStyle = 'text-[#ef4a3f]';
                      dotColor = 'bg-[#ef4a3f]';
                    }
                  }

                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setScenario(s.id)}
                      className={`scenario-btn-solid flex items-center gap-2 cursor-pointer select-none text-[11px] font-mono font-bold tracking-wider px-2.5 py-1.5 border transition-colors ${borderStyle} ${bgStyle} ${textStyle}`}
                      title={`Activate ${s.label} profile (${s.defcon})`}
                    >
                      <span
                        className={`w-3 h-3 flex items-center justify-center border ${
                          isChecked ? borderStyle : 'border-[#2d5564]'
                        } bg-[#020609]`}
                      >
                        {isChecked && <span className={`w-1.5 h-1.5 ${dotColor}`} />}
                      </span>
                      <span className="opacity-60 text-[9px]">{s.code}</span>
                      <span className="font-extrabold">{s.label}</span>
                      <span className={`text-[8px] font-mono px-1 py-0.5 border ${
                        isChecked ? borderStyle : 'border-[#1b3a47] text-[#556972]'
                      } hidden sm:inline-block`}>
                        {s.defcon}
                      </span>
                    </button>
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
                  <div className="panel-kicker scroll-reveal-text">VISUAL REFERENCE / AIRSPACE CONTEXT</div>
                  <h2 className="scroll-reveal-title">Mission imagery, one common defense picture.</h2>
                  <p className="scroll-reveal-text">
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
