import React, { useState, useEffect } from 'react';
import { Github, FolderGit2, ChevronDown, Plus, Wifi, WifiOff, Settings as SettingsIcon, Sparkles } from 'lucide-react';
import { projectApi } from '../api/client';

export default function Navbar({ currentProject, onOpenRepoModal, onOpenGitHubModal, onNavigate, activeTab }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [githubUser, setGithubUser] = useState(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check if GitHub token is present
    const token = localStorage.getItem('github_token');
    if (token) {
      projectApi.getGitHubProfile(token)
        .then((profile) => setGithubUser(profile))
        .catch(() => setGithubUser(null));
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <header className="h-16 px-6 bg-[#09090b] border-b border-white/[0.08] flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Brand & Project Info */}
      <div className="flex items-center gap-5">
        <div className="flex items-baseline gap-2.5">
          <span className="font-serif text-xl font-bold tracking-tight text-white">
            Projector
          </span>
          <span className="text-[10px] uppercase font-sans tracking-widest text-zinc-400 border-l border-white/10 pl-2.5 hidden sm:inline">
            Codebase Editorial & Dossier
          </span>
        </div>

        {/* Subtle Divider */}
        <div className="h-4 w-px bg-white/10 hidden sm:block"></div>

        {/* Active Project Dropdown */}
        {currentProject ? (
          <button
            onClick={onOpenRepoModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#141418] hover:bg-[#1a1a20] border border-white/10 text-xs text-zinc-200 transition group"
          >
            <FolderGit2 size={13} className="text-amber-200/80 group-hover:scale-105 transition-transform" />
            <span className="font-medium text-white max-w-[150px] sm:max-w-[220px] truncate">
              {currentProject.name}
            </span>
            <span className="text-[10px] text-zinc-400 px-1.5 py-0.2 rounded-full bg-white/[0.06]">
              {currentProject.file_count} files
            </span>
            <ChevronDown size={12} className="text-zinc-500" />
          </button>
        ) : (
          <button
            onClick={onOpenRepoModal}
            className="btn-editorial-primary px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5"
          >
            <Plus size={13} />
            <span>Select Project</span>
          </button>
        )}
      </div>

      {/* Right Actions: GitHub Login & Status */}
      <div className="flex items-center gap-3">
        {/* GitHub Login / Connected Profile Button */}
        {githubUser ? (
          <button
            onClick={onOpenGitHubModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#141418] hover:bg-[#1c1c22] border border-white/15 text-xs text-zinc-200 transition"
            title="Manage connected GitHub account"
          >
            {githubUser.avatar_url ? (
              <img src={githubUser.avatar_url} alt="" className="w-4 h-4 rounded-full" />
            ) : (
              <Github size={13} className="text-white" />
            )}
            <span className="font-mono text-[11px] text-amber-200/90 font-medium">@{githubUser.login}</span>
          </button>
        ) : (
          <button
            onClick={onOpenGitHubModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-zinc-950 hover:bg-zinc-200 font-semibold text-xs transition shadow-sm"
          >
            <Github size={14} />
            <span>Connect GitHub</span>
          </button>
        )}

        {/* Online / Offline status */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-sans border ${
            isOnline
              ? 'bg-emerald-950/30 text-emerald-400 border-emerald-800/40'
              : 'bg-amber-950/30 text-amber-300 border-amber-800/40'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
          <span className="hidden sm:inline">{isOnline ? 'Live' : 'Offline'}</span>
        </div>

        {/* Settings button */}
        <button
          onClick={() => onNavigate('settings')}
          className={`p-2 rounded-full border transition ${
            activeTab === 'settings'
              ? 'bg-white/15 border-white text-white'
              : 'bg-[#141418] border-white/10 text-zinc-400 hover:text-white hover:border-white/20'
          }`}
          title="App Settings & Model Configuration"
        >
          <SettingsIcon size={14} />
        </button>
      </div>
    </header>
  );
}
