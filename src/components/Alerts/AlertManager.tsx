'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Brain,
  Volume2,
  VolumeX,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { PriceAlert, NewPriceAlert, AlertFormState } from '@/types/alerts';
import { DEFAULT_ALERT_FORM } from '@/types/alerts';

interface AlertManagerProps {
  alerts: PriceAlert[];
  onAddAlert: (alert: NewPriceAlert) => void;
  onRemoveAlert: (id: string) => void;
  onToggleAlert: (id: string) => void;
  currentSymbol?: string;
  currentPrice?: number;
}

const TIMEFRAMES = ['5m', '15m', '1h', '4h', '1d'];
const POPULAR_COINS = ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'ADA'];

export function AlertManager({
  alerts,
  onAddAlert,
  onRemoveAlert,
  onToggleAlert,
  currentSymbol = 'BTC',
  currentPrice = 0,
}: AlertManagerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [form, setForm] = useState<AlertFormState>({
    ...DEFAULT_ALERT_FORM,
    symbol: currentSymbol,
    targetPrice: currentPrice > 0 ? currentPrice.toString() : '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newAlert: NewPriceAlert = {
      type: form.type,
      symbol: form.symbol.toUpperCase(),
      enabled: true,
      soundEnabled: form.soundEnabled,
    };

    // Add type-specific fields
    if (form.type === 'price') {
      const price = parseFloat(form.targetPrice);
      if (isNaN(price) || price <= 0) return;
      newAlert.targetPrice = price;
      newAlert.condition = form.condition;
    } else if (form.type === 'signal') {
      newAlert.signalType = form.signalType;
      newAlert.timeframe = form.timeframe;
    } else if (form.type === 'sentiment') {
      newAlert.sentimentCondition = form.sentimentCondition;
    }

    onAddAlert(newAlert);

    // Reset form
    setForm({
      ...DEFAULT_ALERT_FORM,
      symbol: currentSymbol,
      targetPrice: '',
    });
  };

  const formatAlertDescription = (alert: PriceAlert): string => {
    switch (alert.type) {
      case 'price':
        return `${alert.condition === 'above' ? '>' : '<'} $${alert.targetPrice?.toLocaleString()}`;
      case 'signal':
        return `${alert.signalType?.toUpperCase()} auf ${alert.timeframe}`;
      case 'sentiment':
        return alert.sentimentCondition === 'fear' ? 'Bei Fear' : alert.sentimentCondition === 'greed' ? 'Bei Greed' : 'Bei Konflikt';
      default:
        return '';
    }
  };

  const activeCount = alerts.filter((a) => a.enabled).length;

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-800/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-yellow-400" />
          <span className="font-medium">Price Alerts</span>
          {activeCount > 0 && (
            <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
              {activeCount} aktiv
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 border-t border-gray-800">
              {/* New Alert Form */}
              <form onSubmit={handleSubmit} className="mb-4">
                <div className="text-xs text-gray-400 mb-2">Neuen Alert erstellen:</div>

                {/* Alert Type Tabs */}
                <div className="flex gap-1 mb-3">
                  {(['price', 'signal', 'sentiment'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setForm({ ...form, type })}
                      className={`flex-1 px-3 py-1.5 text-xs rounded transition-colors ${
                        form.type === type
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                      }`}
                    >
                      {type === 'price' && 'Preis'}
                      {type === 'signal' && 'Signal'}
                      {type === 'sentiment' && 'Sentiment'}
                    </button>
                  ))}
                </div>

                {/* Coin Selection */}
                <div className="flex gap-2 mb-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={form.symbol}
                      onChange={(e) => setForm({ ...form, symbol: e.target.value.toUpperCase() })}
                      placeholder="Symbol (z.B. BTC)"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-blue-500"
                      maxLength={10}
                    />
                  </div>
                  <div className="flex gap-1">
                    {POPULAR_COINS.slice(0, 3).map((coin) => (
                      <button
                        key={coin}
                        type="button"
                        onClick={() => setForm({ ...form, symbol: coin })}
                        className={`px-2 py-1 text-xs rounded ${
                          form.symbol === coin
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                        }`}
                      >
                        {coin}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Type-specific fields */}
                {form.type === 'price' && (
                  <div className="flex gap-2 mb-3">
                    <select
                      value={form.condition}
                      onChange={(e) => setForm({ ...form, condition: e.target.value as 'above' | 'below' })}
                      className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value="above">Über</option>
                      <option value="below">Unter</option>
                    </select>
                    <div className="flex-1 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                      <input
                        type="number"
                        value={form.targetPrice}
                        onChange={(e) => setForm({ ...form, targetPrice: e.target.value })}
                        placeholder="Zielpreis"
                        className="w-full pl-7 pr-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-blue-500"
                        step="any"
                        min="0"
                      />
                    </div>
                  </div>
                )}

                {form.type === 'signal' && (
                  <div className="flex gap-2 mb-3">
                    <select
                      value={form.signalType}
                      onChange={(e) => setForm({ ...form, signalType: e.target.value as 'long' | 'short' })}
                      className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value="long">Long Signal</option>
                      <option value="short">Short Signal</option>
                    </select>
                    <select
                      value={form.timeframe}
                      onChange={(e) => setForm({ ...form, timeframe: e.target.value })}
                      className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-blue-500"
                    >
                      {TIMEFRAMES.map((tf) => (
                        <option key={tf} value={tf}>
                          {tf}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {form.type === 'sentiment' && (
                  <div className="mb-3">
                    <select
                      value={form.sentimentCondition}
                      onChange={(e) =>
                        setForm({ ...form, sentimentCondition: e.target.value as 'fear' | 'greed' | 'conflict' })
                      }
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value="fear">Bei Fear (Bearish)</option>
                      <option value="greed">Bei Greed (Bullish)</option>
                      <option value="conflict">Bei Widerspruch Tech/Sentiment</option>
                    </select>
                  </div>
                )}

                {/* Sound toggle and Submit */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, soundEnabled: !form.soundEnabled })}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-xs ${
                      form.soundEnabled
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {form.soundEnabled ? (
                      <Volume2 className="w-3.5 h-3.5" />
                    ) : (
                      <VolumeX className="w-3.5 h-3.5" />
                    )}
                    Sound
                  </button>

                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Alert erstellen
                  </button>
                </div>
              </form>

              {/* Alerts List */}
              {alerts.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs text-gray-400 mb-2">Aktive Alerts ({alerts.length}):</div>
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                        alert.enabled
                          ? 'bg-gray-800/50 border-gray-700'
                          : 'bg-gray-800/20 border-gray-800 opacity-50'
                      }`}
                    >
                      {/* Icon */}
                      <div className="flex-shrink-0">
                        {alert.type === 'price' && (
                          alert.condition === 'above' ? (
                            <TrendingUp className="w-4 h-4 text-green-400" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-400" />
                          )
                        )}
                        {alert.type === 'signal' && (
                          alert.signalType === 'long' ? (
                            <TrendingUp className="w-4 h-4 text-green-400" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-400" />
                          )
                        )}
                        {alert.type === 'sentiment' && (
                          <Brain className="w-4 h-4 text-purple-400" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{alert.symbol}</div>
                        <div className="text-xs text-gray-400">{formatAlertDescription(alert)}</div>
                      </div>

                      {/* Sound indicator */}
                      {alert.soundEnabled ? (
                        <Volume2 className="w-3.5 h-3.5 text-gray-500" />
                      ) : (
                        <VolumeX className="w-3.5 h-3.5 text-gray-600" />
                      )}

                      {/* Toggle */}
                      <button
                        onClick={() => onToggleAlert(alert.id)}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        {alert.enabled ? (
                          <ToggleRight className="w-6 h-6 text-green-400" />
                        ) : (
                          <ToggleLeft className="w-6 h-6" />
                        )}
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => onRemoveAlert(alert.id)}
                        className="text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {alerts.length === 0 && (
                <div className="text-center py-4 text-gray-500 text-sm">
                  Keine Alerts erstellt. Erstelle deinen ersten Alert oben.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
