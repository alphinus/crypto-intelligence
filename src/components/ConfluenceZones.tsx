'use client';

import { Layers, TrendingUp, TrendingDown } from 'lucide-react';

interface ConfluenceZone {
  price: number;
  type: 'support' | 'resistance';
  timeframes: string[];
}

interface ConfluenceZonesProps {
  zones: ConfluenceZone[];
  currentPrice: number;
}

export function ConfluenceZones({ zones, currentPrice }: ConfluenceZonesProps) {
  if (zones.length === 0) {
    return null;
  }

  const formatPrice = (price: number) => {
    return `$${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  };

  const getDistance = (price: number) => {
    const distance = ((price - currentPrice) / currentPrice) * 100;
    const prefix = distance > 0 ? '+' : '';
    return `${prefix}${distance.toFixed(2)}%`;
  };

  // Sortiere nach Stärke (Anzahl Timeframes)
  const sortedZones = [...zones].sort((a, b) => b.timeframes.length - a.timeframes.length);

  // Nur die top 4 Zonen anzeigen
  const topZones = sortedZones.slice(0, 4);

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Layers className="w-4 h-4 text-purple-400" />
        <h3 className="font-semibold text-white text-sm">Confluence Zones</h3>
        <span className="text-[10px] text-gray-500">(Multi-Timeframe Level)</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {topZones.map((zone, index) => (
          <div
            key={`${zone.price}-${zone.type}`}
            className={`flex flex-col p-2 rounded-lg border ${
              zone.type === 'support'
                ? 'bg-green-500/10 border-green-500/30'
                : 'bg-red-500/10 border-red-500/30'
            }`}
          >
            {/* Price */}
            <div className="flex items-center gap-1 mb-1">
              {zone.type === 'support' ? (
                <TrendingUp className="w-3 h-3 text-green-400" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-400" />
              )}
              <span
                className={`font-bold text-sm ${
                  zone.type === 'support' ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {formatPrice(zone.price)}
              </span>
            </div>

            {/* Distance */}
            <div className="text-[10px] text-gray-400 mb-1">
              {getDistance(zone.price)} von Preis
            </div>

            {/* Timeframes */}
            <div className="flex flex-wrap gap-1">
              {zone.timeframes.map((tf) => (
                <span
                  key={tf}
                  className="text-[9px] bg-gray-800/50 text-gray-400 px-1.5 py-0.5 rounded"
                >
                  {tf}
                </span>
              ))}
            </div>

            {/* Strength indicator */}
            <div className="mt-1 flex items-center gap-1">
              {[...Array(Math.min(zone.timeframes.length, 5))].map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full ${
                    zone.type === 'support' ? 'bg-green-400' : 'bg-red-400'
                  }`}
                />
              ))}
              <span className="text-[9px] text-gray-500 ml-1">
                {zone.timeframes.length} TFs
              </span>
            </div>
          </div>
        ))}
      </div>

      {sortedZones.length > 4 && (
        <div className="mt-2 text-center text-[10px] text-gray-500">
          +{sortedZones.length - 4} weitere Zonen
        </div>
      )}
    </div>
  );
}
