import React, { useState, useEffect } from 'react';
import { Volume2, Pause } from 'lucide-react';

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
      window.speechSynthesis.cancel();
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
      className={`flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono rounded border transition ${
        isPlaying
          ? 'bg-[#1e1509] text-amber-300 border-[#472f10]'
          : 'bg-[#0f121d] text-steel-400 border-[#20273a] hover:text-white hover:bg-[#161a29]'
      }`}
      title={isPlaying ? 'Pause speech output' : 'Audio stream synthesis'}
    >
      {isPlaying ? <Pause size={10} /> : <Volume2 size={10} />}
      <span>{isPlaying ? 'AUDIO::PLAYING' : 'AUDIO_OUT'}</span>
    </button>
  );
}
