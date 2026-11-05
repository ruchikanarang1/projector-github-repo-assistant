import React, { useState, useEffect } from 'react';
import { X, Github, Search, Star, Lock, Globe, ArrowRight, Loader2, LogOut, Check, ExternalLink, AlertTriangle } from 'lucide-react';
import { projectApi, settingsApi } from '../api/client';

export default function GitHubConnectModal({ isOpen, onClose, onProjectImported }) {
  const [token, setToken] = useState(localStorage.getItem('github_token') || '');
  const [userProfile, setUserProfile] = useState(null);
  const [repos, setRepos] = useState([]);
  const [repoSearch, setRepoSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [importingRepoId, setImportingRepoId] = useState(null);
  const [error, setError] = useState(null);

  // Direct URL paste
  const [directUrl, setDirectUrl] = useState('');

  useEffect(() => {
    const savedToken = localStorage.getItem('github_token');
    if (savedToken && isOpen) {
      loadUserData(savedToken);
    }
  }, [isOpen]);

  const loadUserData = async (tok) => {
    setLoading(true);
    setError(null);
    try {
      const [profile, repoList] = await Promise.all([
        projectApi.getGitHubProfile(tok),
        projectApi.getGitHubUserRepos(tok),
      ]);
      setUserProfile(profile);
      setRepos(repoList);
      localStorage.setItem('github_token', tok);
      // Sync with backend settings
      settingsApi.update({ github_token: tok }).catch(() => {});
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to authenticate with GitHub.');
      setUserProfile(null);
      setRepos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectToken = (e) => {
    e.preventDefault();
    if (!token.trim()) return;
    loadUserData(token.trim());
  };

  const handleDisconnect = () => {
    localStorage.removeItem('github_token');
    setToken('');
    setUserProfile(null);
    setRepos([]);
    settingsApi.update({ github_token: '' }).catch(() => {});
  };

  const handleImportRepo = async (repoUrl) => {
    setImportingRepoId(repoUrl);
    setError(null);
    try {
      const proj = await projectApi.importGitHub({
        repo_url: repoUrl,
        github_token: token.trim() || undefined,
      });
      onProjectImported(proj);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to import repository.');
    } finally {
      setImportingRepoId(null);
    }
  };

  const filteredRepos = repos.filter((r) =>
    r.name.toLowerCase().includes(repoSearch.toLowerCase()) ||
    (r.description && r.description.toLowerCase().includes(repoSearch.toLowerCase()))
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in font-sans">
      <div className="w-full max-w-2xl bg-[#0e0e12] border border-white/10 rounded-2xl flex flex-col shadow-2xl overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-[#121217] border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-white">
              <Github size={20} />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-white tracking-tight">
                Connect GitHub
              </h2>
              <p className="text-xs text-zinc-400">
                Browse personal repositories, clone private projects & bypass API limits.
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

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5">
              <AlertTriangle size={16} className="shrink-0 mt-0.5 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Connected User Profile Banner */}
          {userProfile ? (
            <div className="p-4 rounded-xl bg-[#16161c] border border-white/10 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                {userProfile.avatar_url ? (
                  <img
                    src={userProfile.avatar_url}
                    alt={userProfile.login}
                    className="w-11 h-11 rounded-full border border-white/20"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center">
                    <Github size={20} />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-white">
                      {userProfile.name || userProfile.login}
                    </h4>
                    <span className="text-xs text-zinc-400 font-mono">
                      @{userProfile.login}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {userProfile.public_repos} public repos • {userProfile.total_private_repos} private repos
                  </p>
                </div>
              </div>

              <button
                onClick={handleDisconnect}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.06] hover:bg-red-950/40 hover:text-red-300 text-zinc-400 transition border border-white/10"
              >
                <LogOut size={13} />
                <span>Disconnect</span>
              </button>
            </div>
          ) : (
            /* Connect Form */
            <div className="p-5 rounded-xl bg-[#141419] border border-white/[0.08] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white uppercase tracking-wider">
                  Option 1: Connect Personal Access Token (PAT)
                </span>
                <a
                  href="https://github.com/settings/tokens/new?scopes=repo,read:user"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-amber-200/90 hover:underline flex items-center gap-1"
                >
                  Generate Token <ExternalLink size={11} />
                </a>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Paste a GitHub token with <code className="text-zinc-200 font-mono">repo</code> permissions. Your token is stored securely in your browser and used to list and ingest your projects.
              </p>

              <form onSubmit={handleConnectToken} className="flex gap-2">
                <input
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-[#09090b] border border-white/15 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/40 font-mono"
                />
                <button
                  type="submit"
                  disabled={loading || !token.trim()}
                  className="btn-editorial-primary px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-40"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <Github size={14} />}
                  <span>{loading ? 'Authenticating...' : 'Connect'}</span>
                </button>
              </form>
            </div>
          )}

          {/* User Repositories Browser */}
          {userProfile && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white uppercase tracking-wider">
                  Your Repositories ({filteredRepos.length})
                </span>
                <div className="relative w-48">
                  <Search size={13} className="absolute left-2.5 top-2 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search repos..."
                    value={repoSearch}
                    onChange={(e) => setRepoSearch(e.target.value)}
                    className="w-full pl-7 pr-3 py-1 rounded-lg bg-[#09090b] border border-white/10 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {filteredRepos.map((r) => {
                  const isImporting = importingRepoId === r.url;
                  return (
                    <div
                      key={r.id}
                      className="p-3 rounded-xl bg-[#14141a] hover:bg-[#181820] border border-white/[0.06] flex items-center justify-between gap-3 transition"
                    >
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white truncate">
                            {r.name}
                          </span>
                          {r.private ? (
                            <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-300 border border-amber-800">
                              <Lock size={9} /> Private
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
                              <Globe size={9} /> Public
                            </span>
                          )}
                          {r.language && (
                            <span className="text-[10px] text-zinc-400 font-mono">
                              {r.language}
                            </span>
                          )}
                        </div>
                        {r.description && (
                          <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                            {r.description}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => handleImportRepo(r.url)}
                        disabled={isImporting}
                        className="btn-editorial-primary px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 flex items-center gap-1.5 transition disabled:opacity-50"
                      >
                        {isImporting ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <ArrowRight size={13} />
                        )}
                        <span>{isImporting ? 'Ingesting...' : 'Analyze'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Option 2: Paste Any Public URL */}
          <div className="pt-4 border-t border-white/[0.08] space-y-3">
            <span className="text-xs font-semibold text-white uppercase tracking-wider block">
              Option 2: Ingest Any Public Repository URL
            </span>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (directUrl.trim()) handleImportRepo(directUrl.trim());
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                placeholder="https://github.com/fastapi/fastapi or owner/repo"
                value={directUrl}
                onChange={(e) => setDirectUrl(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl bg-[#09090b] border border-white/15 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/40"
              />
              <button
                type="submit"
                disabled={!directUrl.trim() || importingRepoId !== null}
                className="btn-editorial-secondary px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-40"
              >
                <span>Import</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

