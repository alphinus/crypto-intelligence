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
  type LogicalRange,
} from 'lightweight-charts';
import { BarChart2, TrendingUp, TrendingDown, Eye, EyeOff, Clock, Activity, BarChart3, Sparkles, LayoutList, PanelRight } from 'lucide-react';
import { IndicatorPanel, type IndicatorType } from './IndicatorPanel';
import type { Kline, Interval } from '@/lib/binance-klines';

// Overlay Visibility State
interface OverlayVisibility {
  emas: boolean;
  supportResistance: boolean;
  goldenZone: boolean;
  tradeZones: boolean;
}
import { calculateEMA } from '@/lib/binance-klines';
import type { TechnicalLevels, Level, FibLevel } from '@/lib/technical-levels';
import type { TimeframeTradeSetup } from '@/lib/groq';

// EMA Preset Types
type EMAPreset = 'scalping' | 'mtf' | 'position' | 'off';

interface EMAPresetConfig {
  periods: number[];
  colors: string[];
  labels: string[];
}

const EMA_PRESETS: Record<Exclude<EMAPreset, 'off'>, EMAPresetConfig> = {
  scalping: {
    periods: [9, 21, 55],
    colors: ['#f59e0b', '#3b82f6', '#8b5cf6'],
    labels: ['EMA 9', 'EMA 21', 'EMA 55'],
  },
  mtf: {
    periods: [20, 50, 200],
    colors: ['#f59e0b', '#3b82f6', '#8b5cf6'],
    labels: ['EMA 20', 'EMA 50', 'EMA 200'],
  },
  position: {
    periods: [50, 200, 300],
    colors: ['#eab308', '#3b82f6', '#a855f7'],
    labels: ['EMA 50', 'EMA 200', 'EMA 300'],
  },
};

const PRESET_LABELS: Record<EMAPreset, string> = {
  scalping: 'Scalping',
  mtf: 'Multi-TF',
  position: '4H/1D',
  off: 'Off',
};

// Timeframe to milliseconds mapping for countdown
const TIMEFRAME_MS: Record<string, number> = {
  '1m': 60_000,
  '3m': 180_000,
  '5m': 300_000,
  '15m': 900_000,
  '1h': 3_600_000,
  '4h': 14_400_000,
  '1d': 86_400_000,
};

// Candle Countdown Component
function CandleCountdown({ timeframe, theme }: { timeframe: string, theme?: 'dark' | 'light' }) {
  const [countdown, setCountdown] = useState('--:--');

  useEffect(() => {
    const intervalMs = TIMEFRAME_MS[timeframe] || 60_000;

    const updateCountdown = () => {
      const now = Date.now();
      const nextCandle = Math.ceil(now / intervalMs) * intervalMs;
      const remaining = nextCandle - now;

      if (remaining < 0) {
        setCountdown('00:00');
        return;
      }

      const hours = Math.floor(remaining / 3_600_000);
      const minutes = Math.floor((remaining % 3_600_000) / 60_000);
      const seconds = Math.floor((remaining % 60_000) / 1000);

      if (hours > 0) {
        setCountdown(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setCountdown(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [timeframe]);

  const isDark = theme === 'dark' || !theme;

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs ${isDark ? 'bg-gray-800/50' : 'bg-gray-100 text-gray-900 border border-gray-200'}`}>
      <Clock className={`w-3 h-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
      <span className={isDark ? 'text-gray-500' : 'text-gray-600'}>Kerze:</span>
      <span className="font-mono text-blue-400">{countdown}</span>
    </div>
  );
}

interface ConfluenceZone {
  price: number;
  timeframes: string[];
  type: 'support' | 'resistance';
}

interface InlineChartProps {
  symbol: string;
  klines: Kline[];
  technicalLevels?: TechnicalLevels;
  tradeSetup?: TimeframeTradeSetup | null;
  selectedTimeframe: Interval;
  onTimeframeChange: (tf: Interval) => void;
  height?: number;
  theme?: 'dark' | 'light';
  confluenceZones?: ConfluenceZone[];
  onAiAnalyze?: () => void;
  isAnalyzing?: boolean;
  tradeSignalsCount?: number;
  onLayoutChange?: (layout: 'below' | 'sidebar') => void;
  currentLayout?: 'below' | 'sidebar';
}

// Note: 1m and 3m are hidden due to high latency (250-800ms) making them unsuitable for scalping
// The data is still available in the API, but the UI buttons are hidden
const TIMEFRAMES: { value: Interval; label: string; hidden?: boolean }[] = [
  { value: '1m', label: '1m', hidden: true },
  { value: '3m', label: '3m', hidden: true },
  { value: '5m', label: '5m' },
  { value: '15m', label: '15m' },
  { value: '1h', label: '1H' },
  { value: '4h', label: '4H' },
  { value: '1d', label: '1D' },
];

export function InlineChart({
  symbol,
  klines,
  technicalLevels,
  tradeSetup,
  selectedTimeframe,
  onTimeframeChange,
  height = 450,
  theme = 'dark',
  confluenceZones = [],
  onAiAnalyze,
  isAnalyzing = false,
  tradeSignalsCount = 0,
  onLayoutChange,
  currentLayout = 'below',
}: InlineChartProps) {
  const isDark = theme === 'dark';

  // Theme-based style classes
  const styles = {
    container: isDark ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200 shadow-sm',
    header: isDark ? 'border-gray-800' : 'border-gray-100',
    textMain: isDark ? 'text-white' : 'text-gray-900',
    textMuted: isDark ? 'text-gray-400' : 'text-gray-500',
    buttonActive: 'bg-blue-600 text-white',
    buttonInactive: isDark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900',
    overlayBg: isDark ? 'bg-gray-900/95' : 'bg-white/95 shadow-md',
    controlsBg: isDark ? 'bg-gray-800/30 border-gray-800' : 'bg-gray-50 border-gray-100',
  };
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const emaSeriesRefs = useRef<ISeriesApi<'Line'>[]>([]);
  const goldenZoneSeriesRef = useRef<ISeriesApi<'Baseline'> | null>(null);
  const tpZoneSeriesRef = useRef<ISeriesApi<'Baseline'> | null>(null);
  const slZoneSeriesRef = useRef<ISeriesApi<'Baseline'> | null>(null);
  const priceLinesRef = useRef<IPriceLine[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [emaPreset, setEmaPreset] = useState<EMAPreset>('mtf');
  const [overlayVisibility, setOverlayVisibility] = useState<OverlayVisibility>({
    emas: true,
    supportResistance: true,
    goldenZone: true,
    tradeZones: true,
  });
  const [activeIndicators, setActiveIndicators] = useState<IndicatorType[]>(['rsi', 'macd', 'stochrsi', 'atr']);
  const [visibleRange, setVisibleRange] = useState<LogicalRange | null>(null);

  // Toggle individual overlay
  const toggleOverlay = (key: keyof OverlayVisibility) => {
    setOverlayVisibility(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Toggle indicator
  const toggleIndicator = (indicator: IndicatorType) => {
    setActiveIndicators(prev =>
      prev.includes(indicator)
        ? prev.filter(i => i !== indicator)
        : [...prev, indicator]
    );
  };

  // Remove indicator
  const removeIndicator = (indicator: IndicatorType) => {
    setActiveIndicators(prev => prev.filter(i => i !== indicator));
  };

  // Handle visible range change from main chart
  const handleVisibleRangeChange = useCallback((range: LogicalRange | null) => {
    setVisibleRange(range);
  }, []);

  // Toggle all overlays on/off
  const toggleAllOverlays = () => {
    const allOn = Object.values(overlayVisibility).every(v => v);
    setOverlayVisibility({
      emas: !allOn,
      supportResistance: !allOn,
      goldenZone: !allOn,
      tradeZones: !allOn,
    });
  };

  // Calculate EMAs based on preset
  const calculatedEmas = useMemo(() => {
    if (klines.length === 0 || emaPreset === 'off') return null;

    const closes = klines.map((k) => k.close);
    const preset = EMA_PRESETS[emaPreset];

    return preset.periods.map((period, idx) => {
      const emaValues = calculateEMA(closes, period);
      return {
        period,
        values: emaValues,
        currentValue: emaValues.length > 0 ? emaValues[emaValues.length - 1] : null,
        color: preset.colors[idx],
        label: preset.labels[idx],
      };
    });
  }, [klines, emaPreset]);

  // Get Golden Zone prices from Fibonacci
  const goldenZone = useMemo(() => {
    if (!technicalLevels?.fibonacci || technicalLevels.fibonacci.length === 0) return null;

    const fib382 = technicalLevels.fibonacci.find((f) => Math.abs(f.ratio - 0.382) < 0.01);
    const fib618 = technicalLevels.fibonacci.find((f) => Math.abs(f.ratio - 0.618) < 0.01);

    if (!fib382 || !fib618) return null;

    return {
      top: Math.max(fib382.price, fib618.price),
      bottom: Math.min(fib382.price, fib618.price),
      label: 'Golden Zone (38.2% - 61.8%)',
    };
  }, [technicalLevels?.fibonacci]);

  // Clear all price lines
  const clearPriceLines = useCallback(() => {
    priceLinesRef.current.forEach((line) => {
      try {
        candlestickSeriesRef.current?.removePriceLine(line);
      } catch {
        // Line might already be removed
      }
    });
    priceLinesRef.current = [];
  }, []);

  // Clear EMA series
  const clearEmaSeries = useCallback(() => {
    emaSeriesRefs.current.forEach((series) => {
      try {
        chartRef.current?.removeSeries(series);
      } catch {
        // Series might already be removed
      }
    });
    emaSeriesRefs.current = [];
  }, []);

  // Clear Golden Zone series
  const clearGoldenZoneSeries = useCallback(() => {
    if (goldenZoneSeriesRef.current) {
      try {
        chartRef.current?.removeSeries(goldenZoneSeriesRef.current);
      } catch {
        // Series might already be removed
      }
      goldenZoneSeriesRef.current = null;
    }
  }, []);

  // Clear TP Zone series
  const clearTpZoneSeries = useCallback(() => {
    if (tpZoneSeriesRef.current) {
      try {
        chartRef.current?.removeSeries(tpZoneSeriesRef.current);
      } catch {
        // Series might already be removed
      }
      tpZoneSeriesRef.current = null;
    }
  }, []);

  // Clear SL Zone series
  const clearSlZoneSeries = useCallback(() => {
    if (slZoneSeriesRef.current) {
      try {
        chartRef.current?.removeSeries(slZoneSeriesRef.current);
      } catch {
        // Series might already be removed
      }
      slZoneSeriesRef.current = null;
    }
  }, []);

  // Chart erstellen
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
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      timeScale: {
        borderColor: isDark ? '#1f2937' : '#e5e7eb',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 15, // 10-15 Kerzen Abstand rechts für Price Label
        barSpacing: 6,
      },
      handleScroll: {
        mouseWheel: false, // Disable scroll zoom to prevent page scroll hijacking
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: false, // Allow vertical page scroll on touch
      },
      handleScale: {
        mouseWheel: false, // Disable scroll zoom
        pinch: true, // Allow pinch-to-zoom on touch devices
        axisPressedMouseMove: true,
      },
      width: chartContainerRef.current.clientWidth,
      height: height,
    });

    // Candlestick Series
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

    // Use ResizeObserver for responsive chart resizing
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
      clearTpZoneSeries();
      clearSlZoneSeries();
      chart.remove();
      chartRef.current = null;
      candlestickSeriesRef.current = null;
      setIsReady(false);
    };
  }, [height, symbol, isDark, clearPriceLines, clearEmaSeries, clearGoldenZoneSeries, clearTpZoneSeries, clearSlZoneSeries]);

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

    // Fit content with some padding
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  }, [klines, isReady]);

  // Auto-zoom when symbol changes
  useEffect(() => {
    if (chartRef.current && isReady && klines.length > 0) {
      // Small delay to ensure data is loaded before fitting
      const timeout = setTimeout(() => {
        chartRef.current?.timeScale().fitContent();
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [symbol, isReady]);

  // Subscribe to visible range changes for indicator sync
  useEffect(() => {
    if (!chartRef.current || !isReady) return;

    const timeScale = chartRef.current.timeScale();
    timeScale.subscribeVisibleLogicalRangeChange(handleVisibleRangeChange);

    return () => {
      timeScale.unsubscribeVisibleLogicalRangeChange(handleVisibleRangeChange);
    };
  }, [isReady, handleVisibleRangeChange]);

  // EMA Linien zeichnen
  useEffect(() => {
    // Always clear old EMAs first
    clearEmaSeries();

    // If EMAs disabled or no data, just return after clearing
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

      // EMA Daten an Klines ausrichten
      const startIndex = klines.length - ema.values.length;
      const emaData = ema.values.map((value, i) => ({
        time: Math.floor(klines[startIndex + i].openTime / 1000) as Time,
        value,
      }));
      emaSeries.setData(emaData);
      emaSeriesRefs.current.push(emaSeries);
    });
  }, [calculatedEmas, klines, isReady, clearEmaSeries, overlayVisibility.emas]);

  // Price Lines für S/R, Entry/SL/TP, Golden Zone
  useEffect(() => {
    if (!candlestickSeriesRef.current || !chartRef.current || !isReady || klines.length === 0) return;

    // Clear old price lines, golden zone, TP zone and SL zone
    clearPriceLines();
    clearGoldenZoneSeries();
    clearTpZoneSeries();
    clearSlZoneSeries();

    const currentPrice = klines[klines.length - 1].close;

    // Support Lines with Labels (only if S/R overlay is visible)
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

    // Resistance Lines with Labels (only if S/R overlay is visible)
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

    // Golden Zone as filled band between 38.2% and 61.8% (only if Golden Zone overlay is visible)
    if (overlayVisibility.goldenZone && goldenZone && chartRef.current) {
      // Time data for baseline series - data points at 61.8% (top), baseline at 38.2% (bottom)
      const timeData = klines.map((k) => ({
        time: (k.openTime / 1000) as Time,
        value: goldenZone.top, // Data at top of zone (61.8%)
      }));

      // BaselineSeries fills between data and baseline
      const baselineSeries = chartRef.current.addSeries(BaselineSeries, {
        baseValue: { type: 'price', price: goldenZone.bottom }, // Baseline at 38.2%
        topLineColor: 'rgba(59, 130, 246, 0.6)', // Line at 61.8%
        topFillColor1: 'rgba(59, 130, 246, 0.2)', // Fill color near top
        topFillColor2: 'rgba(59, 130, 246, 0.1)', // Fill color near baseline
        bottomLineColor: 'transparent', // No line below baseline
        bottomFillColor1: 'transparent', // No fill below baseline
        bottomFillColor2: 'transparent',
        lineWidth: 1,
        lineStyle: LineStyle.Dotted,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      baselineSeries.setData(timeData);
      goldenZoneSeriesRef.current = baselineSeries;

      // Add PriceLine labels for 38.2% and 61.8%
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

    // Trade Setup Lines (Entry, SL, TP) - always visible if trade setup exists
    if (tradeSetup && tradeSetup.type !== 'wait') {
      const entryPrice = typeof tradeSetup.entry === 'number' ? tradeSetup.entry : currentPrice;

      // Entry Line - always visible
      const entryLine = candlestickSeriesRef.current!.createPriceLine({
        price: entryPrice,
        color: '#f97316',
        lineWidth: 2,
        lineStyle: LineStyle.Solid,
        axisLabelVisible: true,
        title: 'ENTRY',
      });
      priceLinesRef.current.push(entryLine);

      // Stop Loss Line - always visible
      const slLine = candlestickSeriesRef.current!.createPriceLine({
        price: tradeSetup.stopLoss,
        color: '#dc2626',
        lineWidth: 2,
        lineStyle: LineStyle.Solid,
        axisLabelVisible: true,
        title: 'SL',
      });
      priceLinesRef.current.push(slLine);

      // Take Profit Lines - always visible with graduated colors
      const tpColors = ['#22c55e', '#16a34a', '#15803d']; // Light to dark green
      const tpStyles = [LineStyle.Dashed, LineStyle.Dashed, LineStyle.Solid];
      tradeSetup.takeProfit.forEach((tp, index) => {
        if (tp) {
          const tpLine = candlestickSeriesRef.current!.createPriceLine({
            price: tp,
            color: tpColors[index] || '#16a34a',
            lineWidth: index === 2 ? 2 : 1, // TP3 thicker
            lineStyle: tpStyles[index] || LineStyle.Solid,
            axisLabelVisible: true,
            title: `TP${index + 1}`,
          });
          priceLinesRef.current.push(tpLine);
        }
      });

      // Trade Zones (TP/SL Shading) - only if tradeZones overlay is visible
      if (overlayVisibility.tradeZones) {
        // Get time data for future zones (10 candles into the future)
        const lastKline = klines[klines.length - 1];
        const secondLastKline = klines.length > 1 ? klines[klines.length - 2] : lastKline;
        const candleInterval = lastKline.openTime - secondLastKline.openTime;

        const createFutureTimeData = (value: number): { time: Time; value: number }[] => {
          const data: { time: Time; value: number }[] = [];
          for (let i = 0; i <= 10; i++) {
            const futureTime = lastKline.openTime + candleInterval * i;
            data.push({
              time: (futureTime / 1000) as Time,
              value,
            });
          }
          return data;
        };

        const isLong = tradeSetup.type === 'long';

        // TP Zone (always GREEN) - from Entry to TP3 (full zone)
        // For LONG: TP is above entry
        // For SHORT: TP is below entry
        const tp3 = tradeSetup.takeProfit[2] || tradeSetup.takeProfit[tradeSetup.takeProfit.length - 1];
        if (tp3 && chartRef.current) {
          if (isLong) {
            // LONG: TP above entry - baseline at entry, data at TP3
            const tpZoneSeries = chartRef.current.addSeries(BaselineSeries, {
              baseValue: { type: 'price', price: entryPrice },
              topLineColor: 'rgba(34, 197, 94, 0.4)',
              topFillColor1: 'rgba(34, 197, 94, 0.2)',
              topFillColor2: 'rgba(34, 197, 94, 0.05)',
              bottomLineColor: 'transparent',
              bottomFillColor1: 'transparent',
              bottomFillColor2: 'transparent',
              lineWidth: 1,
              lineStyle: LineStyle.Dotted,
              priceLineVisible: false,
              lastValueVisible: false,
            });
            tpZoneSeries.setData(createFutureTimeData(tp3));
            tpZoneSeriesRef.current = tpZoneSeries;
          } else {
            // SHORT: TP below entry - baseline at entry, fill below to TP3
            const tpZoneSeries = chartRef.current.addSeries(BaselineSeries, {
              baseValue: { type: 'price', price: entryPrice },
              topLineColor: 'transparent',
              topFillColor1: 'transparent',
              topFillColor2: 'transparent',
              bottomLineColor: 'rgba(34, 197, 94, 0.4)',
              bottomFillColor1: 'rgba(34, 197, 94, 0.2)',
              bottomFillColor2: 'rgba(34, 197, 94, 0.05)',
              lineWidth: 1,
              lineStyle: LineStyle.Dotted,
              priceLineVisible: false,
              lastValueVisible: false,
            });
            tpZoneSeries.setData(createFutureTimeData(tp3));
            tpZoneSeriesRef.current = tpZoneSeries;
          }
        }

        // SL Zone (always RED) - from Entry to Stop Loss
        // For LONG: SL is below entry
        // For SHORT: SL is above entry
        if (tradeSetup.stopLoss && chartRef.current) {
          if (isLong) {
            // LONG: SL below entry - baseline at entry, fill below
            const slZoneSeries = chartRef.current.addSeries(BaselineSeries, {
              baseValue: { type: 'price', price: entryPrice },
              topLineColor: 'transparent',
              topFillColor1: 'transparent',
              topFillColor2: 'transparent',
              bottomLineColor: 'rgba(239, 68, 68, 0.6)',
              bottomFillColor1: 'rgba(239, 68, 68, 0.3)',
              bottomFillColor2: 'rgba(239, 68, 68, 0.15)',
              lineWidth: 1,
              lineStyle: LineStyle.Dotted,
              priceLineVisible: false,
              lastValueVisible: false,
            });
            slZoneSeries.setData(createFutureTimeData(tradeSetup.stopLoss));
            slZoneSeriesRef.current = slZoneSeries;
          } else {
            // SHORT: SL above entry - baseline at entry, fill above
            const slZoneSeries = chartRef.current.addSeries(BaselineSeries, {
              baseValue: { type: 'price', price: entryPrice },
              topLineColor: 'rgba(239, 68, 68, 0.6)',
              topFillColor1: 'rgba(239, 68, 68, 0.3)',
              topFillColor2: 'rgba(239, 68, 68, 0.15)',
              bottomLineColor: 'transparent',
              bottomFillColor1: 'transparent',
              bottomFillColor2: 'transparent',
              lineWidth: 1,
              lineStyle: LineStyle.Dotted,
              priceLineVisible: false,
              lastValueVisible: false,
            });
            slZoneSeries.setData(createFutureTimeData(tradeSetup.stopLoss));
            slZoneSeriesRef.current = slZoneSeries;
          }
        }
      }
    }

    // EMA Labels on price axis (only if EMAs overlay is visible)
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

    // Confluence Zones - show strong multi-timeframe levels
    if (confluenceZones && confluenceZones.length > 0) {
      // Only show top 3 confluence zones to avoid clutter
      confluenceZones.slice(0, 3).forEach((zone) => {
        const isSupport = zone.type === 'support';
        const strength = zone.timeframes.length;
        const lineWidth = strength >= 4 ? 2 : 1;

        const priceLine = candlestickSeriesRef.current!.createPriceLine({
          price: zone.price,
          color: isSupport ? 'rgba(168, 85, 247, 0.8)' : 'rgba(236, 72, 153, 0.8)', // Purple for support, Pink for resistance
          lineWidth,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title: `${isSupport ? 'CS' : 'CR'}${strength}`, // CS = Confluence Support, CR = Confluence Resistance
        });
        priceLinesRef.current.push(priceLine);
      });
    }

  }, [technicalLevels, tradeSetup, goldenZone, klines, isReady, calculatedEmas, clearPriceLines, clearGoldenZoneSeries, clearTpZoneSeries, clearSlZoneSeries, overlayVisibility, confluenceZones]);

  // Aktueller Preis und Trend
  const currentPrice = klines.length > 0 ? klines[klines.length - 1].close : 0;
  const priceChange = klines.length > 1
    ? ((currentPrice - klines[0].close) / klines[0].close) * 100
    : 0;

  // Format price based on magnitude - improved for shitcoins
  const formatPrice = (price: number) => {
    if (price >= 10000) {
      return price.toLocaleString('en-US', { maximumFractionDigits: 0 });
    } else if (price >= 100) {
      return price.toLocaleString('en-US', { maximumFractionDigits: 2 });
    } else if (price >= 1) {
      return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    } else if (price >= 0.01) {
      return price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 });
    } else if (price >= 0.0001) {
      return price.toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 8 });
    } else {
      // Very small prices (shitcoins like PEPE, SHIB)
      return price.toLocaleString('en-US', { minimumFractionDigits: 8, maximumFractionDigits: 10 });
    }
  };

  return (
    <div className={`${styles.container} border rounded-lg overflow-hidden`}>
      {/* Header mit Timeframe-Switcher und EMA-Presets */}
      <div className={`flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b ${styles.header}`}>
        <div className="flex items-center gap-3">
          <BarChart2 className="w-5 h-5 text-blue-400" />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className={`font-semibold leading-tight ${styles.textMain}`}>{symbol.toUpperCase()}/USDT</span>
              {tradeSignalsCount > 0 && (
                <div className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[9px] rounded font-bold border border-blue-500/20">
                  {tradeSignalsCount} SIGNALE
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold leading-none ${styles.textMain}`}>
                ${formatPrice(currentPrice)}
              </span>
              <span className={`flex items-center gap-0.5 text-[10px] ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {priceChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Timeframe Switcher */}
          <div className="flex gap-1">
            {TIMEFRAMES.filter(tf => !tf.hidden).map((tf) => (
              <button
                key={tf.value}
                onClick={() => onTimeframeChange(tf.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${selectedTimeframe === tf.value
                  ? styles.buttonActive
                  : styles.buttonInactive
                  }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {/* Candle Countdown Timer */}
          <CandleCountdown timeframe={selectedTimeframe} theme={theme} />

          {/* AI Analysis Button Slot */}
          {onAiAnalyze && (
            <button
              onClick={onAiAnalyze}
              disabled={isAnalyzing}
              className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 rounded-lg text-xs font-medium transition-all shadow-lg shadow-purple-500/10 active:scale-95"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-pulse' : ''}`} />
              <span>{isAnalyzing ? 'Analysiere...' : 'KI Analyse'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Overlay Toggles Row */}
      <div className={`flex items-center justify-between px-4 py-2 border-b ${styles.controlsBg}`}>
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500 mr-2">Overlays:</span>

          {/* Toggle All Button */}
          <button
            onClick={toggleAllOverlays}
            className={`flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded transition-colors ${Object.values(overlayVisibility).every(v => v)
              ? styles.buttonActive
              : isDark ? 'bg-gray-700 text-gray-400 hover:bg-gray-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            title="Alle Overlays ein/ausblenden"
          >
            {Object.values(overlayVisibility).every(v => v) ? (
              <Eye className="w-3 h-3" />
            ) : (
              <EyeOff className="w-3 h-3" />
            )}
            Alle
          </button>

          <div className="w-px h-4 bg-gray-700 mx-1" />

          {/* EMAs Toggle */}
          <button
            onClick={() => toggleOverlay('emas')}
            className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${overlayVisibility.emas
              ? 'bg-purple-600/80 text-white'
              : 'bg-gray-700 text-gray-500 line-through'
              }`}
          >
            EMAs
          </button>

          {/* S/R Toggle */}
          <button
            onClick={() => toggleOverlay('supportResistance')}
            className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${overlayVisibility.supportResistance
              ? 'bg-emerald-600/80 text-white'
              : 'bg-gray-700 text-gray-500 line-through'
              }`}
          >
            S/R
          </button>

          {/* Golden Zone Toggle */}
          <button
            onClick={() => toggleOverlay('goldenZone')}
            className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${overlayVisibility.goldenZone
              ? 'bg-blue-600/80 text-white'
              : 'bg-gray-700 text-gray-500 line-through'
              }`}
          >
            Golden Zone
          </button>

          {/* Trade Zones Toggle */}
          <button
            onClick={() => toggleOverlay('tradeZones')}
            className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${overlayVisibility.tradeZones
              ? 'bg-orange-600/80 text-white'
              : 'bg-gray-700 text-gray-500 line-through'
              }`}
          >
            Trade Zones
          </button>

          <div className="w-px h-4 bg-gray-700 mx-1" />
          <span className="text-xs text-gray-500">Indikatoren:</span>

          {/* RSI Toggle */}
          <button
            onClick={() => toggleIndicator('rsi')}
            className={`flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded transition-colors ${activeIndicators.includes('rsi')
              ? 'bg-purple-600 text-white'
              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
          >
            <Activity className="w-3 h-3" />
            RSI
          </button>

          {/* MACD Toggle */}
          <button
            onClick={() => toggleIndicator('macd')}
            className={`flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded transition-colors ${activeIndicators.includes('macd')
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
          >
            <BarChart3 className="w-3 h-3" />
            MACD
          </button>

          {/* StochRSI Toggle */}
          <button
            onClick={() => toggleIndicator('stochrsi')}
            className={`flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded transition-colors ${activeIndicators.includes('stochrsi')
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
          >
            <TrendingUp className="w-3 h-3" />
            StochRSI
          </button>

          {/* ATR Toggle */}
          <button
            onClick={() => toggleIndicator('atr')}
            className={`flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded transition-colors ${activeIndicators.includes('atr')
              ? 'bg-amber-600 text-white'
              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
          >
            <Activity className="w-3 h-3" />
            ATR
          </button>

          {onLayoutChange && (
            <>
              <div className="w-px h-4 bg-gray-700 mx-1" />
              <div className="flex items-center gap-1 bg-gray-900/50 rounded p-0.5 border border-gray-700/50">
                <button
                  onClick={() => onLayoutChange('below')}
                  className={`p-1 rounded transition-colors ${currentLayout === 'below' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                  title="Signale unten"
                >
                  <LayoutList className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onLayoutChange('sidebar')}
                  className={`p-1 rounded transition-colors ${currentLayout === 'sidebar' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                  title="Signale rechts"
                >
                  <PanelRight className="w-3 h-3" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Quick Info */}
        <div className="text-[10px] text-gray-500">
          {!overlayVisibility.emas && !overlayVisibility.supportResistance && !overlayVisibility.goldenZone && !overlayVisibility.tradeZones
            ? 'Nur Candles + Trade-Setup'
            : `${[
              overlayVisibility.emas && 'EMAs',
              overlayVisibility.supportResistance && 'S/R',
              overlayVisibility.goldenZone && 'Fib',
              overlayVisibility.tradeZones && 'Zones',
            ].filter(Boolean).join(' • ')}`
          }
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative">
        {/* Loading Skeleton */}
        {!isReady && (
          <div
            className="w-full flex items-center justify-center bg-gray-800/50"
            style={{ height: `${height}px` }}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-gray-400 text-sm">Chart wird geladen...</span>
            </div>
          </div>
        )}
        <div ref={chartContainerRef} className={`w-full ${!isReady ? 'invisible absolute' : ''}`} />

        {/* Legende - only show visible overlays */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1.5 text-[9px]">
          {overlayVisibility.emas && calculatedEmas?.map((ema, idx) => (
            <span
              key={idx}
              className={`${styles.overlayBg} px-1.5 py-0.5 rounded border`}
              style={{ color: ema.color, borderColor: `${ema.color}40` }}
            >
              {ema.label}
            </span>
          ))}
          {overlayVisibility.supportResistance && (
            <>
              <span className={`${styles.overlayBg} px-1.5 py-0.5 rounded text-green-500 border border-green-500/30`}>
                Support
              </span>
              <span className={`${styles.overlayBg} px-1.5 py-0.5 rounded text-red-500 border border-red-500/30`}>
                Resistance
              </span>
            </>
          )}
          {overlayVisibility.goldenZone && goldenZone && (
            <span className="bg-gray-900/90 px-1.5 py-0.5 rounded text-blue-400 border border-blue-400/30">
              Golden Zone
            </span>
          )}
          {overlayVisibility.tradeZones && tradeSetup && tradeSetup.type !== 'wait' && tradeSetup.takeProfit[0] && (
            <span className="bg-gray-900/90 px-1.5 py-0.5 rounded text-green-400 border border-green-400/30">
              TP Zone
            </span>
          )}
          {overlayVisibility.tradeZones && tradeSetup && tradeSetup.type !== 'wait' && tradeSetup.stopLoss && (
            <span className="bg-gray-900/90 px-1.5 py-0.5 rounded text-red-400 border border-red-400/30">
              SL Zone
            </span>
          )}
        </div>

        {overlayVisibility.emas && calculatedEmas && (
          <div className={`absolute top-2 right-2 ${styles.overlayBg} p-2 rounded text-[10px] space-y-0.5 border ${styles.header}`}>
            {calculatedEmas.map((ema, idx) => (
              ema.currentValue && (
                <div key={idx} className="flex justify-between gap-3">
                  <span style={{ color: ema.color }}>{ema.label}:</span>
                  <span className={`${styles.textMain} font-mono`}>${formatPrice(ema.currentValue)}</span>
                </div>
              )
            ))}
          </div>
        )}

        {/* Golden Zone Info - only if Golden Zone visible */}
        {overlayVisibility.goldenZone && goldenZone && (
          <div className="absolute bottom-14 right-2 bg-blue-900/30 border border-blue-500/30 p-2 rounded text-[10px]">
            <div className="text-blue-400 font-medium mb-1">Golden Zone</div>
            <div className="flex justify-between gap-3 text-gray-300">
              <span>61.8%:</span>
              <span className="font-mono">${formatPrice(goldenZone.top)}</span>
            </div>
            <div className="flex justify-between gap-3 text-gray-300">
              <span>38.2%:</span>
              <span className="font-mono">${formatPrice(goldenZone.bottom)}</span>
            </div>
          </div>
        )}

        {/* Trade Info Panel */}
        {tradeSetup && tradeSetup.type !== 'wait' && (() => {
          const entryPrice = typeof tradeSetup.entry === 'number' ? tradeSetup.entry : currentPrice;
          const tp1 = tradeSetup.takeProfit[0] || 0;
          const tp2 = tradeSetup.takeProfit[1] || 0;
          const tp3 = tradeSetup.takeProfit[2] || 0;
          const isLong = tradeSetup.type === 'long';

          // Calculate percentages for each TP
          const calcProfitPercent = (tp: number) => {
            if (entryPrice <= 0) return '0.00';
            return (isLong ? ((tp - entryPrice) / entryPrice * 100) : ((entryPrice - tp) / entryPrice * 100)).toFixed(2);
          };

          const riskAbs = Math.abs(entryPrice - tradeSetup.stopLoss);
          const riskPercent = entryPrice > 0
            ? (isLong ? ((entryPrice - tradeSetup.stopLoss) / entryPrice * 100) : ((tradeSetup.stopLoss - entryPrice) / entryPrice * 100)).toFixed(2)
            : '0.00';

          return (
            <div className={`absolute bottom-2 right-2 ${styles.overlayBg} p-3 rounded-lg text-xs border ${styles.header} min-w-[200px]`}>
              <div className={`font-bold text-sm mb-2 pb-2 border-b border-gray-700 ${tradeSetup.type === 'long' ? 'text-green-500' : 'text-red-500'}`}>
                {tradeSetup.type.toUpperCase()} Trade
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-gray-400">Entry:</span>
                  <span className="text-orange-400 font-mono">${formatPrice(entryPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Stop Loss:</span>
                  <span className="text-red-400 font-mono">${formatPrice(tradeSetup.stopLoss)}</span>
                </div>
                <div className="border-t border-gray-700 my-2"></div>
                {/* All 3 TP Levels */}
                <div className="flex justify-between">
                  <span className="text-gray-400">TP1 (1:1):</span>
                  <span className="text-green-400 font-mono">${formatPrice(tp1)} <span className="text-green-300/70">+{calcProfitPercent(tp1)}%</span></span>
                </div>
                {tp2 > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">TP2 (1.618):</span>
                    <span className="text-green-500 font-mono">${formatPrice(tp2)} <span className="text-green-400/70">+{calcProfitPercent(tp2)}%</span></span>
                  </div>
                )}
                {tp3 > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">TP3 (2.618):</span>
                    <span className="text-green-600 font-mono">${formatPrice(tp3)} <span className="text-green-500/70">+{calcProfitPercent(tp3)}%</span></span>
                  </div>
                )}
                <div className="border-t border-gray-700 my-2"></div>
                <div className="flex justify-between">
                  <span className="text-gray-400">R/R Ratio:</span>
                  <span className="text-blue-400 font-mono font-bold">1:{tradeSetup.riskReward.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Risk:</span>
                  <span className="text-red-400 font-mono">-${formatPrice(riskAbs)} ({riskPercent}%)</span>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Indicator Panel - TradingView Style */}
      {activeIndicators.length > 0 && (
        <IndicatorPanel
          klines={klines}
          activeIndicators={activeIndicators}
          onRemoveIndicator={removeIndicator}
          visibleRange={visibleRange}
          onVisibleRangeChange={handleVisibleRangeChange}
          theme={theme}
        />
      )}
    </div>
  );
}
