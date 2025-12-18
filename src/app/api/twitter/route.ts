import { NextResponse } from 'next/server';
import {
  fetchTwitterSentiment,
  calculateGuruConsensus,
  type TwitterSentimentData,
  type InfluencerSentiment,
} from '@/lib/twitter-sentiment';

// Cache for Twitter sentiment data (5 minutes)
let cachedData: TwitterSentimentData | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  try {
    const now = Date.now();

    // Check cache
    if (cachedData && now - cacheTimestamp < CACHE_DURATION) {
      const consensus = calculateGuruConsensus(cachedData.influencers);
      return NextResponse.json({
        success: true,
        ...cachedData,
        consensus,
        cached: true,
      });
    }

    // Fetch fresh data
    const data = await fetchTwitterSentiment();
    const consensus = calculateGuruConsensus(data.influencers);

    // Update cache
    cachedData = data;
    cacheTimestamp = now;

    return NextResponse.json({
      success: true,
      ...data,
      consensus,
      cached: false,
    });
  } catch (error) {
    console.error('Twitter sentiment API error:', error);

    // Return cached data if available, even if stale
    if (cachedData) {
      const consensus = calculateGuruConsensus(cachedData.influencers);
      return NextResponse.json({
        success: true,
        ...cachedData,
        consensus,
        cached: true,
        stale: true,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch Twitter sentiment',
        influencers: [],
        recentPosts: [],
        overall: { sentiment: 'neutral', sentimentScore: 0, totalPosts: 0 },
        trendingTopics: [],
        consensus: {
          bullishCount: 0,
          bearishCount: 0,
          neutralCount: 0,
          consensus: 'neutral',
          percentage: 0,
        },
      },
      { status: 500 }
    );
  }
}
