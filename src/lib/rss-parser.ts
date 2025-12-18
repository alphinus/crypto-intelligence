import Parser from 'rss-parser';
import { CRYPTO_FEEDS, type FeedConfig } from './feeds';
import type { NewsArticle } from '@/types/news';

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'CryptoIntelligence/1.0',
  },
});

// Einfache Hash-Funktion für IDs
function generateId(title: string, source: string): string {
  const str = `${title}-${source}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

// Extrahiere Bild-URL aus verschiedenen Feed-Formaten
function extractImageUrl(item: Parser.Item): string | undefined {
  // Versuche verschiedene Quellen
  if (item.enclosure?.url) return item.enclosure.url;

  // Cast zu Record für erweiterte Properties
  const extItem = item as unknown as Record<string, unknown>;

  // Suche im Content nach Bildern
  const content = (item.content || extItem['content:encoded'] || '') as string;
  const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
  if (imgMatch) return imgMatch[1];

  // Media content
  const media = extItem['media:content'];
  if (media && typeof media === 'object' && 'url' in (media as object)) {
    return (media as { url: string }).url;
  }

  return undefined;
}

export async function fetchFeed(feed: FeedConfig): Promise<NewsArticle[]> {
  try {
    const result = await parser.parseURL(feed.url);

    return result.items.slice(0, 10).map((item) => {
      const extItem = item as unknown as Record<string, unknown>;
      return {
        id: generateId(item.title || '', feed.name),
        title: item.title || 'Untitled',
        description: item.contentSnippet || item.content?.slice(0, 300) || '',
        content: (item.content || extItem['content:encoded'] || '') as string,
        link: item.link || '',
        pubDate: item.pubDate || new Date().toISOString(),
        source: feed.name,
        category: feed.category,
        imageUrl: extractImageUrl(item),
      };
    });
  } catch (error) {
    console.error(`Error fetching ${feed.name}:`, error);
    return [];
  }
}

export async function fetchAllFeeds(): Promise<NewsArticle[]> {
  const results = await Promise.allSettled(
    CRYPTO_FEEDS.map((feed) => fetchFeed(feed))
  );

  const articles: NewsArticle[] = [];

  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      articles.push(...result.value);
    }
  });

  // Sortiere nach Datum (neueste zuerst)
  articles.sort((a, b) =>
    new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );

  // Deduplizierung basierend auf ähnlichen Titeln
  const seen = new Set<string>();
  const unique = articles.filter((article) => {
    const normalizedTitle = article.title.toLowerCase().slice(0, 50);
    if (seen.has(normalizedTitle)) return false;
    seen.add(normalizedTitle);
    return true;
  });

  return unique;
}
