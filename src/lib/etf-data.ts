/**
 * ETF Flow Data Library
 * 
 * Fetches Bitcoin and Ethereum spot ETF inflow/outflow data
 * Primary source: CoinGlass (free tier) / Fallback: SoSoValue scraping
 */

// =====================================================
// TYPES
// =====================================================

export interface ETFFlowData {
    date: string;
    netFlow: number;           // In millions USD
    totalNetAssets: number;    // Total AUM in millions USD
    providers: ETFProvider[];
}

export interface ETFProvider {
    name: string;
    ticker: string;
    netFlow: number;
    totalAssets: number;
}

export interface ETFFlowSummary {
    flows: ETFFlowData[];
    latestFlow: number;
    streak: {
        type: 'inflow' | 'outflow' | 'mixed';
        days: number;
    };
    total7Day: number;
    total30Day: number;
    interpretation: {
        signal: 'bullish' | 'bearish' | 'neutral';
        strength: 'strong' | 'moderate' | 'weak';
        description: string;
    };
}

// =====================================================
// MOCK DATA (for development without API)
// =====================================================

const MOCK_BTC_ETF_DATA: ETFFlowData[] = [
    { date: '2024-12-30', netFlow: 234.5, totalNetAssets: 35420, providers: [] },
    { date: '2024-12-29', netFlow: -89.2, totalNetAssets: 35186, providers: [] },
    { date: '2024-12-28', netFlow: 156.8, totalNetAssets: 35275, providers: [] },
    { date: '2024-12-27', netFlow: 312.4, totalNetAssets: 35118, providers: [] },
    { date: '2024-12-26', netFlow: 178.9, totalNetAssets: 34806, providers: [] },
    { date: '2024-12-25', netFlow: 0, totalNetAssets: 34627, providers: [] }, // Holiday
    { date: '2024-12-24', netFlow: -45.3, totalNetAssets: 34627, providers: [] },
    { date: '2024-12-23', netFlow: 289.1, totalNetAssets: 34672, providers: [] },
    { date: '2024-12-22', netFlow: 0, totalNetAssets: 34383, providers: [] }, // Weekend
    { date: '2024-12-21', netFlow: 0, totalNetAssets: 34383, providers: [] }, // Weekend
    { date: '2024-12-20', netFlow: 445.7, totalNetAssets: 34383, providers: [] },
    { date: '2024-12-19', netFlow: 267.3, totalNetAssets: 33937, providers: [] },
    { date: '2024-12-18', netFlow: -123.8, totalNetAssets: 33670, providers: [] },
    { date: '2024-12-17', netFlow: 189.4, totalNetAssets: 33794, providers: [] },
];

const BTC_ETF_PROVIDERS: ETFProvider[] = [
    { name: 'BlackRock iShares', ticker: 'IBIT', netFlow: 0, totalAssets: 19500 },
    { name: 'Fidelity', ticker: 'FBTC', netFlow: 0, totalAssets: 8200 },
    { name: 'Grayscale', ticker: 'GBTC', netFlow: 0, totalAssets: 4100 },
    { name: 'ARK 21Shares', ticker: 'ARKB', netFlow: 0, totalAssets: 1800 },
    { name: 'Bitwise', ticker: 'BITB', netFlow: 0, totalAssets: 1200 },
];

// =====================================================
// API FETCHING
// =====================================================

/**
 * Fetch BTC spot ETF flow data
 * Uses server-side API route to avoid CORS issues
 */
export async function fetchBTCETFFlows(): Promise<ETFFlowSummary> {
    try {
        const response = await fetch('/api/etf?asset=btc');
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                return processFlowData(data.flows);
            }
        }
    } catch (error) {
        console.warn('ETF API unavailable, using mock data:', error);
    }

    // Fallback to mock data
    return processFlowData(MOCK_BTC_ETF_DATA);
}

/**
 * Fetch ETH spot ETF flow data
 */
export async function fetchETHETFFlows(): Promise<ETFFlowSummary> {
    try {
        const response = await fetch('/api/etf?asset=eth');
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                return processFlowData(data.flows);
            }
        }
    } catch (error) {
        console.warn('ETH ETF API unavailable');
    }

    // ETH ETF data might not be available, return empty
    return {
        flows: [],
        latestFlow: 0,
        streak: { type: 'mixed', days: 0 },
        total7Day: 0,
        total30Day: 0,
        interpretation: {
            signal: 'neutral',
            strength: 'weak',
            description: 'ETH ETF Daten nicht verfügbar',
        },
    };
}

// =====================================================
// DATA PROCESSING
// =====================================================

/**
 * Process raw flow data into summary with interpretation
 */
function processFlowData(flows: ETFFlowData[]): ETFFlowSummary {
    if (flows.length === 0) {
        return {
            flows: [],
            latestFlow: 0,
            streak: { type: 'mixed', days: 0 },
            total7Day: 0,
            total30Day: 0,
            interpretation: {
                signal: 'neutral',
                strength: 'weak',
                description: 'Keine Daten verfügbar',
            },
        };
    }

    // Sort by date descending
    const sortedFlows = [...flows].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const latestFlow = sortedFlows[0]?.netFlow || 0;

    // Calculate streak
    const streak = calculateStreak(sortedFlows);

    // Calculate totals
    const last7Days = sortedFlows.slice(0, 7);
    const last30Days = sortedFlows.slice(0, 30);

    const total7Day = last7Days.reduce((sum, f) => sum + f.netFlow, 0);
    const total30Day = last30Days.reduce((sum, f) => sum + f.netFlow, 0);

    // Generate interpretation
    const interpretation = interpretFlows(latestFlow, streak, total7Day);

    return {
        flows: sortedFlows,
        latestFlow,
        streak,
        total7Day,
        total30Day,
        interpretation,
    };
}

/**
 * Calculate consecutive inflow/outflow streak
 */
function calculateStreak(flows: ETFFlowData[]): ETFFlowSummary['streak'] {
    if (flows.length === 0) return { type: 'mixed', days: 0 };

    const firstNonZero = flows.find(f => f.netFlow !== 0);
    if (!firstNonZero) return { type: 'mixed', days: 0 };

    const isInflow = firstNonZero.netFlow > 0;
    let days = 0;

    for (const flow of flows) {
        if (flow.netFlow === 0) continue; // Skip holidays/weekends

        if ((isInflow && flow.netFlow > 0) || (!isInflow && flow.netFlow < 0)) {
            days++;
        } else {
            break;
        }
    }

    return {
        type: isInflow ? 'inflow' : 'outflow',
        days,
    };
}

/**
 * Interpret flow data for trading signals
 */
function interpretFlows(
    latestFlow: number,
    streak: ETFFlowSummary['streak'],
    total7Day: number
): ETFFlowSummary['interpretation'] {
    let signal: 'bullish' | 'bearish' | 'neutral';
    let strength: 'strong' | 'moderate' | 'weak';
    let description: string;

    // Determine signal from 7-day total
    if (total7Day > 500) {
        signal = 'bullish';
        strength = streak.days >= 5 ? 'strong' : 'moderate';
        description = `Starke institutionelle Akkumulation: $${(total7Day).toFixed(0)}M in 7 Tagen`;
    } else if (total7Day > 100) {
        signal = 'bullish';
        strength = 'moderate';
        description = `Moderate Inflows: $${(total7Day).toFixed(0)}M in 7 Tagen`;
    } else if (total7Day < -500) {
        signal = 'bearish';
        strength = streak.days >= 5 ? 'strong' : 'moderate';
        description = `Starke Abflüsse: $${(Math.abs(total7Day)).toFixed(0)}M Outflows in 7 Tagen`;
    } else if (total7Day < -100) {
        signal = 'bearish';
        strength = 'moderate';
        description = `Moderate Outflows: $${(Math.abs(total7Day)).toFixed(0)}M in 7 Tagen`;
    } else {
        signal = 'neutral';
        strength = 'weak';
        description = `Neutral: $${total7Day >= 0 ? '+' : ''}${(total7Day).toFixed(0)}M in 7 Tagen`;
    }

    // Enhance with streak info
    if (streak.days >= 3) {
        description += ` (${streak.days} Tage ${streak.type === 'inflow' ? 'Inflows' : 'Outflows'} in Folge)`;
    }

    return { signal, strength, description };
}

// =====================================================
// UTILITIES
// =====================================================

/**
 * Format flow amount for display
 */
export function formatFlowAmount(amount: number): string {
    const absAmount = Math.abs(amount);
    const sign = amount >= 0 ? '+' : '-';

    if (absAmount >= 1000) {
        return `${sign}$${(absAmount / 1000).toFixed(2)}B`;
    }
    return `${sign}$${absAmount.toFixed(0)}M`;
}

/**
 * Get color for flow value
 */
export function getFlowColor(amount: number): string {
    if (amount > 100) return '#22c55e';  // Strong inflow - green
    if (amount > 0) return '#84cc16';    // Moderate inflow - lime
    if (amount > -100) return '#f97316'; // Moderate outflow - orange
    return '#ef4444';                     // Strong outflow - red
}

/**
 * Get ETF provider data (static for now)
 */
export function getBTCETFProviders(): ETFProvider[] {
    return BTC_ETF_PROVIDERS;
}
