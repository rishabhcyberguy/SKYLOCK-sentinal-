import React, { useState } from 'react';
import { useAirspace } from '../context/AirspaceContext';

interface CloudflareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloudflareModal: React.FC<CloudflareModalProps> = ({ isOpen, onClose }) => {
  const { firebaseConnected, pingLatencyMs, firebaseProjectId, firestoreDatabaseId } = useAirspace();
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Cloudflare and Firebase Deployment Operations Center"
    >
      <div className="relative w-full max-w-2xl bg-[#081a27] border border-[#00a7bd] rounded-xl shadow-[0_0_40px_rgba(0,167,189,0.25)] p-6 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1b5961]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#f38020]/20 border border-[#f38020] flex items-center justify-center text-[#f38020] font-black text-sm">
              CF
            </div>
            <div>
              <h3 className="text-base font-bold text-[#f7f7f3] font-mono tracking-wider">
                CLOUDFLARE HOSTING & FIREBASE DB
              </h3>
              <p className="text-[11px] text-[#8aa0a8] font-mono">
                Static Edge Deployment + Real-Time Cloud Firestore
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

        {/* Content body */}
        <div className="flex-1 overflow-y-auto space-y-5 py-4 custom-scrollbar">
          {/* Cloudflare Edge Status */}
          <div className="p-4 rounded-lg bg-[#04141b] border border-[#1b5961]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-[#f38020] font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#f38020] animate-pulse"></span>
                CLOUDFLARE STATIC ASSET TARGET
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1da98a]/20 border border-[#1da98a]/40 text-[#1da98a]">
                SPA READY
              </span>
            </div>
            <p className="text-xs text-[#bcebf1] mb-3">
              SKYLOCK SENITAL compiles into a high-performance, offline-capable static single-page bundle in <code className="text-[#d7ff3f]">dist/</code>, served globally across Cloudflare’s 300+ edge cities.
            </p>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-[#081a27] p-2.5 rounded border border-[#1b5961]/50 text-[#8aa0a8]">
              <div>
                Config file: <strong className="text-[#f7f7f3]">wrangler.toml</strong>
              </div>
              <div>
                Asset dir: <strong className="text-[#f7f7f3]">./dist</strong>
              </div>
              <div>
                SPA routing: <strong className="text-[#1da98a]">Enabled</strong>
              </div>
              <div>
                Compatibility: <strong className="text-[#f7f7f3]">2026-10-25</strong>
              </div>
            </div>
          </div>

          {/* Deployment Commands */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#d7ff3f] font-mono tracking-wider">
              DEPLOYMENT RUNBOOK (CLI)
            </h4>

            {/* Step 1: Build */}
            <div className="p-3 rounded bg-[#04141b] border border-[#1b5961]/60 flex items-center justify-between gap-3 font-mono text-xs">
              <div>
                <span className="text-[10px] text-[#8aa0a8] block">STEP 1: BUILD STATIC BUNDLE</span>
                <code className="text-[#dffbfa]">npm run build:cloudflare</code>
              </div>
              <button
                onClick={() => copyToClipboard('npm run build:cloudflare', 'cmd1')}
                className="px-3 py-1.5 bg-[#0b2230] hover:bg-[#1b5961] text-[#72dbc2] rounded text-[11px] font-bold border border-[#00a7bd]/40 transition-colors"
              >
                {copiedCmd === 'cmd1' ? 'COPIED!' : 'COPY'}
              </button>
            </div>

            {/* Step 2: Login */}
            <div className="p-3 rounded bg-[#04141b] border border-[#1b5961]/60 flex items-center justify-between gap-3 font-mono text-xs">
              <div>
                <span className="text-[10px] text-[#8aa0a8] block">STEP 2: AUTHENTICATE WRANGLER</span>
                <code className="text-[#dffbfa]">npx wrangler login</code>
              </div>
              <button
                onClick={() => copyToClipboard('npx wrangler login', 'cmd2')}
                className="px-3 py-1.5 bg-[#0b2230] hover:bg-[#1b5961] text-[#72dbc2] rounded text-[11px] font-bold border border-[#00a7bd]/40 transition-colors"
              >
                {copiedCmd === 'cmd2' ? 'COPIED!' : 'COPY'}
              </button>
            </div>

            {/* Step 3: Deploy */}
            <div className="p-3 rounded bg-[#04141b] border border-[#1b5961]/60 flex items-center justify-between gap-3 font-mono text-xs">
              <div>
                <span className="text-[10px] text-[#8aa0a8] block">STEP 3: DEPLOY TO CLOUDFLARE</span>
                <code className="text-[#dffbfa]">npx wrangler deploy</code>
              </div>
              <button
                onClick={() => copyToClipboard('npx wrangler deploy', 'cmd3')}
                className="px-3 py-1.5 bg-[#00a7bd] hover:bg-[#007c91] text-white rounded text-[11px] font-bold transition-colors"
              >
                {copiedCmd === 'cmd3' ? 'COPIED!' : 'COPY'}
              </button>
            </div>
          </div>

          {/* Firebase Database Status */}
          <div className="p-4 rounded-lg bg-[#04141b] border border-[#00a7bd]/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-[#72dbc2] font-bold flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${firebaseConnected ? 'bg-[#1da98a]' : 'bg-[#e59c2b]'}`}></span>
                FIREBASE CLOUD FIRESTORE
              </span>
              <span className="text-[10px] font-mono text-[#8aa0a8]">
                {pingLatencyMs !== null ? `${pingLatencyMs}ms ping` : 'Checking latency…'}
              </span>
            </div>

            <div className="space-y-1.5 text-xs font-mono text-[#bcebf1]">
              <div className="flex justify-between py-1 border-b border-[#1b5961]/30">
                <span className="text-[#8aa0a8]">Project ID:</span>
                <span className="text-[#f7f7f3] font-bold">{firebaseProjectId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1b5961]/30">
                <span className="text-[#8aa0a8]">Firestore Database:</span>
                <span className="text-[#f7f7f3]">{firestoreDatabaseId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1b5961]/30">
                <span className="text-[#8aa0a8]">Security Rules:</span>
                <span className="text-[#1da98a] font-bold">Hardened ABAC (Deployed)</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#8aa0a8]">Active Sync Channels:</span>
                <span className="text-[#d7ff3f]">4 Live Snapshot Listeners</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[#1b5961] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#00a7bd] hover:bg-[#007c91] text-white rounded font-mono text-xs font-bold transition-all shadow-[0_0_15px_rgba(0,167,189,0.3)] cursor-pointer"
          >
            DISMISS PANEL
          </button>
        </div>
      </div>
    </div>
  );
};
