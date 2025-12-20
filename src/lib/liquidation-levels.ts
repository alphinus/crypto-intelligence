// Liquidation Level Calculation
// Estimates where liquidations would occur based on leverage levels

import type { LiquidationLevel, LiquidationHeatmapData } from '@/types/liquidations';

// Common leverage levels used by traders
const LEVERAGE_LEVELS = [10, 25, 50, 100] as const;

// Maintenance margin rates (approximate, varies by exchange)
const MAINTENANCE_MARGIN_RATE = 0.004; // 0.4%

/**
 * Calculate liquidation levels based on current price and open interest
 *
 * @param currentPrice - Current market price
 * @param openInterest - Open interest in USD
 * @param priceRange - How far from current price to calculate (default ±15%)
 * @returns Array of liquidation levels sorted by price
 */
export function calculateLiquidationLevels(
  currentPrice: number,
  openInterest: number,
  priceRange: number = 0.15
): LiquidationLevel[] {
  if (currentPrice <= 0 || openInterest <= 0) return [];

  const levels: LiquidationLevel[] = [];

  for (const leverage of LEVERAGE_LEVELS) {
    // Liquidation price calculation:
    // For Longs: Entry * (1 - 1/leverage + maintenance_margin)
    // For Shorts: Entry * (1 + 1/leverage - maintenance_margin)

    const longLiqDistance = (1 / leverage) - MAINTENANCE_MARGIN_RATE;
    const shortLiqDistance = (1 / leverage) - MAINTENANCE_MARGIN_RATE;

    const longLiqPrice = currentPrice * (1 - longLiqDistance);
    const shortLiqPrice = currentPrice * (1 + shortLiqDistance);

    // Only include levels within the price range
    const minPrice = currentPrice * (1 - priceRange);
    const maxPrice = currentPrice * (1 + priceRange);

    // Estimate volume distribution (higher leverage = more speculative = less volume)
    const leverageWeight = 1 / Math.sqrt(leverage);
    const totalWeight = LEVERAGE_LEVELS.reduce((sum, l) => sum + 1 / Math.sqrt(l), 0);
    const estimatedVolume = (openInterest * leverageWeight) / totalWeight / 2;

    if (longLiqPrice >= minPrice) {
      levels.push({
        price: longLiqPrice,
        type: 'long',
        estimatedVolume,
        leverage,
      });
    }

    if (shortLiqPrice <= maxPrice) {
      levels.push({
        price: shortLiqPrice,
        type: 'short',
        estimatedVolume,
        leverage,
      });
    }
  }

  return levels.sort((a, b) => a.price - b.price);
}

/**
 * Generate heatmap data for liquidation visualization
 * Creates price buckets with estimated liquidation volumes
 *
 * @param currentPrice - Current market price
 * @param openInterest - Open interest in USD
 * @param buckets - Number of price buckets (default 50)
 * @param priceRange - Range as percentage (default ±10%)
 */
export function generateLiquidationHeatmap(
  currentPrice: number,
  openInterest: number,
  buckets: number = 50,
  priceRange: number = 0.1
): LiquidationHeatmapData[] {
  if (currentPrice <= 0 || openInterest <= 0) return [];

  const minPrice = currentPrice * (1 - priceRange);
  const maxPrice = currentPrice * (1 + priceRange);
  const priceStep = (maxPrice - minPrice) / buckets;

  const levels = calculateLiquidationLevels(currentPrice, openInterest, priceRange);
  const heatmapData: LiquidationHeatmapData[] = [];

  for (let i = 0; i < buckets; i++) {
    const bucketPrice = minPrice + (i + 0.5) * priceStep;
    const bucketMin = minPrice + i * priceStep;
    const bucketMax = bucketMin + priceStep;

    // Find levels within this bucket
    const levelsInBucket = levels.filter(
      (l) => l.price >= bucketMin && l.price < bucketMax
    );

    let longVolume = 0;
    let shortVolume = 0;

    for (const level of levelsInBucket) {
      if (level.type === 'long') {
        longVolume += level.estimatedVolume;
      } else {
        shortVolume += level.estimatedVolume;
      }
    }

    heatmapData.push({
      price: bucketPrice,
      longVolume,
      shortVolume,
    });
  }

  return heatmapData;
}

/**
 * Format USD value for display
 */
export function formatLiquidationValue(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }
  return `$${value.toFixed(0)}`;
}

/**
 * Get color for liquidation based on type and leverage
 */
export function getLiquidationColor(type: 'long' | 'short', leverage: number): string {
  // Higher leverage = more transparent
  const opacity = Math.max(0.3, 1 - (leverage - 10) / 100);

  if (type === 'long') {
    return `rgba(239, 68, 68, ${opacity})`; // Red for longs
  }
  return `rgba(34, 197, 94, ${opacity})`; // Green for shorts
}

/**
 * Get line style for liquidation level based on leverage
 */
export function getLiquidationLineStyle(leverage: number): 'solid' | 'dashed' | 'dotted' {
  if (leverage <= 10) return 'solid';
  if (leverage <= 50) return 'dashed';
  return 'dotted';
}
