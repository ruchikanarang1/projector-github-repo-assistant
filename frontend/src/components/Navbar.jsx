import React, { useState, useEffect, useRef } from 'react';
import {
  Github, FolderGit2, ChevronDown, Plus, Wifi, WifiOff,
  Settings as SettingsIcon, Sparkles, Layers, Check, ExternalLink
} from 'lucide-react';
import { authApi, projectApi } from '../api/client';

export default function Navbar({
  currentProject,
  projects = [],
  onSelectProject,
  onOpenRepoModal,
  onOpenGitHubModal,
  onNavigate,
  activeTab
}) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [githubUser, setGithubUser] = useState(null);
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check active GitHub session
    const token = localStorage.getItem('projector_gh_token') || localStorage.getItem('github_token');
    if (token) {
      authApi.getUser()
        .then((profile) => setGithubUser(profile))
        .catch(() => {
          projectApi.getGitHubProfile(token)
            .then((p) => setGithubUser(p))
            .catch(() => setGithubUser(null));
        });
    }

    // Close workspace dropdown on outside click
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsWorkspaceMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="h-16 px-6 bg-[#09090b] border-b border-white/[0.08] flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Brand & Workspace Switcher */}
      <div className="flex items-center gap-5">
        <div className="flex items-baseline gap-2.5">
          <span className="font-serif text-xl font-bold tracking-tight text-white">
            Projector
          </span>
          <span className="text-[10px] uppercase font-sans tracking-widest text-zinc-400 border-l border-white/10 pl-2.5 hidden sm:inline">
            Conversational Workspaces
          </span>
        </div>

        {/* Subtle Divider */}
        <div className="h-4 w-px bg-white/10 hidden sm:block"></div>

        {/* Active Workspace Dropdown Selector */}
        <div className="relative" ref={menuRef}>
          {currentProject ? (
            <button
              onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#141418] hover:bg-[#1a1a20] border border-white/10 text-xs text-zinc-200 transition group"
            >
              <Layers size={13} className="text-amber-200/90 group-hover:scale-105 transition-transform" />
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono hidden md:inline">
                Workspace:
              </span>
              <span className="font-medium text-white max-w-[140px] sm:max-w-[200px] truncate">
                {currentProject.name}
              </span>
              <span className="text-[10px] text-zinc-400 px-1.5 py-0.2 rounded-full bg-white/[0.06] font-mono">
                {currentProject.file_count} files
              </span>
              <ChevronDown size={12} className={`text-zinc-500 transition-transform ${isWorkspaceMenuOpen ? 'rotate-180' : ''}`} />
            </button>
          ) : (
            <button
              onClick={onOpenRepoModal}
              className="btn-editorial-primary px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus size={13} />
              <span>Initialize Workspace</span>
            </button>
          )}

          {/* Workspace Switcher Flyout */}
          {isWorkspaceMenuOpen && (
            <div className="absolute left-0 mt-2 w-72 bg-[#121217] border border-white/10 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-1">
              <div className="px-3 py-2 border-b border-white/[0.08] mb-1">
                <span className="text-[10px] font-sans uppercase tracking-widest text-zinc-500 font-semibold block">
                  Active Workspaces ({projects.length})
                </span>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Each repository operates as an isolated chat and documentation workspace.
                </p>
              </div>

              <div className="max-h-56 overflow-y-auto space-y-1">
                {projects.map((proj) => {
                  const isCurrent = currentProject?.id === proj.id;
                  return (
                    <button
                      key={proj.id}
                      onClick={() => {
                        if (onSelectProject) onSelectProject(proj);
                        setIsWorkspaceMenuOpen(false);
                      }}
                      className={`w-full p-2.5 rounded-xl text-left text-xs flex items-center justify-between gap-2 transition ${
                        isCurrent
                          ? 'bg-white/[0.08] text-white font-medium border border-white/10'
                          : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate font-medium">{proj.name}</span>
                          {isCurrent && <Check size={12} className="text-amber-200" />}
                        </div>
                        <span className="text-[10px] text-zinc-500 font-mono block truncate">
                          {proj.source || 'repository'} • {proj.file_count} files
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 mt-1 border-t border-white/[0.08] space-y-1">
                <button
                  onClick={() => {
                    setIsWorkspaceMenuOpen(false);
                    onOpenGitHubModal();
                  }}
                  className="w-full p-2 rounded-xl text-xs text-amber-200/90 hover:text-amber-200 hover:bg-white/[0.04] flex items-center gap-2 transition font-medium"
                >
                  <Github size={13} />
                  <span>Browse GitHub Projects SSO</span>
                </button>
                <button
                  onClick={() => {
                    setIsWorkspaceMenuOpen(false);
                    onOpenRepoModal();
                  }}
                  className="w-full p-2 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-white/[0.04] flex items-center gap-2 transition"
                >
                  <Plus size={13} />
                  <span>Import Local or ZIP Folder</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Actions: GitHub SSO User & Status */}
      <div className="flex items-center gap-3">
        {/* GitHub SSO Profile Button */}
        {githubUser ? (
          <button
            onClick={onOpenGitHubModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#141418] hover:bg-[#1c1c22] border border-white/15 text-xs text-zinc-200 transition"
            title="Manage GitHub SSO Workspaces"
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
            <span>GitHub Sign In</span>
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
              ? 'bg-white text-zinc-950 border-white font-semibold'
              : 'bg-[#141418] hover:bg-[#1a1a20] border-white/10 text-zinc-400 hover:text-white'
          }`}
          title="App Configuration & Keys"
        >
          <SettingsIcon size={14} />
        </button>
      </div>
    </header>
  );
}
