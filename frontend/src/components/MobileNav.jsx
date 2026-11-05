import React from 'react';
import { Terminal, FileCode2, GraduationCap, FolderTree, Settings } from 'lucide-react';

const mobileNavItems = [
  { id: 'talk', label: 'TALK', icon: Terminal },
  { id: 'docs', label: 'DOCS', icon: FileCode2 },
  { id: 'interview', label: 'PREP', icon: GraduationCap },
  { id: 'code', label: 'CODE', icon: FolderTree },
  { id: 'settings', label: 'CONFIG', icon: Settings },
];

export default function MobileNav({ activeTab, onSelectTab }) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-[#07080c] border-t border-[#1a1e2e] flex items-center justify-around px-2 z-40 select-none">
      {mobileNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded transition font-mono ${
              isActive ? 'text-blue-400 font-bold' : 'text-steel-500 hover:text-steel-300'
            }`}
          >
            <div className={`p-1 rounded ${isActive ? 'bg-[#121626] border border-[#2563eb]/40' : ''}`}>
              <Icon size={16} />
            </div>
            <span className="text-[9px] mt-0.5 tracking-wider">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
