'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface Coin {
  symbol: string;
  name: string;
  price?: number;
  change24h?: number;
}

interface CoinSelectorBarProps {
  coins: Coin[];
  selectedSymbol: string;
  onSelect: (symbol: string) => void;
  onAddCustom?: (symbol: string) => void;
  onRemove?: (symbol: string) => void;
  className?: string;
}

export function CoinSelectorBar({
  coins,
  selectedSymbol,
  onSelect,
  onAddCustom,
  onRemove,
  className = '',
}: CoinSelectorBarProps) {
  const [showAddInput, setShowAddInput] = useState(false);
  const [customSymbol, setCustomSymbol] = useState('');
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Check scroll state
  const updateScrollState = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
  }, []);

  useEffect(() => {
    updateScrollState();
    const container = scrollRef.current;
    if (container) {
      container.addEventListener('scroll', updateScrollState);
      window.addEventListener('resize', updateScrollState);
    }
    return () => {
      if (container) {
        container.removeEventListener('scroll', updateScrollState);
      }
      window.removeEventListener('resize', updateScrollState);
    };
  }, [updateScrollState, coins]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 200;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const handleAddCustom = () => {
    if (customSymbol.trim() && onAddCustom) {
      onAddCustom(customSymbol.toUpperCase().replace('USDT', '') + 'USDT');
      setCustomSymbol('');
      setShowAddInput(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddCustom();
    } else if (e.key === 'Escape') {
      setShowAddInput(false);
      setCustomSymbol('');
    }
  };

  return (
    <div className={`relative max-w-full ${className}`}>
      {/* Left scroll arrow */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-gray-500 dark:text-gray-300" />
        </button>
      )}

      <div
        ref={scrollRef}
        className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 px-6"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {coins.map((coin) => {
          const isSelected = coin.symbol === selectedSymbol;
          const displaySymbol = coin.symbol.replace('USDT', '');

          return (
            <motion.button
              key={coin.symbol}
              onClick={() => onSelect(coin.symbol)}
              className={`
                relative flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap
                transition-all duration-200 min-w-fit
                ${isSelected
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }
              `}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="font-medium">{displaySymbol}</span>

              {coin.price && (
                <span className="text-xs opacity-80">
                  ${coin.price.toLocaleString('en-US', {
                    minimumFractionDigits: coin.price < 1 ? 4 : 2,
                    maximumFractionDigits: coin.price < 1 ? 4 : 2
                  })}
                </span>
              )}

              {coin.change24h !== undefined && (
                <span className={`text-xs ${coin.change24h >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(1)}%
                </span>
              )}

              {onRemove && !isSelected && coins.length > 1 && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(coin.symbol);
                  }}
                  className="ml-1 p-0.5 rounded hover:bg-blue-700 dark:hover:bg-gray-600 opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.stopPropagation();
                      onRemove(coin.symbol);
                    }
                  }}
                >
                  <X className="w-3 h-3" />
                </span>
              )}
            </motion.button>
          );
        })}

        {/* Add Custom Coin Button */}
        {onAddCustom && (
          <>
            {showAddInput ? (
              <div className="flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 shadow-sm">
                <Search className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  value={customSymbol}
                  onChange={(e) => setCustomSymbol(e.target.value.toUpperCase())}
                  onKeyDown={handleKeyDown}
                  placeholder="BTC, ETH..."
                  className="bg-transparent border-none outline-none text-gray-900 dark:text-white text-sm w-24 placeholder:text-gray-400"
                  autoFocus
                />
                <button
                  onClick={handleAddCustom}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-green-600 dark:text-green-400"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setShowAddInput(false);
                    setCustomSymbol('');
                  }}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <motion.button
                onClick={() => setShowAddInput(true)}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors border border-dashed border-gray-300 dark:border-gray-700"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">Add</span>
              </motion.button>
            )}
          </>
        )}
      </div>

      {/* Right scroll arrow */}
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-300" />
        </button>
      )}

      {/* Fade edges for scroll indication */}
      {canScrollLeft && (
        <div className="absolute top-0 left-6 h-full w-4 bg-gradient-to-r from-gray-50 dark:from-gray-900 to-transparent pointer-events-none" />
      )}
      {canScrollRight && (
        <div className="absolute top-0 right-6 h-full w-4 bg-gradient-to-l from-gray-50 dark:from-gray-900 to-transparent pointer-events-none" />
      )}
    </div>
  );
}
