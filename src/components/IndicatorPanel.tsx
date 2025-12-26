'use client';

import { useRef, useCallback } from 'react';
import { RSIIndicator } from './RSIIndicator';
import { MACDIndicator } from './MACDIndicator';
import { StochRSIIndicator } from './StochRSIIndicator';
import { ATRIndicator } from './ATRIndicator';
import type { LogicalRange } from 'lightweight-charts';

export type IndicatorType = 'rsi' | 'macd' | 'stochrsi' | 'atr';

interface IndicatorPanelProps {
  klines: { openTime: number; close: number; high: number; low: number }[];
  activeIndicators: IndicatorType[];
  onRemoveIndicator: (indicator: IndicatorType) => void;
  visibleRange?: LogicalRange | null;
  onVisibleRangeChange?: (range: LogicalRange | null) => void;
  theme?: 'dark' | 'light';
}

export function IndicatorPanel({
  klines,
  activeIndicators,
  onRemoveIndicator,
  visibleRange,
  onVisibleRangeChange,
  theme = 'dark',
}: IndicatorPanelProps) {
  // Track if any indicator is updating the range to prevent feedback loops
  // Using useRef instead of useState to avoid re-renders and callback recreation
  const isUpdatingRef = useRef(false);

  const handleVisibleRangeChange = useCallback(
    (range: LogicalRange | null) => {
      if (isUpdatingRef.current) return;
      isUpdatingRef.current = true;
      onVisibleRangeChange?.(range);
      // Use requestAnimationFrame for better timing than setTimeout
      requestAnimationFrame(() => {
        isUpdatingRef.current = false;
      });
    },
    [onVisibleRangeChange]
  );

  if (activeIndicators.length === 0 || klines.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col">
      {activeIndicators.includes('rsi') && (
        <RSIIndicator
          klines={klines}
          height={100}
          onClose={() => onRemoveIndicator('rsi')}
          visibleRange={visibleRange}
          onVisibleRangeChange={handleVisibleRangeChange}
          theme={theme}
        />
      )}
      {activeIndicators.includes('macd') && (
        <MACDIndicator
          klines={klines}
          height={120}
          onClose={() => onRemoveIndicator('macd')}
          visibleRange={visibleRange}
          onVisibleRangeChange={handleVisibleRangeChange}
          theme={theme}
        />
      )}
      {activeIndicators.includes('stochrsi') && (
        <StochRSIIndicator
          klines={klines}
          height={120}
          onClose={() => onRemoveIndicator('stochrsi')}
          visibleRange={visibleRange}
          onVisibleRangeChange={handleVisibleRangeChange}
          theme={theme}
        />
      )}
      {activeIndicators.includes('atr') && (
        <ATRIndicator
          klines={klines}
          height={100}
          onClose={() => onRemoveIndicator('atr')}
          visibleRange={visibleRange}
          onVisibleRangeChange={handleVisibleRangeChange}
          theme={theme}
        />
      )}
    </div>
  );
}
