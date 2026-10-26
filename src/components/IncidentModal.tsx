import React, { useState } from 'react';
import { useAirspace } from '../context/AirspaceContext';
import { useAuth } from '../context/AuthContext';
import { validateIncidentPayload } from '../utils/airspaceRules';

interface IncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTrackId?: string;
  initialCallsign?: string;
  initialSeverity?: string;
}

export const IncidentModal: React.FC<IncidentModalProps> = ({
  isOpen,
  onClose,
  initialTrackId = '',
  initialCallsign = '',
  initialSeverity = 'high',
}) => {
  const { incidents, createIncidentReport, tracks } = useAirspace();
  const { user, profile, demoOperator } = useAuth();

  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);

  // Form states
  const [trackId, setTrackId] = useState<string>(initialTrackId || (tracks[0]?.id ?? 'AX-204'));
  const [targetCallsign, setTargetCallsign] = useState<string>(
    initialCallsign || (tracks[0]?.callsign ?? 'RAVEN')
  );
  const [severity, setSeverity] = useState<'critical' | 'high' | 'watch' | 'routine'>(
    (initialSeverity as any) || 'high'
  );
  const [title, setTitle] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleTrackChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setTrackId(selectedId);
    const found = tracks.find((t) => t.id === selectedId);
    if (found) {
      setTargetCallsign(found.callsign);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Please specify an incident summary title.');
      return;
    }

    const testId = `inc-${Date.now()}`;
    const authorId = user ? user.uid : 'demo-op';
    if (!validateIncidentPayload({ id: testId, trackId, severity, title, authorId })) {
      setErrorMsg('Incident data failed validation constraints.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await createIncidentReport({
        trackId,
        targetCallsign,
        severity,
        title: title.trim(),
        summary: summary.trim(),
      });
      setTitle('');
      setSummary('');
      setShowCreateForm(false);
    } catch (err: any) {
      setErrorMsg(`Failed to publish incident to Firestore: ${err?.message || 'Error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredIncidents = incidents.filter((inc) => {
    if (filterSeverity === 'all') return true;
    return inc.severity === filterSeverity;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Airspace Incidents Command Deck"
    >
      <div className="relative w-full max-w-3xl bg-[#081a27] border border-[#d65458] rounded-xl shadow-[0_0_40px_rgba(214,84,88,0.25)] p-6 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1b5961]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#d65458]/20 border border-[#d65458] flex items-center justify-center text-[#d65458] font-black text-sm">
              ⚠
            </div>
            <div>
              <h3 className="text-base font-bold text-[#f7f7f3] font-mono tracking-wider">
                AIRSPACE INCIDENTS LOG (FIRESTORE)
              </h3>
              <p className="text-[11px] text-[#8aa0a8] font-mono">
                Real-Time Defense Network Incident Log · Synced Across All Operators
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

        {/* Controls row */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-b border-[#1b5961]/40">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-[#8aa0a8]">FILTER:</span>
            {['all', 'critical', 'high', 'watch', 'routine'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilterSeverity(lvl)}
                className={`px-2.5 py-1 rounded text-[10px] font-mono uppercase font-bold transition-all ${
                  filterSeverity === lvl
                    ? 'bg-[#00a7bd] text-white'
                    : 'bg-[#0b2230] text-[#8aa0a8] hover:text-[#dffbfa]'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowCreateForm((prev) => !prev)}
            className="px-3 py-1.5 bg-[#d65458] hover:bg-[#e0666a] text-white rounded font-mono text-xs font-bold transition-all shadow-[0_0_12px_rgba(214,84,88,0.3)] cursor-pointer"
          >
            {showCreateForm ? 'CLOSE FORM' : '+ NEW INCIDENT REPORT'}
          </button>
        </div>

        {/* Form to log incident */}
        {showCreateForm && (
          <form
            onSubmit={handleSubmit}
            className="p-4 my-3 rounded-lg bg-[#04141b] border border-[#d65458]/40 space-y-3 font-mono text-xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#f7f7f3]">LOG REAL-TIME INCIDENT</span>
              <span className="text-[10px] text-[#8aa0a8]">
                OPERATOR: {user ? profile?.callsign || 'COMMANDER' : demoOperator.callsign}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-[#8aa0a8] block mb-1">TARGET TRACK</label>
                <select
                  value={trackId}
                  onChange={handleTrackChange}
                  className="w-full p-2 bg-[#081a27] border border-[#1b5961] text-[#dffbfa] rounded outline-none"
                >
                  {tracks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.callsign} ({t.id}) - {t.type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-[#8aa0a8] block mb-1">SEVERITY</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as any)}
                  className="w-full p-2 bg-[#081a27] border border-[#1b5961] text-[#dffbfa] rounded outline-none"
                >
                  <option value="critical">Critical (Immediate Incursion)</option>
                  <option value="high">High (Vector Anomaly)</option>
                  <option value="watch">Watch (Corridor Loitering)</option>
                  <option value="routine">Routine (Scheduled Transit)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-[#8aa0a8] block mb-1">TARGET CALLSIGN</label>
                <input
                  type="text"
                  value={targetCallsign}
                  onChange={(e) => setTargetCallsign(e.target.value)}
                  className="w-full p-2 bg-[#081a27] border border-[#1b5961] text-[#dffbfa] rounded outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-[#8aa0a8] block mb-1">INCIDENT TITLE *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Unscheduled altitude drop within 500m of restricted perimeter"
                maxLength={128}
                required
                className="w-full p-2 bg-[#081a27] border border-[#1b5961] text-[#dffbfa] rounded outline-none focus:border-[#72dbc2]"
              />
            </div>

            <div>
              <label className="text-[10px] text-[#8aa0a8] block mb-1">SUMMARY & TELEMETRY OBSERVATIONS</label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Document observed speed, vector trajectory deviations, or visual confirmations."
                maxLength={1000}
                rows={2}
                className="w-full p-2 bg-[#081a27] border border-[#1b5961] text-[#dffbfa] rounded outline-none focus:border-[#72dbc2] resize-none"
              ></textarea>
            </div>

            {errorMsg && <p className="text-xs text-[#d65458] font-bold">{errorMsg}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-3 py-1.5 text-xs text-[#8aa0a8]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-1.5 bg-[#d65458] hover:bg-[#e0666a] text-white font-bold rounded"
              >
                {isSubmitting ? 'BROADCASTING…' : 'BROADCAST TO DEFENSE NETWORK'}
              </button>
            </div>
          </form>
        )}

        {/* Incidents feed list */}
        <div className="flex-1 overflow-y-auto space-y-3 py-3 custom-scrollbar">
          {filteredIncidents.length === 0 ? (
            <div className="p-8 text-center text-xs font-mono text-[#8aa0a8] border border-dashed border-[#1b5961] rounded-lg">
              No incidents logged under &apos;{filterSeverity}&apos;. Broadcast an incident to sync across all connected operators.
            </div>
          ) : (
            filteredIncidents.map((incident) => {
              const badgeStyle =
                incident.severity === 'critical'
                  ? 'bg-[#d65458] text-white'
                  : incident.severity === 'high'
                  ? 'bg-[#e59c2b] text-[#081a27]'
                  : incident.severity === 'watch'
                  ? 'bg-[#00a7bd] text-white'
                  : 'bg-[#1da98a] text-white';

              return (
                <div
                  key={incident.id}
                  className="p-3.5 rounded-lg bg-[#04141b] border border-[#1b5961]/70 hover:border-[#00a7bd]/60 transition-all font-mono text-xs"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${badgeStyle}`}>
                        {incident.severity}
                      </span>
                      <strong className="text-[#f7f7f3] text-sm">{incident.title}</strong>
                    </div>
                    <span className="text-[10px] text-[#8aa0a8]">
                      {new Date(incident.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} UTC
                    </span>
                  </div>

                  {incident.summary && (
                    <p className="text-xs text-[#bcebf1] mb-2 font-sans">{incident.summary}</p>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#1b5961]/30 text-[10px] text-[#8aa0a8]">
                    <span>
                      TARGET: <strong className="text-[#dffbfa]">{incident.targetCallsign || incident.trackId}</strong> [{incident.trackId}]
                    </span>
                    <span>
                      LOGGED BY: <strong className="text-[#72dbc2]">{incident.authorCallsign || 'OPERATOR'}</strong>
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#1b5961] flex justify-between items-center text-[10px] font-mono text-[#8aa0a8]">
          <span>Firestore Collection: /incidents</span>
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
