'use client';

import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 light:bg-gray-200 light:hover:bg-gray-300 transition-colors"
      title={theme === 'dark' ? 'Light Mode aktivieren' : 'Dark Mode aktivieren'}
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 text-yellow-400" />
      ) : (
        <Moon className="w-4 h-4 text-blue-500" />
      )}
    </button>
  );
}
