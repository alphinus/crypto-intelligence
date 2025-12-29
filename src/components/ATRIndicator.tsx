'use client';

import { useEffect, useRef, useMemo } from 'react';
import { createChart, LineSeries, ColorType, LineStyle, type IChartApi, type ISeriesApi, type Time, type LogicalRange } from 'lightweight-charts';
import { calculateATR } from '@/lib/indicators';
import { X } from 'lucide-react';

interface ATRIndicatorProps {
    klines: { openTime: number; close: number; high: number; low: number }[];
    height?: number;
    onClose?: () => void;
    onVisibleRangeChange?: (range: LogicalRange | null) => void;
    visibleRange?: LogicalRange | null;
    theme?: 'dark' | 'light';
}

export function ATRIndicator({
    klines,
    height = 100,
    onClose,
    onVisibleRangeChange,
    visibleRange,
    theme = 'dark',
}: ATRIndicatorProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const atrSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
    const isReadyRef = useRef(false);

    const isDark = theme === 'dark';

    const currentATR = useMemo(() => {
        if (klines.length === 0) return null;
        const highs = klines.map(k => k.high);
        const lows = klines.map(k => k.low);
        const closes = klines.map(k => k.close);
        const atrValues = calculateATR(highs, lows, closes, 14);
        const valid = atrValues.filter(v => !isNaN(v));
        return valid.length > 0 ? valid[valid.length - 1] : null;
    }, [klines]);

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

        const atrSeries = chart.addSeries(LineSeries, {
            color: '#fbbf24',
            lineWidth: 2,
            priceLineVisible: false,
            lastValueVisible: true,
        });
        atrSeriesRef.current = atrSeries;

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
        if (!atrSeriesRef.current) return;

        const highs = klines.map(k => k.high);
        const lows = klines.map(k => k.low);
        const closes = klines.map(k => k.close);
        const atrValues = calculateATR(highs, lows, closes, 14);

        const atrData = atrValues.map((v, i) => ({
            time: Math.floor(klines[i].openTime / 1000) as Time,
            value: isNaN(v) ? undefined : v,
        })).filter(d => d.value !== undefined) as { time: Time; value: number }[];

        atrSeriesRef.current.setData(atrData);
    }, [klines]);

    // Sync visible range
    useEffect(() => {
        if (chartRef.current && visibleRange) chartRef.current.timeScale().setVisibleLogicalRange(visibleRange);
    }, [visibleRange]);

    return (
        <div className="bg-white dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">ATR(14)</span>
                    {currentATR !== null && (
                        <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400">
                            {currentATR.toFixed(2)}
                        </span>
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
