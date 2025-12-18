import { NextResponse } from 'next/server';
import { fetchDefiOverview } from '@/lib/defillama';

export const revalidate = 300; // Cache für 5 Minuten

export async function GET() {
  try {
    const overview = await fetchDefiOverview();

    return NextResponse.json({
      success: true,
      ...overview,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('DeFi API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch DeFi data' },
      { status: 500 }
    );
  }
}
