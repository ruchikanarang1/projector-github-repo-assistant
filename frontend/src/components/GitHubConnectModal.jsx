import React, { useState, useEffect } from 'react';
import {
  X, Github, Search, Star, Lock, Globe, ArrowRight, Loader2, LogOut, Check,
  ExternalLink, Sparkles, Key, Smartphone, Layers, RefreshCw, Filter
} from 'lucide-react';
import { authApi, projectApi, settingsApi } from '../api/client';

export default function GitHubConnectModal({
  isOpen,
  onClose,
  projects = [],
  onSelectProject,
  onProjectImported
}) {
  const [authTab, setAuthTab] = useState('sso'); // 'sso' | 'token'
  const [tokenInput, setTokenInput] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [repos, setRepos] = useState([]);
  const [repoSearch, setRepoSearch] = useState('');
  const [repoFilter, setRepoFilter] = useState('all'); // 'all' | 'public' | 'private'
  const [loading, setLoading] = useState(false);
  const [importingRepoUrl, setImportingRepoUrl] = useState(null);
  const [error, setError] = useState(null);

  // Device Flow State
  const [deviceFlow, setDeviceFlow] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const [pollIntervalId, setPollIntervalId] = useState(null);

  // Load existing session on open
  useEffect(() => {
    if (isOpen) {
      checkExistingSession();
    } else {
      stopPolling();
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

  const stopPolling = () => {
    if (pollIntervalId) {
      clearInterval(pollIntervalId);
      setPollIntervalId(null);
    }
    setIsPolling(false);
  };

  // 1. SSO Device Flow Initiate
  const handleStartDeviceSSO = async () => {
    setLoading(true);
    setError(null);
    stopPolling();
    try {
      const config = await authApi.getConfig();
      if (!config.oauth_configured) {
        setError('GitHub OAuth client credentials are not configured in backend/.env. Use Personal Access Token SSO below or add GITHUB_CLIENT_ID.');
        setLoading(false);
        return;
      }

      const flowData = await authApi.startDeviceFlow();
      setDeviceFlow(flowData);
      setLoading(false);
      setIsPolling(true);

      // Start Polling GitHub for approval
      const intervalSec = flowData.interval || 5;
      const id = setInterval(async () => {
        try {
          const res = await authApi.pollDeviceFlow(flowData.device_code);
          if (res.status === 'complete' && res.access_token) {
            clearInterval(id);
            setIsPolling(false);
            setDeviceFlow(null);
            localStorage.setItem('projector_gh_token', res.access_token);
            setUserProfile(res.user);
            // Load repos
            const repoList = await authApi.getRepos();
            setRepos(repoList || []);
          }
        } catch (pollErr) {
          console.warn('Polling check:', pollErr);
        }
      }, intervalSec * 1000);

      setPollIntervalId(id);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to initiate GitHub SSO.');
      setLoading(false);
    }
  };

  // 2. Direct Token Login
  const handleTokenLogin = async (e) => {
    e.preventDefault();
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
    stopPolling();
    localStorage.removeItem('projector_gh_token');
    localStorage.removeItem('github_token');
    setUserProfile(null);
    setRepos([]);
    setDeviceFlow(null);
    settingsApi.update({ github_token: '' }).catch(() => {});
  };

  // Import Repo into Active Workspace
  const handleImportWorkspace = async (repo) => {
    const existing = projects.find(
      (p) => p.repo_url === repo.url || p.name.toLowerCase() === repo.name.toLowerCase()
    );

    if (existing) {
      // Already imported - switch to this workspace immediately
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
                  GitHub SSO & Workspace Provisioner
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-200/10 text-amber-200 border border-amber-200/20">
                  SSO Authenticated
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Sign in to list all your personal & organization projects. Each project provisions as a dedicated conversational workspace.
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
              {/* Profile Bar */}
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
                    <span>Fetching repositories from GitHub SSO...</span>
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
            /* STATE 2: Unauthenticated SSO & Login Selection */
            <div className="space-y-6">
              {/* Tab Selector */}
              <div className="flex border-b border-white/10 text-xs">
                <button
                  onClick={() => setAuthTab('sso')}
                  className={`pb-3 px-4 font-serif font-bold transition border-b-2 flex items-center gap-2 ${
                    authTab === 'sso'
                      ? 'border-amber-200 text-white'
                      : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Smartphone size={14} />
                  <span>Single Sign-On (GitHub OAuth / Device)</span>
                </button>
                <button
                  onClick={() => setAuthTab('token')}
                  className={`pb-3 px-4 font-serif font-bold transition border-b-2 flex items-center gap-2 ${
                    authTab === 'token'
                      ? 'border-amber-200 text-white'
                      : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Key size={14} />
                  <span>Personal Access Token</span>
                </button>
              </div>

              {/* TAB 1: GitHub SSO */}
              {authTab === 'sso' && (
                <div className="space-y-5 py-2">
                  <div className="p-5 rounded-2xl bg-[#14141a] border border-white/10 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/[0.06] border border-white/15 flex items-center justify-center mx-auto text-white">
                      <Github size={26} />
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-white text-base">
                        Authenticate with GitHub SSO
                      </h3>
                      <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1 leading-relaxed">
                        One-click sign in. Grants Projector read-only access to list your public and private repositories and ingest code into local workspaces.
                      </p>
                    </div>

                    {deviceFlow ? (
                      /* Active Device Flow Display */
                      <div className="p-4 rounded-xl bg-[#181822] border border-amber-200/30 text-left space-y-3 animate-in fade-in">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-sans uppercase tracking-widest text-amber-200 font-semibold">
                            Verification Code
                          </span>
                          <span className="text-xs text-zinc-400 flex items-center gap-1.5 font-mono">
                            <Loader2 size={12} className="animate-spin text-amber-200" />
                            Awaiting authorization...
                          </span>
                        </div>

                        <div className="text-center py-3 bg-[#0e0e14] rounded-lg border border-white/10">
                          <span className="text-2xl font-mono font-bold tracking-widest text-white selection:bg-amber-200 selection:text-black">
                            {deviceFlow.user_code}
                          </span>
                        </div>

                        <p className="text-xs text-zinc-400 text-center">
                          Copy the code above and enter it at GitHub's authorization page.
                        </p>

                        <a
                          href={deviceFlow.verification_uri || 'https://github.com/login/device'}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full btn-editorial-primary py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition"
                        >
                          <span>Open GitHub Verification Page</span>
                          <ExternalLink size={13} />
                        </a>
                      </div>
                    ) : (
                      <div className="pt-2">
                        <button
                          onClick={handleStartDeviceSSO}
                          disabled={loading}
                          className="btn-editorial-primary px-6 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2 mx-auto shadow-md"
                        >
                          {loading ? (
                            <>
                              <Loader2 size={14} className="animate-spin" />
                              <span>Connecting to GitHub...</span>
                            </>
                          ) : (
                            <>
                              <Github size={15} />
                              <span>Sign in with GitHub (SSO)</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="text-center">
                    <span className="text-xs text-zinc-500">
                      Need instant access without setting up an OAuth App? Use the <strong>Personal Access Token</strong> tab.
                    </span>
                  </div>
                </div>
              )}

              {/* TAB 2: Personal Access Token */}
              {authTab === 'token' && (
                <form onSubmit={handleTokenLogin} className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300 block">
                      GitHub Personal Access Token (Classic or Fine-Grained)
                    </label>
                    <input
                      type="password"
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                      className="w-full px-4 py-2.5 bg-[#14141a] border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-200/50 font-mono"
                    />
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                      Requires <code className="text-zinc-300">repo</code> (Full control of private repositories) and <code className="text-zinc-300">read:user</code> scopes. Tokens are stored securely in your browser's local environment.
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <a
                      href="https://github.com/settings/tokens/new?scopes=repo,read:user&description=Projector%20AI%20Companion"
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-amber-200/80 hover:text-amber-200 flex items-center gap-1 transition"
                    >
                      <span>Generate Token on GitHub</span>
                      <ExternalLink size={12} />
                    </a>

                    <button
                      type="submit"
                      disabled={loading || !tokenInput.trim()}
                      className="btn-editorial-primary px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <>
                          <span>Connect Token</span>
                          <ArrowRight size={13} />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
