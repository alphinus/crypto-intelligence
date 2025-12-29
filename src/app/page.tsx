'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { RefreshCw, Brain, AlertCircle, Clock, Sparkles, AlertTriangle, TrendingUp, Zap, Bell, LayoutList, PanelRight } from 'lucide-react';
import { NewsTicker } from '@/components/NewsTicker';
import { TrendingSidebar } from '@/components/TrendingSidebar';
import { TradeRecommendations } from '@/components/TradeRecommendations';
import { CollapsibleSection } from '@/components/CollapsibleSection';
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
import { YouTubeSection } from '@/components/YouTubeSection';
import { GuruWatcher } from '@/components/GuruWatcher';
import { TelegramSentiment } from '@/components/TelegramSentiment';
import { HeaderMenu } from '@/components/HeaderMenu';
import { SessionTimer } from '@/components/SessionTimer';
import { MobileDrawer } from '@/components/MobileDrawer';
import { MemeCoinsPanel } from '@/components/MemeCoinsPanel';
import { CoinSelectorBar } from '@/components/CoinSelectorBar';
import { SimulatorPanel } from '@/components/SimulatorPanel';
import { SpotDCAPanel } from '@/components/SpotDCA';
import { TabNavigation, type TabId } from '@/components/Layout/TabNavigation';
import { TabPanel, TabPanelPersistent } from '@/components/Layout/TabPanel';
import { Header } from '@/components/layout/Header';
import { AnimatePresence } from 'framer-motion';
import { AlertNotificationsContainer, AlertManager } from '@/components/Alerts';
import { LiquidationFeed, LiquidationStats, LiquidationHeatmap, LiquidationMini } from '@/components/Liquidations';
import { ConfluenceWidget } from '@/components/ConfluenceWidget';
import { GainerLoserTicker } from '@/components/GainerLoserTicker';
import { usePriceAlerts } from '@/hooks/usePriceAlerts';
import { useAlertChecker } from '@/hooks/useAlertChecker';
import { useLiquidationStream } from '@/hooks/useLiquidationStream';
import { calculateLiquidationLevels } from '@/lib/liquidation-levels';
import { playAlertSound } from '@/lib/alert-sound';
import { HelpProvider, Avatar, OnboardingTour } from '@/components/Help';
import { useTheme } from '@/contexts/ThemeContext';

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


export default function Home() {
  const { theme } = useTheme();
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
  const [activeTab, setActiveTab] = useState<TabId>('trading');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [tradeSignalsLayout, setTradeSignalsLayout] = useState<'below' | 'sidebar'>('below');

  // Sentiment Mode: how sentiment affects trade direction
  // - 'filter': Only show trades where sentiment agrees with technical
  // - 'combined': Weight both signals to determine direction
  // - 'info': Technical determines direction, sentiment shown as info only
  const [sentimentMode, setSentimentMode] = useState<'filter' | 'combined' | 'info'>('info');

  // Current sentiment signal (calculated from available data)
  const [currentSentimentSignal, setCurrentSentimentSignal] = useState<{
    direction: 'bullish' | 'bearish' | 'neutral';
    score: number;
    confidence: 'high' | 'medium' | 'low';
  } | null>(null);

  // Conflict detection: technical direction vs sentiment direction
  const [sentimentConflict, setSentimentConflict] = useState<{
    hasConflict: boolean;
    technicalDirection: 'long' | 'short' | 'wait';
    sentimentDirection: 'bullish' | 'bearish' | 'neutral';
    message: string;
  } | null>(null);

  // Price Alerts
  const {
    alerts,
    notifications,
    addAlert,
    removeAlert,
    toggleAlert,
    markTriggered,
    addNotification,
    dismissNotification,
  } = usePriceAlerts();

  // Alert Checker - monitors price changes and triggers alerts
  useAlertChecker(
    alerts,
    multiTimeframe?.currentPrice || 0,
    selectedAnalysisCoin?.symbol || 'BTC',
    tradeRecommendations,
    currentSentimentSignal,
    (info) => {
      // Mark the alert as triggered
      markTriggered(info.alert.id, info.currentPrice);
      // Show notification
      addNotification(info.alert, info.currentPrice, info.message);
    }
  );

  // Liquidation Stream
  const [showLiquidations, setShowLiquidations] = useState(false);
  const { liquidations, stats: liquidationStats, isConnected: liquidationConnected } = useLiquidationStream({
    symbols: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'],
    enabled: showLiquidations,
    onLargeLiquidation: (liq) => {
      // Play sound for large liquidations (>$100k)
      playAlertSound('alert', 0.3);
    },
    largeLiquidationThreshold: 100000,
  });

  // Calculate liquidation levels based on open interest
  const liquidationLevels = useMemo(() => {
    if (!futuresData?.openInterest || !multiTimeframe?.currentPrice) return [];
    const symbol = selectedAnalysisCoin?.symbol?.toUpperCase() || 'BTC';
    const oi = symbol === 'BTC' ? futuresData.openInterest.btc :
      symbol === 'ETH' ? futuresData.openInterest.eth :
        futuresData.openInterest.sol;
    return calculateLiquidationLevels(multiTimeframe.currentPrice, oi);
  }, [futuresData?.openInterest, multiTimeframe?.currentPrice, selectedAnalysisCoin?.symbol]);

  // Satoshi Chat Context - provides live data to Satoshi AI
  const satoshiContext = useMemo(() => ({
    selectedCoin: selectedAnalysisCoin ? {
      symbol: (selectedAnalysisCoin.symbol?.toUpperCase() || 'BTC') + 'USDT',
      name: selectedAnalysisCoin.name,
      price: selectedAnalysisCoin.price || 0,
      change24h: selectedAnalysisCoin.change24h || 0,
    } : null,
    tradeRecommendations: tradeRecommendations as Record<string, TimeframeTradeSetup> | null,
    tradeScores,
    fearGreed: marketData?.fearGreed || null,
    futuresData: futuresData ? {
      fundingRates: futuresData.fundingRates,
      longShortRatio: futuresData.longShortRatio,
    } : null,
    topCoins: marketData?.coins || null,
    allCoins: marketData?.coins || null, // Alle Coins für Kursabfragen
  }), [selectedAnalysisCoin, tradeRecommendations, tradeScores, marketData?.fearGreed, marketData?.coins, futuresData]);

  // Client-side cache to reduce Vercel invocations
  const coinAnalysisCache = useRef<Map<string, { data: unknown; timestamp: number }>>(new Map());
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Cooldowns for rate limiting
  const lastReportTime = useRef<number>(0);
  const lastCoinReportTime = useRef<number>(0);
  const REPORT_COOLDOWN = 3 * 60 * 1000; // 3 minutes between reports

  // WebSocket for live kline updates
  const handleKlineUpdate = useCallback((kline: Kline, isClosed: boolean) => {
    setMultiTimeframe((prev) => {
      if (!prev) return prev;

      // CRITICAL: Validate that the kline belongs to the currently selected coin
      // This prevents stale data from old WebSocket connections showing in the chart
      const expectedSymbol = selectedAnalysisCoin?.symbol?.toUpperCase();
      if (expectedSymbol && prev.symbol !== expectedSymbol) {
        // Ignore kline updates for different symbols (race condition prevention)
        return prev;
      }

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
  }, [chartTimeframe, selectedAnalysisCoin?.symbol]);

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

  // Sentiment Signal Result
  interface SentimentSignal {
    direction: 'bullish' | 'bearish' | 'neutral';
    score: number; // -100 to +100
    confidence: 'high' | 'medium' | 'low';
    sources: {
      fearGreed: { value: number; direction: 'bullish' | 'bearish' | 'neutral' };
      social: { value: number; direction: 'bullish' | 'bearish' | 'neutral' };
      funding: { value: number | null; direction: 'bullish' | 'bearish' | 'neutral' };
    };
  }

  // Calculate Sentiment Signal from available data
  const calculateSentimentSignal = (sentimentData: SentimentData | null): SentimentSignal => {
    const defaultSignal: SentimentSignal = {
      direction: 'neutral',
      score: 0,
      confidence: 'low',
      sources: {
        fearGreed: { value: 50, direction: 'neutral' },
        social: { value: 0, direction: 'neutral' },
        funding: { value: null, direction: 'neutral' },
      },
    };

    if (!sentimentData) return defaultSignal;

    // 1. Fear & Greed Index (0-100) -> -100 to +100
    // 0-25: Extreme Fear (bearish contrarian = bullish)
    // 25-45: Fear (bearish)
    // 45-55: Neutral
    // 55-75: Greed (bullish)
    // 75-100: Extreme Greed (bullish contrarian = bearish)
    let fearGreedScore = 0;
    let fearGreedDirection: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    const fg = sentimentData.fearGreedValue;

    if (fg <= 25) {
      // Extreme Fear -> Contrarian bullish (but less confident)
      fearGreedScore = 30; // Mild bullish
      fearGreedDirection = 'bullish';
    } else if (fg <= 45) {
      fearGreedScore = -((45 - fg) / 20) * 50; // -50 to 0
      fearGreedDirection = 'bearish';
    } else if (fg <= 55) {
      fearGreedScore = 0;
      fearGreedDirection = 'neutral';
    } else if (fg <= 75) {
      fearGreedScore = ((fg - 55) / 20) * 50; // 0 to +50
      fearGreedDirection = 'bullish';
    } else {
      // Extreme Greed -> Contrarian bearish
      fearGreedScore = -30; // Mild bearish
      fearGreedDirection = 'bearish';
    }

    // 2. Social Sentiment (already -100 to +100)
    const socialScore = sentimentData.socialScore;
    const socialDirection = sentimentData.socialSentiment;

    // 3. Funding Rate (negative = shorts pay longs = bullish, positive = longs pay shorts = bearish)
    let fundingScore = 0;
    let fundingDirection: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    if (sentimentData.fundingRate !== null) {
      const fr = sentimentData.fundingRate;
      if (fr < -0.01) {
        fundingScore = 50; // Strong negative funding = bullish
        fundingDirection = 'bullish';
      } else if (fr < 0) {
        fundingScore = 25;
        fundingDirection = 'bullish';
      } else if (fr > 0.01) {
        fundingScore = -50; // Strong positive funding = bearish
        fundingDirection = 'bearish';
      } else if (fr > 0) {
        fundingScore = -25;
        fundingDirection = 'bearish';
      }
    }

    // Weighted combination: Fear&Greed 40%, Social 40%, Funding 20%
    const combinedScore = fearGreedScore * 0.4 + socialScore * 0.4 + fundingScore * 0.2;

    // Determine direction
    let direction: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    if (combinedScore > 20) {
      direction = 'bullish';
    } else if (combinedScore < -20) {
      direction = 'bearish';
    }

    // Determine confidence based on agreement between sources
    const directions = [fearGreedDirection, socialDirection, fundingDirection];
    const bullishCount = directions.filter(d => d === 'bullish').length;
    const bearishCount = directions.filter(d => d === 'bearish').length;

    let confidence: 'high' | 'medium' | 'low' = 'low';
    if (bullishCount >= 2 || bearishCount >= 2) {
      confidence = bullishCount === 3 || bearishCount === 3 ? 'high' : 'medium';
    }

    return {
      direction,
      score: Math.round(combinedScore),
      confidence,
      sources: {
        fearGreed: { value: sentimentData.fearGreedValue, direction: fearGreedDirection },
        social: { value: sentimentData.socialScore, direction: socialDirection },
        funding: { value: sentimentData.fundingRate, direction: fundingDirection },
      },
    };
  };

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

  // Fetch trade recommendations for selected coin (with client-side caching)
  const fetchTradeRecommendations = useCallback(async (symbol: string = 'BTC', forceRefresh = false) => {
    // Check client-side cache first to reduce API calls
    const cacheKey = symbol.toUpperCase();
    const cached = coinAnalysisCache.current.get(cacheKey);
    const now = Date.now();

    // Skip API call if we have recent cached data (unless force refresh)
    if (!forceRefresh && cached && (now - cached.timestamp) < CACHE_DURATION) {
      console.log(`[Cache] Using cached data for ${cacheKey} (${Math.round((now - cached.timestamp) / 1000)}s old)`);
      return; // Data already loaded from previous fetch
    }

    setLoadingTrades(true);
    try {
      // WICHTIG: full=true für Multi-Timeframe Daten
      const res = await fetch(`/api/coin-analysis?symbol=${symbol}&full=true`);
      const data = await res.json();

      // Cache the result
      coinAnalysisCache.current.set(cacheKey, { data, timestamp: now });

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

        // Calculate sentiment signal
        const sentimentSignal = calculateSentimentSignal(currentSentimentData);
        setCurrentSentimentSignal({
          direction: sentimentSignal.direction,
          score: sentimentSignal.score,
          confidence: sentimentSignal.confidence,
        });

        // Determine primary technical direction (from best ranked timeframe)
        const primaryTf = '1h'; // Default to 1h for conflict detection
        const primaryRecommendation = recommendations[primaryTf];
        const techDirection = primaryRecommendation?.type || 'wait';

        // Detect conflict between technical and sentiment
        const isConflict =
          (techDirection === 'long' && sentimentSignal.direction === 'bearish') ||
          (techDirection === 'short' && sentimentSignal.direction === 'bullish');

        if (isConflict && sentimentMode !== 'info') {
          setSentimentConflict({
            hasConflict: true,
            technicalDirection: techDirection,
            sentimentDirection: sentimentSignal.direction,
            message: techDirection === 'long'
              ? `⚠️ Technik signalisiert LONG, aber Sentiment ist bearish (${sentimentSignal.score})`
              : `⚠️ Technik signalisiert SHORT, aber Sentiment ist bullish (${sentimentSignal.score})`,
          });
        } else {
          setSentimentConflict(null);
        }

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
  }, [marketData?.fearGreed, redditData?.overall, futuresData?.fundingRates, analysisWeights, sentimentMode]);

  // Handle coin selection for analysis
  const handleCoinSelect = useCallback((coin: MarketData) => {
    // Update selected coin
    setSelectedAnalysisCoin(coin);

    // CRITICAL: Reset all coin-specific state IMMEDIATELY to prevent stale data
    // This fixes the bug where old coin data appears when switching coins
    setMultiTimeframe(null);
    setTechnicalLevels(null);
    setTradeRecommendations({});
    setConfluenceZones([]);
    setAllTimeframeLevels(null);
    setTradeScores({});
    setHedgeRecommendation(null);
    setCoinReport(null);

    // Then fetch new data for the selected coin
    fetchTradeRecommendations(coin.symbol);
  }, [fetchTradeRecommendations]);

  // Add custom coin by symbol (fetches from Binance)
  const handleAddCustomCoin = useCallback(async (symbol: string): Promise<MarketData | null> => {
    try {
      // Normalize symbol: strip trailing USDT if present to avoid double-USDT bug
      const normalizedSymbol = symbol.toUpperCase().replace(/USDT$/, '');

      // Check if already exists in coins or customCoins
      const existsInCoins = marketData?.coins.some(
        (c) => c.symbol.toLowerCase() === normalizedSymbol.toLowerCase()
      );
      const existsInCustom = customCoins.some(
        (c) => c.symbol.toLowerCase() === normalizedSymbol.toLowerCase()
      );

      if (existsInCoins || existsInCustom) {
        // Already exists, just select it
        const existing = marketData?.coins.find(
          (c) => c.symbol.toLowerCase() === normalizedSymbol.toLowerCase()
        ) || customCoins.find(
          (c) => c.symbol.toLowerCase() === normalizedSymbol.toLowerCase()
        );
        if (existing) {
          handleCoinSelect(existing);
          return existing;
        }
      }

      // Fetch price from Binance
      const binanceSymbol = normalizedSymbol + 'USDT';
      const response = await fetch(
        `https://api.binance.com/api/v3/ticker/24hr?symbol=${binanceSymbol}`
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      const newCoin: MarketData = {
        id: `custom-${normalizedSymbol.toLowerCase()}`,
        symbol: normalizedSymbol.toLowerCase(),
        name: normalizedSymbol.toUpperCase(),
        price: parseFloat(data.lastPrice),
        change24h: parseFloat(data.priceChangePercent),
        marketCap: 0,
        volume24h: parseFloat(data.volume),
        image: '',
      };

      setCustomCoins((prev) => {
        // Prevent duplicates
        if (prev.some((c) => c.symbol.toLowerCase() === normalizedSymbol.toLowerCase())) {
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
    // Rate limiting: Check cooldown
    const now = Date.now();
    const timeSinceLastReport = now - lastCoinReportTime.current;
    if (timeSinceLastReport < REPORT_COOLDOWN) {
      const waitSeconds = Math.ceil((REPORT_COOLDOWN - timeSinceLastReport) / 1000);
      alert(`Bitte warte noch ${waitSeconds} Sekunden bevor du einen neuen Coin-Report generierst.`);
      return;
    }

    setAnalyzingCoin(true);
    lastCoinReportTime.current = now;
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
    // Rate limiting: Check cooldown
    const now = Date.now();
    const timeSinceLastReport = now - lastReportTime.current;
    if (timeSinceLastReport < REPORT_COOLDOWN) {
      const waitSeconds = Math.ceil((REPORT_COOLDOWN - timeSinceLastReport) / 1000);
      alert(`Bitte warte noch ${waitSeconds} Sekunden bevor du einen neuen Market-Report generierst.`);
      return;
    }

    setAnalyzing(true);
    lastReportTime.current = now;
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

  // Separate interval for auto-refresh (every 15 minutes - reduced from 5 to save Vercel invocations)
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
    }, 900000); // 15 min (was 300000 = 5 min)
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
    <HelpProvider>
      <div className="min-h-screen bg-gray-950 text-white">
        {/* Header */}
        <Header
          marketData={marketData}
          setMobileDrawerOpen={setMobileDrawerOpen}
          isConnected={isConnected}
          connectionState={connectionState}
          analyzing={analyzing}
          generateIntelligenceReport={generateIntelligenceReport}
          loading={loading}
          fetchData={fetchData}
          fetchTradeRecommendations={() => selectedAnalysisCoin && fetchTradeRecommendations(selectedAnalysisCoin.symbol)}
          setLastUpdated={setLastUpdated}
        />

        {/* News Ticker */}
        <NewsTicker headlines={newsHeadlines} />

        {/* Gainer/Loser Ticker */}
        {marketData?.coins && marketData.coins.length > 0 && (
          <div data-tour="gainer-ticker">
            <GainerLoserTicker
              coins={marketData.coins.map(c => ({
                symbol: c.symbol,
                name: c.name,
                price: c.price,
                change24h: c.change24h,
                image: c.image,
              }))}
              onCoinClick={(symbol) => {
                const coin = marketData.coins.find(c => c.symbol.toLowerCase() === symbol.toLowerCase());
                if (coin) handleCoinSelect(coin);
              }}
            />
          </div>
        )}

        {/* Main Layout - Flex Container ensuring full height and equal columns */}
        <div className="flex min-h-[calc(100vh-177px)] items-stretch">
          {/* Left Sidebar - Sticky with dynamic offset to handle scrolling tickers */}
          <aside className="hidden lg:block w-64 flex-shrink-0 border-r border-gray-800 bg-gray-900/50 relative z-20" data-tour="sidebar">
            <div className="sticky top-[65px] h-[calc(100vh-65px)] overflow-hidden">
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
            </div>
          </aside>

          {/* Main Content with Tabs */}
          <main className="flex-1 min-w-0 flex flex-col">
            {/* Tab Navigation */}
            <div data-tour="tabs">
              <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
            </div>

            {/* Tab Content */}
            <div className="p-4">
              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              {/* TAB 1: Trading */}
              <TabPanel id="trading" activeTab={activeTab}>
                {/* Coin Selector Bar - Desktop only (mobile uses drawer) */}
                <div className="hidden lg:block mb-4">
                  <CoinSelectorBar
                    coins={[
                      ...(marketData?.coins.slice(0, 6).map(c => ({
                        symbol: c.symbol.toUpperCase() + 'USDT',
                        name: c.name,
                        price: c.price,
                        change24h: c.change24h,
                      })) || []),
                      ...customCoins.map(c => ({
                        symbol: c.symbol.toUpperCase() + 'USDT',
                        name: c.name,
                        price: c.price,
                        change24h: c.change24h,
                      })),
                    ]}
                    selectedSymbol={(selectedAnalysisCoin?.symbol?.toUpperCase() || 'BTC') + 'USDT'}
                    onSelect={(symbol) => {
                      const baseSymbol = symbol.replace('USDT', '').toLowerCase();
                      const coin = marketData?.coins.find(c => c.symbol.toLowerCase() === baseSymbol) ||
                        customCoins.find(c => c.symbol.toLowerCase() === baseSymbol);
                      if (coin) handleCoinSelect(coin);
                    }}
                    onAddCustom={(symbol) => handleAddCustomCoin(symbol.replace('USDT', ''))}
                    onRemove={(symbol) => {
                      const baseSymbol = symbol.replace('USDT', '').toLowerCase();
                      setCustomCoins(prev => prev.filter(c => c.symbol.toLowerCase() !== baseSymbol));
                    }}
                  />
                </div>

                {/* Chart Segment */}
                <div className={`flex gap-4 ${tradeSignalsLayout === 'sidebar' ? 'flex-row' : 'flex-col'}`}>
                  {/* CHART FIRST - Primary Focus */}
                  <div className={`${tradeSignalsLayout === 'sidebar' ? 'flex-1 min-w-0' : 'w-full'}`} data-tour="chart">
                    {currentKlines.length > 0 ? (
                      <InlineChart
                        symbol={selectedAnalysisCoin?.symbol || 'BTC'}
                        klines={currentKlines}
                        technicalLevels={currentTechnicalLevels || undefined}
                        tradeSetup={tradeRecommendations[chartTimeframe] || null}
                        selectedTimeframe={chartTimeframe}
                        onTimeframeChange={setChartTimeframe}
                        height={550}
                        theme={theme}
                        confluenceZones={confluenceZones}
                        onAiAnalyze={selectedAnalysisCoin ? () => generateCoinReport(selectedAnalysisCoin) : undefined}
                        isAnalyzing={analyzingCoin}
                        tradeSignalsCount={Object.values(tradeRecommendations).filter(r => r && r.type !== 'wait').length}
                        onLayoutChange={setTradeSignalsLayout}
                        currentLayout={tradeSignalsLayout}
                      />
                    ) : (
                      <div className="h-[550px] bg-gray-900/50 rounded-lg flex items-center justify-center border border-gray-800">
                        <div className="text-gray-500">Chart loading...</div>
                      </div>
                    )}
                  </div>

                  {/* Trade Recommendations - Sidebar Mode - Full Height */}
                  {tradeSignalsLayout === 'sidebar' && (
                    <div className="w-80 flex-shrink-0 border-l border-gray-800 pl-4 flex flex-col h-full" data-tour="trade-signals">
                      <div className="flex-1 overflow-y-auto pr-1">
                        <TradeRecommendations
                          recommendations={tradeRecommendations}
                          scores={tradeScores}
                          hedgeRecommendation={hedgeRecommendation}
                          currentPrice={selectedAnalysisCoin?.price || btcPrice}
                          coinSymbol={selectedAnalysisCoin?.symbol || 'BTC'}
                          coinImage={selectedAnalysisCoin?.image}
                          loading={loadingTrades}
                          onCardClick={() => {
                            if (selectedAnalysisCoin) setModalCoin(selectedAnalysisCoin);
                          }}
                          sentimentConflict={sentimentConflict}
                          sentimentSignal={currentSentimentSignal}
                          sentimentMode={sentimentMode}
                          layout="stacked"
                        />

                        {/* Confluence Zones in Sidebar */}
                        {confluenceZones.length > 0 && (
                          <div data-tour="confluence">
                            <ConfluenceWidget
                              zones={confluenceZones}
                              currentPrice={multiTimeframe?.currentPrice || selectedAnalysisCoin?.price || 0}
                            />
                          </div>
                        )}

                        {/* Liquidations Mini in Sidebar */}
                        <div data-tour="liquidations">
                          <LiquidationMini
                            stats={liquidationStats}
                            levels={liquidationLevels}
                            currentPrice={multiTimeframe?.currentPrice || 0}
                            isConnected={liquidationConnected}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Trade Recommendations - Below Mode (Collapsible) */}
                {tradeSignalsLayout === 'below' && (
                  <div className="space-y-4 mt-6" data-tour="trade-signals">
                    <CollapsibleSection
                      title="Trade Signale"
                      icon={<TrendingUp className="w-4 h-4" />}
                      defaultOpen={true}
                      badge={Object.values(tradeRecommendations).filter(r => r && r.type !== 'wait').length || undefined}
                      badgeColor="blue"
                    >
                      <TradeRecommendations
                        recommendations={tradeRecommendations}
                        scores={tradeScores}
                        hedgeRecommendation={hedgeRecommendation}
                        currentPrice={selectedAnalysisCoin?.price || btcPrice}
                        coinSymbol={selectedAnalysisCoin?.symbol || 'BTC'}
                        coinImage={selectedAnalysisCoin?.image}
                        loading={loadingTrades}
                        onCardClick={() => {
                          if (selectedAnalysisCoin) setModalCoin(selectedAnalysisCoin);
                        }}
                        sentimentConflict={sentimentConflict}
                        sentimentSignal={currentSentimentSignal}
                        sentimentMode={sentimentMode}
                      />
                    </CollapsibleSection>

                    {/* Liquidations - Collapsible */}
                    <CollapsibleSection
                      title="Liquidations"
                      icon={<Zap className="w-4 h-4 text-yellow-400" />}
                      defaultOpen={false}
                      badge={liquidationConnected ? 'Live' : undefined}
                      badgeColor="green"
                    >
                      <div className="space-y-4">
                        <LiquidationStats stats={liquidationStats} isConnected={liquidationConnected} />
                        {liquidationLevels.length > 0 && (
                          <div>
                            <div className="text-xs text-gray-400 mb-2">Liquidation Heatmap</div>
                            <LiquidationHeatmap
                              levels={liquidationLevels}
                              currentPrice={multiTimeframe?.currentPrice || 0}
                              height={150}
                            />
                          </div>
                        )}
                        <div>
                          <div className="text-xs text-gray-400 mb-2">Live Feed</div>
                          <LiquidationFeed liquidations={liquidations} maxItems={15} />
                        </div>
                      </div>
                    </CollapsibleSection>

                    {/* Price Alerts - Collapsible */}
                    <CollapsibleSection
                      title="Preisalarme"
                      icon={<Bell className="w-4 h-4" />}
                      defaultOpen={false}
                      badge={alerts.filter(a => a.enabled).length || undefined}
                      badgeColor="yellow"
                    >
                      <AlertManager
                        alerts={alerts}
                        onAddAlert={addAlert}
                        onRemoveAlert={removeAlert}
                        onToggleAlert={toggleAlert}
                        currentSymbol={selectedAnalysisCoin?.symbol || 'BTC'}
                        currentPrice={multiTimeframe?.currentPrice || selectedAnalysisCoin?.price || 0}
                      />
                    </CollapsibleSection>
                  </div>
                )}

              </TabPanel>

              {/* TAB 2: Sentiment & On-Chain */}
              <TabPanel id="sentiment" activeTab={activeTab}>
                <div data-tour="sentiment">
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
                      oiChange24h: 0,
                    } : undefined}
                  />

                  {/* Guru Watcher - Twitter Influencer Sentiment */}
                  <GuruWatcher />

                  {/* Telegram Sentiment */}
                  <TelegramSentiment />

                  {/* Bitcoin On-Chain Data (nur wenn BTC ausgewählt) */}
                  {selectedAnalysisCoin?.symbol?.toLowerCase() === 'btc' && bitcoinData && (
                    <div className="mt-6 bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <span className="text-yellow-500">₿</span> Bitcoin On-Chain Daten
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Block Height:</span>
                          <span className="text-white ml-2">{bitcoinData.blockHeight?.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Mempool Size:</span>
                          <span className="text-white ml-2">{bitcoinData.mempool?.count?.toLocaleString()} TXs</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Fast Fee:</span>
                          <span className="text-white ml-2">{bitcoinData.fees?.fastestFee} sat/vB</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Difficulty Adj:</span>
                          <span className="text-white ml-2">{bitcoinData.difficulty?.progressPercent?.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* YouTube Crypto News */}
                  <div className="mt-6">
                    <YouTubeSection />
                  </div>
                </div>
              </TabPanel>

              {/* TAB 3: Meme Coins */}
              <TabPanel id="memecoins" activeTab={activeTab}>
                <div data-tour="memecoins-tab">
                  <MemeCoinsPanel
                    onCoinSelect={(symbol) => {
                      // Find or create the coin in our list and select it
                      const existingCoin = marketData?.coins.find(c => c.symbol === symbol);
                      if (existingCoin) {
                        handleCoinSelect(existingCoin);
                        setActiveTab('trading');
                      } else {
                        // Add as custom coin
                        handleAddCustomCoin(symbol);
                        setActiveTab('trading');
                      }
                    }}
                  />
                </div>
              </TabPanel>

              {/* TAB 4: Simulator */}
              <TabPanel id="simulator" activeTab={activeTab}>
                <SimulatorPanel />
              </TabPanel>

              {/* TAB 5: Spot DCA */}
              <TabPanelPersistent id="spotdca" activeTab={activeTab}>
                <SpotDCAPanel
                  coins={marketData?.coins || []}
                  fearGreed={marketData?.fearGreed || null}
                  selectedCoin={selectedAnalysisCoin}
                  onCoinSelect={handleCoinSelect}
                />
              </TabPanelPersistent>

              {/* TAB 6: KI Reports */}
              <TabPanel id="reports" activeTab={activeTab}>
                <div className="space-y-6">
                  {/* Report Generation Buttons */}
                  <div className="flex flex-wrap gap-4">
                    <button
                      onClick={generateIntelligenceReport}
                      disabled={analyzing}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
                    >
                      <Brain className={`w-4 h-4 ${analyzing ? 'animate-pulse' : ''}`} />
                      {analyzing ? 'Analysiere Markt...' : 'Markt-Intelligence Report generieren'}
                    </button>

                    {selectedAnalysisCoin && (
                      <button
                        onClick={() => generateCoinReport(selectedAnalysisCoin)}
                        disabled={analyzingCoin}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
                      >
                        <Sparkles className={`w-4 h-4 ${analyzingCoin ? 'animate-pulse' : ''}`} />
                        {analyzingCoin ? 'Analysiere...' : `${selectedAnalysisCoin.symbol.toUpperCase()} analysieren`}
                      </button>
                    )}
                  </div>

                  {/* Reports Info */}
                  <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-3">KI-Reports</h3>
                    <p className="text-gray-400 text-sm mb-4">
                      Generiere detaillierte KI-Analysen für den Gesamtmarkt oder einzelne Coins.
                      Die Reports nutzen technische Analyse, Sentiment-Daten und On-Chain-Metriken.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <h4 className="font-medium text-blue-400 mb-2">Markt-Intelligence</h4>
                        <ul className="text-gray-400 space-y-1 text-xs">
                          <li>• Gesamtmarkt-Übersicht</li>
                          <li>• Fear & Greed Analyse</li>
                          <li>• Top-Mover Analyse</li>
                          <li>• Trend-Prognosen</li>
                        </ul>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <h4 className="font-medium text-purple-400 mb-2">Coin-Intelligence</h4>
                        <ul className="text-gray-400 space-y-1 text-xs">
                          <li>• Multi-Timeframe Analyse</li>
                          <li>• Support/Resistance Levels</li>
                          <li>• Trade-Empfehlungen</li>
                          <li>• Risiko-Bewertung</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Show existing reports if available */}
                  {intelligenceReport && (
                    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-blue-400">Letzter Markt-Report</h4>
                        <button
                          onClick={() => setIntelligenceReport(null)}
                          className="text-xs text-gray-500 hover:text-gray-300"
                        >
                          Report öffnen →
                        </button>
                      </div>
                      <p className="text-sm text-gray-300">{intelligenceReport.summary?.substring(0, 200)}...</p>
                    </div>
                  )}
                </div>
              </TabPanel>

            </div>
          </main>
        </div>

        {/* Mobile Drawer - Sidebar on mobile */}
        <MobileDrawer
          open={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          title="Navigation"
        >
          <div className="space-y-4">
            {/* Fear & Greed Index */}
            {marketData?.fearGreed && (
              <div className="bg-gray-800/50 rounded-lg p-4" data-tour="fear-greed">
                <div className="text-sm text-gray-400 mb-2">Fear & Greed</div>
                <div className="flex items-center gap-3">
                  <div className={`text-3xl font-bold ${marketData.fearGreed.value <= 25 ? 'text-red-500' :
                    marketData.fearGreed.value <= 45 ? 'text-orange-500' :
                      marketData.fearGreed.value <= 55 ? 'text-yellow-500' :
                        marketData.fearGreed.value <= 75 ? 'text-lime-500' :
                          'text-green-500'
                    }`}>
                    {marketData.fearGreed.value}
                  </div>
                  <div className="text-sm text-gray-300">{marketData.fearGreed.label}</div>
                </div>
              </div>
            )}

            {/* Coin List */}
            <div>
              <div className="text-sm text-gray-400 mb-3">Top Coins</div>
              <div className="space-y-2">
                {marketData?.coins.slice(0, 10).map((coin, index) => (
                  <button
                    key={coin.id || `drawer-coin-${coin.symbol}-${index}`}
                    onClick={() => {
                      handleCoinSelect(coin);
                      setMobileDrawerOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${selectedAnalysisCoin?.symbol === coin.symbol
                      ? 'bg-blue-600/20 border border-blue-500/50'
                      : 'bg-gray-800/50 hover:bg-gray-700/50'
                      }`}
                  >
                    <img src={coin.image} alt={coin.name} className="w-8 h-8 rounded-full" />
                    <div className="flex-1 text-left">
                      <div className="font-medium text-white">{coin.symbol.toUpperCase()}</div>
                      <div className="text-xs text-gray-400">${coin.price?.toLocaleString()}</div>
                    </div>
                    <div className={`text-sm font-medium ${coin.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(1)}%
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Add Custom Coin */}
            <button
              onClick={() => {
                const symbol = prompt('Coin Symbol eingeben (z.B. DOGE):');
                if (symbol) {
                  handleAddCustomCoin(symbol);
                  setMobileDrawerOpen(false);
                }
              }}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Coin hinzufügen
            </button>
          </div>
        </MobileDrawer>

        {/* Footer */}
        <footer className="border-t border-gray-800 mt-12 lg:ml-64">
          <div className="px-4 py-3 text-center text-[10px] text-gray-500">
            Crypto Intelligence - Daten von CoinGecko, DefiLlama, Reddit, Binance, Mempool.space & Groq AI
          </div>
        </footer>

        {/* Intelligence Report Modal */}
        {
          intelligenceReport && !showPresentation && (
            <IntelligenceReport
              report={intelligenceReport}
              technicalLevels={technicalLevels || undefined}
              multiTimeframe={multiTimeframe || undefined}
              fearGreed={marketData?.fearGreed?.value}
              topCoins={marketData?.coins.slice(0, 5).map(c => ({ symbol: c.symbol, change24h: c.change24h }))}
              onClose={() => setIntelligenceReport(null)}
              onOpenPresentation={() => setShowPresentation(true)}
            />
          )
        }

        {/* Presentation Mode */}
        {
          showPresentation && intelligenceReport && (
            <PresentationMode
              report={intelligenceReport}
              technicalLevels={technicalLevels || undefined}
              multiTimeframe={multiTimeframe || undefined}
              fearGreed={marketData?.fearGreed?.value}
              topCoins={marketData?.coins.slice(0, 5).map(c => ({ symbol: c.symbol, change24h: c.change24h }))}
              onClose={() => setShowPresentation(false)}
            />
          )
        }

        {/* Coin Detail Modal */}
        {
          modalCoin && (
            <CoinDetailModal
              coin={modalCoin}
              onClose={() => setModalCoin(null)}
              tradeRecommendations={
                modalCoin.symbol === selectedAnalysisCoin?.symbol
                  ? tradeRecommendations
                  : undefined
              }
            />
          )
        }

        {/* Coin Intelligence Report Modal */}
        {
          coinReport && selectedAnalysisCoin && (
            <CoinIntelligenceReport
              report={coinReport}
              coin={selectedAnalysisCoin}
              onClose={() => setCoinReport(null)}
            />
          )
        }

        {/* Alert Notifications (Toast) */}
        <AnimatePresence>
          <AlertNotificationsContainer
            notifications={notifications}
            onDismiss={dismissNotification}
          />
        </AnimatePresence>

        {/* Satoshi Avatar & Onboarding Tour */}
        <Avatar context={satoshiContext} />
        <OnboardingTour />
      </div >
    </HelpProvider >
  );
}
