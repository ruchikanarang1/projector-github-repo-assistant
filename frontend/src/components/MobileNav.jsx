import React from 'react';
import { MessageSquare, BookOpen, GraduationCap, FolderTree, Settings } from 'lucide-react';

const mobileNavItems = [
  { id: 'talk', label: 'Talk', icon: MessageSquare },
  { id: 'docs', label: 'Dossier', icon: BookOpen },
  { id: 'interview', label: 'Prep', icon: GraduationCap },
  { id: 'code', label: 'Code', icon: FolderTree },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function MobileNav({ activeTab, onSelectTab }) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#09090b]/95 backdrop-blur-md border-t border-white/[0.08] flex items-center justify-around px-2 z-40 select-none">
      {mobileNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
              isActive ? 'text-white font-semibold' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <div className={`p-1 rounded-lg ${isActive ? 'bg-white/10 text-white' : ''}`}>
              <Icon size={18} />
            </div>
            <span className="text-[10px] mt-0.5">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
