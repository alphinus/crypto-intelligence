'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Animated Number Component
 * Shows a flash effect and smooth transition when values change
 */

interface AnimatedNumberProps {
    value: number;
    prefix?: string;
    suffix?: string;
    decimals?: number;
    className?: string;
    flashOnChange?: boolean;
    flashColor?: 'green' | 'red' | 'auto';
}

export function AnimatedNumber({
    value,
    prefix = '',
    suffix = '',
    decimals = 2,
    className = '',
    flashOnChange = true,
    flashColor = 'auto',
}: AnimatedNumberProps) {
    const [displayValue, setDisplayValue] = useState(value);
    const [flash, setFlash] = useState<'up' | 'down' | null>(null);
    const prevValue = useRef(value);

    useEffect(() => {
        if (value !== prevValue.current) {
            const direction = value > prevValue.current ? 'up' : 'down';

            if (flashOnChange) {
                setFlash(direction);
                setTimeout(() => setFlash(null), 500);
            }

            // Animate number change
            const duration = 300;
            const startTime = Date.now();
            const startValue = prevValue.current;
            const diff = value - startValue;

            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic

                setDisplayValue(startValue + diff * eased);

                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };

            requestAnimationFrame(animate);
            prevValue.current = value;
        }
    }, [value, flashOnChange]);

    const getFlashColor = () => {
        if (!flash) return '';
        if (flashColor === 'auto') {
            return flash === 'up'
                ? 'bg-green-400/20 dark:bg-green-500/20'
                : 'bg-red-400/20 dark:bg-red-500/20';
        }
        return flashColor === 'green'
            ? 'bg-green-400/20 dark:bg-green-500/20'
            : 'bg-red-400/20 dark:bg-red-500/20';
    };

    return (
        <span
            className={`inline-block transition-colors duration-300 rounded px-1 -mx-1 ${getFlashColor()} ${className}`}
        >
            {prefix}
            {displayValue.toLocaleString(undefined, {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals,
            })}
            {suffix}
        </span>
    );
}

/**
 * Animated Price Component
 * Specialized for currency display with $ prefix and color coding
 */
interface AnimatedPriceProps {
    value: number;
    previousValue?: number;
    className?: string;
    showChange?: boolean;
}

export function AnimatedPrice({
    value,
    previousValue,
    className = '',
    showChange = false,
}: AnimatedPriceProps) {
    const change = previousValue !== undefined ? value - previousValue : 0;
    const changePercent = previousValue !== undefined && previousValue !== 0
        ? ((value - previousValue) / previousValue) * 100
        : 0;

    return (
        <span className={`inline-flex items-center gap-2 ${className}`}>
            <AnimatedNumber
                value={value}
                prefix="$"
                decimals={value < 1 ? 6 : 2}
            />
            {showChange && previousValue !== undefined && (
                <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`text-sm font-medium ${change >= 0
                            ? 'text-green-500 dark:text-green-400'
                            : 'text-red-500 dark:text-red-400'
                        }`}
                >
                    {change >= 0 ? '↑' : '↓'} {Math.abs(changePercent).toFixed(2)}%
                </motion.span>
            )}
        </span>
    );
}

/**
 * Animated Percentage Component
 * For displaying percentage values with color coding
 */
interface AnimatedPercentageProps {
    value: number;
    className?: string;
    showSign?: boolean;
    colorCode?: boolean;
}

export function AnimatedPercentage({
    value,
    className = '',
    showSign = true,
    colorCode = true,
}: AnimatedPercentageProps) {
    const colorClass = colorCode
        ? value >= 0
            ? 'text-green-500 dark:text-green-400'
            : 'text-red-500 dark:text-red-400'
        : '';

    return (
        <span className={`${colorClass} ${className}`}>
            <AnimatedNumber
                value={value}
                prefix={showSign && value >= 0 ? '+' : ''}
                suffix="%"
                decimals={2}
            />
        </span>
    );
}

/**
 * Fade In/Out Animation Wrapper
 */
interface FadeInProps {
    children: React.ReactNode;
    delay?: number;
    duration?: number;
    className?: string;
}

export function FadeIn({ children, delay = 0, duration = 0.3, className = '' }: FadeInProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration, ease: 'easeOut' }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

/**
 * Staggered List Animation
 */
interface StaggerListProps {
    children: React.ReactNode[];
    staggerDelay?: number;
    className?: string;
}

export function StaggerList({ children, staggerDelay = 0.05, className = '' }: StaggerListProps) {
    return (
        <div className={className}>
            {children.map((child, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * staggerDelay, duration: 0.2 }}
                >
                    {child}
                </motion.div>
            ))}
        </div>
    );
}

/**
 * Pulse Animation for Alerts
 */
interface PulseProps {
    children: React.ReactNode;
    active?: boolean;
    color?: 'green' | 'red' | 'yellow' | 'blue';
}

export function Pulse({ children, active = true, color = 'blue' }: PulseProps) {
    const colorClasses = {
        green: 'shadow-green-500/50',
        red: 'shadow-red-500/50',
        yellow: 'shadow-yellow-500/50',
        blue: 'shadow-blue-500/50',
    };

    if (!active) return <>{children}</>;

    return (
        <motion.div
            animate={{
                boxShadow: [
                    `0 0 0 0 ${colorClasses[color]}`,
                    `0 0 0 8px transparent`,
                ],
            }}
            transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeOut',
            }}
            className="rounded-lg"
        >
            {children}
        </motion.div>
    );
}
