'use client';

import { motion } from 'framer-motion';
import type { DCAZone } from '@/lib/dca-zones';

interface ZoneIndicatorProps {
    zone: DCAZone;
    showDetails?: boolean;
}

export function ZoneIndicator({ zone, showDetails = true }: ZoneIndicatorProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl border p-4"
            style={{
                backgroundColor: zone.bgColor,
                borderColor: zone.color,
            }}
        >
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: zone.color }}
                    />
                    <span className="font-bold text-white">{zone.label}</span>
                </div>
                <div
                    className="text-2xl font-black"
                    style={{ color: zone.color }}
                >
                    {zone.score}/100
                </div>
            </div>

            {showDetails && (
                <p className="text-sm text-gray-300">{zone.recommendation}</p>
            )}
        </motion.div>
    );
}
