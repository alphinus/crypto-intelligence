'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { RefreshCw, Brain, AlertCircle, Clock, Sparkles } from 'lucide-react';
import { NewsTicker } from '@/components/NewsTicker';
import { TrendingSidebar } from '@/components/TrendingSidebar';
import { MarketSnapshot } from '@/components/MarketSnapshot';
import { TradeRecommendations } from '@/components/TradeRecommendations';
import { ConfluenceZones } from '@/components/ConfluenceZones';
import { MiniWidgets } from '@/components/MiniWidgets';
import { CoinDetailModal } from '@/components/CoinDetailModal';
import { GlobalStats } from '@/components/GlobalStats';
import { IntelligenceReport } from '@/components/IntelligenceReport';
import { PresentationMode } from '@/components/PresentationMode';
import { InlineChart } from '@/components/InlineChart';
import type { NewsArticle, MarketData, FearGreedIndex } from '@/types/news';
import type { MarketIntelligenceReport, TimeframeTradeSetup, TradeScore, HedgeRecommendation, AnalysisWeights, IndicatorPreset, CoinIntelligenceReport as CoinReport } from '@/lib/groq';
import { CoinIntelligenceReport } from '@/components/CoinIntelligenceReport';
import { getDefaultPreset, recommendPreset, getPresetById } from '@/lib/groq';
import PresetSelector from '@/components/PresetSelector';
import { MarketSessions } from '@/components/MarketSessions';
import type { SubredditData } from '@/lib/reddit';
import type { Protocol, Chain, YieldPool } from '@/lib/defillama';
import type { TrendingCoin, GlobalData } from '@/app/api/market/route';
import type { FuturesOverviewData } from '@/lib/binance-futures';
import type { BitcoinOnChainData } from '@/lib/mempool';
import type { TechnicalLevels } from '@/lib/technical-levels';
import type { MultiTimeframeData, Interval, EMAData } from '@/lib/binance-klines';
import { findConfluenceZones, type AllTimeframeLevels } from '@/lib/technical-levels';
import { calculateMultipleEMAs } from '@/lib/binance-klines';
import { useBinanceWebSocket } from '@/hooks/useBinanceWebSocket';
import type { Kline } from '@/lib/binance-klines';
import { ThemeToggle } from '@/components/ThemeToggle';
import { YouTubeSection } from '@/components/YouTubeSection';
import { GuruWatcher } from '@/components/GuruWatcher';
import { AuthButton } from '@/components/AuthButton';
import { TelegramSentiment } from '@/components/TelegramSentiment';
import { SettingsButton } from '@/components/SettingsButton';

interface MarketResponse {
  success: boolean;
  coins: MarketData[];
  fearGreed: FearGreedIndex | null;
  trending: TrendingCoin[];
  global: GlobalData | null;
}

interface FuturesResponse {
  success: boolean;
  openInterest: FuturesOverviewData['openInterest'];
  fundingRates: FuturesOverviewData['fundingRates'];
  longShortRatio: FuturesOverviewData['longShortRatio'];
  tickers: FuturesOverviewData['tickers'];
}

interface BitcoinResponse {
  success: boolean;
  fees: BitcoinOnChainData['fees'];
  mempool: BitcoinOnChainData['mempool'];
  difficulty: BitcoinOnChainData['difficulty'];
  latestBlock: BitcoinOnChainData['latestBlock'];
  blockHeight: number;
}

interface NewsResponse {
  success: boolean;
  articles: NewsArticle[];
  count: number;
}

interface RedditResponse {
  success: boolean;
  subreddits: SubredditData[];
  overall: {
    sentiment: 'bullish' | 'bearish' | 'neutral';
    sentimentScore: number;
    trendingTopics: string[];
    totalPosts: number;
  };
}

interface DefiResponse {
  success: boolean;
  totalTvl: number;
  totalTvlChange24h: number;
  topProtocols: Protocol[];
  topChains: Chain[];
  topYields: YieldPool[];
  stablecoins: {
    total: number;
    change24h: number;
  };
}

// System Clock Component (client-only to avoid hydration mismatch)
function SystemClock() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    // Set initial time only on client to avoid hydration mismatch
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-gray-800/50 rounded text-xs">
      <Clock className="w-3 h-3 text-gray-400" />
      <span className="font-mono text-gray-300">
        {time ? time.toLocaleTimeString('de-DE', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) : '--:--:--'}
      </span>
    </div>
  );
}

export default function Home() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [marketData, setMarketData] = useState<MarketResponse | null>(null);
  const [redditData, setRedditData] = useState<RedditResponse | null>(null);
  const [defiData, setDefiData] = useState<DefiResponse | null>(null);
  const [futuresData, setFuturesData] = useState<FuturesResponse | null>(null);
  const [bitcoinData, setBitcoinData] = useState<BitcoinResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingTrades, setLoadingTrades] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intelligenceReport, setIntelligenceReport] = useState<MarketIntelligenceReport | null>(null);
  const [modalCoin, setModalCoin] = useState<MarketData | null>(null);
  const [selectedAnalysisCoin, setSelectedAnalysisCoin] = useState<MarketData | null>(null);
  const [technicalLevels, setTechnicalLevels] = useState<TechnicalLevels | null>(null);
  const [multiTimeframe, setMultiTimeframe] = useState<MultiTimeframeData | null>(null);
  const [showPresentation, setShowPresentation] = useState(false);
  const [tradeRecommendations, setTradeRecommendations] = useState<Record<string, TimeframeTradeSetup | null>>({});
  const [confluenceZones, setConfluenceZones] = useState<{ price: number; type: 'support' | 'resistance'; timeframes: string[] }[]>([]);
  const [chartTimeframe, setChartTimeframe] = useState<Interval>('1h');
  const [allTimeframeLevels, setAllTimeframeLevels] = useState<AllTimeframeLevels | null>(null);
  const [customCoins, setCustomCoins] = useState<MarketData[]>([]);
  const [analysisMode, setAnalysisMode] = useState({ technical: true, sentiment: true });
  const [analysisWeights, setAnalysisWeights] = useState<AnalysisWeights>({ technical: 70, sentiment: 30 });
  const [tradeScores, setTradeScores] = useState<Record<string, TradeScore>>({});
  const [hedgeRecommendation, setHedgeRecommendation] = useState<HedgeRecommendation | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<IndicatorPreset>(getDefaultPreset());
  const [presetAutoSwitch, setPresetAutoSwitch] = useState(true);
  const [coinReport, setCoinReport] = useState<CoinReport | null>(null);
  const [analyzingCoin, setAnalyzingCoin] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // WebSocket for live kline updates
  const handleKlineUpdate = useCallback((kline: Kline, isClosed: boolean) => {
    setMultiTimeframe((prev) => {
      if (!prev) return prev;
      const tf = chartTimeframe as keyof typeof prev.timeframes;
      const tfData = prev.timeframes[tf];
      if (!tfData) return prev;

      // Update or add the kline
      const updatedKlines = [...tfData.klines];
      const lastIndex = updatedKlines.length - 1;

      if (lastIndex >= 0 && updatedKlines[lastIndex].openTime === kline.openTime) {
        // Update existing kline
        updatedKlines[lastIndex] = kline;
      } else if (isClosed) {
        // Add new kline (remove oldest if over limit)
        updatedKlines.push(kline);
        if (updatedKlines.length > 200) {
          updatedKlines.shift();
        }
      }

      return {
        ...prev,
        currentPrice: kline.close,
        timeframes: {
          ...prev.timeframes,
          [tf]: {
            ...tfData,
            klines: updatedKlines,
          },
        },
      };
    });
  }, [chartTimeframe]);

  const { isConnected, connectionState, error: wsError } = useBinanceWebSocket({
    symbol: selectedAnalysisCoin?.symbol || 'BTC',
    interval: chartTimeframe,
    onKlineUpdate: handleKlineUpdate,
    enabled: !!selectedAnalysisCoin,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [newsRes, marketRes] = await Promise.all([
        fetch('/api/news'),
        fetch('/api/market'),
      ]);

      // Check for HTTP errors
      if (!newsRes.ok || !marketRes.ok) {
        const failedApis = [];
        if (!newsRes.ok) failedApis.push(`News (${newsRes.status})`);
        if (!marketRes.ok) failedApis.push(`Market (${marketRes.status})`);
        throw new Error(`API-Fehler: ${failedApis.join(', ')}`);
      }

      const newsData: NewsResponse = await newsRes.json();
      const market: MarketResponse = await marketRes.json();

      if (newsData.success) {
        setArticles(newsData.articles);
      }

      if (market.success) {
        setMarketData(market);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler';
      setError(`Fehler beim Laden: ${errorMessage}`);
      console.error('[fetchData]', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReddit = useCallback(async () => {
    try {
      const res = await fetch('/api/reddit');
      const data: RedditResponse = await res.json();
      if (data.success) {
        setRedditData(data);
      }
    } catch (err) {
      console.error('Reddit fetch error:', err);
    }
  }, []);

  const fetchDefi = useCallback(async () => {
    try {
      const res = await fetch('/api/defi');
      const data: DefiResponse = await res.json();
      if (data.success) {
        setDefiData(data);
      }
    } catch (err) {
      console.error('DeFi fetch error:', err);
    }
  }, []);

  const fetchFutures = useCallback(async () => {
    try {
      const res = await fetch('/api/futures');
      const data: FuturesResponse = await res.json();
      if (data.success) {
        setFuturesData(data);
      }
    } catch (err) {
      console.error('Futures fetch error:', err);
    }
  }, []);

  const fetchBitcoin = useCallback(async () => {
    try {
      const res = await fetch('/api/bitcoin');
      const data: BitcoinResponse = await res.json();
      if (data.success) {
        setBitcoinData(data);
      }
    } catch (err) {
      console.error('Bitcoin fetch error:', err);
    }
  }, []);

  // Generate simple trade setup based on technical indicators
  const generateTradeSetup = (
    timeframeData: { trend: string; momentum: number; klines: { close: number }[] },
    levels: { keySupport: number | null; keyResistance: number | null; currentPrice: number },
    emas: { currentEma50: number | null; currentEma200: number | null },
    timeframe: '1m' | '3m' | '5m' | '15m' | '1h' | '4h' | '1d'
  ): TimeframeTradeSetup | null => {
    if (!timeframeData.klines.length || !levels.currentPrice) return null;

    const price = levels.currentPrice;
    const trend = timeframeData.trend;
    const momentum = timeframeData.momentum;

    // Trading style based on timeframe
    const tradingStyleMap: Record<string, 'scalping' | 'intraday' | 'swing' | 'position'> = {
      '1m': 'scalping',
      '3m': 'scalping',
      '5m': 'scalping',
      '15m': 'intraday',
      '1h': 'swing',
      '4h': 'swing',
      '1d': 'position',
    };
    const tradingStyle = tradingStyleMap[timeframe];

    // Simple rule-based setup
    if (trend === 'sideways' || Math.abs(momentum) < 20) {
      return {
        type: 'wait',
        entry: 'market',
        stopLoss: price * 0.98,
        takeProfit: [price * 1.02],
        riskReward: 1,
        confidence: 'low',
        reasoning: 'Kein klarer Trend - abwarten empfohlen',
        timeframe,
        confluenceWithOtherTimeframes: false,
        tradingStyle,
      };
    }

    const isLong = trend === 'up' && momentum > 20;
    const isShort = trend === 'down' && momentum < -20;

    if (!isLong && !isShort) {
      return {
        type: 'wait',
        entry: 'market',
        stopLoss: price * 0.98,
        takeProfit: [price * 1.02],
        riskReward: 1,
        confidence: 'low',
        reasoning: 'Gemischte Signale',
        timeframe,
        confluenceWithOtherTimeframes: false,
        tradingStyle,
      };
    }

    // EMA confirmation
    const emaConfirm = emas.currentEma50 && emas.currentEma200
      ? (isLong ? price > emas.currentEma50 && emas.currentEma50 > emas.currentEma200 : price < emas.currentEma50 && emas.currentEma50 < emas.currentEma200)
      : false;

    const confidence = emaConfirm ? 'high' : Math.abs(momentum) > 50 ? 'medium' : 'low';

    if (isLong) {
      const sl = levels.keySupport || price * 0.97;
      const risk = price - sl;
      // Fibonacci Extension TPs: 1.0x, 1.618x, 2.618x vom Risk
      const tp1 = price + risk * 1.0;      // TP1: 1:1 R/R
      const tp2 = price + risk * 1.618;    // TP2: Golden Ratio
      const tp3 = price + risk * 2.618;    // TP3: 2.618 Fibonacci
      return {
        type: 'long',
        entry: price,
        stopLoss: sl,
        takeProfit: [tp1, tp2, tp3],
        riskReward: risk > 0 ? (tp1 - price) / risk : 1,
        confidence,
        reasoning: `Aufwärtstrend (Mom: ${momentum}), ${emaConfirm ? 'EMA bestätigt' : 'ohne EMA-Bestätigung'}`,
        timeframe,
        confluenceWithOtherTimeframes: emaConfirm,
        tradingStyle,
      };
    } else {
      const sl = levels.keyResistance || price * 1.03;
      const risk = sl - price;
      // Fibonacci Extension TPs: 1.0x, 1.618x, 2.618x vom Risk
      const tp1 = price - risk * 1.0;      // TP1: 1:1 R/R
      const tp2 = price - risk * 1.618;    // TP2: Golden Ratio
      const tp3 = price - risk * 2.618;    // TP3: 2.618 Fibonacci
      return {
        type: 'short',
        entry: price,
        stopLoss: sl,
        takeProfit: [tp1, tp2, tp3],
        riskReward: risk > 0 ? (price - tp1) / risk : 1,
        confidence,
        reasoning: `Abwärtstrend (Mom: ${momentum}), ${emaConfirm ? 'EMA bestätigt' : 'ohne EMA-Bestätigung'}`,
        timeframe,
        confluenceWithOtherTimeframes: emaConfirm,
        tradingStyle,
      };
    }
  };

  // Sentiment Data Interface for Score Calculation
  interface SentimentData {
    fearGreedValue: number; // 0-100
    fearGreedLabel: string;
    socialSentiment: 'bullish' | 'bearish' | 'neutral';
    socialScore: number; // -100 to 100
    fundingRate: number | null; // Can be positive or negative
  }

  // Calculate Trade Score for ranking (now includes Sentiment)
  const calculateTradeScore = (
    setup: TimeframeTradeSetup | null,
    tfData: { trend: string; momentum: number; avgVolume: number } | null,
    levels: { keySupport: number | null; keyResistance: number | null } | null,
    allRecommendations: Record<string, TimeframeTradeSetup | null>,
    sentimentData: SentimentData | null,
    weights: AnalysisWeights
  ): TradeScore => {
    // Default score for wait/null setups
    if (!setup || setup.type === 'wait' || !tfData) {
      return {
        total: 0,
        verdict: 'LEAVE IT',
        components: {
          trendAlignment: 0,
          momentumStrength: 0,
          riskRewardQuality: 0,
          confluenceBonus: 0,
          volumeConfirmation: 0,
          levelProximity: 0,
          fearGreedAlignment: 0,
          socialSentiment: 0,
          fundingRateBias: 0,
          marketMomentum: 0,
        },
        technicalScore: 0,
        sentimentScore: 0,
        weights,
        rank: 99,
      };
    }

    // ============ TECHNICAL COMPONENTS (max 100 raw points) ============

    // 1. Trend Alignment (25 Punkte max)
    const trendAlignment =
      setup.confidence === 'high' ? 25 :
      setup.confidence === 'medium' ? 15 : 5;

    // 2. Momentum Strength (20 Punkte max)
    const momentumStrength = Math.min(20, Math.abs(tfData.momentum) / 5);

    // 3. Risk/Reward Quality (20 Punkte max)
    const rrScore =
      setup.riskReward >= 3 ? 20 :
      setup.riskReward >= 2 ? 15 :
      setup.riskReward >= 1.5 ? 10 : 5;

    // 4. Confluence Bonus (15 Punkte max) - Same direction in other TFs
    const sameDirectionCount = Object.values(allRecommendations).filter(
      (r) => r && r.type === setup.type && r.timeframe !== setup.timeframe
    ).length;
    const confluenceBonus = Math.min(15, sameDirectionCount * 5);

    // 5. Volume Confirmation (10 Punkte max)
    const volumeScore = tfData.avgVolume > 0 ? 7 : 5;

    // 6. Level Proximity (10 Punkte max)
    let levelScore = 3;
    if (levels && typeof setup.entry === 'number') {
      const entryPrice = setup.entry;
      const nearSupport = levels.keySupport && Math.abs(entryPrice - levels.keySupport) / entryPrice < 0.01;
      const nearResistance = levels.keyResistance && Math.abs(entryPrice - levels.keyResistance) / entryPrice < 0.01;
      if ((setup.type === 'long' && nearSupport) || (setup.type === 'short' && nearResistance)) {
        levelScore = 10;
      } else if (nearSupport || nearResistance) {
        levelScore = 6;
      }
    }

    // Technical raw score (max 100)
    const technicalRaw = trendAlignment + momentumStrength + rrScore + confluenceBonus + volumeScore + levelScore;

    // ============ SENTIMENT COMPONENTS (max 100 raw points) ============

    let fearGreedAlignment = 12; // Neutral default
    let socialSentimentScore = 12; // Neutral default
    let fundingRateBias = 12; // Neutral default
    let marketMomentum = 12; // Neutral default

    if (sentimentData) {
      // 1. Fear & Greed Alignment (25 Punkte max)
      // For LONG: High F&G (Greed) = less points (contrarian), Low F&G (Fear) = more points (buy fear)
      // For SHORT: High F&G (Greed) = more points (sell greed), Low F&G (Fear) = less points
      const fgValue = sentimentData.fearGreedValue;
      if (setup.type === 'long') {
        // Extreme Fear (0-25) = 25 points, Neutral (40-60) = 15 points, Extreme Greed (75-100) = 5 points
        fearGreedAlignment = fgValue <= 25 ? 25 : fgValue <= 40 ? 20 : fgValue <= 60 ? 15 : fgValue <= 75 ? 10 : 5;
      } else {
        // For SHORT: Extreme Greed (75-100) = 25 points, Extreme Fear = 5 points
        fearGreedAlignment = fgValue >= 75 ? 25 : fgValue >= 60 ? 20 : fgValue >= 40 ? 15 : fgValue >= 25 ? 10 : 5;
      }

      // 2. Social Sentiment Alignment (25 Punkte max)
      // Score alignment with trade direction
      if (sentimentData.socialSentiment === 'bullish' && setup.type === 'long') {
        socialSentimentScore = Math.min(25, 15 + Math.abs(sentimentData.socialScore) / 10);
      } else if (sentimentData.socialSentiment === 'bearish' && setup.type === 'short') {
        socialSentimentScore = Math.min(25, 15 + Math.abs(sentimentData.socialScore) / 10);
      } else if (sentimentData.socialSentiment === 'neutral') {
        socialSentimentScore = 12;
      } else {
        // Contrarian - sentiment opposite to trade
        socialSentimentScore = 8;
      }

      // 3. Funding Rate Bias (25 Punkte max)
      // Negative funding = longs pay shorts (bearish pressure, good for longs)
      // Positive funding = shorts pay longs (bullish pressure, good for shorts)
      if (sentimentData.fundingRate !== null) {
        const fr = sentimentData.fundingRate;
        if (setup.type === 'long') {
          // Negative funding is good for longs (market is paying you to go long)
          fundingRateBias = fr < -0.01 ? 25 : fr < 0 ? 20 : fr < 0.01 ? 15 : fr < 0.03 ? 10 : 5;
        } else {
          // Positive funding is good for shorts (market is paying you to go short)
          fundingRateBias = fr > 0.03 ? 25 : fr > 0.01 ? 20 : fr > 0 ? 15 : fr > -0.01 ? 10 : 5;
        }
      }

      // 4. Market Momentum (25 Punkte max) - General market direction
      // Based on social sentiment score strength
      const absScore = Math.abs(sentimentData.socialScore);
      marketMomentum = absScore >= 50 ? 25 : absScore >= 30 ? 20 : absScore >= 15 ? 15 : 10;
    }

    // Sentiment raw score (max 100)
    const sentimentRaw = fearGreedAlignment + socialSentimentScore + fundingRateBias + marketMomentum;

    // ============ WEIGHTED TOTAL ============
    const technicalWeighted = (technicalRaw * weights.technical) / 100;
    const sentimentWeighted = (sentimentRaw * weights.sentiment) / 100;
    const total = Math.round(technicalWeighted + sentimentWeighted);

    const verdict: 'TAKE IT' | 'RISKY' | 'LEAVE IT' =
      total >= 70 ? 'TAKE IT' : total >= 45 ? 'RISKY' : 'LEAVE IT';

    return {
      total,
      verdict,
      components: {
        trendAlignment,
        momentumStrength,
        riskRewardQuality: rrScore,
        confluenceBonus,
        volumeConfirmation: volumeScore,
        levelProximity: levelScore,
        fearGreedAlignment,
        socialSentiment: socialSentimentScore,
        fundingRateBias,
        marketMomentum,
      },
      technicalScore: technicalRaw,
      sentimentScore: sentimentRaw,
      weights,
      rank: 0, // Will be set after all scores calculated
    };
  };

  // Calculate Hedge Recommendation
  const calculateHedgeRecommendation = (
    recommendations: Record<string, TimeframeTradeSetup | null>,
    scores: Record<string, TradeScore>
  ): HedgeRecommendation => {
    // Get best trade (highest score with actual direction)
    const validTrades = Object.entries(scores)
      .filter(([tf, score]) => {
        const setup = recommendations[tf];
        return setup && setup.type !== 'wait' && score.total > 0;
      })
      .sort((a, b) => b[1].total - a[1].total);

    if (validTrades.length === 0) {
      return { type: 'no_hedge', reason: 'Keine aktiven Trade-Setups', netExposure: 0 };
    }

    const [bestTf, bestScore] = validTrades[0];
    const bestSetup = recommendations[bestTf]!;

    // Timeframe hierarchy for conflict detection
    const tfHierarchy = ['1m', '3m', '5m', '15m', '1h', '4h', '1d'];
    const bestTfIndex = tfHierarchy.indexOf(bestTf);

    // Look for conflicts in higher timeframes
    const higherTfConflicts = validTrades.filter(([tf, score]) => {
      const tfIndex = tfHierarchy.indexOf(tf);
      const setup = recommendations[tf];
      return tfIndex > bestTfIndex && setup && setup.type !== bestSetup.type && score.total >= 45;
    });

    if (higherTfConflicts.length === 0) {
      return {
        type: 'no_hedge',
        reason: 'Alle Timeframes aligned - kein Hedge nötig',
        mainPosition: {
          timeframe: bestTf,
          direction: bestSetup.type as 'long' | 'short',
          allocation: 100,
        },
        netExposure: bestSetup.type === 'long' ? 100 : -100,
      };
    }

    // Found conflict - calculate hedge
    const [conflictTf, conflictScore] = higherTfConflicts[0];
    const conflictSetup = recommendations[conflictTf]!;
    const scoreDiff = bestScore.total - conflictScore.total;

    if (scoreDiff > 25) {
      // Main trade much stronger - small hedge
      return {
        type: 'partial_hedge',
        reason: `${conflictTf.toUpperCase()} zeigt ${conflictSetup.type === 'long' ? 'Long' : 'Short'} - kleiner Hedge empfohlen`,
        mainPosition: {
          timeframe: bestTf,
          direction: bestSetup.type as 'long' | 'short',
          allocation: 80,
        },
        hedgePosition: {
          timeframe: conflictTf,
          direction: conflictSetup.type as 'long' | 'short',
          allocation: 20,
          triggerPrice: typeof conflictSetup.entry === 'number' ? conflictSetup.entry : undefined,
        },
        netExposure: bestSetup.type === 'long' ? 60 : -60,
      };
    }

    // Scores similar - larger hedge
    return {
      type: 'partial_hedge',
      reason: `Starker Konflikt: ${bestTf.toUpperCase()} ${bestSetup.type} vs ${conflictTf.toUpperCase()} ${conflictSetup.type}`,
      mainPosition: {
        timeframe: bestTf,
        direction: bestSetup.type as 'long' | 'short',
        allocation: 60,
      },
      hedgePosition: {
        timeframe: conflictTf,
        direction: conflictSetup.type as 'long' | 'short',
        allocation: 40,
        triggerPrice: typeof conflictSetup.entry === 'number' ? conflictSetup.entry : undefined,
      },
      netExposure: bestSetup.type === 'long' ? 20 : -20,
    };
  };

  // Fetch trade recommendations for selected coin
  const fetchTradeRecommendations = useCallback(async (symbol: string = 'BTC') => {
    setLoadingTrades(true);
    try {
      // WICHTIG: full=true für Multi-Timeframe Daten
      const res = await fetch(`/api/coin-analysis?symbol=${symbol}&full=true`);
      const data = await res.json();

      if (data.success && data.timeframes) {
        // Set multiTimeframe data
        setMultiTimeframe({
          symbol: data.symbol,
          currentPrice: data.currentPrice,
          timeframes: data.timeframes,
        });

        // Set levels from API response
        if (data.levels) {
          setAllTimeframeLevels(data.levels as AllTimeframeLevels);
          const zones = findConfluenceZones(data.levels as AllTimeframeLevels);
          setConfluenceZones(zones);

          // Set technical levels from 1h timeframe as default
          if (data.levels['1h']) {
            setTechnicalLevels(data.levels['1h']);
          }
        }

        // Generate trade recommendations for each timeframe
        const recommendations: Record<string, TimeframeTradeSetup | null> = {};
        const timeframeKeys = ['1m', '3m', '5m', '15m', '1h', '4h', '1d'] as const;

        for (const tf of timeframeKeys) {
          const tfData = data.timeframes[tf];
          const tfLevels = data.levels?.[tf];
          const tfEmas = data.emas?.[tf];

          if (tfData && tfLevels) {
            recommendations[tf] = generateTradeSetup(
              tfData,
              {
                keySupport: tfLevels.keySupport,
                keyResistance: tfLevels.keyResistance,
                currentPrice: data.currentPrice,
              },
              {
                currentEma50: tfEmas?.currentEma50 || null,
                currentEma200: tfEmas?.currentEma200 || null,
              },
              tf
            );
          } else {
            recommendations[tf] = null;
          }
        }

        setTradeRecommendations(recommendations);

        // Prepare sentiment data for score calculation
        const currentSentimentData: SentimentData | null = (marketData?.fearGreed || redditData?.overall || futuresData?.fundingRates) ? {
          fearGreedValue: marketData?.fearGreed?.value || 50,
          fearGreedLabel: marketData?.fearGreed?.label || 'Neutral',
          socialSentiment: redditData?.overall?.sentiment || 'neutral',
          socialScore: redditData?.overall?.sentimentScore || 0,
          fundingRate: futuresData?.fundingRates?.btc || null,
        } : null;

        // Calculate scores for each timeframe (now includes sentiment)
        const scores: Record<string, TradeScore> = {};
        for (const tf of timeframeKeys) {
          const tfData = data.timeframes[tf];
          const tfLevels = data.levels?.[tf];
          scores[tf] = calculateTradeScore(
            recommendations[tf],
            tfData ? { trend: tfData.trend, momentum: tfData.momentum, avgVolume: tfData.avgVolume } : null,
            tfLevels ? { keySupport: tfLevels.keySupport, keyResistance: tfLevels.keyResistance } : null,
            recommendations,
            currentSentimentData,
            analysisWeights
          );
        }

        // Assign ranks (1 = best)
        const sortedTfs = Object.entries(scores)
          .filter(([_, score]) => score.total > 0)
          .sort((a, b) => b[1].total - a[1].total);
        sortedTfs.forEach(([tf, _], index) => {
          scores[tf].rank = index + 1;
        });

        setTradeScores(scores);

        // Calculate hedge recommendation
        const hedge = calculateHedgeRecommendation(recommendations, scores);
        setHedgeRecommendation(hedge);
      }
    } catch (err) {
      console.error('Trade recommendations fetch error:', err);
    } finally {
      setLoadingTrades(false);
    }
  }, [marketData?.fearGreed, redditData?.overall, futuresData?.fundingRates, analysisWeights]);

  // Handle coin selection for analysis
  const handleCoinSelect = useCallback((coin: MarketData) => {
    setSelectedAnalysisCoin(coin);
    fetchTradeRecommendations(coin.symbol);
  }, [fetchTradeRecommendations]);

  // Add custom coin by symbol (fetches from Binance)
  const handleAddCustomCoin = useCallback(async (symbol: string): Promise<MarketData | null> => {
    try {
      // Check if already exists in coins or customCoins
      const existsInCoins = marketData?.coins.some(
        (c) => c.symbol.toLowerCase() === symbol.toLowerCase()
      );
      const existsInCustom = customCoins.some(
        (c) => c.symbol.toLowerCase() === symbol.toLowerCase()
      );

      if (existsInCoins || existsInCustom) {
        // Already exists, just select it
        const existing = marketData?.coins.find(
          (c) => c.symbol.toLowerCase() === symbol.toLowerCase()
        ) || customCoins.find(
          (c) => c.symbol.toLowerCase() === symbol.toLowerCase()
        );
        if (existing) {
          handleCoinSelect(existing);
          return existing;
        }
      }

      // Fetch price from Binance
      const binanceSymbol = symbol.toUpperCase() + 'USDT';
      const response = await fetch(
        `https://api.binance.com/api/v3/ticker/24hr?symbol=${binanceSymbol}`
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      const newCoin: MarketData = {
        id: `custom-${symbol.toLowerCase()}`,
        symbol: symbol.toLowerCase(),
        name: symbol.toUpperCase(),
        price: parseFloat(data.lastPrice),
        change24h: parseFloat(data.priceChangePercent),
        marketCap: 0,
        volume24h: parseFloat(data.volume),
        image: '',
      };

      setCustomCoins((prev) => {
        // Prevent duplicates
        if (prev.some((c) => c.symbol.toLowerCase() === symbol.toLowerCase())) {
          return prev;
        }
        return [...prev, newCoin];
      });

      // Auto-select the new coin
      handleCoinSelect(newCoin);

      return newCoin;
    } catch (error) {
      console.error('Failed to add custom coin:', error);
      return null;
    }
  }, [marketData?.coins, customCoins, handleCoinSelect]);

  // Generate Coin-specific Intelligence Report
  const generateCoinReport = useCallback(async (coin: MarketData) => {
    setAnalyzingCoin(true);
    try {
      const symbol = coin.symbol.toUpperCase();

      // Technische Daten (bereits geladen)
      const timeframeData = multiTimeframe?.timeframes;
      const levelsData = allTimeframeLevels;

      // Funding Rate (nur für BTC/ETH/SOL)
      const validFundingSymbols = ['BTC', 'ETH', 'SOL'] as const;
      type FundingSymbol = 'btc' | 'eth' | 'sol';
      const funding = validFundingSymbols.includes(symbol as typeof validFundingSymbols[number])
        ? futuresData?.fundingRates?.[symbol.toLowerCase() as FundingSymbol] ?? null
        : null;

      // BTC On-Chain (nur für BTC)
      const onChain = symbol === 'BTC' ? bitcoinData : null;

      // API Call
      const res = await fetch('/api/coin-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          currentPrice: coin.price,
          change24h: coin.change24h,
          timeframes: timeframeData,
          levels: levelsData,
          confluenceZones,
          fundingRate: funding,
          redditSentiment: redditData?.overall,
          fearGreed: marketData?.fearGreed?.value,
          bitcoinOnChain: onChain,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCoinReport(data.report);
      }
    } catch (err) {
      console.error('Coin report error:', err);
    } finally {
      setAnalyzingCoin(false);
    }
  }, [multiTimeframe, allTimeframeLevels, futuresData, bitcoinData, confluenceZones, redditData, marketData]);

  const generateIntelligenceReport = async () => {
    setAnalyzing(true);
    try {
      const klinesRes = await fetch('/api/klines?symbol=BTC');
      const klinesData = await klinesRes.json();

      if (klinesData.success) {
        setMultiTimeframe(klinesData);

        const dailyKlines = klinesData.timeframes['1d']?.klines || [];
        if (dailyKlines.length > 0) {
          const currentPrice = klinesData.currentPrice;
          const highs = dailyKlines.map((k: { high: number }) => k.high);
          const lows = dailyKlines.map((k: { low: number }) => k.low);
          const swingHigh = Math.max(...highs);
          const swingLow = Math.min(...lows);

          const supports = lows
            .filter((l: number) => l < currentPrice)
            .sort((a: number, b: number) => b - a)
            .slice(0, 3)
            .map((price: number) => ({ price, type: 'support' as const, strength: 1, source: 'pivot' as const }));

          const resistances = highs
            .filter((h: number) => h > currentPrice)
            .sort((a: number, b: number) => a - b)
            .slice(0, 3)
            .map((price: number) => ({ price, type: 'resistance' as const, strength: 1, source: 'pivot' as const }));

          const fibRatios = [0.236, 0.382, 0.5, 0.618, 0.786];
          const fibonacci = fibRatios.map(ratio => ({
            ratio,
            label: `${(ratio * 100).toFixed(1)}%`,
            price: swingLow + (swingHigh - swingLow) * ratio,
          }));

          const step = currentPrice >= 10000 ? 5000 : currentPrice >= 1000 ? 500 : 50;
          const psychological = [];
          for (let l = Math.floor(currentPrice * 0.8 / step) * step; l <= currentPrice * 1.2; l += step) {
            if (l > 0) psychological.push(l);
          }

          const levels: TechnicalLevels = {
            currentPrice,
            supports,
            resistances,
            fibonacci,
            psychological,
            keySupport: supports[0]?.price || null,
            keyResistance: resistances[0]?.price || null,
            swingHigh,
            swingLow,
          };

          setTechnicalLevels(levels);
        }
      }

      const newsHeadlines = articles.slice(0, 10).map((a) => a.title);
      const redditTrending = redditData?.overall.trendingTopics || [];
      const redditSentiment = {
        sentiment: redditData?.overall.sentiment || 'neutral',
        score: redditData?.overall.sentimentScore || 0,
      };
      const topCoins = marketData?.coins.slice(0, 10).map((c) => ({
        symbol: c.symbol,
        change24h: c.change24h,
      })) || [];
      const fearGreedIndex = marketData?.fearGreed?.value || 50;
      const defiTvlChange = defiData?.totalTvlChange24h || 0;
      const topProtocols = defiData?.topProtocols.slice(0, 5).map((p) => p.name) || [];

      const enhancedData = {
        newsHeadlines,
        redditTrending,
        redditSentiment,
        topCoins,
        fearGreedIndex,
        defiTvlChange,
        topProtocols,
        technicalLevels: technicalLevels ? {
          currentPrice: technicalLevels.currentPrice,
          keySupport: technicalLevels.keySupport,
          keyResistance: technicalLevels.keyResistance,
          swingHigh: technicalLevels.swingHigh,
          swingLow: technicalLevels.swingLow,
        } : undefined,
        multiTimeframe: klinesData.success ? {
          '15m': klinesData.timeframes['15m'],
          '1h': klinesData.timeframes['1h'],
          '4h': klinesData.timeframes['4h'],
          '1d': klinesData.timeframes['1d'],
        } : undefined,
        futuresData: futuresData ? {
          fundingRates: futuresData.fundingRates,
          openInterest: futuresData.openInterest,
          longShortRatio: { btc: futuresData.longShortRatio.btc },
        } : undefined,
        btcDominance: marketData?.global?.btcDominance,
      };

      const res = await fetch('/api/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enhancedData),
      });

      const data = await res.json();
      if (data.success) {
        setIntelligenceReport(data.report);
      }
    } catch (err) {
      console.error('Intelligence report error:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  // Initial data fetch only on mount
  useEffect(() => {
    fetchData();
    fetchReddit();
    fetchDefi();
    fetchFutures();
    fetchBitcoin();
    fetchTradeRecommendations('BTC');
    setLastUpdated(new Date());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Separate interval for auto-refresh (every 5 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
      fetchReddit();
      fetchDefi();
      fetchFutures();
      fetchBitcoin();
      if (selectedAnalysisCoin) {
        fetchTradeRecommendations(selectedAnalysisCoin.symbol);
      }
      setLastUpdated(new Date());
    }, 300000);
    return () => clearInterval(interval);
  }, [fetchData, fetchReddit, fetchDefi, fetchFutures, fetchBitcoin, fetchTradeRecommendations, selectedAnalysisCoin?.symbol]);

  // Set default BTC as selected when market data loads
  useEffect(() => {
    if (marketData && !selectedAnalysisCoin) {
      const btc = marketData.coins.find(c => c.symbol.toLowerCase() === 'btc');
      if (btc) {
        setSelectedAnalysisCoin(btc);
      }
    }
  }, [marketData, selectedAnalysisCoin]);

  // Auto-switch preset based on timeframe
  // Note: selectedPreset.id removed from dependencies to prevent infinite loop
  // when user manually selects a preset
  useEffect(() => {
    if (presetAutoSwitch) {
      const recommendedId = recommendPreset(chartTimeframe);
      const recommended = getPresetById(recommendedId);
      if (recommended) {
        setSelectedPreset(recommended);
      }
    }
  }, [chartTimeframe, presetAutoSwitch]);

  // Prepare news headlines for ticker (memoized)
  const newsHeadlines = useMemo(() =>
    articles.slice(0, 20).map((article) => ({
      id: article.id,
      title: article.title,
      source: article.source,
      sentiment: article.sentiment || 'neutral',
      url: article.link,
      publishedAt: article.pubDate,
    })),
    [articles]
  );

  // Calculate BTC price from market data (memoized)
  const btcPrice = useMemo(() =>
    marketData?.coins.find((c) => c.symbol.toLowerCase() === 'btc')?.price || 0,
    [marketData?.coins]
  );

  // Get current klines for selected timeframe
  const currentKlines = useMemo(() => {
    if (!multiTimeframe?.timeframes) return [];
    const tf = multiTimeframe.timeframes[chartTimeframe as keyof typeof multiTimeframe.timeframes];
    return tf?.klines || [];
  }, [multiTimeframe, chartTimeframe]);

  // Calculate EMAs for current timeframe
  const currentEMAs = useMemo((): EMAData | null => {
    if (!currentKlines.length) return null;
    const closes = currentKlines.map((k) => k.close);
    return calculateMultipleEMAs(closes);
  }, [currentKlines]);

  // Get technical levels for current timeframe
  const currentTechnicalLevels = useMemo(() => {
    if (!allTimeframeLevels) return technicalLevels;
    const tfLevels = allTimeframeLevels[chartTimeframe as keyof AllTimeframeLevels];
    return tfLevels || technicalLevels;
  }, [allTimeframeLevels, chartTimeframe, technicalLevels]);

  // Calculate total OI from futures data
  const totalOI = futuresData?.openInterest
    ? futuresData.openInterest.btc + futuresData.openInterest.eth + futuresData.openInterest.sol
    : 0;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 sticky top-0 bg-gray-950/95 backdrop-blur z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="w-7 h-7 text-blue-500" />
              <div>
                <h1 className="text-lg font-bold">Crypto Intelligence</h1>
                <p className="text-[10px] text-gray-500">KI-gestützte Marktanalyse</p>
              </div>
            </div>

            {/* Global Stats inline - Desktop */}
            {marketData?.global && (
              <div className="hidden md:flex items-center gap-4 text-xs">
                <div className="text-gray-400">
                  MCap: <span className="text-white font-medium">
                    ${(marketData.global.totalMarketCap / 1e12).toFixed(2)}T
                  </span>
                </div>
                <div className="text-gray-400">
                  Vol 24h: <span className="text-white font-medium">
                    ${(marketData.global.totalVolume / 1e9).toFixed(1)}B
                  </span>
                </div>
                <div className="text-gray-400">
                  BTC Dom: <span className="text-yellow-400 font-medium">
                    {marketData.global.btcDominance.toFixed(1)}%
                  </span>
                </div>
              </div>
            )}

            {/* Global Stats - Mobile (compact) */}
            {marketData?.global && (
              <div className="flex md:hidden items-center gap-2 text-[10px]">
                <span className="text-yellow-400 font-medium">
                  BTC {marketData.global.btcDominance.toFixed(1)}%
                </span>
                <span className="text-gray-600">|</span>
                <span className="text-white font-medium">
                  ${(marketData.global.totalMarketCap / 1e12).toFixed(1)}T
                </span>
              </div>
            )}

            <div className="flex items-center gap-2">
              {/* WebSocket Status */}
              <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-gray-800/50 rounded text-xs" title={`WebSocket: ${connectionState}`}>
                <div className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-500 animate-pulse' :
                  connectionState === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                  'bg-red-500'
                }`}></div>
                <span className="text-gray-400 text-[10px]">LIVE</span>
              </div>

              {/* System Clock */}
              <SystemClock />

              {/* Last Updated */}
              {lastUpdated && (
                <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-gray-800/50 rounded text-xs" title={`Aktualisiert: ${lastUpdated.toLocaleTimeString('de-DE')}`}>
                  <RefreshCw className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-400 text-[10px]">
                    {Math.floor((Date.now() - lastUpdated.getTime()) / 60000) < 1
                      ? 'Jetzt'
                      : `${Math.floor((Date.now() - lastUpdated.getTime()) / 60000)}m`}
                  </span>
                </div>
              )}

              <button
                onClick={generateIntelligenceReport}
                disabled={analyzing}
                className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 rounded-lg text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                aria-label="KI-Report generieren"
              >
                <Brain className={`w-3.5 h-3.5 ${analyzing ? 'animate-pulse' : ''}`} />
                {analyzing ? 'Analysiere...' : 'Report'}
              </button>
              <button
                onClick={() => {
                  fetchData();
                  fetchTradeRecommendations();
                  setLastUpdated(new Date());
                }}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                aria-label="Daten aktualisieren"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <ThemeToggle />
              <AuthButton />
              <SettingsButton />
            </div>
          </div>
        </div>
      </header>

      {/* News Ticker */}
      <NewsTicker headlines={newsHeadlines} />

      {/* Main Layout */}
      <div className="flex">
        {/* Left Sidebar - Fixed */}
        <aside className="hidden lg:block w-64 fixed left-0 top-[97px] h-[calc(100vh-97px)] overflow-hidden">
          {marketData && (
            <TrendingSidebar
              coins={marketData.coins}
              fearGreed={marketData.fearGreed}
              selectedCoin={selectedAnalysisCoin}
              onCoinSelect={handleCoinSelect}
              onCoinDetailClick={(coin) => setModalCoin(coin)}
              onAddCustomCoin={handleAddCustomCoin}
              customCoins={customCoins}
            />
          )}
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Market Snapshot */}
          <MarketSnapshot
            fundingRate={futuresData?.fundingRates ? {
              btc: futuresData.fundingRates.btc,
              eth: futuresData.fundingRates.eth,
            } : undefined}
            sentiment={redditData?.overall ? {
              type: redditData.overall.sentiment,
              score: redditData.overall.sentimentScore,
            } : undefined}
            keyLevels={technicalLevels ? {
              support: technicalLevels.keySupport,
              resistance: technicalLevels.keyResistance,
            } : undefined}
            btcPrice={btcPrice}
            loading={loading}
          />

          {/* Indikator-Preset Selector & Market Sessions */}
          <div className="mb-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <PresetSelector
              selectedPreset={selectedPreset}
              onPresetChange={(preset) => setSelectedPreset(preset)}
              currentTimeframe={chartTimeframe}
              autoSwitch={presetAutoSwitch}
              onAutoSwitchChange={(enabled) => {
                setPresetAutoSwitch(enabled);
                if (enabled) {
                  // Bei Aktivierung sofort das passende Preset setzen
                  const recommendedId = recommendPreset(chartTimeframe);
                  const recommended = getPresetById(recommendedId);
                  if (recommended) setSelectedPreset(recommended);
                }
              }}
            />
            <MarketSessions />
          </div>

          {/* Analyse-Gewichtung Panel */}
          <div className="mb-4 bg-gray-900/50 border border-gray-800 rounded-lg px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400 font-medium">Analyse-Gewichtung:</span>
              <div className="flex items-center gap-2">
                {/* Quick Preset Buttons */}
                <button
                  onClick={() => setAnalysisWeights({ technical: 100, sentiment: 0 })}
                  className={`px-2 py-1 text-[10px] rounded transition-colors ${
                    analysisWeights.technical === 100
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  100% Tech
                </button>
                <button
                  onClick={() => setAnalysisWeights({ technical: 70, sentiment: 30 })}
                  className={`px-2 py-1 text-[10px] rounded transition-colors ${
                    analysisWeights.technical === 70
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  70/30
                </button>
                <button
                  onClick={() => setAnalysisWeights({ technical: 50, sentiment: 50 })}
                  className={`px-2 py-1 text-[10px] rounded transition-colors ${
                    analysisWeights.technical === 50
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  50/50
                </button>
                <button
                  onClick={() => setAnalysisWeights({ technical: 0, sentiment: 100 })}
                  className={`px-2 py-1 text-[10px] rounded transition-colors ${
                    analysisWeights.sentiment === 100
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  100% Sent
                </button>
              </div>
            </div>

            {/* Visual Weight Bar */}
            <div className="flex items-center gap-3">
              {/* Technical Label */}
              <div className="flex items-center gap-1.5 min-w-[90px]">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                <span className="text-xs text-blue-400 font-medium">Technisch</span>
              </div>

              {/* Slider with visual bar */}
              <div className="flex-1 relative">
                {/* Background bar showing split */}
                <div className="h-3 rounded-full overflow-hidden flex bg-gray-700">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-blue-500 transition-all duration-200"
                    style={{ width: `${analysisWeights.technical}%` }}
                  ></div>
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-200"
                    style={{ width: `${analysisWeights.sentiment}%` }}
                  ></div>
                </div>

                {/* Slider input overlay */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="10"
                  value={analysisWeights.technical}
                  onChange={(e) => {
                    const tech = parseInt(e.target.value);
                    setAnalysisWeights({ technical: tech, sentiment: 100 - tech });
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                {/* Percentage labels */}
                <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
                  <span className="text-[10px] font-bold text-white drop-shadow-lg">
                    {analysisWeights.technical}%
                  </span>
                  <span className="text-[10px] font-bold text-white drop-shadow-lg">
                    {analysisWeights.sentiment}%
                  </span>
                </div>
              </div>

              {/* Sentiment Label */}
              <div className="flex items-center gap-1.5 min-w-[80px] justify-end">
                <span className="text-xs text-purple-400 font-medium">Sentiment</span>
                <div className="w-2.5 h-2.5 rounded-full bg-purple-500"></div>
              </div>
            </div>

            {/* Current Score Breakdown (if scores available) */}
            {Object.keys(tradeScores).length > 0 && (() => {
              const bestScore = Object.values(tradeScores).find(s => s.rank === 1);
              if (!bestScore || bestScore.total === 0) return null;
              return (
                <div className="mt-3 pt-3 border-t border-gray-700/50 flex items-center justify-between text-[10px]">
                  <span className="text-gray-500">Aktueller Best-Trade Score:</span>
                  <div className="flex items-center gap-3">
                    <span className="text-blue-400">
                      Tech: {bestScore.technicalScore}/100
                    </span>
                    <span className="text-gray-600">|</span>
                    <span className="text-purple-400">
                      Sent: {bestScore.sentimentScore}/100
                    </span>
                    <span className="text-gray-600">|</span>
                    <span className="text-white font-bold">
                      Gewichtet: {bestScore.total}/100
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Trade Recommendations */}
          <TradeRecommendations
            recommendations={tradeRecommendations}
            scores={tradeScores}
            hedgeRecommendation={hedgeRecommendation}
            currentPrice={selectedAnalysisCoin?.price || btcPrice}
            coinSymbol={selectedAnalysisCoin?.symbol || 'BTC'}
            coinImage={selectedAnalysisCoin?.image}
            loading={loadingTrades}
            onCardClick={(tf) => {
              // Open modal for selected coin
              if (selectedAnalysisCoin) {
                setModalCoin(selectedAnalysisCoin);
              }
            }}
          />

          {/* Inline Chart with EMAs */}
          {currentKlines.length > 0 && (
            <div className="mb-6">
              {/* Chart Header with Coin Analysis Button */}
              {selectedAnalysisCoin && (
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {selectedAnalysisCoin.image && (
                      <img src={selectedAnalysisCoin.image} alt={selectedAnalysisCoin.name} className="w-6 h-6 rounded-full" />
                    )}
                    <span className="font-medium">{selectedAnalysisCoin.symbol.toUpperCase()}</span>
                    <span className={`text-sm ${selectedAnalysisCoin.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {selectedAnalysisCoin.change24h >= 0 ? '+' : ''}{selectedAnalysisCoin.change24h.toFixed(2)}%
                    </span>
                  </div>
                  <button
                    onClick={() => generateCoinReport(selectedAnalysisCoin)}
                    disabled={analyzingCoin}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 rounded-lg text-xs font-medium transition-colors"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${analyzingCoin ? 'animate-pulse' : ''}`} />
                    {analyzingCoin ? 'Analysiere...' : `${selectedAnalysisCoin.symbol.toUpperCase()} analysieren`}
                  </button>
                </div>
              )}
              <InlineChart
                symbol={selectedAnalysisCoin?.symbol || 'BTC'}
                klines={currentKlines}
                technicalLevels={currentTechnicalLevels || undefined}
                tradeSetup={tradeRecommendations[chartTimeframe] || null}
                selectedTimeframe={chartTimeframe}
                onTimeframeChange={setChartTimeframe}
                height={450}
              />
            </div>
          )}

          {/* Confluence Zones */}
          <ConfluenceZones
            zones={confluenceZones}
            currentPrice={selectedAnalysisCoin?.price || btcPrice}
          />

          {/* Mini Widgets */}
          <MiniWidgets
            reddit={redditData?.overall ? {
              sentiment: redditData.overall.sentiment,
              score: redditData.overall.sentimentScore,
              topTopic: redditData.overall.trendingTopics[0],
            } : undefined}
            defi={defiData ? {
              tvl: defiData.totalTvl,
              tvlChange24h: defiData.totalTvlChange24h,
            } : undefined}
            futures={futuresData ? {
              openInterest: totalOI,
              oiChange24h: 0, // TODO: Calculate actual change
            } : undefined}
          />

          {/* YouTube Player Section */}
          <YouTubeSection />

          {/* Guru Watcher - Twitter Influencer Sentiment */}
          <GuruWatcher />

          {/* Telegram Sentiment */}
          <TelegramSentiment />

          {/* Mobile: Show coins in grid */}
          <div className="lg:hidden mt-6">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">Top Coins - Tippen für Analyse</h3>
            <div className="grid grid-cols-3 gap-2">
              {marketData?.coins.slice(0, 9).map((coin, index) => (
                <button
                  key={coin.id || `coin-${coin.symbol}-${index}`}
                  onClick={() => handleCoinSelect(coin)}
                  className={`bg-gray-900/50 border rounded-lg p-2 text-center transition-colors ${
                    selectedAnalysisCoin?.symbol === coin.symbol
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-800 hover:bg-gray-800/50'
                  }`}
                >
                  <img src={coin.image} alt={coin.name} className="w-6 h-6 mx-auto mb-1 rounded-full" />
                  <div className="text-xs font-medium">{coin.symbol.toUpperCase()}</div>
                  <div className={`text-[10px] ${coin.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(1)}%
                  </div>
                </button>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-12 lg:ml-64">
        <div className="px-4 py-3 text-center text-[10px] text-gray-500">
          Crypto Intelligence - Daten von CoinGecko, DefiLlama, Reddit, Binance, Mempool.space & Groq AI
        </div>
      </footer>

      {/* Intelligence Report Modal */}
      {intelligenceReport && !showPresentation && (
        <IntelligenceReport
          report={intelligenceReport}
          technicalLevels={technicalLevels || undefined}
          multiTimeframe={multiTimeframe || undefined}
          fearGreed={marketData?.fearGreed?.value}
          topCoins={marketData?.coins.slice(0, 5).map(c => ({ symbol: c.symbol, change24h: c.change24h }))}
          onClose={() => setIntelligenceReport(null)}
          onOpenPresentation={() => setShowPresentation(true)}
        />
      )}

      {/* Presentation Mode */}
      {showPresentation && intelligenceReport && (
        <PresentationMode
          report={intelligenceReport}
          technicalLevels={technicalLevels || undefined}
          multiTimeframe={multiTimeframe || undefined}
          fearGreed={marketData?.fearGreed?.value}
          topCoins={marketData?.coins.slice(0, 5).map(c => ({ symbol: c.symbol, change24h: c.change24h }))}
          onClose={() => setShowPresentation(false)}
        />
      )}

      {/* Coin Detail Modal */}
      {modalCoin && (
        <CoinDetailModal
          coin={modalCoin}
          onClose={() => setModalCoin(null)}
          tradeRecommendations={
            modalCoin.symbol === selectedAnalysisCoin?.symbol
              ? tradeRecommendations
              : undefined
          }
        />
      )}

      {/* Coin Intelligence Report Modal */}
      {coinReport && selectedAnalysisCoin && (
        <CoinIntelligenceReport
          report={coinReport}
          coin={selectedAnalysisCoin}
          onClose={() => setCoinReport(null)}
        />
      )}
    </div>
  );
}
