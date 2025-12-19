import { NextResponse } from 'next/server';
import type { MarketData, FearGreedIndex } from '@/types/news';

export const revalidate = 300; // Cache für 5 Minuten (reduziert Vercel Invocations)

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

// CoinGecko Free API (kein API Key nötig)
async function fetchTopCoins(): Promise<MarketData[]> {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false&price_change_percentage=24h',
      { next: { revalidate: 60 } }
    );

    if (!response.ok) throw new Error('CoinGecko API error');

    const data = await response.json();

    return data.map((coin: Record<string, unknown>) => ({
      symbol: coin.symbol as string,
      name: coin.name as string,
      price: coin.current_price as number,
      change24h: coin.price_change_percentage_24h as number,
      marketCap: coin.market_cap as number,
      volume24h: coin.total_volume as number,
      image: coin.image as string,
    }));
  } catch (error) {
    console.error('CoinGecko error:', error);
    return [];
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
    const [coins, fearGreed, trending, global] = await Promise.all([
      fetchTopCoins(),
      fetchFearGreedIndex(),
      fetchTrendingCoins(),
      fetchGlobalData(),
    ]);

    return NextResponse.json({
      success: true,
      coins,
      fearGreed,
      trending,
      global,
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
