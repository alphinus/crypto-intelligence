import Groq from 'groq-sdk';
import type { AnalysisResult } from '@/types/news';

// Lazy initialization - wird nur bei Bedarf erstellt
let groqClient: Groq | null = null;

function getGroqClient(): Groq {
  if (!groqClient) {
    groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }
  return groqClient;
}

export async function analyzeArticle(
  title: string,
  content: string
): Promise<AnalysisResult> {
  try {
    const prompt = `Analysiere diesen Crypto-Nachrichtenartikel und gib eine strukturierte Analyse zurück.

Titel: ${title}

Inhalt: ${content.slice(0, 2000)}

Antworte NUR mit einem gültigen JSON-Objekt in diesem Format:
{
  "sentiment": "bullish" | "bearish" | "neutral",
  "sentimentScore": <Zahl von -100 bis 100>,
  "summary": "<1-2 Sätze Zusammenfassung auf Deutsch>",
  "entities": ["<Liste der erwähnten Coins/Projekte/Personen>"],
  "impact": "high" | "medium" | "low",
  "keyPoints": ["<3-5 wichtige Punkte>"]
}`;

    const completion = await getGroqClient().chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 1000,
    });

    const responseText = completion.choices[0]?.message?.content || '';

    // Parse JSON aus der Antwort
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const result = JSON.parse(jsonMatch[0]) as AnalysisResult;
    return result;
  } catch (error) {
    console.error('Groq analysis error:', error);

    // Fallback bei Fehler
    return {
      sentiment: 'neutral',
      sentimentScore: 0,
      summary: 'Analyse nicht verfügbar',
      entities: [],
      impact: 'low',
      keyPoints: [],
    };
  }
}

export async function analyzeMultipleArticles(
  articles: Array<{ title: string; content: string }>
): Promise<{
  overallSentiment: string;
  trendingTopics: string[];
  marketOutlook: string;
}> {
  try {
    const titles = articles.slice(0, 10).map((a) => a.title).join('\n- ');

    const prompt = `Analysiere diese Crypto-News-Schlagzeilen und gib einen Marktüberblick:

Headlines:
- ${titles}

Antworte NUR mit einem gültigen JSON-Objekt:
{
  "overallSentiment": "bullish" | "bearish" | "neutral",
  "trendingTopics": ["<Top 5 Themen/Coins die erwähnt werden>"],
  "marketOutlook": "<2-3 Sätze Marktausblick auf Deutsch>"
}`;

    const completion = await getGroqClient().chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant', // Schnelleres Modell für Bulk-Analyse
      temperature: 0.3,
      max_tokens: 500,
    });

    const responseText = completion.choices[0]?.message?.content || '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('No JSON found');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Bulk analysis error:', error);
    return {
      overallSentiment: 'neutral',
      trendingTopics: [],
      marketOutlook: 'Analyse nicht verfügbar',
    };
  }
}

// Trade Setup Interface
export interface TradeSetup {
  type: 'long' | 'short' | 'wait';
  confidence: 'high' | 'medium' | 'low';
  entry: number | 'market';
  stopLoss: number;
  takeProfit: number[];
  riskReward: number;
  reasoning: string;
  timeframe: string;
}

// Timeframe-spezifisches Trade Setup
export interface TimeframeTradeSetup extends TradeSetup {
  timeframe: '1m' | '3m' | '5m' | '15m' | '1h' | '4h' | '1d';
  confluenceWithOtherTimeframes: boolean;
  tradingStyle: 'scalping' | 'intraday' | 'swing' | 'position';
}

// Multi-Timeframe Empfehlungen
export interface MultiTimeframeRecommendations {
  recommendations: {
    '1m': TimeframeTradeSetup;
    '3m': TimeframeTradeSetup;
    '5m': TimeframeTradeSetup;
    '15m': TimeframeTradeSetup;
    '1h': TimeframeTradeSetup;
    '4h': TimeframeTradeSetup;
    '1d': TimeframeTradeSetup;
  };
  bestTimeframeForTrade: '1m' | '3m' | '5m' | '15m' | '1h' | '4h' | '1d' | 'none';
  overallBias: 'bullish' | 'bearish' | 'neutral';
  confluenceZones: number[];
  summary: string;
}

// Gewichtung zwischen Technical und Sentiment Analyse
export interface AnalysisWeights {
  technical: number; // 0-100 Prozent
  sentiment: number; // 0-100 Prozent (= 100 - technical)
}

// Trade Score für Ranking und Empfehlung
export interface TradeScore {
  total: number; // 0-100
  verdict: 'TAKE IT' | 'LEAVE IT' | 'RISKY';
  components: {
    // Technical Components (max 100 raw points)
    trendAlignment: number; // 0-25
    momentumStrength: number; // 0-20
    riskRewardQuality: number; // 0-20
    confluenceBonus: number; // 0-15
    volumeConfirmation: number; // 0-10
    levelProximity: number; // 0-10
    // Sentiment Components (max 100 raw points)
    fearGreedAlignment: number; // 0-25 (Fear/Greed Index passt zur Trade-Richtung)
    socialSentiment: number; // 0-25 (Reddit/Social Sentiment)
    fundingRateBias: number; // 0-25 (Funding Rate signalisiert Überkauft/Überverkauft)
    marketMomentum: number; // 0-25 (Generelles Markt-Momentum)
  };
  // Aggregierte Scores
  technicalScore: number; // 0-100 (gewichtet)
  sentimentScore: number; // 0-100 (gewichtet)
  weights: AnalysisWeights; // Aktuelle Gewichtung
  rank: number; // 1 = bester Trade
}

// Hedge-Empfehlung bei Timeframe-Konflikten
export interface HedgeRecommendation {
  type: 'partial_hedge' | 'full_hedge' | 'no_hedge';
  reason: string;
  mainPosition?: {
    timeframe: string;
    direction: 'long' | 'short';
    allocation: number; // Prozent, z.B. 70
  };
  hedgePosition?: {
    timeframe: string;
    direction: 'long' | 'short';
    allocation: number; // Prozent, z.B. 30
    triggerPrice?: number;
  };
  netExposure: number; // z.B. 40 = 40% long
}

// Erweitertes Trade Setup mit Score
export interface ScoredTradeSetup extends TimeframeTradeSetup {
  score: TradeScore;
}

// =====================================================
// INDIKATOR-PRESET SYSTEM
// =====================================================

// StochRSI Parameter
export interface StochRSIParams {
  rsi: number;
  stoch: number;
  k: number;
  d: number;
}

// Indikator-Konfiguration für ein Preset
export interface IndicatorSettings {
  ema: { periods: number[]; enabled: boolean };
  rsi: { period: number; overbought: number; oversold: number; enabled: boolean };
  macd: { fast: number; slow: number; signal: number; enabled: boolean };
  bollingerBands: { period: number; stdDev: number; enabled: boolean };
  vwap: { enabled: boolean };
  atr: { period: number; enabled: boolean };
  stochRSI: { enabled: boolean; params: StochRSIParams };
  adx: { period: number; trendThreshold: number; enabled: boolean };
  obv: { enabled: boolean };
  divergence: { rsi: boolean; macd: boolean };
}

// Score-Gewichtung für ein Preset
export interface PresetScoreWeights {
  trendAlignment: number;
  momentum: number;
  volumeConfirmation: number;
  divergenceBonus: number;
  trendStrength: number;
}

// Indikator-Preset Definition
export interface IndicatorPreset {
  id: string;
  name: string;
  description: string;
  targetTimeframes: string[];
  tradingStyle: 'scalping' | 'daytrading' | 'swing' | 'position';
  indicators: IndicatorSettings;
  scoreWeights: PresetScoreWeights;
}

// Vordefinierte Presets
export const INDICATOR_PRESETS: IndicatorPreset[] = [
  {
    id: 'scalper',
    name: 'Scalper',
    description: 'Schnelle Signale für 1m-5m Trades',
    targetTimeframes: ['1m', '3m', '5m'],
    tradingStyle: 'scalping',
    indicators: {
      ema: { periods: [9, 21], enabled: true },
      rsi: { period: 7, overbought: 80, oversold: 20, enabled: true },
      macd: { fast: 5, slow: 13, signal: 4, enabled: true },
      bollingerBands: { period: 10, stdDev: 2, enabled: true },
      vwap: { enabled: true },
      atr: { period: 7, enabled: true },
      stochRSI: { enabled: true, params: { rsi: 7, stoch: 7, k: 2, d: 2 } },
      adx: { period: 7, trendThreshold: 20, enabled: false },
      obv: { enabled: false },
      divergence: { rsi: false, macd: false },
    },
    scoreWeights: {
      trendAlignment: 15,
      momentum: 35,
      volumeConfirmation: 25,
      divergenceBonus: 0,
      trendStrength: 25,
    },
  },
  {
    id: 'daytrader',
    name: 'Day Trader',
    description: 'Ausgewogene Signale für 15m-1h',
    targetTimeframes: ['15m', '1h'],
    tradingStyle: 'daytrading',
    indicators: {
      ema: { periods: [20, 50, 200], enabled: true },
      rsi: { period: 14, overbought: 70, oversold: 30, enabled: true },
      macd: { fast: 12, slow: 26, signal: 9, enabled: true },
      bollingerBands: { period: 20, stdDev: 2, enabled: true },
      vwap: { enabled: true },
      atr: { period: 14, enabled: true },
      stochRSI: { enabled: true, params: { rsi: 14, stoch: 14, k: 3, d: 3 } },
      adx: { period: 14, trendThreshold: 25, enabled: true },
      obv: { enabled: true },
      divergence: { rsi: true, macd: false },
    },
    scoreWeights: {
      trendAlignment: 25,
      momentum: 25,
      volumeConfirmation: 20,
      divergenceBonus: 15,
      trendStrength: 15,
    },
  },
  {
    id: 'swing',
    name: 'Swing Trader',
    description: 'Trend-folgende Signale für 4h-1d',
    targetTimeframes: ['4h', '1d'],
    tradingStyle: 'swing',
    indicators: {
      ema: { periods: [50, 200, 300], enabled: true },
      rsi: { period: 14, overbought: 70, oversold: 30, enabled: true },
      macd: { fast: 12, slow: 26, signal: 9, enabled: true },
      bollingerBands: { period: 20, stdDev: 2, enabled: false },
      vwap: { enabled: false },
      atr: { period: 14, enabled: true },
      stochRSI: { enabled: false, params: { rsi: 14, stoch: 14, k: 3, d: 3 } },
      adx: { period: 14, trendThreshold: 25, enabled: true },
      obv: { enabled: true },
      divergence: { rsi: true, macd: true },
    },
    scoreWeights: {
      trendAlignment: 35,
      momentum: 15,
      volumeConfirmation: 15,
      divergenceBonus: 20,
      trendStrength: 15,
    },
  },
  {
    id: 'position',
    name: 'Position Trader',
    description: 'Langfristige Signale für 1d-1w',
    targetTimeframes: ['1d', '1w'],
    tradingStyle: 'position',
    indicators: {
      ema: { periods: [50, 200], enabled: true },
      rsi: { period: 21, overbought: 70, oversold: 30, enabled: true },
      macd: { fast: 19, slow: 39, signal: 9, enabled: true },
      bollingerBands: { period: 50, stdDev: 2, enabled: true },
      vwap: { enabled: false },
      atr: { period: 21, enabled: true },
      stochRSI: { enabled: false, params: { rsi: 21, stoch: 14, k: 3, d: 3 } },
      adx: { period: 21, trendThreshold: 20, enabled: true },
      obv: { enabled: true },
      divergence: { rsi: true, macd: true },
    },
    scoreWeights: {
      trendAlignment: 40,
      momentum: 10,
      volumeConfirmation: 15,
      divergenceBonus: 20,
      trendStrength: 15,
    },
  },
];

// Preset basierend auf Timeframe empfehlen
export function recommendPreset(timeframe: string): string {
  const timeframeMap: Record<string, string> = {
    '1m': 'scalper',
    '3m': 'scalper',
    '5m': 'scalper',
    '15m': 'daytrader',
    '1h': 'daytrader',
    '4h': 'swing',
    '1d': 'swing',
    '1w': 'position',
  };
  return timeframeMap[timeframe] || 'daytrader';
}

// Preset nach ID finden
export function getPresetById(id: string): IndicatorPreset | undefined {
  return INDICATOR_PRESETS.find((p) => p.id === id);
}

// Default Preset (Day Trader)
export function getDefaultPreset(): IndicatorPreset {
  return INDICATOR_PRESETS.find((p) => p.id === 'daytrader') || INDICATOR_PRESETS[1];
}

// Technische Analyse Interface
export interface TechnicalAnalysis {
  keySupport: number;
  keyResistance: number;
  currentTrend: 'bullish' | 'bearish' | 'neutral';
  trendStrength: number;
}

// Timeframe Analyse Interface
export interface TimeframeAnalysis {
  shortTerm: string;
  mediumTerm: string;
  longTerm: string;
  confluence: string;
}

// Umfassende Markt-Intelligence Analyse
export interface MarketIntelligenceReport {
  timestamp: string;
  overallSentiment: 'bullish' | 'bearish' | 'neutral';
  confidenceScore: number;
  marketPhase: string;
  summary: string;
  signals: Array<{
    type: 'opportunity' | 'warning' | 'info';
    title: string;
    description: string;
    relevantCoins: string[];
  }>;
  topNarratives: string[];
  riskLevel: 'low' | 'medium' | 'high';
  actionItems: string[];
  // Neue Felder
  technicalAnalysis?: TechnicalAnalysis;
  timeframeAnalysis?: TimeframeAnalysis;
  tradeRecommendation?: TradeSetup | null;
  audioSummary?: string;
}

export async function generateMarketIntelligenceReport(data: {
  newsHeadlines: string[];
  redditTrending: string[];
  redditSentiment: { sentiment: string; score: number };
  topCoins: Array<{ symbol: string; change24h: number }>;
  fearGreedIndex: number;
  defiTvlChange: number;
  topProtocols: string[];
}): Promise<MarketIntelligenceReport> {
  try {
    const prompt = `Du bist ein erfahrener Crypto-Analyst. Erstelle einen umfassenden Markt-Intelligence-Bericht basierend auf diesen Echtzeitdaten:

NEWS HEADLINES (letzte Stunden):
${data.newsHeadlines.slice(0, 8).map((h) => `- ${h}`).join('\n')}

REDDIT TRENDING TOPICS: ${data.redditTrending.join(', ')}
REDDIT SENTIMENT: ${data.redditSentiment.sentiment} (Score: ${data.redditSentiment.score})

TOP COINS 24H PERFORMANCE:
${data.topCoins.slice(0, 5).map((c) => `- ${c.symbol.toUpperCase()}: ${c.change24h > 0 ? '+' : ''}${c.change24h.toFixed(2)}%`).join('\n')}

FEAR & GREED INDEX: ${data.fearGreedIndex}/100
DEFI TVL 24H CHANGE: ${data.defiTvlChange > 0 ? '+' : ''}${data.defiTvlChange.toFixed(2)}%
TOP DEFI PROTOCOLS: ${data.topProtocols.slice(0, 5).join(', ')}

Analysiere alle Daten und erstelle einen DEUTSCHEN Marktbericht. Antworte NUR mit diesem JSON:
{
  "overallSentiment": "bullish" | "bearish" | "neutral",
  "confidenceScore": <0-100>,
  "marketPhase": "<z.B. 'Akkumulation', 'Korrektur', 'Euphorie', 'Kapitulation', 'Seitwärts'>",
  "summary": "<3-4 Sätze Zusammenfassung der aktuellen Marktlage auf Deutsch>",
  "signals": [
    {
      "type": "opportunity" | "warning" | "info",
      "title": "<Kurzer Signal-Titel>",
      "description": "<1-2 Sätze Erklärung>",
      "relevantCoins": ["BTC", "ETH", ...]
    }
  ],
  "topNarratives": ["<Top 3-5 aktuelle Narratives/Trends>"],
  "riskLevel": "low" | "medium" | "high",
  "actionItems": ["<2-4 konkrete Handlungsempfehlungen>"]
}`;

    const completion = await getGroqClient().chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.4,
      max_tokens: 1500,
    });

    const responseText = completion.choices[0]?.message?.content || '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const result = JSON.parse(jsonMatch[0]);

    return {
      timestamp: new Date().toISOString(),
      ...result,
    };
  } catch (error) {
    console.error('Market Intelligence error:', error);

    return {
      timestamp: new Date().toISOString(),
      overallSentiment: 'neutral',
      confidenceScore: 0,
      marketPhase: 'Unbekannt',
      summary: 'Marktanalyse konnte nicht erstellt werden. Bitte versuche es später erneut.',
      signals: [],
      topNarratives: [],
      riskLevel: 'medium',
      actionItems: ['Warte auf aktualisierte Daten'],
    };
  }
}

// Erweiterte Analyse mit Timeframes und Levels
export interface EnhancedReportInput {
  // Bestehende Daten
  newsHeadlines: string[];
  redditTrending: string[];
  redditSentiment: { sentiment: string; score: number };
  topCoins: Array<{ symbol: string; change24h: number }>;
  fearGreedIndex: number;
  defiTvlChange: number;
  topProtocols: string[];
  // Neue Daten
  technicalLevels?: {
    currentPrice: number;
    keySupport: number | null;
    keyResistance: number | null;
    swingHigh: number;
    swingLow: number;
  };
  multiTimeframe?: {
    '15m': { trend: string; momentum: number; change: number };
    '1h': { trend: string; momentum: number; change: number };
    '4h': { trend: string; momentum: number; change: number };
    '1d': { trend: string; momentum: number; change: number };
  };
  futuresData?: {
    fundingRates: { btc: number; eth: number; sol: number };
    openInterest: { btc: number; eth: number; sol: number };
    longShortRatio?: { btc: { long: number; short: number } };
  };
  btcDominance?: number;
}

export async function generateEnhancedReport(
  data: EnhancedReportInput
): Promise<MarketIntelligenceReport> {
  try {
    // Timeframe-String für Prompt
    const timeframeStr = data.multiTimeframe
      ? `
MULTI-TIMEFRAME ANALYSE:
- 15min: Trend ${data.multiTimeframe['15m'].trend}, Momentum ${data.multiTimeframe['15m'].momentum}, ${data.multiTimeframe['15m'].change > 0 ? '+' : ''}${data.multiTimeframe['15m'].change.toFixed(2)}%
- 1h: Trend ${data.multiTimeframe['1h'].trend}, Momentum ${data.multiTimeframe['1h'].momentum}, ${data.multiTimeframe['1h'].change > 0 ? '+' : ''}${data.multiTimeframe['1h'].change.toFixed(2)}%
- 4h: Trend ${data.multiTimeframe['4h'].trend}, Momentum ${data.multiTimeframe['4h'].momentum}, ${data.multiTimeframe['4h'].change > 0 ? '+' : ''}${data.multiTimeframe['4h'].change.toFixed(2)}%
- Daily: Trend ${data.multiTimeframe['1d'].trend}, Momentum ${data.multiTimeframe['1d'].momentum}, ${data.multiTimeframe['1d'].change > 0 ? '+' : ''}${data.multiTimeframe['1d'].change.toFixed(2)}%`
      : '';

    // Technische Level für Prompt
    const levelsStr = data.technicalLevels
      ? `
TECHNISCHE LEVEL (BTC):
- Aktueller Preis: $${data.technicalLevels.currentPrice.toLocaleString()}
- Key Support: ${data.technicalLevels.keySupport ? `$${data.technicalLevels.keySupport.toLocaleString()}` : 'N/A'}
- Key Resistance: ${data.technicalLevels.keyResistance ? `$${data.technicalLevels.keyResistance.toLocaleString()}` : 'N/A'}
- Swing High: $${data.technicalLevels.swingHigh.toLocaleString()}
- Swing Low: $${data.technicalLevels.swingLow.toLocaleString()}`
      : '';

    // Futures für Prompt
    const futuresStr = data.futuresData
      ? `
FUTURES DATEN:
- BTC Funding Rate: ${(data.futuresData.fundingRates.btc * 100).toFixed(4)}%
- ETH Funding Rate: ${(data.futuresData.fundingRates.eth * 100).toFixed(4)}%
- BTC Open Interest: ${data.futuresData.openInterest.btc.toLocaleString()} BTC
${data.futuresData.longShortRatio ? `- Long/Short Ratio: ${data.futuresData.longShortRatio.btc.long.toFixed(1)}% Long / ${data.futuresData.longShortRatio.btc.short.toFixed(1)}% Short` : ''}`
      : '';

    const prompt = `Du bist ein erfahrener Crypto-Trader und Analyst. Erstelle einen umfassenden Markt-Intelligence-Bericht mit HANDLUNGSEMPFEHLUNGEN.

NEWS HEADLINES:
${data.newsHeadlines.slice(0, 8).map((h) => `- ${h}`).join('\n')}

REDDIT: ${data.redditTrending.join(', ')} (Sentiment: ${data.redditSentiment.sentiment})

TOP COINS 24H:
${data.topCoins.slice(0, 5).map((c) => `- ${c.symbol.toUpperCase()}: ${c.change24h > 0 ? '+' : ''}${c.change24h.toFixed(2)}%`).join('\n')}

FEAR & GREED: ${data.fearGreedIndex}/100
DEFI TVL CHANGE: ${data.defiTvlChange > 0 ? '+' : ''}${data.defiTvlChange.toFixed(2)}%
${data.btcDominance ? `BTC DOMINANCE: ${data.btcDominance.toFixed(1)}%` : ''}
${timeframeStr}
${levelsStr}
${futuresStr}

Analysiere ALLE Daten. Beachte besonders:
1. Stimmen die Timeframes überein (Konfluenz) oder divergieren sie?
2. Sind wichtige Support/Resistance Level in der Nähe?
3. Was signalisieren Funding Rates und Long/Short Ratio?
4. Gib eine KONKRETE Trade-Empfehlung wenn ein Setup erkennbar ist.

WICHTIGE VETO-REGELN:
- NIEMALS Long wenn RSI > 70 oder bei extremer Greed (>80)
- NIEMALS Short wenn RSI < 30 oder bei extremer Fear (<20)
- Priorisiere "wait" wenn Timeframes divergieren
- Funding Rate > 0.03% = Risiko für Long, < -0.03% = Risiko für Short

Antworte NUR mit diesem JSON:
{
  "overallSentiment": "bullish" | "bearish" | "neutral",
  "confidenceScore": <0-100>,
  "marketPhase": "<Akkumulation/Korrektur/Euphorie/Kapitulation/Seitwärts>",
  "summary": "<3-4 Sätze Zusammenfassung auf Deutsch>",
  "signals": [{"type": "opportunity"|"warning"|"info", "title": "<>", "description": "<>", "relevantCoins": []}],
  "topNarratives": ["<3-5 Trends>"],
  "riskLevel": "low" | "medium" | "high",
  "actionItems": ["<2-4 Empfehlungen>"],
  "technicalAnalysis": {
    "keySupport": <Preis>,
    "keyResistance": <Preis>,
    "currentTrend": "bullish" | "bearish" | "neutral",
    "trendStrength": <0-100>
  },
  "timeframeAnalysis": {
    "shortTerm": "<15m-1h Outlook>",
    "mediumTerm": "<4h Outlook>",
    "longTerm": "<Daily Outlook>",
    "confluence": "<Wo stimmen Timeframes überein? Oder: Divergenz?>",
  },
  "tradeRecommendation": {
    "type": "long" | "short" | "wait",
    "confidence": "high" | "medium" | "low",
    "entry": <Preis oder "market">,
    "stopLoss": <Preis>,
    "takeProfit": [<TP1>, <TP2>],
    "riskReward": <Ratio>,
    "reasoning": "<Warum dieses Setup?>",
    "timeframe": "<Welcher TF für den Trade?>"
  },
  "audioSummary": "<Kompakte 2-3 Sätze für Sprachausgabe, natürlich klingend>"
}`;

    const completion = await getGroqClient().chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.4,
      max_tokens: 2000,
    });

    const responseText = completion.choices[0]?.message?.content || '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const result = JSON.parse(jsonMatch[0]);

    return {
      timestamp: new Date().toISOString(),
      ...result,
    };
  } catch (error) {
    console.error('Enhanced Report error:', error);

    // Fallback
    return {
      timestamp: new Date().toISOString(),
      overallSentiment: 'neutral',
      confidenceScore: 0,
      marketPhase: 'Unbekannt',
      summary: 'Erweiterte Analyse konnte nicht erstellt werden.',
      signals: [],
      topNarratives: [],
      riskLevel: 'medium',
      actionItems: ['Warte auf aktualisierte Daten'],
    };
  }
}

// Input für Multi-Timeframe Trade-Empfehlungen
export interface MultiTimeframeTradeInput {
  symbol: string;
  currentPrice: number;
  timeframes: {
    '5m': { trend: string; momentum: number; change: number; high: number; low: number };
    '15m': { trend: string; momentum: number; change: number; high: number; low: number };
    '1h': { trend: string; momentum: number; change: number; high: number; low: number };
    '4h': { trend: string; momentum: number; change: number; high: number; low: number };
    '1d': { trend: string; momentum: number; change: number; high: number; low: number };
  };
  levels: {
    '5m': { keySupport: number | null; keyResistance: number | null; fibonacci: Array<{ ratio: number; price: number }> };
    '15m': { keySupport: number | null; keyResistance: number | null; fibonacci: Array<{ ratio: number; price: number }> };
    '1h': { keySupport: number | null; keyResistance: number | null; fibonacci: Array<{ ratio: number; price: number }> };
    '4h': { keySupport: number | null; keyResistance: number | null; fibonacci: Array<{ ratio: number; price: number }> };
    '1d': { keySupport: number | null; keyResistance: number | null; fibonacci: Array<{ ratio: number; price: number }> };
  };
  fearGreedIndex?: number;
  fundingRate?: number;
}

// Generiere Multi-Timeframe Trade-Empfehlungen
export async function generateMultiTimeframeRecommendations(
  data: MultiTimeframeTradeInput
): Promise<MultiTimeframeRecommendations> {
  try {
    const prompt = `Du bist ein professioneller Crypto-Trader. Analysiere ${data.symbol} auf allen 5 Timeframes und gib für JEDEN eine konkrete Trade-Empfehlung.

AKTUELLER PREIS: $${data.currentPrice.toLocaleString()}
${data.fearGreedIndex ? `FEAR & GREED: ${data.fearGreedIndex}/100` : ''}
${data.fundingRate !== undefined ? `FUNDING RATE: ${(data.fundingRate * 100).toFixed(4)}%` : ''}

TIMEFRAME ANALYSE:
5min (Scalping):
- Trend: ${data.timeframes['5m'].trend}, Momentum: ${data.timeframes['5m'].momentum}
- Support: ${data.levels['5m'].keySupport ? `$${data.levels['5m'].keySupport.toLocaleString()}` : 'N/A'}
- Resistance: ${data.levels['5m'].keyResistance ? `$${data.levels['5m'].keyResistance.toLocaleString()}` : 'N/A'}

15min (Intraday):
- Trend: ${data.timeframes['15m'].trend}, Momentum: ${data.timeframes['15m'].momentum}
- Support: ${data.levels['15m'].keySupport ? `$${data.levels['15m'].keySupport.toLocaleString()}` : 'N/A'}
- Resistance: ${data.levels['15m'].keyResistance ? `$${data.levels['15m'].keyResistance.toLocaleString()}` : 'N/A'}

1h (Swing Short):
- Trend: ${data.timeframes['1h'].trend}, Momentum: ${data.timeframes['1h'].momentum}
- Support: ${data.levels['1h'].keySupport ? `$${data.levels['1h'].keySupport.toLocaleString()}` : 'N/A'}
- Resistance: ${data.levels['1h'].keyResistance ? `$${data.levels['1h'].keyResistance.toLocaleString()}` : 'N/A'}

4h (Swing):
- Trend: ${data.timeframes['4h'].trend}, Momentum: ${data.timeframes['4h'].momentum}
- Support: ${data.levels['4h'].keySupport ? `$${data.levels['4h'].keySupport.toLocaleString()}` : 'N/A'}
- Resistance: ${data.levels['4h'].keyResistance ? `$${data.levels['4h'].keyResistance.toLocaleString()}` : 'N/A'}

Daily (Position):
- Trend: ${data.timeframes['1d'].trend}, Momentum: ${data.timeframes['1d'].momentum}
- Support: ${data.levels['1d'].keySupport ? `$${data.levels['1d'].keySupport.toLocaleString()}` : 'N/A'}
- Resistance: ${data.levels['1d'].keyResistance ? `$${data.levels['1d'].keyResistance.toLocaleString()}` : 'N/A'}

Gib für JEDEN Timeframe eine passende Empfehlung:
- 5min: Tight Stops, schnelle Moves, 0.5-1% Targets
- 15min: Moderate Stops, 1-2% Targets
- 1h: Größere Stops, 2-5% Targets
- 4h: Swing-Stops, 5-10% Targets
- Daily: Position-Stops, 10%+ Targets

WICHTIGE VETO-REGELN (STRIKT EINHALTEN):
1. NIEMALS Long-Signal wenn RSI > 70 (Überkauft) - stattdessen "wait" oder Short erwägen
2. NIEMALS Short-Signal wenn RSI < 30 (Überverkauft) - stattdessen "wait" oder Long erwägen
3. Priorisiere "wait" wenn höhere Timeframes (1h, 4h, 1d) divergieren
4. Funding Rate > 0.03% = Warnung für Long (überfüllt), < -0.03% = Warnung für Short
5. Bei extremer Fear (<20) = potentieller Bounce (bevorzuge Long/Wait), bei extremer Greed (>80) = potentieller Drop (bevorzuge Short/Wait)
6. Setze confluenceWithOtherTimeframes auf false wenn der Trade gegen den höheren TF-Trend geht

Antworte NUR mit diesem JSON:
{
  "recommendations": {
    "5m": {
      "timeframe": "5m",
      "type": "long" | "short" | "wait",
      "confidence": "high" | "medium" | "low",
      "entry": <Preis oder "market">,
      "stopLoss": <Preis>,
      "takeProfit": [<TP1>, <TP2>],
      "riskReward": <Ratio>,
      "reasoning": "<Kurze Begründung>",
      "confluenceWithOtherTimeframes": <true/false>,
      "tradingStyle": "scalping"
    },
    "15m": { ... "tradingStyle": "intraday" },
    "1h": { ... "tradingStyle": "swing" },
    "4h": { ... "tradingStyle": "swing" },
    "1d": { ... "tradingStyle": "position" }
  },
  "bestTimeframeForTrade": "5m" | "15m" | "1h" | "4h" | "1d" | "none",
  "overallBias": "bullish" | "bearish" | "neutral",
  "confluenceZones": [<Preise wo mehrere TFs übereinstimmen>],
  "summary": "<2-3 Sätze Zusammenfassung auf Deutsch>"
}`;

    const completion = await getGroqClient().chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 2500,
    });

    const responseText = completion.choices[0]?.message?.content || '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Multi-Timeframe Recommendations error:', error);

    // Fallback mit neutralen Empfehlungen
    const defaultSetup = (tf: '1m' | '3m' | '5m' | '15m' | '1h' | '4h' | '1d', style: 'scalping' | 'intraday' | 'swing' | 'position'): TimeframeTradeSetup => ({
      timeframe: tf,
      type: 'wait',
      confidence: 'low',
      entry: 'market',
      stopLoss: data.currentPrice * 0.98,
      takeProfit: [data.currentPrice * 1.02],
      riskReward: 1,
      reasoning: 'Analyse nicht verfügbar - warte auf besseres Setup',
      confluenceWithOtherTimeframes: false,
      tradingStyle: style,
    });

    return {
      recommendations: {
        '1m': defaultSetup('1m', 'scalping'),
        '3m': defaultSetup('3m', 'scalping'),
        '5m': defaultSetup('5m', 'scalping'),
        '15m': defaultSetup('15m', 'intraday'),
        '1h': defaultSetup('1h', 'swing'),
        '4h': defaultSetup('4h', 'swing'),
        '1d': defaultSetup('1d', 'position'),
      },
      bestTimeframeForTrade: 'none',
      overallBias: 'neutral',
      confluenceZones: [],
      summary: 'Analyse konnte nicht erstellt werden. Bitte versuche es später erneut.',
    };
  }
}

// =====================================================
// COIN-SPEZIFISCHE KI-ANALYSE
// =====================================================

// Input für Coin-spezifische Analyse
export interface CoinAnalysisInput {
  symbol: string;
  currentPrice: number;
  change24h: number;
  timeframes?: Record<string, {
    trend: string;
    momentum: number;
    change: number;
    klines?: Array<{ close: number; high: number; low: number }>;
  }>;
  levels?: Record<string, {
    keySupport: number | null;
    keyResistance: number | null;
  }>;
  emas?: Record<string, {
    currentEma50: number | null;
    currentEma200: number | null;
  }>;
  confluenceZones?: Array<{ price: number; type: string; timeframes: string[] }>;
  fundingRate?: number | null;
  redditSentiment?: { sentiment: string; sentimentScore: number };
  twitterSentiment?: { sentiment: string; sentimentScore: number };
  fearGreed?: number;
  bitcoinOnChain?: {
    fees?: { fastestFee: number; halfHourFee: number };
    mempool?: { count: number; vsize: number };
    difficulty?: { difficultyChange: number };
  } | null;
  // NEW: Exact indicator values from indicator-engine
  indicators?: {
    rsi: number;
    macd: { line: number; signal: number; histogram: number };
    stochRsi: { k: number; d: number };
    atr: number;
    atrPercent: number;
  };
}

// Coin Intelligence Report Interface
export interface CoinIntelligenceReport {
  symbol: string;
  timestamp: string;
  overallSentiment: 'bullish' | 'bearish' | 'neutral';
  confidenceScore: number;
  summary: string;

  technicalAnalysis: {
    currentTrend: 'bullish' | 'bearish' | 'neutral';
    trendStrength: number;
    keySupport: number;
    keyResistance: number;
    confluenceZones: Array<{ price: number; type: string; strength: number }>;
    emaSignal: 'bullish' | 'bearish' | 'neutral';
  };

  timeframeAnalysis: {
    shortTerm: string;
    mediumTerm: string;
    longTerm: string;
    confluence: string;
  };

  sentimentAnalysis: {
    socialScore: number;
    redditMentions: number;
    guruConsensus: 'bullish' | 'bearish' | 'mixed' | 'neutral';
  };

  derivativesAnalysis?: {
    fundingRate: number;
    fundingSignal: 'overleveraged_long' | 'overleveraged_short' | 'neutral';
    interpretation: string;
  };

  onChainAnalysis?: {
    networkHealth: string;
    mempoolStatus: string;
    feeLevel: string;
  };

  tradeRecommendation: {
    type: 'long' | 'short' | 'wait';
    confidence: 'high' | 'medium' | 'low';
    entry: number | 'market';
    stopLoss: number;
    takeProfit: number[];
    riskReward: number;
    reasoning: string;
    bestTimeframe: string;
  };

  riskFactors: string[];
  catalysts: string[];
}

// Generiere Coin-spezifischen Intelligence Report
export async function generateCoinIntelligenceReport(
  data: CoinAnalysisInput
): Promise<CoinIntelligenceReport> {
  try {
    const symbol = data.symbol.toUpperCase();

    // Timeframe-Zusammenfassung erstellen
    let timeframeSummary = 'Keine Daten';
    if (data.timeframes) {
      const tfs = ['1m', '5m', '15m', '1h', '4h', '1d'];
      timeframeSummary = tfs
        .filter(tf => data.timeframes![tf])
        .map(tf => `${tf}: ${data.timeframes![tf].trend} (Mom: ${data.timeframes![tf].momentum})`)
        .join(', ');
    }

    // Support/Resistance aus 1h Level
    const support = data.levels?.['1h']?.keySupport || data.currentPrice * 0.95;
    const resistance = data.levels?.['1h']?.keyResistance || data.currentPrice * 1.05;

    // EMA Signal
    let emaSignal = 'neutral';
    if (data.emas?.['1h']) {
      const { currentEma50, currentEma200 } = data.emas['1h'];
      if (currentEma50 && currentEma200) {
        if (data.currentPrice > currentEma50 && currentEma50 > currentEma200) {
          emaSignal = 'bullish (Preis > EMA50 > EMA200)';
        } else if (data.currentPrice < currentEma50 && currentEma50 < currentEma200) {
          emaSignal = 'bearish (Preis < EMA50 < EMA200)';
        }
      }
    }

    // Confluence Zones
    const zonesStr = data.confluenceZones?.slice(0, 5)
      .map(z => `$${z.price.toLocaleString()} (${z.type}, ${z.timeframes.length} TFs)`)
      .join(', ') || 'Keine';

    // Funding Rate Section
    const hasFunding = data.fundingRate !== null && data.fundingRate !== undefined;
    const fundingSection = hasFunding
      ? `\nDERIVATE:
- Funding Rate: ${(data.fundingRate! * 100).toFixed(4)}%
- Signal: ${data.fundingRate! > 0.01 ? 'Overleveraged Long' : data.fundingRate! < -0.01 ? 'Overleveraged Short' : 'Neutral'}`
      : '';

    // BTC On-Chain Section
    const isBTC = symbol === 'BTC';
    const onChainSection = isBTC && data.bitcoinOnChain
      ? `\nON-CHAIN (BTC):
- Mempool: ${data.bitcoinOnChain.mempool?.count?.toLocaleString() || 'N/A'} TXs
- Fees: ${data.bitcoinOnChain.fees?.fastestFee || 'N/A'} sat/vB (fast)
- Difficulty Change: ${data.bitcoinOnChain.difficulty?.difficultyChange?.toFixed(2) || 'N/A'}%`
      : '';

    // Social Sentiment
    const socialScore = data.redditSentiment?.sentimentScore || 0;
    const socialSentiment = data.redditSentiment?.sentiment || 'neutral';

    // NEW: Indicators section for AI
    const hasIndicators = data.indicators && data.indicators.rsi !== undefined;
    const indicatorsSection = hasIndicators
      ? `
TECHNISCHE INDIKATOREN (exakte Werte):
- RSI(14): ${data.indicators!.rsi.toFixed(1)} ${data.indicators!.rsi > 70 ? '⚠️ ÜBERKAUFT - KEIN LONG!' : data.indicators!.rsi < 30 ? '⚠️ ÜBERVERKAUFT - KEIN SHORT!' : ''}
- MACD: Line ${data.indicators!.macd.line.toFixed(4)}, Signal ${data.indicators!.macd.signal.toFixed(4)}, Histogram ${data.indicators!.macd.histogram > 0 ? '+' : ''}${data.indicators!.macd.histogram.toFixed(4)} (${data.indicators!.macd.histogram > 0 ? 'bullisch' : 'bärisch'})
- StochRSI: K=${data.indicators!.stochRsi.k.toFixed(1)}, D=${data.indicators!.stochRsi.d.toFixed(1)} ${data.indicators!.stochRsi.k > 80 ? '⚠️ überkauft' : data.indicators!.stochRsi.k < 20 ? '⚠️ überverkauft' : ''}
- ATR(14): ${data.indicators!.atr.toFixed(2)} (${data.indicators!.atrPercent.toFixed(2)}% vom Preis = Volatilität)`
      : '';

    // Veto rules string for AI
    const vetoRulesSection = hasIndicators
      ? `
STRIKTE VETO-REGELN (MÜSSEN EINGEHALTEN WERDEN):
1. RSI > 70: NIEMALS Long-Signal! Stattdessen "wait" oder Short erwägen.
2. RSI < 30: NIEMALS Short-Signal! Stattdessen "wait" oder Long erwägen.
3. StochRSI > 80: Warnung für Long - Markt überkauft.
4. StochRSI < 20: Warnung für Short - Markt überverkauft.
5. MACD Histogram negativ + RSI fallend: Bevorzuge Short oder Wait.
6. MACD Histogram positiv + RSI steigend: Bevorzuge Long oder Wait.`
      : '';

    const prompt = `Du bist ein erfahrener Crypto-Analyst. Erstelle einen detaillierten Analyse-Report für ${symbol}.

TECHNISCHE DATEN:
- Aktueller Preis: $${data.currentPrice.toLocaleString()}
- 24h Change: ${data.change24h > 0 ? '+' : ''}${data.change24h.toFixed(2)}%
- Multi-Timeframe: ${timeframeSummary}
- Key Support: $${support.toLocaleString()}
- Key Resistance: $${resistance.toLocaleString()}
- Confluence Zones: ${zonesStr}
- EMA Signal: ${emaSignal}
${indicatorsSection}

SENTIMENT:
- Reddit: ${socialSentiment} (Score: ${socialScore})
- Fear & Greed (Markt): ${data.fearGreed || 50}/100
${fundingSection}
${onChainSection}
${vetoRulesSection}

Analysiere alle Daten und erstelle einen DEUTSCHEN Report. Antworte NUR mit diesem JSON:
{
  "symbol": "${symbol}",
  "overallSentiment": "bullish" | "bearish" | "neutral",
  "confidenceScore": <0-100>,
  "summary": "<3-4 Sätze Coin-spezifische Analyse auf Deutsch>",
  "technicalAnalysis": {
    "currentTrend": "bullish" | "bearish" | "neutral",
    "trendStrength": <0-100>,
    "keySupport": ${support},
    "keyResistance": ${resistance},
    "confluenceZones": [{"price": <Preis>, "type": "support"|"resistance", "strength": <1-3>}],
    "emaSignal": "bullish" | "bearish" | "neutral"
  },
  "timeframeAnalysis": {
    "shortTerm": "<1m-15m Outlook>",
    "mediumTerm": "<1h-4h Outlook>",
    "longTerm": "<Daily Outlook>",
    "confluence": "<Wo stimmen Timeframes überein?>"
  },
  "sentimentAnalysis": {
    "socialScore": ${socialScore},
    "redditMentions": <geschätzte Zahl>,
    "guruConsensus": "bullish" | "bearish" | "mixed" | "neutral"
  },
  ${hasFunding ? `"derivativesAnalysis": {
    "fundingRate": ${data.fundingRate},
    "fundingSignal": "overleveraged_long" | "overleveraged_short" | "neutral",
    "interpretation": "<Was bedeutet die Funding Rate?>"
  },` : ''}
  ${isBTC && data.bitcoinOnChain ? `"onChainAnalysis": {
    "networkHealth": "<Gut/Mittel/Schlecht + Begründung>",
    "mempoolStatus": "<Überlastet/Normal/Leer>",
    "feeLevel": "<Hoch/Mittel/Niedrig>"
  },` : ''}
  "tradeRecommendation": {
    "type": "long" | "short" | "wait",
    "confidence": "high" | "medium" | "low",
    "entry": <Preis oder "market">,
    "stopLoss": <Preis>,
    "takeProfit": [<TP1>, <TP2>, <TP3>],
    "riskReward": <Ratio>,
    "reasoning": "<Warum dieses Setup?>",
    "bestTimeframe": "<Optimaler TF für den Trade>"
  },
  "riskFactors": ["<2-4 Risiken für diesen Coin>"],
  "catalysts": ["<2-4 potenzielle positive Trigger>"]
}`;

    const completion = await getGroqClient().chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.4,
      max_tokens: 2500,
    });

    const responseText = completion.choices[0]?.message?.content || '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const result = JSON.parse(jsonMatch[0]);

    return {
      timestamp: new Date().toISOString(),
      ...result,
    };
  } catch (error) {
    console.error('Coin Intelligence Report error:', error);

    // Fallback
    return {
      symbol: data.symbol.toUpperCase(),
      timestamp: new Date().toISOString(),
      overallSentiment: 'neutral',
      confidenceScore: 0,
      summary: `Analyse für ${data.symbol.toUpperCase()} konnte nicht erstellt werden. Bitte versuche es später erneut.`,
      technicalAnalysis: {
        currentTrend: 'neutral',
        trendStrength: 50,
        keySupport: data.currentPrice * 0.95,
        keyResistance: data.currentPrice * 1.05,
        confluenceZones: [],
        emaSignal: 'neutral',
      },
      timeframeAnalysis: {
        shortTerm: 'Analyse nicht verfügbar',
        mediumTerm: 'Analyse nicht verfügbar',
        longTerm: 'Analyse nicht verfügbar',
        confluence: 'Keine Daten',
      },
      sentimentAnalysis: {
        socialScore: 0,
        redditMentions: 0,
        guruConsensus: 'neutral',
      },
      tradeRecommendation: {
        type: 'wait',
        confidence: 'low',
        entry: 'market',
        stopLoss: data.currentPrice * 0.95,
        takeProfit: [data.currentPrice * 1.05],
        riskReward: 1,
        reasoning: 'Analyse nicht verfügbar - warte auf besseres Setup',
        bestTimeframe: '1h',
      },
      riskFactors: ['Analyse nicht verfügbar'],
      catalysts: ['Analyse nicht verfügbar'],
    };
  }
}
