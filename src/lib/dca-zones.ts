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
