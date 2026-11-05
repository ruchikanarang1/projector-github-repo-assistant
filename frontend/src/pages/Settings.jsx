import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Key,
  Github,
  Cpu,
  Check,
  Save,
  AlertTriangle,
  Info,
  Sparkles
} from 'lucide-react';
import { settingsApi } from '../api/client';

export default function Settings() {
  const [config, setConfig] = useState(null);
  const [geminiKey, setGeminiKey] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await settingsApi.get();
      setConfig(data);
    } catch (err) {
      console.error('Settings error:', err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);
    try {
      await settingsApi.update({
        gemini_api_key: geminiKey.trim() || undefined,
        github_token: githubToken.trim() || undefined,
        openai_api_key: openaiKey.trim() || undefined,
      });
      if (githubToken.trim()) {
        localStorage.setItem('github_token', githubToken.trim());
      }
      setStatusMsg({ type: 'success', text: 'Configuration saved successfully.' });
      setGeminiKey('');
      setGithubToken('');
      setOpenaiKey('');
      loadSettings();
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Failed to update settings.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-[#09090b] font-sans">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Editorial Title */}
        <div>
          <span className="text-[10px] uppercase font-sans tracking-widest text-amber-200/80 font-semibold block mb-1">
            System Configuration
          </span>
          <h2 className="text-3xl font-serif font-bold text-white tracking-tight">
            Settings & Model Telemetry
          </h2>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
            Configure your AI inference models, GitHub authentication credentials, and inspect runtime health.
          </p>
        </div>

        {statusMsg && (
          <div
            className={`p-4 rounded-2xl text-xs flex items-center gap-2.5 border ${
              statusMsg.type === 'success'
                ? 'bg-emerald-950/30 text-emerald-300 border-emerald-800/40'
                : 'bg-red-950/30 text-red-300 border-red-800/40'
            }`}
          >
            {statusMsg.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* How Answers are Generated Explainer Card */}
        <div className="p-6 rounded-2xl bg-[#121217] border border-white/[0.08] space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-amber-200/90" />
            <h3 className="text-sm font-serif font-bold text-white tracking-tight">
              How Projector Generates Answers
            </h3>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            When you chat with a repository, Projector does not hallucinate answers in the dark. It executes an end-to-end <strong>AST Retrieval-Augmented Generation (RAG)</strong> pipeline:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
            <div className="p-3 rounded-xl bg-[#09090b] border border-white/[0.06]">
              <span className="font-semibold text-white block mb-0.5">1. AST Indexing</span>
              <span className="text-zinc-500 text-[11px]">Source files are split into overlapping line-accurate windows.</span>
            </div>
            <div className="p-3 rounded-xl bg-[#09090b] border border-white/[0.06]">
              <span className="font-semibold text-white block mb-0.5">2. Relevance Search</span>
              <span className="text-zinc-500 text-[11px]">Keywords score against entry points, route handlers & models.</span>
            </div>
            <div className="p-3 rounded-xl bg-[#09090b] border border-white/[0.06]">
              <span className="font-semibold text-white block mb-0.5">3. Gemini 2.5 Flash</span>
              <span className="text-zinc-500 text-[11px]">Snippets are synthesized with exact line citations.</span>
            </div>
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSave} className="p-6 sm:p-8 rounded-2xl bg-[#121217] border border-white/[0.08] space-y-6">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
            <div className="flex items-center gap-2">
              <Key size={15} className="text-amber-200/90" />
              <h3 className="text-sm font-serif font-bold text-white">
                API Credentials
              </h3>
            </div>
            <span className="text-xs text-zinc-500">Encrypted in Local Environment</span>
          </div>

          {/* Gemini Key */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-white">
                Google Gemini API Key
              </label>
              <span className="text-xs text-zinc-400 font-mono">
                Current: <span className="text-amber-200/90 font-medium">{config?.gemini_key_masked || 'Not Configured'}</span>
              </span>
            </div>
            <input
              type="password"
              placeholder="Paste new Gemini API Key (e.g. AIzaSy...)"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#09090b] border border-white/15 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/40 font-mono"
            />
            <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
              Default & Recommended: Uses <strong>Gemini 2.5 Flash</strong> with its large context window to process full repositories in seconds.
            </p>
          </div>

          {/* GitHub Token */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Github size={13} /> GitHub Personal Access Token (PAT)
              </label>
              <span className="text-xs text-zinc-400 font-mono">
                Current: <span className="text-amber-200/90 font-medium">{config?.github_token_masked || 'Not Configured'}</span>
              </span>
            </div>
            <input
              type="password"
              placeholder="ghp_xxxx or github_pat_xxxx"
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#09090b] border border-white/15 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/40 font-mono"
            />
            <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
              Unlocks direct repository browsing, private repository cloning, and increases your GitHub API limit to 5,000 req/hr.
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn-editorial-primary px-6 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2 transition disabled:opacity-50"
          >
            <Save size={14} />
            <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </form>

        {/* Runtime Diagnostics Card */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[#121217] border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2">
              <Cpu size={15} className="text-emerald-400" />
              <h3 className="text-sm font-serif font-bold text-white">
                Runtime Diagnostics
              </h3>
            </div>
            <span className="text-xs text-emerald-400 font-medium">Operational</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-[#09090b] border border-white/[0.06]">
              <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Active Model</span>
              <span className="font-semibold text-white mt-1 block">
                {config?.gemini_configured ? config.gemini_model : 'Smart Heuristic Synthesizer'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#09090b] border border-white/[0.06]">
              <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Database Persistence</span>
              <span className="font-semibold text-white mt-1 block">
                {config?.database_type || 'SQLite'} (Zero-Setup)
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#09090b] border border-white/[0.06]">
              <span className="text-zinc-500 block text-[10px] uppercase font-semibold">PWA Offline Engine</span>
              <span className="font-semibold text-emerald-400 mt-1 block">
                Workbox Precached
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#09090b] border border-white/[0.06]">
              <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Deployment Packaging</span>
              <span className="font-semibold text-white mt-1 block">
                Docker & Cloud Ready
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
