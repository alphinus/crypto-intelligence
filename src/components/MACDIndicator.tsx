'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, LineSeries, HistogramSeries, ColorType, LineStyle, type IChartApi, type Time, type LogicalRange } from 'lightweight-charts';
import { calculateMACD } from '@/lib/indicators';
import { X } from 'lucide-react';

interface MACDIndicatorProps {
  klines: { openTime: number; close: number }[];
  height?: number;
  onClose?: () => void;
  onVisibleRangeChange?: (range: LogicalRange | null) => void;
  visibleRange?: LogicalRange | null;
}

export function MACDIndicator({
  klines,
  height = 120,
  onClose,
  onVisibleRangeChange,
  visibleRange,
}: MACDIndicatorProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [currentValues, setCurrentValues] = useState<{
    macd: number | null;
    signal: number | null;
    histogram: number | null;
  }>({ macd: null, signal: null, histogram: null });

  useEffect(() => {
    if (!chartContainerRef.current || klines.length === 0) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#111827' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: '#1f2937' },
        horzLines: { color: '#1f2937' },
      },
      rightPriceScale: {
        borderColor: '#1f2937',
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: '#1f2937',
        timeVisible: true,
        secondsVisible: false,
        visible: false, // Hide time scale - synced with main chart
      },
      width: chartContainerRef.current.clientWidth,
      height,
      crosshair: {
        mode: 0,
        horzLine: { color: '#6b7280', style: LineStyle.Dashed },
        vertLine: { color: '#6b7280', style: LineStyle.Dashed },
      },
    });

    chartRef.current = chart;

    // Calculate MACD
    const closes = klines.map((k) => k.close);
    const macdResult = calculateMACD(closes, 12, 26, 9);

    // Histogram Series (must be added first so it's behind the lines)
    const histogramSeries = chart.addSeries(HistogramSeries, {
      priceLineVisible: false,
      lastValueVisible: false,
    });

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

    histogramSeries.setData(histogramData);

    // MACD Line Series
    const macdSeries = chart.addSeries(LineSeries, {
      color: '#3b82f6',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
    });

    const macdData = macdResult.macd
      .map((value, i) => ({
        time: Math.floor(klines[i].openTime / 1000) as Time,
        value: isNaN(value) ? undefined : value,
      }))
      .filter((d) => d.value !== undefined) as { time: Time; value: number }[];

    macdSeries.setData(macdData);

    // Signal Line Series
    const signalSeries = chart.addSeries(LineSeries, {
      color: '#f97316',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
    });

    const signalData = macdResult.signal
      .map((value, i) => ({
        time: Math.floor(klines[i].openTime / 1000) as Time,
        value: isNaN(value) ? undefined : value,
      }))
      .filter((d) => d.value !== undefined) as { time: Time; value: number }[];

    signalSeries.setData(signalData);

    // Zero line
    const zeroSeries = chart.addSeries(LineSeries, {
      color: '#6b7280',
      lineWidth: 1,
      lineStyle: LineStyle.Dotted,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });

    const zeroData = klines.map((k) => ({
      time: Math.floor(k.openTime / 1000) as Time,
      value: 0,
    }));
    zeroSeries.setData(zeroData);

    // Set current values
    if (macdData.length > 0 && signalData.length > 0 && histogramData.length > 0) {
      setCurrentValues({
        macd: macdData[macdData.length - 1].value,
        signal: signalData[signalData.length - 1].value,
        histogram: histogramData[histogramData.length - 1].value,
      });
    }

    // Subscribe to visible range changes
    if (onVisibleRangeChange) {
      chart.timeScale().subscribeVisibleLogicalRangeChange(onVisibleRangeChange);
    }

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [klines, height, onVisibleRangeChange]);

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
