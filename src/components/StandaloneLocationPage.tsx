import React, { useState, useEffect } from 'react';
import { useAirspace } from '../context/AirspaceContext';
import { LocationIntel } from './LocationIntel';

export const StandaloneLocationPage: React.FC = () => {
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
            className="w-7 h-7 object-contain drop-shadow-[0_0_8px_rgba(0,167,189,0.5)] shrink-0"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00ff66] animate-pulse shadow-[0_0_8px_#00ff66]"></span>
              <span className="text-[10px] font-mono tracking-widest text-[#00ff66] font-bold">
                GEOSPATIAL & SATELLITE RF INTELLIGENCE
              </span>
              <span className="text-[9px] font-mono text-[#8aa0a8] px-1.5 py-0.5 rounded bg-[#04141b] border border-[#1b5961]">
                FULL-PAGE VIEW
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-black font-mono tracking-wider text-[#f7f7f3] m-0">
              SKYLOCK SENITAL // LOCATION INTELLIGENCE HUB
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-[#8aa0a8]">
          <span className="hidden sm:inline">GEODETIC SYSTEM: WGS-84</span>
          <span className="inline-flex items-center gap-1.5 text-[#00ff66]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00ff66]"></span>
            RF RECON READY
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-8">
        {/* Full-width Location Intelligence Display */}
        <LocationIntel isStandalone={true} />

        {/* Tactical Guidance and Geolocation Protocols */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          <div className="p-4 rounded-xl bg-[#071724] border border-[#1b5961] space-y-2">
            <span className="text-[10px] font-bold text-[#00ff66] tracking-widest block uppercase">
              // PROTOCOL 01: EMITTER TRIANGULATION
            </span>
            <p className="text-[#8aa0a8] leading-relaxed m-0 text-[11px]">
              Multi-sensor RF correlation compares microsecond time-difference of arrival (TDOA) across regional listening posts to compute high-confidence coordinate bounds.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#071724] border border-[#1b5961] space-y-2">
            <span className="text-[10px] font-bold text-[#72dbc2] tracking-widest block uppercase">
              // PROTOCOL 02: REVERSE GEOCODING
            </span>
            <p className="text-[#8aa0a8] leading-relaxed m-0 text-[11px]">
              OpenStreetMap Nominatim endpoint links raw lat/lon vectors with municipal boundaries, air corridors, restricted landing zones, and physical landmarks.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#071724] border border-[#1b5961] space-y-2">
            <span className="text-[10px] font-bold text-[#e59c2b] tracking-widest block uppercase">
              // PROTOCOL 03: CLOUD SYNC
            </span>
            <p className="text-[#8aa0a8] leading-relaxed m-0 text-[11px]">
              Signal locks, custom IP queries, and incident geofences persist automatically to the real-time Firebase Firestore database for immediate team situational awareness.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};
