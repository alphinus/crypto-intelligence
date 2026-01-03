/**
 * Signal Storage Library
 * 
 * LocalStorage-based signal history with stats calculation
 * Can be extended to sync with cloud storage for premium users
 */

// =====================================================
// TYPES
// =====================================================

/**
 * Signal Source - tracks which strategy generated the signal
 * - INDICATOR: Pure rule-based signals from technical indicators
 * - AI: Legacy AI-only signals (without indicator data)
 * - AI_FUSION: AI analysis with full indicator data input
 * - HYBRID: Signal only when both indicators and AI agree
 */
export type SignalSource = 'INDICATOR' | 'AI' | 'AI_FUSION' | 'HYBRID';

/**
 * Indicator Snapshot - captures all indicator values at signal generation time
 * Used for backtesting and performance analysis
 */
export interface IndicatorSnapshot {
    rsi: number;
    macd: {
        line: number;
        signal: number;
        histogram: number;
    };
    stochRsi: {
        k: number;
        d: number;
    };
    atr: number;
    atrPercent: number;  // ATR as percentage of price
    emaPositions?: {
        price: number;
        ema20: number;
        ema50: number;
        ema200: number;
    };
}

export interface StoredSignal {
    id: string;
    timestamp: string;
    coin: string;
    type: 'long' | 'short' | 'wait';
    entry: number | 'market';
    stopLoss: number;
    takeProfit: number[];
    score: number;
    confidence: 'high' | 'medium' | 'low';
    timeframe: string;
    reasoning: string;
    status: 'active' | 'closed' | 'expired';
    result?: SignalResult;
    // NEW: Source tracking
    source?: SignalSource;
    indicatorSnapshot?: IndicatorSnapshot;
}

export interface SignalResult {
    pnlPercent: number;
    closedAt: string;
    closePrice: number;
    outcome: 'win' | 'loss' | 'breakeven';
}

export interface SignalStats {
    totalSignals: number;
    activeSignals: number;
    closedSignals: number;
    winRate: number;
    avgPnl: number;
    totalPnl: number;
    bestTrade: StoredSignal | null;
    worstTrade: StoredSignal | null;
    byTimeframe: Record<string, { count: number; winRate: number }>;
    byCoin: Record<string, { count: number; winRate: number }>;
    // NEW: Stats by source
    bySource: Record<SignalSource, { count: number; winRate: number; avgPnl: number }>;
}

// =====================================================
// CONSTANTS
// =====================================================

const STORAGE_KEY = 'crypto-intel-signals';
const STORAGE_VERSION = 1;
const MAX_SIGNALS = 500; // Limit to prevent localStorage overflow

// =====================================================
// STORAGE OPERATIONS
// =====================================================

/**
 * Get all stored signals
 */
export function getSignals(): StoredSignal[] {
    if (typeof window === 'undefined') return [];

    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];

        const parsed = JSON.parse(raw);

        // Version check
        if (parsed.version !== STORAGE_VERSION) {
            console.warn('Signal storage version mismatch, clearing...');
            localStorage.removeItem(STORAGE_KEY);
            return [];
        }

        return parsed.signals || [];
    } catch (error) {
        console.error('Failed to load signals:', error);
        return [];
    }
}

/**
 * Save a new signal
 */
export function saveSignal(signal: Omit<StoredSignal, 'id' | 'timestamp' | 'status'>): StoredSignal {
    const signals = getSignals();

    const newSignal: StoredSignal = {
        ...signal,
        id: generateId(),
        timestamp: new Date().toISOString(),
        status: 'active',
    };

    // Add to beginning (newest first)
    signals.unshift(newSignal);

    // Trim if exceeds max
    const trimmedSignals = signals.slice(0, MAX_SIGNALS);

    persistSignals(trimmedSignals);

    return newSignal;
}

/**
 * Update signal status (close/expire)
 */
export function updateSignalStatus(
    id: string,
    status: 'active' | 'closed' | 'expired',
    result?: SignalResult
): StoredSignal | null {
    const signals = getSignals();
    const index = signals.findIndex(s => s.id === id);

    if (index === -1) return null;

    signals[index] = {
        ...signals[index],
        status,
        result: result || signals[index].result,
    };

    persistSignals(signals);

    return signals[index];
}

/**
 * Close a signal with result
 */
export function closeSignal(
    id: string,
    closePrice: number,
    entryPrice: number
): StoredSignal | null {
    const signals = getSignals();
    const signal = signals.find(s => s.id === id);

    if (!signal) return null;

    const entry = signal.entry === 'market' ? entryPrice : signal.entry;
    const pnlPercent = signal.type === 'long'
        ? ((closePrice - entry) / entry) * 100
        : ((entry - closePrice) / entry) * 100;

    const result: SignalResult = {
        pnlPercent: Math.round(pnlPercent * 100) / 100,
        closedAt: new Date().toISOString(),
        closePrice,
        outcome: pnlPercent > 0.5 ? 'win' : pnlPercent < -0.5 ? 'loss' : 'breakeven',
    };

    return updateSignalStatus(id, 'closed', result);
}

/**
 * Delete a signal
 */
export function deleteSignal(id: string): boolean {
    const signals = getSignals();
    const filtered = signals.filter(s => s.id !== id);

    if (filtered.length === signals.length) return false;

    persistSignals(filtered);
    return true;
}

/**
 * Clear all signals
 */
export function clearAllSignals(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
}

// =====================================================
// STATS CALCULATION
// =====================================================

/**
 * Calculate comprehensive signal statistics
 */
export function getSignalStats(): SignalStats {
    const signals = getSignals();

    const closedSignals = signals.filter(s => s.status === 'closed' && s.result);
    const activeSignals = signals.filter(s => s.status === 'active');

    const wins = closedSignals.filter(s => s.result?.outcome === 'win');
    const winRate = closedSignals.length > 0
        ? (wins.length / closedSignals.length) * 100
        : 0;

    const allPnls = closedSignals.map(s => s.result?.pnlPercent || 0);
    const totalPnl = allPnls.reduce((sum, p) => sum + p, 0);
    const avgPnl = closedSignals.length > 0 ? totalPnl / closedSignals.length : 0;

    // Best/Worst trades
    const sortedByPnl = [...closedSignals].sort(
        (a, b) => (b.result?.pnlPercent || 0) - (a.result?.pnlPercent || 0)
    );

    // Stats by timeframe
    const byTimeframe: Record<string, { count: number; wins: number }> = {};
    const byCoin: Record<string, { count: number; wins: number }> = {};
    // NEW: Stats by source
    const bySourceRaw: Record<string, { count: number; wins: number; totalPnl: number }> = {};

    closedSignals.forEach(s => {
        // By timeframe
        if (!byTimeframe[s.timeframe]) {
            byTimeframe[s.timeframe] = { count: 0, wins: 0 };
        }
        byTimeframe[s.timeframe].count++;
        if (s.result?.outcome === 'win') byTimeframe[s.timeframe].wins++;

        // By coin
        if (!byCoin[s.coin]) {
            byCoin[s.coin] = { count: 0, wins: 0 };
        }
        byCoin[s.coin].count++;
        if (s.result?.outcome === 'win') byCoin[s.coin].wins++;

        // NEW: By source
        const source = s.source || 'AI';  // Default to 'AI' for legacy signals
        if (!bySourceRaw[source]) {
            bySourceRaw[source] = { count: 0, wins: 0, totalPnl: 0 };
        }
        bySourceRaw[source].count++;
        if (s.result?.outcome === 'win') bySourceRaw[source].wins++;
        bySourceRaw[source].totalPnl += s.result?.pnlPercent || 0;
    });

    // Initialize all sources with zero stats
    const allSources: SignalSource[] = ['INDICATOR', 'AI', 'AI_FUSION', 'HYBRID'];
    const bySource: Record<SignalSource, { count: number; winRate: number; avgPnl: number }> = {} as Record<SignalSource, { count: number; winRate: number; avgPnl: number }>;

    allSources.forEach(source => {
        const data = bySourceRaw[source];
        if (data && data.count > 0) {
            bySource[source] = {
                count: data.count,
                winRate: Math.round((data.wins / data.count) * 100),
                avgPnl: Math.round((data.totalPnl / data.count) * 100) / 100,
            };
        } else {
            bySource[source] = { count: 0, winRate: 0, avgPnl: 0 };
        }
    });

    return {
        totalSignals: signals.length,
        activeSignals: activeSignals.length,
        closedSignals: closedSignals.length,
        winRate: Math.round(winRate * 10) / 10,
        avgPnl: Math.round(avgPnl * 100) / 100,
        totalPnl: Math.round(totalPnl * 100) / 100,
        bestTrade: sortedByPnl[0] || null,
        worstTrade: sortedByPnl[sortedByPnl.length - 1] || null,
        byTimeframe: Object.fromEntries(
            Object.entries(byTimeframe).map(([tf, data]) => [
                tf,
                { count: data.count, winRate: Math.round((data.wins / data.count) * 100) }
            ])
        ),
        byCoin: Object.fromEntries(
            Object.entries(byCoin).map(([coin, data]) => [
                coin,
                { count: data.count, winRate: Math.round((data.wins / data.count) * 100) }
            ])
        ),
        bySource,
    };
}

/**
 * Get active signals for a specific coin
 */
export function getActiveSignalsForCoin(coin: string): StoredSignal[] {
    return getSignals()
        .filter(s => s.status === 'active' && s.coin.toLowerCase() === coin.toLowerCase());
}

/**
 * Get recent signals (last N days)
 */
export function getRecentSignals(days: number = 7): StoredSignal[] {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return getSignals().filter(s => new Date(s.timestamp) >= cutoff);
}

// =====================================================
// UTILITIES
// =====================================================

function persistSignals(signals: StoredSignal[]): void {
    if (typeof window === 'undefined') return;

    const data = {
        version: STORAGE_VERSION,
        signals,
        lastUpdated: new Date().toISOString(),
    };

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error('Failed to persist signals:', error);
        // If quota exceeded, try removing oldest signals
        if (signals.length > 100) {
            persistSignals(signals.slice(0, 100));
        }
    }
}

function generateId(): string {
    return `sig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Export signals as JSON for backup
 */
export function exportSignals(): string {
    const signals = getSignals();
    return JSON.stringify({
        version: STORAGE_VERSION,
        exportedAt: new Date().toISOString(),
        signals,
    }, null, 2);
}

/**
 * Import signals from JSON backup
 */
export function importSignals(json: string): number {
    try {
        const data = JSON.parse(json);
        const signals = data.signals as StoredSignal[];

        if (!Array.isArray(signals)) {
            throw new Error('Invalid signal data');
        }

        const existing = getSignals();
        const existingIds = new Set(existing.map(s => s.id));

        // Merge, avoiding duplicates
        const newSignals = signals.filter(s => !existingIds.has(s.id));
        const merged = [...newSignals, ...existing].slice(0, MAX_SIGNALS);

        persistSignals(merged);

        return newSignals.length;
    } catch (error) {
        console.error('Failed to import signals:', error);
        return 0;
    }
}

/**
 * Initialize demo signals for testing the Signal History visualization
 * Creates realistic closed trades with wins and losses
 */
export function initDemoSignals(): number {
    // Check if demo signals already exist
    const existing = getSignals();
    if (existing.some(s => s.id.startsWith('demo_'))) {
        console.log('Demo signals already exist');
        return 0;
    }

    const demoSignals: StoredSignal[] = [
        // ========== WINS ==========
        {
            id: 'demo_win_btc_1',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
            coin: 'BTC',
            type: 'long',
            entry: 94500,
            stopLoss: 93000,
            takeProfit: [96000, 97500, 99000],
            score: 82,
            confidence: 'high',
            timeframe: '4H',
            reasoning: 'RSI oversold bounce + bullish MACD crossover + strong support at 94k',
            status: 'closed',
            source: 'AI_FUSION',
            indicatorSnapshot: {
                rsi: 28.5,
                macd: { line: 150, signal: 120, histogram: 30 },
                stochRsi: { k: 15, d: 18 },
                atr: 1200,
                atrPercent: 1.27,
            },
            result: {
                pnlPercent: 4.23,
                closedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                closePrice: 98500,
                outcome: 'win',
            },
        },
        {
            id: 'demo_win_eth_1',
            timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            coin: 'ETH',
            type: 'long',
            entry: 3350,
            stopLoss: 3280,
            takeProfit: [3420, 3500, 3600],
            score: 75,
            confidence: 'high',
            timeframe: '1H',
            reasoning: 'Golden cross on EMA20/50 + volume spike + bullish engulfing',
            status: 'closed',
            source: 'INDICATOR',
            indicatorSnapshot: {
                rsi: 45.2,
                macd: { line: 8.5, signal: 5.2, histogram: 3.3 },
                stochRsi: { k: 55, d: 48 },
                atr: 45,
                atrPercent: 1.34,
            },
            result: {
                pnlPercent: 2.68,
                closedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
                closePrice: 3440,
                outcome: 'win',
            },
        },
        {
            id: 'demo_win_sol_1',
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            coin: 'SOL',
            type: 'short',
            entry: 195,
            stopLoss: 202,
            takeProfit: [185, 180, 175],
            score: 71,
            confidence: 'medium',
            timeframe: '4H',
            reasoning: 'Double top formation + bearish divergence on RSI',
            status: 'closed',
            source: 'HYBRID',
            indicatorSnapshot: {
                rsi: 72.1,
                macd: { line: -0.8, signal: 0.5, histogram: -1.3 },
                stochRsi: { k: 88, d: 85 },
                atr: 4.2,
                atrPercent: 2.15,
            },
            result: {
                pnlPercent: 5.64,
                closedAt: new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000).toISOString(),
                closePrice: 184,
                outcome: 'win',
            },
        },

        // ========== LOSSES ==========
        {
            id: 'demo_loss_btc_1',
            timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            coin: 'BTC',
            type: 'short',
            entry: 96000,
            stopLoss: 97500,
            takeProfit: [94000, 93000, 91000],
            score: 58,
            confidence: 'medium',
            timeframe: '1H',
            reasoning: 'Resistance rejection at 96k + overbought RSI',
            status: 'closed',
            source: 'AI_FUSION',
            indicatorSnapshot: {
                rsi: 71.3,
                macd: { line: 280, signal: 250, histogram: 30 },
                stochRsi: { k: 82, d: 78 },
                atr: 980,
                atrPercent: 1.02,
            },
            result: {
                pnlPercent: -1.56,
                closedAt: new Date(Date.now() - 6.5 * 24 * 60 * 60 * 1000).toISOString(),
                closePrice: 97500,
                outcome: 'loss',
            },
        },
        {
            id: 'demo_loss_eth_1',
            timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
            coin: 'ETH',
            type: 'long',
            entry: 3480,
            stopLoss: 3400,
            takeProfit: [3580, 3650, 3750],
            score: 52,
            confidence: 'low',
            timeframe: '15M',
            reasoning: 'Possible breakout attempt above consolidation',
            status: 'closed',
            source: 'AI',
            indicatorSnapshot: {
                rsi: 55.8,
                macd: { line: 2.1, signal: 3.5, histogram: -1.4 },
                stochRsi: { k: 62, d: 65 },
                atr: 38,
                atrPercent: 1.09,
            },
            result: {
                pnlPercent: -2.30,
                closedAt: new Date(Date.now() - 3.8 * 24 * 60 * 60 * 1000).toISOString(),
                closePrice: 3400,
                outcome: 'loss',
            },
        },
        {
            id: 'demo_loss_sol_1',
            timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
            coin: 'SOL',
            type: 'long',
            entry: 188,
            stopLoss: 182,
            takeProfit: [195, 200, 210],
            score: 61,
            confidence: 'medium',
            timeframe: '4H',
            reasoning: 'Support bounce expected at 188 level',
            status: 'closed',
            source: 'INDICATOR',
            indicatorSnapshot: {
                rsi: 38.2,
                macd: { line: -1.2, signal: -0.5, histogram: -0.7 },
                stochRsi: { k: 25, d: 28 },
                atr: 5.1,
                atrPercent: 2.71,
            },
            result: {
                pnlPercent: -3.19,
                closedAt: new Date(Date.now() - 5.5 * 24 * 60 * 60 * 1000).toISOString(),
                closePrice: 182,
                outcome: 'loss',
            },
        },

        // ========== ACTIVE SIGNALS ==========
        {
            id: 'demo_active_btc_1',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
            coin: 'BTC',
            type: 'long',
            entry: 97200,
            stopLoss: 95500,
            takeProfit: [99000, 100500, 102000],
            score: 78,
            confidence: 'high',
            timeframe: '4H',
            reasoning: 'Bullish continuation pattern + strong momentum',
            status: 'active',
            source: 'AI_FUSION',
            indicatorSnapshot: {
                rsi: 52.4,
                macd: { line: 320, signal: 280, histogram: 40 },
                stochRsi: { k: 58, d: 52 },
                atr: 1100,
                atrPercent: 1.13,
            },
        },
        {
            id: 'demo_active_eth_1',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
            coin: 'ETH',
            type: 'short',
            entry: 3520,
            stopLoss: 3600,
            takeProfit: [3450, 3380, 3300],
            score: 68,
            confidence: 'medium',
            timeframe: '1H',
            reasoning: 'Rejection at resistance + bearish divergence forming',
            status: 'active',
            source: 'HYBRID',
            indicatorSnapshot: {
                rsi: 68.1,
                macd: { line: 5.2, signal: 7.8, histogram: -2.6 },
                stochRsi: { k: 75, d: 78 },
                atr: 42,
                atrPercent: 1.19,
            },
        },
        {
            id: 'demo_active_xrp_1',
            timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
            coin: 'XRP',
            type: 'long',
            entry: 2.18,
            stopLoss: 2.08,
            takeProfit: [2.30, 2.45, 2.60],
            score: 74,
            confidence: 'high',
            timeframe: '4H',
            reasoning: 'Breakout above consolidation range + increasing volume',
            status: 'active',
            source: 'AI_FUSION',
            indicatorSnapshot: {
                rsi: 58.3,
                macd: { line: 0.012, signal: 0.008, histogram: 0.004 },
                stochRsi: { k: 62, d: 55 },
                atr: 0.05,
                atrPercent: 2.29,
            },
        },

        // ========== ADDITIONAL WIN ==========
        {
            id: 'demo_win_avax_1',
            timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
            coin: 'AVAX',
            type: 'long',
            entry: 38.50,
            stopLoss: 36.80,
            takeProfit: [41.00, 43.50, 46.00],
            score: 79,
            confidence: 'high',
            timeframe: '4H',
            reasoning: 'Strong support bounce + bullish momentum divergence',
            status: 'closed',
            source: 'HYBRID',
            indicatorSnapshot: {
                rsi: 32.4,
                macd: { line: -0.45, signal: -0.62, histogram: 0.17 },
                stochRsi: { k: 18, d: 22 },
                atr: 1.85,
                atrPercent: 4.81,
            },
            result: {
                pnlPercent: 6.49,
                closedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                closePrice: 41.00,
                outcome: 'win',
            },
        },

        // ========== ADDITIONAL LOSS ==========
        {
            id: 'demo_loss_link_1',
            timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
            coin: 'LINK',
            type: 'short',
            entry: 23.80,
            stopLoss: 24.90,
            takeProfit: [22.50, 21.50, 20.00],
            score: 55,
            confidence: 'low',
            timeframe: '1H',
            reasoning: 'Weak resistance rejection attempt',
            status: 'closed',
            source: 'AI',
            indicatorSnapshot: {
                rsi: 64.2,
                macd: { line: 0.18, signal: 0.12, histogram: 0.06 },
                stochRsi: { k: 71, d: 68 },
                atr: 0.72,
                atrPercent: 3.02,
            },
            result: {
                pnlPercent: -4.62,
                closedAt: new Date(Date.now() - 7.5 * 24 * 60 * 60 * 1000).toISOString(),
                closePrice: 24.90,
                outcome: 'loss',
            },
        },
    ];

    // Merge with existing signals
    const merged = [...demoSignals, ...existing].slice(0, MAX_SIGNALS);
    persistSignals(merged);

    console.log(`Initialized ${demoSignals.length} demo signals`);
    return demoSignals.length;
}
