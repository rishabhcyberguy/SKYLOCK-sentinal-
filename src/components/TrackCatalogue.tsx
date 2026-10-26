import React from 'react';
import { useAirspace } from '../context/AirspaceContext';

export const TrackCatalogue: React.FC = () => {
  const {
    tracks,
    selectedTrackId,
    setSelectedTrackId,
    sortThreat,
    toggleSortThreat,
    watchlist,
    toggleWatchlistTarget,
  } = useAirspace();

  const sortedTracks = [...tracks].sort((a, b) => {
    if (sortThreat) return b.score - a.score;
    return a.id.localeCompare(b.id);
  });

  return (
    <article className="panel tracks-panel" id="tracks-section">
      <div className="panel-header">
        <div>
          <div className="panel-kicker">OBJECT CATALOGUE</div>
          <h2>
            Tracked objects <span className="heading-count" id="track-count-heading">{String(tracks.length).padStart(2, '0')}</span>
          </h2>
        </div>
        <button
          className="text-button"
          id="sort-threat-button"
          onClick={toggleSortThreat}
        >
          {sortThreat ? 'Sorted by threat ↓' : 'Sort by ID ↕'}
        </button>
      </div>

      <div className="table-wrap overflow-x-auto custom-scrollbar">
        <table className="track-table w-full text-left font-mono text-xs">
          <thead>
            <tr className="border-b border-[#d7e6eb]/15 text-[#8aa0a8] text-[10px]">
              <th className="py-2.5 px-3">IDENTITY</th>
              <th className="py-2.5 px-3">CLASS</th>
              <th className="py-2.5 px-3">ALT</th>
              <th className="py-2.5 px-3">SPD</th>
              <th className="py-2.5 px-3">HEADING</th>
              <th className="py-2.5 px-3">THREAT</th>
              <th className="py-2.5 px-3">STATE</th>
              <th className="py-2.5 px-3 text-right">WATCH</th>
            </tr>
          </thead>
          <tbody id="track-table-body" className="divide-y divide-[#d7e6eb]/10">
            {sortedTracks.map((track) => {
              const isSelected = track.id === selectedTrackId;
              const isWatched = !!watchlist[track.id];

              const badgeColor =
                track.level === 'critical'
                  ? 'text-[#d65458] border-[#d65458]/40 bg-[#d65458]/10'
                  : track.level === 'high'
                  ? 'text-[#e59c2b] border-[#e59c2b]/40 bg-[#e59c2b]/10'
                  : track.level === 'watch'
                  ? 'text-[#00a7bd] border-[#00a7bd]/40 bg-[#00a7bd]/10'
                  : 'text-[#1da98a] border-[#1da98a]/40 bg-[#1da98a]/10';

              return (
                <tr
                  key={track.id}
                  onClick={() => setSelectedTrackId(track.id)}
                  className={`cursor-pointer transition-colors ${
                    isSelected ? 'bg-[#0c2a3a] text-[#f7f7f3]' : 'hover:bg-[#0c2a3a]/40 text-[#dffbfa]'
                  }`}
                >
                  <td className="py-3 px-3 font-bold flex items-center gap-2">
                    <span className="text-[#d7ff3f]">{track.symbol}</span>
                    <span>{track.callsign}</span>
                    <span className="text-[10px] text-[#8aa0a8]">({track.id})</span>
                  </td>
                  <td className="py-3 px-3 text-[#8aa0a8] text-[11px]">{track.type}</td>
                  <td className="py-3 px-3">{track.altitude} m</td>
                  <td className="py-3 px-3">{track.speed} kt</td>
                  <td className="py-3 px-3">{track.heading}°</td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] border font-bold uppercase ${badgeColor}`}
                    >
                      {track.level} ({track.score})
                    </span>
                  </td>
                  <td className="py-3 px-3 text-[11px]">
                    {track.restricted ? (
                      <span className="text-[#d65458] font-bold">RESTRICTED</span>
                    ) : (
                      <span className="text-[#8aa0a8]">{track.behavior}</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWatchlistTarget(track);
                      }}
                      className={`p-1 rounded text-xs transition-colors ${
                        isWatched ? 'text-[#e59c2b]' : 'text-[#8aa0a8] hover:text-[#dffbfa]'
                      }`}
                      title={isWatched ? 'Remove from Cloud Watchlist' : 'Add to Cloud Watchlist'}
                    >
                      {isWatched ? '★' : '☆'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </article>
  );
};
