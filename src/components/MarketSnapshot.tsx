'use client';

import { TrendingUp, TrendingDown, Activity, BarChart3, Target } from 'lucide-react';

interface MarketSnapshotProps {
  fundingRate?: {
    btc: number;
    eth: number;
  };
  sentiment?: {
    type: 'bullish' | 'bearish' | 'neutral';
    score: number;
  };
  keyLevels?: {
    support: number | null;
    resistance: number | null;
  };
  btcPrice?: number;
  loading?: boolean;
}

// Skeleton component for loading state
function SkeletonBox() {
  return <div className="h-4 w-16 bg-gray-700 rounded animate-pulse" />;
}

export function MarketSnapshot({
  fundingRate,
  sentiment,
  keyLevels,
  btcPrice,
  loading = false,
}: MarketSnapshotProps) {
  const getSentimentColor = (type: string) => {
    switch (type) {
      case 'bullish':
        return 'text-green-400 bg-green-500/20';
      case 'bearish':
        return 'text-red-400 bg-red-500/20';
      default:
        return 'text-yellow-400 bg-yellow-500/20';
    }
  };

  const formatPrice = (price: number) => {
    return `$${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  };

  const formatFunding = (rate: number) => {
    const prefix = rate >= 0 ? '+' : '';
    return `${prefix}${(rate * 100).toFixed(4)}%`;
  };

  return (
    <div className="grid grid-cols-3 gap-2 mb-4">
      {/* Funding Rate - Compact */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-[10px] text-gray-500 uppercase">Funding</span>
          </div>
          {loading ? (
            <SkeletonBox />
          ) : fundingRate ? (
            <div className="flex items-center gap-1">
              <span
                className={`text-sm font-bold ${
                  fundingRate.btc >= 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {formatFunding(fundingRate.btc)}
              </span>
              {fundingRate.btc >= 0 ? (
                <TrendingUp className="w-3 h-3 text-green-400" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-400" />
              )}
            </div>
          ) : (
            <span className="text-gray-500 text-xs">-</span>
          )}
        </div>
        {fundingRate?.eth !== undefined && (
          <div className="text-[10px] text-gray-500 mt-0.5 text-right">
            ETH: <span className={fundingRate.eth >= 0 ? 'text-green-400' : 'text-red-400'}>
              {formatFunding(fundingRate.eth)}
            </span>
          </div>
        )}
      </div>

      {/* Sentiment - Compact */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {sentiment?.type === 'bullish' ? (
              <TrendingUp className="w-3.5 h-3.5 text-gray-500" />
            ) : sentiment?.type === 'bearish' ? (
              <TrendingDown className="w-3.5 h-3.5 text-gray-500" />
            ) : (
              <Activity className="w-3.5 h-3.5 text-gray-500" />
            )}
            <span className="text-[10px] text-gray-500 uppercase">Sentiment</span>
          </div>
          {loading ? (
            <SkeletonBox />
          ) : sentiment ? (
            <span
              className={`px-2 py-0.5 rounded text-xs font-medium ${getSentimentColor(
                sentiment.type
              )}`}
            >
              {sentiment.type.toUpperCase()}
            </span>
          ) : (
            <span className="text-gray-500 text-xs">-</span>
          )}
        </div>
        {sentiment && (
          <div className="text-[10px] text-gray-500 mt-0.5 text-right">
            Score: <span className="text-gray-300">{sentiment.score}</span>
          </div>
        )}
      </div>

      {/* BTC Key Levels - Compact */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-[10px] text-gray-500 uppercase">Levels</span>
          </div>
          {loading ? (
            <SkeletonBox />
          ) : keyLevels && (keyLevels.support || keyLevels.resistance) ? (
            <div className="flex items-center gap-2 text-xs">
              {keyLevels.support && (
                <span>
                  <span className="text-green-400">S:</span>
                  <span className="text-gray-300 ml-0.5">{formatPrice(keyLevels.support)}</span>
                </span>
              )}
              {keyLevels.resistance && (
                <span>
                  <span className="text-red-400">R:</span>
                  <span className="text-gray-300 ml-0.5">{formatPrice(keyLevels.resistance)}</span>
                </span>
              )}
            </div>
          ) : btcPrice ? (
            <span className="text-gray-300 text-xs">{formatPrice(btcPrice)}</span>
          ) : (
            <span className="text-gray-500 text-xs">-</span>
          )}
        </div>
      </div>
    </div>
  );
}
