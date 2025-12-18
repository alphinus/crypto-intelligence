import { NextResponse } from 'next/server';
import {
  fetchAllSubreddits,
  quickSentimentAnalysis,
  extractTrendingTopics,
  type SubredditData,
} from '@/lib/reddit';

export const revalidate = 300; // Cache für 5 Minuten

export async function GET() {
  try {
    // Alle Subreddits fetchen
    const subreddits = await fetchAllSubreddits();

    // Sentiment und Trending Topics für jedes Subreddit berechnen
    const enrichedSubreddits: SubredditData[] = subreddits.map((sub) => {
      const { sentiment, score } = quickSentimentAnalysis(sub.posts);
      const trendingTopics = extractTrendingTopics(sub.posts);

      return {
        ...sub,
        sentiment,
        sentimentScore: score,
        trendingTopics,
      };
    });

    // Gesamt-Sentiment berechnen
    const allPosts = subreddits.flatMap((s) => s.posts);
    const { sentiment: overallSentiment, score: overallScore } =
      quickSentimentAnalysis(allPosts);
    const allTrendingTopics = extractTrendingTopics(allPosts);

    return NextResponse.json({
      success: true,
      subreddits: enrichedSubreddits,
      overall: {
        sentiment: overallSentiment,
        sentimentScore: overallScore,
        trendingTopics: allTrendingTopics,
        totalPosts: allPosts.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Reddit API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch Reddit data' },
      { status: 500 }
    );
  }
}
