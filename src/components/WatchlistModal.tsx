import React from 'react';
import { useAirspace } from '../context/AirspaceContext';

interface WatchlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTrack: (trackId: string) => void;
}

export const WatchlistModal: React.FC<WatchlistModalProps> = ({
  isOpen,
  onClose,
  onSelectTrack,
}) => {
  const { watchlist, tracks, toggleWatchlistTarget } = useAirspace();

  if (!isOpen) return null;

  const watchlistItems = Object.values(watchlist);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Target Priority Watchlist"
    >
      <div className="relative w-full max-w-2xl bg-[#081a27] border border-[#e59c2b] rounded-xl shadow-[0_0_40px_rgba(229,156,43,0.25)] p-6 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1b5961]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#e59c2b]/20 border border-[#e59c2b] flex items-center justify-center text-[#e59c2b] font-black text-sm">
              ★
            </div>
            <div>
              <h3 className="text-base font-bold text-[#f7f7f3] font-mono tracking-wider">
                TARGET PRIORITY WATCHLIST (FIRESTORE)
              </h3>
              <p className="text-[11px] text-[#8aa0a8] font-mono">
                Shared Airspace Surveillance · Synced In Real Time
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#0b2230] hover:bg-[#1b5961] text-[#dffbfa] flex items-center justify-center text-sm font-mono cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto space-y-3 py-4 custom-scrollbar">
          {watchlistItems.length === 0 ? (
            <div className="p-8 text-center text-xs font-mono text-[#8aa0a8] border border-dashed border-[#1b5961] rounded-lg">
              No targets on priority watchlist. Click the star icon (☆) on any radar target to flag it for elevated surveillance.
            </div>
          ) : (
            watchlistItems.map((item) => {
              const liveTrack = tracks.find((t) => t.id === item.trackId);
              return (
                <div
                  key={item.trackId}
                  className="p-3.5 rounded-lg bg-[#04141b] border border-[#e59c2b]/40 hover:border-[#e59c2b] transition-all flex items-center justify-between gap-3 font-mono text-xs"
                >
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => {
                      onSelectTrack(item.trackId);
                      onClose();
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <strong className="text-[#f7f7f3] text-sm">{item.callsign || item.trackId}</strong>
                      <span className="text-[10px] text-[#8aa0a8]">[{item.trackId}]</span>
                      <span className="text-[9px] uppercase px-2 py-0.5 rounded bg-[#e59c2b]/20 text-[#e59c2b] font-bold">
                        {item.priority}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[10px] text-[#8aa0a8]">
                      {liveTrack ? (
                        <>
                          <span>ALT: {liveTrack.altitude}m</span>
                          <span>SPD: {liveTrack.speed}kt</span>
                          <span>THREAT: {liveTrack.score}/99</span>
                        </>
                      ) : (
                        <span>Outside current sector</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        onSelectTrack(item.trackId);
                        onClose();
                      }}
                      className="px-3 py-1 bg-[#0b2230] hover:bg-[#1b5961] text-[#72dbc2] text-xs font-bold rounded border border-[#00a7bd]/40 transition-colors"
                    >
                      Focus Target
                    </button>
                    {liveTrack && (
                      <button
                        onClick={() => toggleWatchlistTarget(liveTrack)}
                        className="px-2.5 py-1 text-xs text-[#d65458] hover:bg-[#d65458]/10 rounded border border-[#d65458]/40 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#1b5961] flex justify-between items-center text-[10px] font-mono text-[#8aa0a8]">
          <span>Active Tracked Targets: {watchlistItems.length}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#0b2230] hover:bg-[#1b5961] text-[#dffbfa] rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
