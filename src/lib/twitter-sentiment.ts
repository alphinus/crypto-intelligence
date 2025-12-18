/**
 * Twitter/X Sentiment via RSS Feeds (Nitter instances)
 * Free, no API key required
 */

import Parser from 'rss-parser';

const parser = new Parser();

// Nitter instances that provide RSS feeds
// Note: Nitter instances may go down, so we have fallbacks
const NITTER_INSTANCES = [
  'https://nitter.privacydev.net',
  'https://nitter.poast.org',
  'https://nitter.cz',
];

// Crypto influencers to track
export const CRYPTO_INFLUENCERS = [
  { handle: '100trillionUSD', name: 'PlanB', tier: 'analyst' },
  { handle: 'CryptoKaleo', name: 'Kaleo', tier: 'trader' },
  { handle: 'CryptoCobain', name: 'Cobie', tier: 'trader' },
  { handle: 'inversebrah', name: 'inversebrah', tier: 'trader' },
  { handle: 'loomdart', name: 'LoomLee', tier: 'trader' },
  { handle: 'CryptoCapo_', name: 'Capo', tier: 'analyst' },
  { handle: 'AltcoinDailyio', name: 'Altcoin Daily', tier: 'media' },
  { handle: 'WhalePanda', name: 'WhalePanda', tier: 'analyst' },
  { handle: 'CryptoGodJohn', name: 'GodJohn', tier: 'trader' },
  { handle: 'HsakaTrades', name: 'Hsaka', tier: 'trader' },
];

export interface TwitterPost {
  id: string;
  author: string;
  authorHandle: string;
  content: string;
  pubDate: Date;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  sentimentScore: number;
  link: string;
}

export interface InfluencerSentiment {
  handle: string;
  name: string;
  tier: string;
  recentSentiment: 'bullish' | 'bearish' | 'neutral';
  sentimentScore: number;
  lastPost: Date | null;
  postCount: number;
}

export interface TwitterSentimentData {
  influencers: InfluencerSentiment[];
  recentPosts: TwitterPost[];
  overall: {
    sentiment: 'bullish' | 'bearish' | 'neutral';
    sentimentScore: number;
    totalPosts: number;
  };
  trendingTopics: string[];
}

// Bullish keywords
const BULLISH_KEYWORDS = [
  'bullish', 'moon', 'pump', 'buy', 'long', 'breakout', 'higher high', 'support',
  'accumulation', 'dip', 'buying', 'uptrend', 'rally', 'ath', 'all time high',
  'bottom', 'bounce', 'reversal up', 'green', 'gains', 'profit', 'hold',
  'hodl', 'btfd', 'send it', 'wagmi', 'lfg', 'gm', 'bullrun', 'parabolic',
];

// Bearish keywords
const BEARISH_KEYWORDS = [
  'bearish', 'dump', 'crash', 'sell', 'short', 'breakdown', 'lower low', 'resistance',
  'distribution', 'top', 'selling', 'downtrend', 'correction', 'rekt', 'ngmi',
  'scam', 'rug', 'dead', 'fear', 'panic', 'loss', 'liquidation', 'capitulation',
  'exit', 'warning', 'risk off', 'be careful', 'caution',
];

// Crypto topics to extract
const CRYPTO_TOPICS = [
  'btc', 'bitcoin', 'eth', 'ethereum', 'sol', 'solana', 'xrp', 'bnb',
  'ada', 'doge', 'avax', 'dot', 'matic', 'link', 'ltc', 'atom',
  'defi', 'nft', 'altcoin', 'altseason', 'halving', 'etf', 'regulation',
];

/**
 * Analyze sentiment from text content
 */
function analyzeSentiment(text: string): { sentiment: 'bullish' | 'bearish' | 'neutral'; score: number } {
  const lowerText = text.toLowerCase();

  let bullishScore = 0;
  let bearishScore = 0;

  // Count keyword matches
  for (const keyword of BULLISH_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      bullishScore += 1;
    }
  }

  for (const keyword of BEARISH_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      bearishScore += 1;
    }
  }

  // Calculate score (-100 to +100)
  const totalMatches = bullishScore + bearishScore;
  if (totalMatches === 0) {
    return { sentiment: 'neutral', score: 0 };
  }

  const score = Math.round(((bullishScore - bearishScore) / totalMatches) * 100);

  if (score > 20) {
    return { sentiment: 'bullish', score };
  } else if (score < -20) {
    return { sentiment: 'bearish', score };
  } else {
    return { sentiment: 'neutral', score };
  }
}

/**
 * Extract trending topics from posts
 */
function extractTopics(posts: TwitterPost[]): string[] {
  const topicCounts: Record<string, number> = {};

  for (const post of posts) {
    const lowerContent = post.content.toLowerCase();
    for (const topic of CRYPTO_TOPICS) {
      if (lowerContent.includes(topic)) {
        topicCounts[topic.toUpperCase()] = (topicCounts[topic.toUpperCase()] || 0) + 1;
      }
    }
  }

  // Sort by count and return top 10
  return Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([topic]) => topic);
}

/**
 * Fetch RSS feed from Nitter for a specific user
 */
async function fetchUserFeed(handle: string): Promise<TwitterPost[]> {
  const posts: TwitterPost[] = [];

  // Try each Nitter instance
  for (const instance of NITTER_INSTANCES) {
    try {
      const feedUrl = `${instance}/${handle}/rss`;
      const feed = await parser.parseURL(feedUrl);

      for (const item of feed.items.slice(0, 10)) {
        const content = item.contentSnippet || item.content || '';
        const sentimentResult = analyzeSentiment(content);

        posts.push({
          id: item.guid || item.link || `${handle}-${Date.now()}`,
          author: CRYPTO_INFLUENCERS.find(i => i.handle === handle)?.name || handle,
          authorHandle: handle,
          content: content.slice(0, 500),
          pubDate: item.pubDate ? new Date(item.pubDate) : new Date(),
          sentiment: sentimentResult.sentiment,
          sentimentScore: sentimentResult.score,
          link: item.link || '',
        });
      }

      // Success, break out of instance loop
      break;
    } catch (error) {
      // Try next instance
      console.warn(`Failed to fetch from ${instance} for ${handle}:`, error);
      continue;
    }
  }

  return posts;
}

/**
 * Fetch sentiment data for all crypto influencers
 */
export async function fetchTwitterSentiment(): Promise<TwitterSentimentData> {
  const allPosts: TwitterPost[] = [];
  const influencerSentiments: InfluencerSentiment[] = [];

  // Fetch feeds in parallel (with rate limiting)
  const fetchPromises = CRYPTO_INFLUENCERS.map(async (influencer, index) => {
    // Stagger requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, index * 500));

    try {
      const posts = await fetchUserFeed(influencer.handle);

      // Calculate influencer's overall sentiment
      let totalScore = 0;
      for (const post of posts) {
        totalScore += post.sentimentScore;
      }
      const avgScore = posts.length > 0 ? totalScore / posts.length : 0;

      influencerSentiments.push({
        handle: influencer.handle,
        name: influencer.name,
        tier: influencer.tier,
        recentSentiment: avgScore > 20 ? 'bullish' : avgScore < -20 ? 'bearish' : 'neutral',
        sentimentScore: Math.round(avgScore),
        lastPost: posts[0]?.pubDate || null,
        postCount: posts.length,
      });

      allPosts.push(...posts);
    } catch (error) {
      console.error(`Error fetching ${influencer.handle}:`, error);
      // Add with neutral sentiment if fetch failed
      influencerSentiments.push({
        handle: influencer.handle,
        name: influencer.name,
        tier: influencer.tier,
        recentSentiment: 'neutral',
        sentimentScore: 0,
        lastPost: null,
        postCount: 0,
      });
    }
  });

  await Promise.all(fetchPromises);

  // Sort posts by date
  allPosts.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  // Calculate overall sentiment
  let totalScore = 0;
  for (const post of allPosts) {
    totalScore += post.sentimentScore;
  }
  const overallAvg = allPosts.length > 0 ? totalScore / allPosts.length : 0;

  return {
    influencers: influencerSentiments,
    recentPosts: allPosts.slice(0, 50),
    overall: {
      sentiment: overallAvg > 15 ? 'bullish' : overallAvg < -15 ? 'bearish' : 'neutral',
      sentimentScore: Math.round(overallAvg),
      totalPosts: allPosts.length,
    },
    trendingTopics: extractTopics(allPosts),
  };
}

/**
 * Calculate guru consensus (percentage bullish)
 */
export function calculateGuruConsensus(influencers: InfluencerSentiment[]): {
  bullishCount: number;
  bearishCount: number;
  neutralCount: number;
  consensus: 'bullish' | 'bearish' | 'mixed' | 'neutral';
  percentage: number;
} {
  let bullish = 0;
  let bearish = 0;
  let neutral = 0;

  for (const inf of influencers) {
    if (inf.recentSentiment === 'bullish') bullish++;
    else if (inf.recentSentiment === 'bearish') bearish++;
    else neutral++;
  }

  const total = bullish + bearish + neutral;
  const bullishPct = total > 0 ? (bullish / total) * 100 : 0;
  const bearishPct = total > 0 ? (bearish / total) * 100 : 0;

  let consensus: 'bullish' | 'bearish' | 'mixed' | 'neutral';
  if (bullishPct >= 60) consensus = 'bullish';
  else if (bearishPct >= 60) consensus = 'bearish';
  else if (bullish > 0 || bearish > 0) consensus = 'mixed';
  else consensus = 'neutral';

  return {
    bullishCount: bullish,
    bearishCount: bearish,
    neutralCount: neutral,
    consensus,
    percentage: bullishPct,
  };
}
