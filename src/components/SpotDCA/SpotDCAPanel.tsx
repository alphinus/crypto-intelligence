'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PiggyBank, RefreshCw, Settings2 } from 'lucide-react';
import { SpotDCAChart } from './SpotDCAChart';
import { DCACalculator } from './DCACalculator';
import { ZoneIndicator } from './ZoneIndicator';
import {
    calculateCombinedDCAScore,
    calculateZoneByPreset,
    DCA_PRESET_LABELS,
    type DCAPreset,
    type DCACalculation,
} from '@/lib/dca-zones';
import { calculateEMA } from '@/lib/binance-klines';
import type { Kline, Interval } from '@/lib/binance-klines';
import type { FearGreedIndex, MarketData } from '@/types/news';
import type { TechnicalLevels } from '@/lib/technical-levels';

// Note: Binance API doesn't support 1M directly, so we use 1w with more candles for monthly analysis
type SpotTimeframe = '1d' | '1w';

interface SpotDCAPanelProps {
    coins: MarketData[];
    fearGreed: FearGreedIndex | null;
    selectedCoin?: MarketData | null;
    onCoinSelect?: (coin: MarketData) => void;
}

export function SpotDCAPanel({
    coins,
    fearGreed,
    selectedCoin,
    onCoinSelect,
}: SpotDCAPanelProps) {
    const [timeframe, setTimeframe] = useState<SpotTimeframe>('1w');
    const [preset, setPreset] = useState<DCAPreset>('combined');
    const [klines, setKlines] = useState<Kline[]>([]);
    const [technicalLevels, setTechnicalLevels] = useState<TechnicalLevels | undefined>();
    const [loading, setLoading] = useState(false);
    const [showPresetMenu, setShowPresetMenu] = useState(false);

    // Default to BTC if no coin selected
    const activeCoin = selectedCoin || coins.find(c => c.symbol.toLowerCase() === 'btc') || coins[0];

    // Fetch klines for the selected coin and timeframe
    useEffect(() => {
        if (!activeCoin) return;

        const fetchKlines = async () => {
            setLoading(true);
            try {
                // Map SpotTimeframe to Binance interval
                const intervalMap: Record<SpotTimeframe, Interval> = {
                    '1d': '1d',
                    '1w': '1w',
                };

                // Use simple symbol WITHOUT manual USDT suffix as backend handles it now
                const resSymbol = activeCoin.symbol.toUpperCase();
                const response = await fetch(
                    `/api/klines?symbol=${resSymbol}&interval=${intervalMap[timeframe]}&limit=200`
                );

                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.klines && Array.isArray(data.klines)) {
                        console.log(`SpotDCAPanel: Klines fetched successfully for ${resSymbol}`, data.klines.length);
                        setKlines(data.klines);
                    } else {
                        console.error('SpotDCAPanel: Invalid klines format', data);
                        setKlines([]);
                    }
                } else {
                    console.error('SpotDCAPanel: Fetch failed', response.status);
                    setKlines([]);
                }
            } catch (error) {
                console.error('Error fetching klines:', error);
                setKlines([]);
            } finally {
                setLoading(false);
            }
        };

        fetchKlines();
    }, [activeCoin?.symbol, timeframe]);

    // Fetch technical levels
    useEffect(() => {
        if (!activeCoin || klines.length === 0) return;

        const fetchLevels = async () => {
            try {
                const resSymbol = activeCoin.symbol.toUpperCase();
                const response = await fetch(
                    `/api/technical-levels?symbol=${resSymbol}&interval=${timeframe}`
                );

                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        setTechnicalLevels(data.levels);
                    }
                }
            } catch (error) {
                console.error('Error fetching technical levels:', error);
            }
        };

        fetchLevels();
    }, [activeCoin?.symbol, klines.length, timeframe]);

    // ... (rest of memo logic remains same)

    const currentPriceHeader = klines.length > 0 ? klines[klines.length - 1].close : activeCoin?.price || 0;

    return (
        <div className="space-y-6 p-4 sm:p-6">
            {/* ... (Header and Coin Selector remain same) */}

            {/* Main Grid - Full Width Chart */}
            <div className="space-y-6">
                {/* Chart - Full Width */}
                <div className="relative space-y-4">
                    {/* PERSISTENT MOUNT: Always render the chart to avoid destruction, overlay loading */}
                    <SpotDCAChart
                        symbol={activeCoin?.symbol || 'BTC'}
                        klines={klines}
                        technicalLevels={technicalLevels}
                        selectedTimeframe={timeframe}
                        onTimeframeChange={setTimeframe}
                        dcaZone={currentZone || undefined}
                        height={450}
                    />

                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-950/40 backdrop-blur-[1px] rounded-lg z-10">
                            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                        </div>
                    )}

                    {/* Factor Breakdown */}
                    {dcaCalculation && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {Object.entries(dcaCalculation.factors).map(([key, factor]) => (
                                <div
                                    key={key}
                                    className="bg-gray-800/50 rounded-lg p-3 text-center"
                                >
                                    <div className="text-xs text-gray-400 uppercase mb-1">
                                        {key === 'ema' ? 'EMA' : key === 'fearGreed' ? 'F&G' : key === 'rsi' ? 'RSI' : 'Fib'}
                                    </div>
                                    <div className={`text-lg font-bold ${factor.score >= 60 ? 'text-green-400' :
                                        factor.score >= 40 ? 'text-yellow-400' :
                                            'text-red-400'
                                        }`}>
                                        {factor.score}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* DCA Info Row - Zone Indicator and Calculator side by side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Zone Indicator */}
                    {currentZone && <ZoneIndicator zone={currentZone} />}

                    {/* DCA Calculator */}
                    {currentZone && (
                        <DCACalculator
                            zone={currentZone}
                            currentPrice={currentPriceHeader}
                            coinSymbol={activeCoin?.symbol.toUpperCase() || 'BTC'}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
