export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  content?: string;
  link: string;
  pubDate: string;
  source: string;
  category: string;
  imageUrl?: string;
  sentiment?: 'bullish' | 'bearish' | 'neutral';
  sentimentScore?: number;
  summary?: string;
  entities?: string[];
  impact?: 'high' | 'medium' | 'low';
}

export interface MarketData {
  id: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
  symbol: string;
  name: string;
  image: string;
}

export interface FearGreedIndex {
  value: number;
  classification: string;
  label: string;
  timestamp: string;
}

export interface AnalysisResult {
  sentiment: 'bullish' | 'bearish' | 'neutral';
  sentimentScore: number;
  summary: string;
  entities: string[];
  impact: 'high' | 'medium' | 'low';
  keyPoints: string[];
}
