import { NextResponse } from 'next/server';
import type { MarketData, FearGreedIndex } from '@/types/news';
import { fetchMarketData, getActiveProvider } from '@/lib/market-data-provider';

export const revalidate = 60; // Cache für 1 Minute (schnellere Updates mit Fallback)

// Types for new data
export interface TrendingCoin {
  id: string;
  name: string;
  symbol: string;
  thumb: string;
  marketCapRank: number;
  priceChange24h: number;
}

export interface GlobalData {
  totalMarketCap: number;
  totalMarketCapChange24h: number;
  totalVolume: number;
  btcDominance: number;
  ethDominance: number;
  activeCryptos: number;
}

// Market Data mit Binance/CoinGecko Fallback
async function fetchTopCoins(): Promise<{ coins: MarketData[]; provider: string }> {
  try {
    const result = await fetchMarketData();

    const coins: MarketData[] = result.coins.map((coin) => ({
      id: coin.symbol.toLowerCase(),
      symbol: coin.symbol,
      name: coin.name,
      price: coin.price,
      change24h: coin.change24h,
      marketCap: coin.marketCap,
      volume24h: coin.volume24h,
      image: coin.image || '',
    }));

    return { coins, provider: result.provider };
  } catch (error) {
    console.error('Market data error:', error);
    return { coins: [], provider: 'none' };
  }
}

// Trending Coins (CoinGecko)
async function fetchTrendingCoins(): Promise<TrendingCoin[]> {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/search/trending',
      { next: { revalidate: 300 } }
    );

    if (!response.ok) throw new Error('Trending API error');

    const data = await response.json();

    return data.coins.slice(0, 7).map((item: { item: Record<string, unknown> }) => ({
      id: item.item.id as string,
      name: item.item.name as string,
      symbol: item.item.symbol as string,
      thumb: item.item.thumb as string,
      marketCapRank: item.item.market_cap_rank as number,
      priceChange24h: ((item.item.data as Record<string, unknown>)?.price_change_percentage_24h as Record<string, number> | undefined)?.usd || 0,
    }));
  } catch (error) {
    console.error('Trending error:', error);
    return [];
  }
}

// Global Market Data (CoinGecko)
async function fetchGlobalData(): Promise<GlobalData | null> {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/global',
      { next: { revalidate: 300 } }
    );

    if (!response.ok) throw new Error('Global API error');

    const data = await response.json();
    const globalData = data.data;

    return {
      totalMarketCap: globalData.total_market_cap?.usd || 0,
      totalMarketCapChange24h: globalData.market_cap_change_percentage_24h_usd || 0,
      totalVolume: globalData.total_volume?.usd || 0,
      btcDominance: globalData.market_cap_percentage?.btc || 0,
      ethDominance: globalData.market_cap_percentage?.eth || 0,
      activeCryptos: globalData.active_cryptocurrencies || 0,
    };
  } catch (error) {
    console.error('Global data error:', error);
    return null;
  }
}

// Fear & Greed Index (alternative.me - kostenlos)
async function fetchFearGreedIndex(): Promise<FearGreedIndex | null> {
  try {
    const response = await fetch(
      'https://api.alternative.me/fng/?limit=1',
      { next: { revalidate: 300 } }
    );

    if (!response.ok) throw new Error('Fear & Greed API error');

    const data = await response.json();
    const item = data.data[0];

    return {
      value: parseInt(item.value),
      classification: item.value_classification,
      label: item.value_classification,
      timestamp: new Date(parseInt(item.timestamp) * 1000).toISOString(),
    };
  } catch (error) {
    console.error('Fear & Greed error:', error);
    return null;
  }
}

export async function GET() {
  try {
    const [coinData, fearGreed, trending, global] = await Promise.all([
      fetchTopCoins(),
      fetchFearGreedIndex(),
      fetchTrendingCoins(),
      fetchGlobalData(),
    ]);

    return NextResponse.json({
      success: true,
      coins: coinData.coins,
      fearGreed,
      trending,
      global,
      dataProvider: coinData.provider,
      activeProvider: getActiveProvider(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching market data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch market data' },
      { status: 500 }
    );
  }
}
