/**
 * Technical Indicator Calculations
 * RSI, MACD, and other indicators for TradingView-style panels
 */

export interface RSIResult {
  values: number[];
  overbought: number;
  oversold: number;
}

export interface MACDResult {
  macd: number[];
  signal: number[];
  histogram: number[];
}

export interface BollingerBandsResult {
  upper: number[];
  middle: number[];
  lower: number[];
}

/**
 * Calculate RSI (Relative Strength Index)
 * @param closes - Array of closing prices
 * @param period - RSI period (default: 14)
 * @returns RSI values array
 */
export function calculateRSI(closes: number[], period: number = 14): RSIResult {
  if (closes.length < period + 1) {
    return { values: [], overbought: 70, oversold: 30 };
  }

  const gains: number[] = [];
  const losses: number[] = [];
  const rsiValues: number[] = [];

  // Calculate price changes
  for (let i = 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }

  // Calculate initial average gain/loss
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  // Fill initial values with NaN
  for (let i = 0; i < period; i++) {
    rsiValues.push(NaN);
  }

  // Calculate RSI using smoothed moving average
  for (let i = period; i < closes.length; i++) {
    if (i > period) {
      avgGain = (avgGain * (period - 1) + gains[i - 1]) / period;
      avgLoss = (avgLoss * (period - 1) + losses[i - 1]) / period;
    }

    if (avgLoss === 0) {
      rsiValues.push(100);
    } else {
      const rs = avgGain / avgLoss;
      rsiValues.push(100 - 100 / (1 + rs));
    }
  }

  return {
    values: rsiValues,
    overbought: 70,
    oversold: 30,
  };
}

/**
 * Calculate EMA (Exponential Moving Average)
 * @param data - Array of values
 * @param period - EMA period
 * @returns EMA values array
 */
export function calculateEMA(data: number[], period: number): number[] {
  if (data.length < period) {
    return [];
  }

  const ema: number[] = [];
  const multiplier = 2 / (period + 1);

  // Start with SMA for the first value
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
    ema.push(NaN);
  }
  ema[period - 1] = sum / period;

  // Calculate EMA for remaining values
  for (let i = period; i < data.length; i++) {
    const prev = ema[i - 1];
    ema.push((data[i] - prev) * multiplier + prev);
  }

  return ema;
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 * @param closes - Array of closing prices
 * @param fastPeriod - Fast EMA period (default: 12)
 * @param slowPeriod - Slow EMA period (default: 26)
 * @param signalPeriod - Signal line period (default: 9)
 * @returns MACD line, Signal line, and Histogram
 */
export function calculateMACD(
  closes: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDResult {
  if (closes.length < slowPeriod + signalPeriod) {
    return { macd: [], signal: [], histogram: [] };
  }

  const fastEMA = calculateEMA(closes, fastPeriod);
  const slowEMA = calculateEMA(closes, slowPeriod);

  // Calculate MACD line
  const macdLine: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (isNaN(fastEMA[i]) || isNaN(slowEMA[i])) {
      macdLine.push(NaN);
    } else {
      macdLine.push(fastEMA[i] - slowEMA[i]);
    }
  }

  // Filter out NaN values for signal calculation
  const validMacd = macdLine.filter((v) => !isNaN(v));
  const signalEMA = calculateEMA(validMacd, signalPeriod);

  // Reconstruct signal line with proper alignment
  const signalLine: number[] = [];
  let signalIndex = 0;
  for (let i = 0; i < macdLine.length; i++) {
    if (isNaN(macdLine[i])) {
      signalLine.push(NaN);
    } else {
      signalLine.push(signalEMA[signalIndex] || NaN);
      signalIndex++;
    }
  }

  // Calculate histogram
  const histogram: number[] = [];
  for (let i = 0; i < macdLine.length; i++) {
    if (isNaN(macdLine[i]) || isNaN(signalLine[i])) {
      histogram.push(NaN);
    } else {
      histogram.push(macdLine[i] - signalLine[i]);
    }
  }

  return {
    macd: macdLine,
    signal: signalLine,
    histogram,
  };
}

/**
 * Calculate Bollinger Bands
 * @param closes - Array of closing prices
 * @param period - Period for moving average (default: 20)
 * @param stdDev - Standard deviation multiplier (default: 2)
 * @returns Upper, Middle, and Lower bands
 */
export function calculateBollingerBands(
  closes: number[],
  period: number = 20,
  stdDev: number = 2
): BollingerBandsResult {
  if (closes.length < period) {
    return { upper: [], middle: [], lower: [] };
  }

  const upper: number[] = [];
  const middle: number[] = [];
  const lower: number[] = [];

  // Fill initial values
  for (let i = 0; i < period - 1; i++) {
    upper.push(NaN);
    middle.push(NaN);
    lower.push(NaN);
  }

  // Calculate bands
  for (let i = period - 1; i < closes.length; i++) {
    const slice = closes.slice(i - period + 1, i + 1);
    const sma = slice.reduce((a, b) => a + b, 0) / period;

    // Calculate standard deviation
    const squaredDiffs = slice.map((v) => Math.pow(v - sma, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
    const sd = Math.sqrt(variance);

    middle.push(sma);
    upper.push(sma + stdDev * sd);
    lower.push(sma - stdDev * sd);
  }

  return { upper, middle, lower };
}

/**
 * Calculate Stochastic Oscillator
 * @param highs - Array of high prices
 * @param lows - Array of low prices
 * @param closes - Array of closing prices
 * @param kPeriod - %K period (default: 14)
 * @param dPeriod - %D period (default: 3)
 * @returns %K and %D values
 */
export function calculateStochastic(
  highs: number[],
  lows: number[],
  closes: number[],
  kPeriod: number = 14,
  dPeriod: number = 3
): { k: number[]; d: number[] } {
  if (closes.length < kPeriod) {
    return { k: [], d: [] };
  }

  const kValues: number[] = [];

  // Fill initial values
  for (let i = 0; i < kPeriod - 1; i++) {
    kValues.push(NaN);
  }

  // Calculate %K
  for (let i = kPeriod - 1; i < closes.length; i++) {
    const highSlice = highs.slice(i - kPeriod + 1, i + 1);
    const lowSlice = lows.slice(i - kPeriod + 1, i + 1);
    const highestHigh = Math.max(...highSlice);
    const lowestLow = Math.min(...lowSlice);

    if (highestHigh === lowestLow) {
      kValues.push(50);
    } else {
      const k = ((closes[i] - lowestLow) / (highestHigh - lowestLow)) * 100;
      kValues.push(k);
    }
  }

  // Calculate %D (SMA of %K)
  const dValues: number[] = [];
  for (let i = 0; i < kValues.length; i++) {
    if (i < kPeriod - 1 + dPeriod - 1 || isNaN(kValues[i])) {
      dValues.push(NaN);
    } else {
      const slice = kValues.slice(i - dPeriod + 1, i + 1);
      const sma = slice.reduce((a, b) => a + b, 0) / dPeriod;
      dValues.push(sma);
    }
  }

  return { k: kValues, d: dValues };
}

/**
 * Calculate ATR (Average True Range)
 * @param highs - Array of high prices
 * @param lows - Array of low prices
 * @param closes - Array of closing prices
 * @param period - ATR period (default: 14)
 * @returns ATR values
 */
export function calculateATR(
  highs: number[],
  lows: number[],
  closes: number[],
  period: number = 14
): number[] {
  if (closes.length < period + 1) {
    return [];
  }

  const trueRanges: number[] = [];

  // Calculate True Range
  for (let i = 1; i < closes.length; i++) {
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
    trueRanges.push(tr);
  }

  // Calculate ATR using EMA
  const atr: number[] = [NaN]; // First value offset
  let avgTR = trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period;

  for (let i = 0; i < period - 1; i++) {
    atr.push(NaN);
  }
  atr.push(avgTR);

  for (let i = period; i < trueRanges.length; i++) {
    avgTR = (avgTR * (period - 1) + trueRanges[i]) / period;
    atr.push(avgTR);
  }

  return atr;
}
