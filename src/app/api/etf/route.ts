import { NextResponse } from 'next/server';

/**
 * ETF Flow Data API Route
 * 
 * Fetches Bitcoin/Ethereum spot ETF inflow/outflow data
 * Currently uses mock data - can be extended to use CoinGlass/SoSoValue APIs
 */

interface ETFFlowData {
    date: string;
    netFlow: number;
    totalNetAssets: number;
    providers: { name: string; ticker: string; netFlow: number; totalAssets: number }[];
}

// Cache for ETF data (5 minute TTL)
const cache: {
    btc: { data: ETFFlowData[]; timestamp: number } | null;
    eth: { data: ETFFlowData[]; timestamp: number } | null;
} = {
    btc: null,
    eth: null,
};

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Mock data generator (simulates real API response)
function generateMockBTCFlows() {
    const flows = [];
    const today = new Date();

    for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        // Skip weekends
        const dayOfWeek = date.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            flows.push({
                date: date.toISOString().split('T')[0],
                netFlow: 0,
                totalNetAssets: 35000 + Math.random() * 2000,
                providers: [],
            });
            continue;
        }

        // Generate realistic flow data
        // Bias towards positive (BTC ETFs have been net positive historically)
        const baseFlow = (Math.random() - 0.35) * 500; // Slight positive bias
        const netFlow = Math.round(baseFlow * 10) / 10;

        flows.push({
            date: date.toISOString().split('T')[0],
            netFlow,
            totalNetAssets: 35000 + Math.random() * 2000,
            providers: [
                { name: 'BlackRock iShares', ticker: 'IBIT', netFlow: netFlow * 0.55, totalAssets: 19500 },
                { name: 'Fidelity', ticker: 'FBTC', netFlow: netFlow * 0.23, totalAssets: 8200 },
                { name: 'Grayscale', ticker: 'GBTC', netFlow: netFlow * 0.12, totalAssets: 4100 },
                { name: 'Others', ticker: 'MISC', netFlow: netFlow * 0.10, totalAssets: 3200 },
            ],
        });
    }

    return flows;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const asset = searchParams.get('asset')?.toLowerCase() || 'btc';

    try {
        // Check cache
        const cached = cache[asset as 'btc' | 'eth'];
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            return NextResponse.json({
                success: true,
                flows: cached.data,
                cached: true,
            });
        }

        // In production, this would call CoinGlass or SoSoValue API
        // For now, use mock data
        let flows: ETFFlowData[];

        if (asset === 'btc') {
            // TODO: Replace with actual API call
            // const response = await fetch('https://api.coinglass.com/api/etf/btc/flow', {
            //     headers: { 'Authorization': `Bearer ${process.env.COINGLASS_API_KEY}` }
            // });
            // flows = await response.json();

            flows = generateMockBTCFlows();
        } else if (asset === 'eth') {
            // ETH ETF data (currently limited availability)
            flows = [];
        } else {
            return NextResponse.json(
                { success: false, error: 'Invalid asset. Use btc or eth.' },
                { status: 400 }
            );
        }

        // Update cache
        cache[asset as 'btc' | 'eth'] = {
            data: flows,
            timestamp: Date.now(),
        };

        return NextResponse.json({
            success: true,
            flows,
            cached: false,
        });

    } catch (error) {
        console.error('ETF API Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch ETF data' },
            { status: 500 }
        );
    }
}
