import React from 'react';
import { Terminal, FileCode2, GraduationCap, FolderTree, Settings, Cpu, HardDrive } from 'lucide-react';

const navItems = [
  { id: 'talk', label: 'Talk to Project', code: '01', icon: Terminal, badge: 'RAG' },
  { id: 'docs', label: 'Doc Studio', code: '02', icon: FileCode2, badge: 'MERMAID' },
  { id: 'interview', label: 'Interview Arena', code: '03', icon: GraduationCap, badge: 'RUBRIC' },
  { id: 'code', label: 'Code Explorer', code: '04', icon: FolderTree },
  { id: 'settings', label: 'Config & Keys', code: '05', icon: Settings },
];

export default function Sidebar({ activeTab, onSelectTab, currentProject }) {
  return (
    <aside className="w-60 bg-[#07080c] border-r border-[#1a1e2e] p-3 hidden md:flex flex-col justify-between shrink-0 select-none">
      <div>
        {/* Navigation list */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-steel-500">
            <span>Navigation</span>
            <span>// INDEX</span>
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-xs font-mono transition border ${
                  isActive
                    ? 'bg-[#111420] text-blue-400 border-[#2563eb]/40 font-semibold shadow-inner'
                    : 'text-steel-400 hover:text-steel-200 hover:bg-[#0d0f17] border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`text-[10px] font-mono ${isActive ? 'text-blue-400' : 'text-steel-500'}`}>
                    {item.code}
                  </span>
                  <Icon size={14} className={isActive ? 'text-blue-400' : 'text-steel-500'} />
                  <span className="font-sans text-[13px]">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] font-mono px-1 py-0.2 rounded border ${
                      isActive
                        ? 'bg-blue-950/80 text-blue-300 border-blue-800'
                        : 'bg-[#121520] text-steel-500 border-[#1f2436]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Active Repository Telemetry Block */}
        {currentProject && (
          <div className="mt-6 p-3 rounded-md dev-card font-mono text-xs border border-[#1b1f30]">
            <div className="flex items-center justify-between text-[10px] text-steel-500 uppercase tracking-widest border-b border-[#1b1f30] pb-1.5 mb-2">
              <span className="flex items-center gap-1.5">
                <HardDrive size={10} className="text-blue-400" />
                Active Target
              </span>
              <span className="text-blue-400 font-bold">LIVE</span>
            </div>

            <p className="font-sans font-bold text-steel-100 truncate text-[13px] mb-1">
              {currentProject.name}
            </p>

            <div className="grid grid-cols-2 gap-1 text-[10px] text-steel-400 my-2">
              <div className="bg-[#090a10] p-1.5 rounded border border-[#171b29]">
                <span className="text-steel-500 block text-[9px]">SOURCE</span>
                <span className="capitalize text-steel-300 font-semibold">{currentProject.source}</span>
              </div>
              <div className="bg-[#090a10] p-1.5 rounded border border-[#171b29]">
                <span className="text-steel-500 block text-[9px]">INDEXED</span>
                <span className="text-steel-300 font-semibold">{currentProject.file_count} Files</span>
              </div>
            </div>

            {currentProject.tech_stack && currentProject.tech_stack.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {currentProject.tech_stack.slice(0, 4).map((tech) => (
                  <span
                    key={tech}
                    className="text-[9px] px-1 py-0.5 rounded bg-[#131622] text-steel-300 border border-[#202538]"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Terminal prompt footer */}
      <div className="p-2.5 rounded-md bg-[#0a0b12] border border-[#181b29] font-mono text-[10px] text-steel-500 space-y-1">
        <div className="flex items-center justify-between text-steel-400">
          <span>PROJECTOR::CLI</span>
          <span className="text-emerald-500 font-bold">READY</span>
        </div>
        <div className="text-steel-400 truncate">
          $ query --target-ast --citations
        </div>
      </div>
    </aside>
  );
}
