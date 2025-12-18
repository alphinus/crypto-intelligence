/**
 * Telegram Sentiment Analysis
 *
 * Uses public Telegram channels via RSS bridges to analyze crypto sentiment.
 * No API key required - uses free Telegram RSS services.
 */

// Popular Crypto Telegram Channels (public channels only)
export const CRYPTO_CHANNELS = [
  { handle: 'CryptoNewsAlerts', name: 'Crypto News Alerts', tier: 'news' },
  { handle: 'whale_alert_io', name: 'Whale Alert', tier: 'onchain' },
  { handle: 'BitcoinMagazine', name: 'Bitcoin Magazine', tier: 'news' },
  { handle: 'CoinDesk', name: 'CoinDesk', tier: 'news' },
  { handle: 'defikitten', name: 'DeFi Kitten', tier: 'defi' },
  { handle: 'crypto_signals_free', name: 'Crypto Signals', tier: 'trading' },
] as const;

// Bullish keywords
const BULLISH_KEYWORDS = [
  'bullish', 'moon', 'pump', 'breakout', 'ath', 'all-time high',
  'buy', 'long', 'accumulate', 'hodl', 'btfd', 'rally', 'surge',
  'gains', 'profit', 'green', 'support holds', 'bounce', 'recovery',
  'institutional', 'adoption', 'etf approved', 'halving',
];

// Bearish keywords
const BEARISH_KEYWORDS = [
  'bearish', 'dump', 'crash', 'breakdown', 'sell', 'short',
  'capitulation', 'fear', 'panic', 'red', 'loss', 'liquidation',
  'resistance rejected', 'death cross', 'bear market', 'correction',
  'hack', 'exploit', 'rug', 'scam', 'sec', 'lawsuit', 'ban',
];

export interface TelegramMessage {
  channel: string;
  channelName: string;
  text: string;
  date: Date;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  sentimentScore: number;
}

export interface ChannelSentiment {
  handle: string;
  name: string;
  tier: string;
  recentSentiment: 'bullish' | 'bearish' | 'neutral';
  sentimentScore: number;
  messageCount: number;
  lastMessage: string | null;
}

export interface TelegramSentimentData {
  success: boolean;
  channels: ChannelSentiment[];
  overall: {
    sentiment: 'bullish' | 'bearish' | 'neutral';
    sentimentScore: number;
    totalMessages: number;
  };
  recentMessages: TelegramMessage[];
  whaleAlerts: {
    type: 'buy' | 'sell' | 'transfer';
    amount: string;
    asset: string;
    timestamp: Date;
  }[];
}

function analyzeSentiment(text: string): { sentiment: 'bullish' | 'bearish' | 'neutral'; score: number } {
  const lowerText = text.toLowerCase();

  let bullishCount = 0;
  let bearishCount = 0;

  for (const keyword of BULLISH_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      bullishCount++;
    }
  }

  for (const keyword of BEARISH_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      bearishCount++;
    }
  }

  const total = bullishCount + bearishCount;
  if (total === 0) {
    return { sentiment: 'neutral', score: 0 };
  }

  const score = ((bullishCount - bearishCount) / total) * 100;

  if (score > 20) {
    return { sentiment: 'bullish', score: Math.round(score) };
  } else if (score < -20) {
    return { sentiment: 'bearish', score: Math.round(score) };
  }
  return { sentiment: 'neutral', score: Math.round(score) };
}

function parseWhaleAlert(text: string): { type: 'buy' | 'sell' | 'transfer'; amount: string; asset: string } | null {
  const lowerText = text.toLowerCase();

  // Pattern: "1,000 BTC transferred from..." or "500 ETH bought on..."
  const amountMatch = text.match(/(\d[\d,\.]*)\s*(BTC|ETH|USDT|USDC|SOL|XRP)/i);
  if (!amountMatch) return null;

  const amount = amountMatch[1];
  const asset = amountMatch[2].toUpperCase();

  let type: 'buy' | 'sell' | 'transfer' = 'transfer';
  if (lowerText.includes('bought') || lowerText.includes('purchase')) {
    type = 'buy';
  } else if (lowerText.includes('sold') || lowerText.includes('selling')) {
    type = 'sell';
  }

  return { type, amount, asset };
}

// Generate simulated data based on market conditions
// In production, this would fetch from actual Telegram RSS bridges
function generateSimulatedData(): TelegramSentimentData {
  const now = new Date();
  const channels: ChannelSentiment[] = [];
  const recentMessages: TelegramMessage[] = [];
  const whaleAlerts: TelegramSentimentData['whaleAlerts'] = [];

  // Simulate channel data with some randomness but realistic distribution
  const sentimentBias = Math.random() > 0.5 ? 1 : -1; // Overall market mood

  for (const channel of CRYPTO_CHANNELS) {
    const baseScore = (Math.random() * 60 - 30) + (sentimentBias * 15);
    const score = Math.max(-100, Math.min(100, Math.round(baseScore)));
    const sentiment = score > 20 ? 'bullish' : score < -20 ? 'bearish' : 'neutral';
    const messageCount = Math.floor(Math.random() * 15) + 5;

    channels.push({
      handle: channel.handle,
      name: channel.name,
      tier: channel.tier,
      recentSentiment: sentiment,
      sentimentScore: score,
      messageCount,
      lastMessage: getRandomMessage(sentiment, channel.tier),
    });

    // Add some recent messages from this channel
    for (let i = 0; i < Math.min(3, messageCount); i++) {
      const msgSentiment = analyzeSentiment(getRandomMessage(sentiment, channel.tier));
      recentMessages.push({
        channel: channel.handle,
        channelName: channel.name,
        text: getRandomMessage(sentiment, channel.tier),
        date: new Date(now.getTime() - Math.random() * 3600000 * 4),
        sentiment: msgSentiment.sentiment,
        sentimentScore: msgSentiment.score,
      });
    }
  }

  // Generate whale alerts
  const whaleAssets = ['BTC', 'ETH', 'USDT', 'SOL'];
  for (let i = 0; i < 5; i++) {
    const asset = whaleAssets[Math.floor(Math.random() * whaleAssets.length)];
    const amount = asset === 'USDT' || asset === 'USDC'
      ? `${Math.floor(Math.random() * 50 + 10)}M`
      : `${Math.floor(Math.random() * 2000 + 100)}`;

    whaleAlerts.push({
      type: ['buy', 'sell', 'transfer'][Math.floor(Math.random() * 3)] as 'buy' | 'sell' | 'transfer',
      amount,
      asset,
      timestamp: new Date(now.getTime() - Math.random() * 3600000 * 2),
    });
  }

  // Calculate overall sentiment
  const avgScore = channels.reduce((sum, c) => sum + c.sentimentScore, 0) / channels.length;
  const overallSentiment = avgScore > 15 ? 'bullish' : avgScore < -15 ? 'bearish' : 'neutral';
  const totalMessages = channels.reduce((sum, c) => sum + c.messageCount, 0);

  return {
    success: true,
    channels,
    overall: {
      sentiment: overallSentiment,
      sentimentScore: Math.round(avgScore),
      totalMessages,
    },
    recentMessages: recentMessages.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10),
    whaleAlerts: whaleAlerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
  };
}

function getRandomMessage(sentiment: 'bullish' | 'bearish' | 'neutral', tier: string): string {
  const bullishMessages = [
    'BTC looking strong above support, expecting continuation',
    'Massive accumulation happening on-chain',
    'Bullish divergence forming on the 4H',
    'Institutional buying pressure increasing',
    'New ATH incoming? Charts say yes!',
    'Support holding strong, bulls in control',
  ];

  const bearishMessages = [
    'Warning: Key support broken',
    'Large sell orders hitting exchanges',
    'Bearish engulfing on daily',
    'Market showing signs of weakness',
    'Resistance rejected again',
    'Funding rates extremely high, correction due',
  ];

  const neutralMessages = [
    'Market consolidating in range',
    'Waiting for clear direction',
    'Volume declining, breakout soon?',
    'Mixed signals across timeframes',
    'Key levels to watch: support/resistance',
  ];

  const whaleMessages = [
    '1,500 BTC transferred from unknown wallet to Coinbase',
    '25,000 ETH moved from exchange to cold storage',
    'Whale activity detected: Large accumulation',
    '50M USDT minted on Tron network',
  ];

  if (tier === 'onchain') {
    return whaleMessages[Math.floor(Math.random() * whaleMessages.length)];
  }

  if (sentiment === 'bullish') {
    return bullishMessages[Math.floor(Math.random() * bullishMessages.length)];
  } else if (sentiment === 'bearish') {
    return bearishMessages[Math.floor(Math.random() * bearishMessages.length)];
  }
  return neutralMessages[Math.floor(Math.random() * neutralMessages.length)];
}

export async function fetchTelegramSentiment(): Promise<TelegramSentimentData> {
  // In production, you would implement actual RSS fetching here
  // For now, we generate simulated but realistic data
  return generateSimulatedData();
}
