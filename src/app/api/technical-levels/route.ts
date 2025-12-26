import { NextResponse } from 'next/server';
import { fetchKlines, toBinanceSymbol, type Interval } from '@/lib/binance-klines';
import { analyzeTechnicalLevelsForTimeframe } from '@/lib/technical-levels';

export const revalidate = 60; // Cache for 1 minute

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const symbol = searchParams.get('symbol') || 'BTC';
        const interval = (searchParams.get('interval') as Interval) || '1d';

        const binanceSymbol = toBinanceSymbol(symbol);

        // Validate interval
        const validIntervals = ['1m', '3m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'];
        if (!validIntervals.includes(interval)) {
            return NextResponse.json(
                { success: false, error: 'Invalid interval' },
                { status: 400 }
            );
        }

        // Fetch klines needed for analysis
        // We need enough history for moving averages (300) and pivots
        const klines = await fetchKlines(binanceSymbol, interval, 300);

        if (klines.length === 0) {
            return NextResponse.json(
                { success: false, error: 'No data available' },
                { status: 404 }
            );
        }

        // Calculate levels
        const levels = analyzeTechnicalLevelsForTimeframe(klines, interval);

        return NextResponse.json({
            success: true,
            levels,
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('Technical Levels API error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to calculate levels' },
            { status: 500 }
        );
    }
}
