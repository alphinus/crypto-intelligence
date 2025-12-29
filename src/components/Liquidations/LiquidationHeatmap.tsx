'use client';

import { useEffect, useRef, useMemo } from 'react';
import type { LiquidationLevel } from '@/types/liquidations';
import { formatLiquidationValue } from '@/lib/liquidation-levels';

interface LiquidationHeatmapProps {
  levels: LiquidationLevel[];
  currentPrice: number;
  height?: number;
  theme?: 'dark' | 'light';
}

export function LiquidationHeatmap({
  levels,
  currentPrice,
  height = 200,
  theme = 'dark',
}: LiquidationHeatmapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Group levels by price range
  const groupedData = useMemo(() => {
    if (!levels.length || currentPrice <= 0) return [];

    const minPrice = Math.min(...levels.map((l) => l.price));
    const maxPrice = Math.max(...levels.map((l) => l.price));
    const range = maxPrice - minPrice;
    const buckets = 30;
    const bucketSize = range / buckets;

    const data: { price: number; longVol: number; shortVol: number }[] = [];

    for (let i = 0; i < buckets; i++) {
      const bucketMin = minPrice + i * bucketSize;
      const bucketMax = bucketMin + bucketSize;
      const bucketPrice = (bucketMin + bucketMax) / 2;

      const inBucket = levels.filter((l) => l.price >= bucketMin && l.price < bucketMax);
      const longVol = inBucket.filter((l) => l.type === 'long').reduce((sum, l) => sum + l.estimatedVolume, 0);
      const shortVol = inBucket.filter((l) => l.type === 'short').reduce((sum, l) => sum + l.estimatedVolume, 0);

      data.push({ price: bucketPrice, longVol, shortVol });
    }

    return data;
  }, [levels, currentPrice]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !groupedData.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const width = container.clientWidth;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear
    ctx.fillStyle = theme === 'dark' ? 'rgba(17, 24, 39, 0.5)' : 'rgba(255, 255, 255, 1)';
    ctx.fillRect(0, 0, width, height);

    const padding = { top: 20, right: 60, bottom: 30, left: 10 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const minPrice = Math.min(...groupedData.map((d) => d.price));
    const maxPrice = Math.max(...groupedData.map((d) => d.price));
    const maxVol = Math.max(...groupedData.map((d) => Math.max(d.longVol, d.shortVol)));

    const barHeight = chartHeight / groupedData.length;

    // Draw bars
    groupedData.forEach((d, i) => {
      const y = padding.top + i * barHeight;

      // Long (red) - left side
      const longWidth = maxVol > 0 ? (d.longVol / maxVol) * (chartWidth / 2) : 0;
      const longGradient = ctx.createLinearGradient(
        padding.left + chartWidth / 2 - longWidth,
        0,
        padding.left + chartWidth / 2,
        0
      );
      longGradient.addColorStop(0, 'rgba(239, 68, 68, 0.1)');
      longGradient.addColorStop(1, 'rgba(239, 68, 68, 0.6)');
      ctx.fillStyle = longGradient;
      ctx.fillRect(
        padding.left + chartWidth / 2 - longWidth,
        y + 1,
        longWidth,
        barHeight - 2
      );

      // Short (green) - right side
      const shortWidth = maxVol > 0 ? (d.shortVol / maxVol) * (chartWidth / 2) : 0;
      const shortGradient = ctx.createLinearGradient(
        padding.left + chartWidth / 2,
        0,
        padding.left + chartWidth / 2 + shortWidth,
        0
      );
      shortGradient.addColorStop(0, 'rgba(34, 197, 94, 0.6)');
      shortGradient.addColorStop(1, 'rgba(34, 197, 94, 0.1)');
      ctx.fillStyle = shortGradient;
      ctx.fillRect(padding.left + chartWidth / 2, y + 1, shortWidth, barHeight - 2);
    });

    // Draw center line (current price indicator)
    const currentPriceY =
      padding.top +
      ((currentPrice - minPrice) / (maxPrice - minPrice)) * chartHeight;

    ctx.strokeStyle = theme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(17, 24, 39, 0.8)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padding.left, currentPriceY);
    ctx.lineTo(width - padding.right, currentPriceY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw price labels
    ctx.fillStyle = theme === 'dark' ? 'rgba(156, 163, 175, 0.8)' : 'rgba(107, 114, 128, 0.8)';
    ctx.font = '10px system-ui';
    ctx.textAlign = 'right';

    // Top price
    ctx.fillText(
      `$${maxPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
      width - 5,
      padding.top + 10
    );

    // Current price
    ctx.fillStyle = theme === 'dark' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(17, 24, 39, 0.9)';
    ctx.fillText(
      `$${currentPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
      width - 5,
      currentPriceY + 4
    );

    // Bottom price
    ctx.fillStyle = theme === 'dark' ? 'rgba(156, 163, 175, 0.8)' : 'rgba(107, 114, 128, 0.8)';
    ctx.fillText(
      `$${minPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
      width - 5,
      height - padding.bottom + 15
    );

    // Legend
    ctx.font = '9px system-ui';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
    ctx.fillText('Long Liqs', padding.left + chartWidth / 4, height - 5);
    ctx.fillStyle = 'rgba(34, 197, 94, 0.8)';
    ctx.fillText('Short Liqs', padding.left + (chartWidth * 3) / 4, height - 5);
  }, [groupedData, currentPrice, height, theme]);

  if (!levels.length) {
    return (
      <div
        className="flex items-center justify-center bg-white dark:bg-gray-900/50 rounded-lg"
        style={{ height }}
      >
        <span className="text-gray-500 text-sm">Keine Daten verfügbar</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full bg-white dark:bg-gray-900/50 rounded-lg overflow-hidden">
      <canvas ref={canvasRef} />
    </div>
  );
}
