'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  X,
  TrendingUp,
  TrendingDown,
  BarChart3,
  DollarSign,
  Activity,
  LineChart,
  Target,
  Layers,
  Shield,
  Zap,
} from 'lucide-react';
import LightweightChart from './LightweightChart';
import type { MarketData } from '@/types/news';
import type { Kline, Interval } from '@/lib/binance-klines';
import type { TimeframeTechnicalLevels } from '@/lib/technical-levels';
import type { TimeframeTradeSetup, MultiTimeframeRecommendations } from '@/lib/groq';

interface CoinDetailModalProps {
  coin: MarketData;
  onClose: () => void;
  tradeRecommendations?: Record<string, TimeframeTradeSetup | null>;
}


function formatPrice(price: number): string {
  if (price >= 1000) {
    return price.toLocaleString('de-DE', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  } else if (price >= 1) {
    return price.toLocaleString('de-DE', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  } else if (price >= 0.01) {
    return price.toLocaleString('de-DE', { style: 'currency', currency: 'USD', minimumFractionDigits: 4, maximumFractionDigits: 4 });
  } else {
    return price.toLocaleString('de-DE', { style: 'currency', currency: 'USD', minimumFractionDigits: 6, maximumFractionDigits: 8 });
  }
}

function formatMarketCap(value: number): string {
  if (value >= 1e12) {
    return `$${(value / 1e12).toFixed(2)}T`;
  } else if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`;
  } else if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`;
  }
  return `$${value.toLocaleString('de-DE')}`;
}

function formatVolume(value: number): string {
  if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`;
  } else if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`;
  } else if (value >= 1e3) {
    return `$${(value / 1e3).toFixed(2)}K`;
  }
  return `$${value.toLocaleString('de-DE')}`;
}

const PERSONAS = [
  { id: 'scalper', name: 'Scalper', interval: '5m' as Interval, icon: <Zap className="w-4 h-4" />, description: 'Schnelle Moves' },
  { id: 'daytrader', name: 'Day-Trader', interval: '1h' as Interval, icon: <Activity className="w-4 h-4" />, description: 'Intraday Fokus' },
  { id: 'swingtrader', name: 'Swing-Trader', interval: '4h' as Interval, icon: <TrendingUp className="w-4 h-4" />, description: 'Mehrtägig' },
  { id: 'positiontrader', name: 'Position', interval: '1d' as Interval, icon: <Shield className="w-4 h-4" />, description: 'Langfristig' },
];

const INTERVALS: Interval[] = ['5m', '15m', '1h', '4h', '1d'];
const INTERVAL_LABELS: Record<Interval, string> = {
  '1m': '1M', '3m': '3M', '5m': '5M', '15m': '15M', '30m': '30M',
  '1h': '1H', '4h': '4H', '1d': '1D', '1w': '1W',
};

const TRADING_STYLE_LABELS: Record<string, string> = {
  scalping: 'Scalping',
  intraday: 'Intraday',
  swing: 'Swing',
  position: 'Position',
};

export function CoinDetailModal({ coin, onClose, tradeRecommendations }: CoinDetailModalProps) {
  const [selectedPersonaId, setSelectedPersonaId] = useState('daytrader');
  const activePersona = PERSONAS.find(p => p.id === selectedPersonaId) || PERSONAS[1];
  const selectedInterval = activePersona.interval;

  // Level-Chart State
  const [klines, setKlines] = useState<Kline[]>([]);
  const [levels, setLevels] = useState<TimeframeTechnicalLevels | null>(null);
  const [loadingLevels, setLoadingLevels] = useState(false);

  const isPositive = coin.change24h >= 0;

  // Daten für Level-Chart laden
  const fetchLevelData = useCallback(async (interval: Interval) => {
    setLoadingLevels(true);
    try {
      const res = await fetch(`/api/coin-analysis?symbol=${coin.symbol}&timeframe=${interval}`);
      const data = await res.json();
      if (data.success) {
        setKlines(data.klines);
        setLevels(data.levels);
      }
    } catch (err) {
      console.error('Error fetching level data:', err);
    } finally {
      setLoadingLevels(false);
    }
  }, [coin.symbol]);

  // Daten laden wenn Persona (Interval) sich ändert
  useEffect(() => {
    fetchLevelData(selectedInterval);
  }, [selectedInterval, fetchLevelData]);


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm dark:bg-black/80">
      <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <img
              src={coin.image}
              alt={coin.name}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{coin.name}</h2>
                <span className="px-2 py-0.5 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded">
                  {coin.symbol.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatPrice(coin.price)}
                </span>
                <span
                  className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-green-400' : 'text-red-400'
                    }`}
                >
                  {isPositive ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {isPositive ? '+' : ''}
                  {coin.change24h.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
              <DollarSign className="w-3.5 h-3.5" />
              Marktkapitalisierung
            </div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatMarketCap(coin.marketCap)}
            </div>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
              <Activity className="w-3.5 h-3.5" />
              24h Volumen
            </div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatVolume(coin.volume24h)}
            </div>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
              <BarChart3 className="w-3.5 h-3.5" />
              Vol/MCap Ratio
            </div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {coin.marketCap > 0 ? `${((coin.volume24h / coin.marketCap) * 100).toFixed(2)}%` : '-'}
            </div>
          </div>
        </div>

        {/* Persona Selector Navigation */}
        <div className="flex items-center gap-1 p-4 border-b border-gray-200 dark:border-gray-800 overflow-x-auto no-scrollbar">
          {PERSONAS.map((persona) => (
            <button
              key={persona.id}
              onClick={() => setSelectedPersonaId(persona.id)}
              className={`flex flex-col items-center min-w-[120px] p-2 rounded-lg transition-all ${selectedPersonaId === persona.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {persona.icon}
                <span className="text-sm font-bold">{persona.name}</span>
              </div>
              <span className="text-[10px] opacity-70">{persona.description}</span>
            </button>
          ))}

          <div className="ml-auto flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
            <LineChart className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs font-mono text-gray-500">{INTERVAL_LABELS[selectedInterval]}</span>
          </div>
        </div>

        {/* Central Cockpit Content */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900/50">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Chart Column (75%) */}
            <div className="lg:col-span-3 space-y-4">
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
                <div className="p-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 flex justify-between items-center text-[10px] text-gray-400">
                  <span className="font-mono uppercase">{coin.symbol} / USDT • {activePersona.name} View</span>
                  <span className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Live Data
                  </span>
                </div>
                {loadingLevels ? (
                  <div className="h-[450px] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <LightweightChart
                    symbol={coin.symbol}
                    interval={selectedInterval}
                    klines={klines}
                    technicalLevels={levels || undefined}
                    tradeSetup={tradeRecommendations?.[selectedInterval] || null}
                    height={450}
                    showLevels={true}
                    showFibonacci={true}
                    showTradeSetup={true}
                    theme="dark"
                  />
                )}
              </div>
            </div>

            {/* Trading Sidebar (25%) */}
            <div className="space-y-4 lg:col-span-1">
              {/* 1. Active Trade Setup for Persona */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                <div className="p-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <Target className="w-3.5 h-3.5" />
                    Persona Setup
                  </h3>
                </div>

                <div className="p-4">
                  {tradeRecommendations?.[selectedInterval] ? (
                    (() => {
                      const setup = tradeRecommendations[selectedInterval]!;
                      return (
                        <div className="space-y-4">
                          <div className={`p-3 rounded-lg text-center ${setup.type === 'long' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                            setup.type === 'short' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                              'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                            }`}>
                            <div className="text-xl font-black">{setup.type.toUpperCase()}</div>
                            <div className="text-[10px] font-bold tracking-widest mt-1">
                              {setup.source} • {setup.confidence.toUpperCase()}
                            </div>
                          </div>

                          {setup.type !== 'wait' && (
                            <div className="grid grid-cols-2 gap-2">
                              <div className="bg-gray-50 dark:bg-gray-900/50 p-2 rounded border border-gray-100 dark:border-gray-800">
                                <div className="text-[10px] text-gray-500 mb-1 uppercase">Entry</div>
                                <div className="text-sm font-mono font-bold text-yellow-500">
                                  {typeof setup.entry === 'number' ? `$${setup.entry.toLocaleString()}` : 'Market'}
                                </div>
                              </div>
                              <div className="bg-gray-50 dark:bg-gray-900/50 p-2 rounded border border-gray-100 dark:border-gray-800">
                                <div className="text-[10px] text-gray-500 mb-1 uppercase">R:R Ratio</div>
                                <div className="text-sm font-mono font-bold text-blue-400">1:{setup.riskReward.toFixed(1)}</div>
                              </div>
                              <div className="bg-gray-50 dark:bg-gray-900/50 p-2 rounded border border-gray-100 dark:border-gray-800">
                                <div className="text-[10px] text-red-500 mb-1 uppercase">Stop Loss</div>
                                <div className="text-sm font-mono font-bold text-red-500">${setup.stopLoss.toLocaleString()}</div>
                              </div>
                              <div className="bg-gray-50 dark:bg-gray-900/50 p-2 rounded border border-gray-100 dark:border-gray-800">
                                <div className="text-[10px] text-green-500 mb-1 uppercase">Take Profit</div>
                                <div className="text-sm font-mono font-bold text-green-500">${setup.takeProfit[0]?.toLocaleString()}</div>
                              </div>
                            </div>
                          )}

                          <div className="text-[11px] text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/30 p-2 rounded italic leading-relaxed">
                            "{setup.reasoning}"
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="text-center py-6">
                      <div className="animate-pulse flex flex-col items-center gap-2">
                        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                        <div className="text-xs text-gray-400">Generiere Empfehlung...</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Key Levels Container */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                <div className="p-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5" />
                    S/R Intelligence
                  </h3>
                </div>
                <div className="p-3 space-y-3">
                  {levels ? (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-center p-2 bg-green-500/5 rounded border border-green-500/10">
                          <div className="text-[9px] text-green-500 uppercase font-bold mb-1">Support</div>
                          <div className="text-sm font-mono font-bold text-green-400">${levels.keySupport?.toLocaleString() || '-'}</div>
                        </div>
                        <div className="text-center p-2 bg-red-500/5 rounded border border-red-500/10">
                          <div className="text-[9px] text-red-500 uppercase font-bold mb-1">Resistance</div>
                          <div className="text-sm font-mono font-bold text-red-400">${levels.keyResistance?.toLocaleString() || '-'}</div>
                        </div>
                      </div>

                      {levels.fibonacci.length > 0 && (
                        <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
                          <div className="text-[10px] text-gray-400 mb-2 font-bold uppercase tracking-tighter">Golden Fib Levels</div>
                          <div className="space-y-1.5">
                            {levels.fibonacci
                              .filter(f => [0.382, 0.5, 0.618].includes(f.ratio))
                              .map((f, i) => (
                                <div key={i} className="flex justify-between items-center bg-blue-500/5 p-1.5 rounded">
                                  <span className="text-[10px] text-blue-400 font-bold">{f.label}</span>
                                  <span className="text-xs font-mono text-gray-600 dark:text-gray-300">
                                    ${f.price.toLocaleString()}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-4 text-gray-400 text-xs">Berechne Level...</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
          <p className="text-xs text-gray-500 text-center">
            Chart powered by TradingView. Daten zu Informationszwecken - keine Anlageberatung.
          </p>
        </div>
      </div>
    </div>
  );
}
