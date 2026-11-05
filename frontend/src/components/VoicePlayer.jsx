import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Play, Pause } from 'lucide-react';

export default function VoicePlayer({ text }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSupported(true);
    }
  }, []);

  const handleToggle = () => {
    if (!supported || !text) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      window.speechSynthesis.cancel(); // clear previous
      // Strip markdown syntax for natural speech
      const cleanText = text
        .replace(/```[\s\S]*?```/g, 'Code block omitted.')
        .replace(/[#*`_~\[\]]/g, '')
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);

      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };

  if (!supported) return null;

  return (
    <button
      onClick={handleToggle}
      className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border transition ${
        isPlaying
          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
          : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
      }`}
      title={isPlaying ? 'Pause narration' : 'Listen to explanation'}
    >
      {isPlaying ? <Pause size={12} /> : <Volume2 size={12} />}
      <span>{isPlaying ? 'Playing Audio' : 'Listen'}</span>
    </button>
  );
}
