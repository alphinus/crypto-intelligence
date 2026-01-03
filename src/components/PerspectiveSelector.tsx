'use client';

import React from 'react';
import {
    Zap,
    Activity,
    TrendingUp,
    Shield,
    GraduationCap,
    User,
    Brain,
    ChevronDown
} from 'lucide-react';

export type ExpertiseLevel = 'beginner' | 'standard' | 'expert' | 'intelligence';
export type TradingPersona = 'scalper' | 'daytrader' | 'swingtrader' | 'position';

interface PerspectiveSelectorProps {
    expertiseLevel: ExpertiseLevel;
    setExpertiseLevel: (level: ExpertiseLevel) => void;
    tradingPersona: TradingPersona;
    setTradingPersona: (persona: TradingPersona) => void;
}

const EXPERTISE_LEVELS: { id: ExpertiseLevel; name: string; icon: React.ReactNode; color: string }[] = [
    { id: 'beginner', name: 'Beginner', icon: <GraduationCap className="w-3.5 h-3.5" />, color: 'blue' },
    { id: 'standard', name: 'Standard', icon: <User className="w-3.5 h-3.5" />, color: 'green' },
    { id: 'expert', name: 'Expert', icon: <Activity className="w-3.5 h-3.5" />, color: 'orange' },
    { id: 'intelligence', name: 'AI Intelligence', icon: <Brain className="w-3.5 h-3.5" />, color: 'purple' },
];

const PERSONAS: { id: TradingPersona; name: string; icon: React.ReactNode; label: string }[] = [
    { id: 'scalper', name: 'Scalper', icon: <Zap className="w-3.5 h-3.5" />, label: '5m' },
    { id: 'daytrader', name: 'Day-Trader', icon: <Activity className="w-3.5 h-3.5" />, label: '1h' },
    { id: 'swingtrader', name: 'Swing-Trader', icon: <TrendingUp className="w-3.5 h-3.5" />, label: '4h' },
    { id: 'position', name: 'Position', icon: <Shield className="w-3.5 h-3.5" />, label: '1d' },
];

export function PerspectiveSelector({
    expertiseLevel,
    setExpertiseLevel,
    tradingPersona,
    setTradingPersona
}: PerspectiveSelectorProps) {
    return (
        <div className="flex flex-col md:flex-row items-center gap-4 p-2 bg-white/5 dark:bg-gray-900/40 backdrop-blur-md border border-white/10 dark:border-gray-800 rounded-2xl shadow-xl">
            {/* Expertise Segment */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-800/80 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="px-3 py-1 text-[10px] font-bold text-gray-500 uppercase tracking-widest hidden lg:block">Level</div>
                <div className="flex gap-1">
                    {EXPERTISE_LEVELS.map((level) => (
                        <button
                            key={level.id}
                            onClick={() => setExpertiseLevel(level.id)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${expertiseLevel === level.id
                                    ? `bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm ring-1 ring-gray-200 dark:ring-gray-600`
                                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800'
                                }`}
                        >
                            <span className={expertiseLevel === level.id ? `text-${level.color}-500` : 'text-gray-400'}>
                                {level.icon}
                            </span>
                            <span className="hidden sm:inline">{level.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 hidden md:block" />

            {/* Persona Segment */}
            <div className="flex items-center gap-2">
                <div className="px-3 py-1 text-[10px] font-bold text-gray-500 uppercase tracking-widest hidden lg:block">Style</div>
                <div className="flex gap-1.5">
                    {PERSONAS.map((persona) => (
                        <button
                            key={persona.id}
                            onClick={() => setTradingPersona(persona.id)}
                            className={`group relative flex flex-col items-center justify-center min-w-[70px] px-2 py-1.5 rounded-xl transition-all duration-300 ${tradingPersona === persona.id
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                    : 'bg-gray-100 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 border border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                        >
                            <div className="flex items-center gap-1.5 mb-0.5">
                                {persona.icon}
                                <span className="text-[11px] font-bold uppercase tracking-tight">{persona.name}</span>
                            </div>
                            <div className={`text-[9px] font-mono opacity-60 ${tradingPersona === persona.id ? 'text-white' : 'text-gray-400'}`}>
                                {persona.label} View
                            </div>

                            {tradingPersona === persona.id && (
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full shadow-[0_0_8px_white]" />
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
