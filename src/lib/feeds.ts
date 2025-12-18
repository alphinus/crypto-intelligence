// Crypto News RSS Feed Konfiguration
export const CRYPTO_FEEDS = [
  {
    name: 'CoinDesk',
    url: 'https://www.coindesk.com/arc/outboundfeeds/rss/',
    category: 'general',
  },
  {
    name: 'Cointelegraph',
    url: 'https://cointelegraph.com/rss',
    category: 'general',
  },
  {
    name: 'The Block',
    url: 'https://www.theblock.co/rss.xml',
    category: 'general',
  },
  {
    name: 'Decrypt',
    url: 'https://decrypt.co/feed',
    category: 'general',
  },
  {
    name: 'Bitcoin Magazine',
    url: 'https://bitcoinmagazine.com/feed',
    category: 'bitcoin',
  },
  {
    name: 'The Defiant',
    url: 'https://thedefiant.io/feed',
    category: 'defi',
  },
  {
    name: 'CryptoSlate',
    url: 'https://cryptoslate.com/feed/',
    category: 'general',
  },
  {
    name: 'NewsBTC',
    url: 'https://www.newsbtc.com/feed/',
    category: 'general',
  },
  {
    name: 'Blockworks',
    url: 'https://blockworks.co/feed',
    category: 'institutional',
  },
  {
    name: 'DL News',
    url: 'https://www.dlnews.com/feed/',
    category: 'general',
  },
] as const;

export type FeedCategory = 'general' | 'bitcoin' | 'defi' | 'institutional' | 'regulation';

export interface FeedConfig {
  name: string;
  url: string;
  category: FeedCategory;
}
