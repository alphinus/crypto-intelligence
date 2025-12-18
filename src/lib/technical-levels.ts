// Technische Level-Erkennung: Support/Resistance, Fibonacci, Psychologische Level

import type { Kline, Interval } from './binance-klines';

export interface Level {
  price: number;
  type: 'support' | 'resistance';
  strength: number; // 1-5 (Anzahl Berührungen)
  source: 'pivot' | 'cluster' | 'fibonacci' | 'psychological';
}

export interface FibLevel {
  ratio: number;
  price: number;
  label: string;
}

export interface TechnicalLevels {
  currentPrice: number;
  supports: Level[];
  resistances: Level[];
  fibonacci: FibLevel[];
  psychological: number[];
  keySupport: number | null;
  keyResistance: number | null;
  swingHigh: number;
  swingLow: number;
  emas?: {
    ema50: number | null;
    ema200: number | null;
    ema300: number | null;
  };
}

// Finde Pivot-Punkte (lokale Hochs und Tiefs)
function findPivots(
  klines: Kline[],
  lookback: number = 5
): { highs: number[]; lows: number[] } {
  const highs: number[] = [];
  const lows: number[] = [];

  for (let i = lookback; i < klines.length - lookback; i++) {
    let isHigh = true;
    let isLow = true;

    for (let j = 1; j <= lookback; j++) {
      if (klines[i].high <= klines[i - j].high || klines[i].high <= klines[i + j].high) {
        isHigh = false;
      }
      if (klines[i].low >= klines[i - j].low || klines[i].low >= klines[i + j].low) {
        isLow = false;
      }
    }

    if (isHigh) highs.push(klines[i].high);
    if (isLow) lows.push(klines[i].low);
  }

  return { highs, lows };
}

// Cluster-Analyse: Gruppiere ähnliche Level
function clusterLevels(prices: number[], tolerance: number = 0.005): Map<number, number> {
  const clusters = new Map<number, number>();

  prices.forEach((price) => {
    let foundCluster = false;

    // Suche existierenden Cluster
    clusters.forEach((count, clusterPrice) => {
      if (Math.abs(price - clusterPrice) / clusterPrice <= tolerance) {
        clusters.set(clusterPrice, count + 1);
        foundCluster = true;
      }
    });

    if (!foundCluster) {
      clusters.set(price, 1);
    }
  });

  return clusters;
}

// Support/Resistance Erkennung
export function findSupportResistance(
  klines: Kline[],
  currentPrice: number,
  lookback: number = 5
): { supports: Level[]; resistances: Level[] } {
  if (klines.length < lookback * 2 + 1) {
    return { supports: [], resistances: [] };
  }

  const { highs, lows } = findPivots(klines, lookback);

  // Cluster bilden
  const resistanceClusters = clusterLevels(highs);
  const supportClusters = clusterLevels(lows);

  // Zu Level-Objekten konvertieren
  const resistances: Level[] = [];
  const supports: Level[] = [];

  resistanceClusters.forEach((strength, price) => {
    if (price > currentPrice) {
      resistances.push({
        price: Math.round(price * 100) / 100,
        type: 'resistance',
        strength: Math.min(strength, 5),
        source: 'pivot',
      });
    }
  });

  supportClusters.forEach((strength, price) => {
    if (price < currentPrice) {
      supports.push({
        price: Math.round(price * 100) / 100,
        type: 'support',
        strength: Math.min(strength, 5),
        source: 'pivot',
      });
    }
  });

  // Sortieren nach Nähe zum aktuellen Preis
  resistances.sort((a, b) => a.price - b.price);
  supports.sort((a, b) => b.price - a.price);

  return {
    supports: supports.slice(0, 5),
    resistances: resistances.slice(0, 5),
  };
}

// Fibonacci Retracements berechnen
export function calculateFibonacci(swingHigh: number, swingLow: number): FibLevel[] {
  const range = swingHigh - swingLow;
  const isUptrend = true; // TODO: Dynamisch bestimmen

  const ratios = [
    { ratio: 0, label: '0% (Swing Low)' },
    { ratio: 0.236, label: '23.6%' },
    { ratio: 0.382, label: '38.2%' },
    { ratio: 0.5, label: '50%' },
    { ratio: 0.618, label: '61.8% (Golden)' },
    { ratio: 0.786, label: '78.6%' },
    { ratio: 1, label: '100% (Swing High)' },
  ];

  return ratios.map(({ ratio, label }) => ({
    ratio,
    label,
    price: Math.round((swingLow + range * ratio) * 100) / 100,
  }));
}

// Swing High/Low finden
export function findSwings(klines: Kline[]): { swingHigh: number; swingLow: number } {
  if (klines.length === 0) {
    return { swingHigh: 0, swingLow: 0 };
  }

  const highs = klines.map((k) => k.high);
  const lows = klines.map((k) => k.low);

  return {
    swingHigh: Math.max(...highs),
    swingLow: Math.min(...lows),
  };
}

// Psychologische Level finden
export function findPsychologicalLevels(
  currentPrice: number,
  range: number = 0.2
): number[] {
  const levels: number[] = [];

  // Bestimme die richtige Rundungsstufe basierend auf Preis
  let step: number;
  if (currentPrice >= 10000) {
    step = 5000; // BTC: $85k, $90k, $95k, $100k
  } else if (currentPrice >= 1000) {
    step = 500; // ETH: $2500, $3000, $3500
  } else if (currentPrice >= 100) {
    step = 50; // SOL: $100, $150, $200
  } else if (currentPrice >= 10) {
    step = 5;
  } else {
    step = 0.5;
  }

  // Berechne Range um aktuellen Preis
  const lower = currentPrice * (1 - range);
  const upper = currentPrice * (1 + range);

  // Finde alle runden Level in der Range
  const startLevel = Math.floor(lower / step) * step;
  for (let level = startLevel; level <= upper; level += step) {
    if (level > 0) {
      levels.push(level);
    }
  }

  return levels;
}

// Kombinierte Level-Analyse
export function analyzeTechnicalLevels(klines: Kline[]): TechnicalLevels {
  if (klines.length === 0) {
    return {
      currentPrice: 0,
      supports: [],
      resistances: [],
      fibonacci: [],
      psychological: [],
      keySupport: null,
      keyResistance: null,
      swingHigh: 0,
      swingLow: 0,
    };
  }

  const currentPrice = klines[klines.length - 1].close;
  const { swingHigh, swingLow } = findSwings(klines);

  // Support/Resistance
  const { supports, resistances } = findSupportResistance(klines, currentPrice);

  // Fibonacci
  const fibonacci = calculateFibonacci(swingHigh, swingLow);

  // Psychologische Level
  const psychological = findPsychologicalLevels(currentPrice);

  // Key Level bestimmen (nächstes wichtigstes)
  const keySupport = supports.length > 0 ? supports[0].price : null;
  const keyResistance = resistances.length > 0 ? resistances[0].price : null;

  return {
    currentPrice,
    supports,
    resistances,
    fibonacci,
    psychological,
    keySupport,
    keyResistance,
    swingHigh,
    swingLow,
  };
}

// Formatierung für Anzeige
export function formatPrice(price: number): string {
  if (price >= 1000) {
    return `$${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  } else if (price >= 1) {
    return `$${price.toFixed(2)}`;
  } else {
    return `$${price.toFixed(4)}`;
  }
}

// Prozent-Entfernung zum Level
export function distanceToLevel(currentPrice: number, levelPrice: number): string {
  const distance = ((levelPrice - currentPrice) / currentPrice) * 100;
  const prefix = distance > 0 ? '+' : '';
  return `${prefix}${distance.toFixed(2)}%`;
}

// Timeframe-spezifische Konfiguration
interface TimeframeConfig {
  pivotLookback: number;
  clusterTolerance: number;
}

const TIMEFRAME_CONFIG: Record<string, TimeframeConfig> = {
  '5m': { pivotLookback: 12, clusterTolerance: 0.002 },
  '15m': { pivotLookback: 8, clusterTolerance: 0.003 },
  '1h': { pivotLookback: 5, clusterTolerance: 0.005 },
  '4h': { pivotLookback: 5, clusterTolerance: 0.005 },
  '1d': { pivotLookback: 3, clusterTolerance: 0.01 },
};

// Timeframe-spezifische Level-Analyse
export interface TimeframeTechnicalLevels extends TechnicalLevels {
  timeframe: Interval;
}

export function analyzeTechnicalLevelsForTimeframe(
  klines: Kline[],
  timeframe: Interval
): TimeframeTechnicalLevels {
  const config = TIMEFRAME_CONFIG[timeframe] || TIMEFRAME_CONFIG['1h'];

  if (klines.length === 0) {
    return {
      timeframe,
      currentPrice: 0,
      supports: [],
      resistances: [],
      fibonacci: [],
      psychological: [],
      keySupport: null,
      keyResistance: null,
      swingHigh: 0,
      swingLow: 0,
    };
  }

  const currentPrice = klines[klines.length - 1].close;
  const { swingHigh, swingLow } = findSwings(klines);

  // Support/Resistance mit timeframe-spezifischem Lookback
  const { supports, resistances } = findSupportResistanceWithConfig(
    klines,
    currentPrice,
    config.pivotLookback,
    config.clusterTolerance
  );

  // Fibonacci
  const fibonacci = calculateFibonacci(swingHigh, swingLow);

  // Psychologische Level
  const psychological = findPsychologicalLevels(currentPrice);

  // Key Level bestimmen
  const keySupport = supports.length > 0 ? supports[0].price : null;
  const keyResistance = resistances.length > 0 ? resistances[0].price : null;

  return {
    timeframe,
    currentPrice,
    supports,
    resistances,
    fibonacci,
    psychological,
    keySupport,
    keyResistance,
    swingHigh,
    swingLow,
  };
}

// Support/Resistance mit konfigurierbaren Parametern
function findSupportResistanceWithConfig(
  klines: Kline[],
  currentPrice: number,
  lookback: number,
  tolerance: number
): { supports: Level[]; resistances: Level[] } {
  if (klines.length < lookback * 2 + 1) {
    return { supports: [], resistances: [] };
  }

  const { highs, lows } = findPivots(klines, lookback);

  // Cluster bilden mit konfigurierter Toleranz
  const resistanceClusters = clusterLevelsWithTolerance(highs, tolerance);
  const supportClusters = clusterLevelsWithTolerance(lows, tolerance);

  const resistances: Level[] = [];
  const supports: Level[] = [];

  resistanceClusters.forEach((strength, price) => {
    if (price > currentPrice) {
      resistances.push({
        price: Math.round(price * 100) / 100,
        type: 'resistance',
        strength: Math.min(strength, 5),
        source: 'pivot',
      });
    }
  });

  supportClusters.forEach((strength, price) => {
    if (price < currentPrice) {
      supports.push({
        price: Math.round(price * 100) / 100,
        type: 'support',
        strength: Math.min(strength, 5),
        source: 'pivot',
      });
    }
  });

  // Sortieren nach Nähe zum aktuellen Preis
  resistances.sort((a, b) => a.price - b.price);
  supports.sort((a, b) => b.price - a.price);

  return {
    supports: supports.slice(0, 5),
    resistances: resistances.slice(0, 5),
  };
}

// Cluster-Analyse mit konfigurierbarer Toleranz
function clusterLevelsWithTolerance(prices: number[], tolerance: number): Map<number, number> {
  const clusters = new Map<number, number>();

  prices.forEach((price) => {
    let foundCluster = false;

    clusters.forEach((count, clusterPrice) => {
      if (Math.abs(price - clusterPrice) / clusterPrice <= tolerance) {
        clusters.set(clusterPrice, count + 1);
        foundCluster = true;
      }
    });

    if (!foundCluster) {
      clusters.set(price, 1);
    }
  });

  return clusters;
}

// Multi-Timeframe Level Analyse
export interface AllTimeframeLevels {
  '5m': TimeframeTechnicalLevels;
  '15m': TimeframeTechnicalLevels;
  '1h': TimeframeTechnicalLevels;
  '4h': TimeframeTechnicalLevels;
  '1d': TimeframeTechnicalLevels;
}

export function analyzeAllTimeframeLevels(
  klinesByTimeframe: Record<string, Kline[]>
): AllTimeframeLevels {
  return {
    '5m': analyzeTechnicalLevelsForTimeframe(klinesByTimeframe['5m'] || [], '5m'),
    '15m': analyzeTechnicalLevelsForTimeframe(klinesByTimeframe['15m'] || [], '15m'),
    '1h': analyzeTechnicalLevelsForTimeframe(klinesByTimeframe['1h'] || [], '1h'),
    '4h': analyzeTechnicalLevelsForTimeframe(klinesByTimeframe['4h'] || [], '4h'),
    '1d': analyzeTechnicalLevelsForTimeframe(klinesByTimeframe['1d'] || [], '1d'),
  };
}

// Finde Konfluenz-Zonen wo mehrere Timeframes übereinstimmen
export function findConfluenceZones(
  allLevels: AllTimeframeLevels,
  tolerance: number = 0.01
): { price: number; timeframes: string[]; type: 'support' | 'resistance' }[] {
  const allPrices: { price: number; timeframe: string; type: 'support' | 'resistance' }[] = [];

  // Sammle alle Level von allen Timeframes
  Object.entries(allLevels).forEach(([tf, levels]) => {
    levels.supports.forEach((s: Level) => {
      allPrices.push({ price: s.price, timeframe: tf, type: 'support' });
    });
    levels.resistances.forEach((r: Level) => {
      allPrices.push({ price: r.price, timeframe: tf, type: 'resistance' });
    });
  });

  // Gruppiere ähnliche Preise
  const confluenceZones: { price: number; timeframes: string[]; type: 'support' | 'resistance' }[] = [];

  allPrices.forEach((item) => {
    const existingZone = confluenceZones.find(
      (zone) =>
        Math.abs(zone.price - item.price) / zone.price <= tolerance &&
        zone.type === item.type
    );

    if (existingZone) {
      if (!existingZone.timeframes.includes(item.timeframe)) {
        existingZone.timeframes.push(item.timeframe);
      }
    } else {
      confluenceZones.push({
        price: item.price,
        timeframes: [item.timeframe],
        type: item.type,
      });
    }
  });

  // Nur Zonen mit mindestens 2 Timeframes zurückgeben, sortiert nach Anzahl
  return confluenceZones
    .filter((z) => z.timeframes.length >= 2)
    .sort((a, b) => b.timeframes.length - a.timeframes.length);
}
