import { NextResponse } from 'next/server';
import { fetchMultiTimeframe, toBinanceSymbol, type MultiTimeframeData } from '@/lib/binance-klines';

export const revalidate = 60; // Cache für 1 Minute

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'BTC';

    const binanceSymbol = toBinanceSymbol(symbol);
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
