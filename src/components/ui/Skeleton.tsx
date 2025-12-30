'use client';

import React from 'react';

/**
 * Reusable Skeleton Loader Components
 * For perceived performance improvement during data loading
 */

// Base skeleton with pulse animation
export function Skeleton({ className = '' }: { className?: string }) {
    return (
        <div
            className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
        />
    );
}

// Text line skeleton
export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
    return (
        <div className={`space-y-2 ${className}`}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
                />
            ))}
        </div>
    );
}

// Card skeleton (for trade recommendations, widgets)
export function SkeletonCard({ className = '' }: { className?: string }) {
    return (
        <div className={`bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4 ${className}`}>
            <div className="flex items-center gap-3 mb-4">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <SkeletonText lines={2} />
            <div className="flex gap-2 mt-4">
                <Skeleton className="h-8 flex-1 rounded-lg" />
                <Skeleton className="h-8 flex-1 rounded-lg" />
            </div>
        </div>
    );
}

// Stats skeleton (for mini widgets)
export function SkeletonStat({ className = '' }: { className?: string }) {
    return (
        <div className={`bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-3 ${className}`}>
            <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="w-5 h-5 rounded" />
            </div>
            <Skeleton className="h-8 w-24 mt-2" />
            <Skeleton className="h-3 w-16 mt-1" />
        </div>
    );
}

// List skeleton (for sidebar items)
export function SkeletonList({ items = 5, className = '' }: { items?: number; className?: string }) {
    return (
        <div className={`space-y-3 ${className}`}>
            {Array.from({ length: items }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="flex-1">
                        <Skeleton className="h-4 w-3/4 mb-1" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-4 w-12" />
                </div>
            ))}
        </div>
    );
}

// Chart skeleton
export function SkeletonChart({ height = 200, className = '' }: { height?: number; className?: string }) {
    return (
        <div className={`bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4 ${className}`}>
            <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-5 w-32" />
                <div className="flex gap-2">
                    <Skeleton className="h-6 w-12 rounded" />
                    <Skeleton className="h-6 w-12 rounded" />
                </div>
            </div>
            <Skeleton className={`w-full rounded-lg`} style={{ height }} />
        </div>
    );
}

// Trade recommendation skeleton
export function SkeletonTradeCard({ className = '' }: { className?: string }) {
    return (
        <div className={`bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Skeleton className="w-6 h-6 rounded" />
                    <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
            </div>

            {/* Signal badge */}
            <div className="flex items-center gap-3 mb-4">
                <Skeleton className="h-10 w-24 rounded-lg" />
                <Skeleton className="h-6 w-16 rounded-full" />
            </div>

            {/* Entry/Exit */}
            <div className="grid grid-cols-3 gap-2 mb-4">
                <div>
                    <Skeleton className="h-3 w-12 mb-1" />
                    <Skeleton className="h-5 w-20" />
                </div>
                <div>
                    <Skeleton className="h-3 w-12 mb-1" />
                    <Skeleton className="h-5 w-20" />
                </div>
                <div>
                    <Skeleton className="h-3 w-12 mb-1" />
                    <Skeleton className="h-5 w-20" />
                </div>
            </div>

            {/* Reasoning */}
            <SkeletonText lines={2} />
        </div>
    );
}

// Intelligence report skeleton
export function SkeletonReport({ className = '' }: { className?: string }) {
    return (
        <div className={`bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-6 ${className}`}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div>
                    <Skeleton className="h-6 w-48 mb-2" />
                    <Skeleton className="h-4 w-32" />
                </div>
            </div>

            {/* Summary */}
            <Skeleton className="h-4 w-24 mb-3" />
            <SkeletonText lines={4} className="mb-6" />

            {/* Signals */}
            <Skeleton className="h-4 w-20 mb-3" />
            <div className="space-y-2 mb-6">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-2">
                        <Skeleton className="w-5 h-5 rounded mt-0.5" />
                        <SkeletonText lines={1} className="flex-1" />
                    </div>
                ))}
            </div>

            {/* Trade Recommendation */}
            <Skeleton className="h-4 w-32 mb-3" />
            <SkeletonTradeCard />
        </div>
    );
}
