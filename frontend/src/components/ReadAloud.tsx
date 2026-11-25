import React, { useEffect, useState } from 'react';
import { locale, tr, useLocale } from '../i18n';

/**
 * Reads the given text aloud in the selected language using the browser's speech engine.
 * Renders nothing when the browser has no speech synthesis support.
 */
export const ReadAloud: React.FC<{ text: string; className?: string }> = ({ text, className = '' }) => {
  useLocale();
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
  const [speaking, setSpeaking] = useState(false);

  // Stop speech when the text (page or language) changes or the component unmounts.
  useEffect(() => () => { if (supported) window.speechSynthesis.cancel(); }, [supported, text]);

  if (!supported) return null;

  const toggle = () => {
    const synth = window.speechSynthesis;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = locale();
    const voice = synth.getVoices().find((item) => item.lang.toLowerCase().startsWith(utterance.lang.slice(0, 2).toLowerCase()));
    if (voice) utterance.voice = voice;
    utterance.rate = 0.95;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    synth.speak(utterance);
    setSpeaking(true);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={speaking}
      aria-label={speaking ? tr('Stop reading') : tr('Read this page aloud')}
      className={`inline-flex min-h-11 items-center gap-2 rounded-full bg-[#E9A400] px-5 text-sm font-bold text-[#14262E] transition hover:bg-[#F5B921] ${className}`}
    >
      <span aria-hidden="true">{speaking ? '■' : '🔊'}</span>
      {speaking ? tr('Stop') : tr('Listen')}
    </button>
  );
};
