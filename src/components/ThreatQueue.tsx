import React from 'react';
import { useAirspace } from '../context/AirspaceContext';

const pad = (n: number) => String(n).padStart(2, '0');

export const ThreatQueue: React.FC = () => {
  const {
    tracks,
    selectedTrackId,
    setSelectedTrackId,
    alertFilter,
    setAlertFilter,
    sortThreat,
    acknowledged,
    acknowledgeAlert,
    clearAcknowledged,
  } = useAirspace();

  let filtered = tracks.filter(
    (track) => alertFilter === 'all' || track.level === alertFilter
  );

  filtered = [...filtered].sort((a, b) =>
    sortThreat ? b.score - a.score : a.id.localeCompare(b.id)
  );

  const criticalCount = tracks.filter((t) => t.level === 'critical').length;
  const highCount = tracks.filter((t) => t.level === 'high').length;
  const watchCount = tracks.filter((t) => t.level === 'watch').length;

  return (
    <article className="panel threat-panel" id="alerts-section">
      <div className="panel-header">
        <div>
          <div className="panel-kicker">THREAT PRIORITIZATION</div>
          <h2>Priority queue</h2>
        </div>
        <button
          className="text-button"
          id="clear-ack-button"
          onClick={() => clearAcknowledged()}
        >
          Clear ack
        </button>
      </div>

      <div className="filter-row">
        <button
          className={`filter-chip ${alertFilter === 'all' ? 'active' : ''}`}
          data-alert-filter="all"
          onClick={() => setAlertFilter('all')}
        >
          All <span id="filter-all-count">{pad(tracks.length)}</span>
        </button>
        <button
          className={`filter-chip ${alertFilter === 'critical' ? 'active' : ''}`}
          data-alert-filter="critical"
          onClick={() => setAlertFilter('critical')}
        >
          Critical <span id="filter-critical-count">{pad(criticalCount)}</span>
        </button>
        <button
          className={`filter-chip ${alertFilter === 'high' ? 'active' : ''}`}
          data-alert-filter="high"
          onClick={() => setAlertFilter('high')}
        >
          High <span id="filter-high-count">{pad(highCount)}</span>
        </button>
        <button
          className={`filter-chip ${alertFilter === 'watch' ? 'active' : ''}`}
          data-alert-filter="watch"
          onClick={() => setAlertFilter('watch')}
        >
          Watch <span id="filter-watch-count">{pad(watchCount)}</span>
        </button>
      </div>

      <div className="threat-list" id="threat-list">
        {!filtered.length ? (
          <div className="detail-empty">
            <div>
              <div className="detail-empty-icon">✓</div>
              No tracks in this filter.
              <br />
              The queue is quiet for now.
            </div>
          </div>
        ) : (
          filtered.slice(0, 7).map((track) => {
            const isAcked = Boolean(acknowledged[track.id]);
            const isSelected = track.id === selectedTrackId;

            return (
              <div
                key={track.id}
                className={`threat-row ${isSelected ? 'selected' : ''}`}
                data-threat-id={track.id}
                onClick={() => setSelectedTrackId(track.id)}
              >
                <span className={`threat-severity ${track.level}`}></span>
                <div className="threat-main">
                  <div className="threat-heading">
                    <strong>
                      {track.id} / {track.callsign}
                    </strong>
                    <span>{track.eta}s ETA</span>
                  </div>
                  <div className="threat-reason">{track.reasons[0]}</div>
                  <div className="threat-meta">
                    <span className={`severity-label ${track.level}`}>
                      {track.level.toUpperCase()}
                    </span>
                    <span>Score {track.score}</span>
                    <span>{track.restricted ? 'ZONE ENTRY' : 'VECTOR'}</span>
                  </div>
                </div>
                <button
                  className={`ack-button ${isAcked ? 'acked' : ''}`}
                  data-ack-id={track.id}
                  aria-label={`${isAcked ? 'Acknowledged' : 'Acknowledge'} ${track.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    acknowledgeAlert(track.id);
                  }}
                >
                  {isAcked ? '✓' : '○'}
                </button>
              </div>
            );
          })
        )}
      </div>

      <div className="queue-footer">
        <span>Scored every telemetry tick</span>
        <span className="algorithm-badge">WEIGHTED MODEL v1.4</span>
      </div>
    </article>
  );
};
