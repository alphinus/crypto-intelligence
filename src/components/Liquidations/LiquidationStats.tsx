'use client';

import { TrendingDown, TrendingUp, Zap, Activity } from 'lucide-react';
import type { LiquidationStats as LiquidationStatsType } from '@/types/liquidations';
import { formatLiquidationValue } from '@/lib/liquidation-levels';

interface LiquidationStatsProps {
  stats: LiquidationStatsType;
  isConnected: boolean;
}

export function LiquidationStats({ stats, isConnected }: LiquidationStatsProps) {
  const total = stats.totalLongUsd + stats.totalShortUsd;
  const longPercentage = total > 0 ? (stats.totalLongUsd / total) * 100 : 50;
  const shortPercentage = total > 0 ? (stats.totalShortUsd / total) * 100 : 50;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* Long Liquidations */}
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-1">
          <TrendingDown className="w-4 h-4 text-red-400" />
          <span className="text-xs text-gray-400">Long Liqs</span>
        </div>
        <div className="text-lg font-bold text-red-400">
          {formatLiquidationValue(stats.totalLongUsd)}
        </div>
        <div className="text-xs text-gray-500">{longPercentage.toFixed(1)}%</div>
      </div>

      {/* Short Liquidations */}
      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-4 h-4 text-green-400" />
          <span className="text-xs text-gray-400">Short Liqs</span>
        </div>
        <div className="text-lg font-bold text-green-400">
          {formatLiquidationValue(stats.totalShortUsd)}
        </div>
        <div className="text-xs text-gray-500">{shortPercentage.toFixed(1)}%</div>
      </div>

      {/* Total Count */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-1">
          <Activity className="w-4 h-4 text-blue-400" />
          <span className="text-xs text-gray-400">Anzahl</span>
        </div>
        <div className="text-lg font-bold text-white">{stats.count}</div>
        <div className="flex items-center gap-1 text-xs">
          <span
            className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}
          />
          <span className="text-gray-500">{isConnected ? 'Live' : 'Offline'}</span>
        </div>
      </div>

      {/* Largest Liquidation */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="w-4 h-4 text-yellow-400" />
          <span className="text-xs text-gray-400">Größte</span>
        </div>
        {stats.largestLiquidation ? (
          <>
            <div className="text-lg font-bold text-yellow-400">
              {formatLiquidationValue(stats.largestLiquidation.usdValue)}
            </div>
            <div className="text-xs text-gray-500">
              {stats.largestLiquidation.symbol} {stats.largestLiquidation.side}
            </div>
          </>
        ) : (
          <div className="text-lg font-bold text-gray-500">-</div>
        )}
      </div>
    </div>
  );
}

// Compact inline version for sidebar
export function LiquidationStatsInline({ stats, isConnected }: LiquidationStatsProps) {
  return (
    <div className="flex items-center gap-4 text-xs">
      <div className="flex items-center gap-1">
        <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        <Zap className="w-3 h-3 text-yellow-400" />
      </div>
      <div className="flex items-center gap-1">
        <TrendingDown className="w-3 h-3 text-red-400" />
        <span className="text-red-400">{formatLiquidationValue(stats.totalLongUsd)}</span>
      </div>
      <div className="flex items-center gap-1">
        <TrendingUp className="w-3 h-3 text-green-400" />
        <span className="text-green-400">{formatLiquidationValue(stats.totalShortUsd)}</span>
      </div>
      <span className="text-gray-500">({stats.count})</span>
    </div>
  );
}
