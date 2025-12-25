'use client';

import { Target, TrendingUp, TrendingDown } from 'lucide-react';

interface ConfluenceZone {
  price: number;
  timeframes: string[];
  type: 'support' | 'resistance';
}

interface ConfluenceWidgetProps {
  zones: ConfluenceZone[];
  currentPrice: number;
}

export function ConfluenceWidget({ zones, currentPrice }: ConfluenceWidgetProps) {
  // Sort zones by strength (number of timeframes)
  const sortedZones = [...zones].sort((a, b) => b.timeframes.length - a.timeframes.length);

  // Get strongest support and resistance zones
  const strongestSupport = sortedZones.find(z => z.type === 'support' && z.price < currentPrice);
  const strongestResistance = sortedZones.find(z => z.type === 'resistance' && z.price > currentPrice);

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return price.toLocaleString('en-US', { maximumFractionDigits: 0 });
    } else if (price >= 1) {
      return price.toLocaleString('en-US', { maximumFractionDigits: 2 });
    }
    return price.toLocaleString('en-US', { maximumFractionDigits: 6 });
  };

  const calcDistance = (price: number) => {
    const diff = ((price - currentPrice) / currentPrice) * 100;
    return diff >= 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`;
  };

  if (!strongestSupport && !strongestResistance) {
    return null;
  }

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2">
        <Target className="w-4 h-4 text-purple-400" />
        <span className="text-xs font-medium text-gray-400">Confluence Zones</span>
      </div>

      <div className="space-y-2">
        {/* Strongest Resistance */}
        {strongestResistance && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3 text-red-400" />
              <span className="text-[10px] text-gray-500">R ({strongestResistance.timeframes.length}TF)</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono text-red-400">${formatPrice(strongestResistance.price)}</span>
              <span className="text-[10px] text-gray-500 ml-1">{calcDistance(strongestResistance.price)}</span>
            </div>
          </div>
        )}

        {/* Current Price Indicator */}
        <div className="flex items-center justify-center py-1">
          <div className="flex-1 h-px bg-gray-700" />
          <span className="px-2 text-[10px] text-gray-500">Current: ${formatPrice(currentPrice)}</span>
          <div className="flex-1 h-px bg-gray-700" />
        </div>

        {/* Strongest Support */}
        {strongestSupport && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <TrendingDown className="w-3 h-3 text-green-400" />
              <span className="text-[10px] text-gray-500">S ({strongestSupport.timeframes.length}TF)</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono text-green-400">${formatPrice(strongestSupport.price)}</span>
              <span className="text-[10px] text-gray-500 ml-1">{calcDistance(strongestSupport.price)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Timeframe badges */}
      {(strongestSupport || strongestResistance) && (
        <div className="mt-2 pt-2 border-t border-gray-800">
          <div className="flex flex-wrap gap-1">
            {(strongestResistance?.timeframes || strongestSupport?.timeframes || []).slice(0, 4).map((tf) => (
              <span
                key={tf}
                className="px-1.5 py-0.5 text-[9px] bg-gray-800 text-gray-400 rounded"
              >
                {tf.toUpperCase()}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
