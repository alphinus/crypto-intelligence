'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface FearGreedLiquidProps {
  value: number;
  classification: string;
  previousValue?: number;
}

export function FearGreedLiquid({
  value,
  classification,
  previousValue,
}: FearGreedLiquidProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Color based on value
  const getColors = (v: number) => {
    if (v <= 25) return { fill: '#ef4444', text: 'text-red-400', label: 'Extreme Fear' };
    if (v <= 45) return { fill: '#f97316', text: 'text-orange-400', label: 'Fear' };
    if (v <= 55) return { fill: '#eab308', text: 'text-yellow-400', label: 'Neutral' };
    if (v <= 75) return { fill: '#84cc16', text: 'text-lime-400', label: 'Greed' };
    return { fill: '#22c55e', text: 'text-green-400', label: 'Extreme Greed' };
  };

  const colors = getColors(value);
  const change = previousValue ? value - previousValue : 0;
  const fillHeight = 100 - value; // Inverted for SVG Y coordinate

  // Unique ID for clip path to avoid conflicts with multiple instances
  const clipId = useMemo(() => `liquidClip-${Math.random().toString(36).substr(2, 9)}`, []);

  return (
    <motion.div
      className="relative cursor-pointer"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => setShowDetails(!showDetails)}
    >
      {/* Container */}
      <div className="relative bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-3 shadow-xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">
            Fear & Greed
          </span>
          {change !== 0 && (
            <div className={`flex items-center gap-0.5 text-[10px] ${change > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{change > 0 ? '+' : ''}{change}</span>
            </div>
          )}
        </div>

        {/* Liquid Gauge Container */}
        <div className="relative w-20 h-20 mx-auto">
          {/* Outer Circle Border */}
          <div className="absolute inset-0 rounded-full border-2 border-gray-700/50" />

          {/* SVG Liquid Fill */}
          <svg
            viewBox="0 0 100 100"
            className="absolute inset-0 rounded-full overflow-hidden"
          >
            {/* Background */}
            <circle cx="50" cy="50" r="48" fill="#1f2937" />

            {/* Clip Path for Circle */}
            <defs>
              <clipPath id={clipId}>
                <circle cx="50" cy="50" r="46" />
              </clipPath>
            </defs>

            {/* Animated Liquid */}
            <g clipPath={`url(#${clipId})`}>
              {/* Wave 1 (back) */}
              <motion.path
                fill={colors.fill}
                opacity={0.6}
                animate={{
                  d: [
                    `M 0 ${fillHeight} Q 25 ${fillHeight - 6} 50 ${fillHeight} T 100 ${fillHeight} L 100 100 L 0 100 Z`,
                    `M 0 ${fillHeight} Q 25 ${fillHeight + 6} 50 ${fillHeight} T 100 ${fillHeight} L 100 100 L 0 100 Z`,
                    `M 0 ${fillHeight} Q 25 ${fillHeight - 6} 50 ${fillHeight} T 100 ${fillHeight} L 100 100 L 0 100 Z`,
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* Wave 2 (front) */}
              <motion.path
                fill={colors.fill}
                opacity={0.9}
                animate={{
                  d: [
                    `M 0 ${fillHeight} Q 30 ${fillHeight + 4} 60 ${fillHeight} T 100 ${fillHeight} L 100 100 L 0 100 Z`,
                    `M 0 ${fillHeight} Q 30 ${fillHeight - 4} 60 ${fillHeight} T 100 ${fillHeight} L 100 100 L 0 100 Z`,
                    `M 0 ${fillHeight} Q 30 ${fillHeight + 4} 60 ${fillHeight} T 100 ${fillHeight} L 100 100 L 0 100 Z`,
                  ]
                }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            </g>

            {/* Inner glow */}
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke={colors.fill}
              strokeWidth="1"
              opacity={0.3}
            />
          </svg>

          {/* Center Value */}
          <div className="absolute inset-0 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.span
                key={value}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className={`text-2xl font-bold ${colors.text} drop-shadow-lg`}
              >
                {value}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>

        {/* Classification Label */}
        <motion.p
          className={`text-center text-xs font-medium ${colors.text} mt-2`}
          layout
        >
          {classification}
        </motion.p>

        {/* Expanded Details */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-3 pt-2 border-t border-gray-700/50 overflow-hidden"
            >
              <div className="flex justify-between text-[10px]">
                <span className="text-gray-500">Yesterday: <span className={colors.text}>{previousValue || '-'}</span></span>
                <span className="text-gray-500">Trend: <span className={change >= 0 ? 'text-green-400' : 'text-red-400'}>{change >= 0 ? '↑' : '↓'}</span></span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
