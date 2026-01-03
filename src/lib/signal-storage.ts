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
