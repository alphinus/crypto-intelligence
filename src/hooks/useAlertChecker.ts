'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { PriceAlert } from '@/types/alerts';
import type { TimeframeTradeSetup } from '@/lib/groq';
import { playAlertSound, playUrgentAlertSound } from '@/lib/alert-sound';

interface SentimentSignal {
  direction: 'bullish' | 'bearish' | 'neutral';
  score: number;
  confidence: 'high' | 'medium' | 'low';
}

interface AlertTriggerInfo {
  alert: PriceAlert;
  currentPrice: number;
  message: string;
}

// Cooldown between same alert triggers (5 minutes)
const ALERT_COOLDOWN_MS = 5 * 60 * 1000;

export function useAlertChecker(
  alerts: PriceAlert[],
  currentPrice: number,
  symbol: string,
  tradeRecommendations: Record<string, TimeframeTradeSetup | null>,
  sentimentSignal: SentimentSignal | null,
  onTrigger: (info: AlertTriggerInfo) => void
) {
  // Track which alerts have been triggered recently
  const triggeredAlertsRef = useRef<Map<string, number>>(new Map());
  // Track previous values to detect changes
  const prevValuesRef = useRef<{
    price: number;
    recommendations: Record<string, string>;
    sentiment: string | null;
  }>({
    price: 0,
    recommendations: {},
    sentiment: null,
  });

  const checkAlert = useCallback(
    (alert: PriceAlert): AlertTriggerInfo | null => {
      // Skip disabled alerts
      if (!alert.enabled) return null;

      // Skip if wrong symbol
      if (alert.symbol.toUpperCase() !== symbol.toUpperCase()) return null;

      // Check cooldown
      const lastTriggered = triggeredAlertsRef.current.get(alert.id);
      if (lastTriggered && Date.now() - lastTriggered < ALERT_COOLDOWN_MS) {
        return null;
      }

      // Check by alert type
      switch (alert.type) {
        case 'price': {
          if (!alert.targetPrice || currentPrice <= 0) return null;

          const wasAbove = prevValuesRef.current.price > alert.targetPrice;
          const wasBelow = prevValuesRef.current.price < alert.targetPrice;
          const isAbove = currentPrice >= alert.targetPrice;
          const isBelow = currentPrice <= alert.targetPrice;

          // Crossed above
          if (alert.condition === 'above' && isAbove && wasBelow) {
            return {
              alert,
              currentPrice,
              message: `${symbol.toUpperCase()} hat $${alert.targetPrice.toLocaleString()} überschritten!`,
            };
          }

          // Crossed below
          if (alert.condition === 'below' && isBelow && wasAbove) {
            return {
              alert,
              currentPrice,
              message: `${symbol.toUpperCase()} ist unter $${alert.targetPrice.toLocaleString()} gefallen!`,
            };
          }
          break;
        }

        case 'signal': {
          if (!alert.timeframe || !alert.signalType) return null;

          const rec = tradeRecommendations[alert.timeframe];
          const prevRec = prevValuesRef.current.recommendations[alert.timeframe];

          // Check if signal just appeared (wasn't there before)
          if (rec?.type === alert.signalType && prevRec !== alert.signalType) {
            return {
              alert,
              currentPrice,
              message: `${alert.signalType.toUpperCase()} Signal auf ${alert.timeframe} für ${symbol.toUpperCase()}!`,
            };
          }
          break;
        }

        case 'sentiment': {
          if (!sentimentSignal || !alert.sentimentCondition) return null;

          const prevSentiment = prevValuesRef.current.sentiment;
          const currentSentiment = sentimentSignal.direction;

          // Fear alert (bearish sentiment appeared)
          if (alert.sentimentCondition === 'fear' && currentSentiment === 'bearish' && prevSentiment !== 'bearish') {
            return {
              alert,
              currentPrice,
              message: `Sentiment-Warnung: Markt wird bearish! (Score: ${sentimentSignal.score})`,
            };
          }

          // Greed alert (bullish sentiment appeared)
          if (alert.sentimentCondition === 'greed' && currentSentiment === 'bullish' && prevSentiment !== 'bullish') {
            return {
              alert,
              currentPrice,
              message: `Sentiment-Signal: Markt wird bullish! (Score: ${sentimentSignal.score})`,
            };
          }

          // Conflict detection would need trade direction from recommendations
          // For now, we skip conflict as it requires more context
          break;
        }
      }

      return null;
    },
    [currentPrice, symbol, tradeRecommendations, sentimentSignal]
  );

  // Check all alerts when values change
  useEffect(() => {
    // Skip if no price yet
    if (currentPrice <= 0) return;

    // Skip on first render (no previous values to compare)
    if (prevValuesRef.current.price === 0) {
      // Initialize previous values
      prevValuesRef.current = {
        price: currentPrice,
        recommendations: Object.fromEntries(
          Object.entries(tradeRecommendations).map(([k, v]) => [k, v?.type || 'wait'])
        ),
        sentiment: sentimentSignal?.direction || null,
      };
      return;
    }

    // Check each alert
    for (const alert of alerts) {
      const triggerInfo = checkAlert(alert);
      if (triggerInfo) {
        // Mark as triggered
        triggeredAlertsRef.current.set(alert.id, Date.now());

        // Play sound if enabled
        if (alert.soundEnabled) {
          if (alert.type === 'sentiment') {
            playUrgentAlertSound();
          } else {
            playAlertSound();
          }
        }

        // Notify
        onTrigger(triggerInfo);
      }
    }

    // Update previous values
    prevValuesRef.current = {
      price: currentPrice,
      recommendations: Object.fromEntries(
        Object.entries(tradeRecommendations).map(([k, v]) => [k, v?.type || 'wait'])
      ),
      sentiment: sentimentSignal?.direction || null,
    };
  }, [currentPrice, alerts, checkAlert, onTrigger, tradeRecommendations, sentimentSignal]);

  // Cleanup old triggered entries periodically
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      triggeredAlertsRef.current.forEach((timestamp, id) => {
        if (now - timestamp > ALERT_COOLDOWN_MS) {
          triggeredAlertsRef.current.delete(id);
        }
      });
    }, 60000); // Every minute

    return () => clearInterval(cleanup);
  }, []);
}
