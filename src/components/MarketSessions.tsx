'use client';

import { useState, useEffect } from 'react';
import { Globe, Sun, Moon } from 'lucide-react';

interface Session {
  id: string;
  name: string;
  city: string;
  emoji: string;
  openUTC: number;  // Öffnungszeit in UTC (Stunde)
  closeUTC: number; // Schließzeit in UTC (Stunde)
  color: string;
  bgColor: string;
}

const SESSIONS: Session[] = [
  {
    id: 'sydney',
    name: 'Sydney',
    city: 'Sydney',
    emoji: '🇦🇺',
    openUTC: 22,
    closeUTC: 7,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
  },
  {
    id: 'tokyo',
    name: 'Tokyo',
    city: 'Tokio',
    emoji: '🇯🇵',
    openUTC: 0,
    closeUTC: 9,
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
  },
  {
    id: 'london',
    name: 'London',
    city: 'London',
    emoji: '🇬🇧',
    openUTC: 8,
    closeUTC: 17,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
  },
  {
    id: 'newyork',
    name: 'New York',
    city: 'New York',
    emoji: '🇺🇸',
    openUTC: 13,
    closeUTC: 22,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
  },
];

function isSessionActive(session: Session, currentHourUTC: number): boolean {
  if (session.openUTC > session.closeUTC) {
    // Session überlappt Mitternacht (z.B. Sydney: 22-07)
    return currentHourUTC >= session.openUTC || currentHourUTC < session.closeUTC;
  }
  return currentHourUTC >= session.openUTC && currentHourUTC < session.closeUTC;
}

function getActiveSessionsDescription(activeSessions: Session[]): string {
  if (activeSessions.length === 0) return 'Keine Sessions aktiv';
  if (activeSessions.length === 1) return `${activeSessions[0].name} Session`;

  // Check für bekannte Overlaps
  const sessionIds = activeSessions.map(s => s.id);

  if (sessionIds.includes('london') && sessionIds.includes('newyork')) {
    return 'London/NY Overlap (Hohe Liquidität)';
  }
  if (sessionIds.includes('tokyo') && sessionIds.includes('london')) {
    return 'Tokyo/London Overlap';
  }
  if (sessionIds.includes('sydney') && sessionIds.includes('tokyo')) {
    return 'Sydney/Tokyo Overlap';
  }

  return activeSessions.map(s => s.name).join(' + ');
}

function formatTimeRange(open: number, close: number): string {
  const formatHour = (h: number) => `${h.toString().padStart(2, '0')}:00`;
  return `${formatHour(open)}-${formatHour(close)} UTC`;
}

export function MarketSessions() {
  const [currentHourUTC, setCurrentHourUTC] = useState(() => new Date().getUTCHours());
  const [activeSessions, setActiveSessions] = useState<Session[]>([]);

  useEffect(() => {
    const updateTime = () => {
      const hour = new Date().getUTCHours();
      setCurrentHourUTC(hour);
      setActiveSessions(SESSIONS.filter(s => isSessionActive(s, hour)));
    };

    updateTime();
    const timer = setInterval(updateTime, 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const activeDescription = getActiveSessionsDescription(activeSessions);
  const hasHighLiquidity = activeDescription.includes('Overlap');

  return (
    <div className="bg-[#1a1a2e] rounded-lg border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-white">Trading Sessions</span>
        </div>
        <span className="text-xs text-gray-500">
          UTC {new Date().getUTCHours().toString().padStart(2, '0')}:{new Date().getUTCMinutes().toString().padStart(2, '0')}
        </span>
      </div>

      {/* Sessions Grid */}
      <div className="p-3">
        <div className="grid grid-cols-4 gap-2">
          {SESSIONS.map((session) => {
            const isActive = isSessionActive(session, currentHourUTC);

            return (
              <div
                key={session.id}
                className={`
                  relative rounded-lg p-2 text-center transition-all
                  ${isActive
                    ? `${session.bgColor} border border-${session.color.replace('text-', '')}/30`
                    : 'bg-gray-800/50 opacity-50'
                  }
                `}
              >
                {/* Active Indicator */}
                {isActive && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${session.bgColor} opacity-75`}></span>
                    <span className={`relative inline-flex rounded-full h-3 w-3 ${session.color.replace('text-', 'bg-')}`}></span>
                  </span>
                )}

                <div className="text-lg mb-0.5">{session.emoji}</div>
                <div className={`text-xs font-medium ${isActive ? session.color : 'text-gray-500'}`}>
                  {session.name}
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">
                  {formatTimeRange(session.openUTC, session.closeUTC)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Status */}
      <div className={`
        px-4 py-2 border-t border-gray-800 flex items-center justify-between
        ${hasHighLiquidity ? 'bg-green-500/10' : 'bg-gray-900/50'}
      `}>
        <div className="flex items-center gap-2">
          {activeSessions.length > 0 ? (
            <Sun className={`w-4 h-4 ${hasHighLiquidity ? 'text-green-400' : 'text-yellow-400'}`} />
          ) : (
            <Moon className="w-4 h-4 text-gray-500" />
          )}
          <span className={`text-xs ${hasHighLiquidity ? 'text-green-400 font-medium' : 'text-gray-400'}`}>
            {activeDescription}
          </span>
        </div>
        {hasHighLiquidity && (
          <span className="text-[10px] px-2 py-0.5 bg-green-500/20 text-green-400 rounded">
            High Volume
          </span>
        )}
      </div>
    </div>
  );
}
