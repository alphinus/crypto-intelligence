import { useState } from 'react';
import { TrendingUp, TrendingDown, ChevronRight, Check, Plus, Search, X, Loader2 } from 'lucide-react';
import { FearGreedCompact } from './FearGreedCompact';
import type { MarketData, FearGreedIndex } from '@/types/news';

interface TrendingSidebarProps {
  coins: MarketData[];
  fearGreed: FearGreedIndex | null;
  selectedCoin: MarketData | null;
  onCoinSelect: (coin: MarketData) => void;
  onCoinDetailClick: (coin: MarketData) => void;
  onAddCustomCoin?: (symbol: string) => Promise<MarketData | null>;
  customCoins?: MarketData[];
}

export function TrendingSidebar({
  coins,
  fearGreed,
  selectedCoin,
  onCoinSelect,
  onCoinDetailClick,
  onAddCustomCoin,
  customCoins = [],
}: TrendingSidebarProps) {
  const [showAddCoin, setShowAddCoin] = useState(false);
  const [customSymbol, setCustomSymbol] = useState('');
  const [addingCoin, setAddingCoin] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const handleAddCoin = async () => {
    if (!customSymbol.trim() || !onAddCustomCoin) return;

    setAddingCoin(true);
    setAddError(null);

    try {
      const result = await onAddCustomCoin(customSymbol.trim().toUpperCase());
      if (result) {
        setCustomSymbol('');
        setShowAddCoin(false);
      } else {
        setAddError('Coin nicht gefunden');
      }
    } catch {
      setAddError('Fehler beim Hinzufügen');
    } finally {
      setAddingCoin(false);
    }
  };

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return `$${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    } else if (price >= 1) {
      return `$${price.toFixed(2)}`;
    } else {
      return `$${price.toFixed(4)}`;
    }
  };

  const formatChange = (change: number) => {
    const prefix = change >= 0 ? '+' : '';
    return `${prefix}${change.toFixed(2)}%`;
  };

  const isSelected = (coin: MarketData) => {
    return selectedCoin?.symbol.toLowerCase() === coin.symbol.toLowerCase();
  };

  return (
    <div className="h-full flex flex-col bg-gray-900/50 border-r border-gray-800 z-20">
      {/* Fear & Greed Section - Compact Premium */}
      {fearGreed && (
        <FearGreedCompact
          value={fearGreed.value}
          classification={fearGreed.label}
        />
      )}

      {/* Add Custom Coin Section */}
      <div className="p-3 border-b border-gray-800">
        {showAddCoin ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customSymbol}
                onChange={(e) => setCustomSymbol(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCoin()}
                placeholder="z.B. PEPE, WIF..."
                className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                autoFocus
              />
              <button
                onClick={handleAddCoin}
                disabled={addingCoin || !customSymbol.trim()}
                className="p-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded text-white"
              >
                {addingCoin ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              </button>
              <button
                onClick={() => { setShowAddCoin(false); setAddError(null); }}
                className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {addError && (
              <p className="text-[10px] text-red-400">{addError}</p>
            )}
          </div>
        ) : (
          <button
            onClick={() => setShowAddCoin(true)}
            className="flex items-center gap-2 w-full px-3 py-2 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 border-dashed rounded-lg text-xs text-gray-400 hover:text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
            Eigenen Coin hinzufügen
          </button>
        )}
      </div>

      {/* Custom Coins Section */}
      {customCoins.length > 0 && (
        <div className="p-4 border-b border-gray-800">
          <h3 className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-3">
            Eigene Coins
          </h3>
          <div className="space-y-1">
            {customCoins.map((coin) => (
              <div
                key={`custom-${coin.symbol}`}
                className={`flex items-center gap-2 p-2 rounded-lg transition-all ${isSelected(coin)
                  ? 'bg-purple-600/20 border border-purple-500/50'
                  : 'hover:bg-gray-800/50 border border-transparent'
                  }`}
              >
                <button
                  onClick={() => onCoinSelect(coin)}
                  className="flex-1 flex items-center gap-3 text-left min-w-0"
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${isSelected(coin) ? 'border-purple-500 bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'border-gray-600'
                      }`}
                  >
                    {isSelected(coin) && <Check className="w-3 h-3 text-white" />}
                  </div>

                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="relative flex-shrink-0">
                      {coin.image ? (
                        <img
                          src={coin.image}
                          alt=""
                          className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent && !parent.querySelector('.coin-fallback')) {
                              const fallback = document.createElement('div');
                              fallback.className = 'coin-fallback w-8 h-8 rounded-full bg-purple-600/30 border border-purple-500/50 flex items-center justify-center text-[10px] text-purple-400 font-bold';
                              fallback.innerText = coin.symbol.slice(0, 2).toUpperCase();
                              parent.appendChild(fallback);
                            }
                          }}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-[10px] text-gray-400 font-bold">
                          {coin.symbol.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-white text-xs truncate">
                        {coin.name}
                      </span>
                      <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                        {coin.symbol}
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="text-xs font-mono text-white tracking-tight">{formatPrice(coin.price)}</div>
                    <div className={`text-[10px] font-medium ${coin.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatChange(coin.change24h)}
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => onCoinDetailClick(coin)}
                  className="p-1.5 rounded-md hover:bg-gray-700/50 text-gray-400 hover:text-white"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trending Coins */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Top 20 Coins
          </h3>
          <div className="space-y-1">
            {coins.slice(0, 20).map((coin, index) => (
              <div
                key={coin.id || `coin-${coin.symbol}-${index}`}
                className={`flex items-center gap-2 p-2 rounded-lg transition-all ${isSelected(coin)
                  ? 'bg-blue-600/20 border border-blue-500/50'
                  : 'hover:bg-gray-800/50 border border-transparent'
                  }`}
              >
                {/* Main clickable area - selects coin for analysis */}
                <button
                  onClick={() => onCoinSelect(coin)}
                  className="flex-1 flex items-center gap-3 text-left min-w-0"
                  title={`${coin.name} für Trade-Empfehlungen auswählen`}
                >
                  {/* Selection indicator */}
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${isSelected(coin)
                      ? 'border-blue-500 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]'
                      : 'border-gray-600 hover:border-gray-500'
                      }`}
                  >
                    {isSelected(coin) && <Check className="w-3 h-3 text-white" />}
                  </div>

                  {/* Coin Icon & Info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="relative flex-shrink-0">
                      {coin.image ? (
                        <img
                          src={coin.image}
                          alt="" // Leave empty to prevent text overlap on error
                          className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700"
                          onError={(e) => {
                            // Replace with a styled div if image fails
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent && !parent.querySelector('.coin-fallback')) {
                              const fallback = document.createElement('div');
                              fallback.className = 'coin-fallback w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-[10px] text-blue-400 font-bold';
                              fallback.innerText = coin.symbol.slice(0, 2).toUpperCase();
                              parent.appendChild(fallback);
                            }
                          }}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-[10px] text-gray-400 font-bold">
                          {coin.symbol.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-white text-xs truncate">
                        {coin.name}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                          {coin.symbol}
                        </span>
                        {coin.change24h >= 0 ? (
                          <TrendingUp className="w-2.5 h-2.5 text-green-400/70" />
                        ) : (
                          <TrendingDown className="w-2.5 h-2.5 text-red-400/70" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Price & Change */}
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs font-mono text-white tracking-tight">{formatPrice(coin.price)}</div>
                    <div
                      className={`text-[10px] font-medium ${coin.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}
                    >
                      {formatChange(coin.change24h)}
                    </div>
                  </div>
                </button>

                {/* Detail button - opens modal with charts */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCoinDetailClick(coin);
                  }}
                  className="p-1.5 rounded-md hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors flex-shrink-0"
                  title="Chart & Details öffnen"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="p-3 border-t border-gray-800 space-y-1">
        <div className="flex items-center gap-2 text-[10px] text-gray-500">
          <div className="w-3 h-3 rounded-full border-2 border-blue-500 bg-blue-500 flex items-center justify-center">
            <Check className="w-2 h-2 text-white" />
          </div>
          <span>= Trade-Empfehlung aktiv</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-500">
          <ChevronRight className="w-3 h-3" />
          <span>= Chart & Setup öffnen</span>
        </div>
      </div>
    </div>
  );
}
