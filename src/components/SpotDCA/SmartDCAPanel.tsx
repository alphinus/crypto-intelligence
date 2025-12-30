'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingDown, TrendingUp, Wallet, ListOrdered, ArrowDown, Sparkles } from 'lucide-react';
import type { DCAZone } from '@/lib/dca-zones';
import { calculateSmartDCA, type SmartDCAResult, type LimitOrderSuggestion } from '@/lib/dca-zones';

interface SmartDCAPanelProps {
    currentPrice: number;
    ema50: number | null;
    ema200: number | null;
    ema300?: number | null;
    baseBudget: number;
    zoneScore: number;
    coinSymbol: string;
}

export function SmartDCAPanel({
    currentPrice,
    ema50,
    ema200,
    ema300,
    baseBudget,
    zoneScore,
    coinSymbol,
}: SmartDCAPanelProps) {
    const smartDCA = useMemo(() => {
        return calculateSmartDCA({
            currentPrice,
            ema50,
            ema200,
            ema300,
            baseBudget,
            zoneScore,
            coinSymbol,
        });
    }, [currentPrice, ema50, ema200, ema300, baseBudget, zoneScore, coinSymbol]);

    const formatPrice = (price: number) => {
        if (price >= 1000) return `$${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
        if (price >= 1) return `$${price.toFixed(2)}`;
        return `$${price.toFixed(6)}`;
    };

    const formatCoinAmount = (amount: number) => {
        if (amount >= 1) return amount.toFixed(4);
        if (amount >= 0.001) return amount.toFixed(6);
        return amount.toFixed(8);
    };

    const getPositionLabel = (position: SmartDCAResult['currentPriceAnalysis']['position']) => {
        const labels = {
            deep_discount: { text: 'Starker Rabatt', color: 'text-green-400', bg: 'bg-green-500/20' },
            discount: { text: 'Rabatt', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
            fair_value: { text: 'Fair Value', color: 'text-blue-400', bg: 'bg-blue-500/20' },
            premium: { text: 'Premium', color: 'text-orange-400', bg: 'bg-orange-500/20' },
            overheated: { text: 'Überhitzt', color: 'text-red-400', bg: 'bg-red-500/20' },
        };
        return labels[position];
    };

    const positionStyle = getPositionLabel(smartDCA.currentPriceAnalysis.position);

    return (
        <div className="space-y-4">
            {/* Price Position Analysis */}
            <div className="bg-gray-100 dark:bg-gray-800/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Preisposition</span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${positionStyle.bg} ${positionStyle.color}`}>
                        {positionStyle.text}
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white dark:bg-gray-900/50 rounded-lg p-3">
                        <div className="text-xs text-gray-500 mb-1">vs EMA 50</div>
                        <div className={`text-lg font-bold ${smartDCA.currentPriceAnalysis.discountFromEma50 > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {smartDCA.currentPriceAnalysis.discountFromEma50 > 0 ? '+' : ''}
                            {smartDCA.currentPriceAnalysis.discountFromEma50.toFixed(1)}%
                        </div>
                        {ema50 && <div className="text-xs text-gray-500">{formatPrice(ema50)}</div>}
                    </div>
                    <div className="bg-white dark:bg-gray-900/50 rounded-lg p-3">
                        <div className="text-xs text-gray-500 mb-1">vs EMA 200</div>
                        <div className={`text-lg font-bold ${smartDCA.currentPriceAnalysis.discountFromEma200 > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {smartDCA.currentPriceAnalysis.discountFromEma200 > 0 ? '+' : ''}
                            {smartDCA.currentPriceAnalysis.discountFromEma200.toFixed(1)}%
                        </div>
                        {ema200 && <div className="text-xs text-gray-500">{formatPrice(ema200)}</div>}
                    </div>
                </div>
            </div>

            {/* Dynamic Budget Recommendation */}
            <div className="bg-gray-100 dark:bg-gray-800/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Wallet className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Smart Budget</span>
                </div>

                <div className="flex items-center justify-between mb-3">
                    <div>
                        <div className="text-xs text-gray-500">Basis-Budget</div>
                        <div className="text-lg font-mono text-gray-600 dark:text-gray-400">${smartDCA.recommendedBudget.base}</div>
                    </div>
                    <ArrowDown className="w-5 h-5 text-gray-400" />
                    <div className="text-right">
                        <div className="text-xs text-gray-500">Empfohlen</div>
                        <div className="text-xl font-mono font-bold text-white">
                            ${smartDCA.recommendedBudget.adjusted}
                            <span className={`ml-2 text-sm ${smartDCA.recommendedBudget.multiplier >= 1 ? 'text-green-400' : 'text-orange-400'}`}>
                                ({smartDCA.recommendedBudget.multiplier}x)
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900/50 rounded-lg p-2 text-sm text-center text-gray-600 dark:text-gray-300">
                    💡 {smartDCA.recommendedBudget.reason}
                </div>
            </div>

            {/* Price Zones */}
            {smartDCA.priceZones.length > 0 && (
                <div className="bg-gray-100 dark:bg-gray-800/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <TrendingDown className="w-4 h-4 text-green-400" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Kaufzonen</span>
                    </div>

                    <div className="space-y-2">
                        {smartDCA.priceZones.map((zone) => (
                            <div
                                key={zone.name}
                                className="flex items-center justify-between bg-white dark:bg-gray-900/50 rounded-lg p-2"
                            >
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: zone.color }}
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{zone.name}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="font-mono text-sm text-gray-600 dark:text-gray-400">
                                        {formatPrice(zone.price)}
                                    </span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${zone.discountPercent > 0
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-red-500/20 text-red-400'
                                        }`}>
                                        {zone.discountPercent > 0 ? '+' : ''}{zone.discountPercent.toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Limit Order Suggestions */}
            <div className="bg-gray-100 dark:bg-gray-800/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                    <ListOrdered className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Gestaffelte Orders</span>
                    <span className="text-xs text-gray-500">({coinSymbol})</span>
                </div>

                <div className="space-y-2">
                    {smartDCA.limitOrders.map((order, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`flex items-center justify-between p-2 rounded-lg ${order.tier === 'Market'
                                    ? 'bg-blue-500/20 border border-blue-500/30'
                                    : 'bg-white dark:bg-gray-900/50'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${order.tier === 'Market' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                    }`}>
                                    {order.budgetPercent.toFixed(0)}%
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                        {order.tier === 'Market' ? 'Sofort (Market)' : order.tier}
                                    </div>
                                    <div className="text-xs text-gray-500">{formatPrice(order.price)}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-mono text-sm font-bold text-gray-700 dark:text-gray-200">
                                    ${order.budgetAmount.toFixed(0)}
                                </div>
                                <div className="text-xs text-gray-500">
                                    ≈ {formatCoinAmount(order.coinAmount)} {coinSymbol}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Total Summary */}
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Gesamt</span>
                    </div>
                    <div className="text-right">
                        <div className="font-mono font-bold text-gray-700 dark:text-white">
                            ${smartDCA.recommendedBudget.adjusted}
                        </div>
                        <div className="text-xs text-gray-500">
                            ≈ {formatCoinAmount(smartDCA.limitOrders.reduce((sum, o) => sum + o.coinAmount, 0))} {coinSymbol}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
