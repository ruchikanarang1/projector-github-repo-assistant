import React, { useState, useEffect } from 'react';
import { Terminal, GitBranch, FolderGit2, ChevronDown, Plus, Wifi, WifiOff, Settings as SettingsIcon, Shield, Cpu } from 'lucide-react';

export default function Navbar({ currentProject, onOpenRepoModal, onNavigate, activeTab }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <header className="h-14 px-4 sm:px-6 bg-[#07080c] border-b border-[#1a1e2e] flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Brand & Project Info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-[#131724] border border-[#2b334c] flex items-center justify-center text-steel-200">
            <Terminal size={15} className="text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-xs font-bold tracking-tight text-white uppercase">
              Projector
            </span>
            <span className="text-[10px] font-mono text-steel-400 border-l border-[#202538] pl-2 hidden sm:inline">
              // REPO.RUNTIME
            </span>
          </div>
        </div>

        {/* Tactical divider */}
        <div className="h-4 w-px bg-[#1e2335] hidden sm:block"></div>

        {/* Project Selector Button */}
        {currentProject ? (
          <button
            onClick={onOpenRepoModal}
            className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#0d0f17] hover:bg-[#141824] border border-[#22283a] hover:border-[#333c56] text-xs text-steel-200 transition group font-mono"
          >
            <GitBranch size={13} className="text-blue-400" />
            <span className="font-semibold text-slate-100 max-w-[130px] sm:max-w-[200px] truncate tracking-tight">
              {currentProject.name}
            </span>
            <span className="text-[10px] text-steel-400 px-1 py-0.2 rounded bg-[#171b29] border border-[#262c3e]">
              {currentProject.file_count}F
            </span>
            <ChevronDown size={12} className="text-steel-400 group-hover:text-white transition" />
          </button>
        ) : (
          <button
            onClick={onOpenRepoModal}
            className="btn-tactical-blue text-white px-3 py-1 rounded-md text-xs font-mono font-medium flex items-center gap-1.5 transition"
          >
            <Plus size={13} />
            <span>MOUNT_REPO</span>
          </button>
        )}
      </div>

      {/* Right Telemetry & Controls */}
      <div className="flex items-center gap-3">
        {/* Monospaced System Status Badge */}
        <div className="hidden lg:flex items-center gap-3 font-mono text-[11px] text-steel-400 border-r border-[#1e2335] pr-3">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            ENGINE: READY
          </span>
          <span className="text-[#333c56]">•</span>
          <span className="text-steel-400">
            ENV: LOCAL
          </span>
        </div>

        {/* Network Status */}
        <div
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono border ${
            isOnline
              ? 'bg-[#0b1612] text-emerald-400 border-[#143d2c]'
              : 'bg-[#1e1509] text-amber-400 border-[#472f10]'
          }`}
          title={isOnline ? 'Network status: connected' : 'Network status: offline (cached)'}
        >
          {isOnline ? <Wifi size={11} /> : <WifiOff size={11} />}
          <span className="hidden sm:inline">{isOnline ? 'SYNC:OK' : 'OFFLINE'}</span>
        </div>

        {/* Switch / Add Repo Button */}
        <button
          onClick={onOpenRepoModal}
          className="btn-mechanical hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono text-steel-300 hover:text-white transition"
        >
          <Plus size={12} />
          <span>ADD_REPO</span>
        </button>

        {/* Settings Button */}
        <button
          onClick={() => onNavigate('settings')}
          className={`p-1.5 rounded-md border transition ${
            activeTab === 'settings'
              ? 'bg-blue-950/60 border-blue-500 text-blue-400'
              : 'bg-[#0d0f17] border-[#22283a] text-steel-400 hover:text-white hover:border-[#333c56]'
          }`}
          title="System Settings & Telemetry"
        >
          <SettingsIcon size={15} />
        </button>
      </div>
    </header>
  );
}
