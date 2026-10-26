import React, { useState } from 'react';
import { useAirspace } from '../context/AirspaceContext';
import { useAuth } from '../context/AuthContext';

interface InvestigationLensProps {
  onOpenIncidentModal: (trackId: string, callsign: string, level: string) => void;
}

export const InvestigationLens: React.FC<InvestigationLensProps> = ({ onOpenIncidentModal }) => {
  const { user } = useAuth();
  const {
    selectedTrack,
    acknowledged,
    acknowledgeAlert,
    watchlist,
    toggleWatchlistTarget,
  } = useAirspace();

  const [notes, setNotes] = useState<string>('');
  const [showAckInput, setShowAckInput] = useState<boolean>(false);

  if (!selectedTrack) {
    return (
      <article className="panel detail-panel" id="systems-section">
        <div className="panel-header">
          <div>
            <div className="panel-kicker">INVESTIGATION LENS</div>
            <h2>Select a track</h2>
          </div>
          <span className="detail-live">
            <span className="live-dot"></span>STANDBY
          </span>
        </div>
        <div className="p-8 text-center text-xs font-mono text-[#8aa0a8]">
          Click any target on the radar or in the catalog to inspect detailed telemetry and logs.
        </div>
      </article>
    );
  }

  const isAck = !!acknowledged[selectedTrack.id];
  const isWatched = !!watchlist[selectedTrack.id];

  const handleAckSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    acknowledgeAlert(selectedTrack.id, notes || 'Verified and marked cleared');
    setShowAckInput(false);
    setNotes('');
  };

  return (
    <article className="panel detail-panel" id="systems-section">
      <div className="panel-header">
        <div>
          <div className="panel-kicker">INVESTIGATION LENS</div>
          <h2 id="detail-title" className="flex items-center gap-2">
            <span>{selectedTrack.callsign}</span>
            <span className="text-xs text-[#8aa0a8] font-mono">[{selectedTrack.id}]</span>
          </h2>
        </div>
        <span className="detail-live">
          <span className="live-dot"></span>LIVE TELEMETRY
        </span>
      </div>

      <div id="detail-content" className="detail-content space-y-4">
        {/* Core telemetry strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
          <div className="p-2.5 rounded bg-[#07131c]/60 border border-[#d7e6eb]/10">
            <span className="text-[9px] text-[#8aa0a8] block">CLASSIFICATION</span>
            <strong className="text-[#f7f7f3] text-sm">{selectedTrack.type}</strong>
          </div>
          <div className="p-2.5 rounded bg-[#07131c]/60 border border-[#d7e6eb]/10">
            <span className="text-[9px] text-[#8aa0a8] block">ALTITUDE</span>
            <strong className="text-[#f7f7f3] text-sm">{selectedTrack.altitude} m</strong>
          </div>
          <div className="p-2.5 rounded bg-[#07131c]/60 border border-[#d7e6eb]/10">
            <span className="text-[9px] text-[#8aa0a8] block">SPEED</span>
            <strong className="text-[#f7f7f3] text-sm">{selectedTrack.speed} kt</strong>
          </div>
          <div className="p-2.5 rounded bg-[#07131c]/60 border border-[#d7e6eb]/10">
            <span className="text-[9px] text-[#8aa0a8] block">CONFIDENCE</span>
            <strong className="text-[#f7f7f3] text-sm">{selectedTrack.confidence}%</strong>
          </div>
        </div>

        {/* Vector and Behavior */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-mono">
          <div className="p-2 rounded bg-[#07131c]/40 border border-[#d7e6eb]/10">
            <span className="text-[9px] text-[#8aa0a8] block">HEADING / VECTOR</span>
            <span className="text-[#bcebf1]">{selectedTrack.heading}° Bearing</span>
          </div>
          <div className="p-2 rounded bg-[#07131c]/40 border border-[#d7e6eb]/10">
            <span className="text-[9px] text-[#8aa0a8] block">BEHAVIOR PROFILE</span>
            <span className="text-[#bcebf1] capitalize">{selectedTrack.behavior}</span>
          </div>
          <div className="p-2 rounded bg-[#07131c]/40 border border-[#d7e6eb]/10">
            <span className="text-[9px] text-[#8aa0a8] block">ORIGIN / CORRIDOR</span>
            <span className="text-[#bcebf1]">{selectedTrack.home}</span>
          </div>
        </div>

        {/* Threat Score Rationale */}
        <div className="p-3 rounded bg-[#07131c]/60 border border-[#d7e6eb]/15">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono text-[#8aa0a8] font-bold">
              THREAT EXPLANATION MATRIX (SCORE: {selectedTrack.score}/99)
            </span>
            <span
              className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                selectedTrack.level === 'critical'
                  ? 'bg-[#d65458] text-white'
                  : selectedTrack.level === 'high'
                  ? 'bg-[#e59c2b] text-[#081a27]'
                  : selectedTrack.level === 'watch'
                  ? 'bg-[#00a7bd] text-white'
                  : 'bg-[#1da98a] text-white'
              }`}
            >
              {selectedTrack.level}
            </span>
          </div>
          <ul className="space-y-1 text-xs text-[#bcebf1]">
            {selectedTrack.reasons.map((reason, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-[#d7ff3f] mt-0.5">›</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Real-Time Action Bar */}
        <div className="pt-2 border-t border-[#d7e6eb]/15 space-y-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() =>
                onOpenIncidentModal(
                  selectedTrack.id,
                  selectedTrack.callsign,
                  selectedTrack.level
                )
              }
              className="flex-1 min-w-[140px] px-3 py-2 bg-[#d65458]/20 hover:bg-[#d65458]/30 border border-[#d65458] text-[#f7f7f3] rounded font-mono text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(214,84,88,0.2)]"
            >
              <span>⚠</span>
              <span>LOG CLOUD INCIDENT</span>
            </button>

            <button
              type="button"
              onClick={() => toggleWatchlistTarget(selectedTrack)}
              className={`flex-1 min-w-[140px] px-3 py-2 rounded font-mono text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                isWatched
                  ? 'border-[#e59c2b] bg-[#e59c2b]/20 text-[#e59c2b]'
                  : 'border-[#53707d] hover:border-[#00a7bd] text-[#dffbfa]'
              }`}
            >
              <span>{isWatched ? '★' : '☆'}</span>
              <span>{isWatched ? 'IN WATCHLIST' : 'ADD TO WATCHLIST'}</span>
            </button>

            {!isAck ? (
              <button
                type="button"
                onClick={() => setShowAckInput((prev) => !prev)}
                className="px-3.5 py-2 bg-[#00a7bd] hover:bg-[#007c91] text-white rounded font-mono text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(0,167,189,0.3)]"
              >
                <span>✓</span>
                <span>ACKNOWLEDGE</span>
              </button>
            ) : (
              <div className="px-3 py-1.5 bg-[#1da98a]/20 border border-[#1da98a]/40 text-[#1da98a] rounded font-mono text-xs font-bold flex items-center gap-1.5">
                <span>✓ ACKNOWLEDGED</span>
              </div>
            )}
          </div>

          {showAckInput && (
            <form onSubmit={handleAckSubmit} className="space-y-2 p-3 rounded bg-[#0b2230] border border-[#00a7bd]/40">
              <label className="text-[10px] font-mono text-[#8aa0a8] block">
                OPERATOR INVESTIGATION NOTE (SAVED TO FIRESTORE)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Visually confirmed benign bird flight path or authorized UAV"
                className="w-full p-2 bg-[#04141b] border border-[#1b5961] text-[#dffbfa] text-xs font-mono rounded outline-none focus:border-[#72dbc2]"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAckInput(false)}
                  className="px-2.5 py-1 text-xs font-mono text-[#8aa0a8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-[#1da98a] text-[#081a27] font-bold font-mono text-xs rounded"
                >
                  Confirm & Sync
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </article>
  );
};
