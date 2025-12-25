'use client';

import { useRef, useState, useMemo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface CoinData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  image?: string;
}

interface GainerLoserTickerProps {
  coins: CoinData[];
  onCoinClick?: (symbol: string) => void;
}

export function GainerLoserTicker({ coins, onCoinClick }: GainerLoserTickerProps) {
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sort coins by 24h change and split into gainers and losers
  const { topGainers, topLosers } = useMemo(() => {
    const sorted = [...coins].sort((a, b) => b.change24h - a.change24h);
    return {
      topGainers: sorted.slice(0, 5),
      topLosers: sorted.slice(-5).reverse(),
    };
  }, [coins]);

  // Combine gainers and losers for the ticker
  const tickerItems = useMemo(() => {
    const items: (CoinData & { category: 'gainer' | 'loser' })[] = [];

    // Interleave gainers and losers
    for (let i = 0; i < 5; i++) {
      if (topGainers[i]) {
        items.push({ ...topGainers[i], category: 'gainer' });
      }
      if (topLosers[i]) {
        items.push({ ...topLosers[i], category: 'loser' });
      }
    }

    return items;
  }, [topGainers, topLosers]);

  if (coins.length === 0) {
    return null;
  }

  // Duplicate items for seamless loop
  const duplicatedItems = [...tickerItems, ...tickerItems];

  const formatChange = (change: number) => {
    const prefix = change >= 0 ? '+' : '';
    return `${prefix}${change.toFixed(1)}%`;
  };

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return price.toLocaleString('en-US', { maximumFractionDigits: 0 });
    } else if (price >= 1) {
      return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else if (price >= 0.01) {
      return price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
    } else {
      return price.toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 8 });
    }
  };

  return (
    <div className="relative z-30 bg-gray-900/60 border-b border-gray-800 overflow-hidden">
      <div className="flex items-center">
        {/* Labels */}
        <div className="flex-shrink-0 flex">
          <div className="px-3 py-1.5 bg-green-600/80 text-white text-[10px] font-bold uppercase tracking-wider z-10 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Top
          </div>
          <div className="px-3 py-1.5 bg-red-600/80 text-white text-[10px] font-bold uppercase tracking-wider z-10 flex items-center gap-1">
            <TrendingDown className="w-3 h-3" />
            Flop
          </div>
        </div>

        {/* Ticker Container */}
        <div
          ref={containerRef}
          className="flex-1 overflow-hidden"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div
            className={`flex gap-4 py-1.5 gainer-ticker-scroll ${isPaused ? 'paused' : ''}`}
            style={{
              animation: `gainer-ticker ${tickerItems.length * 3}s linear infinite`,
            }}
          >
            {duplicatedItems.map((item, index) => (
              <button
                key={`${item.symbol}-${index}`}
                onClick={() => onCoinClick?.(item.symbol.toUpperCase())}
                className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border transition-all whitespace-nowrap hover:scale-105 ${
                  item.category === 'gainer'
                    ? 'border-green-500/30 bg-green-900/20 hover:bg-green-900/40'
                    : 'border-red-500/30 bg-red-900/20 hover:bg-red-900/40'
                }`}
              >
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-4 h-4 rounded-full"
                  />
                )}
                <span className="text-xs font-medium text-white">
                  {item.symbol.toUpperCase()}
                </span>
                <span className="text-[10px] text-gray-400">
                  ${formatPrice(item.price)}
                </span>
                <span className={`text-xs font-bold ${
                  item.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {formatChange(item.change24h)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes gainer-ticker {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .gainer-ticker-scroll {
          will-change: transform;
        }
        .gainer-ticker-scroll.paused {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
