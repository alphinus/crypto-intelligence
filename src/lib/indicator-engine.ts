/**
 * Indicator Engine
 * 
 * Centralized indicator calculation and snapshot generation
 * Used for AI analysis input and signal generation
 */

import { calculateRSI, calculateMACD, calculateATR, calculateEMA } from './indicators';
import { calculateStochRSI } from './binance-klines';
import type { IndicatorSnapshot } from './signal-storage';
import type { Kline } from './binance-klines';

// =====================================================
// INTERFACES
// =====================================================

export interface IndicatorEngineInput {
    klines: Kline[];
    rsiPeriod?: number;
    macdFast?: number;
    macdSlow?: number;
    macdSignal?: number;
    atrPeriod?: number;
}

export interface IndicatorSignal {
    type: 'long' | 'short' | 'wait';
    confidence: number;  // 0-100
    reasons: string[];
    triggeringRules: string[];
}

// =====================================================
// SNAPSHOT CALCULATION
// =====================================================

/**
 * Calculate a complete indicator snapshot from klines
 * This snapshot can be sent to AI analysis or stored with signals
 */
export function calculateIndicatorSnapshot(input: IndicatorEngineInput): IndicatorSnapshot | null {
    const {
        klines,
        rsiPeriod = 14,
        macdFast = 12,
        macdSlow = 26,
        macdSignal = 9,
        atrPeriod = 14,
    } = input;

    if (klines.length < Math.max(macdSlow + macdSignal, 50)) {
        console.warn('Not enough klines for indicator calculation');
        return null;
    }

    const closes = klines.map(k => k.close);
    const highs = klines.map(k => k.high);
    const lows = klines.map(k => k.low);
    const currentPrice = closes[closes.length - 1];

    // RSI
    const rsiResult = calculateRSI(closes, rsiPeriod);
    const rsi = rsiResult.values.filter(v => !isNaN(v));
    const currentRSI = rsi.length > 0 ? rsi[rsi.length - 1] : 50;

    // MACD
    const macdResult = calculateMACD(closes, macdFast, macdSlow, macdSignal);
    const macdLine = macdResult.macd.filter(v => !isNaN(v));
    const signalLine = macdResult.signal.filter(v => !isNaN(v));
    const histogram = macdResult.histogram.filter(v => !isNaN(v));

    const currentMacdLine = macdLine.length > 0 ? macdLine[macdLine.length - 1] : 0;
    const currentSignalLine = signalLine.length > 0 ? signalLine[signalLine.length - 1] : 0;
    const currentHistogram = histogram.length > 0 ? histogram[histogram.length - 1] : 0;

    // StochRSI
    const stochRsiResult = calculateStochRSI(closes);
    const currentK = stochRsiResult.currentK;
    const currentD = stochRsiResult.currentD;

    // ATR
    const atrValues = calculateATR(highs, lows, closes, atrPeriod);
    const validAtr = atrValues.filter(v => !isNaN(v));
    const currentATR = validAtr.length > 0 ? validAtr[validAtr.length - 1] : 0;
    const atrPercent = currentPrice > 0 ? (currentATR / currentPrice) * 100 : 0;

    // EMAs
    const ema20Values = calculateEMA(closes, 20);
    const ema50Values = calculateEMA(closes, 50);
    const ema200Values = calculateEMA(closes, 200);

    const ema20 = ema20Values.length > 0 ? ema20Values[ema20Values.length - 1] : currentPrice;
    const ema50 = ema50Values.length > 0 ? ema50Values[ema50Values.length - 1] : currentPrice;
    const ema200 = ema200Values.length > 0 ? ema200Values[ema200Values.length - 1] : currentPrice;

    return {
        rsi: Math.round(currentRSI * 100) / 100,
        macd: {
            line: Math.round(currentMacdLine * 10000) / 10000,
            signal: Math.round(currentSignalLine * 10000) / 10000,
            histogram: Math.round(currentHistogram * 10000) / 10000,
        },
        stochRsi: {
            k: Math.round(currentK * 100) / 100,
            d: Math.round(currentD * 100) / 100,
        },
        atr: Math.round(currentATR * 100) / 100,
        atrPercent: Math.round(atrPercent * 100) / 100,
        emaPositions: {
            price: currentPrice,
            ema20: Math.round(ema20 * 100) / 100,
            ema50: Math.round(ema50 * 100) / 100,
            ema200: Math.round(ema200 * 100) / 100,
        },
    };
}

// =====================================================
// RULE-BASED SIGNAL GENERATION
// =====================================================

interface IndicatorRule {
    id: string;
    name: string;
    weight: number;  // 1-10
    direction: 'long' | 'short';
    check: (snapshot: IndicatorSnapshot) => boolean;
}

/**
 * Predefined indicator rules for signal generation
 */
const INDICATOR_RULES: IndicatorRule[] = [
    // RSI Rules
    {
        id: 'rsi_oversold',
        name: 'RSI Überverkauft (<30)',
        weight: 8,
        direction: 'long',
        check: (s) => s.rsi < 30,
    },
    {
        id: 'rsi_overbought',
        name: 'RSI Überkauft (>70)',
        weight: 8,
        direction: 'short',
        check: (s) => s.rsi > 70,
    },
    {
        id: 'rsi_bullish_zone',
        name: 'RSI im bullischen Bereich (50-65)',
        weight: 4,
        direction: 'long',
        check: (s) => s.rsi >= 50 && s.rsi <= 65,
    },
    {
        id: 'rsi_bearish_zone',
        name: 'RSI im bärischen Bereich (35-50)',
        weight: 4,
        direction: 'short',
        check: (s) => s.rsi >= 35 && s.rsi < 50,
    },

    // MACD Rules
    {
        id: 'macd_bullish_cross',
        name: 'MACD Bullish Cross',
        weight: 7,
        direction: 'long',
        check: (s) => s.macd.line > s.macd.signal && s.macd.histogram > 0,
    },
    {
        id: 'macd_bearish_cross',
        name: 'MACD Bearish Cross',
        weight: 7,
        direction: 'short',
        check: (s) => s.macd.line < s.macd.signal && s.macd.histogram < 0,
    },
    {
        id: 'macd_strong_momentum_up',
        name: 'MACD starkes Momentum aufwärts',
        weight: 5,
        direction: 'long',
        check: (s) => s.macd.histogram > 0 && s.macd.line > 0,
    },
    {
        id: 'macd_strong_momentum_down',
        name: 'MACD starkes Momentum abwärts',
        weight: 5,
        direction: 'short',
        check: (s) => s.macd.histogram < 0 && s.macd.line < 0,
    },

    // StochRSI Rules
    {
        id: 'stochrsi_oversold',
        name: 'StochRSI Überverkauft (<20)',
        weight: 6,
        direction: 'long',
        check: (s) => s.stochRsi.k < 20 && s.stochRsi.d < 20,
    },
    {
        id: 'stochrsi_overbought',
        name: 'StochRSI Überkauft (>80)',
        weight: 6,
        direction: 'short',
        check: (s) => s.stochRsi.k > 80 && s.stochRsi.d > 80,
    },
    {
        id: 'stochrsi_bullish_cross',
        name: 'StochRSI K kreuzt D aufwärts',
        weight: 5,
        direction: 'long',
        check: (s) => s.stochRsi.k > s.stochRsi.d && s.stochRsi.k < 50,
    },
    {
        id: 'stochrsi_bearish_cross',
        name: 'StochRSI K kreuzt D abwärts',
        weight: 5,
        direction: 'short',
        check: (s) => s.stochRsi.k < s.stochRsi.d && s.stochRsi.k > 50,
    },

    // EMA Rules
    {
        id: 'ema_bullish_stack',
        name: 'Bullish EMA Stack (Preis > 20 > 50 > 200)',
        weight: 9,
        direction: 'long',
        check: (s) => {
            if (!s.emaPositions) return false;
            const { price, ema20, ema50, ema200 } = s.emaPositions;
            return price > ema20 && ema20 > ema50 && ema50 > ema200;
        },
    },
    {
        id: 'ema_bearish_stack',
        name: 'Bearish EMA Stack (Preis < 20 < 50 < 200)',
        weight: 9,
        direction: 'short',
        check: (s) => {
            if (!s.emaPositions) return false;
            const { price, ema20, ema50, ema200 } = s.emaPositions;
            return price < ema20 && ema20 < ema50 && ema50 < ema200;
        },
    },
    {
        id: 'ema_golden_cross_zone',
        name: 'Preis über EMA 200',
        weight: 6,
        direction: 'long',
        check: (s) => {
            if (!s.emaPositions) return false;
            return s.emaPositions.price > s.emaPositions.ema200;
        },
    },
    {
        id: 'ema_death_cross_zone',
        name: 'Preis unter EMA 200',
        weight: 6,
        direction: 'short',
        check: (s) => {
            if (!s.emaPositions) return false;
            return s.emaPositions.price < s.emaPositions.ema200;
        },
    },
];

/**
 * Evaluate all indicator rules and generate a signal
 */
export function evaluateIndicatorRules(snapshot: IndicatorSnapshot): IndicatorSignal {
    const longRules: IndicatorRule[] = [];
    const shortRules: IndicatorRule[] = [];
    let longScore = 0;
    let shortScore = 0;

    // Check all rules
    for (const rule of INDICATOR_RULES) {
        if (rule.check(snapshot)) {
            if (rule.direction === 'long') {
                longRules.push(rule);
                longScore += rule.weight;
            } else {
                shortRules.push(rule);
                shortScore += rule.weight;
            }
        }
    }

    // Determine signal type
    const scoreDifference = longScore - shortScore;
    const maxPossibleScore = INDICATOR_RULES.reduce((sum, r) => sum + r.weight, 0) / 2;  // Approximate

    let type: 'long' | 'short' | 'wait';
    let confidence: number;
    let reasons: string[];
    let triggeringRules: string[];

    // Strong RSI extremes act as veto
    const rsiVetoLong = snapshot.rsi > 75;  // Don't go long when extremely overbought
    const rsiVetoShort = snapshot.rsi < 25;  // Don't go short when extremely oversold

    if (scoreDifference >= 10 && !rsiVetoLong) {
        type = 'long';
        confidence = Math.min(95, Math.round((longScore / maxPossibleScore) * 100));
        reasons = longRules.map(r => r.name);
        triggeringRules = longRules.map(r => r.id);
    } else if (scoreDifference <= -10 && !rsiVetoShort) {
        type = 'short';
        confidence = Math.min(95, Math.round((shortScore / maxPossibleScore) * 100));
        reasons = shortRules.map(r => r.name);
        triggeringRules = shortRules.map(r => r.id);
    } else {
        type = 'wait';
        confidence = 0;
        reasons = ['Keine klare Signal-Konfluenz', `Long Score: ${longScore}, Short Score: ${shortScore}`];
        triggeringRules = [];
    }

    // Add veto reasons if applicable
    if (rsiVetoLong && scoreDifference >= 10) {
        reasons.unshift('⚠️ RSI-Veto: Überkauft - kein Long-Signal');
    }
    if (rsiVetoShort && scoreDifference <= -10) {
        reasons.unshift('⚠️ RSI-Veto: Überverkauft - kein Short-Signal');
    }

    return {
        type,
        confidence,
        reasons,
        triggeringRules,
    };
}

/**
 * Format indicator snapshot for AI prompt
 */
export function formatSnapshotForAI(snapshot: IndicatorSnapshot): string {
    const rsiStatus = snapshot.rsi > 70 ? '⚠️ ÜBERKAUFT' :
        snapshot.rsi < 30 ? '⚠️ ÜBERVERKAUFT' : '';

    const macdTrend = snapshot.macd.histogram > 0 ? 'bullisch' :
        snapshot.macd.histogram < 0 ? 'bärisch' : 'neutral';

    const stochStatus = snapshot.stochRsi.k > 80 ? '⚠️ überkauft' :
        snapshot.stochRsi.k < 20 ? '⚠️ überverkauft' : '';

    let emaStatus = '';
    if (snapshot.emaPositions) {
        const { price, ema20, ema50, ema200 } = snapshot.emaPositions;
        if (price > ema20 && ema20 > ema50 && ema50 > ema200) {
            emaStatus = '✅ Bullish Stack';
        } else if (price < ema20 && ema20 < ema50 && ema50 < ema200) {
            emaStatus = '⚠️ Bearish Stack';
        } else if (price > ema200) {
            emaStatus = 'Über EMA200';
        } else {
            emaStatus = 'Unter EMA200';
        }
    }

    return `TECHNISCHE INDIKATOREN:
- RSI(14): ${snapshot.rsi.toFixed(1)} ${rsiStatus}
- MACD: Line ${snapshot.macd.line.toFixed(4)}, Signal ${snapshot.macd.signal.toFixed(4)}, Histogram ${snapshot.macd.histogram.toFixed(4)} (${macdTrend})
- StochRSI: K=${snapshot.stochRsi.k.toFixed(1)}, D=${snapshot.stochRsi.d.toFixed(1)} ${stochStatus}
- ATR(14): ${snapshot.atr.toFixed(2)} (${snapshot.atrPercent.toFixed(2)}% vom Preis)
- EMA Status: ${emaStatus}`;
}

/**
 * Get all available indicator rules (for UI display)
 */
export function getIndicatorRules(): Omit<IndicatorRule, 'check'>[] {
    return INDICATOR_RULES.map(({ id, name, weight, direction }) => ({
        id,
        name,
        weight,
        direction,
    }));
}
