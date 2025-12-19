import { NextResponse } from 'next/server';
import {
  fetchMultiTimeframe,
  fetchSingleTimeframe,
  toBinanceSymbol,
  calculateMultipleEMAs,
  type Interval,
} from '@/lib/binance-klines';
import {
  analyzeTechnicalLevelsForTimeframe,
  analyzeAllTimeframeLevels,
  findConfluenceZones,
} from '@/lib/technical-levels';

// Caching aktiviert - alle 5 Minuten revalidieren
// Erhöht von 30s auf 300s um Vercel Invocations zu reduzieren
export const revalidate = 300;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'BTC';
    const timeframe = (searchParams.get('timeframe') as Interval) || '1h';
    const fullAnalysis = searchParams.get('full') === 'true';

    const binanceSymbol = toBinanceSymbol(symbol);

    if (fullAnalysis) {
      // Vollständige Multi-Timeframe Analyse
      const multiTimeframe = await fetchMultiTimeframe(binanceSymbol);

      // Levels für alle Timeframes berechnen (alle 7 Timeframes)
      const klinesByTimeframe: Record<string, typeof multiTimeframe.timeframes['5m']['klines']> = {
        '1m': multiTimeframe.timeframes['1m'].klines,
        '3m': multiTimeframe.timeframes['3m'].klines,
        '5m': multiTimeframe.timeframes['5m'].klines,
        '15m': multiTimeframe.timeframes['15m'].klines,
        '1h': multiTimeframe.timeframes['1h'].klines,
        '4h': multiTimeframe.timeframes['4h'].klines,
        '1d': multiTimeframe.timeframes['1d'].klines,
      };

      const allLevels = analyzeAllTimeframeLevels(klinesByTimeframe);
      const confluenceZones = findConfluenceZones(allLevels);

      // EMAs für jeden Timeframe berechnen
      const emasByTimeframe: Record<string, ReturnType<typeof calculateMultipleEMAs>> = {};
      Object.entries(klinesByTimeframe).forEach(([tf, klines]) => {
        const closes = klines.map((k) => k.close);
        emasByTimeframe[tf] = calculateMultipleEMAs(closes);
      });

      return NextResponse.json({
        success: true,
        symbol,
        currentPrice: multiTimeframe.currentPrice,
        timeframes: multiTimeframe.timeframes,
        levels: allLevels,
        confluenceZones,
        emas: emasByTimeframe,
      });
    } else {
      // Einzelner Timeframe
      const { klines, analysis } = await fetchSingleTimeframe(binanceSymbol, timeframe, 200);
      const levels = analyzeTechnicalLevelsForTimeframe(klines, timeframe);

      // EMAs berechnen
      const closes = klines.map((k) => k.close);
      const emas = calculateMultipleEMAs(closes);

      return NextResponse.json({
        success: true,
        symbol,
        timeframe,
        currentPrice: analysis.klines.length > 0 ? analysis.klines[analysis.klines.length - 1].close : 0,
        klines,
        analysis,
        levels,
        emas,
      });
    }
  } catch (error) {
    console.error('Coin Analysis API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to analyze coin' },
      { status: 500 }
    );
  }
}
