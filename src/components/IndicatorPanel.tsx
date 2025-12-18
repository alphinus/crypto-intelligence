'use client';

import { useState, useCallback } from 'react';
import { RSIIndicator } from './RSIIndicator';
import { MACDIndicator } from './MACDIndicator';
import type { LogicalRange } from 'lightweight-charts';

export type IndicatorType = 'rsi' | 'macd' | 'stochastic' | 'bollinger';

interface IndicatorPanelProps {
  klines: { openTime: number; close: number; high: number; low: number }[];
  activeIndicators: IndicatorType[];
  onRemoveIndicator: (indicator: IndicatorType) => void;
  visibleRange?: LogicalRange | null;
  onVisibleRangeChange?: (range: LogicalRange | null) => void;
}

export function IndicatorPanel({
  klines,
  activeIndicators,
  onRemoveIndicator,
  visibleRange,
  onVisibleRangeChange,
}: IndicatorPanelProps) {
  // Track if any indicator is updating the range to prevent feedback loops
  const [isUpdating, setIsUpdating] = useState(false);

  const handleVisibleRangeChange = useCallback(
    (range: LogicalRange | null) => {
      if (isUpdating) return;
      setIsUpdating(true);
      onVisibleRangeChange?.(range);
      setTimeout(() => setIsUpdating(false), 50);
    },
    [isUpdating, onVisibleRangeChange]
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
        />
      )}
      {activeIndicators.includes('macd') && (
        <MACDIndicator
          klines={klines}
          height={120}
          onClose={() => onRemoveIndicator('macd')}
          visibleRange={visibleRange}
          onVisibleRangeChange={handleVisibleRangeChange}
        />
      )}
    </div>
  );
}
