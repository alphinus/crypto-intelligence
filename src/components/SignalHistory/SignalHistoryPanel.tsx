'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Filter, Download, Trash2, ChevronDown, RefreshCw } from 'lucide-react';
import { getSignals, getSignalStats, deleteSignal, clearAllSignals, exportSignals, type StoredSignal, type SignalStats, type SignalSource } from '@/lib/signal-storage';
import { SignalCard } from './SignalCard';
import { SignalStatsPanel } from './SignalStats';

type FilterType = 'all' | 'active' | 'closed' | 'win' | 'loss';
type SourceFilter = 'all' | SignalSource;

export function SignalHistoryPanel() {
    const [signals, setSignals] = useState<StoredSignal[]>([]);
    const [stats, setStats] = useState<SignalStats | null>(null);
    const [filter, setFilter] = useState<FilterType>('all');
    const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
    const [showStats, setShowStats] = useState(true);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(() => {
        setLoading(true);
        const allSignals = getSignals();
        const signalStats = getSignalStats();
        setSignals(allSignals);
        setStats(signalStats);
        setLoading(false);
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const filteredSignals = signals.filter(signal => {
        // Status filter
        let passesStatusFilter = true;
        switch (filter) {
            case 'active':
                passesStatusFilter = signal.status === 'active';
                break;
            case 'closed':
                passesStatusFilter = signal.status === 'closed';
                break;
            case 'win':
                passesStatusFilter = signal.result?.outcome === 'win';
                break;
            case 'loss':
                passesStatusFilter = signal.result?.outcome === 'loss';
                break;
        }

        // Source filter
        let passesSourceFilter = true;
        if (sourceFilter !== 'all') {
            passesSourceFilter = (signal.source || 'AI') === sourceFilter;
        }

        return passesStatusFilter && passesSourceFilter;
    });

    const handleDelete = (id: string) => {
        if (window.confirm('Signal wirklich löschen?')) {
            deleteSignal(id);
            loadData();
        }
    };

    const handleClearAll = () => {
        if (window.confirm('ALLE Signale löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
            clearAllSignals();
            loadData();
        }
    };

    const handleExport = () => {
        const json = exportSignals();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `crypto-intel-signals-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Get source icon and label
    const getSourceDisplay = (source: SourceFilter) => {
        switch (source) {
            case 'INDICATOR': return { icon: '🔢', label: 'Indikatoren' };
            case 'AI': return { icon: '🤖', label: 'AI (Legacy)' };
            case 'AI_FUSION': return { icon: '🧠', label: 'AI Fusion' };
            case 'HYBRID': return { icon: '⚡', label: 'Hybrid' };
            default: return { icon: '📊', label: 'Alle Quellen' };
        }
    };

    // Count signals by source
    const sourceCounts: Record<string, number> = {
        all: signals.length,
        INDICATOR: signals.filter(s => s.source === 'INDICATOR').length,
        AI: signals.filter(s => !s.source || s.source === 'AI').length,
        AI_FUSION: signals.filter(s => s.source === 'AI_FUSION').length,
        HYBRID: signals.filter(s => s.source === 'HYBRID').length,
    };

    if (loading) {
        return (
            <div className="bg-gray-100 dark:bg-gray-800/50 rounded-xl p-6 animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4"></div>
                <div className="space-y-3">
                    <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                        <History className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">Signal Historie</h3>
                        <p className="text-xs text-gray-500">{signals.length} Signale gespeichert</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={loadData}
                        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        title="Aktualisieren"
                    >
                        <RefreshCw className="w-4 h-4 text-gray-500" />
                    </button>
                    <button
                        onClick={handleExport}
                        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        title="Exportieren"
                    >
                        <Download className="w-4 h-4 text-gray-500" />
                    </button>
                    {signals.length > 0 && (
                        <button
                            onClick={handleClearAll}
                            className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors"
                            title="Alle löschen"
                        >
                            <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                    )}
                </div>
            </div>

            {/* Stats Toggle */}
            {stats && stats.totalSignals > 0 && (
                <button
                    onClick={() => setShowStats(!showStats)}
                    className="w-full flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800/50 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors"
                >
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Statistiken
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showStats ? 'rotate-180' : ''}`} />
                </button>
            )}

            {/* Stats Panel */}
            <AnimatePresence>
                {showStats && stats && stats.totalSignals > 0 && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                    >
                        <SignalStatsPanel stats={stats} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Source Filter - NEW */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <span className="text-xs text-gray-500 whitespace-nowrap">Quelle:</span>
                {(['all', 'AI_FUSION', 'AI', 'INDICATOR', 'HYBRID'] as SourceFilter[]).map((s) => {
                    const display = getSourceDisplay(s);
                    const count = sourceCounts[s] || 0;
                    // Only show filters that have signals (except 'all')
                    if (s !== 'all' && count === 0) return null;
                    return (
                        <button
                            key={s}
                            onClick={() => setSourceFilter(s)}
                            className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${sourceFilter === s
                                ? 'bg-purple-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                        >
                            {display.icon} {s === 'all' ? 'Alle' : display.label} {count > 0 && `(${count})`}
                        </button>
                    );
                })}
            </div>

            {/* Status Filter Buttons */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <span className="text-xs text-gray-500 whitespace-nowrap">Status:</span>
                {(['all', 'active', 'closed', 'win', 'loss'] as FilterType[]).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${filter === f
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                    >
                        {f === 'all' && 'Alle'}
                        {f === 'active' && `Aktiv (${signals.filter(s => s.status === 'active').length})`}
                        {f === 'closed' && 'Geschlossen'}
                        {f === 'win' && '✓ Gewinne'}
                        {f === 'loss' && '✗ Verluste'}
                    </button>
                ))}
            </div>

            {/* Signal List */}
            {filteredSignals.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">
                        {signals.length === 0
                            ? 'Noch keine Signale gespeichert'
                            : 'Keine Signale für diesen Filter'}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredSignals.slice(0, 20).map((signal) => (
                        <SignalCard
                            key={signal.id}
                            signal={signal}
                            onClose={handleDelete}
                        />
                    ))}
                    {filteredSignals.length > 20 && (
                        <p className="text-center text-sm text-gray-500">
                            ... und {filteredSignals.length - 20} weitere
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
