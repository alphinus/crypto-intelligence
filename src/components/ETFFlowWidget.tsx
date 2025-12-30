'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Building2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { fetchBTCETFFlows, formatFlowAmount, getFlowColor, type ETFFlowSummary } from '@/lib/etf-data';

interface ETFFlowWidgetProps {
    compact?: boolean;
}

export function ETFFlowWidget({ compact = false }: ETFFlowWidgetProps) {
    const [data, setData] = useState<ETFFlowSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const result = await fetchBTCETFFlows();
                setData(result);
            } catch (error) {
                console.error('Failed to fetch ETF data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        // Refresh every 5 minutes
        const interval = setInterval(fetchData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const signalColors = useMemo(() => {
        if (!data) return { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: TrendingUp };

        switch (data.interpretation.signal) {
            case 'bullish':
                return {
                    bg: 'bg-green-500/20',
                    text: 'text-green-400',
                    icon: TrendingUp
                };
            case 'bearish':
                return {
                    bg: 'bg-red-500/20',
                    text: 'text-red-400',
                    icon: TrendingDown
                };
            default:
                return {
                    bg: 'bg-gray-500/20',
                    text: 'text-gray-400',
                    icon: TrendingUp
                };
        }
    }, [data]);

    if (loading) {
        return (
            <div className="bg-gray-100 dark:bg-gray-800/50 rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-3"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
            </div>
        );
    }

    if (!data || data.flows.length === 0) {
        return (
            <div className="bg-gray-100 dark:bg-gray-800/50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-500">
                    <Building2 className="w-4 h-4" />
                    <span className="text-sm">ETF Daten nicht verfügbar</span>
                </div>
            </div>
        );
    }

    const SignalIcon = signalColors.icon;
    const last7Flows = data.flows.slice(0, 7).filter(f => f.netFlow !== 0);
    const maxFlow = Math.max(...last7Flows.map(f => Math.abs(f.netFlow)), 1);

    if (compact) {
        return (
            <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${signalColors.bg}`}
                title={data.interpretation.description}
            >
                <Building2 className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs text-gray-500">ETF</span>
                <SignalIcon className={`w-3.5 h-3.5 ${signalColors.text}`} />
                <span className={`font-mono text-xs font-bold ${signalColors.text}`}>
                    {formatFlowAmount(data.latestFlow)}
                </span>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-100 dark:bg-gray-800/50 rounded-xl overflow-hidden"
        >
            {/* Header */}
            <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-200/50 dark:hover:bg-gray-700/30 transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${signalColors.bg}`}>
                        <Building2 className={`w-5 h-5 ${signalColors.text}`} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">BTC Spot ETF</span>
                            {data.streak.days >= 3 && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${data.streak.type === 'inflow'
                                        ? 'bg-green-500/20 text-green-400'
                                        : 'bg-red-500/20 text-red-400'
                                    }`}>
                                    {data.streak.days}d {data.streak.type === 'inflow' ? '↑' : '↓'}
                                </span>
                            )}
                        </div>
                        <div className="text-xs text-gray-500">Institutionelle Flows</div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <div className={`font-mono text-lg font-bold ${signalColors.text}`}>
                            {formatFlowAmount(data.latestFlow)}
                        </div>
                        <div className="text-xs text-gray-500">Heute</div>
                    </div>
                    {expanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                </div>
            </div>

            {/* Expanded Content */}
            {expanded && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-4 pb-4"
                >
                    {/* 7-Day Bar Chart */}
                    <div className="mb-4">
                        <div className="text-xs text-gray-500 mb-2">Letzte 7 Tage</div>
                        <div className="flex items-end gap-1 h-16">
                            {last7Flows.reverse().map((flow, idx) => {
                                const height = (Math.abs(flow.netFlow) / maxFlow) * 100;
                                const color = getFlowColor(flow.netFlow);
                                return (
                                    <div
                                        key={flow.date}
                                        className="flex-1 flex flex-col items-center"
                                    >
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${Math.max(height, 5)}%` }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="w-full rounded-t"
                                            style={{ backgroundColor: color }}
                                            title={`${flow.date}: ${formatFlowAmount(flow.netFlow)}`}
                                        />
                                        <span className="text-[8px] text-gray-500 mt-1">
                                            {new Date(flow.date).getDate()}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-white dark:bg-gray-900/50 rounded-lg p-3">
                            <div className="text-xs text-gray-500 mb-1">7-Tage Total</div>
                            <div className={`font-mono font-bold ${data.total7Day >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {formatFlowAmount(data.total7Day)}
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-900/50 rounded-lg p-3">
                            <div className="text-xs text-gray-500 mb-1">30-Tage Total</div>
                            <div className={`font-mono font-bold ${data.total30Day >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {formatFlowAmount(data.total30Day)}
                            </div>
                        </div>
                    </div>

                    {/* Interpretation */}
                    <div className={`rounded-lg p-3 ${signalColors.bg}`}>
                        <div className="flex items-center gap-2 mb-1">
                            <SignalIcon className={`w-4 h-4 ${signalColors.text}`} />
                            <span className={`text-sm font-bold ${signalColors.text}`}>
                                {data.interpretation.signal === 'bullish' ? 'Bullish' :
                                    data.interpretation.signal === 'bearish' ? 'Bearish' : 'Neutral'}
                                {data.interpretation.strength === 'strong' && ' 💪'}
                            </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                            {data.interpretation.description}
                        </p>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}

/**
 * Compact version for header
 */
export function ETFFlowBadge() {
    return <ETFFlowWidget compact />;
}
