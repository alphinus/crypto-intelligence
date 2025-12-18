import { NextResponse } from 'next/server';
import { fetchBitcoinOnChainData } from '@/lib/mempool';

export const revalidate = 60; // Cache for 1 minute

export async function GET() {
  try {
    const data = await fetchBitcoinOnChainData();

    return NextResponse.json({
      success: true,
      ...data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Bitcoin API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch Bitcoin data' },
      { status: 500 }
    );
  }
}
