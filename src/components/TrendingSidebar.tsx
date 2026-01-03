import { Flag, ChevronDown, Settings2, Search } from 'lucide-react';

export type WatchlistCategory = 'FAVORITEN' | 'LISTE_1' | 'LISTE_2';

interface TrendingSidebarProps {
  coins: MarketData[];
  fearGreed: MarketData['fearGreed'] | null;
  selectedCoin: MarketData | null;
  onCoinSelect: (coin: MarketData) => void;
  onCoinDetailClick: (coin: MarketData) => void;
  onAddCustomCoin?: (symbol: string) => Promise<MarketData | null>;
  customCoins?: MarketData[];
  watchlistData?: Record<string, WatchlistCategory | null>;
  onToggleWatchlist?: (symbol: string, category: WatchlistCategory) => void;
  expertiseLevel?: 'beginner' | 'standard' | 'expert' | 'intelligence';
}

export function TrendingSidebar({
  coins,
  fearGreed,
  selectedCoin,
  onCoinSelect,
  onCoinDetailClick,
  onAddCustomCoin,
  customCoins = [],
  watchlistData = {},
  onToggleWatchlist,
  expertiseLevel = 'standard',
}: TrendingSidebarProps) {
  const [showAddCoin, setShowAddCoin] = useState(false);
  const [customSymbol, setCustomSymbol] = useState('');
  const [addingCoin, setAddingCoin] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    FAVORITEN: true,
    LISTE_1: true,
    LISTE_2: true,
    MARKET: true
  });

  const categories: { id: WatchlistCategory | 'MARKET'; label: string; color?: string }[] = [
    { id: 'FAVORITEN', label: 'FAVORITEN', color: 'text-red-500' },
    { id: 'LISTE_1', label: 'LISTE 1 (GELB)', color: 'text-yellow-500' },
    { id: 'LISTE_2', label: 'LISTE 2 (VIOLETT)', color: 'text-purple-500' },
    { id: 'MARKET', label: 'MARKT ÜBERSICHT', color: 'text-gray-400' }
  ];

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
    if (price >= 1000) return price.toLocaleString('en-US', { maximumFractionDigits: 1 });
    if (price >= 1) return price.toFixed(2);
    return price.toFixed(4);
  };

  const isSelected = (coin: MarketData) => selectedCoin?.symbol === coin.symbol;

  const getFilteredCoins = (catId: WatchlistCategory | 'MARKET') => {
    const allAvailable = [...coins, ...customCoins];
    const unique = Array.from(new Map(allAvailable.map(c => [c.symbol, c])).values());

    let filtered = unique;
    if (catId === 'MARKET') {
      filtered = unique.filter(c => !watchlistData[c.symbol]);
    } else {
      filtered = unique.filter(c => watchlistData[c.symbol] === catId);
    }

    if (searchQuery) {
      filtered = filtered.filter(c =>
        c.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  };

  return (
    <div className="h-full flex flex-col bg-[#0c0d10] text-[#d1d4dc] border-r border-[#2a2e39] font-sans overflow-hidden select-none">
      {/* Search & Header */}
      <div className="p-2 border-b border-[#2a2e39] flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs px-1">
          <span className="font-bold flex items-center gap-2">
            WATCHLIST <ChevronDown className="w-3 h-3" />
          </span>
          <div className="flex items-center gap-3">
            <Plus className="w-4 h-4 cursor-pointer hover:text-white" onClick={() => setShowAddCoin(!showAddCoin)} />
            <Settings2 className="w-4 h-4 cursor-pointer hover:text-white" />
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input
            type="text"
            placeholder="Suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1e222d] border border-transparent focus:border-blue-500 rounded px-7 py-1 text-xs outline-none transition-all"
          />
        </div>
      </div>

      {/* Table Header */}
      <div className="flex items-center px-4 py-2 text-[10px] text-gray-500 font-bold border-b border-[#2a2e39] uppercase tracking-wider">
        <div className="flex-1">Symbol</div>
        <div className="w-20 text-right">Zuletzt</div>
        <div className="w-16 text-right">Änd %</div>
      </div>

      {/* Watchlist Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {categories.map((cat) => {
          const catCoins = getFilteredCoins(cat.id);
          if (catCoins.length === 0 && cat.id !== 'MARKET') return null;

          return (
            <div key={cat.id} className="mb-1">
              <div
                className="flex items-center gap-2 px-3 py-1 bg-[#1e222d]/30 hover:bg-[#1e222d] cursor-pointer"
                onClick={() => setExpandedSections(prev => ({ ...prev, [cat.id]: !prev[cat.id] }))}
              >
                <ChevronDown className={`w-3 h-3 transition-transform ${!expandedSections[cat.id] ? '-rotate-90' : ''}`} />
                <span className={`text-[10px] font-bold tracking-widest ${cat.color || 'text-gray-400'}`}>
                  {cat.label}
                </span>
                <span className="text-[10px] text-gray-600 ml-auto">{catCoins.length}</span>
              </div>

              {expandedSections[cat.id] && catCoins.map((coin) => (
                <div
                  key={coin.symbol}
                  className={`group flex items-center px-3 py-1.5 hover:bg-[#1e222d] cursor-pointer transition-colors border-l-2 ${isSelected(coin) ? 'border-blue-500 bg-blue-500/5' : 'border-transparent'}`}
                  onClick={() => onCoinSelect(coin)}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="relative">
                      {watchlistData[coin.symbol] === 'FAVORITEN' && <Flag className="w-3 h-3 text-red-500 fill-red-500" />}
                      {watchlistData[coin.symbol] === 'LISTE_1' && <Flag className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                      {watchlistData[coin.symbol] === 'LISTE_2' && <Flag className="w-3 h-3 text-purple-500 fill-purple-500" />}
                      {!watchlistData[coin.symbol] && <Flag className="w-3 h-3 text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => {
                        e.stopPropagation();
                        onToggleWatchlist?.(coin.symbol, 'FAVORITEN');
                      }} />}
                    </div>
                    <img src={coin.image} className="w-5 h-5 rounded-full" alt="" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-gray-200">{coin.symbol.toUpperCase()}</span>
                      <span className="text-[10px] text-gray-500 truncate">{coin.name}</span>
                    </div>
                  </div>
                  <div className="w-20 text-right text-xs font-mono text-gray-300">
                    {formatPrice(coin.price)}
                  </div>
                  <div className={`w-16 text-right text-xs font-mono font-bold ${coin.change24h >= 0 ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                    {(coin.change24h >= 0 ? '+' : '') + coin.change24h.toFixed(2)}%
                  </div>

                  {/* Quick Detail View Button */}
                  <div className="hidden group-hover:flex items-center pl-2">
                    <ChevronRight
                      className="w-4 h-4 text-gray-500 hover:text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCoinDetailClick(coin);
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Fear Greed Overlay */}
      <div className="p-2 border-t border-[#2a2e39]">
        {fearGreed && (
          <div className="bg-[#1e222d] rounded-lg p-2 flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Fear & Greed</span>
            <span className={`text-[11px] font-bold ${fearGreed.value > 50 ? 'text-green-500' : 'text-orange-500'}`}>
              {fearGreed.value} - {fearGreed.label}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
