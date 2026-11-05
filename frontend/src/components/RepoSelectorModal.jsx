import React, { useState } from 'react';
import { X, Github, Upload, Folder, Terminal, Check, ArrowRight, Loader2, AlertTriangle, Layers } from 'lucide-react';
import { projectApi } from '../api/client';

export default function RepoSelectorModal({ isOpen, onClose, onProjectSelected, currentProjectId, projects }) {
  const [tab, setTab] = useState('github');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl bg-[#090a10] border border-[#23283c] rounded-lg flex flex-col shadow-2xl overflow-hidden text-steel-200">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#0d0f17] border-b border-[#1c2132]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-[#151928] border border-[#2b334d] text-blue-400">
              <Terminal size={14} />
            </div>
            <div>
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                Mount Target Codebase
              </h2>
              <p className="text-[11px] text-steel-500 font-mono">
                Select target repository for AST parsing, RAG indexing & Q&A
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-steel-500 hover:text-white rounded hover:bg-[#181d2c] transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Existing Ingested Repositories */}
        {projects && projects.length > 0 && (
          <div className="px-5 py-2.5 bg-[#07080d] border-b border-[#181b29]">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-steel-500 mb-1.5">
              <span>Ingested Workspaces</span>
              <span>[{projects.length}]</span>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {projects.map((p) => {
                const isActive = p.id === currentProjectId;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      onProjectSelected(p);
                      onClose();
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono whitespace-nowrap transition border ${
                      isActive
                        ? 'bg-[#141a2e] text-blue-300 border-blue-500/60 font-semibold'
                        : 'bg-[#0d0f17] hover:bg-[#131724] text-steel-400 border-[#1c2132]'
                    }`}
                  >
                    <span>{p.name}</span>
                    <span className="text-[10px] text-steel-500">({p.source})</span>
                    {isActive && <Check size={11} className="text-blue-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tactical Source Mode Tabs */}
        <div className="flex border-b border-[#1c2132] bg-[#0a0c13] px-5 pt-1">
          <button
            onClick={() => setTab('github')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono border-b-2 transition ${
              tab === 'github'
                ? 'border-blue-500 text-blue-400 font-semibold bg-[#111422]'
                : 'border-transparent text-steel-500 hover:text-steel-300'
            }`}
          >
            <Github size={13} />
            <span>GITHUB_REMOTE</span>
          </button>

          <button
            onClick={() => setTab('upload')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono border-b-2 transition ${
              tab === 'upload'
                ? 'border-blue-500 text-blue-400 font-semibold bg-[#111422]'
                : 'border-transparent text-steel-500 hover:text-steel-300'
            }`}
          >
            <Upload size={13} />
            <span>ZIP_PAYLOAD</span>
          </button>

          <button
            onClick={() => setTab('local')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono border-b-2 transition ${
              tab === 'local'
                ? 'border-blue-500 text-blue-400 font-semibold bg-[#111422]'
                : 'border-transparent text-steel-500 hover:text-steel-300'
            }`}
          >
            <Folder size={13} />
            <span>LOCAL_PATH</span>
          </button>

          <button
            onClick={() => setTab('sample')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono border-b-2 transition ${
              tab === 'sample'
                ? 'border-blue-500 text-blue-400 font-semibold bg-[#111422]'
                : 'border-transparent text-steel-500 hover:text-steel-300'
            }`}
          >
            <Layers size={13} className="text-amber-400" />
            <span>DEMO_PRESET</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5">
          {error && (
            <div className="mb-4 p-3 rounded bg-[#180a0a] border border-[#3e1414] text-red-300 text-xs font-mono flex items-start gap-2">
              <AlertTriangle size={15} className="shrink-0 mt-0.5 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {tab === 'github' && (
            <form onSubmit={handleGitHubImport} className="space-y-3 font-mono">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-steel-400 mb-1">
                  Target GitHub URL <span className="text-blue-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="https://github.com/fastapi/fastapi or owner/repo"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded bg-[#07080d] border border-[#23293c] text-steel-100 placeholder-steel-600 text-xs focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-steel-400 mb-1">
                    Branch Ref
                  </label>
                  <input
                    type="text"
                    placeholder="main (default)"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-[#07080d] border border-[#23293c] text-steel-100 placeholder-steel-600 text-xs focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-steel-400 mb-1">
                    GitHub Token (PAT)
                  </label>
                  <input
                    type="password"
                    placeholder="ghp_xxxx (optional)"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-[#07080d] border border-[#23293c] text-steel-100 placeholder-steel-600 text-xs focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !githubUrl.trim()}
                className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 px-4 rounded btn-tactical-blue text-white font-mono text-xs transition disabled:opacity-50"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                <span>{loading ? 'PULLING & PARSING AST...' : 'INGEST_GITHUB_REPOSITORY'}</span>
              </button>
            </form>
          )}

          {tab === 'upload' && (
            <form onSubmit={handleZipUpload} className="space-y-3 font-mono">
              <div className="border border-dashed border-[#23293c] hover:border-blue-500 rounded p-6 text-center transition bg-[#07080d]">
                <Upload size={24} className="mx-auto text-steel-500 mb-2" />
                <p className="text-xs text-steel-300 font-medium">
                  SELECT ARCHIVE (.ZIP / .TAR.GZ)
                </p>
                <p className="text-[10px] text-steel-500 mt-1">
                  Target files are parsed in-memory. Node_modules and virtualenvs stripped automatically.
                </p>
                <input
                  type="file"
                  accept=".zip,.tar,.gz"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  className="mt-4 block mx-auto text-xs text-steel-400 file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[11px] file:font-mono file:bg-[#1a2135] file:text-blue-300 hover:file:bg-[#212942]"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !selectedFile}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded btn-tactical-blue text-white font-mono text-xs transition disabled:opacity-50"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                <span>{loading ? 'EXTRACTING & INDEXING...' : 'DISPATCH_ARCHIVE'}</span>
              </button>
            </form>
          )}

          {tab === 'local' && (
            <form onSubmit={handleLocalImport} className="space-y-3 font-mono">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-steel-400 mb-1">
                  Absolute Local Filesystem Path <span className="text-blue-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. C:\Users\user\Projects\my-app or /home/dev/repo"
                  value={localPath}
                  onChange={(e) => setLocalPath(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded bg-[#07080d] border border-[#23293c] text-steel-100 placeholder-steel-600 text-xs focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !localPath.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded btn-tactical-blue text-white font-mono text-xs transition disabled:opacity-50"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                <span>{loading ? 'READING DIRECTORY...' : 'LINK_LOCAL_WORKSPACE'}</span>
              </button>
            </form>
          )}

          {tab === 'sample' && (
            <div className="space-y-3 font-mono">
              <div className="p-3.5 rounded bg-[#07080d] border border-[#1f2538] text-left">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-blue-400 px-1.5 py-0.5 rounded bg-[#101524] border border-[#2563eb]/40">
                    PRESET_TARGET // FINTECH
                  </span>
                  <span className="text-[10px] text-steel-500">DEMO_v2.4</span>
                </div>
                <h3 className="font-sans font-bold text-white text-sm mt-2">FinTrack-Core Engine</h3>
                <p className="text-[11px] text-steel-400 mt-1 font-sans leading-relaxed">
                  High-throughput transactional ledger service with FastAPI, React PWA, PostgreSQL, double-entry bookkeeping, distributed locks, and Docker orchestration.
                </p>
                <div className="flex gap-1.5 mt-2.5 flex-wrap">
                  {['FastAPI', 'React', 'PostgreSQL', 'Tailwind', 'Docker'].map((tech) => (
                    <span key={tech} className="text-[9px] px-1.5 py-0.2 rounded bg-[#121626] text-steel-300 border border-[#20273e]">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={handleCreateSample}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded bg-[#141b2f] hover:bg-[#1a233c] border border-blue-500/50 text-blue-300 font-mono text-xs font-semibold transition disabled:opacity-50"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Layers size={14} />}
                <span>{loading ? 'INITIALIZING PRESET...' : 'INSTANTIATE_FINTRACK_DEMO'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
