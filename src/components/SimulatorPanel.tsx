'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, Trash2, Info, Wallet } from 'lucide-react';
import { TokenDesigner } from './CoinCreator/TokenDesigner';
import { BondingCurveChart } from './CoinCreator/BondingCurveChart';
import { MockTradingPanel } from './CoinCreator/MockTradingPanel';
import type { MockToken, MockWallet, MockTrade } from '@/lib/bonding-curve';
import { createMockWallet } from '@/lib/bonding-curve';

const STORAGE_KEY_TOKEN = 'crypto_intelligence_sim_token';
const STORAGE_KEY_WALLET = 'crypto_intelligence_sim_wallet';

export function SimulatorPanel() {
    const [token, setToken] = useState<MockToken | null>(null);
    const [wallet, setWallet] = useState<MockWallet>(createMockWallet());
    const [isInitialized, setIsInitialized] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        const savedToken = localStorage.getItem(STORAGE_KEY_TOKEN);
        const savedWallet = localStorage.getItem(STORAGE_KEY_WALLET);

        if (savedToken) {
            try {
                const parsedToken = JSON.parse(savedToken);
                // Convert ISO string dates back to Date objects if needed
                parsedToken.createdAt = new Date(parsedToken.createdAt);
                parsedToken.trades = parsedToken.trades.map((t: any) => ({
                    ...t,
                    timestamp: new Date(t.timestamp)
                }));
                setToken(parsedToken);
            } catch (e) {
                console.error('Error parsing saved token', e);
            }
        }

        if (savedWallet) {
            try {
                setWallet(JSON.parse(savedWallet));
            } catch (e) {
                console.error('Error parsing saved wallet', e);
            }
        }

        setIsInitialized(true);
    }, []);

    // Save to localStorage when state changes
    useEffect(() => {
        if (!isInitialized) return;

        if (token) {
            localStorage.setItem(STORAGE_KEY_TOKEN, JSON.stringify(token));
        } else {
            localStorage.removeItem(STORAGE_KEY_TOKEN);
        }
    }, [token, isInitialized]);

    useEffect(() => {
        if (!isInitialized) return;
        localStorage.setItem(STORAGE_KEY_WALLET, JSON.stringify(wallet));
    }, [wallet, isInitialized]);

    const handleTokenCreated = (newToken: MockToken) => {
        setToken(newToken);
    };

    const handleTradeExecuted = (trade: MockTrade) => {
        if (!token) return;

        // Update token state (the trade logic already updated the object, 
        // but we need to trigger a re-render in React)
        const updatedToken = { ...token };
        setToken(updatedToken);

        // Update wallet state
        const updatedWallet = { ...wallet };
        setWallet(updatedWallet);
    };

    const resetSimulator = () => {
        if (confirm('Simulator wirklich zurücksetzen? Alle Fortschritte gehen verloren.')) {
            setToken(null);
            setWallet(createMockWallet());
        }
    };

    if (!isInitialized) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
            {/* Header Info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-blue-900/20 border border-blue-800/50 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                    <div className="bg-blue-600 p-2 rounded-lg mt-1">
                        <Info className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            Coin Simulator <span className="text-xs bg-blue-600 px-2 py-0.5 rounded uppercase tracking-wider">Beta</span>
                        </h2>
                        <p className="text-sm text-gray-400">
                            Lerne wie Bonding Curves funktionieren. Alles hier ist eine Simulation mit Spielgeld.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-center">
                    <button
                        onClick={resetSimulator}
                        className="flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-red-400 transition-colors bg-gray-800/50 rounded-lg"
                    >
                        <Trash2 className="w-4 h-4" />
                        Reset
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {!token ? (
                    <motion.div
                        key="designer"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                    >
                        <div className="space-y-6">
                            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                                <Rocket className="w-6 h-6 text-yellow-500" />
                                Erstelle deinen eigenen Coin
                            </h3>
                            <p className="text-gray-400 leading-relaxed">
                                Wähle einen Namen, ein Symbol und lade ein Logo hoch.
                                Dein Coin wird auf einer mathematischen Bonding-Curve gestartet.
                                Je mehr Leute kaufen, desto höher steigt der Preis!
                            </p>

                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <div className="bg-gray-800 p-2 rounded-full h-fit">
                                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                                    </div>
                                    <p className="text-sm text-gray-300">
                                        <span className="font-bold">Keine Kosten:</span> Nutze kostenloses Spielgeld zum Experimentieren.
                                    </p>
                                </div>
                                <div className="flex gap-3">
                                    <div className="bg-gray-800 p-2 rounded-full h-fit">
                                        <div className="w-2 h-2 rounded-full bg-green-500" />
                                    </div>
                                    <p className="text-sm text-gray-300">
                                        <span className="font-bold">Mathematisch:</span> Lerne die Logik hinter Pump.fun und Bonding Curves.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <TokenDesigner onTokenCreated={handleTokenCreated} />
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="dashboard"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="grid grid-cols-1 lg:grid-cols-12 gap-6"
                    >
                        {/* Main Column */}
                        <div className="lg:col-span-8 space-y-6">
                            {/* Token Info Banner */}
                            <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6">
                                {token.logo ? (
                                    <img src={token.logo} alt={token.name} className="w-24 h-24 rounded-2xl object-cover shadow-2xl" />
                                ) : (
                                    <div className="w-24 h-24 rounded-2xl bg-blue-600 flex items-center justify-center text-4xl font-bold text-white shadow-2xl">
                                        {token.symbol[0]}
                                    </div>
                                )}

                                <div className="flex-1 text-center md:text-left">
                                    <h2 className="text-3xl font-black text-white mb-1 uppercase tracking-tight">
                                        {token.name} <span className="text-gray-500 font-medium">${token.symbol}</span>
                                    </h2>
                                    <p className="text-gray-400 line-clamp-2 mb-4 max-w-xl">
                                        {token.description}
                                    </p>

                                    <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                        {token.twitter && (
                                            <a href={token.twitter} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline">Twitter</a>
                                        )}
                                        {token.telegram && (
                                            <a href={token.telegram} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline">Telegram</a>
                                        )}
                                        {token.website && (
                                            <a href={token.website} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline">Website</a>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Chart */}
                            <BondingCurveChart token={token} />
                        </div>

                        {/* Sidebar Column */}
                        <div className="lg:col-span-4 space-y-6">
                            <MockTradingPanel
                                token={token}
                                wallet={wallet}
                                onTradeExecuted={handleTradeExecuted}
                            />

                            {/* Educational Card */}
                            <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-2xl p-5">
                                <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                    <Brain className="w-4 h-4 text-pink-400" />
                                    Was passiert hier?
                                </h4>
                                <p className="text-xs text-gray-300 leading-relaxed mb-3">
                                    Die <span className="text-indigo-300 font-bold">Bonding Curve</span> legt den Preis fest.
                                    In dieser Simulation nutzen wir eine exponentielle Kurve: Je mehr Tokens im Umlauf sind,
                                    desto teurer wird der nächste Token.
                                </p>
                                <p className="text-xs text-gray-300 leading-relaxed">
                                    Wenn die Market Cap <span className="text-green-400 font-bold">$69.000</span> erreicht, "graduiert"
                                    der Token und die Liquidität wird symbolisch auf eine DEX übertragen.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
