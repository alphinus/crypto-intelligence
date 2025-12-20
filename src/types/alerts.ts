// Price Alert Types

import type { AlertSoundType } from '@/lib/alert-sound';

export interface PriceAlert {
  id: string;
  type: 'price' | 'signal' | 'sentiment';
  symbol: string;

  // Price alert specific
  targetPrice?: number;
  condition?: 'above' | 'below';

  // Signal alert specific
  signalType?: 'long' | 'short';
  timeframe?: string;

  // Sentiment alert specific
  sentimentCondition?: 'fear' | 'greed' | 'conflict';

  // Common fields
  enabled: boolean;
  createdAt: number;
  triggeredAt?: number;
  soundEnabled: boolean;
  soundType: AlertSoundType;

  // For preventing repeated triggers
  lastTriggeredPrice?: number;
}

export interface AlertNotification {
  id: string;
  alert: PriceAlert;
  currentPrice: number;
  message: string;
  triggeredAt: number;
  dismissed: boolean;
}

// Helper type for creating new alerts
export type NewPriceAlert = Omit<PriceAlert, 'id' | 'createdAt'>;

// Alert form state
export interface AlertFormState {
  type: 'price' | 'signal' | 'sentiment';
  symbol: string;
  targetPrice: string;
  condition: 'above' | 'below';
  signalType: 'long' | 'short';
  timeframe: string;
  sentimentCondition: 'fear' | 'greed' | 'conflict';
  soundEnabled: boolean;
  soundType: AlertSoundType;
}

// Default form values
export const DEFAULT_ALERT_FORM: AlertFormState = {
  type: 'price',
  symbol: 'BTC',
  targetPrice: '',
  condition: 'above',
  signalType: 'long',
  timeframe: '1h',
  sentimentCondition: 'fear',
  soundEnabled: true,
  soundType: 'beep',
};
