import React from 'react';
import { MessageSquare, FileText, GraduationCap, FolderTree, Settings, Sparkles } from 'lucide-react';

const navItems = [
  { id: 'talk', label: 'Talk to Project', icon: MessageSquare, badge: 'AI Q&A' },
  { id: 'docs', label: 'Doc Studio', icon: FileText, badge: 'Mermaid' },
  { id: 'interview', label: 'Interview Prep', icon: GraduationCap, badge: 'Flashcards' },
  { id: 'code', label: 'Code Explorer', icon: FolderTree },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ activeTab, onSelectTab, currentProject }) {
  return (
    <aside className="w-64 bg-slate-950/60 border-r border-slate-800/80 p-4 hidden md:flex flex-col justify-between shrink-0">
      <div>
        {/* Navigation list */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 block mb-2">
            Main Features
          </label>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-md shadow-brand-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={16} className={isActive ? 'text-white' : 'text-slate-400'} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Current Repo Metadata Card */}
        {currentProject && (
          <div className="mt-8 p-3.5 rounded-xl glass-panel-subtle text-xs border border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
              Active Repository
            </span>
            <p className="font-semibold text-slate-200 truncate">{currentProject.name}</p>
            <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
              <span className="capitalize">{currentProject.source}</span>
              <span>•</span>
              <span>{currentProject.file_count} files</span>
            </div>

            {currentProject.tech_stack && currentProject.tech_stack.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {currentProject.tech_stack.slice(0, 4).map((tech) => (
                  <span
                    key={tech}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pro tip card */}
      <div className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-950/30 to-purple-950/20 border border-brand-500/20 text-[11px] text-slate-400">
        <p className="text-brand-300 font-semibold flex items-center gap-1.5 mb-1">
          <Sparkles size={13} />
          Interview Tip
        </p>
        <p className="leading-snug">
          Use "Grill Mode" in chat right before an interview to rehearse answers about tradeoffs and scaling!
        </p>
      </div>
    </aside>
  );
}
