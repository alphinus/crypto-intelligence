'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  AlertTriangle,
  Clock,
  Gauge,
  ArrowUpCircle,
  ArrowDownCircle,
  CircleDot,
} from 'lucide-react';
import type { MarketIntelligenceReport, TradeSetup } from '@/lib/groq';
import type { TechnicalLevels } from '@/lib/technical-levels';
import type { MultiTimeframeData } from '@/lib/binance-klines';
import {
  speakText,
  stopSpeaking,
  isSpeaking,
  generateAudioSummary,
  generateSlideAudio,
  isSpeechSupported,
} from '@/lib/speech';

interface PresentationModeProps {
  report: MarketIntelligenceReport;
  technicalLevels?: TechnicalLevels;
  multiTimeframe?: MultiTimeframeData;
  fearGreed?: number;
  topCoins?: Array<{ symbol: string; change24h: number }>;
  onClose: () => void;
}

export function PresentationMode({
  report,
  technicalLevels,
  multiTimeframe,
  fearGreed,
  topCoins,
  onClose,
}: PresentationModeProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isSpeakingNow, setIsSpeakingNow] = useState(false);

  const totalSlides = 5;

  // Navigation functions (defined before useEffect to avoid hoisting issues)
  const nextSlide = useCallback(() => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide((prev) => prev + 1);
    }
  }, [currentSlide]);

  const prevSlide = useCallback(() => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  }, [currentSlide]);

  const toggleAudio = useCallback(() => {
    if (audioEnabled) {
      stopSpeaking();
    }
    setAudioEnabled((prev) => !prev);
  }, [audioEnabled]);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowRight':
        case ' ':
          nextSlide();
          break;
        case 'ArrowLeft':
          prevSlide();
          break;
        case 'a':
          toggleAudio();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide, onClose]);

  // Auto-Play
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setTimeout(() => {
      if (currentSlide < totalSlides - 1) {
        setCurrentSlide((prev) => prev + 1);
      } else {
        setIsPlaying(false);
      }
    }, 10000); // 10 Sekunden pro Slide

    return () => clearTimeout(timer);
  }, [isPlaying, currentSlide]);

  // Audio für aktuellen Slide
  useEffect(() => {
    if (!audioEnabled || !isSpeechSupported()) return;

    // Stoppe vorherige Sprache
    stopSpeaking();

    // Generiere und spreche Slide-Text
    const slideData = {
      sentiment: report.overallSentiment,
      fearGreed,
      topCoins,
      timeframes: multiTimeframe?.timeframes,
      levels: technicalLevels
        ? {
          keySupport: technicalLevels.keySupport,
          keyResistance: technicalLevels.keyResistance,
          currentPrice: technicalLevels.currentPrice,
        }
        : undefined,
      tradeRecommendation: report.tradeRecommendation,
      signals: report.signals,
    };

    const text = generateSlideAudio(currentSlide, slideData);
    if (text) {
      setIsSpeakingNow(true);
      speakText(text, {
        onEnd: () => setIsSpeakingNow(false),
        onError: () => setIsSpeakingNow(false),
      });
    }

    return () => {
      stopSpeaking();
      setIsSpeakingNow(false);
    };
  }, [currentSlide, audioEnabled]);

  const getSentimentIcon = () => {
    switch (report.overallSentiment) {
      case 'bullish':
        return <TrendingUp className="w-16 h-16 text-green-400" />;
      case 'bearish':
        return <TrendingDown className="w-16 h-16 text-red-400" />;
      default:
        return <Minus className="w-16 h-16 text-yellow-400" />;
    }
  };

  const getSentimentColor = () => {
    switch (report.overallSentiment) {
      case 'bullish':
        return 'text-green-400';
      case 'bearish':
        return 'text-red-400';
      default:
        return 'text-yellow-400';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <ArrowUpCircle className="w-8 h-8 text-green-400" />;
      case 'down':
        return <ArrowDownCircle className="w-8 h-8 text-red-400" />;
      default:
        return <CircleDot className="w-8 h-8 text-yellow-400" />;
    }
  };

  // Slides
  const slides = [
    // Slide 1: Marktübersicht
    <div key="overview" className="h-full flex flex-col items-center justify-center text-center p-8">
      <h2 className="text-4xl font-bold mb-8 text-gray-200">Marktübersicht</h2>
      <div className="mb-8">{getSentimentIcon()}</div>
      <div className={`text-6xl font-bold mb-4 ${getSentimentColor()}`}>
        {report.overallSentiment.toUpperCase()}
      </div>
      <div className="text-2xl text-gray-400 mb-8">
        Konfidenz: {report.confidenceScore}%
      </div>

      <div className="grid grid-cols-2 gap-8 mt-8">
        <div className="bg-gray-800/50 rounded-xl p-6">
          <div className="text-gray-400 mb-2">Fear & Greed</div>
          <div className="text-4xl font-bold text-white">{fearGreed || 'N/A'}</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-6">
          <div className="text-gray-400 mb-2">Marktphase</div>
          <div className="text-2xl font-bold text-white">{report.marketPhase}</div>
        </div>
      </div>

      {topCoins && topCoins.length > 0 && (
        <div className="mt-8 flex gap-4">
          {topCoins.slice(0, 5).map((coin) => (
            <div key={coin.symbol} className="bg-gray-800/50 rounded-lg px-4 py-2">
              <div className="text-sm text-gray-400">{coin.symbol.toUpperCase()}</div>
              <div className={coin.change24h >= 0 ? 'text-green-400' : 'text-red-400'}>
                {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(2)}%
              </div>
            </div>
          ))}
        </div>
      )}
    </div>,

    // Slide 2: Timeframe-Analyse
    <div key="timeframes" className="h-full flex flex-col items-center justify-center p-8">
      <h2 className="text-4xl font-bold mb-12 text-gray-200">Timeframe-Analyse</h2>

      {multiTimeframe ? (
        <div className="grid grid-cols-4 gap-8 w-full max-w-4xl">
          {(['15m', '1h', '4h', '1d'] as const).map((tf) => {
            const data = multiTimeframe.timeframes[tf];
            return (
              <div key={tf} className="bg-gray-800/50 rounded-xl p-6 text-center">
                <div className="text-2xl font-bold text-gray-300 mb-4">{tf}</div>
                <div className="mb-4">{getTrendIcon(data.trend)}</div>
                <div className="text-lg text-gray-400 mb-2">
                  {data.trend === 'up' ? 'Aufwärts' : data.trend === 'down' ? 'Abwärts' : 'Seitwärts'}
                </div>
                <div className="mt-4">
                  <div className="text-sm text-gray-500 mb-1">Momentum</div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${data.momentum > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.abs(data.momentum)}%`, marginLeft: data.momentum < 0 ? 'auto' : 0 }}
                    />
                  </div>
                  <div className="text-sm mt-1 text-gray-400">{data.momentum}</div>
                </div>
                <div className={`text-lg mt-4 ${data.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {data.change >= 0 ? '+' : ''}{data.change.toFixed(2)}%
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-gray-500">Timeframe-Daten werden geladen...</div>
      )}

      {report.timeframeAnalysis && (
        <div className="mt-8 bg-gray-800/30 rounded-xl p-6 max-w-2xl">
          <div className="text-lg text-gray-300">
            <strong>Konfluenz:</strong> {report.timeframeAnalysis.confluence}
          </div>
        </div>
      )}
    </div>,

    // Slide 3: Technische Level
    <div key="levels" className="h-full flex flex-col items-center justify-center p-8">
      <h2 className="text-4xl font-bold mb-12 text-gray-200">Technische Level</h2>

      {technicalLevels ? (
        <div className="w-full max-w-2xl">
          {/* Preis-Leiter */}
          <div className="relative bg-gray-800/50 rounded-xl p-8">
            {/* Resistances */}
            <div className="space-y-2 mb-8">
              {technicalLevels.resistances.slice(0, 3).reverse().map((level, i) => (
                <div key={`r-${i}`} className="flex items-center justify-between bg-red-500/10 rounded-lg px-4 py-2">
                  <span className="text-red-400">Resistance {3 - i}</span>
                  <span className="text-xl font-mono text-red-400">${level.price.toLocaleString()}</span>
                </div>
              ))}
            </div>

            {/* Aktueller Preis */}
            <div className="bg-blue-500/20 border-2 border-blue-500 rounded-xl px-6 py-4 mb-8">
              <div className="text-center">
                <div className="text-sm text-blue-400 mb-1">Aktueller Preis</div>
                <div className="text-4xl font-bold text-white">
                  ${technicalLevels.currentPrice.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Supports */}
            <div className="space-y-2">
              {technicalLevels.supports.slice(0, 3).map((level, i) => (
                <div key={`s-${i}`} className="flex items-center justify-between bg-green-500/10 rounded-lg px-4 py-2">
                  <span className="text-green-400">Support {i + 1}</span>
                  <span className="text-xl font-mono text-green-400">${level.price.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Fibonacci */}
          {technicalLevels.fibonacci.length > 0 && (
            <div className="mt-8 grid grid-cols-4 gap-2">
              {technicalLevels.fibonacci
                .filter((f) => [0.382, 0.5, 0.618, 0.786].includes(f.ratio))
                .map((fib) => (
                  <div key={fib.ratio} className="bg-purple-500/10 rounded-lg p-3 text-center">
                    <div className="text-xs text-purple-400">{fib.label}</div>
                    <div className="text-sm font-mono text-white">${fib.price.toLocaleString()}</div>
                  </div>
                ))}
            </div>
          )}

          {/* Psychologische Level */}
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            {technicalLevels.psychological
              .filter((p) => Math.abs(p - technicalLevels.currentPrice) / technicalLevels.currentPrice < 0.1)
              .map((level) => (
                <span key={level} className="px-3 py-1 bg-gray-700 rounded-full text-sm text-gray-300">
                  ${level.toLocaleString()}
                </span>
              ))}
          </div>
        </div>
      ) : (
        <div className="text-gray-500">Level-Daten werden geladen...</div>
      )}
    </div>,

    // Slide 4: Handlungsempfehlung
    <div key="trade" className="h-full flex flex-col items-center justify-center p-8">
      <h2 className="text-4xl font-bold mb-12 text-gray-200">Handlungsempfehlung</h2>

      {report.tradeRecommendation && report.tradeRecommendation.type !== 'wait' ? (
        <div className="w-full max-w-xl">
          <div
            className={`rounded-2xl p-8 ${report.tradeRecommendation.type === 'long'
                ? 'bg-gradient-to-br from-green-900/50 to-green-800/30 border border-green-500/30'
                : 'bg-gradient-to-br from-red-900/50 to-red-800/30 border border-red-500/30'
              }`}
          >
            {/* Trade Type */}
            <div className="text-center mb-8">
              <div
                className={`text-5xl font-bold ${report.tradeRecommendation.type === 'long' ? 'text-green-400' : 'text-red-400'
                  }`}
              >
                {report.tradeRecommendation.type.toUpperCase()}
              </div>
              <div className="text-gray-400 mt-2">
                Konfidenz: <span className="text-white">{report.tradeRecommendation.confidence}</span>
              </div>
            </div>

            {/* Entry/SL/TP */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-black/30 rounded-xl p-4 text-center">
                <div className="text-sm text-gray-400 mb-1">Entry</div>
                <div className="text-xl font-bold text-white">
                  {report.tradeRecommendation.entry === 'market'
                    ? 'Market'
                    : `$${Number(report.tradeRecommendation.entry).toLocaleString()}`}
                </div>
              </div>
              <div className="bg-black/30 rounded-xl p-4 text-center">
                <div className="text-sm text-red-400 mb-1">Stop Loss</div>
                <div className="text-xl font-bold text-red-400">
                  ${report.tradeRecommendation.stopLoss.toLocaleString()}
                </div>
              </div>
              <div className="bg-black/30 rounded-xl p-4 text-center">
                <div className="text-sm text-green-400 mb-1">Take Profit</div>
                <div className="text-xl font-bold text-green-400">
                  ${report.tradeRecommendation.takeProfit[0]?.toLocaleString() || 'N/A'}
                </div>
              </div>
            </div>

            {/* Risk/Reward */}
            <div className="bg-black/30 rounded-xl p-4 text-center mb-6">
              <div className="text-sm text-gray-400 mb-1">Risk/Reward Ratio</div>
              <div className="text-3xl font-bold text-yellow-400">
                1:{report.tradeRecommendation.riskReward.toFixed(1)}
              </div>
            </div>

            {/* Reasoning */}
            <div className="text-center text-gray-300">
              {report.tradeRecommendation.reasoning}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-800 flex items-center justify-center">
            <Clock className="w-12 h-12 text-gray-500" />
          </div>
          <div className="text-3xl font-bold text-gray-400 mb-4">Abwarten</div>
          <div className="text-gray-500 max-w-md">
            Aktuell gibt es kein klares Trade-Setup. Warte auf bessere Gelegenheiten.
          </div>
        </div>
      )}
    </div>,

    // Slide 5: Risiken & Warnungen
    <div key="risks" className="h-full flex flex-col items-center justify-center p-8">
      <h2 className="text-4xl font-bold mb-12 text-gray-200">Risiken & Warnungen</h2>

      <div className="w-full max-w-2xl">
        {/* Risk Level */}
        <div className="bg-gray-800/50 rounded-xl p-6 mb-8 text-center">
          <div className="text-sm text-gray-400 mb-2">Risiko-Level</div>
          <div
            className={`text-4xl font-bold ${report.riskLevel === 'low'
                ? 'text-green-400'
                : report.riskLevel === 'high'
                  ? 'text-red-400'
                  : 'text-yellow-400'
              }`}
          >
            {report.riskLevel === 'low' ? 'NIEDRIG' : report.riskLevel === 'high' ? 'HOCH' : 'MITTEL'}
          </div>
        </div>

        {/* Warnings */}
        <div className="space-y-4 mb-8">
          {report.signals
            .filter((s) => s.type === 'warning')
            .map((signal, i) => (
              <div
                key={i}
                className="flex items-start gap-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4"
              >
                <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-yellow-400">{signal.title}</div>
                  <div className="text-gray-400 text-sm">{signal.description}</div>
                </div>
              </div>
            ))}
          {report.signals.filter((s) => s.type === 'warning').length === 0 && (
            <div className="text-center text-gray-500 py-4">Keine kritischen Warnungen</div>
          )}
        </div>

        {/* Action Items */}
        <div className="bg-gray-800/50 rounded-xl p-6">
          <div className="text-lg font-semibold text-gray-300 mb-4">Zu beachten:</div>
          <ul className="space-y-2">
            {report.actionItems.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-gray-400">
                <Target className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>,
  ];

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <div className="text-gray-400">
          Slide {currentSlide + 1} von {totalSlides}
        </div>

        <div className="flex items-center gap-4">
          {/* Audio Toggle */}
          <button
            onClick={toggleAudio}
            className={`p-2 rounded-lg transition-colors ${audioEnabled ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'
              }`}
            title="Audio (A)"
          >
            {audioEnabled ? (
              <Volume2 className={`w-5 h-5 ${isSpeakingNow ? 'animate-pulse' : ''}`} />
            ) : (
              <VolumeX className="w-5 h-5" />
            )}
          </button>

          {/* Auto-Play Toggle */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-2 rounded-lg transition-colors ${isPlaying ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400'
              }`}
            title="Auto-Play"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400"
            title="Schließen (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Slide Content */}
      <div className="flex-1 overflow-hidden">{slides[currentSlide]}</div>

      {/* Navigation */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800">
        <button
          onClick={prevSlide}
          disabled={currentSlide === 0}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-gray-300"
        >
          <ChevronLeft className="w-5 h-5" />
          Zurück
        </button>

        {/* Slide Indicators */}
        <div className="flex gap-2">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`w-3 h-3 rounded-full transition-colors ${i === currentSlide ? 'bg-blue-500' : 'bg-gray-700 hover:bg-gray-600'
                }`}
            />
          ))}
        </div>

        <button
          onClick={nextSlide}
          disabled={currentSlide === totalSlides - 1}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-gray-300"
        >
          Weiter
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
