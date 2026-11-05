import React, { useState, useEffect } from 'react';
import { MessageSquare, BookOpen, GraduationCap, FolderTree, Settings, Sparkles, Cpu } from 'lucide-react';
import { settingsApi } from '../api/client';

const navItems = [
  { id: 'talk', label: 'Talk to Project', num: '01', icon: MessageSquare, badge: 'Conversational' },
  { id: 'docs', label: 'Doc Studio', num: '02', icon: BookOpen, badge: 'Mermaid' },
  { id: 'interview', label: 'Interview Arena', num: '03', icon: GraduationCap, badge: 'STAR' },
  { id: 'code', label: 'Code Explorer', num: '04', icon: FolderTree },
  { id: 'settings', label: 'Configuration', num: '05', icon: Settings },
];

export default function Sidebar({ activeTab, onSelectTab, currentProject }) {
  const [modelInfo, setModelInfo] = useState('Gemini 2.5 Flash');

  useEffect(() => {
    settingsApi.get()
      .then((cfg) => {
        if (cfg.gemini_configured) {
          setModelInfo(cfg.gemini_model || 'Gemini 2.5 Flash');
        } else if (cfg.openai_configured) {
          setModelInfo(cfg.openai_model || 'GPT-4o-mini');
        } else {
          setModelInfo('Rule-Based Synthesizer');
        }
      })
      .catch(() => {});
  }, []);

  return (
    <aside className="w-64 bg-[#09090b] border-r border-white/[0.08] p-4 hidden md:flex flex-col justify-between shrink-0 select-none">
      <div>
        {/* Navigation list */}
        <div className="space-y-1">
          <div className="px-3 py-2 text-[10px] font-sans uppercase tracking-widest text-zinc-500 font-medium">
            Chapters & Dossiers
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition ${
                  isActive
                    ? 'bg-white text-zinc-950 font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-mono ${isActive ? 'text-zinc-600' : 'text-zinc-500'}`}>
                    {item.num}
                  </span>
                  <Icon size={15} />
                  <span className="font-medium text-[13px]">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-zinc-200 text-zinc-800' : 'bg-white/[0.06] text-zinc-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Active Project Dossier Summary */}
        {currentProject && (
          <div className="mt-8 p-4 rounded-2xl bg-[#121216] border border-white/[0.08] text-xs">
            <span className="text-[10px] uppercase font-sans tracking-widest text-amber-200/80 font-medium block mb-1">
              Active Subject
            </span>
            <p className="font-serif font-bold text-white text-sm truncate">
              {currentProject.name}
            </p>
            <div className="flex items-center gap-2 mt-2 text-[11px] text-zinc-400">
              <span className="capitalize">{currentProject.source}</span>
              <span>•</span>
              <span>{currentProject.file_count} files</span>
            </div>

            {currentProject.tech_stack && currentProject.tech_stack.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {currentProject.tech_stack.slice(0, 4).map((tech) => (
                  <span
                    key={tech}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-300 border border-white/5"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Model Telemetry Banner */}
      <div className="p-3.5 rounded-2xl bg-[#121216] border border-white/[0.08] text-xs text-zinc-400 space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-zinc-500 uppercase tracking-wider text-[9px] font-semibold flex items-center gap-1">
            <Cpu size={11} className="text-amber-200/80" /> Inference Engine
          </span>
          <span className="text-emerald-400 text-[10px] font-medium">Active</span>
        </div>
        <p className="text-white text-xs font-medium truncate">
          {modelInfo}
        </p>
      </div>
    </aside>
  );
}
