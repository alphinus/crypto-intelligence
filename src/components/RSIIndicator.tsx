'use client';

import { useEffect, useRef, useMemo } from 'react';
import { createChart, LineSeries, ColorType, LineStyle, type IChartApi, type ISeriesApi, type Time, type LogicalRange } from 'lightweight-charts';
import { calculateRSI } from '@/lib/indicators';
import { X } from 'lucide-react';

interface RSIIndicatorProps {
  klines: { openTime: number; close: number }[];
  height?: number;
  onClose?: () => void;
  onVisibleRangeChange?: (range: LogicalRange | null) => void;
  visibleRange?: LogicalRange | null;
  theme?: 'dark' | 'light';
}

export function RSIIndicator({
  klines,
  height = 100,
  onClose,
  onVisibleRangeChange,
  visibleRange,
  theme = 'dark',
}: RSIIndicatorProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const rsiSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const overboughtSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const oversoldSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const middleSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const isReadyRef = useRef(false);

  const isDark = theme === 'dark';

  // Calculate current RSI from klines (derived state, not useState)
  const currentRSI = useMemo(() => {
    if (klines.length === 0) return null;
    const closes = klines.map((k) => k.close);
    const rsiResult = calculateRSI(closes, 14);
    const validValues = rsiResult.values.filter((v) => !isNaN(v));
    return validValues.length > 0 ? validValues[validValues.length - 1] : null;
  }, [klines]);

  // Create chart ONCE (only depends on height and theme)
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
        timeVisible: true,
        secondsVisible: false,
        visible: false, // Hide time scale - synced with main chart
        rightOffset: 15, // Space between last candle and right edge
        barSpacing: 6,
      },
      width: chartContainerRef.current.clientWidth,
      height,
      crosshair: {
        mode: 0, // Normal
        horzLine: { color: isDark ? '#6b7280' : '#9ca3af', style: LineStyle.Dashed },
        vertLine: { color: isDark ? '#6b7280' : '#9ca3af', style: LineStyle.Dashed },
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
    });

    chartRef.current = chart;

    // RSI Line Series
    const rsiSeries = chart.addSeries(LineSeries, {
      color: '#8b5cf6',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
    });
    rsiSeriesRef.current = rsiSeries;

    // Overbought line (70)
    const overboughtSeries = chart.addSeries(LineSeries, {
      color: '#ef4444',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });
    overboughtSeriesRef.current = overboughtSeries;

    // Oversold line (30)
    const oversoldSeries = chart.addSeries(LineSeries, {
      color: '#22c55e',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });
    oversoldSeriesRef.current = oversoldSeries;

    // Middle line (50)
    const middleSeries = chart.addSeries(LineSeries, {
      color: '#6b7280',
      lineWidth: 1,
      lineStyle: LineStyle.Dotted,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });
    middleSeriesRef.current = middleSeries;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);
    isReadyRef.current = true;

    return () => {
      window.removeEventListener('resize', handleResize);
      isReadyRef.current = false;
      rsiSeriesRef.current = null;
      overboughtSeriesRef.current = null;
      oversoldSeriesRef.current = null;
      middleSeriesRef.current = null;
      chart.remove();
      chartRef.current = null;
    };
  }, [height, isDark]);

  // Subscribe to visible range changes - SEPARATE effect to avoid chart recreation
  useEffect(() => {
    if (!chartRef.current || !onVisibleRangeChange) return;

    const chart = chartRef.current;
    chart.timeScale().subscribeVisibleLogicalRangeChange(onVisibleRangeChange);

    return () => {
      // Unsubscribe is handled by chart.remove() in the main effect
    };
  }, [onVisibleRangeChange]);

  // Update series data when klines change (INCREMENTAL - no chart recreation)
  useEffect(() => {
    if (!isReadyRef.current || klines.length === 0) return;
    if (!rsiSeriesRef.current || !overboughtSeriesRef.current || !oversoldSeriesRef.current || !middleSeriesRef.current) return;

    // Calculate RSI
    const closes = klines.map((k) => k.close);
    const rsiResult = calculateRSI(closes, 14);

    // Map RSI values to chart data
    const rsiData = rsiResult.values
      .map((value, i) => ({
        time: Math.floor(klines[i].openTime / 1000) as Time,
        value: isNaN(value) ? undefined : value,
      }))
      .filter((d) => d.value !== undefined) as { time: Time; value: number }[];

    // Update RSI series
    rsiSeriesRef.current.setData(rsiData);

    // Update reference lines
    const timeData = klines.map((k) => ({ time: Math.floor(k.openTime / 1000) as Time }));

    overboughtSeriesRef.current.setData(timeData.map((t) => ({ ...t, value: 70 })));
    oversoldSeriesRef.current.setData(timeData.map((t) => ({ ...t, value: 30 })));
    middleSeriesRef.current.setData(timeData.map((t) => ({ ...t, value: 50 })));
  }, [klines]);

  // Sync visible range from parent
  useEffect(() => {
    if (chartRef.current && visibleRange) {
      chartRef.current.timeScale().setVisibleLogicalRange(visibleRange);
    }
  }, [visibleRange]);

  const getRSIColor = (value: number) => {
    if (value >= 70) return 'text-red-600 dark:text-red-400';
    if (value <= 30) return 'text-green-600 dark:text-green-400';
    return 'text-purple-600 dark:text-purple-400';
  };

  return (
    <div className="bg-white dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">RSI(14)</span>
          {currentRSI !== null && (
            <span className={`text-xs font-bold ${getRSIColor(currentRSI)}`}>
              {currentRSI.toFixed(2)}
            </span>
          )}
          <div className="flex items-center gap-2 text-[10px] text-gray-500">
            <span><span className="text-red-600 dark:text-red-400">70</span> Overbought</span>
            <span><span className="text-green-600 dark:text-green-400">30</span> Oversold</span>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5 text-gray-500" />
          </button>
        )}
      </div>
      {/* Chart */}
      <div ref={chartContainerRef} style={{ height }} />
    </div>
  );
}
