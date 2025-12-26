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

                const response = await fetch(
                    `/api/klines?symbol=${activeCoin.symbol.toUpperCase()}USDT&interval=${intervalMap[timeframe]}&limit=200`
                );

                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.klines) {
                        setKlines(data.klines);
                    }
                }
            } catch (error) {
                console.error('Error fetching klines:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchKlines();
    }, [activeCoin, timeframe]);

    // Fetch technical levels
    useEffect(() => {
        if (!activeCoin || klines.length === 0) return;

        const fetchLevels = async () => {
            try {
                const response = await fetch(
                    `/api/technical-levels?symbol=${activeCoin.symbol.toUpperCase()}USDT&interval=${timeframe}`
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
    }, [activeCoin, klines.length, timeframe]);

    // Calculate DCA zone
    const dcaCalculation = useMemo((): DCACalculation | null => {
        if (klines.length === 0) return null;

        const closes = klines.map(k => k.close);
        const currentPrice = closes[closes.length - 1];

        // Calculate EMAs
        const ema50Values = calculateEMA(closes, 50);
        const ema200Values = calculateEMA(closes, 200);
        const ema300Values = calculateEMA(closes, 300);

        const ema50 = ema50Values.length > 0 ? ema50Values[ema50Values.length - 1] : null;
        const ema200 = ema200Values.length > 0 ? ema200Values[ema200Values.length - 1] : null;
        const ema300 = ema300Values.length > 0 ? ema300Values[ema300Values.length - 1] : null;

        // Calculate RSI (simple implementation)
        let rsi: number | null = null;
        if (closes.length >= 15) {
            const changes = closes.slice(-15).map((c, i, arr) => i > 0 ? c - arr[i - 1] : 0).slice(1);
            const gains = changes.filter(c => c > 0);
            const losses = changes.filter(c => c < 0).map(c => Math.abs(c));
            const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / 14 : 0;
            const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / 14 : 0.001;
            const rs = avgGain / avgLoss;
            rsi = 100 - (100 / (1 + rs));
        }

        // Get Fibonacci levels
        const fib382 = technicalLevels?.fibonacci?.find(f => Math.abs(f.ratio - 0.382) < 0.01)?.price || null;
        const fib618 = technicalLevels?.fibonacci?.find(f => Math.abs(f.ratio - 0.618) < 0.01)?.price || null;
        const fibHigh = technicalLevels?.fibonacci?.find(f => f.ratio === 0)?.price || null;
        const fibLow = technicalLevels?.fibonacci?.find(f => f.ratio === 1)?.price || null;

        return calculateCombinedDCAScore({
            currentPrice,
            ema50,
            ema200,
            ema300,
            fearGreed,
            rsi,
            fib382,
            fib618,
            fibHigh,
            fibLow,
        });
    }, [klines, fearGreed, technicalLevels]);

    // Get zone based on preset
    const currentZone = useMemo(() => {
        if (!dcaCalculation) return null;

        if (preset === 'combined') {
            return dcaCalculation.zone;
        }

        const closes = klines.map(k => k.close);
        const currentPrice = closes[closes.length - 1] || 0;

        return calculateZoneByPreset(preset, {
            currentPrice,
            ema50: dcaCalculation.factors.ema.score > 50 ? currentPrice * 0.95 : currentPrice * 1.05,
            ema200: dcaCalculation.factors.ema.score > 50 ? currentPrice * 0.9 : currentPrice * 1.1,
            fearGreed,
            rsi: dcaCalculation.factors.rsi.score,
            fib382: technicalLevels?.fibonacci?.find(f => Math.abs(f.ratio - 0.382) < 0.01)?.price,
            fib618: technicalLevels?.fibonacci?.find(f => Math.abs(f.ratio - 0.618) < 0.01)?.price,
            fibHigh: technicalLevels?.fibonacci?.find(f => f.ratio === 0)?.price,
            fibLow: technicalLevels?.fibonacci?.find(f => f.ratio === 1)?.price,
        });
    }, [dcaCalculation, preset, klines, fearGreed, technicalLevels]);

    const currentPrice = klines.length > 0 ? klines[klines.length - 1].close : activeCoin?.price || 0;

    return (
        <div className="space-y-6 p-4 sm:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-green-600 p-2 rounded-xl">
                        <PiggyBank className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Spot DCA</h2>
                        <p className="text-sm text-gray-400">Langfristige Akkumulation optimieren</p>
                    </div>
                </div>

                {/* Preset Selector */}
                <div className="relative">
                    <button
                        onClick={() => setShowPresetMenu(!showPresetMenu)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
                    >
                        <Settings2 className="w-4 h-4 text-gray-400" />
                        <span className="text-white">{DCA_PRESET_LABELS[preset].label}</span>
                    </button>

                    {showPresetMenu && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute right-0 top-full mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50"
                        >
                            {(Object.keys(DCA_PRESET_LABELS) as DCAPreset[]).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => {
                                        setPreset(p);
                                        setShowPresetMenu(false);
                                    }}
                                    className={`w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${preset === p ? 'bg-gray-700' : ''
                                        }`}
                                >
                                    <div className="font-medium text-white">{DCA_PRESET_LABELS[p].label}</div>
                                    <div className="text-xs text-gray-400">{DCA_PRESET_LABELS[p].description}</div>
                                </button>
                            ))}
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Coin Selector */}
            <div className="flex flex-wrap gap-2">
                {coins.slice(0, 10).map((coin) => (
                    <button
                        key={coin.symbol}
                        onClick={() => onCoinSelect?.(coin)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeCoin?.symbol === coin.symbol
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                            }`}
                    >
                        {coin.symbol.toUpperCase()}
                    </button>
                ))}
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Chart Column */}
                <div className="lg:col-span-8 space-y-4">
                    {loading ? (
                        <div className="flex items-center justify-center h-[450px] bg-gray-900/50 rounded-lg">
                            <RefreshCw className="w-8 h-8 text-gray-500 animate-spin" />
                        </div>
                    ) : (
                        <SpotDCAChart
                            symbol={activeCoin?.symbol || 'BTC'}
                            klines={klines}
                            technicalLevels={technicalLevels}
                            selectedTimeframe={timeframe}
                            onTimeframeChange={setTimeframe}
                            dcaZone={currentZone || undefined}
                            height={450}
                        />
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

                {/* Sidebar Column */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Zone Indicator */}
                    {currentZone && <ZoneIndicator zone={currentZone} />}

                    {/* DCA Calculator */}
                    {currentZone && (
                        <DCACalculator
                            zone={currentZone}
                            currentPrice={currentPrice}
                            coinSymbol={activeCoin?.symbol.toUpperCase() || 'BTC'}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
