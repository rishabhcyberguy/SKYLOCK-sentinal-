import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAirspace } from '../context/AirspaceContext';

interface SystemGateProps {
  onAccessGranted: () => void;
}

export const SystemGate: React.FC<SystemGateProps> = ({ onAccessGranted }) => {
  const { user, isDemoSession, signInWithGoogle, startDemoSession } = useAuth();
  const { firebaseConnected, firebaseProjectId } = useAirspace();

  const [showLogin, setShowLogin] = useState<boolean>(false);
  const [callsign, setCallsign] = useState<string>('operator');
  const [accessKey, setAccessKey] = useState<string>('skylock2026');
  const [statusMessage, setStatusMessage] = useState<string>('Demo access: operator / skylock2026 or Sign in with Google');
  const [isError, setIsError] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isExiting, setIsExiting] = useState<boolean>(false);

  // If already authenticated via Firebase or Demo session, bypass gate
  if (user || isDemoSession) {
    return null;
  }

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCallsign = callsign.trim().toLowerCase();
    const cleanKey = accessKey.trim();

    if (
      (cleanCallsign === 'operator' && (cleanKey === 'skylock2026' || cleanKey === 'aegis2026')) ||
      (cleanCallsign === 'demo' && (cleanKey === 'skylock' || cleanKey === 'aegis'))
    ) {
      setIsError(false);
      setStatusMessage('SESSION ACCEPTED / INITIALIZING COMMAND DECK');
      setIsExiting(true);
      window.setTimeout(() => {
        startDemoSession(callsign.toUpperCase());
        onAccessGranted();
      }, 500);
    } else {
      setIsError(true);
      setStatusMessage('ACCESS DENIED / USE OPERATOR DEMO CREDENTIALS OR GOOGLE SIGN-IN');
    }
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
      setIsExiting(true);
      window.setTimeout(() => {
        onAccessGranted();
      }, 500);
    } catch (err: any) {
      setIsError(true);
      setStatusMessage(`AUTH FAILED: ${err?.message || 'Popup closed or cancelled'}`);
      setIsSubmitting(false);
    }
  };

  return (
    <section className={`system-gate ${isExiting ? 'is-exiting' : ''}`} id="system-gate" aria-label="Skylock Senital system access">
      <div className="system-gate-scanline"></div>
      <div className="system-gate-grid"></div>
      <div className="system-gate-header">
        <span className="gate-status">
          <i></i> SECURE SYSTEM / SKYLOCK SENITAL
        </span>
        <span className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${firebaseConnected ? 'bg-[#1da98a]' : 'bg-[#e59c2b]'}`}></span>
          FIREBASE: {firebaseConnected ? 'CONNECTED' : 'STANDBY'} ({firebaseProjectId.slice(0, 14)}…)
        </span>
      </div>

      <div className="system-gate-center">
        <div className="relative mb-6 flex justify-center" aria-hidden="true">
          <div className="relative group">
            <div className="absolute -inset-3 rounded-full bg-[#00a7bd]/25 blur-xl opacity-80 animate-pulse"></div>
            <img
              src="/assets/logo.png"
              alt="SKYLOCK SENITAL Insignia"
              className="relative w-28 h-28 sm:w-32 sm:h-32 object-contain drop-shadow-[0_0_24px_rgba(0,167,189,0.55)] transition-transform duration-500 hover:scale-105"
            />
          </div>
        </div>
        <p className="gate-eyebrow">DEFENSE AIRSPACE SURVEILLANCE / CLOUD REAL-TIME</p>
        <h1>SKYLOCK <em>SENITAL</em></h1>
        <p className="gate-copy">
          Counter-drone monitoring, trajectory intelligence, and real-time Firebase Firestore data synchronization.
        </p>

        {!showLogin ? (
          <div className="hacker-container">
            <button
              className="hacker-btn"
              id="system-access-button"
              type="button"
              onClick={() => setShowLogin(true)}
            >
              <span>ACCESS SYSTEM</span>
              <b aria-hidden="true">_</b>
              <i className="hacker-tooltip" data-text="AUTHENTICATED ACCESS">
                <span>AUTHENTICATED ACCESS</span>
              </i>
            </button>
          </div>
        ) : (
          <div className="system-login space-y-4">
            <div className="login-heading">
              <span>OPERATOR AUTHENTICATION</span>
              <small>SECURE FIREBASE CLOUD</small>
            </div>

            {/* Google Sign-In Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 bg-[#0b2230] hover:bg-[#0f2e42] border border-[#00a7bd] text-[#dffbfa] rounded font-mono text-xs font-bold transition-all shadow-[0_0_12px_rgba(0,167,189,0.3)] hover:shadow-[0_0_18px_rgba(0,167,189,0.5)] cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isSubmitting ? 'AUTHENTICATING…' : 'SIGN IN WITH GOOGLE'}</span>
            </button>

            <div className="flex items-center gap-2 text-[9px] text-[#5c8c93]">
              <span className="flex-1 h-[1px] bg-[#1b5961]"></span>
              <span>OR LOCAL DEMO ACCESS</span>
              <span className="flex-1 h-[1px] bg-[#1b5961]"></span>
            </div>

            <form onSubmit={handleDemoSubmit} className="space-y-2">
              <label>
                CALLSIGN
                <input
                  id="login-callsign"
                  value={callsign}
                  onChange={(e) => setCallsign(e.target.value)}
                  placeholder="operator"
                  required
                />
              </label>
              <label>
                ACCESS KEY
                <input
                  id="login-key"
                  type="password"
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  placeholder="skylock2026"
                  required
                />
              </label>
              <button className="login-submit" type="submit">
                INITIALIZE OPERATOR SESSION <span>→</span>
              </button>
            </form>

            <p className={`login-status ${isError ? 'error' : ''}`} id="login-status">
              {statusMessage}
            </p>
          </div>
        )}

        <div className="gate-footer">
          <span>
            <i className="pulse-dot"></i> ENCRYPTED AIRSPACE PICTURE
          </span>
          <span>BUILD 02 / 2026 · FIREBASE & CLOUDFLARE</span>
        </div>
      </div>
    </section>
  );
};
