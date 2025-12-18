// Binance Futures API Client (kostenlos, kein API Key nötig)

const BASE_URL = 'https://fapi.binance.com';

export interface OpenInterest {
  symbol: string;
  openInterest: string;
  time: number;
}

export interface FundingRate {
  symbol: string;
  fundingRate: string;
  fundingTime: number;
  markPrice: string;
}

export interface LongShortRatio {
  symbol: string;
  longShortRatio: string;
  longAccount: string;
  shortAccount: string;
  timestamp: number;
}

export interface FuturesTicker {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  lastPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
}

export interface FuturesOverviewData {
  openInterest: {
    btc: number;
    eth: number;
    sol: number;
  };
  fundingRates: {
    btc: number;
    eth: number;
    sol: number;
  };
  longShortRatio: {
    btc: { ratio: number; long: number; short: number };
    eth: { ratio: number; long: number; short: number };
    sol: { ratio: number; long: number; short: number };
  };
  tickers: {
    btc: FuturesTicker | null;
    eth: FuturesTicker | null;
    sol: FuturesTicker | null;
  };
}

async function fetchWithRetry<T>(url: string, retries = 3): Promise<T | null> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
        next: { revalidate: 60 }, // Cache for 1 minute
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      return await res.json();
    } catch (error) {
      if (i === retries - 1) {
        console.error(`Failed to fetch ${url}:`, error);
        return null;
      }
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
  return null;
}

export async function fetchOpenInterest(symbol: string): Promise<number> {
  const data = await fetchWithRetry<OpenInterest>(
    `${BASE_URL}/fapi/v1/openInterest?symbol=${symbol}`
  );
  return data ? parseFloat(data.openInterest) : 0;
}

export async function fetchFundingRate(symbol: string): Promise<number> {
  const data = await fetchWithRetry<FundingRate[]>(
    `${BASE_URL}/fapi/v1/fundingRate?symbol=${symbol}&limit=1`
  );
  return data && data.length > 0 ? parseFloat(data[0].fundingRate) * 100 : 0;
}

export async function fetchLongShortRatio(symbol: string): Promise<LongShortRatio | null> {
  const data = await fetchWithRetry<LongShortRatio[]>(
    `${BASE_URL}/futures/data/globalLongShortAccountRatio?symbol=${symbol}&period=1h&limit=1`
  );
  return data && data.length > 0 ? data[0] : null;
}

export async function fetchFuturesTicker(symbol: string): Promise<FuturesTicker | null> {
  const data = await fetchWithRetry<FuturesTicker>(
    `${BASE_URL}/fapi/v1/ticker/24hr?symbol=${symbol}`
  );
  return data;
}

export async function fetchFuturesOverview(): Promise<FuturesOverviewData> {
  const symbols = {
    btc: 'BTCUSDT',
    eth: 'ETHUSDT',
    sol: 'SOLUSDT',
  };

  // Parallel fetching for all data
  const [
    btcOI, ethOI, solOI,
    btcFR, ethFR, solFR,
    btcLS, ethLS, solLS,
    btcTicker, ethTicker, solTicker,
  ] = await Promise.all([
    // Open Interest
    fetchOpenInterest(symbols.btc),
    fetchOpenInterest(symbols.eth),
    fetchOpenInterest(symbols.sol),
    // Funding Rates
    fetchFundingRate(symbols.btc),
    fetchFundingRate(symbols.eth),
    fetchFundingRate(symbols.sol),
    // Long/Short Ratio
    fetchLongShortRatio(symbols.btc),
    fetchLongShortRatio(symbols.eth),
    fetchLongShortRatio(symbols.sol),
    // Tickers
    fetchFuturesTicker(symbols.btc),
    fetchFuturesTicker(symbols.eth),
    fetchFuturesTicker(symbols.sol),
  ]);

  return {
    openInterest: {
      btc: btcOI,
      eth: ethOI,
      sol: solOI,
    },
    fundingRates: {
      btc: btcFR,
      eth: ethFR,
      sol: solFR,
    },
    longShortRatio: {
      btc: btcLS ? {
        ratio: parseFloat(btcLS.longShortRatio),
        long: parseFloat(btcLS.longAccount) * 100,
        short: parseFloat(btcLS.shortAccount) * 100,
      } : { ratio: 1, long: 50, short: 50 },
      eth: ethLS ? {
        ratio: parseFloat(ethLS.longShortRatio),
        long: parseFloat(ethLS.longAccount) * 100,
        short: parseFloat(ethLS.shortAccount) * 100,
      } : { ratio: 1, long: 50, short: 50 },
      sol: solLS ? {
        ratio: parseFloat(solLS.longShortRatio),
        long: parseFloat(solLS.longAccount) * 100,
        short: parseFloat(solLS.shortAccount) * 100,
      } : { ratio: 1, long: 50, short: 50 },
    },
    tickers: {
      btc: btcTicker,
      eth: ethTicker,
      sol: solTicker,
    },
  };
}

// Format large numbers for display
export function formatOpenInterest(value: number): string {
  if (value >= 1e9) {
    return `${(value / 1e9).toFixed(2)}B`;
  } else if (value >= 1e6) {
    return `${(value / 1e6).toFixed(2)}M`;
  } else if (value >= 1e3) {
    return `${(value / 1e3).toFixed(2)}K`;
  }
  return value.toFixed(2);
}

// Format funding rate with color indicator
export function getFundingRateColor(rate: number): string {
  if (rate > 0.05) return 'text-red-400'; // Very bullish market (high cost for longs)
  if (rate > 0) return 'text-yellow-400'; // Slightly bullish
  if (rate < -0.05) return 'text-green-400'; // Very bearish (high cost for shorts)
  return 'text-blue-400'; // Neutral/slightly bearish
}
