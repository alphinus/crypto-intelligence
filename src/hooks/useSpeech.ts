'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface UseSpeechReturn {
  speak: (text: string) => void;
  stop: () => void;
  isSpeaking: boolean;
  isEnabled: boolean;
  toggleEnabled: () => void;
}

export function useSpeech(): UseSpeechReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Cleanup bei unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = useCallback((text: string) => {
    if (!isEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;

    // Stoppe aktuelle Sprache
    window.speechSynthesis.cancel();

    // Markdown entfernen für saubere Sprachausgabe
    const cleanText = text
      .replace(/[#*_`]/g, '')  // Markdown-Formatierung
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // Links
      .replace(/\n+/g, '. ')  // Zeilenumbrüche zu Pausen
      .replace(/\s+/g, ' ')  // Mehrfache Leerzeichen
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'de-DE';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isEnabled]);

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const toggleEnabled = useCallback(() => {
    setIsEnabled(prev => {
      if (prev) {
        // Beim Deaktivieren: Stoppe aktuelle Sprache
        if (typeof window !== 'undefined' && window.speechSynthesis) {
          window.speechSynthesis.cancel();
          setIsSpeaking(false);
        }
      }
      return !prev;
    });
  }, []);

  return { speak, stop, isSpeaking, isEnabled, toggleEnabled };
}
