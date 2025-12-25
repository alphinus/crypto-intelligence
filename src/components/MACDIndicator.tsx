'use client';

import { useEffect, useRef, useMemo } from 'react';
import { createChart, LineSeries, HistogramSeries, ColorType, LineStyle, type IChartApi, type ISeriesApi, type Time, type LogicalRange } from 'lightweight-charts';
import { calculateMACD } from '@/lib/indicators';
import { X } from 'lucide-react';

interface MACDIndicatorProps {
  klines: { openTime: number; close: number }[];
  height?: number;
  onClose?: () => void;
  onVisibleRangeChange?: (range: LogicalRange | null) => void;
  visibleRange?: LogicalRange | null;
  theme?: 'dark' | 'light';
}

export function MACDIndicator({
  klines,
  height = 120,
  onClose,
  onVisibleRangeChange,
  visibleRange,
  theme = 'dark',
}: MACDIndicatorProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const histogramSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const macdSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const signalSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const zeroSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const isReadyRef = useRef(false);

  const isDark = theme === 'dark';

  // Calculate current MACD values (derived state, not useState)
  const currentValues = useMemo(() => {
    if (klines.length === 0) return { macd: null, signal: null, histogram: null };

    const closes = klines.map((k) => k.close);
    const macdResult = calculateMACD(closes, 12, 26, 9);

    const validMacd = macdResult.macd.filter((v) => !isNaN(v));
    const validSignal = macdResult.signal.filter((v) => !isNaN(v));
    const validHistogram = macdResult.histogram.filter((v) => !isNaN(v));

    return {
      macd: validMacd.length > 0 ? validMacd[validMacd.length - 1] : null,
      signal: validSignal.length > 0 ? validSignal[validSignal.length - 1] : null,
      histogram: validHistogram.length > 0 ? validHistogram[validHistogram.length - 1] : null,
    };
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
        mode: 0,
        horzLine: { color: isDark ? '#6b7280' : '#9ca3af', style: LineStyle.Dashed },
        vertLine: { color: isDark ? '#6b7280' : '#9ca3af', style: LineStyle.Dashed },
      },
    });

    chartRef.current = chart;

    // Histogram Series (must be added first so it's behind the lines)
    const histogramSeries = chart.addSeries(HistogramSeries, {
      priceLineVisible: false,
      lastValueVisible: false,
    });
    histogramSeriesRef.current = histogramSeries;

    // MACD Line Series
    const macdSeries = chart.addSeries(LineSeries, {
      color: '#3b82f6',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
    });
    macdSeriesRef.current = macdSeries;

    // Signal Line Series
    const signalSeries = chart.addSeries(LineSeries, {
      color: '#f97316',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
    });
    signalSeriesRef.current = signalSeries;

    // Zero line
    const zeroSeries = chart.addSeries(LineSeries, {
      color: '#6b7280',
      lineWidth: 1,
      lineStyle: LineStyle.Dotted,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });
    zeroSeriesRef.current = zeroSeries;

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
      histogramSeriesRef.current = null;
      macdSeriesRef.current = null;
      signalSeriesRef.current = null;
      zeroSeriesRef.current = null;
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
    if (!histogramSeriesRef.current || !macdSeriesRef.current || !signalSeriesRef.current || !zeroSeriesRef.current) return;

    // Calculate MACD
    const closes = klines.map((k) => k.close);
    const macdResult = calculateMACD(closes, 12, 26, 9);

    // Histogram data with colors
    const histogramData = macdResult.histogram
      .map((value, i) => ({
        time: Math.floor(klines[i].openTime / 1000) as Time,
        value: isNaN(value) ? undefined : value,
        color: value >= 0 ? (
          i > 0 && !isNaN(macdResult.histogram[i - 1]) && value > macdResult.histogram[i - 1]
            ? '#22c55e' // Green - increasing positive
            : '#166534' // Dark green - decreasing positive
        ) : (
          i > 0 && !isNaN(macdResult.histogram[i - 1]) && value < macdResult.histogram[i - 1]
            ? '#ef4444' // Red - increasing negative
            : '#7f1d1d' // Dark red - decreasing negative
        ),
      }))
      .filter((d) => d.value !== undefined) as { time: Time; value: number; color: string }[];

    histogramSeriesRef.current.setData(histogramData);

    // MACD line data
    const macdData = macdResult.macd
      .map((value, i) => ({
        time: Math.floor(klines[i].openTime / 1000) as Time,
        value: isNaN(value) ? undefined : value,
      }))
      .filter((d) => d.value !== undefined) as { time: Time; value: number }[];

    macdSeriesRef.current.setData(macdData);

    // Signal line data
    const signalData = macdResult.signal
      .map((value, i) => ({
        time: Math.floor(klines[i].openTime / 1000) as Time,
        value: isNaN(value) ? undefined : value,
      }))
      .filter((d) => d.value !== undefined) as { time: Time; value: number }[];

    signalSeriesRef.current.setData(signalData);

    // Zero line data
    const zeroData = klines.map((k) => ({
      time: Math.floor(k.openTime / 1000) as Time,
      value: 0,
    }));
    zeroSeriesRef.current.setData(zeroData);
  }, [klines]);

  // Sync visible range from parent
  useEffect(() => {
    if (chartRef.current && visibleRange) {
      chartRef.current.timeScale().setVisibleLogicalRange(visibleRange);
    }
  }, [visibleRange]);

  const formatValue = (value: number | null) => {
    if (value === null) return '-';
    return value.toFixed(2);
  };

  return (
    <div className="bg-gray-900/50 border-t border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-gray-400">MACD(12,26,9)</span>
          <div className="flex items-center gap-2 text-[10px]">
            <span>
              <span className="text-blue-400">MACD:</span>{' '}
              <span className={currentValues.macd !== null && currentValues.macd >= 0 ? 'text-green-400' : 'text-red-400'}>
                {formatValue(currentValues.macd)}
              </span>
            </span>
            <span>
              <span className="text-orange-400">Signal:</span>{' '}
              <span className="text-gray-300">{formatValue(currentValues.signal)}</span>
            </span>
            <span>
              <span className="text-gray-500">Hist:</span>{' '}
              <span className={currentValues.histogram !== null && currentValues.histogram >= 0 ? 'text-green-400' : 'text-red-400'}>
                {formatValue(currentValues.histogram)}
              </span>
            </span>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-800 rounded transition-colors"
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
