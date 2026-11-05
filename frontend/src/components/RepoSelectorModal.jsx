import React, { useState } from 'react';
import { X, Github, Upload, Folder, Sparkles, Check, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { projectApi } from '../api/client';

export default function RepoSelectorModal({ isOpen, onClose, onProjectSelected, currentProjectId, projects }) {
  const [tab, setTab] = useState('github'); // 'github', 'upload', 'local', 'sample'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form states
  const [githubUrl, setGithubUrl] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [branch, setBranch] = useState('');
  const [localPath, setLocalPath] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  if (!isOpen) return null;

  const handleGitHubImport = async (e) => {
    e.preventDefault();
    if (!githubUrl.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const proj = await projectApi.importGitHub({
        repo_url: githubUrl.trim(),
        github_token: githubToken.trim() || undefined,
        branch: branch.trim() || undefined
      });
      onProjectSelected(proj);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to import repository from GitHub.');
    } finally {
      setLoading(false);
    }
  };

  const handleZipUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const proj = await projectApi.uploadZip(formData);
      onProjectSelected(proj);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to upload project zip.');
    } finally {
      setLoading(false);
    }
  };

  const handleLocalImport = async (e) => {
    e.preventDefault();
    if (!localPath.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const proj = await projectApi.importLocal({ local_path: localPath.trim() });
      onProjectSelected(proj);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to import local folder.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSample = async () => {
    setLoading(true);
    setError(null);
    try {
      const proj = await projectApi.createSample();
      onProjectSelected(proj);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to create sample project.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="glass-panel w-full max-w-2xl rounded-2xl flex flex-col shadow-2xl overflow-hidden border border-slate-700/80">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900/90 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-brand-500/20 text-brand-400">
                <Folder size={18} />
              </span>
              Select or Connect Repository
            </h2>
            <p className="text-xs text-slate-400">
              Choose an active project or ingest a new one to talk with and generate documentation.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition">
            <X size={18} />
          </button>
        </div>

        {/* Existing Projects Quick Switch */}
        {projects && projects.length > 0 && (
          <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800/80">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
              Your Ingested Projects
            </label>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {projects.map((p) => {
                const isActive = p.id === currentProjectId;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      onProjectSelected(p);
                      onClose();
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition border ${
                      isActive
                        ? 'bg-brand-600 text-white border-brand-500 shadow-sm'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                    }`}
                  >
                    <span className="font-medium">{p.name}</span>
                    <span className="text-[10px] opacity-70">({p.source})</span>
                    {isActive && <Check size={12} />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Ingestion Source Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/40 px-6 pt-2">
          <button
            onClick={() => setTab('github')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition ${
              tab === 'github' ? 'border-brand-500 text-brand-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Github size={14} />
            GitHub URL
          </button>
          <button
            onClick={() => setTab('upload')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition ${
              tab === 'upload' ? 'border-brand-500 text-brand-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload size={14} />
            Upload ZIP
          </button>
          <button
            onClick={() => setTab('local')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition ${
              tab === 'local' ? 'border-brand-500 text-brand-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Folder size={14} />
            Local Path
          </button>
          <button
            onClick={() => setTab('sample')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition ${
              tab === 'sample' ? 'border-brand-500 text-brand-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles size={14} className="text-amber-400" />
            1-Click Demo
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {tab === 'github' && (
            <form onSubmit={handleGitHubImport} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  GitHub Repository URL <span className="text-brand-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="https://github.com/fastapi/fastapi or owner/repo"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-brand-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Branch (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="main / master"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-brand-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    GitHub PAT (Optional)
                  </label>
                  <input
                    type="password"
                    placeholder="ghp_xxxx (for private repos or rate limit)"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-brand-500 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !githubUrl.trim()}
                className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs transition disabled:opacity-50 shadow-lg shadow-brand-600/20"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                <span>{loading ? 'Ingesting Repository & Generating Structure...' : 'Import & Analyze GitHub Repo'}</span>
              </button>
            </form>
          )}

          {tab === 'upload' && (
            <form onSubmit={handleZipUpload} className="space-y-4">
              <div className="border-2 border-dashed border-slate-700 hover:border-brand-500 rounded-xl p-8 text-center transition bg-slate-900/40">
                <Upload size={32} className="mx-auto text-slate-400 mb-2" />
                <p className="text-xs text-slate-300 font-medium">
                  Select a project .zip archive from your device
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Supports zip archives up to 100MB. Node modules and virtualenvs are skipped automatically.
                </p>
                <input
                  type="file"
                  accept=".zip"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  className="mt-4 block mx-auto text-xs text-slate-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-600 file:text-white hover:file:bg-brand-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !selectedFile}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs transition disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                <span>{loading ? 'Extracting & Ingesting Project...' : 'Upload & Process ZIP'}</span>
              </button>
            </form>
          )}

          {tab === 'local' && (
            <form onSubmit={handleLocalImport} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Local Directory Absolute Path <span className="text-brand-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. C:\Users\you\Desktop\my-project or /home/user/project"
                  value={localPath}
                  onChange={(e) => setLocalPath(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-brand-500 transition"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Reads the repository on your machine and generates AST summary, file tree, and interview cards.
              </p>

              <button
                type="submit"
                disabled={loading || !localPath.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs transition disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                <span>{loading ? 'Scanning Local Repository...' : 'Link & Ingest Local Folder'}</span>
              </button>
            </form>
          )}

          {tab === 'sample' && (
            <div className="space-y-4 text-center py-2">
              <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/40 to-purple-950/40 border border-brand-500/30 text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400 px-2 py-0.5 rounded bg-brand-500/20">
                  Featured Sample Repository
                </span>
                <h3 className="text-base font-bold text-white mt-2">FinTrack-Core</h3>
                <p className="text-xs text-slate-300 mt-1">
                  High-throughput transactional ledger & payment reconciliation microservice. Includes FastAPI backend, double-entry bookkeeping, idempotency keys, React PWA dashboard, and Docker setup.
                </p>
                <div className="flex gap-2 mt-3 flex-wrap">
                  {['FastAPI', 'React', 'PostgreSQL', 'Tailwind', 'Docker'].map((tech) => (
                    <span key={tech} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={handleCreateSample}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-medium text-xs transition shadow-lg shadow-indigo-600/30"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                <span>{loading ? 'Setting up interactive demo...' : 'Instantly Load FinTrack Demo Repo'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
