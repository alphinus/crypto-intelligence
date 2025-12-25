'use client';

import { useState, useCallback } from 'react';
import {
  type ChatMessage,
  type SatoshiContext,
  shouldUseAI,
  generateRuleBasedResponse,
} from '@/lib/satoshi-responder';

interface UseSatoshiChatReturn {
  messages: ChatMessage[];
  sendMessage: (text: string) => Promise<void>;
  isThinking: boolean;
  clearHistory: () => void;
}

export function useSatoshiChat(context: SatoshiContext): UseSatoshiChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'satoshi',
      content: 'Hey Elvis! 👋 Ich bin Satoshi, dein Trading-Assistent. Frag mich was du wissen willst - z.B. "Welchen Trade würdest du nehmen?" oder "Wie ist das Risiko?"',
      timestamp: new Date(),
    },
  ]);
  const [isThinking, setIsThinking] = useState(false);

  const sendMessage = useCallback(async (text: string) => {
    const trimmedText = text.trim();
    if (!trimmedText) return;

    // User-Nachricht hinzufügen
    const userMessage: ChatMessage = {
      role: 'user',
      content: trimmedText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    // Prüfen ob KI nötig ist
    const needsAI = shouldUseAI(trimmedText);

    // Erst regelbasiert versuchen
    const ruleBasedResponse = generateRuleBasedResponse(trimmedText, context);

    if (ruleBasedResponse && !needsAI) {
      // Regelbasierte Antwort
      const satoshiMessage: ChatMessage = {
        role: 'satoshi',
        content: ruleBasedResponse,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, satoshiMessage]);
      return;
    }

    // KI-Antwort benötigt
    setIsThinking(true);

    try {
      const response = await fetch('/api/satoshi-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmedText,
          context: {
            selectedCoin: context.selectedCoin,
            tradeRecommendations: context.tradeRecommendations,
            tradeScores: context.tradeScores,
            fearGreed: context.fearGreed,
            fundingRates: context.futuresData?.fundingRates,
            topCoins: context.topCoins?.slice(0, 5),
          },
        }),
      });

      if (!response.ok) {
        throw new Error('API Fehler');
      }

      const data = await response.json();

      const satoshiMessage: ChatMessage = {
        role: 'satoshi',
        content: data.response || 'Hmm, da bin ich mir nicht sicher. Frag mich was anderes!',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, satoshiMessage]);
    } catch (error) {
      console.error('Satoshi Chat Error:', error);

      // Fallback bei Fehler
      const errorMessage: ChatMessage = {
        role: 'satoshi',
        content: 'Ups, da ist was schiefgelaufen. Versuch es nochmal oder frag etwas einfacheres wie "Bester Trade?" 🤖',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsThinking(false);
    }
  }, [context]);

  const clearHistory = useCallback(() => {
    setMessages([
      {
        role: 'satoshi',
        content: 'Chat gelöscht! Was kann ich für dich tun, Elvis?',
        timestamp: new Date(),
      },
    ]);
  }, []);

  return {
    messages,
    sendMessage,
    isThinking,
    clearHistory,
  };
}
