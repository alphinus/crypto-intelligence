'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Clock, Target, XCircle, CheckCircle } from 'lucide-react';
import type { StoredSignal } from '@/lib/signal-storage';

interface SignalCardProps {
    signal: StoredSignal;
    onClose?: (id: string) => void;
    compact?: boolean;
}

export function SignalCard({ signal, onClose, compact = false }: SignalCardProps) {
    const isLong = signal.type === 'long';
    const isActive = signal.status === 'active';
    const hasResult = signal.result !== undefined;

    const typeColor = isLong ? 'text-green-400' : signal.type === 'short' ? 'text-red-400' : 'text-gray-400';
    const typeBg = isLong ? 'bg-green-500/20' : signal.type === 'short' ? 'bg-red-500/20' : 'bg-gray-500/20';

    const resultColor = useMemo(() => {
        if (!hasResult) return '';
        if (signal.result!.outcome === 'win') return 'border-green-500/50';
        if (signal.result!.outcome === 'loss') return 'border-red-500/50';
        return 'border-gray-500/50';
    }, [hasResult, signal.result]);

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) return `${diffDays}d ago`;
        if (diffHours > 0) return `${diffHours}h ago`;
        return 'Just now';
    };

    if (compact) {
        return (
            <div className={`flex items-center gap-2 p-2 rounded-lg ${typeBg} ${resultColor} border border-transparent`}>
                <span className={`font-bold text-xs ${typeColor}`}>
                    {signal.type.toUpperCase()}
                </span>
                <span className="text-xs text-gray-300">{signal.coin}</span>
                <span className="text-xs text-gray-500">{signal.timeframe}</span>
                {hasResult && (
                    <span className={`text-xs font-mono font-bold ${signal.result!.pnlPercent >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                        {signal.result!.pnlPercent >= 0 ? '+' : ''}{signal.result!.pnlPercent.toFixed(1)}%
                    </span>
                )}
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white dark:bg-gray-800/50 rounded-xl p-4 border-2 ${resultColor || 'border-transparent'}`}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${typeBg}`}>
                        {isLong ? (
                            <TrendingUp className={`w-4 h-4 ${typeColor}`} />
                        ) : signal.type === 'short' ? (
                            <TrendingDown className={`w-4 h-4 ${typeColor}`} />
                        ) : (
                            <Clock className="w-4 h-4 text-gray-400" />
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-800 dark:text-white">{signal.coin}</span>
                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${typeBg} ${typeColor}`}>
                                {signal.type.toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-500">{signal.timeframe}</span>
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(signal.timestamp)}
                        </div>
                    </div>
                </div>

                {/* Status Badge */}
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${isActive
                        ? 'bg-blue-500/20 text-blue-400'
                        : hasResult
                            ? signal.result!.outcome === 'win'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                            : 'bg-gray-500/20 text-gray-400'
                    }`}>
                    {isActive ? (
                        <>
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                            Aktiv
                        </>
                    ) : hasResult ? (
                        <>
                            {signal.result!.outcome === 'win' ? (
                                <CheckCircle className="w-3 h-3" />
                            ) : (
                                <XCircle className="w-3 h-3" />
                            )}
                            {signal.result!.outcome === 'win' ? 'Gewinn' : 'Verlust'}
                        </>
                    ) : (
                        'Abgelaufen'
                    )}
                </div>
            </div>

            {/* Trade Details */}
            <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-gray-100 dark:bg-gray-900/50 rounded-lg p-2 text-center">
                    <div className="text-[10px] text-gray-500 uppercase">Entry</div>
                    <div className="font-mono text-sm text-gray-700 dark:text-gray-200">
                        {signal.entry === 'market' ? 'Market' : `$${signal.entry.toLocaleString()}`}
                    </div>
                </div>
                <div className="bg-gray-100 dark:bg-gray-900/50 rounded-lg p-2 text-center">
                    <div className="text-[10px] text-gray-500 uppercase">Stop Loss</div>
                    <div className="font-mono text-sm text-red-400">
                        ${signal.stopLoss.toLocaleString()}
                    </div>
                </div>
                <div className="bg-gray-100 dark:bg-gray-900/50 rounded-lg p-2 text-center">
                    <div className="text-[10px] text-gray-500 uppercase">Target</div>
                    <div className="font-mono text-sm text-green-400">
                        ${signal.takeProfit[0]?.toLocaleString() || '—'}
                    </div>
                </div>
            </div>

            {/* Score */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">Score</span>
                </div>
                <div className={`font-bold ${signal.score >= 70 ? 'text-green-400' :
                        signal.score >= 50 ? 'text-yellow-400' :
                            'text-red-400'
                    }`}>
                    {signal.score}/100
                </div>
            </div>

            {/* Result (if closed) */}
            {hasResult && (
                <div className={`rounded-lg p-3 ${signal.result!.pnlPercent >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'
                    }`}>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Ergebnis</span>
                        <span className={`font-mono text-lg font-bold ${signal.result!.pnlPercent >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                            {signal.result!.pnlPercent >= 0 ? '+' : ''}{signal.result!.pnlPercent.toFixed(2)}%
                        </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        Geschlossen @ ${signal.result!.closePrice.toLocaleString()}
                    </div>
                </div>
            )}

            {/* Close button for active signals */}
            {isActive && onClose && (
                <button
                    onClick={() => onClose(signal.id)}
                    className="w-full mt-3 py-2 text-sm text-gray-500 hover:text-gray-300 hover:bg-gray-700/50 rounded-lg transition-colors"
                >
                    Signal schließen
                </button>
            )}
        </motion.div>
    );
}
