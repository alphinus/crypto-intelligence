'use client';

import { useState, useEffect, useCallback } from 'react';
import LightweightChart from './LightweightChart';
import type { Kline, Interval, TimeframeAnalysis } from '@/lib/binance-klines';
import type { TimeframeTechnicalLevels } from '@/lib/technical-levels';
import type { TimeframeTradeSetup, MultiTimeframeRecommendations } from '@/lib/groq';

interface CoinChartProps {
  symbol: string;
  name: string;
  currentPrice: number;
  onClose: () => void;
}

const TIMEFRAMES: Interval[] = ['5m', '15m', '1h', '4h', '1d'];

const TIMEFRAME_LABELS: Record<Interval, string> = {
  '1m': '1M',
  '3m': '3M',
  '5m': '5M',
  '15m': '15M',
  '30m': '30M',
  '1h': '1H',
  '4h': '4H',
  '1d': '1D',
  '1w': '1W',
};

const TRADING_STYLE_LABELS: Record<string, string> = {
  scalping: 'Scalping',
  intraday: 'Intraday',
  swing: 'Swing',
  position: 'Position',
};

export default function CoinChart({ symbol, name, currentPrice, onClose }: CoinChartProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<Interval>('1h');
  const [klines, setKlines] = useState<Kline[]>([]);
  const [levels, setLevels] = useState<TimeframeTechnicalLevels | null>(null);
  const [recommendations, setRecommendations] = useState<MultiTimeframeRecommendations | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Chart Controls
  const [showLevels, setShowLevels] = useState(true);
  const [showFibonacci, setShowFibonacci] = useState(true);
  const [showTradeSetup, setShowTradeSetup] = useState(true);

  // Daten für einzelnen Timeframe laden
  const fetchTimeframeData = useCallback(async (tf: Interval) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/coin-analysis?symbol=${symbol}&timeframe=${tf}`);
      const data = await res.json();

      if (data.success) {
        setKlines(data.klines);
        setLevels(data.levels);
      } else {
        setError('Fehler beim Laden der Daten');
      }
    } catch (err) {
      setError('Netzwerkfehler');
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  // Trade-Empfehlungen für alle Timeframes laden
  const fetchRecommendations = useCallback(async () => {
    setLoadingRecommendations(true);

    try {
      const res = await fetch(`/api/coin-analysis?symbol=${symbol}&full=true`);
      const data = await res.json();

      if (data.success) {
        // Hier würde normalerweise die Groq API für Empfehlungen aufgerufen
        // Für jetzt erstellen wir ein Mock-Objekt basierend auf den Levels
        // Die echte Implementation würde /api/trade-recommendations aufrufen
      }
    } catch (err) {
      console.error('Fehler beim Laden der Empfehlungen:', err);
    } finally {
      setLoadingRecommendations(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetchTimeframeData(selectedTimeframe);
  }, [selectedTimeframe, fetchTimeframeData]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  // Aktuelles Trade Setup für den gewählten Timeframe
  const currentSetup = recommendations?.recommendations?.[selectedTimeframe as keyof typeof recommendations.recommendations];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gray-900 rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">{name}</h2>
              <p className="text-gray-400 text-sm">{symbol.toUpperCase()}/USDT</p>
            </div>
            <div className="text-2xl font-mono text-white">
              ${currentPrice.toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </div>
            {recommendations?.overallBias && (
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                recommendations.overallBias === 'bullish' ? 'bg-green-500/20 text-green-400' :
                recommendations.overallBias === 'bearish' ? 'bg-red-500/20 text-red-400' :
                'bg-gray-500/20 text-gray-400'
              }`}>
                {recommendations.overallBias === 'bullish' ? 'Bullisch' :
                 recommendations.overallBias === 'bearish' ? 'Bärisch' : 'Neutral'}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center gap-2 p-4 border-b border-gray-800">
          <div className="flex bg-gray-800 rounded-lg p-1">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                onClick={() => setSelectedTimeframe(tf)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedTimeframe === tf
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                {TIMEFRAME_LABELS[tf]}
              </button>
            ))}
          </div>

          {/* Toggle Controls */}
          <div className="flex items-center gap-4 ml-auto">
            <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={showLevels}
                onChange={(e) => setShowLevels(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600"
              />
              S/R Level
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={showFibonacci}
                onChange={(e) => setShowFibonacci(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600"
              />
              Fibonacci
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={showTradeSetup}
                onChange={(e) => setShowTradeSetup(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600"
              />
              Trade Setup
            </label>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Chart Area */}
          <div className="flex-1 p-4">
            {loading ? (
              <div className="h-[400px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="h-[400px] flex items-center justify-center text-red-400">
                {error}
              </div>
            ) : (
              <LightweightChart
                symbol={symbol}
                interval={selectedTimeframe}
                klines={klines}
                technicalLevels={levels || undefined}
                tradeSetup={currentSetup || undefined}
                height={400}
                showLevels={showLevels}
                showFibonacci={showFibonacci}
                showTradeSetup={showTradeSetup}
                theme="dark"
              />
            )}
          </div>

          {/* Sidebar - Levels & Trade Info */}
          <div className="w-80 border-l border-gray-800 overflow-y-auto">
            {/* Technical Levels */}
            <div className="p-4 border-b border-gray-800">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">
                Technische Level ({TIMEFRAME_LABELS[selectedTimeframe]})
              </h3>

              {levels ? (
                <div className="space-y-3">
                  {/* Key Levels */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-green-500/10 p-2 rounded">
                      <div className="text-xs text-gray-400">Key Support</div>
                      <div className="text-green-400 font-mono">
                        {levels.keySupport ? `$${levels.keySupport.toLocaleString()}` : '-'}
                      </div>
                    </div>
                    <div className="bg-red-500/10 p-2 rounded">
                      <div className="text-xs text-gray-400">Key Resistance</div>
                      <div className="text-red-400 font-mono">
                        {levels.keyResistance ? `$${levels.keyResistance.toLocaleString()}` : '-'}
                      </div>
                    </div>
                  </div>

                  {/* Support Levels */}
                  {levels.supports.length > 0 && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Support Level</div>
                      {levels.supports.slice(0, 3).map((s, i) => (
                        <div key={i} className="flex items-center justify-between text-sm py-1">
                          <span className="text-green-400 font-mono">${s.price.toLocaleString()}</span>
                          <div className="flex">
                            {[...Array(s.strength)].map((_, j) => (
                              <div key={j} className="w-1.5 h-3 bg-green-500 rounded-full ml-0.5" />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Resistance Levels */}
                  {levels.resistances.length > 0 && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Resistance Level</div>
                      {levels.resistances.slice(0, 3).map((r, i) => (
                        <div key={i} className="flex items-center justify-between text-sm py-1">
                          <span className="text-red-400 font-mono">${r.price.toLocaleString()}</span>
                          <div className="flex">
                            {[...Array(r.strength)].map((_, j) => (
                              <div key={j} className="w-1.5 h-3 bg-red-500 rounded-full ml-0.5" />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Fibonacci */}
                  {levels.fibonacci.length > 0 && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Fibonacci</div>
                      {levels.fibonacci
                        .filter((f) => [0.382, 0.5, 0.618].includes(f.ratio))
                        .map((f, i) => (
                          <div key={i} className="flex items-center justify-between text-sm py-1">
                            <span className="text-gray-400">{f.label}</span>
                            <span className="text-blue-400 font-mono">${f.price.toLocaleString()}</span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-500 text-sm">Keine Level verfügbar</div>
              )}
            </div>

            {/* Trade Setup */}
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">
                Trade-Empfehlung ({TIMEFRAME_LABELS[selectedTimeframe]})
              </h3>

              {currentSetup ? (
                <div className="space-y-3">
                  {/* Trade Type */}
                  <div className={`p-3 rounded-lg ${
                    currentSetup.type === 'long' ? 'bg-green-500/20' :
                    currentSetup.type === 'short' ? 'bg-red-500/20' :
                    'bg-gray-500/20'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-lg font-bold ${
                        currentSetup.type === 'long' ? 'text-green-400' :
                        currentSetup.type === 'short' ? 'text-red-400' :
                        'text-gray-400'
                      }`}>
                        {currentSetup.type === 'long' ? 'LONG' :
                         currentSetup.type === 'short' ? 'SHORT' : 'WAIT'}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        currentSetup.confidence === 'high' ? 'bg-green-600 text-white' :
                        currentSetup.confidence === 'medium' ? 'bg-yellow-600 text-white' :
                        'bg-gray-600 text-white'
                      }`}>
                        {currentSetup.confidence}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {currentSetup.tradingStyle ? TRADING_STYLE_LABELS[currentSetup.tradingStyle] : ''}
                    </div>
                  </div>

                  {currentSetup.type !== 'wait' && (
                    <>
                      {/* Entry/SL/TP */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Entry</span>
                          <span className="text-yellow-400 font-mono">
                            ${typeof currentSetup.entry === 'number' ? currentSetup.entry.toLocaleString() : 'Market'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Stop Loss</span>
                          <span className="text-red-400 font-mono">
                            ${currentSetup.stopLoss.toLocaleString()}
                          </span>
                        </div>
                        {currentSetup.takeProfit.map((tp, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">TP {i + 1}</span>
                            <span className="text-green-400 font-mono">
                              ${tp.toLocaleString()}
                            </span>
                          </div>
                        ))}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Risk/Reward</span>
                          <span className="text-white font-mono">
                            1:{currentSetup.riskReward.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Reasoning */}
                      <div className="text-xs text-gray-400 italic">
                        {currentSetup.reasoning}
                      </div>

                      {/* Confluence Badge */}
                      {currentSetup.confluenceWithOtherTimeframes && (
                        <div className="flex items-center gap-1 text-xs text-blue-400">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Konfluenz mit anderen Timeframes
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="text-gray-500 text-sm">
                  {loadingRecommendations ? 'Lade Empfehlungen...' : 'Keine Empfehlung verfügbar'}
                </div>
              )}
            </div>

            {/* All Timeframe Overview */}
            {recommendations && (
              <div className="p-4 border-t border-gray-800">
                <h3 className="text-sm font-semibold text-gray-400 mb-3">
                  Alle Timeframes
                </h3>
                <div className="space-y-1">
                  {TIMEFRAMES.map((tf) => {
                    const setup = recommendations.recommendations?.[tf as keyof typeof recommendations.recommendations];
                    return (
                      <button
                        key={tf}
                        onClick={() => setSelectedTimeframe(tf)}
                        className={`w-full flex items-center justify-between p-2 rounded text-sm ${
                          selectedTimeframe === tf ? 'bg-blue-600/20' : 'hover:bg-gray-800'
                        }`}
                      >
                        <span className="text-gray-400">{TIMEFRAME_LABELS[tf]}</span>
                        {setup && (
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            setup.type === 'long' ? 'bg-green-500/20 text-green-400' :
                            setup.type === 'short' ? 'bg-red-500/20 text-red-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {setup.type.toUpperCase()}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {recommendations.bestTimeframeForTrade && recommendations.bestTimeframeForTrade !== 'none' && (
                  <div className="mt-3 p-2 bg-blue-500/10 rounded text-xs text-blue-400">
                    Bester Timeframe: <strong>{TIMEFRAME_LABELS[recommendations.bestTimeframeForTrade as Interval]}</strong>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
