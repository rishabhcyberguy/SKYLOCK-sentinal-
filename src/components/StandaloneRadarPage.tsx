import React from 'react';
import { useAirspace, scenarioMeta } from '../context/AirspaceContext';
import { useAuth } from '../context/AuthContext';
import { ScenarioType, SpeedType } from '../types/airspace';

export const StandaloneRadarPage: React.FC = () => {
  const { user } = useAuth();
  const {
    tracks,
    selectedTrackId,
    setSelectedTrackId,
    sweepCount,
    scenario,
    setScenario,
    speed,
    setSpeed,
    paused,
    togglePause,
    resetSimulation,
    tick,
    firebaseConnected,
    watchlist,
    toggleWatchlistTarget,
  } = useAirspace();

  const selectedTrack = tracks.find((t) => t.id === selectedTrackId) || tracks[0];
  const criticalCount = tracks.filter((t) => t.level === 'critical' || t.level === 'high').length;

  // Radar dimensions: SVG viewBox 0 0 1000 650
  const centerX = 500;
  const centerY = 325;
  const maxRadius = 300;

  const toSvgX = (pctX: number) => (pctX / 100) * 1000;
  const toSvgY = (pctY: number) => (pctY / 100) * 650;

  const sweepAngle = (sweepCount * 3.6) % 360;
  const sweepRad = ((sweepAngle - 90) * Math.PI) / 180;
  const sweepEndX = centerX + Math.cos(sweepRad) * maxRadius;
  const sweepEndY = centerY + Math.sin(sweepRad) * maxRadius;

  return (
    <div className="min-h-screen bg-[#040d14] text-[#f7f7f3] flex flex-col font-sans selection:bg-[#00ff66]/30">
      {/* Top Standalone Header Bar */}
      <header className="border-b border-[#1b5961] bg-[#071724]/90 backdrop-blur-md px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#00a7bd]/60 bg-[#0b2637] hover:bg-[#00a7bd]/25 text-[#72dbc2] text-xs font-mono font-bold transition-all shadow-[0_0_12px_rgba(0,167,189,0.2)]"
          >
            <span>← RETURN TO DASHBOARD</span>
          </a>
          <div className="h-6 w-px bg-[#1b5961] hidden sm:block"></div>
          <img
            src="/assets/logo.png"
            alt="SKYLOCK SENITAL"
            className="w-7 h-7 object-contain drop-shadow-[0_0_8px_rgba(0,255,102,0.4)] shrink-0"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00ff66] animate-pulse shadow-[0_0_8px_#00ff66]"></span>
              <span className="text-[10px] font-mono tracking-widest text-[#00ff66] font-bold">
                OPERATIONAL AIRSPACE RADAR
              </span>
              <span className="text-[9px] font-mono text-[#8aa0a8] px-1.5 py-0.5 rounded bg-[#04141b] border border-[#1b5961]">
                FULL-PAGE VIEW
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-black font-mono tracking-wider text-[#f7f7f3] m-0">
              SKYLOCK SENITAL // 360° SENSOR SWEEP
            </h1>
          </div>
        </div>

        {/* Scenario Controls with Digital Green Checkboxes */}
        <div className="flex flex-wrap items-center gap-3 font-mono">
          <div className="flex items-center gap-2 bg-[#04141b] border border-[#1b5961] rounded-lg px-2.5 py-1.5">
            <span className="text-[10px] text-[#8aa0a8] font-bold tracking-wider">SCENARIO:</span>
            <div className="flex items-center gap-2">
              {([
                { id: 'normal', label: 'NORMAL' },
                { id: 'anomalous', label: 'ANOMALOUS' },
                { id: 'high-threat', label: 'HIGH THREAT' },
              ] as const).map((s) => {
                const isChecked = scenario === s.id;
                return (
                  <label
                    key={s.id}
                    className={`scenario-checkbox-item flex items-center gap-1.5 cursor-pointer select-none text-[10px] font-bold tracking-wider px-2 py-0.5 rounded border transition-all ${
                      isChecked
                        ? 'border-[#00ff66] bg-[#00ff66]/15 text-[#00ff66] shadow-[0_0_10px_rgba(0,255,102,0.3)]'
                        : 'border-[#1b5961] bg-[#071a26] text-[#8aa0a8] hover:border-[#72dbc2]/50 hover:text-[#dffbfa]'
                    }`}
                  >
                    <span
                      className={`scenario-checkbox-box flex items-center justify-center w-3.5 h-3.5 rounded-[2px] border transition-all ${
                        isChecked
                          ? 'border-[#00ff66] bg-[#04141b] shadow-[0_0_8px_rgba(0,255,102,0.5)]'
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
                      name="scenario-toggle-standalone"
                      checked={isChecked}
                      onChange={() => setScenario(s.id)}
                      className="sr-only"
                    />
                    <span>{s.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Speed & Sim Controls */}
          <div className="flex items-center gap-2">
            <select
              value={speed}
              onChange={(e) => setSpeed(e.target.value as SpeedType)}
              className="bg-[#04141b] border border-[#1b5961] text-[#72dbc2] text-xs font-mono rounded px-2 py-1 outline-none"
            >
              <option value="slow">0.5×</option>
              <option value="normal">1.0×</option>
              <option value="fast">2.0×</option>
            </select>

            <button
              onClick={togglePause}
              type="button"
              className="px-2.5 py-1 rounded bg-[#0b2637] hover:bg-[#1b5961] border border-[#00a7bd]/40 text-[#72dbc2] text-xs font-mono font-bold transition-colors cursor-pointer"
            >
              {paused ? '▶ RESUME' : 'Ⅱ PAUSE'}
            </button>

            <button
              onClick={resetSimulation}
              type="button"
              className="px-2 py-1 rounded bg-[#0b2637] hover:bg-[#1b5961] border border-[#1b5961] text-[#8aa0a8] text-xs font-mono transition-colors cursor-pointer"
              title="Reset Simulation"
            >
              ↻
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Radar Viewport */}
        <div className="flex-1 relative flex items-center justify-center bg-[#03090e] p-2 sm:p-4 overflow-hidden min-h-[500px]">
          {/* Readout Overlays */}
          <div className="absolute top-4 left-4 z-20 font-mono text-xs text-[#72dbc2] space-y-1 pointer-events-none bg-[#071724]/75 backdrop-blur-sm p-3 rounded-lg border border-[#1b5961]">
            <div className="flex items-center gap-2 text-[#00ff66] font-bold">
              <span className="w-2 h-2 rounded-full bg-[#00ff66] animate-ping"></span>
              LIVE TACTICAL PICTURE · 12.0 KM RADIUS
            </div>
            <div>COORDINATES: N 28° 36.44′ · E 77° 12.05′</div>
            <div>SWEEP CYCLE: #{String(sweepCount).padStart(3, '0')} · TICK #{tick}</div>
            <div className="text-[10px] text-[#8aa0a8]">
              TARGETS IN SECTOR: {tracks.length} | ELEVATED ALERTS: {criticalCount}
            </div>
          </div>

          <div className="absolute bottom-4 right-4 z-20 font-mono text-xs text-[#8aa0a8] pointer-events-none bg-[#071724]/75 backdrop-blur-sm p-3 rounded-lg border border-[#1b5961] hidden sm:block">
            <div className="text-[#f7f7f3] font-bold mb-1">RADAR LEGEND</div>
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#d65458]"></span> Critical Incursion</div>
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#e59c2b]"></span> Elevated Probe</div>
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#00a7bd]"></span> Routine Civil Traffic</div>
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#00ff66]"></span> Verified Corridors</div>
          </div>

          {/* SVG Radar */}
          <div className="relative w-full max-w-5xl aspect-[1000/650] max-h-[85vh] select-none">
            <svg
              className="w-full h-full"
              viewBox="0 0 1000 650"
              role="img"
              aria-label="Full-Page Radar Scope"
            >
              <defs>
                <radialGradient id="standRadarGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#00ff66" stopOpacity="0.09" />
                  <stop offset="60%" stopColor="#00a7bd" stopOpacity="0.04" />
                  <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="standSweepGrad" x1={centerX} y1={centerY} x2={sweepEndX} y2={sweepEndY} gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#00ff66" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#00ff66" stopOpacity="0.9" />
                </linearGradient>
              </defs>

              {/* Scope Background and Range Rings */}
              <circle cx={centerX} cy={centerY} r={maxRadius} fill="url(#standRadarGlow)" />
              <circle cx={centerX} cy={centerY} r={maxRadius} stroke="#1b5961" strokeWidth="1.5" fill="none" />
              <circle cx={centerX} cy={centerY} r={maxRadius * 0.75} stroke="#1b5961" strokeWidth="1" strokeDasharray="4 4" fill="none" />
              <circle cx={centerX} cy={centerY} r={maxRadius * 0.5} stroke="#1b5961" strokeWidth="1" strokeDasharray="4 4" fill="none" />
              <circle cx={centerX} cy={centerY} r={maxRadius * 0.25} stroke="#1b5961" strokeWidth="1" strokeDasharray="4 4" fill="none" />

              {/* Cardinal Axes */}
              <line x1={centerX - maxRadius} y1={centerY} x2={centerX + maxRadius} y2={centerY} stroke="#1b5961" strokeWidth="1" />
              <line x1={centerX} y1={centerY - maxRadius} x2={centerX} y2={centerY + maxRadius} stroke="#1b5961" strokeWidth="1" />
              <line x1={centerX - maxRadius * 0.707} y1={centerY - maxRadius * 0.707} x2={centerX + maxRadius * 0.707} y2={centerY + maxRadius * 0.707} stroke="#1b5961" strokeWidth="0.5" strokeDasharray="3 3" />
              <line x1={centerX - maxRadius * 0.707} y1={centerY + maxRadius * 0.707} x2={centerX + maxRadius * 0.707} y2={centerY - maxRadius * 0.707} stroke="#1b5961" strokeWidth="0.5" strokeDasharray="3 3" />

              {/* Cardinal Labels */}
              <text x={centerX} y={centerY - maxRadius - 10} fill="#72dbc2" fontSize="12" fontFamily="monospace" textAnchor="middle" fontWeight="bold">000° NORTH</text>
              <text x={centerX + maxRadius + 15} y={centerY + 4} fill="#72dbc2" fontSize="12" fontFamily="monospace" textAnchor="start" fontWeight="bold">090° EAST</text>
              <text x={centerX} y={centerY + maxRadius + 22} fill="#72dbc2" fontSize="12" fontFamily="monospace" textAnchor="middle" fontWeight="bold">180° SOUTH</text>
              <text x={centerX - maxRadius - 15} y={centerY + 4} fill="#72dbc2" fontSize="12" fontFamily="monospace" textAnchor="end" fontWeight="bold">270° WEST</text>

              {/* Restricted Airspace Perimeter */}
              <circle cx={centerX + 60} cy={centerY - 40} r="95" fill="rgba(229,156,43,0.08)" stroke="#e59c2b" strokeWidth="1.5" strokeDasharray="6 4" />
              <text x={centerX + 60} y={centerY - 50} fill="#e59c2b" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">RESTRICTED ZONE B-4</text>

              {/* Defense Core */}
              <circle cx={centerX} cy={centerY} r="45" fill="rgba(214,84,88,0.12)" stroke="#d65458" strokeWidth="1.5" strokeDasharray="4 3" />
              <text x={centerX} y={centerY + 4} fill="#d65458" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">DEFENSE CORE</text>

              {/* Rotating Sweep Beam */}
              <line x1={centerX} y1={centerY} x2={sweepEndX} y2={sweepEndY} stroke="url(#standSweepGrad)" strokeWidth="2.5" />

              {/* Radar Tracks */}
              {tracks.map((track) => {
                const isSelected = track.id === selectedTrackId;
                const px = toSvgX(track.x);
                const py = toSvgY(track.y);

                const color =
                  track.level === 'critical'
                    ? '#d65458'
                    : track.level === 'high'
                    ? '#e59c2b'
                    : track.level === 'watch'
                    ? '#00a7bd'
                    : '#00ff66';

                return (
                  <g
                    key={track.id}
                    onClick={() => setSelectedTrackId(track.id)}
                    className="cursor-pointer transition-transform"
                  >
                    {/* Trajectory vector */}
                    {track.projectedPath && track.projectedPath.length > 0 && (
                      <polyline
                        points={[
                          `${px},${py}`,
                          ...track.projectedPath.map((p) => `${toSvgX(p.x)},${toSvgY(p.y)}`),
                        ].join(' ')}
                        fill="none"
                        stroke={color}
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                        opacity={isSelected ? 0.9 : 0.4}
                      />
                    )}

                    {/* Halo when selected */}
                    {isSelected && (
                      <circle
                        cx={px}
                        cy={py}
                        r="22"
                        fill="none"
                        stroke="#00ff66"
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                        className="animate-spin"
                        style={{ transformOrigin: `${px}px ${py}px`, animationDuration: '6s' }}
                      />
                    )}

                    {/* Outer pulse ring */}
                    <circle
                      cx={px}
                      cy={py}
                      r="12"
                      fill="none"
                      stroke={color}
                      strokeWidth="1.5"
                      opacity="0.75"
                    />

                    {/* Core target dot */}
                    <circle cx={px} cy={py} r="4.5" fill={color} stroke="#ffffff" strokeWidth="1" />

                    {/* Track Callout Label */}
                    <text
                      x={px + 10}
                      y={py - 6}
                      fill={isSelected ? '#00ff66' : '#dffbfa'}
                      fontSize="11"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {track.callsign}
                    </text>
                    <text
                      x={px + 10}
                      y={py + 8}
                      fill="#8aa0a8"
                      fontSize="9"
                      fontFamily="monospace"
                    >
                      {track.altitude}m · {track.speed}kt
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Selected Target Side Drawer */}
        <aside className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-[#1b5961] bg-[#071724] p-4 flex flex-col font-mono text-xs overflow-y-auto max-h-[40vh] lg:max-h-none">
          <div className="pb-3 border-b border-[#1b5961] flex items-center justify-between">
            <span className="text-[10px] text-[#00ff66] font-bold tracking-widest uppercase">
              TARGET LOCKON // TELEMETRY
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#00ff66]/15 text-[#00ff66] border border-[#00ff66]/40">
              ACTIVE FIX
            </span>
          </div>

          {selectedTrack ? (
            <div className="space-y-4 pt-3 flex-1">
              <div>
                <h2 className="text-xl font-black text-[#f7f7f3] tracking-wider m-0 flex items-center gap-2">
                  <span>{selectedTrack.callsign}</span>
                  <span className="text-xs text-[#8aa0a8]">[{selectedTrack.id}]</span>
                </h2>
                <div className="text-[11px] text-[#72dbc2] mt-0.5">{selectedTrack.type}</div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded bg-[#04141b] border border-[#1b5961]">
                  <span className="text-[9px] text-[#8aa0a8] block">ALTITUDE</span>
                  <strong className="text-[#f7f7f3] text-sm">{selectedTrack.altitude} m</strong>
                </div>
                <div className="p-2 rounded bg-[#04141b] border border-[#1b5961]">
                  <span className="text-[9px] text-[#8aa0a8] block">AIRSPEED</span>
                  <strong className="text-[#f7f7f3] text-sm">{selectedTrack.speed} kt</strong>
                </div>
                <div className="p-2 rounded bg-[#04141b] border border-[#1b5961]">
                  <span className="text-[9px] text-[#8aa0a8] block">HEADING</span>
                  <strong className="text-[#f7f7f3] text-sm">{selectedTrack.heading}°</strong>
                </div>
                <div className="p-2 rounded bg-[#04141b] border border-[#1b5961]">
                  <span className="text-[9px] text-[#8aa0a8] block">THREAT SCORE</span>
                  <strong className="text-[#d65458] text-sm">{selectedTrack.score} / 99</strong>
                </div>
              </div>

              <div className="p-2.5 rounded bg-[#04141b] border border-[#1b5961] space-y-1">
                <span className="text-[9px] text-[#8aa0a8] block font-bold">BEHAVIORAL CLASSIFICATION</span>
                <p className="text-[#bcebf1] m-0 capitalize">{selectedTrack.behavior}</p>
                <div className="text-[10px] text-[#8aa0a8] pt-1">
                  Origin: {selectedTrack.home} · Confidence: {selectedTrack.confidence}%
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => toggleWatchlistTarget(selectedTrack, 'elevated')}
                  className={`w-full py-2 px-3 rounded font-bold font-mono text-xs flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                    watchlist[selectedTrack.id]
                      ? 'bg-[#e59c2b]/20 text-[#e59c2b] border-[#e59c2b]'
                      : 'bg-[#0b2637] hover:bg-[#1b5961] text-[#f7f7f3] border-[#1b5961]'
                  }`}
                >
                  <span>{watchlist[selectedTrack.id] ? '★ WATCHLIST FLAGGED' : '☆ ADD TO WATCHLIST'}</span>
                </button>
              </div>

              {/* Target Quick Selection List */}
              <div className="pt-2">
                <span className="text-[10px] text-[#8aa0a8] font-bold block mb-2 uppercase">
                  OTHER DETECTED TARGETS ({tracks.length})
                </span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                  {tracks.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTrackId(t.id)}
                      className={`w-full p-2 rounded text-left flex items-center justify-between text-xs transition-colors cursor-pointer ${
                        t.id === selectedTrackId
                          ? 'bg-[#00a7bd]/25 border border-[#00a7bd] text-[#f7f7f3]'
                          : 'bg-[#04141b] hover:bg-[#0b2637] border border-[#1b5961]/40 text-[#8aa0a8]'
                      }`}
                    >
                      <span className="font-bold">{t.callsign}</span>
                      <span className="text-[10px] uppercase font-bold">{t.level}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-[#8aa0a8]">No track selected. Click any target on the radar.</div>
          )}
        </aside>
      </div>
    </div>
  );
};
