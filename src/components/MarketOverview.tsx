'use client';

import { TrendingUp, TrendingDown, Gauge, ChevronRight } from 'lucide-react';
import type { MarketData, FearGreedIndex } from '@/types/news';

interface MarketOverviewProps {
  coins: MarketData[];
  fearGreed: FearGreedIndex | null;
  onCoinClick?: (coin: MarketData) => void;
}

export function MarketOverview({ coins, fearGreed, onCoinClick }: MarketOverviewProps) {
  const getFearGreedColor = (value: number) => {
    if (value <= 25) return 'text-red-500';
    if (value <= 45) return 'text-orange-500';
    if (value <= 55) return 'text-yellow-500';
    if (value <= 75) return 'text-lime-500';
    return 'text-green-500';
  };

  const getFearGreedBg = (value: number) => {
    if (value <= 25) return 'bg-red-500';
    if (value <= 45) return 'bg-orange-500';
    if (value <= 55) return 'bg-yellow-500';
    if (value <= 75) return 'bg-lime-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-4">
      {/* Fear & Greed Index */}
      {fearGreed && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Gauge className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Fear & Greed Index</h3>
          </div>
          <div className="flex items-center gap-4">
            <div
              className={`text-4xl font-bold ${getFearGreedColor(fearGreed.value)}`}
            >
              {fearGreed.value}
            </div>
            <div>
              <div className={`font-medium ${getFearGreedColor(fearGreed.value)}`}>
                {fearGreed.classification}
              </div>
              <div className="text-xs text-gray-500">
                Markt-Sentiment
              </div>
            </div>
          </div>
          <div className="mt-3 h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full ${getFearGreedBg(fearGreed.value)} transition-all`}
              style={{ width: `${fearGreed.value}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Extreme Fear</span>
            <span>Extreme Greed</span>
          </div>
        </div>
      )}

      {/* Top Coins */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Top Coins</h3>
        <div className="space-y-2">
          {coins.slice(0, 10).map((coin) => (
            <button
              key={coin.symbol}
              onClick={() => onCoinClick?.(coin)}
              className="w-full flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg px-2 -mx-2 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <img
                  src={coin.image}
                  alt={coin.name}
                  className="w-6 h-6 rounded-full"
                />
                <div className="text-left">
                  <div className="font-medium text-white text-sm">
                    {coin.symbol.toUpperCase()}
                  </div>
                  <div className="text-xs text-gray-500">{coin.name}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="font-medium text-gray-900 dark:text-white text-sm">
                    ${coin.price.toLocaleString('de-DE', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: coin.price < 1 ? 6 : 2,
                    })}
                  </div>
                  <div
                    className={`flex items-center justify-end gap-1 text-xs ${coin.change24h >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}
                  >
                    {coin.change24h >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {coin.change24h.toFixed(2)}%
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-600 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
