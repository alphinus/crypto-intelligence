'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Clock, Target, CheckCircle2, Loader2, Star, Shield, Scale, AlertTriangle } from 'lucide-react';
import type { TimeframeTradeSetup, TradeScore, HedgeRecommendation } from '@/lib/groq';
import { staggerContainer, staggerItem, fadeInUp, scaleIn } from '@/lib/animations';

interface TimeframeCard {
  timeframe: '1m' | '3m' | '5m' | '15m' | '1h' | '4h' | '1d';
  label: string;
  style: string;
  setup: TimeframeTradeSetup | null;
  hasConfluence?: boolean;
  hidden?: boolean; // Hidden timeframes (kept for potential future use)
}

interface SentimentConflict {
  hasConflict: boolean;
  technicalDirection: 'long' | 'short' | 'wait';
  sentimentDirection: 'bullish' | 'bearish' | 'neutral';
  message: string;
}

interface SentimentSignal {
  direction: 'bullish' | 'bearish' | 'neutral';
  score: number;
  confidence: 'high' | 'medium' | 'low';
}

interface TradeRecommendationsProps {
  recommendations: Record<string, TimeframeTradeSetup | null>;
  scores: Record<string, TradeScore>;
  hedgeRecommendation: HedgeRecommendation | null;
  currentPrice: number;
  coinSymbol: string;
  coinImage?: string;
  loading?: boolean;
  onCardClick?: (timeframe: string) => void;
  sentimentConflict?: SentimentConflict | null;
  sentimentSignal?: SentimentSignal | null;
  sentimentMode?: 'filter' | 'combined' | 'info';
}

// Note: 1m and 3m are hidden due to high latency (250-800ms) making them unsuitable for scalping
// The API still returns data for these timeframes, but they are not displayed in the UI
const TIMEFRAME_CONFIG: TimeframeCard[] = [
  { timeframe: '1m', label: '1min', style: 'Scalping', setup: null, hidden: true },
  { timeframe: '3m', label: '3min', style: 'Scalping', setup: null, hidden: true },
  { timeframe: '5m', label: '5min', style: 'Scalping', setup: null },
  { timeframe: '15m', label: '15min', style: 'Intraday', setup: null },
  { timeframe: '1h', label: '1H', style: 'Swing', setup: null },
  { timeframe: '4h', label: '4H', style: 'Position', setup: null },
  { timeframe: '1d', label: '1D', style: 'Trend', setup: null },
];

export function TradeRecommendations({
  recommendations,
  scores,
  hedgeRecommendation,
  currentPrice,
  coinSymbol,
  coinImage,
  loading = false,
  onCardClick,
  sentimentConflict,
  sentimentSignal,
  sentimentMode = 'info',
}: TradeRecommendationsProps) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const formatPrice = (price: number | 'market') => {
    if (price === 'market') return 'Market';
    return `$${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'long':
        return 'text-green-400 bg-green-500/20 border-green-500/50';
      case 'short':
        return 'text-red-400 bg-red-500/20 border-red-500/50';
      default:
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50';
    }
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'TAKE IT':
        return 'text-green-400 bg-green-500/20';
      case 'RISKY':
        return 'text-yellow-400 bg-yellow-500/20';
      default:
        return 'text-red-400 bg-red-500/20';
    }
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 45) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Memoized confluence map for performance
  const confluenceMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const config of TIMEFRAME_CONFIG) {
      const setup = recommendations[config.timeframe];
      if (setup?.type && setup.type !== 'wait') {
        const sameDirection = Object.entries(recommendations).filter(
          ([key, s]) => key !== config.timeframe && s && s.type === setup.type
        );
        map[config.timeframe] = sameDirection.length >= 2;
      } else {
        map[config.timeframe] = false;
      }
    }
    return map;
  }, [recommendations]);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-400" />
          <span>Trade-Empfehlungen</span>
          {coinImage && (
            <img src={coinImage} alt={coinSymbol} className="w-5 h-5 rounded-full" />
          )}
          <span className="text-blue-400">{coinSymbol.toUpperCase()}/USDT</span>
          {currentPrice > 0 && (
            <span className="text-sm text-gray-400 font-normal">
              @ ${currentPrice.toLocaleString('en-US', { maximumFractionDigits: currentPrice >= 1000 ? 0 : 2 })}
            </span>
          )}
        </h2>
        {loading && (
          <div className="flex items-center gap-2 text-blue-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Analysiere {coinSymbol.toUpperCase()}...
          </div>
        )}
      </div>

      {/* Sentiment Conflict Warning Banner */}
      <AnimatePresence>
        {sentimentConflict?.hasConflict && sentimentMode !== 'info' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg"
          >
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-medium text-yellow-400 text-sm">Sentiment-Widerspruch erkannt</div>
                <div className="text-xs text-yellow-300/80 mt-1">
                  {sentimentConflict.message}
                </div>
                <div className="text-[10px] text-gray-400 mt-1.5">
                  Technik hat Vorrang - Trade-Richtung bleibt {sentimentConflict.technicalDirection.toUpperCase()}.
                  Vorsicht empfohlen!
                </div>
              </div>
              {sentimentSignal && (
                <div className="flex flex-col items-end text-[10px]">
                  <span className={`px-2 py-0.5 rounded ${
                    sentimentSignal.direction === 'bullish' ? 'bg-green-500/20 text-green-400' :
                    sentimentSignal.direction === 'bearish' ? 'bg-red-500/20 text-red-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    Sent: {sentimentSignal.direction}
                  </span>
                  <span className="text-gray-500 mt-0.5">Score: {sentimentSignal.score}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sentiment Info Banner (when no conflict but showing sentiment info) */}
      <AnimatePresence>
        {sentimentSignal && !sentimentConflict?.hasConflict && sentimentMode === 'info' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 p-2 bg-gray-800/50 border border-gray-700 rounded-lg"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Sentiment Signal:</span>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded font-medium ${
                  sentimentSignal.direction === 'bullish' ? 'bg-green-500/20 text-green-400' :
                  sentimentSignal.direction === 'bearish' ? 'bg-red-500/20 text-red-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {sentimentSignal.direction.toUpperCase()}
                </span>
                <span className="text-gray-500">Score: {sentimentSignal.score > 0 ? '+' : ''}{sentimentSignal.score}</span>
                <span className={`text-[10px] ${
                  sentimentSignal.confidence === 'high' ? 'text-green-400' :
                  sentimentSignal.confidence === 'medium' ? 'text-yellow-400' :
                  'text-gray-400'
                }`}>
                  ({sentimentSignal.confidence})
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {TIMEFRAME_CONFIG.filter(c => !c.hidden).map((config, index) => {
          const setup = recommendations[config.timeframe];
          const score = scores[config.timeframe];
          const hasConfluence = confluenceMap[config.timeframe] || false;
          const isBestTrade = score?.rank === 1 && setup?.type !== 'wait';

          return (
            <motion.div
              key={config.timeframe}
              variants={staggerItem}
              whileHover={{
                scale: 1.02,
                y: -4,
                boxShadow: isBestTrade
                  ? '0 12px 40px rgba(34, 197, 94, 0.3)'
                  : setup?.type === 'long'
                    ? '0 12px 40px rgba(34, 197, 94, 0.2)'
                    : setup?.type === 'short'
                      ? '0 12px 40px rgba(239, 68, 68, 0.2)'
                      : '0 12px 40px rgba(0, 0, 0, 0.3)'
              }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
              role="article"
              aria-label={`${config.label} ${config.style} Trade: ${setup?.type?.toUpperCase() || 'No data'}${hasConfluence ? ', Multi-Timeframe Konfluenz' : ''}${isBestTrade ? ', Best Trade' : ''}`}
              tabIndex={0}
              className={`relative bg-gray-900/50 border rounded-lg overflow-hidden cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                isBestTrade
                  ? 'border-green-500 ring-2 ring-green-500/30 shadow-lg shadow-green-500/20'
                  : setup && setup.type !== 'wait'
                    ? setup.type === 'long'
                      ? 'border-green-500/30'
                      : 'border-red-500/30'
                    : 'border-gray-800'
              }`}
              onClick={() => onCardClick?.(config.timeframe)}
              onKeyDown={(e) => e.key === 'Enter' && onCardClick?.(config.timeframe)}
              onMouseEnter={() => setHoveredCard(config.timeframe)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              {/* Header with Rank */}
              <div className="bg-gray-800/50 px-3 py-2 border-b border-gray-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white">{config.label}</span>
                    {isBestTrade && (
                      <div className="flex items-center gap-0.5 bg-green-500/20 text-green-400 px-1 py-0.5 rounded text-[10px] font-bold">
                        <Star className="w-3 h-3 fill-current" />
                        #1
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-500 uppercase">{config.style}</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-3">
                {loading && !setup ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
                  </div>
                ) : setup ? (
                  <>
                    {/* Score Bar & Verdict */}
                    {score && setup.type !== 'wait' && (
                      <div className="mb-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-gray-500">Score</span>
                          <span className="text-xs font-bold text-white">{score.total}/100</span>
                        </div>
                        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${getScoreBarColor(score.total)}`}
                            style={{ width: `${score.total}%` }}
                          />
                        </div>
                        <div className={`text-center text-[10px] font-bold mt-1 px-1.5 py-0.5 rounded ${getVerdictColor(score.verdict)}`}>
                          {score.verdict}
                        </div>
                      </div>
                    )}

                    {/* Type Badge */}
                    <div
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-bold mb-2 ${getTypeColor(
                        setup.type
                      )}`}
                    >
                      {setup.type === 'long' ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : setup.type === 'short' ? (
                        <TrendingDown className="w-4 h-4" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                      {setup.type.toUpperCase()}
                    </div>

                    {setup.type !== 'wait' ? (
                      <>
                        {/* Entry/SL/TP */}
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Entry:</span>
                            <span className="text-yellow-400 font-medium">
                              {formatPrice(setup.entry)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">SL:</span>
                            <span className="text-red-400 font-medium">
                              {formatPrice(setup.stopLoss)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">TP1:</span>
                            <span className="text-green-400 font-medium">
                              {formatPrice(setup.takeProfit[0])}
                            </span>
                          </div>
                          {setup.takeProfit[1] && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">TP2:</span>
                              <span className="text-green-500 font-medium">
                                {formatPrice(setup.takeProfit[1])}
                              </span>
                            </div>
                          )}
                          {setup.takeProfit[2] && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">TP3:</span>
                              <span className="text-green-600 font-medium">
                                {formatPrice(setup.takeProfit[2])}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between border-t border-gray-700/50 pt-1 mt-1">
                            <span className="text-gray-500">RR:</span>
                            <span className="text-blue-400 font-bold">
                              1:{setup.riskReward.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-xs text-gray-500 py-2">
                        Kein klares Setup
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center py-4 text-gray-500 text-xs">
                    Keine Daten
                  </div>
                )}
              </div>

              {/* Confluence Badge */}
              {hasConfluence && (
                <div className="absolute top-2 right-2">
                  <div className="flex items-center gap-1 bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded text-[10px] font-medium">
                    <CheckCircle2 className="w-3 h-3" />
                    MTF
                  </div>
                </div>
              )}

              {/* Hover Score Breakdown - Enhanced with Technical/Sentiment split */}
              <AnimatePresence>
              {hoveredCard === config.timeframe && score && setup?.type !== 'wait' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="absolute inset-0 bg-gray-900/95 p-2 flex flex-col justify-center z-10 overflow-y-auto">
                  {/* Score Summary Bar */}
                  <div className="flex items-center justify-between mb-2 pb-1 border-b border-gray-700">
                    <span className="text-[10px] text-gray-400 font-semibold">SCORE BREAKDOWN</span>
                    <div className="flex items-center gap-1 text-[9px]">
                      <span className="text-blue-400">{score.weights?.technical || 70}%</span>
                      <span className="text-gray-600">/</span>
                      <span className="text-purple-400">{score.weights?.sentiment || 30}%</span>
                    </div>
                  </div>

                  {/* Two-column layout for Technical and Sentiment */}
                  <div className="grid grid-cols-2 gap-2 text-[9px]">
                    {/* Technical Column */}
                    <div className="bg-blue-900/20 rounded p-1.5">
                      <p className="text-blue-400 font-semibold mb-1 text-[8px]">TECHNICAL ({score.technicalScore || 0}/100)</p>
                      <div className="space-y-0.5">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Trend:</span>
                          <span className="text-white">{score.components.trendAlignment}/25</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Momentum:</span>
                          <span className="text-white">{Math.round(score.components.momentumStrength)}/20</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">RR:</span>
                          <span className="text-white">{score.components.riskRewardQuality}/20</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Konfl:</span>
                          <span className="text-white">{score.components.confluenceBonus}/15</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Vol:</span>
                          <span className="text-white">{score.components.volumeConfirmation}/10</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Level:</span>
                          <span className="text-white">{score.components.levelProximity}/10</span>
                        </div>
                      </div>
                    </div>

                    {/* Sentiment Column */}
                    <div className="bg-purple-900/20 rounded p-1.5">
                      <p className="text-purple-400 font-semibold mb-1 text-[8px]">SENTIMENT ({score.sentimentScore || 0}/100)</p>
                      <div className="space-y-0.5">
                        <div className="flex justify-between">
                          <span className="text-gray-500">F&G:</span>
                          <span className="text-white">{score.components.fearGreedAlignment || 0}/25</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Social:</span>
                          <span className="text-white">{Math.round(score.components.socialSentiment || 0)}/25</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Funding:</span>
                          <span className="text-white">{score.components.fundingRateBias || 0}/25</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Markt:</span>
                          <span className="text-white">{score.components.marketMomentum || 0}/25</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reasoning */}
                  {setup?.reasoning && (
                    <p className="text-[8px] text-gray-400 mt-1.5 text-center italic border-t border-gray-700 pt-1">
                      {setup.reasoning}
                    </p>
                  )}
                </motion.div>
              )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Hedge Recommendation Panel */}
      <AnimatePresence>
      {hedgeRecommendation && hedgeRecommendation.type !== 'no_hedge' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-4 bg-gradient-to-r from-amber-900/30 to-orange-900/30 border border-amber-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Scale className="w-5 h-5 text-amber-400" />
            <span className="font-semibold text-amber-400">HEDGE-EMPFEHLUNG</span>
            <Shield className="w-4 h-4 text-amber-400/50" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            {/* Main Position */}
            {hedgeRecommendation.mainPosition && (
              <div className="bg-gray-900/50 rounded-lg p-3">
                <p className="text-gray-400 text-xs mb-1">Hauptposition</p>
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${hedgeRecommendation.mainPosition.direction === 'long' ? 'text-green-400' : 'text-red-400'}`}>
                    {hedgeRecommendation.mainPosition.allocation}% {hedgeRecommendation.mainPosition.direction.toUpperCase()}
                  </span>
                  <span className="text-gray-500">auf {hedgeRecommendation.mainPosition.timeframe}</span>
                </div>
              </div>
            )}

            {/* Hedge Position */}
            {hedgeRecommendation.hedgePosition && (
              <div className="bg-gray-900/50 rounded-lg p-3">
                <p className="text-gray-400 text-xs mb-1">Hedge</p>
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${hedgeRecommendation.hedgePosition.direction === 'long' ? 'text-green-400' : 'text-red-400'}`}>
                    {hedgeRecommendation.hedgePosition.allocation}% {hedgeRecommendation.hedgePosition.direction.toUpperCase()}
                  </span>
                  <span className="text-gray-500">auf {hedgeRecommendation.hedgePosition.timeframe}</span>
                </div>
                {hedgeRecommendation.hedgePosition.triggerPrice && (
                  <p className="text-[10px] text-gray-500 mt-1">
                    Trigger: ${hedgeRecommendation.hedgePosition.triggerPrice.toLocaleString()}
                  </p>
                )}
              </div>
            )}

            {/* Net Exposure */}
            <div className="bg-gray-900/50 rounded-lg p-3">
              <p className="text-gray-400 text-xs mb-1">Netto-Exposure</p>
              <span className={`font-bold text-lg ${hedgeRecommendation.netExposure > 0 ? 'text-green-400' : hedgeRecommendation.netExposure < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                {hedgeRecommendation.netExposure > 0 ? '+' : ''}{hedgeRecommendation.netExposure}%
                <span className="text-sm font-normal text-gray-500 ml-1">
                  {hedgeRecommendation.netExposure > 0 ? 'LONG' : hedgeRecommendation.netExposure < 0 ? 'SHORT' : 'NEUTRAL'}
                </span>
              </span>
            </div>
          </div>

          {/* Reason */}
          <p className="text-xs text-gray-400 mt-3 flex items-center gap-2">
            <span className="text-amber-400">Grund:</span>
            {hedgeRecommendation.reason}
          </p>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="flex items-center justify-center gap-4 mt-3 text-[10px] text-gray-500">
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500" /> LONG
        </span>
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500" /> SHORT
        </span>
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-yellow-500" /> WAIT
        </span>
        <span className="flex items-center gap-1">
          <Star className="w-3 h-3 text-green-400 fill-current" /> Best Trade
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-purple-400" /> MTF Konfluenz
        </span>
      </motion.div>
    </div>
  );
}
