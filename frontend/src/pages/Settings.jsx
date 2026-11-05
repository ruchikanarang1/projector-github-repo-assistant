import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Key,
  Github,
  Database,
  Cpu,
  Check,
  Save,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Server
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
      setStatusMsg({ type: 'success', text: 'Settings updated successfully!' });
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
    <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-slate-950">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Title */}
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-brand-500/20 text-brand-400">
              <SettingsIcon size={20} />
            </span>
            App Settings & AI Configuration
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure your AI keys, GitHub access tokens, and view system status.
          </p>
        </div>

        {statusMsg && (
          <div
            className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                : 'bg-red-500/10 text-red-300 border border-red-500/30'
            }`}
          >
            {statusMsg.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* API Keys Configuration Form */}
        <form onSubmit={handleSave} className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-6">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Key size={16} className="text-brand-400" />
            API Credentials
          </h3>

          {/* Gemini API Key */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-200">
                Google Gemini API Key
              </label>
              <span className="text-[11px] text-slate-400">
                Current: <span className="font-mono text-brand-300">{config?.gemini_key_masked || 'Not Set'}</span>
              </span>
            </div>
            <input
              type="password"
              placeholder="Paste new Gemini API Key (e.g. AIzaSy...)"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Powers deep repo synthesis and interview chat. Free tier available on Google AI Studio.
            </p>
          </div>

          {/* GitHub Personal Access Token */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Github size={13} /> GitHub Personal Access Token (PAT)
              </label>
              <span className="text-[11px] text-slate-400">
                Current: <span className="font-mono text-brand-300">{config?.github_token_masked || 'Not Set'}</span>
              </span>
            </div>
            <input
              type="password"
              placeholder="ghp_xxxx or github_pat_xxxx"
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Optional: Grants higher API rate limits and allows downloading private repos.
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition shadow-md shadow-brand-600/20"
          >
            <Save size={15} />
            <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </form>

        {/* System & Runtime Diagnostic Card */}
        <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Cpu size={16} className="text-emerald-400" />
            Runtime Environment & Deployment
          </h3>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Active Engine</span>
              <span className="font-bold text-slate-200 mt-0.5 block">
                {config?.gemini_configured ? config.gemini_model : 'Smart Heuristic Engine'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Database Engine</span>
              <span className="font-bold text-slate-200 mt-0.5 block">
                {config?.database_type || 'SQLite'} (Zero-Setup)
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">PWA Offline Mode</span>
              <span className="font-bold text-emerald-400 mt-0.5 block">Enabled</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Docker Support</span>
              <span className="font-bold text-slate-200 mt-0.5 block">Ready for Publish</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
