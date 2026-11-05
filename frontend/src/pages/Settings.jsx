import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Key,
  Github,
  Cpu,
  Check,
  Save,
  AlertTriangle,
  Server,
  HardDrive
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
      setStatusMsg({ type: 'success', text: 'SETTINGS_COMMITTED // Runtime updated.' });
      setGeminiKey('');
      setGithubToken('');
      setOpenaiKey('');
      loadSettings();
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'UPDATE_FAILED // Could not write configuration.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-5 sm:p-8 bg-[#07080c] font-mono">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Title */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-blue-400 font-bold text-xs uppercase tracking-wider">CONFIG_RUNTIME</span>
            <span className="text-steel-600">//</span>
            <span className="text-white text-xs font-semibold">PARAMETERS & TELEMETRY</span>
          </div>
          <p className="text-[11px] text-steel-500 mt-1 font-sans">
            Configure inference credentials, GitHub tokens, and inspect system telemetry.
          </p>
        </div>

        {statusMsg && (
          <div
            className={`p-3 rounded text-xs font-mono flex items-center gap-2 border ${
              statusMsg.type === 'success'
                ? 'bg-[#091510] text-emerald-300 border-[#143d2c]'
                : 'bg-[#180a0a] text-red-300 border-[#3e1414]'
            }`}
          >
            {statusMsg.type === 'success' ? <Check size={14} /> : <AlertTriangle size={14} />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSave} className="dev-card rounded-md p-5 sm:p-6 border border-[#1b2030] space-y-4">
          <div className="flex items-center justify-between border-b border-[#181c2b] pb-2.5">
            <div className="flex items-center gap-2">
              <Key size={14} className="text-blue-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                API Credentials
              </span>
            </div>
            <span className="text-[10px] text-steel-500">INJECTED_ENV</span>
          </div>

          {/* Gemini Key */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] uppercase tracking-wider text-steel-400">
                Google Gemini API Key
              </label>
              <span className="text-[10px] text-steel-500">
                STATUS: <span className="text-blue-400 font-bold">{config?.gemini_key_masked || 'NOT_SET'}</span>
              </span>
            </div>
            <input
              type="password"
              placeholder="Paste new Gemini API Key (e.g. AIzaSy...)"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              className="w-full px-3 py-1.5 rounded bg-[#090b12] border border-[#202538] text-xs text-steel-100 placeholder-steel-600 focus:outline-none focus:border-blue-500 font-mono"
            />
            <p className="text-[10px] text-steel-500 mt-1 font-sans">
              Powers large-context repo synthesis. Defaults to built-in smart heuristic engine when omitted.
            </p>
          </div>

          {/* GitHub Token */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] uppercase tracking-wider text-steel-400 flex items-center gap-1.5">
                <Github size={11} /> GitHub Personal Access Token (PAT)
              </label>
              <span className="text-[10px] text-steel-500">
                STATUS: <span className="text-blue-400 font-bold">{config?.github_token_masked || 'NOT_SET'}</span>
              </span>
            </div>
            <input
              type="password"
              placeholder="ghp_xxxx or github_pat_xxxx"
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
              className="w-full px-3 py-1.5 rounded bg-[#090b12] border border-[#202538] text-xs text-steel-100 placeholder-steel-600 focus:outline-none focus:border-blue-500 font-mono"
            />
            <p className="text-[10px] text-steel-500 mt-1 font-sans">
              Increases GitHub API rate limit from 60 req/hr to 5,000 req/hr and unlocks private repo cloning.
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center justify-center gap-2 py-2 px-4 rounded btn-tactical-blue text-white text-xs font-semibold transition disabled:opacity-50"
          >
            <Save size={13} />
            <span>{saving ? 'WRITING...' : 'SAVE_CONFIGURATION'}</span>
          </button>
        </form>

        {/* Runtime Diagnostics Card */}
        <div className="dev-card rounded-md p-5 sm:p-6 border border-[#1b2030] space-y-3 font-mono">
          <div className="flex items-center justify-between border-b border-[#181c2b] pb-2">
            <div className="flex items-center gap-2">
              <Cpu size={14} className="text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                Runtime Diagnostics
              </span>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold">ONLINE</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded bg-[#090b12] border border-[#191d2c]">
              <span className="text-steel-500 block text-[9px] uppercase">Active Inference Engine</span>
              <span className="font-bold text-steel-200 mt-0.5 block text-[11px]">
                {config?.gemini_configured ? config.gemini_model : 'Smart Heuristic AST Engine'}
              </span>
            </div>

            <div className="p-2.5 rounded bg-[#090b12] border border-[#191d2c]">
              <span className="text-steel-500 block text-[9px] uppercase">Database Engine</span>
              <span className="font-bold text-steel-200 mt-0.5 block text-[11px]">
                {config?.database_type || 'SQLite'} (Zero-Setup)
              </span>
            </div>

            <div className="p-2.5 rounded bg-[#090b12] border border-[#191d2c]">
              <span className="text-steel-500 block text-[9px] uppercase">PWA Offline Precache</span>
              <span className="font-bold text-emerald-400 mt-0.5 block text-[11px]">
                Workbox // ACTIVE
              </span>
            </div>

            <div className="p-2.5 rounded bg-[#090b12] border border-[#191d2c]">
              <span className="text-steel-500 block text-[9px] uppercase">Container Packaging</span>
              <span className="font-bold text-steel-200 mt-0.5 block text-[11px]">
                Docker Compose Ready
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
