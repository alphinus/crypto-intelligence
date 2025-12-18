'use client';

import {
  TrendingUp,
  TrendingDown,
  Globe,
  Flame,
  Activity,
} from 'lucide-react';
import type { GlobalData, TrendingCoin } from '@/app/api/market/route';

interface GlobalStatsProps {
  global: GlobalData | null;
  trending: TrendingCoin[];
}

function formatMarketCap(value: number): string {
  if (value >= 1e12) {
    return `$${(value / 1e12).toFixed(2)}T`;
  } else if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`;
  }
  return `$${value.toLocaleString()}`;
}

export function GlobalStats({ global, trending }: GlobalStatsProps) {
  if (!global) return null;

  const isPositive = global.totalMarketCapChange24h >= 0;

  return (
    <div className="mb-6 space-y-4">
      {/* Global Market Stats Bar */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold text-white">Global Market</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Market Cap */}
          <div>
            <div className="text-xs text-gray-400 mb-1">Market Cap</div>
            <div className="text-lg font-bold text-white">
              {formatMarketCap(global.totalMarketCap)}
            </div>
            <div
              className={`flex items-center gap-1 text-xs ${
                isPositive ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {isPositive ? '+' : ''}
              {global.totalMarketCapChange24h.toFixed(2)}%
            </div>
          </div>

          {/* 24h Volume */}
          <div>
            <div className="text-xs text-gray-400 mb-1">24h Volume</div>
            <div className="text-lg font-bold text-white">
              {formatMarketCap(global.totalVolume)}
            </div>
          </div>

          {/* BTC Dominance */}
          <div>
            <div className="text-xs text-gray-400 mb-1">BTC Dominance</div>
            <div className="text-lg font-bold text-orange-400">
              {global.btcDominance.toFixed(1)}%
            </div>
            <div className="h-1.5 bg-gray-700 rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-orange-400 rounded-full"
                style={{ width: `${global.btcDominance}%` }}
              />
            </div>
          </div>

          {/* ETH Dominance */}
          <div>
            <div className="text-xs text-gray-400 mb-1">ETH Dominance</div>
            <div className="text-lg font-bold text-purple-400">
              {global.ethDominance.toFixed(1)}%
            </div>
            <div className="h-1.5 bg-gray-700 rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-purple-400 rounded-full"
                style={{ width: `${global.ethDominance}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Trending Coins */}
      {trending.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold text-white">Trending</h3>
            <Activity className="w-4 h-4 text-gray-500 animate-pulse" />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {trending.map((coin) => (
              <div
                key={coin.id}
                className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-gray-800/50 hover:bg-gray-800 rounded-lg border border-gray-700 transition-colors"
              >
                <img
                  src={coin.thumb}
                  alt={coin.name}
                  className="w-6 h-6 rounded-full"
                />
                <div>
                  <div className="font-medium text-white text-sm">
                    {coin.symbol.toUpperCase()}
                  </div>
                  <div className="text-xs text-gray-500">
                    #{coin.marketCapRank || '?'}
                  </div>
                </div>
                {coin.priceChange24h !== 0 && (
                  <span
                    className={`text-xs font-medium ${
                      coin.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {coin.priceChange24h >= 0 ? '+' : ''}
                    {coin.priceChange24h.toFixed(1)}%
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
