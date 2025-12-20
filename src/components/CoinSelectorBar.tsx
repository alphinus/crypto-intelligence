'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, Search } from 'lucide-react';

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
  const scrollRef = useRef<HTMLDivElement>(null);

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
    <div className={`relative ${className}`}>
      <div
        ref={scrollRef}
        className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1"
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
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
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
                <span className={`text-xs ${coin.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(1)}%
                </span>
              )}

              {onRemove && !isSelected && coins.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(coin.symbol);
                  }}
                  className="ml-1 p-0.5 rounded hover:bg-gray-600 opacity-50 hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </motion.button>
          );
        })}

        {/* Add Custom Coin Button */}
        {onAddCustom && (
          <>
            {showAddInput ? (
              <div className="flex items-center gap-1 bg-gray-800 rounded-lg px-2 py-1">
                <Search className="w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={customSymbol}
                  onChange={(e) => setCustomSymbol(e.target.value.toUpperCase())}
                  onKeyDown={handleKeyDown}
                  placeholder="BTC, ETH..."
                  className="bg-transparent border-none outline-none text-white text-sm w-24"
                  autoFocus
                />
                <button
                  onClick={handleAddCustom}
                  className="p-1 rounded hover:bg-gray-700 text-green-400"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setShowAddInput(false);
                    setCustomSymbol('');
                  }}
                  className="p-1 rounded hover:bg-gray-700 text-gray-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <motion.button
                onClick={() => setShowAddInput(true)}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-800/50 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
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

      {/* Fade edges for scroll indication */}
      <div className="absolute top-0 right-0 h-full w-8 bg-gradient-to-l from-gray-900 to-transparent pointer-events-none" />
    </div>
  );
}
