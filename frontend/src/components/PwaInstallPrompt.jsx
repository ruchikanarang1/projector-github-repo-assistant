import React, { useEffect, useState } from 'react';
import { Download, X, Smartphone, Cpu } from 'lucide-react';

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const dismissed = localStorage.getItem('pwa_prompt_dismissed');
      if (!dismissed) {
        setVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setVisible(false);
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-16 sm:bottom-4 right-4 left-4 sm:left-auto sm:max-w-md z-40 animate-in slide-in-from-bottom-5">
      <div className="p-3.5 rounded-lg bg-[#0d0f17] border border-[#262c42] shadow-2xl flex items-center justify-between gap-3 text-steel-200 font-mono">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded bg-[#131724] text-blue-400 border border-[#222a40]">
            <Smartphone size={16} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-white uppercase">Install PWA Binary</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">STANDALONE</span>
            </div>
            <p className="text-[10px] text-steel-500 leading-tight">
              Cache project specs & interview arena offline on home screen.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleInstall}
            className="btn-tactical-blue px-2.5 py-1 rounded text-white text-[11px] font-mono flex items-center gap-1 transition"
          >
            <Download size={11} />
            <span>INSTALL</span>
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 text-steel-500 hover:text-white rounded hover:bg-[#181d2c] transition"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
