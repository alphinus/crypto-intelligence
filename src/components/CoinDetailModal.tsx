'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  X,
  TrendingUp,
  TrendingDown,
  BarChart3,
  DollarSign,
  Activity,
  Clock,
  LineChart,
  Target,
  Layers,
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

// Map CoinGecko IDs to TradingView symbols
const symbolMap: Record<string, string> = {
  bitcoin: 'BINANCE:BTCUSDT',
  ethereum: 'BINANCE:ETHUSDT',
  tether: 'BINANCE:USDTUSD',
  'binance-coin': 'BINANCE:BNBUSDT',
  binancecoin: 'BINANCE:BNBUSDT',
  solana: 'BINANCE:SOLUSDT',
  'usd-coin': 'BINANCE:USDCUSD',
  ripple: 'BINANCE:XRPUSDT',
  cardano: 'BINANCE:ADAUSDT',
  avalanche: 'BINANCE:AVAXUSDT',
  'avalanche-2': 'BINANCE:AVAXUSDT',
  dogecoin: 'BINANCE:DOGEUSDT',
  polkadot: 'BINANCE:DOTUSDT',
  'matic-network': 'BINANCE:MATICUSDT',
  polygon: 'BINANCE:MATICUSDT',
  chainlink: 'BINANCE:LINKUSDT',
  'wrapped-bitcoin': 'BINANCE:WBTCUSDT',
  tron: 'BINANCE:TRXUSDT',
  litecoin: 'BINANCE:LTCUSDT',
  'shiba-inu': 'BINANCE:SHIBUSDT',
  uniswap: 'BINANCE:UNIUSDT',
  cosmos: 'BINANCE:ATOMUSDT',
  stellar: 'BINANCE:XLMUSDT',
  monero: 'BINANCE:XMRUSDT',
  'ethereum-classic': 'BINANCE:ETCUSDT',
  arbitrum: 'BINANCE:ARBUSDT',
  optimism: 'BINANCE:OPUSDT',
  aptos: 'BINANCE:APTUSDT',
  sui: 'BINANCE:SUIUSDT',
  pepe: 'BINANCE:PEPEUSDT',
  render: 'BINANCE:RENDERUSDT',
  'render-token': 'BINANCE:RENDERUSDT',
  near: 'BINANCE:NEARUSDT',
  injective: 'BINANCE:INJUSDT',
  'injective-protocol': 'BINANCE:INJUSDT',
  filecoin: 'BINANCE:FILUSDT',
  'hedera-hashgraph': 'BINANCE:HBARUSDT',
  hedera: 'BINANCE:HBARUSDT',
  'internet-computer': 'BINANCE:ICPUSDT',
  kaspa: 'BINANCE:KASUSDT',
};

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

type TimeframeKey = '1H' | '24H' | '7D' | '30D' | '1Y';
type TabType = 'tradingview' | 'levels' | 'trade';

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
  const [timeframe, setTimeframe] = useState<TimeframeKey>('24H');
  const [activeTab, setActiveTab] = useState<TabType>('levels');
  const [selectedInterval, setSelectedInterval] = useState<Interval>('1h');

  // Level-Chart State
  const [klines, setKlines] = useState<Kline[]>([]);
  const [levels, setLevels] = useState<TimeframeTechnicalLevels | null>(null);
  const [recommendations, setRecommendations] = useState<MultiTimeframeRecommendations | null>(null);
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

  // Beim Tab-Wechsel zu Levels/Trade Daten laden
  useEffect(() => {
    if (activeTab === 'levels' || activeTab === 'trade') {
      fetchLevelData(selectedInterval);
    }
  }, [activeTab, selectedInterval, fetchLevelData]);

  // Get TradingView symbol - try exact match first, then by symbol
  const getTradingViewSymbol = (): string => {
    // Check symbol map with coin name (lowercased)
    const coinId = coin.name.toLowerCase().replace(/\s+/g, '-');
    if (symbolMap[coinId]) {
      return symbolMap[coinId];
    }

    // Fallback: construct from symbol
    const symbol = coin.symbol.toUpperCase();
    return `BINANCE:${symbol}USDT`;
  };

  const tvSymbol = getTradingViewSymbol();

  const timeframes: TimeframeKey[] = ['1H', '24H', '7D', '30D', '1Y'];

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
              {((coin.volume24h / coin.marketCap) * 100).toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-4 p-4 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setActiveTab('tradingview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'tradingview'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
          >
            <BarChart3 className="w-4 h-4" />
            TradingView
          </button>
          <button
            onClick={() => setActiveTab('levels')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'levels'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
          >
            <Layers className="w-4 h-4" />
            Level-Chart
          </button>
          <button
            onClick={() => setActiveTab('trade')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'trade'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
          >
            <Target className="w-4 h-4" />
            Trade-Setup
          </button>

          {/* Timeframe für TradingView */}
          {activeTab === 'tradingview' && (
            <div className="flex items-center gap-2 ml-auto">
              <Clock className="w-4 h-4 text-gray-400" />
              {timeframes.map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${timeframe === tf
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          )}

          {/* Interval für Level-Chart und Trade */}
          {(activeTab === 'levels' || activeTab === 'trade') && (
            <div className="flex items-center gap-1 ml-auto">
              <LineChart className="w-4 h-4 text-gray-400 mr-1" />
              {INTERVALS.map((interval) => (
                <button
                  key={interval}
                  onClick={() => setSelectedInterval(interval)}
                  className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${selectedInterval === interval
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                >
                  {INTERVAL_LABELS[interval]}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {/* Chart Tab */}
          {activeTab === 'tradingview' && (
            <LightweightChart
              symbol={coin.symbol}
              interval={selectedInterval}
              klines={klines}
              height={450}
              showLevels={false}
              showFibonacci={false}
              showTradeSetup={false}
              theme="dark"
            />
          )}

          {/* Level-Chart Tab */}
          {activeTab === 'levels' && (
            <div className="flex gap-4">
              <div className="flex-1">
                {loadingLevels ? (
                  <div className="h-[400px] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <LightweightChart
                    symbol={coin.symbol}
                    interval={selectedInterval}
                    klines={klines}
                    technicalLevels={levels || undefined}
                    height={400}
                    showLevels={true}
                    showFibonacci={true}
                    showTradeSetup={false}
                    theme="dark" // Always dark for charting consistency or wire up dynamic
                  />
                )}
              </div>

              {/* Level Sidebar */}
              <div className="w-64 space-y-4">
                {levels && (
                  <>
                    {/* Key Levels */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                      <h4 className="text-xs text-gray-500 dark:text-gray-400 mb-2">Key Levels</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-sm">Support</span>
                          <span className="text-green-400 font-mono text-sm">
                            {levels.keySupport ? `$${levels.keySupport.toLocaleString()}` : '-'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-sm">Resistance</span>
                          <span className="text-red-400 font-mono text-sm">
                            {levels.keyResistance ? `$${levels.keyResistance.toLocaleString()}` : '-'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* All Supports */}
                    {levels.supports.length > 0 && (
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                        <h4 className="text-xs text-gray-500 dark:text-gray-400 mb-2">Support Level</h4>
                        {levels.supports.slice(0, 4).map((s, i) => (
                          <div key={i} className="flex justify-between items-center py-1">
                            <span className="text-green-400 font-mono text-sm">
                              ${s.price.toLocaleString()}
                            </span>
                            <div className="flex gap-0.5">
                              {[...Array(s.strength)].map((_, j) => (
                                <div key={j} className="w-1.5 h-3 bg-green-500 rounded-full" />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* All Resistances */}
                    {levels.resistances.length > 0 && (
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                        <h4 className="text-xs text-gray-500 dark:text-gray-400 mb-2">Resistance Level</h4>
                        {levels.resistances.slice(0, 4).map((r, i) => (
                          <div key={i} className="flex justify-between items-center py-1">
                            <span className="text-red-400 font-mono text-sm">
                              ${r.price.toLocaleString()}
                            </span>
                            <div className="flex gap-0.5">
                              {[...Array(r.strength)].map((_, j) => (
                                <div key={j} className="w-1.5 h-3 bg-red-500 rounded-full" />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Fibonacci */}
                    {levels.fibonacci.length > 0 && (
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                        <h4 className="text-xs text-gray-500 dark:text-gray-400 mb-2">Fibonacci</h4>
                        {levels.fibonacci
                          .filter((f) => [0.236, 0.382, 0.5, 0.618, 0.786].includes(f.ratio))
                          .map((f, i) => (
                            <div key={i} className="flex justify-between items-center py-1">
                              <span className="text-gray-400 text-xs">{f.label}</span>
                              <span className="text-blue-400 font-mono text-sm">
                                ${f.price.toLocaleString()}
                              </span>
                            </div>
                          ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Trade-Setup Tab */}
          {activeTab === 'trade' && (
            <div className="grid grid-cols-7 gap-3">
              {INTERVALS.map((interval) => {
                const setup = tradeRecommendations?.[interval];
                const isSelected = selectedInterval === interval;

                return (
                  <div
                    key={interval}
                    onClick={() => setSelectedInterval(interval)}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${isSelected ? 'bg-blue-600/20 border-2 border-blue-500' : 'bg-gray-100 dark:bg-gray-800/50 border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-600'
                      }`}
                  >
                    <div className="text-center mb-2">
                      <div className="text-base font-bold text-gray-900 dark:text-white">{INTERVAL_LABELS[interval]}</div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400">
                        {interval === '1m' || interval === '3m' ? 'Scalping' :
                          interval === '5m' ? 'Scalping' :
                            interval === '15m' ? 'Intraday' :
                              interval === '1h' ? 'Swing' :
                                interval === '4h' ? 'Position' : 'Trend'}
                      </div>
                    </div>

                    {setup ? (
                      <>
                        <div className={`text-center py-1.5 rounded-lg mb-2 ${setup.type === 'long' ? 'bg-green-500/20 text-green-400' :
                          setup.type === 'short' ? 'bg-red-500/20 text-red-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                          <div className="font-bold text-sm uppercase">{setup.type}</div>
                          <div className="flex flex-col items-center gap-0.5 mt-0.5">
                            <div className="text-[10px] opacity-80">{setup.confidence.toUpperCase()} CONFIDENCE</div>
                            {setup.source && (
                              <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${setup.source === 'HYBRID' ? 'bg-purple-500/20 border-purple-500/50 text-purple-400' :
                                setup.source === 'AI_FUSION' ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' :
                                  setup.source === 'INDICATOR' ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' :
                                    'bg-gray-500/20 border-gray-500/50 text-gray-400'
                                }`}>
                                {setup.source}
                              </div>
                            )}
                          </div>
                        </div>

                        {setup.type !== 'wait' && (
                          <div className="space-y-0.5 text-[10px]">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Entry</span>
                              <span className="text-yellow-400 font-mono">
                                {typeof setup.entry === 'number' ? `$${setup.entry.toLocaleString()}` : 'Mkt'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">SL</span>
                              <span className="text-red-400 font-mono">${setup.stopLoss.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">TP</span>
                              <span className="text-green-400 font-mono">${setup.takeProfit[0]?.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500 dark:text-gray-400">RR</span>
                              <span className="text-gray-900 dark:text-white font-mono">1:{setup.riskReward.toFixed(1)}</span>
                            </div>
                          </div>
                        )}

                        {setup.confluenceWithOtherTimeframes && (
                          <div className="mt-1 text-[10px] text-blue-400 flex items-center justify-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            MTF
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-3 text-gray-500 text-xs">
                        Keine Daten
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
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
