import { NextResponse } from 'next/server';
import { fetchFuturesOverview } from '@/lib/binance-futures';

export const revalidate = 300; // Cache for 5 minutes (reduces Vercel invocations)

export async function GET() {
  try {
    const data = await fetchFuturesOverview();

    return NextResponse.json({
      success: true,
      ...data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Futures API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch futures data' },
      { status: 500 }
    );
  }
}
