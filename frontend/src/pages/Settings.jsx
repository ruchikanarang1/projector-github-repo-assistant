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
  Sparkles,
  RefreshCw,
  ExternalLink,
  Layers,
  Zap
} from 'lucide-react';
import { settingsApi } from '../api/client';

export default function Settings() {
  const [config, setConfig] = useState(null);
  const [geminiKey, setGeminiKey] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  // Dynamic Gemini Models state
  const [geminiModels, setGeminiModels] = useState([]);
  const [activeModel, setActiveModel] = useState('');
  const [modelsLoading, setModelsLoading] = useState(false);

  useEffect(() => {
    loadSettings();
    loadGeminiModels();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await settingsApi.get();
      setConfig(data);
    } catch (err) {
      console.error('Settings error:', err);
    }
  };

  const loadGeminiModels = async () => {
    setModelsLoading(true);
    try {
      const res = await settingsApi.getGeminiModels();
      if (res) {
        setGeminiModels(res.models || []);
        setActiveModel(res.active_model || 'gemini-3.5-flash-lite');
      }
    } catch (err) {
      console.warn('Could not load Gemini models:', err);
    } finally {
      setModelsLoading(false);
    }
  };

  const handleSetActiveModel = async (modelId) => {
    try {
      await settingsApi.setActiveGeminiModel(modelId);
      setActiveModel(modelId);
      setStatusMsg({ type: 'success', text: `Active model updated to ${modelId}.` });
      loadSettings();
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Failed to update active model.' });
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
        localStorage.setItem('projector_gh_token', githubToken.trim());
      }
      setStatusMsg({ type: 'success', text: 'Configuration saved successfully.' });
      setGeminiKey('');
      setGithubToken('');
      setOpenaiKey('');
      loadSettings();
      loadGeminiModels();
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
            Settings & Dynamic Model Telemetry
          </h2>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
            Configure your AI inference models, GitHub SSO authentication credentials, and inspect live Google AI Studio models.
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

        {/* Live Google AI Studio Models Browser Card */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[#121217] border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2">
              <Cpu size={16} className="text-amber-200/90" />
              <div>
                <h3 className="text-sm font-serif font-bold text-white tracking-tight">
                  Google Gemini Live Models ({geminiModels.length})
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Fetched dynamically from Google AI Studio. Out-of-service models are automatically excluded.
                </p>
              </div>
            </div>
            <button
              onClick={loadGeminiModels}
              disabled={modelsLoading}
              className="px-3 py-1.5 rounded-lg text-xs bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-white/10 flex items-center gap-1.5 transition"
              title="Sync live models from Google AI Studio"
            >
              <RefreshCw size={12} className={modelsLoading ? 'animate-spin' : ''} />
              <span>Sync API</span>
            </button>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {geminiModels.map((m) => {
              const isActive = activeModel === m.id;
              return (
                <div
                  key={m.id}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition ${
                    isActive
                      ? 'bg-white/[0.07] border-amber-200/40 text-white'
                      : 'bg-[#09090b] border-white/[0.06] text-zinc-300 hover:border-white/20'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-white truncate">
                        {m.display_name}
                      </span>
                      {isActive && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-200/20 text-amber-200 border border-amber-200/30 flex items-center gap-1">
                          <Check size={10} /> Active
                        </span>
                      )}
                      {m.is_lowest_cost ? (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-800/30">
                          Lowest Cost
                        </span>
                      ) : m.is_latest ? (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-950/40 text-amber-200 border border-amber-800/30">
                          Latest
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono mt-0.5">
                      <span>{m.id}</span>
                      {m.input_token_limit && (
                        <>
                          <span>•</span>
                          <span>{(m.input_token_limit / 1000).toFixed(0)}k token window</span>
                        </>
                      )}
                    </div>
                  </div>

                  {!isActive && (
                    <button
                      onClick={() => handleSetActiveModel(m.id)}
                      className="px-3 py-1 rounded-lg text-xs bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 border border-white/10 transition"
                    >
                      Set Active
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* API Keys Configuration Form */}
        <form onSubmit={handleSave} className="p-6 sm:p-8 rounded-2xl bg-[#121217] border border-white/[0.08] space-y-6">
          <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
            <Key size={15} className="text-amber-200/90" />
            <h3 className="text-sm font-serif font-bold text-white tracking-tight">
              API Keys & Authentication Tokens
            </h3>
          </div>

          {/* Gemini API Key */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Sparkles size={13} className="text-amber-200/90" /> Google Gemini API Key
              </label>
              <span className="text-xs text-zinc-400 font-mono">
                Current: <span className="text-amber-200/90 font-medium">{config?.gemini_key_masked || 'Not Configured'}</span>
              </span>
            </div>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#09090b] border border-white/15 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/40 font-mono"
            />
            <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
              Enables live codebase synthesis across all Gemini models. Get a free key at{' '}
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-amber-200 hover:underline inline-flex items-center gap-0.5">
                Google AI Studio <ExternalLink size={10} />
              </a>.
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
              <span className="font-semibold text-white mt-1 block truncate">
                {activeModel || 'Gemini 3.5 Flash-Lite'}
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
