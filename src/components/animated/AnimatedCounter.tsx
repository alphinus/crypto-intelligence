'use client';

import { motion, useSpring, useTransform, useMotionValue, animate } from 'framer-motion';
import { useEffect, useRef } from 'react';

interface AnimatedCounterProps {
  /** Target value to animate to */
  value: number;
  /** Number of decimal places */
  decimals?: number;
  /** Duration in seconds */
  duration?: number;
  /** Prefix (e.g., "$") */
  prefix?: string;
  /** Suffix (e.g., "%") */
  suffix?: string;
  /** Format with commas */
  formatNumber?: boolean;
  /** Additional className */
  className?: string;
  /** Color based on value (for percentages) */
  colorize?: boolean;
}

export function AnimatedCounter({
  value,
  decimals = 0,
  duration = 1,
  prefix = '',
  suffix = '',
  formatNumber = true,
  className = '',
  colorize = false,
}: AnimatedCounterProps) {
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    stiffness: 100,
    damping: 30,
    duration: duration * 1000,
  });

  const displayRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration,
      ease: 'easeOut',
      onUpdate: (latest) => {
        if (displayRef.current) {
          let formatted = latest.toFixed(decimals);
          if (formatNumber) {
            const parts = formatted.split('.');
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            formatted = parts.join('.');
          }
          displayRef.current.textContent = `${prefix}${formatted}${suffix}`;
        }
      },
    });

    return () => controls.stop();
  }, [value, decimals, duration, prefix, suffix, formatNumber, motionValue]);

  const colorClass = colorize
    ? value > 0
      ? 'text-green-400'
      : value < 0
        ? 'text-red-400'
        : 'text-gray-400'
    : '';

  return (
    <motion.span
      ref={displayRef}
      className={`${className} ${colorClass}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {prefix}0{suffix}
    </motion.span>
  );
}

// Simpler version using CSS counter animation
interface SimpleCounterProps {
  value: number;
  className?: string;
}

export function SimpleCounter({ value, className = '' }: SimpleCounterProps) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      {value.toLocaleString()}
    </motion.span>
  );
}

// Price display with flash effect
interface AnimatedPriceProps {
  value: number;
  previousValue?: number;
  prefix?: string;
  decimals?: number;
  className?: string;
}

export function AnimatedPrice({
  value,
  previousValue,
  prefix = '$',
  decimals = 2,
  className = '',
}: AnimatedPriceProps) {
  const direction = previousValue ? (value > previousValue ? 'up' : value < previousValue ? 'down' : 'none') : 'none';

  return (
    <motion.span
      key={value}
      initial={{
        backgroundColor: direction === 'up'
          ? 'rgba(34, 197, 94, 0.4)'
          : direction === 'down'
            ? 'rgba(239, 68, 68, 0.4)'
            : 'transparent',
      }}
      animate={{ backgroundColor: 'transparent' }}
      transition={{ duration: 0.5 }}
      className={`${className} px-1 rounded`}
    >
      {prefix}{value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
    </motion.span>
  );
}

// Percentage with color and animation
interface AnimatedPercentageProps {
  value: number;
  decimals?: number;
  showSign?: boolean;
  className?: string;
}

export function AnimatedPercentage({
  value,
  decimals = 2,
  showSign = true,
  className = '',
}: AnimatedPercentageProps) {
  const sign = value > 0 ? '+' : '';
  const colorClass = value > 0 ? 'text-green-400' : value < 0 ? 'text-red-400' : 'text-gray-400';

  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, type: 'spring' }}
      className={`${className} ${colorClass}`}
    >
      {showSign && sign}{value.toFixed(decimals)}%
    </motion.span>
  );
}

// Compact counter for stats
interface StatCounterProps {
  value: number;
  label: string;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function StatCounter({
  value,
  label,
  prefix = '',
  suffix = '',
  className = '',
}: StatCounterProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`text-center ${className}`}
    >
      <AnimatedCounter
        value={value}
        prefix={prefix}
        suffix={suffix}
        className="text-2xl font-bold"
      />
      <p className="text-sm text-gray-400 mt-1">{label}</p>
    </motion.div>
  );
}

export default AnimatedCounter;
