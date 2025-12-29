'use client';

import { MessageCircle, Layers, BarChart3, TrendingUp, TrendingDown } from 'lucide-react';

interface MiniWidgetsProps {
  reddit?: {
    sentiment: 'bullish' | 'bearish' | 'neutral';
    score: number;
    topTopic?: string;
  };
  defi?: {
    tvl: number;
    tvlChange24h: number;
  };
  futures?: {
    openInterest: number;
    oiChange24h: number;
  };
}

export function MiniWidgets({ reddit, defi, futures }: MiniWidgetsProps) {
  const formatNumber = (num: number) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
  };

  const formatChange = (change: number) => {
    const prefix = change >= 0 ? '+' : '';
    return `${prefix}${change.toFixed(2)}%`;
  };

  const getSentimentEmoji = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish':
        return '🟢';
      case 'bearish':
        return '🔴';
      default:
        return '🟡';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {/* Reddit Sentiment */}
      <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <MessageCircle className="w-4 h-4 text-orange-400" />
          <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">Reddit</span>
        </div>
        {reddit ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{getSentimentEmoji(reddit.sentiment)}</span>
              <span
                className={`text-sm font-medium ${reddit.sentiment === 'bullish'
                    ? 'text-green-400'
                    : reddit.sentiment === 'bearish'
                      ? 'text-red-400'
                      : 'text-yellow-400'
                  }`}
              >
                {reddit.sentiment.toUpperCase()}
              </span>
            </div>
            {reddit.topTopic && (
              <span className="text-[10px] text-gray-500 truncate max-w-[80px]">
                #{reddit.topTopic}
              </span>
            )}
          </div>
        ) : (
          <div className="text-gray-500 text-sm">-</div>
        )}
      </div>

      {/* DeFi TVL */}
      <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <Layers className="w-4 h-4 text-purple-400" />
          <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">DeFi TVL</span>
        </div>
        {defi ? (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {formatNumber(defi.tvl)}
            </span>
            <span
              className={`flex items-center gap-0.5 text-xs ${defi.tvlChange24h >= 0 ? 'text-green-400' : 'text-red-400'
                }`}
            >
              {defi.tvlChange24h >= 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {formatChange(defi.tvlChange24h)}
            </span>
          </div>
        ) : (
          <div className="text-gray-500 text-sm">-</div>
        )}
      </div>

      {/* Futures Open Interest */}
      <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="w-4 h-4 text-blue-400" />
          <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">Futures OI</span>
        </div>
        {futures ? (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {formatNumber(futures.openInterest)}
            </span>
            <span
              className={`flex items-center gap-0.5 text-xs ${futures.oiChange24h >= 0 ? 'text-green-400' : 'text-red-400'
                }`}
            >
              {futures.oiChange24h >= 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {formatChange(futures.oiChange24h)}
            </span>
          </div>
        ) : (
          <div className="text-gray-500 text-sm">-</div>
        )}
      </div>
    </div>
  );
}
