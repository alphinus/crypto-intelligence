'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calculator, TrendingUp, DollarSign, Coins } from 'lucide-react';
import type { DCAZone } from '@/lib/dca-zones';
import { getDCARecommendation } from '@/lib/dca-zones';

interface DCACalculatorProps {
    zone: DCAZone;
    currentPrice: number;
    coinSymbol: string;
}

type Frequency = 'weekly' | 'biweekly' | 'monthly';

const FREQUENCY_LABELS: Record<Frequency, string> = {
    weekly: 'Wöchentlich',
    biweekly: 'Alle 2 Wochen',
    monthly: 'Monatlich',
};

export function DCACalculator({ zone, currentPrice, coinSymbol }: DCACalculatorProps) {
    const [budget, setBudget] = useState(100);
    const [frequency, setFrequency] = useState<Frequency>('monthly');

    const calculation = useMemo(() => {
        const coinAmount = budget / currentPrice;
        const yearlyInvestment = frequency === 'weekly' ? budget * 52 :
            frequency === 'biweekly' ? budget * 26 :
                budget * 12;
        const yearlyCoins = yearlyInvestment / currentPrice;

        return {
            coinAmount,
            yearlyInvestment,
            yearlyCoins,
            recommendation: getDCARecommendation(zone, budget, currentPrice, coinSymbol),
        };
    }, [budget, currentPrice, frequency, zone, coinSymbol]);

    const formatCoinAmount = (amount: number) => {
        if (amount >= 1) return amount.toFixed(4);
        if (amount >= 0.001) return amount.toFixed(6);
        return amount.toFixed(8);
    };

    return (
        <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6">
            {/* Header */}
            <div className="flex items-center gap-2 mb-6">
                <Calculator className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-white">DCA-Rechner</h3>
            </div>

            {/* Inputs */}
            <div className="space-y-4 mb-6">
                {/* Budget Input */}
                <div>
                    <label className="block text-sm text-gray-400 mb-2">Budget pro Kauf</label>
                    <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="number"
                            value={budget}
                            onChange={(e) => setBudget(Math.max(1, Number(e.target.value)))}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                            min="1"
                            step="10"
                        />
                    </div>
                </div>

                {/* Frequency Selector */}
                <div>
                    <label className="block text-sm text-gray-400 mb-2">Frequenz</label>
                    <div className="grid grid-cols-3 gap-2">
                        {(Object.keys(FREQUENCY_LABELS) as Frequency[]).map((freq) => (
                            <button
                                key={freq}
                                onClick={() => setFrequency(freq)}
                                className={`px-3 py-2 text-xs rounded-lg font-medium transition-colors ${frequency === freq
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                                    }`}
                            >
                                {FREQUENCY_LABELS[freq]}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Results */}
            <div className="space-y-4">
                {/* Per Purchase */}
                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-400">
                        <Coins className="w-4 h-4" />
                        <span className="text-sm">Pro Kauf</span>
                    </div>
                    <span className="font-mono font-bold text-white">
                        {formatCoinAmount(calculation.coinAmount)} {coinSymbol}
                    </span>
                </div>

                {/* Yearly Projection */}
                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-400">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-sm">Pro Jahr</span>
                    </div>
                    <div className="text-right">
                        <div className="font-mono font-bold text-white">
                            {formatCoinAmount(calculation.yearlyCoins)} {coinSymbol}
                        </div>
                        <div className="text-xs text-gray-500">
                            ${calculation.yearlyInvestment.toLocaleString()} investiert
                        </div>
                    </div>
                </div>

                {/* Recommendation Box */}
                <motion.div
                    key={zone.type}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl border"
                    style={{
                        backgroundColor: zone.bgColor,
                        borderColor: zone.color,
                    }}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: zone.color }}
                        />
                        <span className="text-sm font-bold" style={{ color: zone.color }}>
                            EMPFEHLUNG
                        </span>
                    </div>
                    <p className="text-sm text-gray-200 leading-relaxed">
                        {calculation.recommendation}
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
