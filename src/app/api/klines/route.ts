import { NextResponse } from 'next/server';
import { fetchMultiTimeframe, fetchSingleTimeframe, toBinanceSymbol, type MultiTimeframeData, type Interval } from '@/lib/binance-klines';

export const revalidate = 60; // Cache für 1 Minute

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'BTC';
    const interval = searchParams.get('interval'); // Validated below

    const binanceSymbol = toBinanceSymbol(symbol);

    // If interval is provided, return specific klines for chart
    if (interval) {
      // Validate interval (simple check)
      const validIntervals = ['1m', '3m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'] as const;
      if (!validIntervals.includes(interval as Interval)) {
        return NextResponse.json(
          { success: false, error: 'Invalid interval' },
          { status: 400 }
        );
      }

      // Fetch specific timeframe data (interval is now validated as Interval type)
      const data = await fetchSingleTimeframe(binanceSymbol, interval as Interval, 200);

      return NextResponse.json({
        success: true,
        klines: data.klines, // Return flat array as expected by SpotDCAChart
        analysis: data.analysis,
        timestamp: new Date().toISOString(),
      });
    }

    // Default behavior: Return multi-timeframe data for dashboard
    const data: MultiTimeframeData = await fetchMultiTimeframe(binanceSymbol);

    return NextResponse.json({
      success: true,
      ...data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Klines API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch klines data' },
      { status: 500 }
    );
  }
}
