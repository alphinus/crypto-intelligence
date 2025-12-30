/**
 * Trade Signal Validation
 * 
 * Rule-based validation layer that runs AFTER LLM signal generation
 * to filter out risky setups (e.g., Long at RSI 80+)
 */

import type { TimeframeTradeSetup, TradeScore } from './groq';

// =====================================================
// TYPES
// =====================================================

export interface IndicatorValues {
    rsi: number;
    stochRsi?: { k: number; d: number };
    macd?: {
        histogram: number;
        signal: number;
        macdLine: number;
        crossover: 'bullish' | 'bearish' | 'none';
        trend: 'bullish' | 'bearish' | 'neutral';
    };
    ema?: {
        ema50: number;
        ema200: number;
        price: number;
        goldenCross: boolean;  // EMA50 > EMA200
        priceAboveEma50: boolean;
        priceAboveEma200: boolean;
    };
    volume?: {
        current: number;
        average: number;
        ratio: number; // current / average
        isAboveAverage: boolean;
    };
    atr?: {
        value: number;
        percentage: number; // ATR as % of price
    };
}

export interface ValidationResult {
    isValid: boolean;
    originalType: 'long' | 'short' | 'wait';
    validatedType: 'long' | 'short' | 'wait';
    confidenceAdjustment: 0 | -1 | -2; // 0 = no change, -1 = downgrade once, -2 = downgrade twice
    reasons: string[];
    malus: MalusResult;
}

export interface MalusResult {
    rsiExtreme: number;      // -10 to -30
    confluenceLack: number;  // -10 to -20
    fundingRateBias: number; // -5 to -15
    macdConflict: number;    // -20 to +5
    emaPosition: number;     // -15 to +10
    volumeConfirm: number;   // -20 to +10
    slQuality: number;       // -20 to +5
    total: number;
}

export interface ConfluenceResult {
    bias: 'bullish' | 'bearish' | 'mixed';
    strength: number; // 0-3 (number of aligned TFs)
    alignedTimeframes: string[];
    conflictingTimeframes: string[];
}

// =====================================================
// RSI VETO RULES
// =====================================================

/**
 * Hard rules for RSI-based signal filtering
 */
const RSI_THRESHOLDS = {
    EXTREME_OVERBOUGHT: 80,
    OVERBOUGHT: 70,
    OVERSOLD: 30,
    EXTREME_OVERSOLD: 20,
};

const STOCH_RSI_THRESHOLDS = {
    EXTREME_HIGH: 85,
    HIGH: 80,
    LOW: 20,
    EXTREME_LOW: 15,
};

/**
 * Validate a trade signal against RSI/StochRSI extreme values
 */
export function validateRSI(
    signalType: 'long' | 'short' | 'wait',
    indicators: IndicatorValues
): ValidationResult {
    const reasons: string[] = [];
    let validatedType = signalType;
    let confidenceAdjustment: 0 | -1 | -2 = 0;

    const { rsi, stochRsi } = indicators;

    // Rule 1: Block Long at extreme overbought RSI
    if (signalType === 'long') {
        if (rsi >= RSI_THRESHOLDS.EXTREME_OVERBOUGHT) {
            validatedType = 'wait';
            reasons.push(`VETO: Long blocked - RSI extreme overbought (${rsi.toFixed(1)})`);
        } else if (rsi >= RSI_THRESHOLDS.OVERBOUGHT) {
            confidenceAdjustment = -1;
            reasons.push(`WARN: Long confidence reduced - RSI overbought (${rsi.toFixed(1)})`);
        }

        // StochRSI additional check
        if (stochRsi && stochRsi.k >= STOCH_RSI_THRESHOLDS.EXTREME_HIGH && stochRsi.d >= STOCH_RSI_THRESHOLDS.EXTREME_HIGH) {
            if (validatedType !== 'wait') {
                confidenceAdjustment = -2;
                reasons.push(`WARN: StochRSI extreme high (K: ${stochRsi.k.toFixed(1)}, D: ${stochRsi.d.toFixed(1)})`);
            }
        }
    }

    // Rule 2: Block Short at extreme oversold RSI
    if (signalType === 'short') {
        if (rsi <= RSI_THRESHOLDS.EXTREME_OVERSOLD) {
            validatedType = 'wait';
            reasons.push(`VETO: Short blocked - RSI extreme oversold (${rsi.toFixed(1)})`);
        } else if (rsi <= RSI_THRESHOLDS.OVERSOLD) {
            confidenceAdjustment = -1;
            reasons.push(`WARN: Short confidence reduced - RSI oversold (${rsi.toFixed(1)})`);
        }

        // StochRSI additional check
        if (stochRsi && stochRsi.k <= STOCH_RSI_THRESHOLDS.EXTREME_LOW && stochRsi.d <= STOCH_RSI_THRESHOLDS.EXTREME_LOW) {
            if (validatedType !== 'wait') {
                confidenceAdjustment = -2;
                reasons.push(`WARN: StochRSI extreme low (K: ${stochRsi.k.toFixed(1)}, D: ${stochRsi.d.toFixed(1)})`);
            }
        }
    }

    // Calculate malus
    const malus = calculateRSIMalus(signalType, rsi, stochRsi);

    return {
        isValid: validatedType === signalType,
        originalType: signalType,
        validatedType,
        confidenceAdjustment,
        reasons,
        malus,
    };
}

/**
 * Calculate score malus based on RSI extremes
 */
function calculateRSIMalus(
    signalType: 'long' | 'short' | 'wait',
    rsi: number,
    stochRsi?: { k: number; d: number }
): MalusResult {
    let rsiExtreme = 0;

    if (signalType === 'long') {
        if (rsi >= 85) rsiExtreme = -30;
        else if (rsi >= 80) rsiExtreme = -20;
        else if (rsi >= 75) rsiExtreme = -15;
        else if (rsi >= 70) rsiExtreme = -10;
    } else if (signalType === 'short') {
        if (rsi <= 15) rsiExtreme = -30;
        else if (rsi <= 20) rsiExtreme = -20;
        else if (rsi <= 25) rsiExtreme = -15;
        else if (rsi <= 30) rsiExtreme = -10;
    }

    // Additional StochRSI malus
    if (stochRsi) {
        if (signalType === 'long' && stochRsi.k >= 90) {
            rsiExtreme -= 10;
        } else if (signalType === 'short' && stochRsi.k <= 10) {
            rsiExtreme -= 10;
        }
    }

    return {
        rsiExtreme,
        confluenceLack: 0, // Set by checkConfluence
        fundingRateBias: 0, // Set externally
        macdConflict: 0,    // Set by validateMACD
        emaPosition: 0,     // Set by validateEMA
        volumeConfirm: 0,   // Set by validateVolume
        slQuality: 0,       // Set by validateStopLoss
        total: rsiExtreme,
    };
}

// =====================================================
// TIMEFRAME CONFLUENCE GATE
// =====================================================

/**
 * Check alignment across higher timeframes
 * Requires at least 2/3 of higher TFs to agree for a valid signal
 */
export function checkConfluence(
    recommendations: Record<string, TimeframeTradeSetup | null>
): ConfluenceResult {
    const higherTimeframes = ['1h', '4h', '1d'];
    const signalTypes: Array<{ tf: string; type: 'long' | 'short' | 'wait' }> = [];

    for (const tf of higherTimeframes) {
        const rec = recommendations[tf];
        if (rec && rec.type) {
            signalTypes.push({ tf, type: rec.type });
        }
    }

    const longs = signalTypes.filter(s => s.type === 'long');
    const shorts = signalTypes.filter(s => s.type === 'short');
    const waits = signalTypes.filter(s => s.type === 'wait');

    // Determine bias
    if (longs.length >= 2) {
        return {
            bias: 'bullish',
            strength: longs.length,
            alignedTimeframes: longs.map(s => s.tf),
            conflictingTimeframes: shorts.map(s => s.tf),
        };
    }

    if (shorts.length >= 2) {
        return {
            bias: 'bearish',
            strength: shorts.length,
            alignedTimeframes: shorts.map(s => s.tf),
            conflictingTimeframes: longs.map(s => s.tf),
        };
    }

    // Mixed signals - no clear confluence
    return {
        bias: 'mixed',
        strength: 0,
        alignedTimeframes: waits.map(s => s.tf),
        conflictingTimeframes: [...longs, ...shorts].map(s => s.tf),
    };
}

/**
 * Calculate confluence malus
 */
export function calculateConfluenceMalus(confluence: ConfluenceResult): number {
    if (confluence.strength >= 3) return 0;   // Perfect confluence
    if (confluence.strength === 2) return -5; // Good confluence
    if (confluence.strength === 1) return -15; // Weak confluence
    return -20; // No confluence (mixed)
}

// =====================================================
// FUNDING RATE BIAS
// =====================================================

/**
 * Calculate malus based on funding rate
 * High positive funding = crowded longs (risk for long)
 * High negative funding = crowded shorts (risk for short)
 */
export function calculateFundingRateMalus(
    signalType: 'long' | 'short' | 'wait',
    fundingRate: number
): number {
    const fundingPercent = fundingRate * 100;

    if (signalType === 'long') {
        if (fundingPercent > 0.05) return -15;
        if (fundingPercent > 0.03) return -10;
        if (fundingPercent > 0.01) return -5;
    } else if (signalType === 'short') {
        if (fundingPercent < -0.05) return -15;
        if (fundingPercent < -0.03) return -10;
        if (fundingPercent < -0.01) return -5;
    }

    return 0;
}

// =====================================================
// MACD CROSSOVER VALIDATION
// =====================================================

/**
 * Validate signal against MACD crossover
 * Block Long if MACD is bearish, Block Short if MACD is bullish
 */
export function validateMACD(
    signalType: 'long' | 'short' | 'wait',
    macd: IndicatorValues['macd']
): { isValid: boolean; malus: number; reason: string | null } {
    if (!macd) return { isValid: true, malus: 0, reason: null };

    // MACD Trend Validation
    if (signalType === 'long') {
        if (macd.trend === 'bearish' && macd.histogram < 0) {
            return {
                isValid: false,
                malus: -20,
                reason: `VETO: Long blocked - MACD bearish (histogram: ${macd.histogram.toFixed(2)})`
            };
        }
        if (macd.crossover === 'bearish') {
            return {
                isValid: true,
                malus: -15,
                reason: `WARN: MACD bearish crossover detected`
            };
        }
    }

    if (signalType === 'short') {
        if (macd.trend === 'bullish' && macd.histogram > 0) {
            return {
                isValid: false,
                malus: -20,
                reason: `VETO: Short blocked - MACD bullish (histogram: ${macd.histogram.toFixed(2)})`
            };
        }
        if (macd.crossover === 'bullish') {
            return {
                isValid: true,
                malus: -15,
                reason: `WARN: MACD bullish crossover detected`
            };
        }
    }

    // Bonus for signal alignment with MACD
    if (signalType === 'long' && macd.crossover === 'bullish' && macd.histogram > 0) {
        return { isValid: true, malus: 5, reason: null }; // Positive bonus
    }
    if (signalType === 'short' && macd.crossover === 'bearish' && macd.histogram < 0) {
        return { isValid: true, malus: 5, reason: null }; // Positive bonus
    }

    return { isValid: true, malus: 0, reason: null };
}

// =====================================================
// EMA GOLDEN CROSS VALIDATION
// =====================================================

/**
 * Validate signal against EMA positioning
 * Long: Price > EMA50 > EMA200 (Golden Cross)
 * Short: Price < EMA50 < EMA200 (Death Cross)
 */
export function validateEMA(
    signalType: 'long' | 'short' | 'wait',
    ema: IndicatorValues['ema']
): { isValid: boolean; malus: number; reason: string | null } {
    if (!ema) return { isValid: true, malus: 0, reason: null };

    if (signalType === 'long') {
        // Perfect setup: Price > EMA50 > EMA200
        if (ema.priceAboveEma50 && ema.goldenCross) {
            return { isValid: true, malus: 10, reason: null }; // Bonus!
        }
        // Warning: Price below EMA50
        if (!ema.priceAboveEma50) {
            return {
                isValid: true,
                malus: -10,
                reason: `WARN: Price below EMA50`
            };
        }
        // Risky: Death Cross active (EMA50 < EMA200)
        if (!ema.goldenCross) {
            return {
                isValid: true,
                malus: -15,
                reason: `WARN: Death Cross active - Long risky`
            };
        }
    }

    if (signalType === 'short') {
        // Perfect setup: Price < EMA50 < EMA200
        if (!ema.priceAboveEma50 && !ema.goldenCross) {
            return { isValid: true, malus: 10, reason: null }; // Bonus!
        }
        // Warning: Price above EMA50
        if (ema.priceAboveEma50) {
            return {
                isValid: true,
                malus: -10,
                reason: `WARN: Price above EMA50`
            };
        }
        // Risky: Golden Cross active
        if (ema.goldenCross) {
            return {
                isValid: true,
                malus: -15,
                reason: `WARN: Golden Cross active - Short risky`
            };
        }
    }

    return { isValid: true, malus: 0, reason: null };
}

// =====================================================
// VOLUME CONFIRMATION
// =====================================================

/**
 * Validate signal has volume confirmation
 * Low volume signals are less reliable
 */
export function validateVolume(
    signalType: 'long' | 'short' | 'wait',
    volume: IndicatorValues['volume']
): { malus: number; reason: string | null } {
    if (!volume || signalType === 'wait') return { malus: 0, reason: null };

    // Strong volume confirmation
    if (volume.ratio >= 1.5) {
        return { malus: 10, reason: null }; // Bonus for high volume
    }

    // Normal volume
    if (volume.ratio >= 0.8) {
        return { malus: 0, reason: null };
    }

    // Low volume warning
    if (volume.ratio >= 0.5) {
        return {
            malus: -10,
            reason: `WARN: Low volume (${(volume.ratio * 100).toFixed(0)}% of avg)`
        };
    }

    // Very low volume - signal unreliable
    return {
        malus: -20,
        reason: `WARN: Very low volume (${(volume.ratio * 100).toFixed(0)}% of avg) - signal unreliable`
    };
}

// =====================================================
// ATR-BASED STOP LOSS VALIDATION
// =====================================================

/**
 * Validate stop loss is not too tight relative to ATR
 * SL should be at least 1x ATR to avoid getting stopped out by noise
 */
export function validateStopLoss(
    signal: { type: 'long' | 'short' | 'wait'; entry: number | 'market'; stopLoss: number },
    atr: IndicatorValues['atr'],
    currentPrice: number
): { malus: number; reason: string | null } {
    if (!atr || signal.type === 'wait') return { malus: 0, reason: null };

    const entryPrice = signal.entry === 'market' ? currentPrice : signal.entry;
    const slDistance = Math.abs(entryPrice - signal.stopLoss);
    const atrMultiple = slDistance / atr.value;

    // SL is too tight
    if (atrMultiple < 0.5) {
        return {
            malus: -20,
            reason: `WARN: SL too tight (${atrMultiple.toFixed(1)}x ATR) - high risk of stop hunt`
        };
    }

    if (atrMultiple < 1.0) {
        return {
            malus: -10,
            reason: `WARN: SL below 1x ATR (${atrMultiple.toFixed(1)}x)`
        };
    }

    // Good SL placement
    if (atrMultiple >= 1.5 && atrMultiple <= 3.0) {
        return { malus: 5, reason: null }; // Bonus for optimal SL
    }

    // SL might be too wide
    if (atrMultiple > 4.0) {
        return {
            malus: -5,
            reason: `INFO: SL quite wide (${atrMultiple.toFixed(1)}x ATR)`
        };
    }

    return { malus: 0, reason: null };
}

// =====================================================
// FULL SIGNAL VALIDATION
// =====================================================

export interface FullValidationInput {
    signal: TimeframeTradeSetup;
    indicators: IndicatorValues;
    allRecommendations?: Record<string, TimeframeTradeSetup | null>;
    fundingRate?: number;
}

export interface FullValidationResult extends ValidationResult {
    confluence: ConfluenceResult | null;
    adjustedScore: number | null;
}

/**
 * Full validation pipeline combining all rules
 */
export function validateSignal(input: FullValidationInput): FullValidationResult {
    const { signal, indicators, allRecommendations, fundingRate } = input;

    // Step 1: RSI validation
    const rsiResult = validateRSI(signal.type, indicators);

    // Step 2: Confluence check (if recommendations available)
    let confluence: ConfluenceResult | null = null;
    let confluenceMalus = 0;

    if (allRecommendations) {
        confluence = checkConfluence(allRecommendations);
        confluenceMalus = calculateConfluenceMalus(confluence);

        // Block signal if trading against higher TF confluence
        if (confluence.bias !== 'mixed' && rsiResult.validatedType !== 'wait') {
            if (
                (rsiResult.validatedType === 'long' && confluence.bias === 'bearish') ||
                (rsiResult.validatedType === 'short' && confluence.bias === 'bullish')
            ) {
                rsiResult.validatedType = 'wait';
                rsiResult.reasons.push(`VETO: Signal conflicts with ${confluence.bias} higher TF confluence`);
            }
        }
    }

    // Step 3: Funding rate malus
    let fundingMalus = 0;
    if (fundingRate !== undefined) {
        fundingMalus = calculateFundingRateMalus(rsiResult.validatedType, fundingRate);
        if (fundingMalus < -10) {
            rsiResult.reasons.push(`WARN: High funding rate risk (${(fundingRate * 100).toFixed(4)}%)`);
        }
    }

    // Step 4: MACD validation
    let macdMalus = 0;
    if (indicators.macd && rsiResult.validatedType !== 'wait') {
        const macdResult = validateMACD(rsiResult.validatedType, indicators.macd);
        macdMalus = macdResult.malus;
        if (!macdResult.isValid) {
            rsiResult.validatedType = 'wait';
        }
        if (macdResult.reason) {
            rsiResult.reasons.push(macdResult.reason);
        }
    }

    // Step 5: EMA validation
    let emaMalus = 0;
    if (indicators.ema && rsiResult.validatedType !== 'wait') {
        const emaResult = validateEMA(rsiResult.validatedType, indicators.ema);
        emaMalus = emaResult.malus;
        if (emaResult.reason) {
            rsiResult.reasons.push(emaResult.reason);
        }
    }

    // Step 6: Volume validation
    let volumeMalus = 0;
    if (indicators.volume && rsiResult.validatedType !== 'wait') {
        const volumeResult = validateVolume(rsiResult.validatedType, indicators.volume);
        volumeMalus = volumeResult.malus;
        if (volumeResult.reason) {
            rsiResult.reasons.push(volumeResult.reason);
        }
    }

    // Step 7: ATR-based SL validation
    let slMalus = 0;
    if (indicators.atr && rsiResult.validatedType !== 'wait' && signal.stopLoss) {
        const slResult = validateStopLoss(
            { type: rsiResult.validatedType, entry: signal.entry, stopLoss: signal.stopLoss },
            indicators.atr,
            typeof signal.entry === 'number' ? signal.entry : 0
        );
        slMalus = slResult.malus;
        if (slResult.reason) {
            rsiResult.reasons.push(slResult.reason);
        }
    }

    // Step 8: Calculate total malus
    const totalMalus: MalusResult = {
        rsiExtreme: rsiResult.malus.rsiExtreme,
        confluenceLack: confluenceMalus,
        fundingRateBias: fundingMalus,
        macdConflict: macdMalus,
        emaPosition: emaMalus,
        volumeConfirm: volumeMalus,
        slQuality: slMalus,
        total: rsiResult.malus.rsiExtreme + confluenceMalus + fundingMalus + macdMalus + emaMalus + volumeMalus + slMalus,
    };

    // Step 9: Adjust score (if signal has a score - some signals may have it via ScoredTradeSetup)
    let adjustedScore: number | null = null;
    const signalWithScore = signal as { score?: { total: number } };
    if (signalWithScore.score?.total !== undefined) {
        adjustedScore = Math.max(0, Math.min(100, signalWithScore.score.total + totalMalus.total));
    }

    return {
        ...rsiResult,
        malus: totalMalus,
        confluence,
        adjustedScore,
    };
}

// =====================================================
// CONFIDENCE ADJUSTMENT
// =====================================================

/**
 * Downgrade confidence based on validation result
 */
export function adjustConfidence(
    originalConfidence: 'high' | 'medium' | 'low',
    adjustment: 0 | -1 | -2
): 'high' | 'medium' | 'low' {
    const levels: Array<'high' | 'medium' | 'low'> = ['high', 'medium', 'low'];
    const currentIndex = levels.indexOf(originalConfidence);
    const newIndex = Math.min(2, currentIndex - adjustment);
    return levels[newIndex];
}

// =====================================================
// VERDICT CALCULATION
// =====================================================

/**
 * Calculate verdict based on adjusted score
 */
export function calculateVerdict(score: number): 'TAKE IT' | 'RISKY' | 'LEAVE IT' {
    if (score >= 65) return 'TAKE IT';
    if (score >= 45) return 'RISKY';
    return 'LEAVE IT';
}
