'use client';

import { useEffect, useRef, useState } from 'react';
import {
  createChart,
  ColorType,
  LineStyle,
  CrosshairMode,
  CandlestickSeries,
  LineSeries,
  type IChartApi,
  type ISeriesApi,
  type CandlestickSeriesOptions,
  type LineSeriesOptions,
} from 'lightweight-charts';
import type { Kline, Interval } from '@/lib/binance-klines';
import type { TechnicalLevels, FibLevel, Level } from '@/lib/technical-levels';
import type { TimeframeTradeSetup } from '@/lib/groq';
import type { LiquidationLevel } from '@/types/liquidations';
import type { Time } from 'lightweight-charts';

interface LightweightChartProps {
  symbol: string;
  interval: Interval;
  klines: Kline[];
  technicalLevels?: TechnicalLevels;
  tradeSetup?: TimeframeTradeSetup | null;
  liquidationLevels?: LiquidationLevel[];
  height?: number;
  showLevels?: boolean;
  showFibonacci?: boolean;
  showTradeSetup?: boolean;
  showLiquidations?: boolean;
  theme?: 'dark' | 'light';
}

export default function LightweightChart({
  symbol,
  interval,
  klines,
  technicalLevels,
  tradeSetup,
  liquidationLevels,
  height = 400,
  showLevels = true,
  showFibonacci = true,
  showTradeSetup = true,
  showLiquidations = false,
  theme = 'dark',
}: LightweightChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const candlestickSeriesRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);

  // Chart erstellen
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const isDark = theme === 'dark';

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: isDark ? '#1a1a2e' : '#ffffff' },
        textColor: isDark ? '#d1d5db' : '#374151',
      },
      grid: {
        vertLines: { color: isDark ? '#2d2d44' : '#e5e7eb' },
        horzLines: { color: isDark ? '#2d2d44' : '#e5e7eb' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: isDark ? '#6b7280' : '#9ca3af',
          width: 1,
          style: LineStyle.Dashed,
        },
        horzLine: {
          color: isDark ? '#6b7280' : '#9ca3af',
          width: 1,
          style: LineStyle.Dashed,
        },
      },
      rightPriceScale: {
        borderColor: isDark ? '#2d2d44' : '#e5e7eb',
      },
      timeScale: {
        borderColor: isDark ? '#2d2d44' : '#e5e7eb',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 12, // 10-15 Kerzen Abstand rechts für Price Label
      },
      width: chartContainerRef.current.clientWidth,
      height: height,
    });

    // Candlestick Series (v5 API)
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries as any;
    setIsReady(true);

    // Resize Handler
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      candlestickSeriesRef.current = null;
      setIsReady(false);
    };
  }, [height, theme]);

  // Klines Daten setzen
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

    // Fit content
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  }, [klines, isReady]);

  // Horizontale Linien für Level
  useEffect(() => {
    if (!chartRef.current || !isReady || !technicalLevels) return;
    if (klines.length === 0) return;

    const startTime = Math.floor(klines[0].openTime / 1000) as Time;
    const endTime = Math.floor(klines[klines.length - 1].openTime / 1000) as Time;

    // Support Lines (grün)
    if (showLevels && technicalLevels.supports) {
      technicalLevels.supports.forEach((level: Level) => {
        const series = chartRef.current!.addSeries(LineSeries, {
          color: '#22c55e',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        });

        series.setData([
          { time: startTime, value: level.price },
          { time: endTime, value: level.price },
        ]);
      });
    }

    // Resistance Lines (rot)
    if (showLevels && technicalLevels.resistances) {
      technicalLevels.resistances.forEach((level: Level) => {
        const series = chartRef.current!.addSeries(LineSeries, {
          color: '#ef4444',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        });

        series.setData([
          { time: startTime, value: level.price },
          { time: endTime, value: level.price },
        ]);
      });
    }

    // Fibonacci Level (blau, gepunktet)
    if (showFibonacci && technicalLevels.fibonacci) {
      const importantFibs = technicalLevels.fibonacci.filter(
        (f: FibLevel) => [0.382, 0.5, 0.618].includes(f.ratio)
      );

      importantFibs.forEach((fib: FibLevel) => {
        const series = chartRef.current!.addSeries(LineSeries, {
          color: '#3b82f6',
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        });

        series.setData([
          { time: startTime, value: fib.price },
          { time: endTime, value: fib.price },
        ]);
      });
    }
  }, [technicalLevels, klines, isReady, showLevels, showFibonacci]);

  // Trade Setup Overlay
  useEffect(() => {
    if (!chartRef.current || !isReady || !tradeSetup || !showTradeSetup) return;
    if (tradeSetup.type === 'wait') return;
    if (klines.length === 0) return;

    const entryPrice = typeof tradeSetup.entry === 'number' ? tradeSetup.entry : technicalLevels?.currentPrice || 0;
    if (entryPrice === 0) return;

    const startTime = Math.floor(klines[0].openTime / 1000) as Time;
    const endTime = Math.floor(klines[klines.length - 1].openTime / 1000) as Time;

    // Entry Line (gelb)
    const entrySeries = chartRef.current.addSeries(LineSeries, {
      color: '#eab308',
      lineWidth: 2,
      lineStyle: LineStyle.Solid,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });

    entrySeries.setData([
      { time: startTime, value: entryPrice },
      { time: endTime, value: entryPrice },
    ]);

    // Stop Loss (rot, dicker)
    const slSeries = chartRef.current.addSeries(LineSeries, {
      color: '#dc2626',
      lineWidth: 2,
      lineStyle: LineStyle.Solid,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });

    slSeries.setData([
      { time: startTime, value: tradeSetup.stopLoss },
      { time: endTime, value: tradeSetup.stopLoss },
    ]);

    // Take Profits (grün)
    tradeSetup.takeProfit.forEach((tp, index) => {
      const tpSeries = chartRef.current!.addSeries(LineSeries, {
        color: index === 0 ? '#16a34a' : '#4ade80',
        lineWidth: 2,
        lineStyle: LineStyle.Solid,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });

      tpSeries.setData([
        { time: startTime, value: tp },
        { time: endTime, value: tp },
      ]);
    });
  }, [tradeSetup, klines, isReady, showTradeSetup, technicalLevels]);

  // Liquidation Levels
  useEffect(() => {
    if (!chartRef.current || !isReady || !liquidationLevels || !showLiquidations) return;
    if (klines.length === 0 || liquidationLevels.length === 0) return;

    const startTime = Math.floor(klines[0].openTime / 1000) as Time;
    const endTime = Math.floor(klines[klines.length - 1].openTime / 1000) as Time;

    // Draw liquidation levels
    liquidationLevels.forEach((level) => {
      // Color based on type: red for long liqs, green for short liqs
      const color = level.type === 'long' ? '#ef4444' : '#22c55e';
      // Opacity based on leverage (higher leverage = more transparent)
      const opacity = Math.max(0.3, 1 - (level.leverage - 10) / 120);
      const colorWithOpacity = level.type === 'long'
        ? `rgba(239, 68, 68, ${opacity})`
        : `rgba(34, 197, 94, ${opacity})`;

      // Line style based on leverage
      const lineStyle = level.leverage <= 25 ? LineStyle.Dashed : LineStyle.Dotted;

      const series = chartRef.current!.addSeries(LineSeries, {
        color: colorWithOpacity,
        lineWidth: level.leverage <= 25 ? 2 : 1,
        lineStyle,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });

      series.setData([
        { time: startTime, value: level.price },
        { time: endTime, value: level.price },
      ]);
    });
  }, [liquidationLevels, klines, isReady, showLiquidations]);

  return (
    <div className="relative">
      <div ref={chartContainerRef} className="w-full" />

      {/* Legende */}
      <div className="absolute top-2 left-2 flex flex-wrap gap-2 text-xs">
        <span className="bg-gray-900/80 px-2 py-1 rounded text-white">
          {symbol} {interval}
        </span>
        {showLevels && (
          <>
            <span className="bg-gray-900/80 px-2 py-1 rounded text-green-500">
              S/R Support
            </span>
            <span className="bg-gray-900/80 px-2 py-1 rounded text-red-500">
              S/R Resistance
            </span>
          </>
        )}
        {showFibonacci && (
          <span className="bg-gray-900/80 px-2 py-1 rounded text-blue-500">
            Fibonacci
          </span>
        )}
        {showLiquidations && liquidationLevels && liquidationLevels.length > 0 && (
          <>
            <span className="bg-gray-900/80 px-2 py-1 rounded text-red-400">
              Long Liq
            </span>
            <span className="bg-gray-900/80 px-2 py-1 rounded text-green-400">
              Short Liq
            </span>
          </>
        )}
        {showTradeSetup && tradeSetup && tradeSetup.type !== 'wait' && (
          <>
            <span className="bg-gray-900/80 px-2 py-1 rounded text-yellow-500">
              Entry
            </span>
            <span className="bg-gray-900/80 px-2 py-1 rounded text-red-600">
              Stop Loss
            </span>
            <span className="bg-gray-900/80 px-2 py-1 rounded text-green-600">
              Take Profit
            </span>
          </>
        )}
      </div>

      {/* Trade Info Overlay */}
      {showTradeSetup && tradeSetup && tradeSetup.type !== 'wait' && (
        <div className="absolute top-2 right-2 bg-gray-900/90 p-2 rounded text-xs text-white">
          <div className={`font-bold ${tradeSetup.type === 'long' ? 'text-green-500' : 'text-red-500'}`}>
            {tradeSetup.type.toUpperCase()} - {tradeSetup.confidence}
          </div>
          <div>Entry: ${typeof tradeSetup.entry === 'number' ? tradeSetup.entry.toLocaleString() : 'Market'}</div>
          <div className="text-red-400">SL: ${tradeSetup.stopLoss.toLocaleString()}</div>
          <div className="text-green-400">TP: ${tradeSetup.takeProfit[0]?.toLocaleString()}</div>
          <div>RR: {tradeSetup.riskReward.toFixed(2)}</div>
        </div>
      )}
    </div>
  );
}
