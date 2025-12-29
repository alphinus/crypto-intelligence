'use client';

import { useState } from 'react';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  Info,
  Shield,
  Target,
  Zap,
  X,
  Volume2,
  VolumeX,
  Presentation,
  ArrowUpCircle,
  ArrowDownCircle,
} from 'lucide-react';
import type { MarketIntelligenceReport } from '@/lib/groq';
import type { TechnicalLevels } from '@/lib/technical-levels';
import type { MultiTimeframeData } from '@/lib/binance-klines';
import {
  speakText,
  stopSpeaking,
  isSpeaking,
  generateAudioSummary,
  isSpeechSupported,
} from '@/lib/speech';

interface IntelligenceReportProps {
  report: MarketIntelligenceReport;
  technicalLevels?: TechnicalLevels;
  multiTimeframe?: MultiTimeframeData;
  fearGreed?: number;
  topCoins?: Array<{ symbol: string; change24h: number }>;
  onClose: () => void;
  onOpenPresentation?: () => void;
}

export function IntelligenceReport({
  report,
  technicalLevels,
  multiTimeframe,
  fearGreed,
  topCoins,
  onClose,
  onOpenPresentation,
}: IntelligenceReportProps) {
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  const handleAudioToggle = () => {
    if (isAudioPlaying) {
      stopSpeaking();
      setIsAudioPlaying(false);
    } else {
      const text = generateAudioSummary(report);
      speakText(text, {
        onEnd: () => setIsAudioPlaying(false),
        onError: () => setIsAudioPlaying(false),
      });
      setIsAudioPlaying(true);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish':
        return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'bearish':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      default:
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'text-green-400';
      case 'high':
        return 'text-red-400';
      default:
        return 'text-yellow-400';
    }
  };

  const getSignalIcon = (type: string) => {
    switch (type) {
      case 'opportunity':
        return <Lightbulb className="w-4 h-4 text-green-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      default:
        return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  const getSignalBg = (type: string) => {
    switch (type) {
      case 'opportunity':
        return 'bg-green-500/10 border-green-500/20';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/20';
      default:
        return 'bg-blue-500/10 border-blue-500/20';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm dark:bg-black/80">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Market Intelligence Report</h2>
              <p className="text-xs text-gray-500">
                {new Date(report.timestamp).toLocaleString('de-DE')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Audio Button */}
            {isSpeechSupported() && (
              <button
                onClick={handleAudioToggle}
                className={`p-2 rounded-lg transition-colors ${isAudioPlaying
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                title="Audio abspielen"
              >
                {isAudioPlaying ? (
                  <Volume2 className="w-5 h-5 animate-pulse" />
                ) : (
                  <VolumeX className="w-5 h-5" />
                )}
              </button>
            )}

            {/* Präsentation Button */}
            {onOpenPresentation && (
              <button
                onClick={onOpenPresentation}
                className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="Präsentation starten"
              >
                <Presentation className="w-5 h-5" />
              </button>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Sentiment & Confidence */}
          <div className="grid grid-cols-3 gap-3">
            <div
              className={`p-3 rounded-lg border ${getSentimentColor(report.overallSentiment)}`}
            >
              <div className="flex items-center gap-2 mb-1">
                {report.overallSentiment === 'bullish' ? (
                  <TrendingUp className="w-4 h-4" />
                ) : report.overallSentiment === 'bearish' ? (
                  <TrendingDown className="w-4 h-4" />
                ) : (
                  <Target className="w-4 h-4" />
                )}
                <span className="text-xs font-medium">Sentiment</span>
              </div>
              <div className="text-lg font-bold capitalize">
                {report.overallSentiment}
              </div>
            </div>

            <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center gap-2 mb-1 text-gray-500 dark:text-gray-400">
                <Zap className="w-4 h-4" />
                <span className="text-xs font-medium">Konfidenz</span>
              </div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {report.confidenceScore}%
              </div>
            </div>

            <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center gap-2 mb-1 text-gray-500 dark:text-gray-400">
                <Shield className="w-4 h-4" />
                <span className="text-xs font-medium">Risiko</span>
              </div>
              <div className={`text-lg font-bold capitalize ${getRiskColor(report.riskLevel)}`}>
                {report.riskLevel}
              </div>
            </div>
          </div>

          {/* Market Phase */}
          <div className="p-3 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg">
            <div className="text-xs text-purple-400 mb-1">Marktphase</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{report.marketPhase}</div>
          </div>

          {/* Summary */}
          <div className="p-4 bg-gray-100 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Zusammenfassung</h3>
            <p className="text-gray-900 dark:text-white leading-relaxed">{report.summary}</p>
          </div>

          {/* Signals */}
          {report.signals.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Signale</h3>
              <div className="space-y-2">
                {report.signals.map((signal, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg border ${getSignalBg(signal.type)}`}
                  >
                    <div className="flex items-start gap-2">
                      {getSignalIcon(signal.type)}
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">{signal.title}</div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {signal.description}
                        </p>
                        {signal.relevantCoins.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {signal.relevantCoins.map((coin, j) => (
                              <span
                                key={j}
                                className="text-xs bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded"
                              >
                                {coin}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Narratives */}
          {report.topNarratives.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Aktuelle Narratives
              </h3>
              <div className="flex flex-wrap gap-2">
                {report.topNarratives.map((narrative, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-sm"
                  >
                    {narrative}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Technische Analyse */}
          {report.technicalAnalysis && (
            <div className="p-4 bg-gray-100 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Technische Analyse
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Key Support</div>
                  <div className="text-lg font-mono text-green-400">
                    ${report.technicalAnalysis.keySupport?.toLocaleString() || 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Key Resistance</div>
                  <div className="text-lg font-mono text-red-400">
                    ${report.technicalAnalysis.keyResistance?.toLocaleString() || 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Trend</div>
                  <div className={`text-lg font-semibold ${report.technicalAnalysis.currentTrend === 'bullish' ? 'text-green-400' :
                    report.technicalAnalysis.currentTrend === 'bearish' ? 'text-red-400' : 'text-yellow-400'
                    }`}>
                    {report.technicalAnalysis.currentTrend === 'bullish' ? 'Aufwärts' :
                      report.technicalAnalysis.currentTrend === 'bearish' ? 'Abwärts' : 'Seitwärts'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Trend-Stärke</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${report.technicalAnalysis.trendStrength > 60 ? 'bg-green-500' :
                          report.technicalAnalysis.trendStrength > 40 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                        style={{ width: `${report.technicalAnalysis.trendStrength}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-400">{report.technicalAnalysis.trendStrength}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Timeframe Analyse */}
          {report.timeframeAnalysis && (
            <div className="p-4 bg-gray-100 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Timeframe-Analyse
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Kurzfristig (15m-1h)</div>
                  <div className="text-sm text-gray-300">{report.timeframeAnalysis.shortTerm}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Mittelfristig (4h)</div>
                  <div className="text-sm text-gray-300">{report.timeframeAnalysis.mediumTerm}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Langfristig (Daily)</div>
                  <div className="text-sm text-gray-300">{report.timeframeAnalysis.longTerm}</div>
                </div>
                {report.timeframeAnalysis.confluence && (
                  <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded">
                    <div className="text-xs text-blue-400 mb-1">Konfluenz</div>
                    <div className="text-sm text-gray-900 dark:text-white">{report.timeframeAnalysis.confluence}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Trade Empfehlung */}
          {report.tradeRecommendation && (
            <div className={`p-4 rounded-lg border ${report.tradeRecommendation.type === 'long'
              ? 'bg-green-500/10 border-green-500/30'
              : report.tradeRecommendation.type === 'short'
                ? 'bg-red-500/10 border-red-500/30'
                : 'bg-gray-800/50 border-gray-700'
              }`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Trade-Empfehlung
                </h3>
                <span className={`px-2 py-1 rounded text-xs font-bold ${report.tradeRecommendation.type === 'long'
                  ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400'
                  : report.tradeRecommendation.type === 'short'
                    ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
                    : 'bg-gray-100 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300'
                  }`}>
                  {report.tradeRecommendation.type === 'long' ? 'LONG' :
                    report.tradeRecommendation.type === 'short' ? 'SHORT' : 'ABWARTEN'}
                </span>
              </div>

              {report.tradeRecommendation.type !== 'wait' && (
                <>
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Entry</div>
                      <div className="text-sm font-mono text-gray-900 dark:text-white">
                        {report.tradeRecommendation.entry === 'market' ? 'Market' : `$${Number(report.tradeRecommendation.entry).toLocaleString()}`}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-red-400">Stop Loss</div>
                      <div className="text-sm font-mono text-red-400">
                        ${report.tradeRecommendation.stopLoss.toLocaleString()}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-green-400">Take Profit</div>
                      <div className="text-sm font-mono text-green-400">
                        ${report.tradeRecommendation.takeProfit[0]?.toLocaleString() || 'N/A'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-yellow-400">R:R</div>
                      <div className="text-sm font-mono text-yellow-400">
                        1:{report.tradeRecommendation.riskReward?.toFixed(1) || 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-400">
                    {report.tradeRecommendation.reasoning}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-gray-500">Konfidenz:</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${report.tradeRecommendation.confidence === 'high' ? 'bg-green-500/20 text-green-400' :
                      report.tradeRecommendation.confidence === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                      }`}>
                      {report.tradeRecommendation.confidence}
                    </span>
                    <span className="text-xs text-gray-500">Timeframe:</span>
                    <span className="text-xs text-gray-400">{report.tradeRecommendation.timeframe}</span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Action Items */}
          {report.actionItems.length > 0 && (
            <div className="p-4 bg-gray-100 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Handlungsempfehlungen
              </h3>
              <ul className="space-y-2">
                {report.actionItems.map((action, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-900 dark:text-white">
                    <span className="text-blue-400 mt-0.5">•</span>
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
          <p className="text-xs text-gray-500 text-center">
            Dieser Bericht dient nur zu Informationszwecken und stellt keine Anlageberatung dar.
          </p>
        </div>
      </div>
    </div>
  );
}
