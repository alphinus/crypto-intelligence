'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Loader2, ExternalLink } from 'lucide-react';
import { formatPrice, formatNumber, formatPercent } from '@/lib/utils';

interface MemeCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency?: number;
  market_cap: number;
  total_volume: number;
}

interface MemeCoinsResult {
  coins: MemeCoin[];
  loading: boolean;
  error: string | null;
}

// Predefined meme coin IDs for CoinGecko
const MEME_COIN_IDS = [
  'dogecoin',
  'shiba-inu',
  'pepe',
  'dogwifcoin',
  'floki',
  'bonk',
  'brett',
  'book-of-meme',
  'cat-in-a-dogs-world',
  'popcat',
  'mog-coin',
  'dogs-2',
  'neiro-on-eth',
  'turbo',
  'baby-doge-coin',
];

interface MemeCoinsProps {
  onCoinSelect?: (symbol: string) => void;
}

export function MemeCoinsPanel({ onCoinSelect }: MemeCoinsProps) {
  const [data, setData] = useState<MemeCoinsResult>({ coins: [], loading: true, error: null });

  useEffect(() => {
    const fetchMemeCoins = async () => {
      try {
        setData(prev => ({ ...prev, loading: true, error: null }));

        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${MEME_COIN_IDS.join(',')}&order=market_cap_desc&per_page=20&page=1&sparkline=false&price_change_percentage=24h,7d`,
          { next: { revalidate: 60 } }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch meme coins');
        }

        const coins: MemeCoin[] = await response.json();
        setData({ coins, loading: false, error: null });
      } catch (err) {
        console.error('Meme coins fetch error:', err);
        setData({ coins: [], loading: false, error: 'Failed to load meme coins' });
      }
    };

    fetchMemeCoins();
    const interval = setInterval(fetchMemeCoins, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  if (data.loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
        <span className="ml-2 text-gray-400">Loading meme coins...</span>
      </div>
    );
  }

  if (data.error) {
    return (
      <div className="text-center py-12 text-red-400">
        {data.error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="text-2xl">🚀</span>
          Meme Coins
        </h2>
        <span className="text-xs text-gray-500">
          {data.coins.length} coins • Live data
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {data.coins.map((coin, index) => (
          <motion.div
            key={coin.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onCoinSelect?.(coin.symbol.toUpperCase() + 'USDT')}
            className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 hover:bg-gray-800/50 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3 mb-3">
              <img
                src={coin.image}
                alt={coin.name}
                className="w-8 h-8 rounded-full"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{coin.symbol.toUpperCase()}</span>
                  <span className="text-xs text-gray-500 truncate">{coin.name}</span>
                </div>
                <div className="text-lg font-bold text-white">
                  ${formatPrice(coin.current_price)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500">24h</span>
                <div className={`flex items-center gap-1 ${coin.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {coin.price_change_percentage_24h >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {formatPercent(coin.price_change_percentage_24h)}
                </div>
              </div>
              <div>
                <span className="text-gray-500">7d</span>
                <div className={`flex items-center gap-1 ${(coin.price_change_percentage_7d_in_currency ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {(coin.price_change_percentage_7d_in_currency ?? 0) >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {formatPercent(coin.price_change_percentage_7d_in_currency ?? 0)}
                </div>
              </div>
              <div>
                <span className="text-gray-500">MCap</span>
                <div className="text-gray-300">${formatNumber(coin.market_cap)}</div>
              </div>
              <div>
                <span className="text-gray-500">Vol 24h</span>
                <div className="text-gray-300">${formatNumber(coin.total_volume)}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="text-center pt-4">
        <a
          href="https://www.coingecko.com/en/categories/meme-token"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          More on CoinGecko
        </a>
      </div>
    </div>
  );
}
