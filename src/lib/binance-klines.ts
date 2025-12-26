// Binance Klines API Client (kostenlos, kein API Key)
// Fallback zu Binance.US wenn internationale API geblockt ist (HTTP 451 in USA)

const BINANCE_URLS = [
  'https://api.binance.com/api/v3',       // International
  'https://api.binance.us/api/v3',        // US Fallback
  'https://data-api.binance.vision/api/v3', // Vision API (often works when others blocked)
];

export type Interval = '1m' | '3m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w';

export interface Kline {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: number;
  quoteVolume: number;
  trades: number;
}

export interface MultiTimeframeData {
  symbol: string;
  currentPrice: number;
  timeframes: {
    '1m': TimeframeAnalysis;
    '3m': TimeframeAnalysis;
    '5m': TimeframeAnalysis;
    '15m': TimeframeAnalysis;
    '1h': TimeframeAnalysis;
    '4h': TimeframeAnalysis;
    '1d': TimeframeAnalysis;
  };
}

export interface TimeframeAnalysis {
  interval: Interval;
  klines: Kline[];
  trend: 'up' | 'down' | 'sideways';
  momentum: number; // -100 to 100
  change: number; // Prozentuale Änderung
  high: number;
  low: number;
  avgVolume: number;
}

// Parse Binance Kline response
function parseKline(data: (string | number)[]): Kline {
  return {
    openTime: Number(data[0]),
    open: parseFloat(String(data[1])),
    high: parseFloat(String(data[2])),
    low: parseFloat(String(data[3])),
    close: parseFloat(String(data[4])),
    volume: parseFloat(String(data[5])),
    closeTime: Number(data[6]),
    quoteVolume: parseFloat(String(data[7])),
    trades: Number(data[8]),
  };
}

// Fetch mit Fallback zu Binance.US
async function fetchWithFallback(
  endpoint: string,
  revalidate: number = 60
): Promise<Response | null> {
  for (const baseUrl of BINANCE_URLS) {
    try {
      const res = await fetch(`${baseUrl}${endpoint}`, {
        headers: { Accept: 'application/json' },
        next: { revalidate },
      });

      // Bei 451 (US Block) oder anderen Client-Fehlern: nächste URL versuchen
      if (res.status === 451 || res.status === 403) {
        console.log(`Binance ${baseUrl} blocked (${res.status}), trying fallback...`);
        continue;
      }

      if (res.ok) return res;

      // Bei Server-Fehlern auch Fallback versuchen
      if (res.status >= 500) continue;

      // Bei anderen Fehlern (404 etc.) abbrechen
      return null;
    } catch (error) {
      console.log(`Binance ${baseUrl} failed, trying fallback...`);
      continue;
    }
  }
  return null;
}

// Fetch Klines für ein Symbol
export async function fetchKlines(
  symbol: string,
  interval: Interval,
  limit: number = 100
): Promise<Kline[]> {
  try {
    const endpoint = `/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
    const revalidate = interval === '1d' ? 300 : 60;

    const res = await fetchWithFallback(endpoint, revalidate);

    if (!res) {
      console.error(`All Binance endpoints failed for ${symbol} ${interval}`);
      return [];
    }

    const data = await res.json();
    return data.map(parseKline);
  } catch (error) {
    console.error(`Failed to fetch klines for ${symbol} ${interval}:`, error);
    return [];
  }
}

// Berechne Trend basierend auf EMAs
function calculateTrend(klines: Kline[]): 'up' | 'down' | 'sideways' {
  if (klines.length < 20) return 'sideways';

  // Simple EMA Berechnung
  const closes = klines.map((k) => k.close);
  const ema9 = calculateEMA(closes, 9);
  const ema21 = calculateEMA(closes, 21);

  const lastEma9 = ema9[ema9.length - 1];
  const lastEma21 = ema21[ema21.length - 1];
  const currentPrice = closes[closes.length - 1];

  // Trend bestimmen
  if (currentPrice > lastEma9 && lastEma9 > lastEma21) {
    return 'up';
  } else if (currentPrice < lastEma9 && lastEma9 < lastEma21) {
    return 'down';
  }
  return 'sideways';
}

// EMA Daten Interface für mehrere EMAs
export interface EMAData {
  ema50: number[];
  ema200: number[];
  ema300: number[];
  currentEma50: number | null;
  currentEma200: number | null;
  currentEma300: number | null;
}

// EMA Berechnung
export function calculateEMA(data: number[], period: number): number[] {
  if (data.length < period) return new Array(data.length).fill(NaN);

  const ema: number[] = new Array(data.length).fill(NaN);
  const multiplier = 2 / (period + 1);

  // Initial SMA for first value
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  ema[period - 1] = sum / period;

  // Rest of the EMAs
  for (let i = period; i < data.length; i++) {
    ema[i] = (data[i] - ema[i - 1]) * multiplier + ema[i - 1];
  }

  return ema;
}

// Berechne mehrere EMAs auf einmal (50, 200, 300)
export function calculateMultipleEMAs(closes: number[]): EMAData {
  const ema50 = calculateEMA(closes, 50);
  const ema200 = calculateEMA(closes, 200);
  const ema300 = calculateEMA(closes, 300);

  return {
    ema50,
    ema200,
    ema300,
    currentEma50: ema50.length > 0 ? ema50[ema50.length - 1] : null,
    currentEma200: ema200.length > 0 ? ema200[ema200.length - 1] : null,
    currentEma300: ema300.length > 0 ? ema300[ema300.length - 1] : null,
  };
}

// =====================================================
// TECHNISCHE INDIKATOREN
// =====================================================

// RSI Interface
export interface RSIData {
  values: number[];
  current: number;
  signal: 'overbought' | 'oversold' | 'neutral';
}

// RSI Berechnung (Relative Strength Index)
export function calculateRSI(closes: number[], period: number = 14): RSIData {
  const rsiValues: number[] = new Array(closes.length).fill(NaN);

  if (closes.length < period + 1) {
    return { values: rsiValues, current: 50, signal: 'neutral' };
  }

  const changes = closes.slice(1).map((c, i) => c - closes[i]);
  const gains = changes.map((c) => (c > 0 ? c : 0));
  const losses = changes.map((c) => (c < 0 ? Math.abs(c) : 0));

  // Wilder's Smoothing Method
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  for (let i = period; i < closes.length; i++) {
    if (i > period) {
      avgGain = (avgGain * (period - 1) + gains[i - 1]) / period;
      avgLoss = (avgLoss * (period - 1) + losses[i - 1]) / period;
    }

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - 100 / (1 + rs);
    rsiValues[i] = rsi;
  }

  const current = rsiValues.length > 0 ? rsiValues[rsiValues.length - 1] : 50;
  let signal: 'overbought' | 'oversold' | 'neutral' = 'neutral';
  if (current > 70) signal = 'overbought';
  else if (current < 30) signal = 'oversold';

  return { values: rsiValues, current, signal };
}

// MACD Interface
export interface MACDData {
  macd: number[];
  signal: number[];
  histogram: number[];
  currentMACD: number;
  currentSignal: number;
  currentHistogram: number;
  trend: 'bullish' | 'bearish' | 'neutral';
}

// MACD Berechnung (Moving Average Convergence Divergence)
export function calculateMACD(
  closes: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDData {
  const macd: number[] = new Array(closes.length).fill(NaN);
  const signal: number[] = new Array(closes.length).fill(NaN);
  const histogram: number[] = new Array(closes.length).fill(NaN);

  if (closes.length < slowPeriod) {
    return {
      macd,
      signal,
      histogram,
      currentMACD: 0,
      currentSignal: 0,
      currentHistogram: 0,
      trend: 'neutral',
    };
  }

  const emaFast = calculateEMA(closes, fastPeriod);
  const emaSlow = calculateEMA(closes, slowPeriod);

  // MACD Line = EMA12 - EMA26
  for (let i = 0; i < closes.length; i++) {
    if (!isNaN(emaFast[i]) && !isNaN(emaSlow[i])) {
      macd[i] = emaFast[i] - emaSlow[i];
    }
  }

  // Signal Line = EMA9 of MACD
  // We need to handle the NaN values in calculateEMA for the signal line
  // Instead of using calculateEMA directly on a NaN-padded array, 
  // we'll calculate it on the non-NaN part and merge back
  const validMacdLine = macd.filter(v => !isNaN(v));
  const rawSignalLine = calculateEMA(validMacdLine, signalPeriod);

  const macdStartIndex = macd.findIndex(v => !isNaN(v));
  if (macdStartIndex !== -1) {
    for (let i = 0; i < rawSignalLine.length; i++) {
      const targetIndex = macdStartIndex + i + (signalPeriod - 1); // Adjust for EMA's own padding
      if (targetIndex < closes.length) {
        signal[targetIndex] = rawSignalLine[i];
        if (!isNaN(macd[targetIndex]) && !isNaN(signal[targetIndex])) {
          histogram[targetIndex] = macd[targetIndex] - signal[targetIndex];
        }
      }
    }
  }

  const currentMACD = macd.length > 0 && !isNaN(macd[macd.length - 1]) ? macd[macd.length - 1] : 0;
  const currentSignal = signal.length > 0 && !isNaN(signal[signal.length - 1]) ? signal[signal.length - 1] : 0;
  const currentHistogram = histogram.length > 0 && !isNaN(histogram[histogram.length - 1]) ? histogram[histogram.length - 1] : 0;

  let trend: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (currentMACD > currentSignal && currentHistogram > 0) trend = 'bullish';
  else if (currentMACD < currentSignal && currentHistogram < 0) trend = 'bearish';

  return {
    macd,
    signal,
    histogram,
    currentMACD,
    currentSignal,
    currentHistogram,
    trend,
  };
}

// VWAP Interface
export interface VWAPData {
  values: number[];
  current: number;
  pricePosition: 'above' | 'below' | 'at';
}

// VWAP Berechnung (Volume-Weighted Average Price)
export function calculateVWAP(klines: Kline[]): VWAPData {
  if (klines.length === 0) {
    return { values: [], current: 0, pricePosition: 'at' };
  }

  const vwapValues: number[] = [];
  let cumTypicalPriceVol = 0;
  let cumVolume = 0;

  for (const k of klines) {
    const typicalPrice = (k.high + k.low + k.close) / 3;
    cumTypicalPriceVol += typicalPrice * k.volume;
    cumVolume += k.volume;
    vwapValues.push(cumVolume > 0 ? cumTypicalPriceVol / cumVolume : typicalPrice);
  }

  const current = vwapValues.length > 0 ? vwapValues[vwapValues.length - 1] : 0;
  const currentPrice = klines.length > 0 ? klines[klines.length - 1].close : 0;

  let pricePosition: 'above' | 'below' | 'at' = 'at';
  const threshold = current * 0.001; // 0.1% Toleranz
  if (currentPrice > current + threshold) pricePosition = 'above';
  else if (currentPrice < current - threshold) pricePosition = 'below';

  return { values: vwapValues, current, pricePosition };
}

// Bollinger Bands Interface
export interface BollingerBandsData {
  upper: number[];
  middle: number[];
  lower: number[];
  currentUpper: number;
  currentMiddle: number;
  currentLower: number;
  bandwidth: number; // Prozentuale Breite
  pricePosition: 'above_upper' | 'below_lower' | 'in_band';
}

// SMA Berechnung (für Bollinger Bands und andere Indikatoren)
export function calculateSMA(data: number[], period: number): number[] {
  const sma: number[] = new Array(data.length).fill(NaN);
  if (data.length < period) return sma;

  for (let i = period - 1; i < data.length; i++) {
    const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    sma[i] = sum / period;
  }
  return sma;
}

// Standard-Abweichung Berechnung
function calculateStdDev(data: number[], period: number): number[] {
  const stdDev: number[] = [];
  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
    stdDev.push(Math.sqrt(variance));
  }
  return stdDev;
}

// Bollinger Bands Berechnung
export function calculateBollingerBands(
  closes: number[],
  period: number = 20,
  multiplier: number = 2
): BollingerBandsData {
  if (closes.length < period) {
    return {
      upper: [],
      middle: [],
      lower: [],
      currentUpper: 0,
      currentMiddle: 0,
      currentLower: 0,
      bandwidth: 0,
      pricePosition: 'in_band',
    };
  }

  const sma = calculateSMA(closes, period);
  const stdDev = calculateStdDev(closes, period);

  const upper = sma.map((v, i) => v + multiplier * stdDev[i]);
  const lower = sma.map((v, i) => v - multiplier * stdDev[i]);

  const currentUpper = upper.length > 0 ? upper[upper.length - 1] : 0;
  const currentMiddle = sma.length > 0 ? sma[sma.length - 1] : 0;
  const currentLower = lower.length > 0 ? lower[lower.length - 1] : 0;
  const currentPrice = closes.length > 0 ? closes[closes.length - 1] : 0;

  // Bandwidth = (Upper - Lower) / Middle * 100
  const bandwidth = currentMiddle > 0 ? ((currentUpper - currentLower) / currentMiddle) * 100 : 0;

  let pricePosition: 'above_upper' | 'below_lower' | 'in_band' = 'in_band';
  if (currentPrice > currentUpper) pricePosition = 'above_upper';
  else if (currentPrice < currentLower) pricePosition = 'below_lower';

  return {
    upper,
    middle: sma,
    lower,
    currentUpper,
    currentMiddle,
    currentLower,
    bandwidth,
    pricePosition,
  };
}

// Alle Indikatoren auf einmal berechnen
export interface TechnicalIndicators {
  rsi: RSIData;
  macd: MACDData;
  vwap: VWAPData;
  bollingerBands: BollingerBandsData;
  ema: EMAData;
}

export function calculateAllIndicators(klines: Kline[]): TechnicalIndicators {
  const closes = klines.map((k) => k.close);

  return {
    rsi: calculateRSI(closes),
    macd: calculateMACD(closes),
    vwap: calculateVWAP(klines),
    bollingerBands: calculateBollingerBands(closes),
    ema: calculateMultipleEMAs(closes),
  };
}

// Signal-Aggregation für Trading-Entscheidungen
export interface TechnicalSignal {
  direction: 'long' | 'short' | 'neutral';
  strength: number; // 0-100
  signals: {
    rsi: 'buy' | 'sell' | 'neutral';
    macd: 'buy' | 'sell' | 'neutral';
    vwap: 'buy' | 'sell' | 'neutral';
    bollinger: 'buy' | 'sell' | 'neutral';
  };
}

export function getTechnicalSignal(indicators: TechnicalIndicators, currentPrice: number): TechnicalSignal {
  const signals = {
    rsi: 'neutral' as 'buy' | 'sell' | 'neutral',
    macd: 'neutral' as 'buy' | 'sell' | 'neutral',
    vwap: 'neutral' as 'buy' | 'sell' | 'neutral',
    bollinger: 'neutral' as 'buy' | 'sell' | 'neutral',
  };

  let bullishCount = 0;
  let bearishCount = 0;

  // RSI Signal
  if (indicators.rsi.signal === 'oversold') {
    signals.rsi = 'buy';
    bullishCount++;
  } else if (indicators.rsi.signal === 'overbought') {
    signals.rsi = 'sell';
    bearishCount++;
  }

  // MACD Signal
  if (indicators.macd.trend === 'bullish') {
    signals.macd = 'buy';
    bullishCount++;
  } else if (indicators.macd.trend === 'bearish') {
    signals.macd = 'sell';
    bearishCount++;
  }

  // VWAP Signal
  if (indicators.vwap.pricePosition === 'above') {
    signals.vwap = 'buy';
    bullishCount++;
  } else if (indicators.vwap.pricePosition === 'below') {
    signals.vwap = 'sell';
    bearishCount++;
  }

  // Bollinger Signal
  if (indicators.bollingerBands.pricePosition === 'below_lower') {
    signals.bollinger = 'buy';
    bullishCount++;
  } else if (indicators.bollingerBands.pricePosition === 'above_upper') {
    signals.bollinger = 'sell';
    bearishCount++;
  }

  // Gesamt-Richtung bestimmen
  let direction: 'long' | 'short' | 'neutral' = 'neutral';
  if (bullishCount > bearishCount && bullishCount >= 2) direction = 'long';
  else if (bearishCount > bullishCount && bearishCount >= 2) direction = 'short';

  // Stärke berechnen (0-100)
  const maxSignals = 4;
  const strength = Math.round((Math.max(bullishCount, bearishCount) / maxSignals) * 100);

  return { direction, strength, signals };
}

// =====================================================
// NEUE INDIKATOREN FÜR PRESET-SYSTEM
// =====================================================

// ATR Interface
export interface ATRData {
  values: number[];
  current: number;
  percentATR: number; // ATR als % vom aktuellen Preis
}

// ATR Berechnung (Average True Range) - Volatilitätsmessung
export function calculateATR(klines: Kline[], period: number = 14): ATRData {
  const atrValues: number[] = new Array(klines.length).fill(NaN);

  if (klines.length < period + 1) {
    return { values: atrValues, current: 0, percentATR: 0 };
  }

  // True Range berechnen (Starts at index 1)
  const trueRanges: number[] = new Array(klines.length).fill(NaN);
  for (let i = 1; i < klines.length; i++) {
    const high = klines[i].high;
    const low = klines[i].low;
    const prevClose = klines[i - 1].close;
    trueRanges[i] = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
  }

  // ATR = EMA of True Range
  // Handle NaN in calculateEMA (True Range has one NaN at start)
  const validTR = trueRanges.filter(v => !isNaN(v));
  const rawATR = calculateEMA(validTR, period);

  // Map back to klines
  for (let i = 0; i < rawATR.length; i++) {
    const targetIndex = i + 1; // TR starts at index 1
    atrValues[targetIndex] = rawATR[i];
  }

  const current = atrValues.length > 0 && !isNaN(atrValues[atrValues.length - 1])
    ? atrValues[atrValues.length - 1]
    : 0;
  const currentPrice = klines[klines.length - 1].close;
  const percentATR = currentPrice > 0 ? (current / currentPrice) * 100 : 0;

  return { values: atrValues, current, percentATR };
}

// Stochastic RSI Interface
export interface StochRSIData {
  k: number[];
  d: number[];
  currentK: number;
  currentD: number;
  signal: 'overbought' | 'oversold' | 'neutral';
  crossover: 'bullish' | 'bearish' | 'none';
}

// Stochastic RSI Berechnung - Schnellere Überkauft/Überverkauft-Signale
export function calculateStochRSI(
  closes: number[],
  rsiPeriod: number = 14,
  stochPeriod: number = 14,
  kPeriod: number = 3,
  dPeriod: number = 3
): StochRSIData {
  const kLine: number[] = new Array(closes.length).fill(NaN);
  const dLine: number[] = new Array(closes.length).fill(NaN);

  if (closes.length < rsiPeriod + stochPeriod) {
    return {
      k: kLine,
      d: dLine,
      currentK: 50,
      currentD: 50,
      signal: 'neutral',
      crossover: 'none',
    };
  }

  // 1. RSI berechnen (Length = closes.length)
  const rsiData = calculateRSI(closes, rsiPeriod);
  const rsiValues = rsiData.values;

  // 2. Stochastic auf RSI anwenden
  const stochK_raw: number[] = new Array(closes.length).fill(NaN);
  for (let i = rsiPeriod + stochPeriod - 1; i < rsiValues.length; i++) {
    const slice = rsiValues.slice(i - stochPeriod + 1, i + 1);
    const lowest = Math.min(...slice);
    const highest = Math.max(...slice);
    const range = highest - lowest;
    stochK_raw[i] = range > 0 ? ((rsiValues[i] - lowest) / range) * 100 : 50;
  }

  // 3. %K glätten (SMA)
  const validStochK = stochK_raw.filter(v => !isNaN(v));
  const smoothedK_raw = calculateSMA(validStochK, kPeriod);

  const stochStartIndex = stochK_raw.findIndex(v => !isNaN(v));
  for (let i = 0; i < smoothedK_raw.length; i++) {
    const targetIndex = stochStartIndex + i;
    kLine[targetIndex] = smoothedK_raw[i];
  }

  // 4. %D = SMA von %K
  const validKLine = kLine.filter(v => !isNaN(v));
  const smoothedD_raw = calculateSMA(validKLine, dPeriod);

  const kStartIndex = kLine.findIndex(v => !isNaN(v));
  for (let i = 0; i < smoothedD_raw.length; i++) {
    const targetIndex = kStartIndex + i;
    dLine[targetIndex] = smoothedD_raw[i];
  }

  const currentK = kLine.length > 0 && !isNaN(kLine[kLine.length - 1]) ? kLine[kLine.length - 1] : 50;
  const currentD = dLine.length > 0 && !isNaN(dLine[dLine.length - 1]) ? dLine[dLine.length - 1] : 50;

  // Find previous valid values for crossover
  let prevK = currentK;
  let prevD = currentD;
  for (let i = kLine.length - 2; i >= 0; i--) {
    if (!isNaN(kLine[i]) && !isNaN(dLine[i])) {
      prevK = kLine[i];
      prevD = dLine[i];
      break;
    }
  }

  // Signal bestimmen
  let signal: 'overbought' | 'oversold' | 'neutral' = 'neutral';
  if (currentK > 80 && currentD > 80) signal = 'overbought';
  else if (currentK < 20 && currentD < 20) signal = 'oversold';

  // Crossover erkennen
  let crossover: 'bullish' | 'bearish' | 'none' = 'none';
  if (prevK <= prevD && currentK > currentD) crossover = 'bullish';
  else if (prevK >= prevD && currentK < currentD) crossover = 'bearish';

  return {
    k: kLine,
    d: dLine,
    currentK,
    currentD,
    signal,
    crossover,
  };
}

// ADX Interface
export interface ADXData {
  adx: number[];
  plusDI: number[];
  minusDI: number[];
  currentADX: number;
  currentPlusDI: number;
  currentMinusDI: number;
  trendStrength: 'strong' | 'moderate' | 'weak' | 'no_trend';
  trendDirection: 'bullish' | 'bearish' | 'neutral';
}

// ADX Berechnung (Average Directional Index) - Trendstärke
export function calculateADX(klines: Kline[], period: number = 14): ADXData {
  if (klines.length < period * 2) {
    return {
      adx: [],
      plusDI: [],
      minusDI: [],
      currentADX: 0,
      currentPlusDI: 0,
      currentMinusDI: 0,
      trendStrength: 'no_trend',
      trendDirection: 'neutral',
    };
  }

  // +DM und -DM berechnen
  const plusDM: number[] = [];
  const minusDM: number[] = [];
  const trueRanges: number[] = [];

  for (let i = 1; i < klines.length; i++) {
    const high = klines[i].high;
    const low = klines[i].low;
    const prevHigh = klines[i - 1].high;
    const prevLow = klines[i - 1].low;
    const prevClose = klines[i - 1].close;

    // Directional Movement
    const upMove = high - prevHigh;
    const downMove = prevLow - low;

    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);

    // True Range
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trueRanges.push(tr);
  }

  // Smoothed values mit Wilder's Smoothing (gleich wie EMA mit period)
  const smoothedPlusDM = calculateEMA(plusDM, period);
  const smoothedMinusDM = calculateEMA(minusDM, period);
  const smoothedTR = calculateEMA(trueRanges, period);

  // +DI und -DI berechnen
  const plusDI: number[] = [];
  const minusDI: number[] = [];

  for (let i = 0; i < smoothedTR.length; i++) {
    const tr = smoothedTR[i];
    plusDI.push(tr > 0 ? (smoothedPlusDM[i] / tr) * 100 : 0);
    minusDI.push(tr > 0 ? (smoothedMinusDM[i] / tr) * 100 : 0);
  }

  // DX berechnen
  const dx: number[] = [];
  for (let i = 0; i < plusDI.length; i++) {
    const diSum = plusDI[i] + minusDI[i];
    const diDiff = Math.abs(plusDI[i] - minusDI[i]);
    dx.push(diSum > 0 ? (diDiff / diSum) * 100 : 0);
  }

  // ADX = EMA von DX
  const adx = calculateEMA(dx, period);

  const currentADX = adx.length > 0 ? adx[adx.length - 1] : 0;
  const currentPlusDI = plusDI.length > 0 ? plusDI[plusDI.length - 1] : 0;
  const currentMinusDI = minusDI.length > 0 ? minusDI[minusDI.length - 1] : 0;

  // Trendstärke bestimmen
  let trendStrength: 'strong' | 'moderate' | 'weak' | 'no_trend' = 'no_trend';
  if (currentADX >= 50) trendStrength = 'strong';
  else if (currentADX >= 25) trendStrength = 'moderate';
  else if (currentADX >= 20) trendStrength = 'weak';

  // Trendrichtung bestimmen
  let trendDirection: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (currentPlusDI > currentMinusDI && currentADX >= 20) trendDirection = 'bullish';
  else if (currentMinusDI > currentPlusDI && currentADX >= 20) trendDirection = 'bearish';

  return {
    adx,
    plusDI,
    minusDI,
    currentADX,
    currentPlusDI,
    currentMinusDI,
    trendStrength,
    trendDirection,
  };
}

// OBV Interface
export interface OBVData {
  values: number[];
  current: number;
  trend: 'rising' | 'falling' | 'flat';
  divergence: 'bullish' | 'bearish' | 'none';
}

// OBV Berechnung (On-Balance Volume) - Volume-bestätigte Trends
export function calculateOBV(klines: Kline[]): OBVData {
  if (klines.length < 2) {
    return { values: [], current: 0, trend: 'flat', divergence: 'none' };
  }

  const obvValues: number[] = [0];
  let obv = 0;

  for (let i = 1; i < klines.length; i++) {
    if (klines[i].close > klines[i - 1].close) {
      obv += klines[i].volume;
    } else if (klines[i].close < klines[i - 1].close) {
      obv -= klines[i].volume;
    }
    // Bei gleichem Preis bleibt OBV unverändert
    obvValues.push(obv);
  }

  const current = obvValues[obvValues.length - 1];

  // OBV Trend mit EMA bestimmen
  const obvEma = calculateEMA(obvValues, 20);
  const currentObvEma = obvEma.length > 0 ? obvEma[obvEma.length - 1] : 0;
  const prevObvEma = obvEma.length > 1 ? obvEma[obvEma.length - 5] : currentObvEma;

  let trend: 'rising' | 'falling' | 'flat' = 'flat';
  const obvChange = currentObvEma - prevObvEma;
  if (obvChange > 0) trend = 'rising';
  else if (obvChange < 0) trend = 'falling';

  // Divergenz erkennen
  // Preis macht Higher High, OBV macht Lower High = bearish divergence
  // Preis macht Lower Low, OBV macht Higher Low = bullish divergence
  let divergence: 'bullish' | 'bearish' | 'none' = 'none';

  if (klines.length >= 10) {
    const recentCloses = klines.slice(-10).map(k => k.close);
    const recentOBV = obvValues.slice(-10);

    const priceUp = recentCloses[recentCloses.length - 1] > recentCloses[0];
    const obvUp = recentOBV[recentOBV.length - 1] > recentOBV[0];

    if (priceUp && !obvUp) divergence = 'bearish';
    else if (!priceUp && obvUp) divergence = 'bullish';
  }

  return { values: obvValues, current, trend, divergence };
}

// Divergenz Interface
export interface Divergence {
  type: 'bullish' | 'bearish';
  indicator: 'rsi' | 'macd';
  strength: 'regular' | 'hidden';
  priceSwing: { start: number; end: number };
  indicatorSwing: { start: number; end: number };
  confidence: number; // 0-100
}

export interface DivergenceData {
  rsiDivergence: Divergence | null;
  macdDivergence: Divergence | null;
  hasDivergence: boolean;
}

// Hilfsfunktion: Swing Points finden
function findSwingPoints(
  data: number[],
  lookback: number = 5
): { highs: { index: number; value: number }[]; lows: { index: number; value: number }[] } {
  const highs: { index: number; value: number }[] = [];
  const lows: { index: number; value: number }[] = [];

  for (let i = lookback; i < data.length - lookback; i++) {
    const slice = data.slice(i - lookback, i + lookback + 1);
    const current = data[i];

    if (current === Math.max(...slice)) {
      highs.push({ index: i, value: current });
    }
    if (current === Math.min(...slice)) {
      lows.push({ index: i, value: current });
    }
  }

  return { highs, lows };
}

// Divergenz-Erkennung
export function detectDivergence(
  klines: Kline[],
  rsiData: RSIData,
  macdData: MACDData,
  lookback: number = 20
): DivergenceData {
  if (klines.length < lookback * 2) {
    return { rsiDivergence: null, macdDivergence: null, hasDivergence: false };
  }

  const closes = klines.map(k => k.close);
  const priceSwings = findSwingPoints(closes.slice(-lookback * 2), 3);

  let rsiDivergence: Divergence | null = null;
  let macdDivergence: Divergence | null = null;

  // RSI Divergenz
  if (rsiData.values.length >= lookback) {
    const rsiSlice = rsiData.values.slice(-lookback * 2);
    const rsiSwings = findSwingPoints(rsiSlice, 3);

    // Check for bullish divergence (price lower low, RSI higher low)
    if (priceSwings.lows.length >= 2 && rsiSwings.lows.length >= 2) {
      const priceLows = priceSwings.lows.slice(-2);
      const rsiLows = rsiSwings.lows.slice(-2);

      if (priceLows[1].value < priceLows[0].value &&
        rsiLows[1].value > rsiLows[0].value) {
        rsiDivergence = {
          type: 'bullish',
          indicator: 'rsi',
          strength: 'regular',
          priceSwing: { start: priceLows[0].value, end: priceLows[1].value },
          indicatorSwing: { start: rsiLows[0].value, end: rsiLows[1].value },
          confidence: 75,
        };
      }
    }

    // Check for bearish divergence (price higher high, RSI lower high)
    if (!rsiDivergence && priceSwings.highs.length >= 2 && rsiSwings.highs.length >= 2) {
      const priceHighs = priceSwings.highs.slice(-2);
      const rsiHighs = rsiSwings.highs.slice(-2);

      if (priceHighs[1].value > priceHighs[0].value &&
        rsiHighs[1].value < rsiHighs[0].value) {
        rsiDivergence = {
          type: 'bearish',
          indicator: 'rsi',
          strength: 'regular',
          priceSwing: { start: priceHighs[0].value, end: priceHighs[1].value },
          indicatorSwing: { start: rsiHighs[0].value, end: rsiHighs[1].value },
          confidence: 75,
        };
      }
    }
  }

  // MACD Divergenz (auf Histogram)
  if (macdData.histogram.length >= lookback) {
    const histSlice = macdData.histogram.slice(-lookback * 2);
    const histSwings = findSwingPoints(histSlice, 3);

    // Bullish divergence
    if (priceSwings.lows.length >= 2 && histSwings.lows.length >= 2) {
      const priceLows = priceSwings.lows.slice(-2);
      const histLows = histSwings.lows.slice(-2);

      if (priceLows[1].value < priceLows[0].value &&
        histLows[1].value > histLows[0].value) {
        macdDivergence = {
          type: 'bullish',
          indicator: 'macd',
          strength: 'regular',
          priceSwing: { start: priceLows[0].value, end: priceLows[1].value },
          indicatorSwing: { start: histLows[0].value, end: histLows[1].value },
          confidence: 70,
        };
      }
    }

    // Bearish divergence
    if (!macdDivergence && priceSwings.highs.length >= 2 && histSwings.highs.length >= 2) {
      const priceHighs = priceSwings.highs.slice(-2);
      const histHighs = histSwings.highs.slice(-2);

      if (priceHighs[1].value > priceHighs[0].value &&
        histHighs[1].value < histHighs[0].value) {
        macdDivergence = {
          type: 'bearish',
          indicator: 'macd',
          strength: 'regular',
          priceSwing: { start: priceHighs[0].value, end: priceHighs[1].value },
          indicatorSwing: { start: histHighs[0].value, end: histHighs[1].value },
          confidence: 70,
        };
      }
    }
  }

  return {
    rsiDivergence,
    macdDivergence,
    hasDivergence: rsiDivergence !== null || macdDivergence !== null,
  };
}

// Erweiterte Indikatoren Interface
export interface ExtendedIndicators extends TechnicalIndicators {
  atr: ATRData;
  stochRSI: StochRSIData;
  adx: ADXData;
  obv: OBVData;
  divergence: DivergenceData;
}

// Alle erweiterten Indikatoren berechnen
export function calculateExtendedIndicators(klines: Kline[]): ExtendedIndicators {
  const closes = klines.map((k) => k.close);
  const baseIndicators = calculateAllIndicators(klines);

  return {
    ...baseIndicators,
    atr: calculateATR(klines),
    stochRSI: calculateStochRSI(closes),
    adx: calculateADX(klines),
    obv: calculateOBV(klines),
    divergence: detectDivergence(klines, baseIndicators.rsi, baseIndicators.macd),
  };
}

// =====================================================
// ENDE NEUE INDIKATOREN
// =====================================================

// Berechne Momentum (-100 bis 100)
function calculateMomentum(klines: Kline[]): number {
  if (klines.length < 14) return 0;

  // RSI-basiertes Momentum
  const closes = klines.map((k) => k.close);
  const changes: number[] = [];

  for (let i = 1; i < closes.length; i++) {
    changes.push(closes[i] - closes[i - 1]);
  }

  const gains = changes.map((c) => (c > 0 ? c : 0));
  const losses = changes.map((c) => (c < 0 ? Math.abs(c) : 0));

  const avgGain = gains.slice(-14).reduce((a, b) => a + b, 0) / 14;
  const avgLoss = losses.slice(-14).reduce((a, b) => a + b, 0) / 14;

  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  const rsi = 100 - 100 / (1 + rs);

  // Konvertiere RSI (0-100) zu Momentum (-100 bis 100)
  return Math.round((rsi - 50) * 2);
}

// Analysiere einen Timeframe
function analyzeTimeframe(klines: Kline[], interval: Interval): TimeframeAnalysis {
  if (klines.length === 0) {
    return {
      interval,
      klines: [],
      trend: 'sideways',
      momentum: 0,
      change: 0,
      high: 0,
      low: 0,
      avgVolume: 0,
    };
  }

  const firstClose = klines[0].close;
  const lastClose = klines[klines.length - 1].close;
  const change = ((lastClose - firstClose) / firstClose) * 100;

  const highs = klines.map((k) => k.high);
  const lows = klines.map((k) => k.low);
  const volumes = klines.map((k) => k.volume);

  return {
    interval,
    klines,
    trend: calculateTrend(klines),
    momentum: calculateMomentum(klines),
    change: Math.round(change * 100) / 100,
    high: Math.max(...highs),
    low: Math.min(...lows),
    avgVolume: volumes.reduce((a, b) => a + b, 0) / volumes.length,
  };
}

// Fetch Multi-Timeframe Daten (7 Timeframes: 1m, 3m, 5m, 15m, 1h, 4h, 1d)
export async function fetchMultiTimeframe(symbol: string = 'BTCUSDT'): Promise<MultiTimeframeData> {
  // Parallel fetchen - alle 7 Timeframes
  const [klines1m, klines3m, klines5m, klines15m, klines1h, klines4h, klines1d] = await Promise.all([
    fetchKlines(symbol, '1m', 100),
    fetchKlines(symbol, '3m', 100),
    fetchKlines(symbol, '5m', 100),
    fetchKlines(symbol, '15m', 100),
    fetchKlines(symbol, '1h', 100),
    fetchKlines(symbol, '4h', 100),
    fetchKlines(symbol, '1d', 100),
  ]);

  // Aktueller Preis aus 1m Daten (am aktuellsten)
  const currentPrice = klines1m.length > 0 ? klines1m[klines1m.length - 1].close : 0;

  return {
    symbol,
    currentPrice,
    timeframes: {
      '1m': analyzeTimeframe(klines1m, '1m'),
      '3m': analyzeTimeframe(klines3m, '3m'),
      '5m': analyzeTimeframe(klines5m, '5m'),
      '15m': analyzeTimeframe(klines15m, '15m'),
      '1h': analyzeTimeframe(klines1h, '1h'),
      '4h': analyzeTimeframe(klines4h, '4h'),
      '1d': analyzeTimeframe(klines1d, '1d'),
    },
  };
}

// Fetch Klines für einen einzelnen Timeframe (für Chart-Komponente)
export async function fetchSingleTimeframe(
  symbol: string,
  interval: Interval,
  limit: number = 200
): Promise<{ klines: Kline[]; analysis: TimeframeAnalysis }> {
  const klines = await fetchKlines(symbol, interval, limit);
  return {
    klines,
    analysis: analyzeTimeframe(klines, interval),
  };
}

// Hilfsfunktion: Symbol zu Binance Format
export function toBinanceSymbol(symbol: string): string {
  const upper = symbol.toUpperCase();
  if (upper.endsWith('USDT')) return upper;
  return `${upper}USDT`;
}

// Fetch für mehrere Symbole
export async function fetchMultipleSymbols(
  symbols: string[]
): Promise<Record<string, MultiTimeframeData>> {
  const results: Record<string, MultiTimeframeData> = {};

  // Parallel fetchen (max 3 gleichzeitig um Rate Limits zu vermeiden)
  const chunks: string[][] = [];
  for (let i = 0; i < symbols.length; i += 3) {
    chunks.push(symbols.slice(i, i + 3));
  }

  for (const chunk of chunks) {
    const chunkResults = await Promise.all(
      chunk.map((symbol) => fetchMultiTimeframe(toBinanceSymbol(symbol)))
    );

    chunkResults.forEach((result, index) => {
      results[chunk[index]] = result;
    });
  }

  return results;
}
