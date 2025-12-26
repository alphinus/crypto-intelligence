'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
    createChart,
    ColorType,
    LineStyle,
    CrosshairMode,
    CandlestickSeries,
    LineSeries,
    BaselineSeries,
    type IChartApi,
    type ISeriesApi,
    type Time,
    type IPriceLine,
} from 'lightweight-charts';
import { BarChart2, TrendingUp, TrendingDown, Eye, EyeOff } from 'lucide-react';
import type { Kline, Interval } from '@/lib/binance-klines';
import { calculateEMA } from '@/lib/binance-klines';
import type { TechnicalLevels, Level, FibLevel } from '@/lib/technical-levels';
import type { DCAZone, DCAPreset } from '@/lib/dca-zones';
import { DCA_PRESET_LABELS } from '@/lib/dca-zones';

// Spot-optimized timeframes (Binance API supported)
type SpotTimeframe = '1d' | '1w';

interface OverlayVisibility {
    emas: boolean;
    supportResistance: boolean;
    goldenZone: boolean;
    dcaZones: boolean;
}

interface SpotDCAChartProps {
    symbol: string;
    klines: Kline[];
    technicalLevels?: TechnicalLevels;
    selectedTimeframe: SpotTimeframe;
    onTimeframeChange: (tf: SpotTimeframe) => void;
    dcaZone?: DCAZone;
    height?: number;
    theme?: 'dark' | 'light';
}

const SPOT_TIMEFRAMES: { value: SpotTimeframe; label: string }[] = [
    { value: '1d', label: 'Tag' },
    { value: '1w', label: 'Woche' },
];

export function SpotDCAChart({
    symbol,
    klines,
    technicalLevels,
    selectedTimeframe,
    onTimeframeChange,
    dcaZone,
    height = 450,
    theme = 'dark',
}: SpotDCAChartProps) {
    const isDark = theme === 'dark';
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
    const emaSeriesRefs = useRef<ISeriesApi<'Line'>[]>([]);
    const goldenZoneSeriesRef = useRef<ISeriesApi<'Baseline'> | null>(null);
    const priceLinesRef = useRef<IPriceLine[]>([]);
    const [isReady, setIsReady] = useState(false);
    const [overlayVisibility, setOverlayVisibility] = useState<OverlayVisibility>({
        emas: true,
        supportResistance: true,
        goldenZone: true,
        dcaZones: true,
    });

    // Toggle overlay
    const toggleOverlay = (key: keyof OverlayVisibility) => {
        setOverlayVisibility(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // Calculate EMAs (50, 200, 300)
    const calculatedEmas = useMemo(() => {
        if (klines.length === 0) return null;

        const closes = klines.map((k) => k.close);
        const periods = [50, 200, 300];
        const colors = ['#f59e0b', '#3b82f6', '#8b5cf6'];
        const labels = ['EMA 50', 'EMA 200', 'EMA 300'];

        return periods.map((period, idx) => {
            const emaValues = calculateEMA(closes, period);
            return {
                period,
                values: emaValues,
                currentValue: emaValues.length > 0 ? emaValues[emaValues.length - 1] : null,
                color: colors[idx],
                label: labels[idx],
            };
        });
    }, [klines]);

    // Get Golden Zone from Fibonacci
    const goldenZone = useMemo(() => {
        if (!technicalLevels?.fibonacci || technicalLevels.fibonacci.length === 0) return null;

        const fib382 = technicalLevels.fibonacci.find((f) => Math.abs(f.ratio - 0.382) < 0.01);
        const fib618 = technicalLevels.fibonacci.find((f) => Math.abs(f.ratio - 0.618) < 0.01);

        if (!fib382 || !fib618) return null;

        return {
            top: Math.max(fib382.price, fib618.price),
            bottom: Math.min(fib382.price, fib618.price),
        };
    }, [technicalLevels?.fibonacci]);

    // Clear functions
    const clearPriceLines = useCallback(() => {
        priceLinesRef.current.forEach((line) => {
            try {
                candlestickSeriesRef.current?.removePriceLine(line);
            } catch { /* ignore */ }
        });
        priceLinesRef.current = [];
    }, []);

    const clearEmaSeries = useCallback(() => {
        emaSeriesRefs.current.forEach((series) => {
            try {
                chartRef.current?.removeSeries(series);
            } catch { /* ignore */ }
        });
        emaSeriesRefs.current = [];
    }, []);

    const clearGoldenZoneSeries = useCallback(() => {
        if (goldenZoneSeriesRef.current) {
            try {
                chartRef.current?.removeSeries(goldenZoneSeriesRef.current);
            } catch { /* ignore */ }
            goldenZoneSeriesRef.current = null;
        }
    }, []);

    // Create chart
    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: isDark ? '#111827' : '#ffffff' },
                textColor: isDark ? '#9ca3af' : '#374151',
            },
            grid: {
                vertLines: { color: isDark ? '#1f2937' : '#e5e7eb' },
                horzLines: { color: isDark ? '#1f2937' : '#e5e7eb' },
            },
            crosshair: {
                mode: CrosshairMode.Normal,
                vertLine: {
                    color: isDark ? '#4b5563' : '#9ca3af',
                    width: 1,
                    style: LineStyle.Dashed,
                },
                horzLine: {
                    color: isDark ? '#4b5563' : '#9ca3af',
                    width: 1,
                    style: LineStyle.Dashed,
                },
            },
            rightPriceScale: {
                borderColor: isDark ? '#1f2937' : '#e5e7eb',
                scaleMargins: { top: 0.1, bottom: 0.1 },
            },
            timeScale: {
                borderColor: isDark ? '#1f2937' : '#e5e7eb',
                timeVisible: true,
                secondsVisible: false,
                rightOffset: 15,
                barSpacing: 8,
            },
            handleScroll: {
                mouseWheel: false,
                pressedMouseMove: true,
                horzTouchDrag: true,
                vertTouchDrag: false,
            },
            handleScale: {
                mouseWheel: false,
                pinch: true,
                axisPressedMouseMove: true,
            },
            width: chartContainerRef.current.clientWidth,
            height: height,
        });

        const candlestickSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#22c55e',
            downColor: '#ef4444',
            borderUpColor: '#22c55e',
            borderDownColor: '#ef4444',
            wickUpColor: '#22c55e',
            wickDownColor: '#ef4444',
        });

        chartRef.current = chart;
        candlestickSeriesRef.current = candlestickSeries;
        setIsReady(true);

        const resizeObserver = new ResizeObserver((entries) => {
            if (entries[0]?.contentRect && chartRef.current) {
                chartRef.current.applyOptions({ width: entries[0].contentRect.width });
            }
        });

        if (chartContainerRef.current) {
            resizeObserver.observe(chartContainerRef.current);
        }

        return () => {
            resizeObserver.disconnect();
            clearPriceLines();
            clearEmaSeries();
            clearGoldenZoneSeries();
            chart.remove();
            chartRef.current = null;
            candlestickSeriesRef.current = null;
            setIsReady(false);
        };
    }, [height, isDark, symbol, clearPriceLines, clearEmaSeries, clearGoldenZoneSeries]);

    // Auto-zoom when symbol or timeframe changes
    useEffect(() => {
        if (chartRef.current && isReady && klines.length > 0) {
            // Small delay to ensure data is loaded before fitting
            const timeout = setTimeout(() => {
                chartRef.current?.timeScale().fitContent();
            }, 50);
            return () => clearTimeout(timeout);
        }
    }, [symbol, selectedTimeframe, isReady, klines.length]);

    // Set klines data
    useEffect(() => {
        if (!candlestickSeriesRef.current || !isReady || klines.length === 0) return;

        const chartData = klines.map((k) => ({
            time: Math.floor(k.openTime / 1000) as Time,
            open: k.open,
            high: k.high,
            low: k.low,
            close: k.close,
        }));

        candlestickSeriesRef.current.setData(chartData);

        if (chartRef.current) {
            chartRef.current.timeScale().fitContent();
        }
    }, [klines, isReady]);

    // Draw EMAs
    useEffect(() => {
        clearEmaSeries();
        if (!chartRef.current || !isReady || !calculatedEmas || klines.length === 0 || !overlayVisibility.emas) return;

        calculatedEmas.forEach((ema) => {
            if (ema.values.length === 0) return;

            const emaSeries = chartRef.current!.addSeries(LineSeries, {
                color: ema.color,
                lineWidth: 2,
                priceLineVisible: false,
                lastValueVisible: false,
                crosshairMarkerVisible: false,
            });

            const startIndex = klines.length - ema.values.length;
            const emaData = ema.values.map((value, i) => ({
                time: Math.floor(klines[startIndex + i].openTime / 1000) as Time,
                value,
            }));
            emaSeries.setData(emaData);
            emaSeriesRefs.current.push(emaSeries);
        });
    }, [calculatedEmas, klines, isReady, clearEmaSeries, overlayVisibility.emas]);

    // Draw S/R and Golden Zone
    useEffect(() => {
        if (!candlestickSeriesRef.current || !chartRef.current || !isReady || klines.length === 0) return;

        clearPriceLines();
        clearGoldenZoneSeries();

        // Support Lines
        if (overlayVisibility.supportResistance && technicalLevels?.supports) {
            technicalLevels.supports.slice(0, 3).forEach((level: Level, index: number) => {
                const priceLine = candlestickSeriesRef.current!.createPriceLine({
                    price: level.price,
                    color: '#22c55e',
                    lineWidth: 1,
                    lineStyle: LineStyle.Dashed,
                    axisLabelVisible: true,
                    title: `S${index + 1}`,
                });
                priceLinesRef.current.push(priceLine);
            });
        }

        // Resistance Lines
        if (overlayVisibility.supportResistance && technicalLevels?.resistances) {
            technicalLevels.resistances.slice(0, 3).forEach((level: Level, index: number) => {
                const priceLine = candlestickSeriesRef.current!.createPriceLine({
                    price: level.price,
                    color: '#ef4444',
                    lineWidth: 1,
                    lineStyle: LineStyle.Dashed,
                    axisLabelVisible: true,
                    title: `R${index + 1}`,
                });
                priceLinesRef.current.push(priceLine);
            });
        }

        // Golden Zone
        if (overlayVisibility.goldenZone && goldenZone && chartRef.current) {
            const timeData = klines.map((k) => ({
                time: (k.openTime / 1000) as Time,
                value: goldenZone.top,
            }));

            const baselineSeries = chartRef.current.addSeries(BaselineSeries, {
                baseValue: { type: 'price', price: goldenZone.bottom },
                topLineColor: 'rgba(59, 130, 246, 0.6)',
                topFillColor1: 'rgba(59, 130, 246, 0.2)',
                topFillColor2: 'rgba(59, 130, 246, 0.1)',
                bottomLineColor: 'transparent',
                bottomFillColor1: 'transparent',
                bottomFillColor2: 'transparent',
                lineWidth: 1,
                lineStyle: LineStyle.Dotted,
                priceLineVisible: false,
                lastValueVisible: false,
            });
            baselineSeries.setData(timeData);
            goldenZoneSeriesRef.current = baselineSeries;

            // Labels
            const topLabel = candlestickSeriesRef.current!.createPriceLine({
                price: goldenZone.top,
                color: 'rgba(59, 130, 246, 0.6)',
                lineWidth: 1,
                lineStyle: LineStyle.Dotted,
                axisLabelVisible: true,
                title: '61.8%',
            });
            priceLinesRef.current.push(topLabel);

            const bottomLabel = candlestickSeriesRef.current!.createPriceLine({
                price: goldenZone.bottom,
                color: 'rgba(59, 130, 246, 0.6)',
                lineWidth: 1,
                lineStyle: LineStyle.Dotted,
                axisLabelVisible: true,
                title: '38.2%',
            });
            priceLinesRef.current.push(bottomLabel);
        }

        // EMA Labels
        if (overlayVisibility.emas) {
            calculatedEmas?.forEach((ema) => {
                if (ema.currentValue) {
                    const emaLine = candlestickSeriesRef.current!.createPriceLine({
                        price: ema.currentValue,
                        color: ema.color,
                        lineVisible: false,
                        axisLabelVisible: true,
                        title: ema.label.replace('EMA ', ''),
                    });
                    priceLinesRef.current.push(emaLine);
                }
            });
        }
    }, [technicalLevels, goldenZone, klines, isReady, calculatedEmas, clearPriceLines, clearGoldenZoneSeries, overlayVisibility]);

    // Current price and change
    const currentPrice = klines.length > 0 ? klines[klines.length - 1].close : 0;
    const priceChange = klines.length > 1
        ? ((currentPrice - klines[0].close) / klines[0].close) * 100
        : 0;

    const formatPrice = (price: number) => {
        if (price >= 10000) return price.toLocaleString('en-US', { maximumFractionDigits: 0 });
        if (price >= 100) return price.toLocaleString('en-US', { maximumFractionDigits: 2 });
        if (price >= 1) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
        return price.toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 8 });
    };

    return (
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg overflow-hidden">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-gray-800">
                <div className="flex items-center gap-3">
                    <BarChart2 className="w-5 h-5 text-green-400" />
                    <span className="font-semibold text-white">{symbol.toUpperCase()}/USDT</span>
                    <span className="text-lg font-bold text-white">${formatPrice(currentPrice)}</span>
                    <span className={`flex items-center gap-1 text-sm ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {priceChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    {/* Timeframe Switcher */}
                    <div className="flex gap-1">
                        {SPOT_TIMEFRAMES.map((tf) => (
                            <button
                                key={tf.value}
                                onClick={() => onTimeframeChange(tf.value)}
                                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${selectedTimeframe === tf.value
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                                    }`}
                            >
                                {tf.label}
                            </button>
                        ))}
                    </div>

                    {/* DCA Zone Badge */}
                    {dcaZone && (
                        <div
                            className="px-3 py-1.5 rounded-lg text-xs font-bold"
                            style={{ backgroundColor: dcaZone.bgColor, color: dcaZone.color }}
                        >
                            DCA: {dcaZone.score}/100
                        </div>
                    )}
                </div>
            </div>

            {/* Overlay Toggles */}
            <div className="flex flex-wrap gap-2 px-4 py-2 border-b border-gray-800 bg-gray-900/30">
                {[
                    { key: 'emas' as const, label: 'EMAs', color: '#3b82f6' },
                    { key: 'supportResistance' as const, label: 'S/R', color: '#22c55e' },
                    { key: 'goldenZone' as const, label: 'Fib Zone', color: '#8b5cf6' },
                ].map(({ key, label, color }) => (
                    <button
                        key={key}
                        onClick={() => toggleOverlay(key)}
                        className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded transition-colors ${overlayVisibility[key]
                            ? 'bg-gray-700 text-white'
                            : 'bg-gray-800/50 text-gray-500'
                            }`}
                    >
                        {overlayVisibility[key] ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        <span style={{ color: overlayVisibility[key] ? color : undefined }}>{label}</span>
                    </button>
                ))}
            </div>

            {/* Chart Container */}
            <div ref={chartContainerRef} className="w-full" />
        </div>
    );
}
