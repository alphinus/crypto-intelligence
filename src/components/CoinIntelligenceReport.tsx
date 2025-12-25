'use client';

import { useState, useEffect } from 'react';
import {
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  AlertTriangle,
  Sparkles,
  Clock,
  BarChart3,
  MessageCircle,
  Activity,
  Zap,
  ChevronRight,
  FastForward,
} from 'lucide-react';
import type { CoinIntelligenceReport as CoinReport } from '@/lib/groq';
import type { MarketData } from '@/types/news';
import { AnimatedText } from './AnimatedText';

interface CoinIntelligenceReportProps {
  report: CoinReport;
  coin: MarketData;
  onClose: () => void;
}

export function CoinIntelligenceReport({ report, coin, onClose }: CoinIntelligenceReportProps) {
  const [skipAnimation, setSkipAnimation] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);

  // Reset animation when report changes
  useEffect(() => {
    setSkipAnimation(false);
    setAnimationComplete(false);
  }, [report.timestamp]);

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish':
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'bearish':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      default:
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish':
        return <TrendingUp className="w-5 h-5" />;
      case 'bearish':
        return <TrendingDown className="w-5 h-5" />;
      default:
        return <Minus className="w-5 h-5" />;
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 70) return 'text-green-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getTradeTypeColor = (type: string) => {
    switch (type) {
      case 'long':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'short':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const formatPrice = (price: number | 'market') => {
    if (price === 'market') return 'Market';
    return `$${price.toLocaleString()}`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {coin.image && (
                <img src={coin.image} alt={coin.name} className="w-10 h-10 rounded-full" />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold">{coin.name}</h2>
                  <span className="text-sm text-gray-400">{report.symbol}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-white font-medium">
                    ${coin.price.toLocaleString()}
                  </span>
                  <span className={coin.change24h >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!animationComplete && (
                <button
                  onClick={() => setSkipAnimation(true)}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
                  title="Animation überspringen"
                >
                  <FastForward className="w-3 h-3" />
                  <span className="hidden sm:inline">Skip</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {/* Sentiment & Confidence */}
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${getSentimentColor(report.overallSentiment)}`}>
              {getSentimentIcon(report.overallSentiment)}
              <span className="font-medium uppercase">{report.overallSentiment}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Konfidenz:</span>
              <span className={`text-lg font-bold ${getConfidenceColor(report.confidenceScore)}`}>
                {report.confidenceScore}%
              </span>
            </div>
          </div>

          {/* Summary - Animated */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <AnimatedText
              text={report.summary}
              speed={35}
              delay={300}
              skip={skipAnimation}
              onComplete={() => setAnimationComplete(true)}
              className="text-gray-300 leading-relaxed"
              showCursor={true}
            />
          </div>

          {/* Technical Analysis */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              <h3 className="font-medium">Technische Analyse</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-400">Trend:</span>
                <span className={`ml-2 font-medium ${
                  report.technicalAnalysis.currentTrend === 'bullish' ? 'text-green-400' :
                  report.technicalAnalysis.currentTrend === 'bearish' ? 'text-red-400' : 'text-yellow-400'
                }`}>
                  {report.technicalAnalysis.currentTrend}
                </span>
                <span className="text-gray-500 ml-1">
                  ({report.technicalAnalysis.trendStrength}%)
                </span>
              </div>
              <div>
                <span className="text-gray-400">EMA Signal:</span>
                <span className={`ml-2 font-medium ${
                  report.technicalAnalysis.emaSignal === 'bullish' ? 'text-green-400' :
                  report.technicalAnalysis.emaSignal === 'bearish' ? 'text-red-400' : 'text-yellow-400'
                }`}>
                  {report.technicalAnalysis.emaSignal}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Support:</span>
                <span className="ml-2 text-green-400 font-mono">
                  ${report.technicalAnalysis.keySupport.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Resistance:</span>
                <span className="ml-2 text-red-400 font-mono">
                  ${report.technicalAnalysis.keyResistance.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Timeframe Analysis */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-purple-400" />
              <h3 className="font-medium">Timeframe Analyse</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-gray-400 min-w-[80px]">Kurzfristig:</span>
                <span className="text-gray-300">{report.timeframeAnalysis.shortTerm}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-gray-400 min-w-[80px]">Mittelfristig:</span>
                <span className="text-gray-300">{report.timeframeAnalysis.mediumTerm}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-gray-400 min-w-[80px]">Langfristig:</span>
                <span className="text-gray-300">{report.timeframeAnalysis.longTerm}</span>
              </div>
              <div className="flex items-start gap-2 pt-2 border-t border-gray-700">
                <span className="text-gray-400 min-w-[80px]">Konfluenz:</span>
                <span className="text-blue-300">{report.timeframeAnalysis.confluence}</span>
              </div>
            </div>
          </div>

          {/* Sentiment Analysis */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="w-4 h-4 text-cyan-400" />
              <h3 className="font-medium">Sentiment Analyse</h3>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="text-center">
                <div className={`text-lg font-bold ${
                  report.sentimentAnalysis.socialScore > 20 ? 'text-green-400' :
                  report.sentimentAnalysis.socialScore < -20 ? 'text-red-400' : 'text-yellow-400'
                }`}>
                  {report.sentimentAnalysis.socialScore > 0 ? '+' : ''}{report.sentimentAnalysis.socialScore}
                </div>
                <div className="text-gray-500 text-xs">Social Score</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-white">
                  {report.sentimentAnalysis.redditMentions}
                </div>
                <div className="text-gray-500 text-xs">Reddit Mentions</div>
              </div>
              <div className="text-center">
                <div className={`text-lg font-bold ${
                  report.sentimentAnalysis.guruConsensus === 'bullish' ? 'text-green-400' :
                  report.sentimentAnalysis.guruConsensus === 'bearish' ? 'text-red-400' : 'text-yellow-400'
                }`}>
                  {report.sentimentAnalysis.guruConsensus}
                </div>
                <div className="text-gray-500 text-xs">Guru Consensus</div>
              </div>
            </div>
          </div>

          {/* Derivatives Analysis (conditional) */}
          {report.derivativesAnalysis && (
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-orange-400" />
                <h3 className="font-medium">Derivate Analyse</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Funding Rate:</span>
                  <span className={`font-mono ${
                    report.derivativesAnalysis.fundingRate > 0.01 ? 'text-red-400' :
                    report.derivativesAnalysis.fundingRate < -0.01 ? 'text-green-400' : 'text-yellow-400'
                  }`}>
                    {(report.derivativesAnalysis.fundingRate * 100).toFixed(4)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Signal:</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    report.derivativesAnalysis.fundingSignal === 'overleveraged_long' ? 'bg-red-500/20 text-red-400' :
                    report.derivativesAnalysis.fundingSignal === 'overleveraged_short' ? 'bg-green-500/20 text-green-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {report.derivativesAnalysis.fundingSignal.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-gray-300 text-xs mt-2">{report.derivativesAnalysis.interpretation}</p>
              </div>
            </div>
          )}

          {/* On-Chain Analysis (conditional, BTC only) */}
          {report.onChainAnalysis && (
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-yellow-400" />
                <h3 className="font-medium">On-Chain Analyse (BTC)</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-gray-400 min-w-[100px]">Netzwerk:</span>
                  <span className="text-gray-300">{report.onChainAnalysis.networkHealth}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-gray-400 min-w-[100px]">Mempool:</span>
                  <span className="text-gray-300">{report.onChainAnalysis.mempoolStatus}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-gray-400 min-w-[100px]">Gebühren:</span>
                  <span className="text-gray-300">{report.onChainAnalysis.feeLevel}</span>
                </div>
              </div>
            </div>
          )}

          {/* Trade Recommendation */}
          <div className={`rounded-lg p-4 border ${getTradeTypeColor(report.tradeRecommendation.type)}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                <h3 className="font-medium">Trade Empfehlung</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${getTradeTypeColor(report.tradeRecommendation.type)}`}>
                  {report.tradeRecommendation.type}
                </span>
                <span className={`px-2 py-1 rounded text-xs ${
                  report.tradeRecommendation.confidence === 'high' ? 'bg-green-500/20 text-green-400' :
                  report.tradeRecommendation.confidence === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {report.tradeRecommendation.confidence}
                </span>
              </div>
            </div>

            {report.tradeRecommendation.type !== 'wait' && (
              <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                <div>
                  <span className="text-gray-400">Entry:</span>
                  <span className="ml-2 font-mono text-white">
                    {formatPrice(report.tradeRecommendation.entry)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Stop Loss:</span>
                  <span className="ml-2 font-mono text-red-400">
                    ${report.tradeRecommendation.stopLoss.toLocaleString()}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-400">Take Profit:</span>
                  <span className="ml-2 font-mono text-green-400">
                    {report.tradeRecommendation.takeProfit.map(tp => `$${tp.toLocaleString()}`).join(' → ')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">R/R:</span>
                  <span className="ml-2 font-bold text-blue-400">
                    1:{report.tradeRecommendation.riskReward.toFixed(1)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Timeframe:</span>
                  <span className="ml-2 text-white">
                    {report.tradeRecommendation.bestTimeframe}
                  </span>
                </div>
              </div>
            )}

            <p className="text-sm text-gray-300">{report.tradeRecommendation.reasoning}</p>
          </div>

          {/* Risk Factors & Catalysts */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <h4 className="font-medium text-red-400 text-sm">Risiken</h4>
              </div>
              <ul className="space-y-1">
                {report.riskFactors.map((risk, i) => (
                  <li key={i} className="text-xs text-gray-400 flex items-start gap-1">
                    <ChevronRight className="w-3 h-3 mt-0.5 text-red-400 flex-shrink-0" />
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-green-400" />
                <h4 className="font-medium text-green-400 text-sm">Katalysatoren</h4>
              </div>
              <ul className="space-y-1">
                {report.catalysts.map((catalyst, i) => (
                  <li key={i} className="text-xs text-gray-400 flex items-start gap-1">
                    <ChevronRight className="w-3 h-3 mt-0.5 text-green-400 flex-shrink-0" />
                    {catalyst}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Timestamp */}
          <div className="text-center text-[10px] text-gray-600">
            Generiert: {new Date(report.timestamp).toLocaleString('de-DE')}
          </div>
        </div>
      </div>
    </div>
  );
}
