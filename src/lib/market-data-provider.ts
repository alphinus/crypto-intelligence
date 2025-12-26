// Market Data Provider mit intelligentem Fallback
// Primaer: Binance (schneller, genauere Preise)
// Fallback: CoinGecko (stabiler, mehr Coins)

export type DataProvider = 'binance' | 'coingecko';

export interface MarketCoin {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
  image?: string;
}

export interface ProviderStatus {
  provider: DataProvider;
  lastSuccess: Date | null;
  lastError: Date | null;
  errorCount: number;
  isHealthy: boolean;
}

// In-Memory Status Tracking (Server-Side)
const providerStatus: Record<DataProvider, ProviderStatus> = {
  binance: {
    provider: 'binance',
    lastSuccess: null,
    lastError: null,
    errorCount: 0,
    isHealthy: true,
  },
  coingecko: {
    provider: 'coingecko',
    lastSuccess: null,
    lastError: null,
    errorCount: 0,
    isHealthy: true,
  },
};

// Anzahl Fehler bevor Provider als ungesund gilt
const ERROR_THRESHOLD = 3;
// Zeit bis Provider wieder versucht wird (5 Minuten)
const RECOVERY_TIME_MS = 5 * 60 * 1000;

function markSuccess(provider: DataProvider) {
  providerStatus[provider].lastSuccess = new Date();
  providerStatus[provider].errorCount = 0;
  providerStatus[provider].isHealthy = true;
}

function markError(provider: DataProvider) {
  const status = providerStatus[provider];
  status.lastError = new Date();
  status.errorCount++;
  if (status.errorCount >= ERROR_THRESHOLD) {
    status.isHealthy = false;
  }
}

function shouldTryProvider(provider: DataProvider): boolean {
  const status = providerStatus[provider];
  if (status.isHealthy) return true;

  // Check ob genug Zeit vergangen ist fuer Retry
  if (status.lastError) {
    const timeSinceError = Date.now() - status.lastError.getTime();
    if (timeSinceError >= RECOVERY_TIME_MS) {
      // Reset fuer erneuten Versuch
      status.errorCount = 0;
      status.isHealthy = true;
      return true;
    }
  }

  return false;
}

// =====================================================
// BINANCE DATA FETCHING
// =====================================================

interface BinanceTicker {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  volume: string;
  quoteVolume: string;
}

const BINANCE_URLS = [
  'https://api.binance.com/api/v3',
  'https://api.binance.us/api/v3',
];

async function fetchBinanceTickers(): Promise<MarketCoin[]> {
  const symbols = [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT',
    'DOGEUSDT', 'SOLUSDT', 'DOTUSDT', 'MATICUSDT', 'LTCUSDT',
    'SHIBUSDT', 'AVAXUSDT', 'LINKUSDT', 'ATOMUSDT', 'UNIUSDT',
    'XLMUSDT', 'NEARUSDT', 'APTUSDT', 'ARBUSDT', 'OPUSDT',
  ];

  for (const baseUrl of BINANCE_URLS) {
    try {
      const response = await fetch(
        `${baseUrl}/ticker/24hr?symbols=${JSON.stringify(symbols)}`,
        {
          headers: { Accept: 'application/json' },
          next: { revalidate: 30 },
        }
      );

      if (response.status === 451 || response.status === 403) {
        console.log(`Binance ${baseUrl} blocked, trying next...`);
        continue;
      }

      if (!response.ok) {
        throw new Error(`Binance API error: ${response.status}`);
      }

      const data: BinanceTicker[] = await response.json();

      const coins: MarketCoin[] = data.map((ticker) => {
        const symbol = ticker.symbol.replace('USDT', '');
        return {
          symbol: symbol.toLowerCase(),
          name: getNameForSymbol(symbol),
          price: parseFloat(ticker.lastPrice),
          change24h: parseFloat(ticker.priceChangePercent),
          marketCap: 0, // Binance hat keine MarketCap
          volume24h: parseFloat(ticker.quoteVolume),
          image: `https://assets.coincap.io/assets/icons/${symbol.toLowerCase()}@2x.png`,
        };
      });

      markSuccess('binance');
      return coins;
    } catch (error) {
      console.log(`Binance ${baseUrl} failed:`, error);
      continue;
    }
  }

  markError('binance');
  return [];
}

// Symbol zu Name Mapping
function getNameForSymbol(symbol: string): string {
  const names: Record<string, string> = {
    BTC: 'Bitcoin',
    ETH: 'Ethereum',
    BNB: 'BNB',
    XRP: 'XRP',
    ADA: 'Cardano',
    DOGE: 'Dogecoin',
    SOL: 'Solana',
    DOT: 'Polkadot',
    MATIC: 'Polygon',
    LTC: 'Litecoin',
    SHIB: 'Shiba Inu',
    AVAX: 'Avalanche',
    LINK: 'Chainlink',
    ATOM: 'Cosmos',
    UNI: 'Uniswap',
    XLM: 'Stellar',
    NEAR: 'NEAR Protocol',
    APT: 'Aptos',
    ARB: 'Arbitrum',
    OP: 'Optimism',
  };
  return names[symbol.toUpperCase()] || symbol;
}

// =====================================================
// COINGECKO DATA FETCHING
// =====================================================

async function fetchCoinGeckoCoins(): Promise<MarketCoin[]> {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false&price_change_percentage=24h',
      { next: { revalidate: 60 } }
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();

    const coins: MarketCoin[] = data.map((coin: Record<string, unknown>) => ({
      symbol: coin.symbol as string,
      name: coin.name as string,
      price: coin.current_price as number,
      change24h: coin.price_change_percentage_24h as number,
      marketCap: coin.market_cap as number,
      volume24h: coin.total_volume as number,
      image: coin.image as string,
    }));

    markSuccess('coingecko');
    return coins;
  } catch (error) {
    console.error('CoinGecko error:', error);
    markError('coingecko');
    return [];
  }
}

// =====================================================
// UNIFIED MARKET DATA PROVIDER
// =====================================================

export interface MarketDataResult {
  coins: MarketCoin[];
  provider: DataProvider;
  fallbackUsed: boolean;
  timestamp: string;
}

export async function fetchMarketData(): Promise<MarketDataResult> {
  // Versuche Binance zuerst (schneller, genauere Preise)
  if (shouldTryProvider('binance')) {
    const binanceCoins = await fetchBinanceTickers();
    if (binanceCoins.length > 0) {
      // Hole MarketCap von CoinGecko im Hintergrund
      enrichWithMarketCap(binanceCoins).catch(() => { });

      return {
        coins: binanceCoins,
        provider: 'binance',
        fallbackUsed: false,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Fallback zu CoinGecko
  console.log('Using CoinGecko fallback for market data');
  const geckoCoins = await fetchCoinGeckoCoins();

  return {
    coins: geckoCoins,
    provider: 'coingecko',
    fallbackUsed: true,
    timestamp: new Date().toISOString(),
  };
}

// Enriche Binance Daten mit MarketCap von CoinGecko
async function enrichWithMarketCap(coins: MarketCoin[]): Promise<void> {
  try {
    const geckoCoins = await fetchCoinGeckoCoins();
    const geckoMap = new Map(
      geckoCoins.map((c) => [c.symbol.toLowerCase(), c])
    );

    for (const coin of coins) {
      const geckoData = geckoMap.get(coin.symbol.toLowerCase());
      if (geckoData) {
        coin.marketCap = geckoData.marketCap;
        coin.image = geckoData.image;
      }
    }
  } catch {
    // Ignorieren - Enrichment ist optional
  }
}

// =====================================================
// SINGLE COIN PRICE WITH FALLBACK
// =====================================================

export interface CoinPrice {
  symbol: string;
  price: number;
  change24h: number;
  provider: DataProvider;
}

export async function fetchCoinPrice(symbol: string): Promise<CoinPrice | null> {
  const upperSymbol = symbol.toUpperCase();

  // Versuche Binance
  if (shouldTryProvider('binance')) {
    for (const baseUrl of BINANCE_URLS) {
      try {
        const response = await fetch(
          `${baseUrl}/ticker/24hr?symbol=${upperSymbol}USDT`,
          { next: { revalidate: 10 } }
        );

        if (response.ok) {
          const data = await response.json();
          markSuccess('binance');
          return {
            symbol: upperSymbol.toLowerCase(),
            price: parseFloat(data.lastPrice),
            change24h: parseFloat(data.priceChangePercent),
            provider: 'binance',
          };
        }
      } catch {
        continue;
      }
    }
    markError('binance');
  }

  // Fallback: CoinGecko
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${getCoinGeckoId(upperSymbol)}&vs_currencies=usd&include_24hr_change=true`,
      { next: { revalidate: 30 } }
    );

    if (response.ok) {
      const data = await response.json();
      const geckoId = getCoinGeckoId(upperSymbol);
      if (data[geckoId]) {
        markSuccess('coingecko');
        return {
          symbol: upperSymbol.toLowerCase(),
          price: data[geckoId].usd,
          change24h: data[geckoId].usd_24h_change || 0,
          provider: 'coingecko',
        };
      }
    }
  } catch {
    markError('coingecko');
  }

  return null;
}

// Symbol zu CoinGecko ID Mapping
function getCoinGeckoId(symbol: string): string {
  const ids: Record<string, string> = {
    BTC: 'bitcoin',
    ETH: 'ethereum',
    BNB: 'binancecoin',
    XRP: 'ripple',
    ADA: 'cardano',
    DOGE: 'dogecoin',
    SOL: 'solana',
    DOT: 'polkadot',
    MATIC: 'matic-network',
    LTC: 'litecoin',
    SHIB: 'shiba-inu',
    AVAX: 'avalanche-2',
    LINK: 'chainlink',
    ATOM: 'cosmos',
    UNI: 'uniswap',
    XLM: 'stellar',
    NEAR: 'near',
    APT: 'aptos',
    ARB: 'arbitrum',
    OP: 'optimism',
  };
  return ids[symbol.toUpperCase()] || symbol.toLowerCase();
}

// =====================================================
// PROVIDER STATUS API
// =====================================================

export function getProviderStatus(): Record<DataProvider, ProviderStatus> {
  return { ...providerStatus };
}

export function getActiveProvider(): DataProvider {
  if (providerStatus.binance.isHealthy) return 'binance';
  return 'coingecko';
}
