import React from 'react';
import { useAirspace } from '../context/AirspaceContext';
import { Track } from '../types/airspace';

export const RadarStage: React.FC = () => {
  const { tracks, selectedTrackId, setSelectedTrackId, sweepCount } = useAirspace();

  // Radar dimensions: SVG viewBox 0 0 1000 540
  const centerX = 500;
  const centerY = 270;
  const maxRadius = 240;

  // Convert 0-100 percentage coordinates into SVG pixel positions
  const toSvgX = (pctX: number) => (pctX / 100) * 1000;
  const toSvgY = (pctY: number) => (pctY / 100) * 540;

  const sweepAngle = (sweepCount * 3.6) % 360;
  const sweepRad = ((sweepAngle - 90) * Math.PI) / 180;
  const sweepEndX = centerX + Math.cos(sweepRad) * maxRadius;
  const sweepEndY = centerY + Math.sin(sweepRad) * maxRadius;

  return (
    <article className="panel map-panel" id="map-section">
      <div className="panel-header">
        <div>
          <div className="panel-kicker">
            <span className="live-dot"></span>LIVE AIRSPACE PICTURE
          </div>
          <h2>Operational radar</h2>
        </div>
        <div className="panel-header-actions flex items-center gap-2">
          <a
            href="?view=radar"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#072433] hover:bg-[#00a7bd]/30 border border-[#00a7bd] text-[#72dbc2] hover:text-white text-[10px] font-mono font-bold tracking-wider transition-all shadow-[0_0_12px_rgba(0,167,189,0.3)] cursor-pointer"
            title="Open Operational Radar in dedicated full-page view"
          >
            <span>⛶ OPEN IN NEW PAGE</span>
            <span className="text-[#00ff66] font-black">↗</span>
          </a>
          <span className="panel-meta" id="map-time">
            SWEEP #{String(sweepCount).padStart(3, '0')}
          </span>
          <button
            className="small-icon-button"
            id="map-focus-button"
            aria-label="Focus selected track"
            onClick={() => {
              const node = document.querySelector(`[data-track-id="${selectedTrackId}"]`);
              node?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
          >
            ⌖
          </button>
        </div>
      </div>

      <div className="radar-stage relative select-none" id="radar-stage">
        <div className="radar-readout readout-top">
          <span>N 28° 36.44′</span>
          <span>E 77° 12.05′</span>
        </div>
        <div className="radar-hud-label">
          <span className="radar-hud-dot"></span>360° SCAN <b>REAL-TIME</b>
        </div>
        <div className="radar-readout readout-bottom">
          <span>RANGE 12.0 KM</span>
          <span>
            SWEEP / <b id="sweep-count">{String(sweepCount).padStart(3, '0')}</b>
          </span>
        </div>

        <svg
          id="radar-svg"
          className="radar-svg w-full h-[320px] sm:h-[420px] md:h-[500px]"
          viewBox="0 0 1000 540"
          role="img"
          aria-label="Radar view showing tracked aerial objects and predicted paths"
        >
          <defs>
            <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#d7ff3f" stopOpacity="0.12" />
              <stop offset="70%" stopColor="#00a7bd" stopOpacity="0.04" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Grid background circles */}
          <circle cx={centerX} cy={centerY} r={maxRadius} fill="url(#radarGlow)" />
          <circle cx={centerX} cy={centerY} r={maxRadius} className="radar-ring outer" />
          <circle cx={centerX} cy={centerY} r={maxRadius * 0.75} className="radar-ring" />
          <circle cx={centerX} cy={centerY} r={maxRadius * 0.5} className="radar-ring" />
          <circle cx={centerX} cy={centerY} r={maxRadius * 0.25} className="radar-ring" />

          {/* Radar axes */}
          <line x1={centerX - maxRadius} y1={centerY} x2={centerX + maxRadius} y2={centerY} className="radar-axis" />
          <line x1={centerX} y1={centerY - maxRadius} x2={centerX} y2={centerY + maxRadius} className="radar-axis" />
          <line
            x1={centerX - maxRadius * 0.7}
            y1={centerY - maxRadius * 0.7}
            x2={centerX + maxRadius * 0.7}
            y2={centerY + maxRadius * 0.7}
            className="radar-axis diagonal"
          />
          <line
            x1={centerX - maxRadius * 0.7}
            y1={centerY + maxRadius * 0.7}
            x2={centerX + maxRadius * 0.7}
            y2={centerY - maxRadius * 0.7}
            className="radar-axis diagonal"
          />

          {/* Compass labels */}
          <text x={centerX} y={centerY - maxRadius - 10} textAnchor="middle" className="radar-compass">
            N
          </text>
          <text x={centerX + maxRadius + 18} y={centerY + 4} textAnchor="middle" className="radar-compass">
            E
          </text>
          <text x={centerX} y={centerY + maxRadius + 22} textAnchor="middle" className="radar-compass">
            S
          </text>
          <text x={centerX - maxRadius - 18} y={centerY + 4} textAnchor="middle" className="radar-compass">
            W
          </text>

          {/* Range labels */}
          <text x={centerX + 6} y={centerY - maxRadius * 0.25 - 4} className="radar-range-label">
            3 KM
          </text>
          <text x={centerX + 6} y={centerY - maxRadius * 0.5 - 4} className="radar-range-label">
            6 KM
          </text>
          <text x={centerX + 6} y={centerY - maxRadius * 0.75 - 4} className="radar-range-label">
            9 KM
          </text>
          <text x={centerX + 6} y={centerY - maxRadius - 4} className="radar-range-label">
            12 KM
          </text>

          {/* Restricted Corridor Zone */}
          <rect
            x={toSvgX(55)}
            y={toSvgY(22)}
            width={toSvgX(38) - toSvgX(0)}
            height={toSvgY(36) - toSvgY(0)}
            rx="12"
            className="zone"
          />

          {/* Protected Core */}
          <circle cx={toSvgX(52)} cy={toSvgY(49)} r={55} className="core" />
          <circle cx={toSvgX(52)} cy={toSvgY(49)} r={4} className="radar-origin" />

          {/* Radar rotating sweep line */}
          <g className="radar-sweep">
            <line
              x1={centerX}
              y1={centerY}
              x2={sweepEndX}
              y2={sweepEndY}
              className="radar-sweep-line"
            />
          </g>

          {/* Projected flight trajectories */}
          {tracks.map((track) => {
            const isSelected = track.id === selectedTrackId;
            const pointsStr = [
              `${toSvgX(track.x)},${toSvgY(track.y)}`,
              ...track.projectedPath.map((p) => `${toSvgX(p.x)},${toSvgY(p.y)}`),
            ].join(' ');

            return (
              <polyline
                key={`traj-${track.id}`}
                points={pointsStr}
                className={`trajectory ${isSelected ? 'selected' : ''}`}
                opacity={isSelected ? 1 : 0.45}
              />
            );
          })}

          {/* Aerial Track Objects */}
          {tracks.map((track) => {
            const svgX = toSvgX(track.x);
            const svgY = toSvgY(track.y);
            const isSelected = track.id === selectedTrackId;
            const fillColor =
              track.level === 'critical'
                ? '#ef4444'
                : track.level === 'high'
                ? '#f59e0b'
                : track.level === 'watch'
                ? '#06b6d4'
                : '#10b981';

            return (
              <g
                key={track.id}
                className="track-hit cursor-pointer"
                data-track-id={track.id}
                tabIndex={0}
                role="button"
                aria-label={`Track ${track.callsign} id ${track.id} threat score ${track.score}`}
                onClick={() => setSelectedTrackId(track.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setSelectedTrackId(track.id);
                  }
                }}
              >
                {/* Selection pulse ring */}
                {isSelected && (
                  <circle
                    cx={svgX}
                    cy={svgY}
                    r={24}
                    fill="none"
                    stroke="#d7ff3f"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    className="animate-spin origin-center"
                    style={{ transformOrigin: `${svgX}px ${svgY}px` }}
                  />
                )}

                {/* Track Center Point */}
                <circle
                  cx={svgX}
                  cy={svgY}
                  r={isSelected ? 9 : 6}
                  fill={fillColor}
                  className="track-dot transition-all duration-300"
                />

                {/* Heading indicator vector tick */}
                {(() => {
                  const rad = ((track.heading - 90) * Math.PI) / 180;
                  const tickLength = 16;
                  const tx = svgX + Math.cos(rad) * tickLength;
                  const ty = svgY + Math.sin(rad) * tickLength;
                  return (
                    <line
                      x1={svgX}
                      y1={svgY}
                      x2={tx}
                      y2={ty}
                      stroke={fillColor}
                      strokeWidth={2}
                    />
                  );
                })()}

                {/* Track Labels */}
                <text
                  x={svgX + 13}
                  y={svgY - 4}
                  className="track-label text-[11px] font-mono tracking-wider font-bold"
                >
                  {track.callsign}
                </text>
                <text
                  x={svgX + 13}
                  y={svgY + 9}
                  className="track-sub text-[8px] font-mono opacity-80"
                >
                  {track.id} · {track.altitude}m
                </text>
              </g>
            );
          })}
        </svg>

        <div className="map-callout callout-zone">
          <span className="callout-line"></span>
          <strong>PROTECTED CORE</strong>
          <small>RESTRICTED / 02</small>
        </div>
        <div className="map-callout callout-track">
          <span className="callout-line"></span>
          <strong>TRACK VECTOR</strong>
          <small>PROJECTED / 90 SEC</small>
        </div>
      </div>

      <div className="map-footer flex flex-wrap items-center justify-between gap-3">
        <div className="legend flex items-center gap-3">
          <span>
            <i className="legend-dot cyan"></i>TRACK
          </span>
          <span>
            <i className="legend-dot amber"></i>WATCH
          </span>
          <span>
            <i className="legend-dot red"></i>THREAT
          </span>
          <span>
            <i className="legend-line"></i>PROJECTED
          </span>
        </div>
        <div className="map-footer-note flex items-center gap-2">
          <span className="pulse-dot"></span>
          <span>REAL-TIME SENSOR FUSION & FIRESTORE SYNC</span>
        </div>
      </div>
    </article>
  );
};
