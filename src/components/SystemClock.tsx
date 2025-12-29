"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

export function SystemClock() {
    const [time, setTime] = useState<Date | null>(null);

    useEffect(() => {
        setTime(new Date());
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-gray-800/50 rounded text-xs">
            <Clock className="w-3 h-3 text-gray-400" />
            <span className="font-mono text-gray-300">
                {time
                    ? time.toLocaleTimeString("de-DE", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                    })
                    : "--:--:--"}
            </span>
        </div>
    );
}
