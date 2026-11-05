import React, { useState, useEffect } from 'react';
import { Layers, FolderGit2, ChevronDown, Plus, Wifi, WifiOff, Settings as SettingsIcon } from 'lucide-react';

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
    <header className="h-16 px-4 sm:px-6 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between sticky top-0 z-30">
      {/* Brand & Project Info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-600/30">
            <Layers size={20} />
          </div>
          <div>
            <h1 className="text-sm font-extrabold tracking-tight text-white flex items-center gap-1.5">
              Projector <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-brand-500/20 text-brand-300 font-semibold border border-brand-500/30">AI PWA</span>
            </h1>
            <p className="text-[10px] text-slate-400 hidden sm:block">Interview Companion & Architecture Studio</p>
          </div>
        </div>

        {/* Vertical divider */}
        <div className="h-5 w-px bg-slate-800 hidden sm:block"></div>

        {/* Project Selector Button */}
        {currentProject ? (
          <button
            onClick={onOpenRepoModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs text-slate-200 transition group"
          >
            <FolderGit2 size={14} className="text-brand-400 group-hover:scale-110 transition-transform" />
            <span className="font-semibold max-w-[130px] sm:max-w-[200px] truncate">{currentProject.name}</span>
            <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-slate-800">
              {currentProject.file_count} files
            </span>
            <ChevronDown size={13} className="text-slate-400" />
          </button>
        ) : (
          <button
            onClick={onOpenRepoModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium transition shadow-md shadow-brand-600/20"
          >
            <Plus size={14} />
            <span>Connect Project</span>
          </button>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Offline / Online indicator */}
        <div
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
            isOnline
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          }`}
          title={isOnline ? 'Online (Full AI capabilities enabled)' : 'Offline (Using cached docs and notes)'}
        >
          {isOnline ? <Wifi size={11} /> : <WifiOff size={11} />}
          <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline Mode'}</span>
        </div>

        {/* Switch / Add Repo Button */}
        <button
          onClick={onOpenRepoModal}
          className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
        >
          <Plus size={13} />
          <span>Add Repo</span>
        </button>

        {/* Settings Button */}
        <button
          onClick={() => onNavigate('settings')}
          className={`p-2 rounded-xl border transition ${
            activeTab === 'settings'
              ? 'bg-brand-600/20 border-brand-500 text-brand-300'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Settings & API Keys"
        >
          <SettingsIcon size={16} />
        </button>
      </div>
    </header>
  );
}
