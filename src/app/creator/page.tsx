'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Rocket, TrendingUp, Zap, Users, Trophy, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { TokenDesigner, BondingCurveChart, MockTradingPanel } from '@/components/CoinCreator';
import type { MockToken, MockWallet, MockTrade } from '@/lib/bonding-curve';
import { createMockWallet, formatUSD, formatTokenAmount } from '@/lib/bonding-curve';

type Phase = 'create' | 'trade';

export default function CoinCreatorPage() {
  const [phase, setPhase] = useState<Phase>('create');
  const [token, setToken] = useState<MockToken | null>(null);
  const [wallet, setWallet] = useState<MockWallet>(() => createMockWallet(10000));
  const [tradeHistory, setTradeHistory] = useState<MockTrade[]>([]);

  const handleTokenCreated = useCallback((newToken: MockToken) => {
    setToken(newToken);
    setPhase('trade');
  }, []);

  const handleTradeExecuted = useCallback((trade: MockTrade) => {
    setTradeHistory(prev => [...prev, trade]);
    // Force re-render by creating new token reference
    setToken(prev => prev ? { ...prev } : null);
    // Force re-render wallet
    setWallet(prev => ({ ...prev }));
  }, []);

  const handleReset = useCallback(() => {
    setPhase('create');
    setToken(null);
    setWallet(createMockWallet(10000));
    setTradeHistory([]);
  }, []);

  // Calculate P&L
  const calculatePnL = () => {
    if (!token) return { totalInvested: 0, currentValue: 0, pnl: 0, pnlPercent: 0 };

    const holdings = wallet.holdings[token.id] || 0;
    const buys = tradeHistory.filter(t => t.type === 'buy');
    const sells = tradeHistory.filter(t => t.type === 'sell');

    const totalInvested = buys.reduce((sum, t) => sum + t.total, 0);
    const totalReceived = sells.reduce((sum, t) => sum + t.total, 0);

    // Current value of holdings
    const currentPrice = token.trades.length > 0
      ? token.trades[token.trades.length - 1].price
      : 0;
    const holdingsValue = holdings * currentPrice;

    const currentValue = holdingsValue + totalReceived;
    const pnl = currentValue - totalInvested;
    const pnlPercent = totalInvested > 0 ? (pnl / totalInvested) * 100 : 0;

    return { totalInvested, currentValue, pnl, pnlPercent };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-xl border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Zurueck</span>
            </Link>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg">
                <Rocket className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">Coin Creator</h1>
              <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                Simulator
              </span>
            </div>
          </div>

          {phase === 'trade' && (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Neuer Token</span>
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {phase === 'create' && (
            <motion.div
              key="create"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Intro Section */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">
                  Erstelle deinen eigenen Memecoin
                </h2>
                <p className="text-gray-400 max-w-xl mx-auto">
                  Simuliere den Launch eines Tokens mit Bonding Curve -
                  genau wie auf Pump.fun. Lerne wie Preise, Supply und Market Cap zusammenhaengen.
                </p>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 flex items-start gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Bonding Curve</h3>
                    <p className="text-sm text-gray-400">Preis steigt automatisch mit jedem Kauf</p>
                  </div>
                </div>
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 flex items-start gap-3">
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <Zap className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Spielgeld Trading</h3>
                    <p className="text-sm text-gray-400">$10.000 virtuelles Kapital zum Ueben</p>
                  </div>
                </div>
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 flex items-start gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Trophy className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Graduation</h3>
                    <p className="text-sm text-gray-400">Erreiche $69k Market Cap</p>
                  </div>
                </div>
              </div>

              {/* Token Designer */}
              <TokenDesigner onTokenCreated={handleTokenCreated} />
            </motion.div>
          )}

          {phase === 'trade' && token && (
            <motion.div
              key="trade"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Token Header */}
              <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    {token.logo ? (
                      <img
                        src={token.logo}
                        alt={token.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-yellow-500"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-2xl font-bold text-white">
                        {token.symbol.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h2 className="text-2xl font-bold text-white">{token.name}</h2>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">${token.symbol}</span>
                        {token.isGraduated && (
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
                            <Trophy className="w-3 h-3" />
                            Graduiert!
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* P&L Display */}
                  {tradeHistory.length > 0 && (() => {
                    const { totalInvested, pnl, pnlPercent } = calculatePnL();
                    return (
                      <div className="text-right">
                        <div className="text-sm text-gray-400">Dein P&L</div>
                        <div className={`text-xl font-bold ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {pnl >= 0 ? '+' : ''}{formatUSD(pnl)}
                          <span className="text-sm ml-1">
                            ({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Investiert: {formatUSD(totalInvested)}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {token.description && (
                  <p className="mt-4 text-gray-400 text-sm">{token.description}</p>
                )}
              </div>

              {/* Trading Interface */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Chart */}
                <BondingCurveChart token={token} />

                {/* Right: Trading Panel */}
                <MockTradingPanel
                  token={token}
                  wallet={wallet}
                  onTradeExecuted={handleTradeExecuted}
                />
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center">
                  <div className="text-xs text-gray-400 mb-1">Total Trades</div>
                  <div className="text-2xl font-bold text-white">{token.trades.length}</div>
                </div>
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center">
                  <div className="text-xs text-gray-400 mb-1">Reserve Balance</div>
                  <div className="text-2xl font-bold text-green-400">{formatUSD(token.reserveBalance)}</div>
                </div>
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center">
                  <div className="text-xs text-gray-400 mb-1">Deine Holdings</div>
                  <div className="text-2xl font-bold text-yellow-400">
                    {formatTokenAmount(wallet.holdings[token.id] || 0)}
                  </div>
                </div>
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center">
                  <div className="text-xs text-gray-400 mb-1">Wallet Balance</div>
                  <div className="text-2xl font-bold text-white">{formatUSD(wallet.balance)}</div>
                </div>
              </div>

              {/* Educational Info */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <h4 className="font-bold text-blue-400 mb-2">Wie funktioniert die Bonding Curve?</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• <strong>Kaufen:</strong> Der Preis steigt mit jedem Kauf, da mehr Tokens im Umlauf sind</li>
                  <li>• <strong>Verkaufen:</strong> Der Preis sinkt, wenn Tokens zurueck in die Curve verkauft werden</li>
                  <li>• <strong>Price Impact:</strong> Grosse Orders haben einen staerkeren Einfluss auf den Preis</li>
                  <li>• <strong>Graduation:</strong> Bei $69k Market Cap wird der Token "graduiert" und waere bereit fuer DEX-Listing</li>
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
