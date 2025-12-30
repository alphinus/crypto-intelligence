'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Percent, Target, Award, BarChart3 } from 'lucide-react';
import type { SignalStats } from '@/lib/signal-storage';

interface SignalStatsProps {
    stats: SignalStats;
}

export function SignalStatsPanel({ stats }: SignalStatsProps) {
    const winRateColor = useMemo(() => {
        if (stats.winRate >= 60) return 'text-green-400';
        if (stats.winRate >= 45) return 'text-yellow-400';
        return 'text-red-400';
    }, [stats.winRate]);

    const pnlColor = stats.totalPnl >= 0 ? 'text-green-400' : 'text-red-400';

    return (
        <div className="space-y-4">
            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Total Signals */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gray-100 dark:bg-gray-800/50 rounded-xl p-4"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="w-4 h-4 text-blue-400" />
                        <span className="text-xs text-gray-500">Gesamt</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-800 dark:text-white">
                        {stats.totalSignals}
                    </div>
                    <div className="text-xs text-gray-500">
                        {stats.activeSignals} aktiv, {stats.closedSignals} geschlossen
                    </div>
                </motion.div>

                {/* Win Rate */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.05 }}
                    className="bg-gray-100 dark:bg-gray-800/50 rounded-xl p-4"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Percent className="w-4 h-4 text-green-400" />
                        <span className="text-xs text-gray-500">Win Rate</span>
                    </div>
                    <div className={`text-2xl font-bold ${winRateColor}`}>
                        {stats.winRate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">
                        {stats.closedSignals > 0
                            ? `${Math.round(stats.winRate * stats.closedSignals / 100)} Gewinne`
                            : 'Keine abgeschlossenen Trades'}
                    </div>
                </motion.div>

                {/* Avg PnL */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gray-100 dark:bg-gray-800/50 rounded-xl p-4"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-purple-400" />
                        <span className="text-xs text-gray-500">Ø PnL</span>
                    </div>
                    <div className={`text-2xl font-bold ${stats.avgPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {stats.avgPnl >= 0 ? '+' : ''}{stats.avgPnl.toFixed(2)}%
                    </div>
                    <div className="text-xs text-gray-500">pro Trade</div>
                </motion.div>

                {/* Total PnL */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15 }}
                    className="bg-gray-100 dark:bg-gray-800/50 rounded-xl p-4"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4 text-yellow-400" />
                        <span className="text-xs text-gray-500">Total PnL</span>
                    </div>
                    <div className={`text-2xl font-bold ${pnlColor}`}>
                        {stats.totalPnl >= 0 ? '+' : ''}{stats.totalPnl.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">kumuliert</div>
                </motion.div>
            </div>

            {/* Best/Worst Trades */}
            {(stats.bestTrade || stats.worstTrade) && (
                <div className="grid grid-cols-2 gap-3">
                    {stats.bestTrade && (
                        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <Award className="w-4 h-4 text-green-400" />
                                <span className="text-xs text-green-400 font-medium">Bester Trade</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-300">
                                    {stats.bestTrade.coin} {stats.bestTrade.type.toUpperCase()}
                                </span>
                                <span className="font-mono font-bold text-green-400">
                                    +{stats.bestTrade.result?.pnlPercent.toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    )}
                    {stats.worstTrade && stats.worstTrade.result?.pnlPercent && stats.worstTrade.result.pnlPercent < 0 && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <Award className="w-4 h-4 text-red-400" />
                                <span className="text-xs text-red-400 font-medium">Schlechtester Trade</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-300">
                                    {stats.worstTrade.coin} {stats.worstTrade.type.toUpperCase()}
                                </span>
                                <span className="font-mono font-bold text-red-400">
                                    {stats.worstTrade.result?.pnlPercent.toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Stats by Timeframe */}
            {Object.keys(stats.byTimeframe).length > 0 && (
                <div className="bg-gray-100 dark:bg-gray-800/50 rounded-xl p-4">
                    <div className="text-xs text-gray-500 mb-3">Performance nach Timeframe</div>
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(stats.byTimeframe).map(([tf, data]) => (
                            <div
                                key={tf}
                                className="bg-white dark:bg-gray-900/50 rounded-lg px-3 py-2 text-center"
                            >
                                <div className="text-xs text-gray-500">{tf}</div>
                                <div className={`font-bold ${data.winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                                    {data.winRate}%
                                </div>
                                <div className="text-[10px] text-gray-500">{data.count} trades</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Stats by Coin */}
            {Object.keys(stats.byCoin).length > 0 && (
                <div className="bg-gray-100 dark:bg-gray-800/50 rounded-xl p-4">
                    <div className="text-xs text-gray-500 mb-3">Performance nach Coin</div>
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(stats.byCoin).map(([coin, data]) => (
                            <div
                                key={coin}
                                className="bg-white dark:bg-gray-900/50 rounded-lg px-3 py-2 text-center"
                            >
                                <div className="text-xs font-medium text-gray-300">{coin}</div>
                                <div className={`font-bold ${data.winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                                    {data.winRate}%
                                </div>
                                <div className="text-[10px] text-gray-500">{data.count} trades</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
