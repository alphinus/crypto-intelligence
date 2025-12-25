import { NextResponse } from 'next/server';
import { getProviderStatus, getActiveProvider } from '@/lib/market-data-provider';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const status = getProviderStatus();
    const active = getActiveProvider();

    return NextResponse.json({
      success: true,
      activeProvider: active,
      providers: status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Provider status error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get provider status' },
      { status: 500 }
    );
  }
}
