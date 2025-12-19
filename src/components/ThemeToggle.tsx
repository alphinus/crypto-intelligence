'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      onClick={toggleTheme}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9, rotate: 15 }}
      className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 light:bg-gray-200 light:hover:bg-gray-300 transition-colors overflow-hidden"
      title={theme === 'dark' ? 'Light Mode aktivieren' : 'Dark Mode aktivieren'}
    >
      <AnimatePresence mode="wait">
        {theme === 'dark' ? (
          <motion.div
            key="sun"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Sun className="w-4 h-4 text-yellow-400" />
          </motion.div>
        ) : (
          <motion.div
            key="moon"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Moon className="w-4 h-4 text-blue-500" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
