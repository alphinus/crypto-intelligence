"use client";

import React, { useState, useEffect } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { Brain } from "lucide-react";
import { SessionTimer } from "@/components/SessionTimer";
import { HeaderMenu } from "@/components/HeaderMenu";
import { SystemClock } from "@/components/SystemClock";

interface HeaderProps {
    marketData: any;
    setMobileDrawerOpen: (open: boolean) => void;
    isConnected: boolean;
    connectionState: string;
    analyzing: boolean;
    generateIntelligenceReport: () => void;
    loading: boolean;
    fetchData: () => void;
    fetchTradeRecommendations: () => void;
    setLastUpdated: (date: Date) => void;
}

export function Header({
    marketData,
    setMobileDrawerOpen,
    isConnected,
    connectionState,
    analyzing,
    generateIntelligenceReport,
    loading,
    fetchData,
    fetchTradeRecommendations,
    setLastUpdated,
}: HeaderProps) {
    const { scrollY } = useScroll();
    const [hidden, setHidden] = useState(false);

    useMotionValueEvent(scrollY, "change", (latest) => {
        const previous = scrollY.getPrevious() || 0;
        if (latest > previous && latest > 150) {
            setHidden(true);
        } else {
            setHidden(false);
        }
    });

    return (
        <motion.header
            variants={{
                visible: { y: 0 },
                hidden: { y: "-100%" },
            }}
            animate={hidden ? "hidden" : "visible"}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md z-50"
        >
            <div className="px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Brain className="w-7 h-7 text-blue-500" />
                        <div>
                            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Crypto Intelligence</h1>
                            <p className="text-[10px] text-gray-500">KI-gestützte Marktanalyse</p>
                        </div>
                    </div>

                    {/* Session Timer & Global Stats - Desktop */}
                    <div className="hidden lg:flex items-center gap-6">
                        <SessionTimer />

                        {marketData?.global && (
                            <div className="flex items-center gap-4 text-[11px]">
                                <div className="flex flex-col">
                                    <span className="text-gray-500 uppercase text-[9px] font-bold tracking-wider">
                                        Vol 24h
                                    </span>
                                    <span className="text-gray-900 dark:text-white font-medium">
                                        ${(marketData.global.totalVolume / 1e9).toFixed(1)}B
                                    </span>
                                </div>
                                <div className="w-px h-6 bg-gray-200 dark:bg-gray-800" />
                                <div className="flex flex-col">
                                    <span className="text-gray-500 uppercase text-[9px] font-bold tracking-wider">
                                        BTC Dom
                                    </span>
                                    <span className="text-blue-600 dark:text-yellow-400 font-medium">
                                        {marketData.global.btcDominance.toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Global Stats - Mobile (compact) */}
                    {marketData?.global && (
                        <div className="flex md:hidden items-center gap-2 text-[10px]">
                            <span className="text-blue-600 dark:text-yellow-400 font-medium">
                                BTC {marketData.global.btcDominance.toFixed(1)}%
                            </span>
                            <span className="text-gray-300 dark:text-gray-700">|</span>
                            <span className="text-gray-900 dark:text-white font-medium">
                                ${(marketData.global.totalMarketCap / 1e12).toFixed(1)}T
                            </span>
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileDrawerOpen(true)}
                            className="lg:hidden p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            aria-label="Menü öffnen"
                        >
                            <svg
                                className="w-5 h-5 text-gray-600 dark:text-gray-300"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            </svg>
                        </button>

                        {/* WebSocket Status */}
                        <div
                            className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-gray-100 dark:bg-gray-800/50 rounded text-xs"
                            title={`WebSocket: ${connectionState}`}
                        >
                            <div
                                className={`w-2 h-2 rounded-full ${isConnected
                                    ? "bg-green-500 animate-pulse"
                                    : connectionState === "connecting"
                                        ? "bg-yellow-500 animate-pulse"
                                        : "bg-red-500"
                                    }`}
                            ></div>
                            <span className="text-gray-500 dark:text-gray-400 text-[10px]">LIVE</span>
                        </div>

                        {/* System Clock */}
                        <SystemClock />

                        {/* Report Button - Always visible */}
                        <button
                            onClick={generateIntelligenceReport}
                            disabled={analyzing}
                            className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 rounded-lg text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 text-white"
                            aria-label="KI-Report generieren"
                            data-tour="report-button"
                        >
                            <Brain
                                className={`w-3.5 h-3.5 ${analyzing ? "animate-pulse" : ""}`}
                            />
                            <span className="hidden sm:inline">
                                {analyzing ? "Analysiere..." : "Report"}
                            </span>
                        </button>

                        {/* Header Menu - Consolidates Refresh, Theme, Settings */}
                        <div data-tour="header-menu">
                            <HeaderMenu
                                onRefresh={() => {
                                    fetchData();
                                    fetchTradeRecommendations();
                                    setLastUpdated(new Date());
                                }}
                                isRefreshing={loading}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </motion.header>
    );
}
