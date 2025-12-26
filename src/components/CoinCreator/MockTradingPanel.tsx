'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpCircle, ArrowDownCircle, Wallet, AlertTriangle, CheckCircle } from 'lucide-react';
import type { MockToken, MockWallet, MockTrade } from '@/lib/bonding-curve';
import {
  calculateBuyCost,
  calculateSellReturn,
  calculatePriceAtSupply,
  executeBuy,
  executeSell,
  formatUSD,
  formatTokenAmount,
} from '@/lib/bonding-curve';

interface MockTradingPanelProps {
  token: MockToken;
  wallet: MockWallet;
  onTradeExecuted: (trade: MockTrade) => void;
}

export function MockTradingPanel({ token, wallet, onTradeExecuted }: MockTradingPanelProps) {
  const [mode, setMode] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const currentPrice = calculatePriceAtSupply(token.currentSupply, token.bondingCurve);
  const holdings = wallet.holdings[token.id] || 0;

  // Calculate trade preview
  const preview = (() => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return null;

    if (mode === 'buy') {
      // Amount is USD
      const tokenAmount = numAmount / currentPrice;
      const { cost, avgPrice, priceImpact } = calculateBuyCost(
        tokenAmount,
        token.currentSupply,
        token.bondingCurve
      );
      return {
        inputLabel: 'USD',
        outputLabel: token.symbol,
        input: numAmount,
        output: numAmount / avgPrice,
        avgPrice,
        priceImpact,
        canExecute: wallet.balance >= numAmount,
      };
    } else {
      // Amount is tokens
      if (numAmount > holdings) return null;
      const { returnUsd, avgPrice, priceImpact } = calculateSellReturn(
        numAmount,
        token.currentSupply,
        token.bondingCurve
      );
      return {
        inputLabel: token.symbol,
        outputLabel: 'USD',
        input: numAmount,
        output: returnUsd,
        avgPrice,
        priceImpact,
        canExecute: holdings >= numAmount,
      };
    }
  })();

  const handleTrade = () => {
    setError(null);
    setSuccess(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Ungültiger Betrag');
      return;
    }

    let result;
    if (mode === 'buy') {
      result = executeBuy(token, numAmount, wallet);
    } else {
      result = executeSell(token, numAmount, wallet);
    }

    if (result.success && result.trade) {
      setSuccess(
        mode === 'buy'
          ? `${formatTokenAmount(result.trade.amount)} ${token.symbol} gekauft!`
          : `${formatUSD(result.trade.total)} erhalten!`
      );
      onTradeExecuted(result.trade);
      setAmount('');
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(result.error || 'Trade fehlgeschlagen');
    }
  };

  const quickBuyAmounts = [10, 50, 100, 500];
  const quickSellPercentages = [25, 50, 75, 100];

  return (
    <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6">
      {/* Wallet Info */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-yellow-400" />
          <span className="text-gray-400">Spielgeld-Wallet</span>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-white">{formatUSD(wallet.balance)}</div>
          <div className="text-xs text-gray-500">
            {holdings > 0 && `${formatTokenAmount(holdings)} ${token.symbol}`}
          </div>
        </div>
      </div>

      {/* Buy/Sell Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => { setMode('buy'); setAmount(''); }}
          className={`flex-1 py-2.5 rounded-lg font-bold transition-all ${mode === 'buy'
              ? 'bg-green-500 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
        >
          <ArrowUpCircle className="w-4 h-4 inline mr-1" />
          Kaufen
        </button>
        <button
          onClick={() => { setMode('sell'); setAmount(''); }}
          disabled={holdings <= 0}
          className={`flex-1 py-2.5 rounded-lg font-bold transition-all ${mode === 'sell'
              ? 'bg-red-500 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            } ${holdings <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <ArrowDownCircle className="w-4 h-4 inline mr-1" />
          Verkaufen
        </button>
      </div>

      {/* Amount Input */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm text-gray-400 mb-1">
            {mode === 'buy' ? 'Betrag in USD' : `Anzahl ${token.symbol}`}
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-yellow-500 transition-colors"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
              {mode === 'buy' ? 'USD' : token.symbol}
            </span>
          </div>
        </div>

        {/* Quick Buttons */}
        <div className="flex gap-2">
          {mode === 'buy' ? (
            quickBuyAmounts.map(amt => (
              <button
                key={amt}
                onClick={() => setAmount(amt.toString())}
                className="flex-1 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 transition-colors"
              >
                ${amt}
              </button>
            ))
          ) : (
            quickSellPercentages.map(pct => (
              <button
                key={pct}
                onClick={() => setAmount((holdings * pct / 100).toFixed(2))}
                disabled={holdings <= 0}
                className="flex-1 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 transition-colors"
              >
                {pct}%
              </button>
            ))
          )}
        </div>

        {/* Trade Preview */}
        <AnimatePresence>
          {preview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gray-800/50 rounded-lg p-3 space-y-2"
            >
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Du {mode === 'buy' ? 'bekommst' : 'erhaeltst'}:</span>
                <span className="text-white font-bold">
                  {mode === 'buy'
                    ? `~${formatTokenAmount(preview.output)} ${token.symbol}`
                    : formatUSD(preview.output)
                  }
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Durchschnittspreis:</span>
                <span className="text-white">{formatUSD(preview.avgPrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Preis-Impact:</span>
                <span className={preview.priceImpact > 5 ? 'text-red-400' : 'text-yellow-400'}>
                  {mode === 'buy' ? '+' : '-'}{preview.priceImpact.toFixed(2)}%
                </span>
              </div>
              {preview.priceImpact > 10 && (
                <div className="flex items-center gap-1 text-xs text-red-400">
                  <AlertTriangle className="w-3 h-3" />
                  Hoher Preis-Impact! Kleiner handeln.
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error/Success Messages */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-red-400 text-sm"
            >
              <AlertTriangle className="w-4 h-4" />
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-green-400 text-sm"
            >
              <CheckCircle className="w-4 h-4" />
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Execute Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleTrade}
          disabled={!preview?.canExecute}
          className={`w-full py-3 rounded-xl font-bold text-lg transition-all ${preview?.canExecute
              ? mode === 'buy'
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg hover:shadow-green-500/25'
                : 'bg-gradient-to-r from-red-500 to-rose-500 text-white hover:shadow-lg hover:shadow-red-500/25'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
        >
          {mode === 'buy' ? 'Kaufen' : 'Verkaufen'}
        </motion.button>
      </div>

      {/* Recent Trades */}
      {token.trades.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-800">
          <h4 className="text-sm text-gray-400 mb-2">Letzte Trades</h4>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {token.trades.slice(-5).reverse().map(trade => (
              <div key={trade.id} className="flex justify-between text-xs">
                <span className={trade.type === 'buy' ? 'text-green-400' : 'text-red-400'}>
                  {trade.type === 'buy' ? 'KAUF' : 'VERK'}
                </span>
                <span className="text-gray-400">
                  {formatTokenAmount(trade.amount)} @ {formatUSD(trade.price)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
