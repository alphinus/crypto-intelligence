// Reddit JSON API Client (kostenlos, kein API Key nötig)

export interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  score: number;
  upvoteRatio: number;
  numComments: number;
  created: number;
  author: string;
  permalink: string;
  subreddit: string;
  url: string;
  isSelf: boolean;
}

export interface SubredditData {
  name: string;
  displayName: string;
  posts: RedditPost[];
  sentiment?: 'bullish' | 'bearish' | 'neutral';
  sentimentScore?: number;
  trendingTopics?: string[];
}

// Crypto-relevante Subreddits
export const CRYPTO_SUBREDDITS = [
  { name: 'cryptocurrency', displayName: 'r/CryptoCurrency' },
  { name: 'bitcoin', displayName: 'r/Bitcoin' },
  { name: 'ethereum', displayName: 'r/ethereum' },
  { name: 'defi', displayName: 'r/DeFi' },
  { name: 'altcoin', displayName: 'r/altcoin' },
] as const;

// Reddit JSON API Fetch mit Rate Limiting
async function fetchWithDelay(url: string, delayMs: number = 1000): Promise<Response> {
  await new Promise((resolve) => setTimeout(resolve, delayMs));

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; CryptoIntelligence/1.0)',
      'Accept': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    console.error(`Reddit API error: ${response.status} for ${url}`);
    throw new Error(`Reddit API error: ${response.status}`);
  }

  return response;
}

// Einzelnes Subreddit fetchen
export async function fetchSubreddit(
  subredditName: string,
  sort: 'hot' | 'new' | 'top' = 'hot',
  limit: number = 15
): Promise<RedditPost[]> {
  try {
    const url = `https://www.reddit.com/r/${subredditName}/${sort}.json?limit=${limit}`;
    const response = await fetchWithDelay(url, 500);
    const data = await response.json();

    if (!data.data?.children) {
      return [];
    }

    return data.data.children
      .filter((child: { kind: string }) => child.kind === 't3') // Nur Posts, keine Kommentare
      .map((child: { data: Record<string, unknown> }) => ({
        id: child.data.id as string,
        title: child.data.title as string,
        selftext: ((child.data.selftext as string) || '').slice(0, 500),
        score: child.data.score as number,
        upvoteRatio: child.data.upvote_ratio as number,
        numComments: child.data.num_comments as number,
        created: child.data.created_utc as number,
        author: child.data.author as string,
        permalink: `https://reddit.com${child.data.permalink}`,
        subreddit: child.data.subreddit as string,
        url: child.data.url as string,
        isSelf: child.data.is_self as boolean,
      }));
  } catch (error) {
    console.error(`Error fetching r/${subredditName}:`, error);
    return [];
  }
}

// Alle Crypto-Subreddits fetchen
export async function fetchAllSubreddits(): Promise<SubredditData[]> {
  const results: SubredditData[] = [];

  // Sequentiell fetchen um Rate Limits zu respektieren
  for (const sub of CRYPTO_SUBREDDITS) {
    const posts = await fetchSubreddit(sub.name, 'hot', 15);
    results.push({
      name: sub.name,
      displayName: sub.displayName,
      posts,
    });
  }

  return results;
}

// Einfache Sentiment-Analyse basierend auf Keywords
// (wird später durch Groq ersetzt für bessere Analyse)
export function quickSentimentAnalysis(posts: RedditPost[]): {
  sentiment: 'bullish' | 'bearish' | 'neutral';
  score: number;
} {
  const bullishKeywords = [
    'moon', 'pump', 'bullish', 'buy', 'hodl', 'ath', 'breakout',
    'rally', 'surge', 'gain', 'profit', 'accumulate', 'long',
    'adoption', 'institutional', 'etf approved', 'green',
  ];

  const bearishKeywords = [
    'dump', 'crash', 'bearish', 'sell', 'rekt', 'scam', 'rug',
    'down', 'drop', 'loss', 'fear', 'short', 'correction',
    'regulation', 'ban', 'hack', 'exploit', 'red',
  ];

  let bullishCount = 0;
  let bearishCount = 0;

  for (const post of posts) {
    const text = `${post.title} ${post.selftext}`.toLowerCase();

    for (const keyword of bullishKeywords) {
      if (text.includes(keyword)) bullishCount++;
    }

    for (const keyword of bearishKeywords) {
      if (text.includes(keyword)) bearishCount++;
    }
  }

  const total = bullishCount + bearishCount;
  if (total === 0) {
    return { sentiment: 'neutral', score: 0 };
  }

  const score = Math.round(((bullishCount - bearishCount) / total) * 100);

  if (score > 20) return { sentiment: 'bullish', score };
  if (score < -20) return { sentiment: 'bearish', score };
  return { sentiment: 'neutral', score };
}

// Trending Topics aus Posts extrahieren
export function extractTrendingTopics(posts: RedditPost[]): string[] {
  const coinPatterns = [
    /\b(BTC|Bitcoin)\b/gi,
    /\b(ETH|Ethereum)\b/gi,
    /\b(SOL|Solana)\b/gi,
    /\b(XRP|Ripple)\b/gi,
    /\b(ADA|Cardano)\b/gi,
    /\b(DOGE|Dogecoin)\b/gi,
    /\b(DOT|Polkadot)\b/gi,
    /\b(AVAX|Avalanche)\b/gi,
    /\b(LINK|Chainlink)\b/gi,
    /\b(MATIC|Polygon)\b/gi,
    /\bDeFi\b/gi,
    /\bNFT\b/gi,
    /\bETF\b/gi,
    /\bAI\b/gi,
    /\bL2\b/gi,
    /\bStaking\b/gi,
  ];

  const topicCounts = new Map<string, number>();

  for (const post of posts) {
    const text = `${post.title} ${post.selftext}`;

    for (const pattern of coinPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        const topic = matches[0].toUpperCase();
        topicCounts.set(topic, (topicCounts.get(topic) || 0) + matches.length);
      }
    }
  }

  // Sortieren nach Häufigkeit und Top 5 zurückgeben
  return Array.from(topicCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic]) => topic);
}
