'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, LineSeries, ColorType, LineStyle, type IChartApi, type Time, type LogicalRange } from 'lightweight-charts';
import { calculateRSI } from '@/lib/indicators';
import { X } from 'lucide-react';

interface RSIIndicatorProps {
  klines: { openTime: number; close: number }[];
  height?: number;
  onClose?: () => void;
  onVisibleRangeChange?: (range: LogicalRange | null) => void;
  visibleRange?: LogicalRange | null;
}

export function RSIIndicator({
  klines,
  height = 100,
  onClose,
  onVisibleRangeChange,
  visibleRange,
}: RSIIndicatorProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [currentRSI, setCurrentRSI] = useState<number | null>(null);

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
        mode: 0, // Normal
        horzLine: { color: '#6b7280', style: LineStyle.Dashed },
        vertLine: { color: '#6b7280', style: LineStyle.Dashed },
      },
    });

    chartRef.current = chart;

    // Calculate RSI
    const closes = klines.map((k) => k.close);
    const rsiResult = calculateRSI(closes, 14);

    // RSI Line Series
    const rsiSeries = chart.addSeries(LineSeries, {
      color: '#8b5cf6',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
    });

    // Map RSI values to chart data
    const rsiData = rsiResult.values
      .map((value, i) => ({
        time: Math.floor(klines[i].openTime / 1000) as Time,
        value: isNaN(value) ? undefined : value,
      }))
      .filter((d) => d.value !== undefined) as { time: Time; value: number }[];

    rsiSeries.setData(rsiData);

    // Set current RSI value
    if (rsiData.length > 0) {
      setCurrentRSI(rsiData[rsiData.length - 1].value);
    }

    // Overbought line (70)
    const overboughtSeries = chart.addSeries(LineSeries, {
      color: '#ef4444',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });

    const overboughtData = klines.map((k) => ({
      time: Math.floor(k.openTime / 1000) as Time,
      value: 70,
    }));
    overboughtSeries.setData(overboughtData);

    // Oversold line (30)
    const oversoldSeries = chart.addSeries(LineSeries, {
      color: '#22c55e',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });

    const oversoldData = klines.map((k) => ({
      time: Math.floor(k.openTime / 1000) as Time,
      value: 30,
    }));
    oversoldSeries.setData(oversoldData);

    // Middle line (50)
    const middleSeries = chart.addSeries(LineSeries, {
      color: '#6b7280',
      lineWidth: 1,
      lineStyle: LineStyle.Dotted,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });

    const middleData = klines.map((k) => ({
      time: Math.floor(k.openTime / 1000) as Time,
      value: 50,
    }));
    middleSeries.setData(middleData);

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

  const getRSIColor = (value: number) => {
    if (value >= 70) return 'text-red-400';
    if (value <= 30) return 'text-green-400';
    return 'text-purple-400';
  };

  return (
    <div className="bg-gray-900/50 border-t border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-gray-400">RSI(14)</span>
          {currentRSI !== null && (
            <span className={`text-xs font-bold ${getRSIColor(currentRSI)}`}>
              {currentRSI.toFixed(2)}
            </span>
          )}
          <div className="flex items-center gap-2 text-[10px] text-gray-500">
            <span><span className="text-red-400">70</span> Overbought</span>
            <span><span className="text-green-400">30</span> Oversold</span>
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
