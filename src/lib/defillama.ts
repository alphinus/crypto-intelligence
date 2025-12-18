// DefiLlama API Client (kostenlos, kein API Key nötig)
// Docs: https://defillama.com/docs/api

export interface Protocol {
  id: string;
  name: string;
  slug: string;
  symbol: string;
  tvl: number;
  change_1h: number | null;
  change_1d: number | null;
  change_7d: number | null;
  category: string;
  chains: string[];
  logo: string;
}

export interface Chain {
  name: string;
  tvl: number;
  tokenSymbol: string;
  change_1d: number | null;
  change_7d: number | null;
}

export interface StablecoinData {
  name: string;
  symbol: string;
  peggedUSD: number;
  change_1d: number | null;
  change_7d: number | null;
}

export interface YieldPool {
  pool: string;
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apy: number;
  apyBase: number | null;
  apyReward: number | null;
}

export interface DefiOverview {
  totalTvl: number;
  totalTvlChange24h: number;
  topProtocols: Protocol[];
  topChains: Chain[];
  topYields: YieldPool[];
  stablecoins: {
    total: number;
    change24h: number;
  };
}

const BASE_URL = 'https://api.llama.fi';
const YIELDS_URL = 'https://yields.llama.fi';

// Fetch mit Error Handling
async function fetchDefiLlama<T>(endpoint: string, baseUrl = BASE_URL): Promise<T | null> {
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(`DefiLlama API error: ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('DefiLlama fetch error:', error);
    return null;
  }
}

// Top Protocols nach TVL
export async function fetchTopProtocols(limit: number = 15): Promise<Protocol[]> {
  const data = await fetchDefiLlama<Protocol[]>('/protocols');

  if (!data) return [];

  return data
    .filter((p) => p.tvl > 0)
    .sort((a, b) => b.tvl - a.tvl)
    .slice(0, limit)
    .map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      symbol: p.symbol || '',
      tvl: p.tvl,
      change_1h: p.change_1h,
      change_1d: p.change_1d,
      change_7d: p.change_7d,
      category: p.category || 'Other',
      chains: p.chains || [],
      logo: p.logo || '',
    }));
}

// Top Chains nach TVL
export async function fetchTopChains(limit: number = 10): Promise<Chain[]> {
  const data = await fetchDefiLlama<Chain[]>('/v2/chains');

  if (!data) return [];

  return data
    .filter((c) => c.tvl > 0)
    .sort((a, b) => b.tvl - a.tvl)
    .slice(0, limit)
    .map((c) => ({
      name: c.name,
      tvl: c.tvl,
      tokenSymbol: c.tokenSymbol || '',
      change_1d: null,
      change_7d: null,
    }));
}

// Gesamt-TVL
export async function fetchTotalTvl(): Promise<{ tvl: number; change24h: number }> {
  const data = await fetchDefiLlama<{ totalLiquidityUSD: number; change_1d: number }[]>(
    '/v2/historicalChainTvl'
  );

  if (!data || data.length === 0) {
    return { tvl: 0, change24h: 0 };
  }

  // Letzter Datenpunkt
  const latest = data[data.length - 1];
  const previous = data[data.length - 2];

  const change24h = previous
    ? ((latest.totalLiquidityUSD - previous.totalLiquidityUSD) / previous.totalLiquidityUSD) * 100
    : 0;

  return {
    tvl: latest.totalLiquidityUSD,
    change24h,
  };
}

// Top Yields
export async function fetchTopYields(limit: number = 10): Promise<YieldPool[]> {
  const data = await fetchDefiLlama<{ data: YieldPool[] }>('/pools', YIELDS_URL);

  if (!data?.data) return [];

  return data.data
    .filter((p) => p.tvlUsd > 1000000 && p.apy > 0 && p.apy < 1000) // Filter unrealistische APYs
    .sort((a, b) => b.apy - a.apy)
    .slice(0, limit)
    .map((p) => ({
      pool: p.pool,
      chain: p.chain,
      project: p.project,
      symbol: p.symbol,
      tvlUsd: p.tvlUsd,
      apy: p.apy,
      apyBase: p.apyBase,
      apyReward: p.apyReward,
    }));
}

// Stablecoins Marktkapitalisierung
export async function fetchStablecoins(): Promise<{ total: number; change24h: number }> {
  const data = await fetchDefiLlama<{
    peggedAssets: Array<{ circulating: { peggedUSD: number } }>;
  }>('/stablecoins');

  if (!data?.peggedAssets) {
    return { total: 0, change24h: 0 };
  }

  const total = data.peggedAssets.reduce(
    (sum, s) => sum + (s.circulating?.peggedUSD || 0),
    0
  );

  return { total, change24h: 0 }; // Change nicht direkt verfügbar
}

// Komplette DeFi-Übersicht
export async function fetchDefiOverview(): Promise<DefiOverview> {
  const [protocols, chains, yields, stablecoins] = await Promise.all([
    fetchTopProtocols(15),
    fetchTopChains(10),
    fetchTopYields(10),
    fetchStablecoins(),
  ]);

  // Berechne Gesamt-TVL aus Protocols
  const totalTvl = protocols.reduce((sum, p) => sum + p.tvl, 0);

  // Durchschnittliche 24h Änderung
  const protocolsWithChange = protocols.filter((p) => p.change_1d !== null);
  const avgChange =
    protocolsWithChange.length > 0
      ? protocolsWithChange.reduce((sum, p) => sum + (p.change_1d || 0), 0) /
        protocolsWithChange.length
      : 0;

  return {
    totalTvl,
    totalTvlChange24h: avgChange,
    topProtocols: protocols,
    topChains: chains,
    topYields: yields,
    stablecoins,
  };
}

// Formatierung für große Zahlen
export function formatTvl(tvl: number): string {
  if (tvl >= 1e12) return `$${(tvl / 1e12).toFixed(2)}T`;
  if (tvl >= 1e9) return `$${(tvl / 1e9).toFixed(2)}B`;
  if (tvl >= 1e6) return `$${(tvl / 1e6).toFixed(2)}M`;
  if (tvl >= 1e3) return `$${(tvl / 1e3).toFixed(2)}K`;
  return `$${tvl.toFixed(2)}`;
}
