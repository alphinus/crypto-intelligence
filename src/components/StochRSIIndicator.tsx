'use client';

import { useEffect, useRef, useMemo } from 'react';
import { createChart, LineSeries, ColorType, LineStyle, type IChartApi, type ISeriesApi, type Time, type LogicalRange } from 'lightweight-charts';
import { calculateStochRSI } from '@/lib/binance-klines';
import { X } from 'lucide-react';

interface StochRSIIndicatorProps {
    klines: { openTime: number; close: number }[];
    height?: number;
    onClose?: () => void;
    onVisibleRangeChange?: (range: LogicalRange | null) => void;
    visibleRange?: LogicalRange | null;
    theme?: 'dark' | 'light';
}

export function StochRSIIndicator({
    klines,
    height = 120, // Slightly taller for two lines
    onClose,
    onVisibleRangeChange,
    visibleRange,
    theme = 'dark',
}: StochRSIIndicatorProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const kSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
    const dSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
    const overboughtSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
    const oversoldSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
    const isReadyRef = useRef(false);

    const isDark = theme === 'dark';

    // Calculate current values
    const currentValues = useMemo(() => {
        if (klines.length === 0) return null;
        const closes = klines.map((k) => k.close);
        const result = calculateStochRSI(closes);
        return {
            k: result.currentK,
            d: result.currentD,
            signal: result.signal
        };
    }, [klines]);

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
            rightPriceScale: {
                borderColor: isDark ? '#1f2937' : '#e5e7eb',
                scaleMargins: { top: 0.1, bottom: 0.1 },
            },
            timeScale: {
                borderColor: isDark ? '#1f2937' : '#e5e7eb',
                visible: false,
                rightOffset: 15,
                barSpacing: 6,
            },
            width: chartContainerRef.current.clientWidth,
            height,
            crosshair: {
                mode: 0,
                horzLine: { color: isDark ? '#6b7280' : '#9ca3af', style: LineStyle.Dashed },
                vertLine: { color: isDark ? '#6b7280' : '#9ca3af', style: LineStyle.Dashed },
            },
            handleScroll: { mouseWheel: false, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
            handleScale: { mouseWheel: false, pinch: true, axisPressedMouseMove: true },
        });

        chartRef.current = chart;

        // %K Series (Blue)
        const kSeries = chart.addSeries(LineSeries, {
            color: '#3b82f6',
            lineWidth: 2,
            priceLineVisible: false,
            lastValueVisible: true,
            title: '%K',
        });
        kSeriesRef.current = kSeries;

        // %D Series (Orange)
        const dSeries = chart.addSeries(LineSeries, {
            color: '#f59e0b',
            lineWidth: 2,
            priceLineVisible: false,
            lastValueVisible: true,
            title: '%D',
        });
        dSeriesRef.current = dSeries;

        // Boundary lines (80/20)
        const overboughtSeries = chart.addSeries(LineSeries, {
            color: '#ef4444',
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            priceLineVisible: false,
            lastValueVisible: false,
        });
        overboughtSeriesRef.current = overboughtSeries;

        const oversoldSeries = chart.addSeries(LineSeries, {
            color: '#22c55e',
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            priceLineVisible: false,
            lastValueVisible: false,
        });
        oversoldSeriesRef.current = oversoldSeries;

        const handleResize = () => {
            if (chartContainerRef.current) chart.applyOptions({ width: chartContainerRef.current.clientWidth });
        };

        window.addEventListener('resize', handleResize);
        isReadyRef.current = true;

        return () => {
            window.removeEventListener('resize', handleResize);
            isReadyRef.current = false;
            chart.remove();
            chartRef.current = null;
        };
    }, [height, isDark]);

    // Subscribe to visible range
    useEffect(() => {
        if (!chartRef.current || !onVisibleRangeChange) return;
        chartRef.current.timeScale().subscribeVisibleLogicalRangeChange(onVisibleRangeChange);
    }, [onVisibleRangeChange]);

    // Update data
    useEffect(() => {
        if (!isReadyRef.current || klines.length === 0) return;
        if (!kSeriesRef.current || !dSeriesRef.current) return;

        const closes = klines.map((k) => k.close);
        const result = calculateStochRSI(closes);

        const kData = result.k.map((v, i) => ({
            time: Math.floor(klines[i].openTime / 1000) as Time,
            value: isNaN(v) ? undefined : v,
        })).filter(d => d.value !== undefined) as { time: Time; value: number }[];

        const dData = result.d.map((v, i) => ({
            time: Math.floor(klines[i].openTime / 1000) as Time,
            value: isNaN(v) ? undefined : v,
        })).filter(d => d.value !== undefined) as { time: Time; value: number }[];

        kSeriesRef.current.setData(kData);
        dSeriesRef.current.setData(dData);

        const timeData = klines.map((k) => ({ time: Math.floor(k.openTime / 1000) as Time }));
        overboughtSeriesRef.current?.setData(timeData.map(t => ({ ...t, value: 80 })));
        oversoldSeriesRef.current?.setData(timeData.map(t => ({ ...t, value: 20 })));
    }, [klines]);

    // Sync visible range
    useEffect(() => {
        if (chartRef.current && visibleRange) chartRef.current.timeScale().setVisibleLogicalRange(visibleRange);
    }, [visibleRange]);

    return (
        <div className="bg-white dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Stoch RSI(14,14,3,3)</span>
                    {currentValues && (
                        <div className="flex gap-3 text-xs font-bold">
                            <span className="text-blue-600 dark:text-blue-400">K: {currentValues.k.toFixed(2)}</span>
                            <span className="text-orange-600 dark:text-orange-400">D: {currentValues.d.toFixed(2)}</span>
                        </div>
                    )}
                </div>
                {onClose && (
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors">
                        <X className="w-3.5 h-3.5 text-gray-500" />
                    </button>
                )}
            </div>
            <div ref={chartContainerRef} style={{ height }} />
        </div>
    );
}
