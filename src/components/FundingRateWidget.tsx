'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Users } from 'lucide-react';

interface FundingRateWidgetProps {
    fundingRate: number | null;
    symbol?: string;
    compact?: boolean;
}

type FundingInterpretation = {
    bias: 'long' | 'short' | 'neutral';
    strength: 'extreme' | 'high' | 'moderate' | 'low';
    color: string;
    bgColor: string;
    icon: typeof TrendingUp;
    label: string;
    description: string;
    tradingAdvice: string;
};

/**
 * Interpret funding rate for trading signals
 * 
 * Positive funding = Longs pay Shorts → Market is long-heavy (crowded longs)
 * Negative funding = Shorts pay Longs → Market is short-heavy (crowded shorts)
 */
function interpretFundingRate(rate: number): FundingInterpretation {
    const percent = rate * 100;
    
    if (percent >= 0.1) {
        return {
            bias: 'long',
            strength: 'extreme',
            color: '#ef4444', // Red warning for longs
            bgColor: 'rgba(239, 68, 68, 0.15)',
            icon: TrendingUp,
            label: 'Überfüllt Long',
            description: `${percent.toFixed(3)}% (Longs zahlen)`,
            tradingAdvice: 'Hohes Liquidationsrisiko für Longs',
        };
    } else if (percent >= 0.05) {
        return {
            bias: 'long',
            strength: 'high',
            color: '#f97316', // Orange
            bgColor: 'rgba(249, 115, 22, 0.15)',
            icon: TrendingUp,
            label: 'Long Bias',
            description: `${percent.toFixed(3)}% (Longs zahlen)`,
            tradingAdvice: 'Erhöhtes Long-Risiko',
        };
    } else if (percent >= 0.01) {
        return {
            bias: 'long',
            strength: 'moderate',
            color: '#eab308', // Yellow
            bgColor: 'rgba(234, 179, 8, 0.15)',
            icon: TrendingUp,
            label: 'Leicht Long',
            description: `${percent.toFixed(3)}%`,
            tradingAdvice: 'Normaler Long-Bias',
        };
    } else if (percent <= -0.1) {
        return {
            bias: 'short',
            strength: 'extreme',
            color: '#22c55e', // Green (good for longs!)
            bgColor: 'rgba(34, 197, 94, 0.15)',
            icon: TrendingDown,
            label: 'Überfüllt Short',
            description: `${percent.toFixed(3)}% (Shorts zahlen)`,
            tradingAdvice: 'Short Squeeze wahrscheinlich',
        };
    } else if (percent <= -0.05) {
        return {
            bias: 'short',
            strength: 'high',
            color: '#84cc16', // Light green
            bgColor: 'rgba(132, 204, 22, 0.15)',
            icon: TrendingDown,
            label: 'Short Bias',
            description: `${percent.toFixed(3)}% (Shorts zahlen)`,
            tradingAdvice: 'Erhöhtes Squeeze-Risiko',
        };
    } else if (percent <= -0.01) {
        return {
            bias: 'short',
            strength: 'moderate',
            color: '#14b8a6', // Teal
            bgColor: 'rgba(20, 184, 166, 0.15)',
            icon: TrendingDown,
            label: 'Leicht Short',
            description: `${percent.toFixed(3)}%`,
            tradingAdvice: 'Normaler Short-Bias',
        };
    } else {
        return {
            bias: 'neutral',
            strength: 'low',
            color: '#6b7280', // Gray
            bgColor: 'rgba(107, 114, 128, 0.15)',
            icon: Minus,
            label: 'Neutral',
            description: `${percent.toFixed(3)}%`,
            tradingAdvice: 'Ausgewogenes Marktsentiment',
        };
    }
}

export function FundingRateWidget({ fundingRate, symbol = 'BTC', compact = false }: FundingRateWidgetProps) {
    const interpretation = useMemo(() => {
        if (fundingRate === null) return null;
        return interpretFundingRate(fundingRate);
    }, [fundingRate]);

    if (fundingRate === null || !interpretation) {
        return null;
    }

    const Icon = interpretation.icon;

    if (compact) {
        return (
            <div 
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium"
                style={{ backgroundColor: interpretation.bgColor, color: interpretation.color }}
                title={`${interpretation.label}: ${interpretation.tradingAdvice}`}
            >
                <Icon className="w-3 h-3" />
                <span>{(fundingRate * 100).toFixed(3)}%</span>
            </div>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 px-3 py-2 rounded-xl border"
            style={{ 
                backgroundColor: interpretation.bgColor, 
                borderColor: interpretation.color + '40',
            }}
        >
            {/* Icon */}
            <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: interpretation.color + '20' }}
            >
                <Icon className="w-4 h-4" style={{ color: interpretation.color }} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Funding</span>
                    <span 
                        className="text-xs font-bold px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: interpretation.color + '20', color: interpretation.color }}
                    >
                        {interpretation.label}
                    </span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                    <span className="font-mono text-sm font-bold" style={{ color: interpretation.color }}>
                        {(fundingRate * 100).toFixed(4)}%
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate ml-2">
                        {interpretation.tradingAdvice}
                    </span>
                </div>
            </div>

            {/* Crowd indicator */}
            <div className="flex flex-col items-center">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-[10px] text-gray-500">
                    {interpretation.bias === 'long' ? 'Longs' : interpretation.bias === 'short' ? 'Shorts' : '—'}
                </span>
            </div>
        </motion.div>
    );
}

/**
 * Extended version with multiple funding rates
 */
interface MultiFundingWidgetProps {
    fundingRates: {
        btc?: number;
        eth?: number;
        sol?: number;
    } | null;
}

export function MultiFundingWidget({ fundingRates }: MultiFundingWidgetProps) {
    if (!fundingRates) return null;

    const rates = [
        { symbol: 'BTC', rate: fundingRates.btc },
        { symbol: 'ETH', rate: fundingRates.eth },
        { symbol: 'SOL', rate: fundingRates.sol },
    ].filter(r => r.rate !== undefined && r.rate !== null);

    if (rates.length === 0) return null;

    return (
        <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Funding:</span>
            <div className="flex items-center gap-1.5">
                {rates.map(({ symbol, rate }) => {
                    const interpretation = interpretFundingRate(rate!);
                    const Icon = interpretation.icon;
                    return (
                        <div
                            key={symbol}
                            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs"
                            style={{ backgroundColor: interpretation.bgColor }}
                            title={`${symbol}: ${interpretation.label} - ${interpretation.tradingAdvice}`}
                        >
                            <span className="font-medium text-gray-600 dark:text-gray-300">{symbol}</span>
                            <Icon className="w-3 h-3" style={{ color: interpretation.color }} />
                            <span className="font-mono font-bold" style={{ color: interpretation.color }}>
                                {(rate! * 100).toFixed(3)}%
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
