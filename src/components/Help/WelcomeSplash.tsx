'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useHelp } from './HelpProvider';
import type { SatoshiContext } from '@/lib/satoshi-responder';

interface WelcomeSplashProps {
  context?: SatoshiContext;
}

export function WelcomeSplash({ context }: WelcomeSplashProps) {
  const { showWelcomeBack, dismissWelcomeBack } = useHelp();

  // Get BTC data from context
  const btcCoin = context?.topCoins?.find(c =>
    c.symbol.toUpperCase().includes('BTC')
  );
  const btcChange = btcCoin?.change24h ?? 0;

  return (
    <AnimatePresence>
      {showWelcomeBack && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={dismissWelcomeBack}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-sm cursor-pointer"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 20,
              delay: 0.1
            }}
            className="text-center px-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glitch Text */}
            <h1
              className="text-4xl md:text-5xl font-bold text-white glitch-text"
              data-text="Willkommen zurueck, Elvis!"
            >
              Willkommen zurueck, Elvis!
            </h1>

            {/* BTC Status with Neon Glow */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={`mt-6 text-2xl md:text-3xl font-mono neon-glow ${
                btcChange >= 0 ? 'text-green-400' : 'text-red-400'
              }`}
            >
              BTC {btcChange >= 0 ? '📈' : '📉'} {btcChange >= 0 ? '+' : ''}{btcChange.toFixed(2)}%
            </motion.div>

            {/* Animated Robot */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
              className="mt-8 flex justify-center"
            >
              <svg viewBox="0 0 64 80" className="w-24 h-28">
                {/* Antenna - pulsing */}
                <motion.circle
                  cx="32"
                  cy="6"
                  r="4"
                  fill="#fbbf24"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                <line x1="32" y1="10" x2="32" y2="18" stroke="#6b7280" strokeWidth="2" />

                {/* Head */}
                <rect x="12" y="18" width="40" height="30" rx="6" fill="#374151" stroke="#4b5563" strokeWidth="2" />

                {/* Eyes - excited/glowing */}
                <circle cx="22" cy="30" r="6" fill="#1f2937" />
                <circle cx="42" cy="30" r="6" fill="#1f2937" />
                <motion.circle
                  cx="22"
                  cy="30"
                  r="5"
                  fill="#0ff"
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  style={{ filter: 'drop-shadow(0 0 8px #0ff)' }}
                />
                <motion.circle
                  cx="42"
                  cy="30"
                  r="5"
                  fill="#0ff"
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 0.5, repeat: Infinity, delay: 0.1 }}
                  style={{ filter: 'drop-shadow(0 0 8px #0ff)' }}
                />

                {/* Mouth - happy */}
                <motion.path
                  d="M 24 40 Q 32 48 40 40"
                  stroke="#0ff"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  style={{ filter: 'drop-shadow(0 0 4px #0ff)' }}
                />

                {/* Body */}
                <rect x="16" y="50" width="32" height="24" rx="4" fill="#374151" stroke="#4b5563" strokeWidth="2" />

                {/* Body light - Bitcoin symbol */}
                <motion.circle
                  cx="32"
                  cy="62"
                  r="8"
                  fill="#fbbf24"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  style={{ filter: 'drop-shadow(0 0 10px #fbbf24)' }}
                />
                <text x="32" y="66" textAnchor="middle" fill="#1f2937" fontSize="12" fontWeight="bold">
                  ₿
                </text>
              </svg>
            </motion.div>

            {/* Dismiss hint */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ delay: 1 }}
              className="mt-6 text-sm text-gray-500"
            >
              Klick zum Schliessen
            </motion.p>
          </motion.div>

          {/* Scan lines overlay for cyber effect */}
          <div className="absolute inset-0 pointer-events-none scanlines opacity-10" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
