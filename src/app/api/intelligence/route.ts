import { NextResponse } from 'next/server';
import { generateMarketIntelligenceReport, generateEnhancedReport } from '@/lib/groq';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      newsHeadlines = [],
      redditTrending = [],
      redditSentiment = { sentiment: 'neutral', score: 0 },
      topCoins = [],
      fearGreedIndex = 50,
      defiTvlChange = 0,
      topProtocols = [],
      // Neue optionale Felder
      technicalLevels,
      multiTimeframe,
      futuresData,
      btcDominance,
    } = body;

    // Wenn erweiterte Daten vorhanden, nutze generateEnhancedReport
    const hasEnhancedData = technicalLevels || multiTimeframe || futuresData;

    let report;
    if (hasEnhancedData) {
      report = await generateEnhancedReport({
        newsHeadlines,
        redditTrending,
        redditSentiment,
        topCoins,
        fearGreedIndex,
        defiTvlChange,
        topProtocols,
        technicalLevels,
        multiTimeframe,
        futuresData,
        btcDominance,
      });
    } else {
      report = await generateMarketIntelligenceReport({
        newsHeadlines,
        redditTrending,
        redditSentiment,
        topCoins,
        fearGreedIndex,
        defiTvlChange,
        topProtocols,
      });
    }

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error('Intelligence API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate intelligence report' },
      { status: 500 }
    );
  }
}
