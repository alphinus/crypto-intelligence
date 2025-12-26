'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Info } from 'lucide-react';

interface FearGreedCompactProps {
    value: number;
    classification: string;
    previousValue?: number;
}

export function FearGreedCompact({
    value,
    classification,
    previousValue,
}: FearGreedCompactProps) {
    // Color based on value
    const getColors = (v: number) => {
        if (v <= 25) return { bg: 'bg-red-500', text: 'text-red-400', glow: 'shadow-red-500/20' };
        if (v <= 45) return { bg: 'bg-orange-500', text: 'text-orange-400', glow: 'shadow-orange-500/20' };
        if (v <= 55) return { bg: 'bg-yellow-500', text: 'text-yellow-400', glow: 'shadow-yellow-500/20' };
        if (v <= 75) return { bg: 'bg-lime-500', text: 'text-lime-400', glow: 'shadow-lime-500/20' };
        return { bg: 'bg-green-500', text: 'text-green-400', glow: 'shadow-green-500/20' };
    };

    const colors = getColors(value);
    const change = previousValue ? value - previousValue : 0;

    return (
        <div className="relative group overflow-hidden bg-gray-900/40 backdrop-blur-sm border-b border-gray-800 p-4 transition-all hover:bg-gray-900/60">
            {/* Background Gradient */}
            <div className={`absolute inset-0 opacity-[0.03] bg-gradient-to-r from-transparent via-${colors.text.split('-')[1]}-500 to-transparent`} />

            {/* Header Row */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Market Sentiment
                    </span>
                    <div className="group/info relative">
                        <Info className="w-3 h-3 text-gray-600 hover:text-gray-400 cursor-help" />
                        <div className="absolute left-0 bottom-full mb-2 w-48 p-2 bg-gray-800 rounded-lg text-[10px] text-gray-300 opacity-0 group-hover/info:opacity-100 pointer-events-none transition-opacity z-10 shadow-xl border border-gray-700">
                            Der Fear & Greed Index analysiert Volatilität, Momentum und Social Media Sentiment.
                        </div>
                    </div>
                </div>

                <div className="flex items-end gap-2">
                    <span className={`text-2xl font-black leading-none tracking-tight ${colors.text} drop-shadow-sm`}>
                        {value}
                    </span>
                    <div className="flex flex-col items-end">
                        <span className={`text-[10px] font-medium uppercase ${colors.text}`}>
                            {classification}
                        </span>
                        {change !== 0 && (
                            <div className={`flex items-center gap-0.5 text-[9px] font-medium ${change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {change > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                                <span>{change > 0 ? '+' : ''}{change}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Progress Bar Container */}
            <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden shadow-inner">
                {/* Gradient Background for Bar */}
                <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 opacity-20" />

                {/* Active Value Marker/Fill */}
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`absolute top-0 left-0 h-full ${colors.bg} shadow-[0_0_10px_rgba(0,0,0,0.5)]`}
                >
                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/50 shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                </motion.div>
            </div>

            {/* Scale Labels */}
            <div className="flex justify-between mt-1 text-[9px] text-gray-600 font-medium px-0.5">
                <span>Fear</span>
                <span>Neutral</span>
                <span>Greed</span>
            </div>
        </div>
    );
}
