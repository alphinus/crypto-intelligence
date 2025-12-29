'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Zap, TrendingDown, TrendingUp } from 'lucide-react';
import type { Liquidation } from '@/types/liquidations';
import { formatLiquidationValue } from '@/lib/liquidation-levels';

interface LiquidationFeedProps {
  liquidations: Liquidation[];
  maxItems?: number;
}

export function LiquidationFeed({ liquidations, maxItems = 20 }: LiquidationFeedProps) {
  const displayedLiquidations = liquidations.slice(0, maxItems);

  const getSizeClass = (usdValue: number): string => {
    if (usdValue >= 500000) return 'text-lg font-bold';
    if (usdValue >= 100000) return 'text-base font-semibold';
    return 'text-sm';
  };

  const getHighlightClass = (usdValue: number): string => {
    if (usdValue >= 500000) return 'bg-yellow-500/20 border-yellow-500/50';
    if (usdValue >= 100000) return 'bg-orange-500/10 border-orange-500/30';
    return 'bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/50';
  };

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (displayedLiquidations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-500">
        <Zap className="w-8 h-8 mb-2 opacity-50" />
        <p className="text-sm">Warte auf Liquidationen...</p>
      </div>
    );
  }

  return (
    <div className="space-y-1 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
      <AnimatePresence initial={false}>
        {displayedLiquidations.map((liq) => (
          <motion.div
            key={liq.id}
            initial={{ opacity: 0, x: -20, height: 0 }}
            animate={{ opacity: 1, x: 0, height: 'auto' }}
            exit={{ opacity: 0, x: 20, height: 0 }}
            transition={{ duration: 0.2 }}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${getHighlightClass(liq.usdValue)}`}
          >
            {/* Direction Icon */}
            <div className="flex-shrink-0">
              {liq.side === 'LONG' ? (
                <TrendingDown className="w-4 h-4 text-red-400" />
              ) : (
                <TrendingUp className="w-4 h-4 text-green-400" />
              )}
            </div>

            {/* Symbol */}
            <span className="font-medium text-gray-900 dark:text-white w-12">{liq.symbol}</span>

            {/* Side */}
            <span
              className={`text-xs px-1.5 py-0.5 rounded ${liq.side === 'LONG' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                }`}
            >
              {liq.side}
            </span>

            {/* Value */}
            <span className={`flex-1 text-right ${getSizeClass(liq.usdValue)} ${liq.side === 'LONG' ? 'text-red-400' : 'text-green-400'
              }`}>
              {formatLiquidationValue(liq.usdValue)}
            </span>

            {/* Price */}
            <span className="text-xs text-gray-500 dark:text-gray-400 w-20 text-right">
              @${liq.price.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </span>

            {/* Time */}
            <span className="text-xs text-gray-500 w-16 text-right">
              {formatTime(liq.timestamp)}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
