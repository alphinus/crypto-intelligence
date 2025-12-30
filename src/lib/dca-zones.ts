// DCA Zone Calculation Library
// Optimized for Spot Trading with Dollar Cost Averaging

import type { FearGreedIndex } from '@/types/news';

// Zone Types
export type DCAZoneType = 'strong_buy' | 'buy' | 'neutral' | 'caution' | 'wait';
export type DCAPreset = 'ema' | 'feargreed' | 'rsi' | 'fibonacci' | 'combined';

export interface DCAZone {
    type: DCAZoneType;
    score: number; // 0-100
    label: string;
    color: string;
    bgColor: string;
    recommendation: string;
}

export interface DCACalculation {
    zone: DCAZone;
    factors: {
        ema: { score: number; description: string };
        fearGreed: { score: number; description: string };
        rsi: { score: number; description: string };
        fibonacci: { score: number; description: string };
    };
    combinedScore: number;
}

// Zone configurations
const ZONE_CONFIG: Record<DCAZoneType, Omit<DCAZone, 'score'>> = {
    strong_buy: {
        type: 'strong_buy',
        label: 'Starke Kaufgelegenheit',
        color: '#22c55e',
        bgColor: 'rgba(34, 197, 94, 0.2)',
        recommendation: 'Sofort kaufen oder Budget erhöhen',
    },
    buy: {
        type: 'buy',
        label: 'Guter Kaufzeitpunkt',
        color: '#84cc16',
        bgColor: 'rgba(132, 204, 22, 0.2)',
        recommendation: 'Regulären DCA-Kauf durchführen',
    },
    neutral: {
        type: 'neutral',
        label: 'Neutral',
        color: '#eab308',
        bgColor: 'rgba(234, 179, 8, 0.2)',
        recommendation: 'Standard DCA fortsetzen',
    },
    caution: {
        type: 'caution',
        label: 'Vorsicht',
        color: '#f97316',
        bgColor: 'rgba(249, 115, 22, 0.2)',
        recommendation: 'Kleinere Beträge oder abwarten',
    },
    wait: {
        type: 'wait',
        label: 'Überhitzt',
        color: '#ef4444',
        bgColor: 'rgba(239, 68, 68, 0.2)',
        recommendation: 'DCA pausieren, Markt überhitzt',
    },
};

// Calculate EMA-based zone score
export function calculateEMAZoneScore(
    currentPrice: number,
    ema50: number | null,
    ema200: number | null,
    ema300?: number | null
): { score: number; description: string } {
    if (!ema200) {
        return { score: 50, description: 'Nicht genug Daten für EMA-Analyse' };
    }

    const ema50Value = ema50 || currentPrice;
    const ema200Value = ema200;
    const ema300Value = ema300 || ema200Value;

    // Calculate price position relative to EMAs
    const distanceFrom200 = ((currentPrice - ema200Value) / ema200Value) * 100;
    const distanceFrom50 = ((currentPrice - ema50Value) / ema50Value) * 100;

    let score: number;
    let description: string;

    if (currentPrice < ema300Value) {
        // Deep discount - below 300 EMA
        score = 95;
        description = 'Preis unter 300 EMA - historisch starke Kaufzone';
    } else if (currentPrice < ema200Value) {
        // Below 200 EMA - accumulation zone
        score = 85;
        description = 'Preis unter 200 EMA - Akkumulationszone';
    } else if (currentPrice < ema50Value) {
        // Between 200 and 50 EMA
        score = 65;
        description = 'Preis zwischen 50 und 200 EMA - solide Zone';
    } else if (distanceFrom50 < 10) {
        // Slightly above 50 EMA
        score = 50;
        description = 'Preis leicht über 50 EMA - neutral';
    } else if (distanceFrom50 < 20) {
        // Moderately above 50 EMA
        score = 35;
        description = 'Preis moderat über 50 EMA - Vorsicht';
    } else {
        // Far above 50 EMA - overheated
        score = Math.max(10, 30 - distanceFrom50);
        description = 'Preis weit über EMAs - überhitzt';
    }

    return { score, description };
}

// Calculate Fear & Greed based zone score
export function calculateFearGreedZoneScore(
    fearGreed: FearGreedIndex | null
): { score: number; description: string } {
    if (!fearGreed) {
        return { score: 50, description: 'Fear & Greed Daten nicht verfügbar' };
    }

    const value = fearGreed.value;
    let score: number;
    let description: string;

    if (value <= 20) {
        score = 95;
        description = `Extreme Angst (${value}) - historisch bester Kaufzeitpunkt`;
    } else if (value <= 35) {
        score = 80;
        description = `Angst (${value}) - guter Kaufzeitpunkt`;
    } else if (value <= 45) {
        score = 65;
        description = `Leichte Angst (${value}) - solide`;
    } else if (value <= 55) {
        score = 50;
        description = `Neutral (${value}) - Standard DCA`;
    } else if (value <= 70) {
        score = 35;
        description = `Gier (${value}) - Vorsicht`;
    } else if (value <= 85) {
        score = 20;
        description = `Hohe Gier (${value}) - reduzieren`;
    } else {
        score = 10;
        description = `Extreme Gier (${value}) - pausieren`;
    }

    return { score, description };
}

// Calculate RSI-based zone score
export function calculateRSIZoneScore(
    rsi: number | null
): { score: number; description: string } {
    if (rsi === null || rsi === undefined) {
        return { score: 50, description: 'RSI Daten nicht verfügbar' };
    }

    let score: number;
    let description: string;

    if (rsi <= 25) {
        score = 95;
        description = `RSI stark überverkauft (${rsi.toFixed(0)})`;
    } else if (rsi <= 35) {
        score = 80;
        description = `RSI überverkauft (${rsi.toFixed(0)})`;
    } else if (rsi <= 45) {
        score = 65;
        description = `RSI leicht überverkauft (${rsi.toFixed(0)})`;
    } else if (rsi <= 55) {
        score = 50;
        description = `RSI neutral (${rsi.toFixed(0)})`;
    } else if (rsi <= 65) {
        score = 40;
        description = `RSI leicht überkauft (${rsi.toFixed(0)})`;
    } else if (rsi <= 75) {
        score = 25;
        description = `RSI überkauft (${rsi.toFixed(0)})`;
    } else {
        score = 10;
        description = `RSI stark überkauft (${rsi.toFixed(0)})`;
    }

    return { score, description };
}

// Calculate Fibonacci-based zone score
export function calculateFibonacciZoneScore(
    currentPrice: number,
    fib382: number | null,
    fib618: number | null,
    fibHigh: number | null,
    fibLow: number | null
): { score: number; description: string } {
    if (!fib382 || !fib618 || !fibHigh || !fibLow) {
        return { score: 50, description: 'Fibonacci Daten nicht verfügbar' };
    }

    const goldenZoneTop = Math.max(fib382, fib618);
    const goldenZoneBottom = Math.min(fib382, fib618);

    let score: number;
    let description: string;

    if (currentPrice <= fibLow) {
        score = 95;
        description = 'Unter Fibonacci-Tief - maximale Kaufzone';
    } else if (currentPrice <= goldenZoneBottom) {
        score = 85;
        description = 'Unter Golden Zone - starke Kaufzone';
    } else if (currentPrice <= goldenZoneTop) {
        score = 70;
        description = 'In Golden Zone (38.2%-61.8%) - solide';
    } else if (currentPrice <= fibHigh * 0.9) {
        score = 45;
        description = 'Über Golden Zone - neutral';
    } else if (currentPrice <= fibHigh) {
        score = 25;
        description = 'Nahe Fibonacci-Hoch - Vorsicht';
    } else {
        score = 15;
        description = 'Über Fibonacci-Hoch - überhitzt';
    }

    return { score, description };
}

// Calculate combined DCA score
export function calculateCombinedDCAScore(params: {
    currentPrice: number;
    ema50: number | null;
    ema200: number | null;
    ema300?: number | null;
    fearGreed: FearGreedIndex | null;
    rsi: number | null;
    fib382?: number | null;
    fib618?: number | null;
    fibHigh?: number | null;
    fibLow?: number | null;
}): DCACalculation {
    const emaResult = calculateEMAZoneScore(
        params.currentPrice,
        params.ema50,
        params.ema200,
        params.ema300
    );

    const fearGreedResult = calculateFearGreedZoneScore(params.fearGreed);
    const rsiResult = calculateRSIZoneScore(params.rsi);
    const fibResult = calculateFibonacciZoneScore(
        params.currentPrice,
        params.fib382 || null,
        params.fib618 || null,
        params.fibHigh || null,
        params.fibLow || null
    );

    // Weighted average
    const combinedScore = Math.round(
        emaResult.score * 0.35 +
        fearGreedResult.score * 0.30 +
        rsiResult.score * 0.20 +
        fibResult.score * 0.15
    );

    const zone = getZoneFromScore(combinedScore);

    return {
        zone,
        factors: {
            ema: emaResult,
            fearGreed: fearGreedResult,
            rsi: rsiResult,
            fibonacci: fibResult,
        },
        combinedScore,
    };
}

// Get zone from score
export function getZoneFromScore(score: number): DCAZone {
    let zoneType: DCAZoneType;

    if (score >= 80) {
        zoneType = 'strong_buy';
    } else if (score >= 60) {
        zoneType = 'buy';
    } else if (score >= 40) {
        zoneType = 'neutral';
    } else if (score >= 25) {
        zoneType = 'caution';
    } else {
        zoneType = 'wait';
    }

    return {
        ...ZONE_CONFIG[zoneType],
        score,
    };
}

// Get DCA recommendation text
export function getDCARecommendation(
    zone: DCAZone,
    budget: number,
    currentPrice: number,
    coinSymbol: string
): string {
    const coinAmount = budget / currentPrice;
    const formattedAmount = coinAmount < 0.001
        ? coinAmount.toFixed(8)
        : coinAmount < 1
            ? coinAmount.toFixed(6)
            : coinAmount.toFixed(4);

    const baseText = `Bei $${budget} erhältst du ca. ${formattedAmount} ${coinSymbol}`;

    switch (zone.type) {
        case 'strong_buy':
            return `${baseText}. Strategie: Sofort kaufen oder Budget auf 2x erhöhen.`;
        case 'buy':
            return `${baseText}. Strategie: Regulären DCA-Kauf jetzt durchführen.`;
        case 'neutral':
            return `${baseText}. Strategie: Standard DCA fortsetzen.`;
        case 'caution':
            return `${baseText}. Strategie: Budget auf 50% reduzieren oder in 2 Käufe splitten.`;
        case 'wait':
            return `${baseText}. Strategie: DCA pausieren und auf besseren Einstieg warten.`;
        default:
            return baseText;
    }
}

// Preset-specific zone calculation
export function calculateZoneByPreset(
    preset: DCAPreset,
    params: Parameters<typeof calculateCombinedDCAScore>[0]
): DCAZone {
    switch (preset) {
        case 'ema': {
            const result = calculateEMAZoneScore(params.currentPrice, params.ema50, params.ema200, params.ema300);
            return getZoneFromScore(result.score);
        }
        case 'feargreed': {
            const result = calculateFearGreedZoneScore(params.fearGreed);
            return getZoneFromScore(result.score);
        }
        case 'rsi': {
            const result = calculateRSIZoneScore(params.rsi);
            return getZoneFromScore(result.score);
        }
        case 'fibonacci': {
            const result = calculateFibonacciZoneScore(
                params.currentPrice,
                params.fib382 || null,
                params.fib618 || null,
                params.fibHigh || null,
                params.fibLow || null
            );
            return getZoneFromScore(result.score);
        }
        case 'combined':
        default:
            return calculateCombinedDCAScore(params).zone;
    }
}

// Preset labels for UI
export const DCA_PRESET_LABELS: Record<DCAPreset, { label: string; description: string }> = {
    ema: { label: 'EMA-Zonen', description: 'Basierend auf 50/200/300 EMA' },
    feargreed: { label: 'Fear & Greed', description: 'Basierend auf Marktsentiment' },
    rsi: { label: 'RSI-Zonen', description: 'Basierend auf RSI Indikator' },
    fibonacci: { label: 'Fibonacci', description: 'Basierend auf Fib Retracements' },
    combined: { label: 'Kombiniert', description: 'Alle Faktoren gewichtet (Empfohlen)' },
};

// =====================================================
// PRICE ZONE TARGETS
// =====================================================

export interface PriceZoneTarget {
    name: string;
    price: number;
    discountPercent: number;
    tier: 'optimal' | 'good' | 'fair' | 'premium';
    color: string;
    budgetMultiplier: number; // 0.5 = use 50% of budget, 2 = use 200%
}

export interface SmartDCAResult {
    currentPriceAnalysis: {
        discountFromEma50: number;
        discountFromEma200: number;
        position: 'deep_discount' | 'discount' | 'fair_value' | 'premium' | 'overheated';
    };
    priceZones: PriceZoneTarget[];
    recommendedBudget: {
        base: number;
        adjusted: number;
        multiplier: number;
        reason: string;
    };
    limitOrders: LimitOrderSuggestion[];
}

export interface LimitOrderSuggestion {
    price: number;
    budgetPercent: number;
    budgetAmount: number;
    coinAmount: number;
    tier: string;
    discountPercent: number;
}

/**
 * Calculate price zone targets based on EMA levels
 */
export function calculatePriceZones(params: {
    currentPrice: number;
    ema50: number | null;
    ema200: number | null;
    ema300?: number | null;
}): PriceZoneTarget[] {
    const zones: PriceZoneTarget[] = [];
    const { currentPrice, ema50, ema200, ema300 } = params;

    // EMA 50 Zone
    if (ema50) {
        const discount = ((currentPrice - ema50) / currentPrice) * 100;
        zones.push({
            name: 'EMA 50',
            price: ema50,
            discountPercent: -discount,
            tier: discount > 0 ? 'good' : 'fair',
            color: '#3b82f6',
            budgetMultiplier: discount > 5 ? 1.5 : discount > 0 ? 1.25 : 1.0,
        });
    }

    // EMA 200 Zone (Major support)
    if (ema200) {
        const discount = ((currentPrice - ema200) / currentPrice) * 100;
        zones.push({
            name: 'EMA 200',
            price: ema200,
            discountPercent: -discount,
            tier: discount > 0 ? 'optimal' : 'good',
            color: '#22c55e',
            budgetMultiplier: discount > 10 ? 2.0 : discount > 5 ? 1.5 : 1.0,
        });
    }

    // EMA 300 Zone (Deep value)
    if (ema300) {
        const discount = ((currentPrice - ema300) / currentPrice) * 100;
        zones.push({
            name: 'EMA 300',
            price: ema300,
            discountPercent: -discount,
            tier: 'optimal',
            color: '#16a34a',
            budgetMultiplier: 2.5,
        });
    }

    // Add intermediate zones
    if (ema50 && ema200) {
        const midpoint = (ema50 + ema200) / 2;
        const discount = ((currentPrice - midpoint) / currentPrice) * 100;
        zones.push({
            name: 'EMA 50/200 Mitte',
            price: midpoint,
            discountPercent: -discount,
            tier: 'good',
            color: '#84cc16',
            budgetMultiplier: 1.25,
        });
    }

    // Sort by price descending
    return zones.sort((a, b) => b.price - a.price);
}

/**
 * Calculate discount/premium from EMAs
 */
export function calculateEMADiscount(
    currentPrice: number,
    ema50: number | null,
    ema200: number | null
): { discountFromEma50: number; discountFromEma200: number; position: SmartDCAResult['currentPriceAnalysis']['position'] } {
    const discountFromEma50 = ema50 ? ((ema50 - currentPrice) / ema50) * 100 : 0;
    const discountFromEma200 = ema200 ? ((ema200 - currentPrice) / ema200) * 100 : 0;

    let position: SmartDCAResult['currentPriceAnalysis']['position'];

    if (discountFromEma200 > 15) {
        position = 'deep_discount';
    } else if (discountFromEma200 > 0 || discountFromEma50 > 10) {
        position = 'discount';
    } else if (discountFromEma50 > -10) {
        position = 'fair_value';
    } else if (discountFromEma50 > -25) {
        position = 'premium';
    } else {
        position = 'overheated';
    }

    return { discountFromEma50, discountFromEma200, position };
}

/**
 * Calculate dynamic budget recommendation based on zone score
 */
export function calculateDynamicBudget(
    baseBudget: number,
    zoneScore: number,
    position: SmartDCAResult['currentPriceAnalysis']['position']
): SmartDCAResult['recommendedBudget'] {
    let multiplier: number;
    let reason: string;

    // Score-based multiplier (0-100 score)
    if (zoneScore >= 80) {
        multiplier = 2.0;
        reason = 'Exzellente Kaufgelegenheit - Budget verdoppeln';
    } else if (zoneScore >= 65) {
        multiplier = 1.5;
        reason = 'Gute Kaufgelegenheit - 50% mehr investieren';
    } else if (zoneScore >= 50) {
        multiplier = 1.0;
        reason = 'Standard DCA - normales Budget';
    } else if (zoneScore >= 35) {
        multiplier = 0.5;
        reason = 'Vorsicht - Budget halbieren';
    } else {
        multiplier = 0.25;
        reason = 'Markt überhitzt - nur 25% oder pausieren';
    }

    // Position-based adjustment
    if (position === 'deep_discount') {
        multiplier = Math.min(3.0, multiplier * 1.5);
        reason = 'Starker Rabatt - zusätzlich erhöhen!';
    } else if (position === 'overheated') {
        multiplier = Math.min(0.25, multiplier * 0.5);
        reason = 'Markt extrem überhitzt - stark reduzieren';
    }

    return {
        base: baseBudget,
        adjusted: Math.round(baseBudget * multiplier),
        multiplier,
        reason,
    };
}

/**
 * Generate limit order suggestions for smart DCA
 */
export function generateLimitOrders(params: {
    totalBudget: number;
    currentPrice: number;
    priceZones: PriceZoneTarget[];
    coinSymbol: string;
}): LimitOrderSuggestion[] {
    const { totalBudget, currentPrice, priceZones } = params;
    const orders: LimitOrderSuggestion[] = [];

    // Always include a market order for immediate execution
    const marketOrderPercent = 40;
    orders.push({
        price: currentPrice,
        budgetPercent: marketOrderPercent,
        budgetAmount: totalBudget * (marketOrderPercent / 100),
        coinAmount: (totalBudget * (marketOrderPercent / 100)) / currentPrice,
        tier: 'Market',
        discountPercent: 0,
    });

    // Distribute remaining 60% across price zones below current price
    const zonesBelow = priceZones
        .filter(z => z.price < currentPrice * 0.995) // At least 0.5% below
        .slice(0, 3); // Max 3 limit orders

    if (zonesBelow.length > 0) {
        const remainingBudget = totalBudget * 0.6;
        const perZoneBudget = remainingBudget / zonesBelow.length;

        zonesBelow.forEach((zone, index) => {
            const budgetPercent = 60 / zonesBelow.length;
            const budgetAmount = perZoneBudget;
            orders.push({
                price: zone.price,
                budgetPercent,
                budgetAmount,
                coinAmount: budgetAmount / zone.price,
                tier: zone.name,
                discountPercent: zone.discountPercent,
            });
        });
    } else {
        // No zones below - use percentage drops
        const drops = [3, 7, 12]; // 3%, 7%, 12% drops
        const remainingBudget = totalBudget * 0.6;
        const perDropBudget = remainingBudget / drops.length;

        drops.forEach((drop, index) => {
            const price = currentPrice * (1 - drop / 100);
            orders.push({
                price,
                budgetPercent: 20,
                budgetAmount: perDropBudget,
                coinAmount: perDropBudget / price,
                tier: `-${drop}%`,
                discountPercent: drop,
            });
        });
    }

    return orders;
}

/**
 * Complete Smart DCA analysis
 */
export function calculateSmartDCA(params: {
    currentPrice: number;
    ema50: number | null;
    ema200: number | null;
    ema300?: number | null;
    baseBudget: number;
    zoneScore: number;
    coinSymbol: string;
}): SmartDCAResult {
    const { currentPrice, ema50, ema200, ema300, baseBudget, zoneScore, coinSymbol } = params;

    // 1. Price position analysis
    const currentPriceAnalysis = calculateEMADiscount(currentPrice, ema50, ema200);

    // 2. Calculate price zones
    const priceZones = calculatePriceZones({ currentPrice, ema50, ema200, ema300 });

    // 3. Dynamic budget recommendation
    const recommendedBudget = calculateDynamicBudget(baseBudget, zoneScore, currentPriceAnalysis.position);

    // 4. Generate limit orders
    const limitOrders = generateLimitOrders({
        totalBudget: recommendedBudget.adjusted,
        currentPrice,
        priceZones,
        coinSymbol,
    });

    return {
        currentPriceAnalysis,
        priceZones,
        recommendedBudget,
        limitOrders,
    };
}
