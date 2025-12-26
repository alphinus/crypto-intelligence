'use client';

import { useState, useEffect, useMemo } from 'react';
import { Clock } from 'lucide-react';

interface Session {
    name: string;
    city: string;
    openUTC: number;
}

const SESSIONS: Session[] = [
    { name: 'Sydney', city: 'Sydney', openUTC: 22 },
    { name: 'Tokyo', city: 'Tokio', openUTC: 0 },
    { name: 'London', city: 'London', openUTC: 8 },
    { name: 'New York', city: 'New York', openUTC: 13 },
];

export function SessionTimer() {
    const [timeLeft, setTimeLeft] = useState<{ name: string; time: string } | null>(null);

    useEffect(() => {
        const updateTimer = () => {
            const now = new Date();
            const nowUTC = now.getUTCHours() * 3600 + now.getUTCMinutes() * 60 + now.getUTCSeconds();

            let nextSession: Session | null = null;
            let minDiff = Infinity;

            SESSIONS.forEach(session => {
                const sessionOpenSeconds = session.openUTC * 3600;
                let diff = sessionOpenSeconds - nowUTC;

                // If it already opened today, check for tomorrow
                if (diff <= 0) {
                    diff += 24 * 3600;
                }

                if (diff < minDiff) {
                    minDiff = diff;
                    nextSession = session;
                }
            });

            if (nextSession) {
                const h = Math.floor(minDiff / 3600);
                const m = Math.floor((minDiff % 3600) / 60);
                const s = minDiff % 60;

                setTimeLeft({
                    name: (nextSession as Session).name,
                    time: `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
                });
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, []);

    if (!timeLeft) return null;

    return (
        <div className="flex items-center gap-2 px-2 py-1 bg-gray-800/50 rounded border border-gray-700/50 text-[11px]">
            <div className="flex items-center gap-1.5 text-blue-400">
                <Clock className="w-3 h-3" />
                <span className="font-medium">{timeLeft.name}</span>
            </div>
            <span className="text-gray-500">öffnet in:</span>
            <span className="font-mono text-white font-medium">{timeLeft.time}</span>
        </div>
    );
}
