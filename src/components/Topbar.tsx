import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAirspace } from '../context/AirspaceContext';

export const Topbar: React.FC = () => {
  const { user, profile, demoOperator, signInWithGoogle, signOutOperator } = useAuth();
  const { online, firebaseConnected } = useAirspace();
  const [utcTime, setUtcTime] = useState<string>('--:--:-- UTC');
  const [showUserDropdown, setShowUserDropdown] = useState<boolean>(false);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const pad = (v: number) => String(v).padStart(2, '0');
      setUtcTime(`${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())} UTC`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="topbar">
      <div className="breadcrumb flex items-center gap-2">
        <img
          src="/assets/logo.png"
          alt="SKYLOCK SENITAL"
          className="w-5 h-5 object-contain drop-shadow-[0_0_6px_rgba(0,167,189,0.5)] shrink-0"
        />
        <span>SKYLOCK /</span>
        <strong>COMMAND OVERVIEW</strong>
        <span className="breadcrumb-id">AAS-26-1025</span>
      </div>

      <div className="topbar-actions flex items-center gap-2.5">
        {/* Network connection pill */}
        <div
          className={`connection-pill ${!online ? 'offline' : ''}`}
          id="connection-pill"
          title={online ? (firebaseConnected ? 'Connected to Firebase Cloud DB' : 'Local telemetry') : 'Offline sensor fallback'}
        >
          <span className="signal-icon">⌁</span>
          <span id="connection-label">{online ? 'CONNECTED' : 'OFFLINE'}</span>
        </div>

        {/* Live UTC Clock */}
        <div className="clock" id="clock">
          {utcTime}
        </div>

        {/* User Operator Avatar Button */}
        <div className="relative">
          <button
            className="user-button w-8 h-8 rounded-lg cursor-pointer"
            aria-label="Operator menu"
            onClick={() => setShowUserDropdown((prev) => !prev)}
          >
            {user ? (profile?.callsign?.slice(0, 2) || 'OP') : 'OP'}
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 top-10 w-64 p-3 bg-[#081a27] border border-[#00a7bd] rounded-lg shadow-2xl z-50 font-mono text-xs space-y-2">
              <div className="border-b border-[#1b5961] pb-2">
                <span className="text-[10px] text-[#8aa0a8] block">ACTIVE OPERATOR</span>
                <strong className="text-[#f7f7f3] text-sm block">
                  {user ? (profile?.displayName || 'Commander') : demoOperator.callsign}
                </strong>
                <span className="text-[10px] text-[#72dbc2]">
                  {user ? user.email : 'Local Demo Operator'}
                </span>
              </div>

              <div className="text-[10px] text-[#8aa0a8] space-y-1">
                <div>
                  Firebase Auth:{' '}
                  <strong className={user ? 'text-[#1da98a]' : 'text-[#e59c2b]'}>
                    {user ? 'Verified (Google)' : 'Unlinked Demo'}
                  </strong>
                </div>
                <div>
                  Firestore Database:{' '}
                  <strong className={firebaseConnected ? 'text-[#1da98a]' : 'text-[#e59c2b]'}>
                    {firebaseConnected ? 'Active' : 'Connecting…'}
                  </strong>
                </div>
              </div>

              <div className="pt-2 border-t border-[#1b5961] flex flex-col gap-1.5">
                {!user ? (
                  <button
                    onClick={() => {
                      signInWithGoogle();
                      setShowUserDropdown(false);
                    }}
                    className="w-full py-1.5 bg-[#00a7bd] hover:bg-[#007c91] text-white rounded text-center font-bold"
                  >
                    Link Google Account
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      signOutOperator();
                      setShowUserDropdown(false);
                    }}
                    className="w-full py-1 text-[#d65458] hover:bg-[#d65458]/10 rounded text-center"
                  >
                    Sign Out
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
