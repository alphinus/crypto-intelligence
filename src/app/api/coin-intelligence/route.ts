import { NextResponse } from 'next/server';
import { generateCoinIntelligenceReport, type CoinAnalysisInput } from '@/lib/groq';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      symbol,
      currentPrice,
      change24h,
      timeframes,
      levels,
      emas,
      confluenceZones,
      fundingRate,
      redditSentiment,
      twitterSentiment,
      fearGreed,
      bitcoinOnChain,
    } = body;

    // Validierung
    if (!symbol || !currentPrice) {
      return NextResponse.json(
        { success: false, error: 'Symbol und Preis sind erforderlich' },
        { status: 400 }
      );
    }

    // Input für Groq
    const analysisInput: CoinAnalysisInput = {
      symbol,
      currentPrice,
      change24h: change24h || 0,
      timeframes,
      levels,
      emas,
      confluenceZones,
      fundingRate,
      redditSentiment,
      twitterSentiment,
      fearGreed,
      bitcoinOnChain,
    };

    // Report generieren
    const report = await generateCoinIntelligenceReport(analysisInput);

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error('Coin Intelligence API error:', error);
    return NextResponse.json(
      { success: false, error: 'Fehler bei der Analyse' },
      { status: 500 }
    );
  }
}
