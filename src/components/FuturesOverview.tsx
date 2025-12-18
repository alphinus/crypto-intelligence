'use client';

import {
  Activity,
  TrendingUp,
  TrendingDown,
  Percent,
  BarChart3,
} from 'lucide-react';
import { formatOpenInterest, getFundingRateColor, type FuturesOverviewData, type FuturesTicker } from '@/lib/binance-futures';

interface FuturesOverviewProps {
  data: FuturesOverviewData;
}

function CoinFuturesCard({
  symbol,
  name,
  openInterest,
  fundingRate,
  longShortRatio,
  ticker,
}: {
  symbol: string;
  name: string;
  openInterest: number;
  fundingRate: number;
  longShortRatio: { ratio: number; long: number; short: number };
  ticker: FuturesTicker | null;
}) {
  const fundingColor = getFundingRateColor(fundingRate);
  const priceChange = ticker ? parseFloat(ticker.priceChangePercent) : 0;
  const isPositive = priceChange >= 0;

  return (
    <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white">{symbol}</span>
          <span className="text-xs text-gray-500">{name}</span>
        </div>
        {ticker && (
          <span
            className={`flex items-center gap-1 text-xs font-medium ${
              isPositive ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {isPositive ? '+' : ''}
            {priceChange.toFixed(2)}%
          </span>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {/* Open Interest */}
        <div className="p-2 bg-gray-900/50 rounded">
          <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
            <Activity className="w-3 h-3" />
            Open Interest
          </div>
          <div className="font-semibold text-white text-sm">
            {formatOpenInterest(openInterest)}
          </div>
        </div>

        {/* Funding Rate */}
        <div className="p-2 bg-gray-900/50 rounded">
          <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
            <Percent className="w-3 h-3" />
            Funding Rate
          </div>
          <div className={`font-semibold text-sm ${fundingColor}`}>
            {fundingRate >= 0 ? '+' : ''}
            {fundingRate.toFixed(4)}%
          </div>
        </div>
      </div>

      {/* Long/Short Ratio Bar */}
      <div>
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-green-400">Long {longShortRatio.long.toFixed(1)}%</span>
          <span className="text-gray-400">L/S: {longShortRatio.ratio.toFixed(2)}</span>
          <span className="text-red-400">Short {longShortRatio.short.toFixed(1)}%</span>
        </div>
        <div className="h-2 bg-gray-900 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-green-500 transition-all"
            style={{ width: `${longShortRatio.long}%` }}
          />
          <div
            className="h-full bg-red-500 transition-all"
            style={{ width: `${longShortRatio.short}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function FundingRateIndicator({ rate, label }: { rate: number; label: string }) {
  const color = getFundingRateColor(rate);
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-gray-400">{label}</span>
      <span className={`text-xs font-medium ${color}`}>
        {rate >= 0 ? '+' : ''}{rate.toFixed(4)}%
      </span>
    </div>
  );
}

export function FuturesOverview({ data }: FuturesOverviewProps) {
  // Calculate aggregate sentiment
  const avgFunding = (data.fundingRates.btc + data.fundingRates.eth + data.fundingRates.sol) / 3;
  const avgLongRatio = (data.longShortRatio.btc.long + data.longShortRatio.eth.long + data.longShortRatio.sol.long) / 3;

  const sentiment = avgFunding > 0.02
    ? 'Überkauft'
    : avgFunding < -0.02
      ? 'Überverkauft'
      : avgLongRatio > 55
        ? 'Bullish'
        : avgLongRatio < 45
          ? 'Bearish'
          : 'Neutral';

  const sentimentColor = sentiment === 'Bullish' || sentiment === 'Überkauft'
    ? 'text-green-400 bg-green-500/10 border-green-500/20'
    : sentiment === 'Bearish' || sentiment === 'Überverkauft'
      ? 'text-red-400 bg-red-500/10 border-red-500/20'
      : 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';

  return (
    <div className="space-y-4">
      {/* Sentiment Overview */}
      <div className={`p-3 rounded-lg border ${sentimentColor}`}>
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="w-4 h-4" />
          <span className="text-xs font-medium">Futures Sentiment</span>
        </div>
        <div className="text-lg font-bold">{sentiment}</div>
        <div className="text-xs opacity-70">
          Avg. Funding: {avgFunding >= 0 ? '+' : ''}{avgFunding.toFixed(4)}% |
          Long Ratio: {avgLongRatio.toFixed(1)}%
        </div>
      </div>

      {/* Funding Rates Quick View */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <Percent className="w-4 h-4 text-purple-400" />
          <h3 className="font-semibold text-white text-sm">Funding Rates</h3>
        </div>
        <FundingRateIndicator rate={data.fundingRates.btc} label="BTC" />
        <FundingRateIndicator rate={data.fundingRates.eth} label="ETH" />
        <FundingRateIndicator rate={data.fundingRates.sol} label="SOL" />
        <div className="mt-2 pt-2 border-t border-gray-800 text-xs text-gray-500">
          Positiv = Longs zahlen Shorts
        </div>
      </div>

      {/* Individual Coin Cards */}
      <div className="space-y-3">
        <CoinFuturesCard
          symbol="BTC"
          name="Bitcoin"
          openInterest={data.openInterest.btc}
          fundingRate={data.fundingRates.btc}
          longShortRatio={data.longShortRatio.btc}
          ticker={data.tickers.btc}
        />
        <CoinFuturesCard
          symbol="ETH"
          name="Ethereum"
          openInterest={data.openInterest.eth}
          fundingRate={data.fundingRates.eth}
          longShortRatio={data.longShortRatio.eth}
          ticker={data.tickers.eth}
        />
        <CoinFuturesCard
          symbol="SOL"
          name="Solana"
          openInterest={data.openInterest.sol}
          fundingRate={data.fundingRates.sol}
          longShortRatio={data.longShortRatio.sol}
          ticker={data.tickers.sol}
        />
      </div>

      {/* Info Footer */}
      <div className="text-xs text-gray-500 text-center">
        Daten von Binance Futures (USDT-M)
      </div>
    </div>
  );
}
