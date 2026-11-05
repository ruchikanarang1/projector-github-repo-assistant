import React from 'react';
import { MessageSquare, FileText, GraduationCap, FolderTree, Settings } from 'lucide-react';

const mobileNavItems = [
  { id: 'talk', label: 'Talk', icon: MessageSquare },
  { id: 'docs', label: 'Docs', icon: FileText },
  { id: 'interview', label: 'Prep', icon: GraduationCap },
  { id: 'code', label: 'Code', icon: FolderTree },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function MobileNav({ activeTab, onSelectTab }) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800 flex items-center justify-around px-2 z-40">
      {mobileNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
              isActive ? 'text-brand-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-lg ${isActive ? 'bg-brand-500/20 text-brand-400' : ''}`}>
              <Icon size={18} />
            </div>
            <span className="text-[10px] mt-0.5">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
