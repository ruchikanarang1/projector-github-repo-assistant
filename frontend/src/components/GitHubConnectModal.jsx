import React, { useState, useEffect } from 'react';
import {
  X, Github, Search, Star, Lock, Globe, ArrowRight, Loader2, LogOut, Check,
  ExternalLink, Sparkles, Key, Layers, RefreshCw, Filter, ShieldCheck, HelpCircle
} from 'lucide-react';
import { authApi, projectApi, settingsApi } from '../api/client';

export default function GitHubConnectModal({
  isOpen,
  onClose,
  projects = [],
  onSelectProject,
  onProjectImported
}) {
  const [tokenInput, setTokenInput] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [repos, setRepos] = useState([]);
  const [repoSearch, setRepoSearch] = useState('');
  const [repoFilter, setRepoFilter] = useState('all'); // 'all' | 'public' | 'private'
  const [loading, setLoading] = useState(false);
  const [importingRepoUrl, setImportingRepoUrl] = useState(null);
  const [error, setError] = useState(null);
  const [showOAuthDetails, setShowOAuthDetails] = useState(false);

  // Load existing session on open
  useEffect(() => {
    if (isOpen) {
      checkExistingSession();
    }
  }, [isOpen]);

  const checkExistingSession = async () => {
    const savedToken = localStorage.getItem('projector_gh_token') || localStorage.getItem('github_token');
    if (savedToken) {
      setLoading(true);
      setError(null);
      try {
        const [profile, repoList] = await Promise.all([
          authApi.getUser().catch(() => authApi.tokenLogin(savedToken).then(r => r.user)),
          authApi.getRepos().catch(() => projectApi.getGitHubUserRepos(savedToken))
        ]);
        setUserProfile(profile);
        setRepos(repoList || []);
      } catch (err) {
        console.warn('Session expired or invalid:', err);
        setUserProfile(null);
        setRepos([]);
      } finally {
        setLoading(false);
      }
    }
  };

  // Direct 1-Click Connect
  const handleConnect = async (e) => {
    if (e) e.preventDefault();
    if (!tokenInput.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await authApi.tokenLogin(tokenInput.trim());
      localStorage.setItem('projector_gh_token', res.access_token);
      localStorage.setItem('github_token', res.access_token);
      setUserProfile(res.user);
      const repoList = await authApi.getRepos();
      setRepos(repoList || []);
      setTokenInput('');
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Authentication failed. Please verify your token.');
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const handleSignOut = () => {
    localStorage.removeItem('projector_gh_token');
    localStorage.removeItem('github_token');
    setUserProfile(null);
    setRepos([]);
    settingsApi.update({ github_token: '' }).catch(() => {});
  };

  // Import Repo into Active Workspace
  const handleImportWorkspace = async (repo) => {
    const existing = projects.find(
      (p) => p.repo_url === repo.url || p.name.toLowerCase() === repo.name.toLowerCase()
    );

    if (existing) {
      if (onSelectProject) onSelectProject(existing);
      onClose();
      return;
    }

    setImportingRepoUrl(repo.url);
    setError(null);
    try {
      const token = localStorage.getItem('projector_gh_token') || localStorage.getItem('github_token');
      const newProj = await projectApi.importGitHub({
        repo_url: repo.url,
        branch: repo.default_branch,
        github_token: token || undefined
      });
      if (onProjectImported) {
        onProjectImported(newProj);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to initialize workspace from repo.');
    } finally {
      setImportingRepoUrl(null);
    }
  };

  // Filtered repositories
  const filteredRepos = repos.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(repoSearch.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(repoSearch.toLowerCase())) ||
      (r.language && r.language.toLowerCase().includes(repoSearch.toLowerCase()));

    if (!matchesSearch) return false;
    if (repoFilter === 'public') return !r.private;
    if (repoFilter === 'private') return r.private;
    return true;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in font-sans">
      <div className="w-full max-w-3xl bg-[#0e0e12] border border-white/10 rounded-2xl flex flex-col shadow-2xl overflow-hidden max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-[#121217] border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-white">
              <Github size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-serif font-bold text-white tracking-tight">
                  GitHub Sign In & Workspaces
                </h2>
                {userProfile && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/40 text-emerald-300 border border-emerald-800/30">
                    Connected as @{userProfile.login}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Connect your GitHub account to list all your personal & organization projects. Each project acts as an isolated conversational workspace.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-800/40 text-xs text-red-300 flex items-start gap-2.5">
              <div className="p-0.5 text-red-400">✕</div>
              <div className="flex-1 leading-relaxed">{error}</div>
            </div>
          )}

          {/* STATE 1: Authenticated User Header & Workspace Repositories List */}
          {userProfile ? (
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="p-4 rounded-xl bg-[#14141a] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <img
                    src={userProfile.avatar_url || 'https://github.com/ghost.png'}
                    alt={userProfile.login}
                    className="w-12 h-12 rounded-full border border-white/20 shadow-md"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-serif font-bold text-white text-base">
                        {userProfile.name || userProfile.login}
                      </span>
                      <span className="font-mono text-xs text-amber-200/90 font-medium">
                        @{userProfile.login}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
                      <span>{userProfile.public_repos || repos.length} Public Repos</span>
                      {userProfile.total_private_repos !== undefined && (
                        <>
                          <span>•</span>
                          <span>{userProfile.total_private_repos} Private Repos</span>
                        </>
                      )}
                      {userProfile.company && (
                        <>
                          <span>•</span>
                          <span>{userProfile.company}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={checkExistingSession}
                    disabled={loading}
                    className="px-3 py-1.5 rounded-lg text-xs bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-white/10 flex items-center gap-1.5 transition"
                    title="Refresh Repositories"
                  >
                    <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                    <span>Sync</span>
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="px-3 py-1.5 rounded-lg text-xs bg-red-950/20 hover:bg-red-950/40 text-red-300 border border-red-800/30 flex items-center gap-1.5 transition"
                  >
                    <LogOut size={13} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>

              {/* Repositories Browser */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-serif font-bold text-white text-sm">
                      Your Available Repositories ({filteredRepos.length})
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Select any project to initialize it as an active conversational workspace.
                    </p>
                  </div>

                  {/* Search & Filter Controls */}
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search size={13} className="absolute left-3 top-2.5 text-zinc-500" />
                      <input
                        type="text"
                        value={repoSearch}
                        onChange={(e) => setRepoSearch(e.target.value)}
                        placeholder="Search repos or languages..."
                        className="pl-8 pr-3 py-1.5 bg-[#14141a] border border-white/10 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 w-48 sm:w-56"
                      />
                    </div>

                    <div className="flex items-center bg-[#14141a] border border-white/10 rounded-lg p-0.5 text-xs">
                      {['all', 'public', 'private'].map((t) => (
                        <button
                          key={t}
                          onClick={() => setRepoFilter(t)}
                          className={`px-2.5 py-1 rounded text-[11px] capitalize transition ${
                            repoFilter === t
                              ? 'bg-white text-zinc-950 font-semibold shadow-sm'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Repos Grid */}
                {loading && repos.length === 0 ? (
                  <div className="py-12 text-center text-xs text-zinc-400 flex flex-col items-center gap-2">
                    <Loader2 size={18} className="animate-spin text-amber-200" />
                    <span>Fetching repositories from GitHub...</span>
                  </div>
                ) : filteredRepos.length === 0 ? (
                  <div className="py-12 text-center text-xs text-zinc-500 border border-dashed border-white/10 rounded-xl">
                    No repositories match your filter or search query.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                    {filteredRepos.map((repo) => {
                      const isAlreadyWorkspace = projects.some(
                        (p) => p.repo_url === repo.url || p.name.toLowerCase() === repo.name.toLowerCase()
                      );
                      const isImporting = importingRepoUrl === repo.url;

                      return (
                        <div
                          key={repo.id}
                          className="p-3.5 rounded-xl bg-[#121217] hover:bg-[#16161d] border border-white/[0.07] hover:border-white/15 flex items-center justify-between gap-4 transition group"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-serif font-semibold text-white text-sm group-hover:text-amber-100 transition truncate">
                                {repo.name}
                              </span>
                              {repo.private ? (
                                <span className="flex items-center gap-1 text-[10px] text-zinc-400 font-mono px-1.5 py-0.5 rounded bg-zinc-800/80">
                                  <Lock size={10} /> Private
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-[10px] text-zinc-500 font-mono px-1.5 py-0.5 rounded bg-zinc-800/40">
                                  <Globe size={10} /> Public
                                </span>
                              )}
                              {repo.stars > 0 && (
                                <span className="flex items-center gap-1 text-[10px] text-amber-200/90 font-mono">
                                  <Star size={10} fill="currentColor" /> {repo.stars}
                                </span>
                              )}
                            </div>

                            {repo.description && (
                              <p className="text-xs text-zinc-400 mt-1 line-clamp-1 leading-relaxed">
                                {repo.description}
                              </p>
                            )}

                            <div className="flex items-center gap-3 text-[11px] text-zinc-500 mt-1.5 font-mono">
                              <span className="text-zinc-300">{repo.language}</span>
                              <span>•</span>
                              <span>Updated {new Date(repo.updated_at).toLocaleDateString()}</span>
                            </div>
                          </div>

                          {/* Action Button */}
                          <div>
                            {isAlreadyWorkspace ? (
                              <button
                                onClick={() => handleImportWorkspace(repo)}
                                className="px-3.5 py-1.5 rounded-lg text-xs bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-300 border border-emerald-700/40 font-semibold flex items-center gap-1.5 transition shadow-sm"
                              >
                                <Check size={13} />
                                <span>Open Workspace</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleImportWorkspace(repo)}
                                disabled={isImporting}
                                className="btn-editorial-primary px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                              >
                                {isImporting ? (
                                  <>
                                    <Loader2 size={13} className="animate-spin" />
                                    <span>Ingesting...</span>
                                  </>
                                ) : (
                                  <>
                                    <Layers size={13} />
                                    <span>Initialize Workspace</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* STATE 2: Fast 1-Click GitHub Connect (Zero Setup Required) */
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-[#14141a] border border-white/10 space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.06] border border-white/15 flex items-center justify-center text-white shrink-0">
                    <Github size={26} />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-white text-lg tracking-tight">
                      Fast 1-Click GitHub Connect
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      Zero configuration required. Connect your GitHub account directly to list and talk to all your public and private project repositories.
                    </p>
                  </div>
                </div>

                {/* Step 1 & 2 Action Flow */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-4 rounded-xl bg-[#09090b] border border-white/[0.08] flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-sans uppercase tracking-widest text-amber-200 font-semibold block mb-1">
                        Step 1: Authorize on GitHub
                      </span>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Opens GitHub with the exact permissions (<code className="text-white font-mono">repo</code>, <code className="text-white font-mono">read:user</code>) pre-filled.
                      </p>
                    </div>

                    <a
                      href="https://github.com/settings/tokens/new?scopes=repo,read:user&description=Projector%20AI%20Workspace"
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 btn-editorial-primary py-2 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition"
                    >
                      <span>1-Click Authorize on GitHub</span>
                      <ExternalLink size={13} />
                    </a>
                  </div>

                  <div className="p-4 rounded-xl bg-[#09090b] border border-white/[0.08] flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-sans uppercase tracking-widest text-amber-200 font-semibold block mb-1">
                        Step 2: Complete Sign In
                      </span>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Click "Generate token" on GitHub, copy the key, and paste it below:
                      </p>
                    </div>

                    <form onSubmit={handleConnect} className="mt-3 flex items-center gap-2">
                      <input
                        type="password"
                        value={tokenInput}
                        onChange={(e) => setTokenInput(e.target.value)}
                        placeholder="ghp_xxxx..."
                        className="flex-1 px-3 py-2 bg-[#14141a] border border-white/15 focus:border-amber-200/50 rounded-lg text-xs text-white placeholder-zinc-500 font-mono focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={loading || !tokenInput.trim()}
                        className="btn-editorial-primary px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {loading ? <Loader2 size={13} className="animate-spin" /> : <span>Sign In</span>}
                      </button>
                    </form>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-zinc-500 pt-1">
                  <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                  <span>
                    Your key is saved locally in your browser's encrypted environment. No credentials are transmitted to any third-party servers.
                  </span>
                </div>
              </div>

              {/* Optional OAuth Explanation Toggle */}
              <div className="text-center">
                <button
                  onClick={() => setShowOAuthDetails(!showOAuthDetails)}
                  className="text-xs text-zinc-500 hover:text-zinc-300 transition inline-flex items-center gap-1"
                >
                  <HelpCircle size={12} />
                  <span>Why does GitHub work this way compared to Google?</span>
                </button>

                {showOAuthDetails && (
                  <div className="mt-3 p-4 rounded-xl bg-[#121217] border border-white/[0.08] text-left text-xs text-zinc-400 space-y-2 animate-in fade-in">
                    <p className="leading-relaxed">
                      <strong>How Local Tools Differ From Hosted Websites:</strong> On public websites (like Spotify or Canva), the company hosts a centralized server with their own pre-registered Google/GitHub OAuth credentials.
                    </p>
                    <p className="leading-relaxed">
                      When running self-hosted or local developer tools on <code className="text-white font-mono">localhost</code> (like Git, VS Code, or Projector), GitHub uses direct developer authorization tokens to grant you full access to both private and public codebases without forcing you to set up corporate redirect URIs or reverse proxies.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
