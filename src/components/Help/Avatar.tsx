'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, HelpCircle, MessageCircle } from 'lucide-react';
import { useHelp } from './HelpProvider';

interface AvatarProps {
  message?: string;
  onMessageDismiss?: () => void;
}

export function Avatar({ message, onMessageDismiss }: AvatarProps) {
  const { isMinimized, setIsMinimized, startTour, hasCompletedTour, showTour } = useHelp();
  const [isBlinking, setIsBlinking] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Random blinking animation
  useEffect(() => {
    if (isMinimized || showTour) return;

    const blink = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    };

    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        blink();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isMinimized, showTour]);

  // Hide avatar during tour to avoid overlap
  if (showTour) {
    return null;
  }

  if (isMinimized) {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-4 right-4 z-50 w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full shadow-lg flex items-center justify-center"
        title="Satoshi wieder anzeigen"
      >
        <HelpCircle className="w-6 h-6 text-white" />
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0, y: 50 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ scale: 0, y: 50 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="fixed bottom-4 right-4 z-50"
    >
      {/* Message Bubble */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="absolute bottom-full right-0 mb-3 w-72"
          >
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-xl">
              <button
                onClick={onMessageDismiss}
                className="absolute top-2 right-2 text-gray-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
              <p className="text-sm text-gray-200 pr-4">{message}</p>
            </div>
            {/* Speech bubble pointer */}
            <div className="absolute bottom-0 right-8 w-4 h-4 bg-gray-800 border-r border-b border-gray-700 transform rotate-45 translate-y-2" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Menu */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="absolute bottom-full right-0 mb-3 w-48"
          >
            <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden shadow-xl">
              <button
                onClick={() => {
                  startTour();
                  setShowMenu(false);
                }}
                className="w-full px-4 py-3 text-left text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Tour starten
              </button>
              <button
                onClick={() => {
                  setIsMinimized(true);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-3 text-left text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-2 border-t border-gray-700"
              >
                <X className="w-4 h-4" />
                Minimieren
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Robot Avatar */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowMenu(!showMenu)}
        className="relative w-16 h-20 cursor-pointer focus:outline-none"
        title="Klick mich!"
      >
        {/* Robot SVG */}
        <svg viewBox="0 0 64 80" className="w-full h-full">
          {/* Antenna */}
          <motion.circle
            cx="32"
            cy="6"
            r="4"
            fill="#fbbf24"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <line x1="32" y1="10" x2="32" y2="18" stroke="#6b7280" strokeWidth="2" />

          {/* Head */}
          <rect x="12" y="18" width="40" height="30" rx="6" fill="#374151" stroke="#4b5563" strokeWidth="2" />

          {/* Eyes */}
          <motion.g animate={{ scaleY: isBlinking ? 0.1 : 1 }} style={{ transformOrigin: '32px 30px' }}>
            <circle cx="22" cy="30" r="6" fill="#1f2937" />
            <circle cx="42" cy="30" r="6" fill="#1f2937" />
            <motion.circle
              cx="22"
              cy="30"
              r="4"
              fill="#60a5fa"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <motion.circle
              cx="42"
              cy="30"
              r="4"
              fill="#60a5fa"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
            />
            {/* Eye highlights */}
            <circle cx="20" cy="28" r="1.5" fill="white" opacity="0.8" />
            <circle cx="40" cy="28" r="1.5" fill="white" opacity="0.8" />
          </motion.g>

          {/* Mouth */}
          <motion.path
            d="M 24 40 Q 32 46 40 40"
            stroke="#60a5fa"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            animate={message ? { d: ['M 24 40 Q 32 46 40 40', 'M 24 40 Q 32 42 40 40', 'M 24 40 Q 32 46 40 40'] } : {}}
            transition={{ duration: 0.3, repeat: message ? Infinity : 0 }}
          />

          {/* Body */}
          <rect x="16" y="50" width="32" height="24" rx="4" fill="#374151" stroke="#4b5563" strokeWidth="2" />

          {/* Body light/icon */}
          <motion.circle
            cx="32"
            cy="62"
            r="6"
            fill="#fbbf24"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          {/* Bitcoin symbol on body */}
          <text x="32" y="66" textAnchor="middle" fill="#1f2937" fontSize="10" fontWeight="bold">
            ₿
          </text>
        </svg>

        {/* Glow effect */}
        <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl -z-10" />
      </motion.button>
    </motion.div>
  );
}
