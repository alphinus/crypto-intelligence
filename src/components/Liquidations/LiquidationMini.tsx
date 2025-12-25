'use client';

import { Zap, TrendingDown, TrendingUp, ChevronRight } from 'lucide-react';
import type { LiquidationStats as LiquidationStatsType, LiquidationLevel } from '@/types/liquidations';
import { formatLiquidationValue } from '@/lib/liquidation-levels';

interface LiquidationMiniProps {
  stats: LiquidationStatsType;
  levels: LiquidationLevel[];
  currentPrice: number;
  isConnected: boolean;
  onClick?: () => void;
}

export function LiquidationMini({ stats, levels, currentPrice, isConnected, onClick }: LiquidationMiniProps) {
  const total = stats.totalLongUsd + stats.totalShortUsd;
  const longPercentage = total > 0 ? (stats.totalLongUsd / total) * 100 : 50;

  // Find nearest liquidation levels
  const nearestAbove = levels
    .filter(l => l.price > currentPrice)
    .sort((a, b) => a.price - b.price)[0];
  const nearestBelow = levels
    .filter(l => l.price < currentPrice)
    .sort((a, b) => b.price - a.price)[0];

  const formatPrice = (price: number) => {
    if (price >= 1000) return `$${(price / 1000).toFixed(1)}K`;
    return `$${price.toFixed(0)}`;
  };

  const calcDistance = (price: number) => {
    const diff = ((price - currentPrice) / currentPrice) * 100;
    return `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`;
  };

  return (
    <div
      className="bg-gray-900/50 border border-gray-800 rounded-lg p-3 cursor-pointer hover:border-yellow-500/50 transition-colors"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          <span className="text-xs font-medium text-gray-400">Liquidations</span>
        </div>
        <div className="flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-[10px] text-gray-500">{isConnected ? 'Live' : 'Off'}</span>
          {onClick && <ChevronRight className="w-3 h-3 text-gray-500" />}
        </div>
      </div>

      {/* Long/Short Bar */}
      <div className="mb-2">
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-red-400">Long {formatLiquidationValue(stats.totalLongUsd)}</span>
          <span className="text-green-400">Short {formatLiquidationValue(stats.totalShortUsd)}</span>
        </div>
        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden flex">
          <div
            className="bg-gradient-to-r from-red-500 to-red-400 transition-all duration-500"
            style={{ width: `${longPercentage}%` }}
          />
          <div
            className="bg-gradient-to-r from-green-400 to-green-500 flex-1"
          />
        </div>
      </div>

      {/* Nearest Levels */}
      <div className="space-y-1 text-[10px]">
        {nearestAbove && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-red-400" />
              <span className="text-gray-500">Above</span>
            </div>
            <div>
              <span className="text-gray-300 font-mono">{formatPrice(nearestAbove.price)}</span>
              <span className="text-gray-500 ml-1">{calcDistance(nearestAbove.price)}</span>
            </div>
          </div>
        )}
        {nearestBelow && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <TrendingDown className="w-3 h-3 text-green-400" />
              <span className="text-gray-500">Below</span>
            </div>
            <div>
              <span className="text-gray-300 font-mono">{formatPrice(nearestBelow.price)}</span>
              <span className="text-gray-500 ml-1">{calcDistance(nearestBelow.price)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Count */}
      <div className="mt-2 pt-2 border-t border-gray-800 flex justify-between text-[10px]">
        <span className="text-gray-500">{stats.count} liquidations</span>
        {stats.largestLiquidation && (
          <span className="text-yellow-400">
            Max: {formatLiquidationValue(stats.largestLiquidation.usdValue)}
          </span>
        )}
      </div>
    </div>
  );
}
