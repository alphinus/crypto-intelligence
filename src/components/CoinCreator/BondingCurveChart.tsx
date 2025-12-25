'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Info, Target } from 'lucide-react';
import type { MockToken } from '@/lib/bonding-curve';
import {
  generateCurveData,
  calculatePriceAtSupply,
  calculateMarketCap,
  formatUSD,
  formatTokenAmount,
} from '@/lib/bonding-curve';

interface BondingCurveChartProps {
  token: MockToken;
}

export function BondingCurveChart({ token }: BondingCurveChartProps) {
  const curveData = useMemo(() => {
    return generateCurveData(token.bondingCurve, token.currentSupply, 50);
  }, [token.bondingCurve, token.currentSupply]);

  const currentPrice = calculatePriceAtSupply(token.currentSupply, token.bondingCurve);
  const marketCap = calculateMarketCap(token.currentSupply, token.bondingCurve);
  const progressToGraduation = Math.min(
    (marketCap / token.bondingCurve.graduationMarketCap) * 100,
    100
  );

  // Find the max price for scaling
  const maxPrice = Math.max(...curveData.map(d => d.price));
  const maxSupply = token.bondingCurve.maxSupply;

  // Calculate current position on curve
  const currentSupplyRatio = (token.currentSupply / maxSupply) * 100;

  return (
    <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-400" />
          <h3 className="font-bold text-white">Bonding Curve</h3>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Info className="w-3 h-3" />
          <span>Preis steigt mit Kaufvolumen</span>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative h-48 mb-4">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          {/* Grid lines */}
          <g className="text-gray-700">
            {[25, 50, 75].map(y => (
              <line
                key={y}
                x1="0"
                y1={y}
                x2="100"
                y2={y}
                stroke="currentColor"
                strokeDasharray="2,2"
                strokeWidth="0.3"
              />
            ))}
          </g>

          {/* Graduation line */}
          <line
            x1="0"
            y1={100 - (token.bondingCurve.graduationMarketCap / (maxPrice * maxSupply)) * 100}
            x2="100"
            y2={100 - (token.bondingCurve.graduationMarketCap / (maxPrice * maxSupply)) * 100}
            stroke="#22c55e"
            strokeDasharray="4,4"
            strokeWidth="0.5"
          />

          {/* Curve path */}
          <path
            d={curveData
              .map((point, i) => {
                const x = (point.supply / maxSupply) * 100;
                const y = 100 - (point.price / maxPrice) * 100;
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
              })
              .join(' ')}
            fill="none"
            stroke="url(#curveGradient)"
            strokeWidth="2"
          />

          {/* Filled area under curve up to current supply */}
          <path
            d={
              curveData
                .filter(p => p.supply <= token.currentSupply)
                .map((point, i) => {
                  const x = (point.supply / maxSupply) * 100;
                  const y = 100 - (point.price / maxPrice) * 100;
                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                })
                .join(' ') +
              ` L ${currentSupplyRatio} 100 L 0 100 Z`
            }
            fill="url(#areaGradient)"
            opacity="0.3"
          />

          {/* Current position marker */}
          {token.currentSupply > 0 && (
            <g>
              <circle
                cx={currentSupplyRatio}
                cy={100 - (currentPrice / maxPrice) * 100}
                r="3"
                fill="#facc15"
                stroke="#fff"
                strokeWidth="1"
              />
              <line
                x1={currentSupplyRatio}
                y1={100 - (currentPrice / maxPrice) * 100}
                x2={currentSupplyRatio}
                y2="100"
                stroke="#facc15"
                strokeDasharray="2,2"
                strokeWidth="0.5"
              />
            </g>
          )}

          {/* Gradients */}
          <defs>
            <linearGradient id="curveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="50%" stopColor="#facc15" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#facc15" />
              <stop offset="100%" stopColor="#facc15" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] text-gray-500">
          <span>{formatUSD(maxPrice)}</span>
          <span>{formatUSD(maxPrice / 2)}</span>
          <span>{formatUSD(0)}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-xs text-gray-400 mb-1">Aktueller Preis</div>
          <div className="text-lg font-bold text-yellow-400">
            {formatUSD(currentPrice)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-400 mb-1">Market Cap</div>
          <div className="text-lg font-bold text-white">
            {formatUSD(marketCap)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-400 mb-1">Supply</div>
          <div className="text-lg font-bold text-white">
            {formatTokenAmount(token.currentSupply)}
          </div>
        </div>
      </div>

      {/* Graduation Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-gray-400">
            <Target className="w-3 h-3" />
            <span>Graduation bei {formatUSD(token.bondingCurve.graduationMarketCap)}</span>
          </div>
          <span className={`font-bold ${token.isGraduated ? 'text-green-400' : 'text-gray-300'}`}>
            {progressToGraduation.toFixed(1)}%
          </span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressToGraduation}%` }}
            transition={{ duration: 0.5 }}
            className={`h-full rounded-full ${
              token.isGraduated
                ? 'bg-gradient-to-r from-green-500 to-emerald-400'
                : 'bg-gradient-to-r from-yellow-500 to-orange-500'
            }`}
          />
        </div>
        {token.isGraduated && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-green-400 text-sm font-bold"
          >
            Token graduiert! Bereit fuer DEX Listing
          </motion.div>
        )}
      </div>
    </div>
  );
}
