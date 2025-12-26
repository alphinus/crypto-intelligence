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
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#050505] overflow-hidden"
        >
          {/* HUGE BTC Logo Underlay */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 0.05 }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="absolute pointer-events-none select-none"
          >
            <svg viewBox="0 0 64 64" className="w-[80vw] h-[80vw] text-orange-500 fill-current">
              <path d="M63.04 39.75c-1.39 5.58-6.04 9.17-12.06 9.68l-2.07 8.28-5.04 1.26 2.06-8.23c-1.32.33-2.65.65-3.95.96l-2.07 8.29-5.04 1.26 2.07-8.28c-1.1.26-2.18.52-3.23.77l-6.95 1.74-1.34-5.38s3.74-.86 3.66-.91c2.04-.51 3.01-1.85 2.93-3.64l-2.07-8.28c.14-.04.32-.1.52-.18-.17.04-.35.09-.54.14l-2.9 11.61c-.44 1.1-1.46 1.74-2.82 2.08-.1.03-.22.06-.35.08l-5.01 1.25.75-2.99s-1.87.47-1.87.47c-2.47.62-4.14-1.01-4.89-3.98l-3.37-13.48c-.75-3.02.73-4.66 3.19-5.28l1.83-.46-.73 2.93c1.37-.34 2.76-.66 4.14-1l.73-2.93 5.04-1.26-.73 2.93c1.08-.27 2.14-.54 3.19-.8l.73-2.93 6.95-1.74 1.34 5.39s-1.95.49-1.95.49c1.42 1.34 1.96 2.58 2.3 4.29l2.07 8.28s.66-.17 1.87-.47l.73-2.93c1.1-.26 2.18-.52 3.23-.77l.73-2.93 5.04-1.26-.73 2.93c1.32-.33 2.65-.65 3.95-.96l.73-2.93 5.04-1.26-.73 2.93c5.44.82 9.63 3.14 10.87 8.09 1.01 4.02-.45 6.36-3.3 7.85 2.07 1.14 3.29 2.1 3.73 5.43zm-16.71-3.6l-5.01 1.25.74-2.98s2.61-.65 2.61-.65c1.61-.4 2.27 1.12 1.66 2.38z" />
            </svg>
          </motion.div>

          <div className="relative z-10 flex flex-col items-center gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex items-center gap-4"
            >
              <div className="w-16 h-16 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                <span className="text-3xl font-bold text-orange-500 uppercase tracking-tighter">BTC</span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-500 text-xs font-bold uppercase tracking-[0.2em] leading-none mb-1">Market Pulse</span>
                <span className="text-2xl font-black text-white leading-none">BITCOIN</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.5, type: 'spring' }}
              className={`text-6xl md:text-8xl font-black tracking-tighter ${btcChange >= 0 ? 'text-green-500' : 'text-red-500'
                }`}
              style={{ filter: `drop-shadow(0 0 20px ${btcChange >= 0 ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'})` }}
            >
              {btcChange >= 0 ? '+' : ''}{btcChange.toFixed(2)}%
            </motion.div>

            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 1.8, ease: "linear" }}
              className="h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent absolute -bottom-12 max-w-xs"
            />
          </div>

          {/* Background effects */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.05)_0%,transparent_70%)] pointer-events-none" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
