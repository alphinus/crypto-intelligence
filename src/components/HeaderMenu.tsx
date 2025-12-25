'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  RefreshCw,
  Sun,
  Moon,
  Settings,
  Sliders,
  User,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';

interface HeaderMenuProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
  user?: { name?: string; email?: string } | null;
  onLogout?: () => void;
}

export function HeaderMenu({
  onRefresh,
  isRefreshing = false,
  user,
  onLogout,
}: HeaderMenuProps) {
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const menuItems = [
    {
      icon: RefreshCw,
      label: 'Refresh Data',
      onClick: () => {
        onRefresh?.();
        setIsOpen(false);
      },
      spinning: isRefreshing,
    },
    {
      icon: theme === 'dark' ? Sun : Moon,
      label: theme === 'dark' ? 'Light Mode' : 'Dark Mode',
      onClick: () => {
        toggleTheme();
        setIsOpen(false);
      },
    },
    {
      type: 'divider' as const,
    },
    {
      icon: Sliders,
      label: 'Analysis Settings',
      href: '/settings#analysis',
    },
    {
      icon: Settings,
      label: 'Settings',
      href: '/settings',
    },
  ];

  return (
    <div ref={menuRef} className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          p-2 rounded-lg transition-colors
          ${isOpen
            ? 'bg-gray-700 text-white'
            : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
          }
        `}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Menu className="w-5 h-5" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-xl border border-gray-700 overflow-hidden z-50"
          >
            {/* User info if logged in */}
            {user && (
              <div className="p-3 border-b border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {user.name || 'User'}
                    </p>
                    {user.email && (
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Menu items */}
            <div className="py-1">
              {menuItems.map((item, index) => {
                if ('type' in item && item.type === 'divider') {
                  return <div key={index} className="my-1 border-t border-gray-700" />;
                }

                const Icon = item.icon;
                const content = (
                  <div className="flex items-center gap-3 px-3 py-2 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors cursor-pointer">
                    <Icon className={`w-4 h-4 ${item.spinning ? 'animate-spin' : ''}`} />
                    <span className="flex-1 text-sm">{item.label}</span>
                    {item.href && <ChevronRight className="w-4 h-4 opacity-50" />}
                  </div>
                );

                if (item.href) {
                  return (
                    <Link key={index} href={item.href} onClick={() => setIsOpen(false)}>
                      {content}
                    </Link>
                  );
                }

                return (
                  <button key={index} onClick={item.onClick} className="w-full text-left">
                    {content}
                  </button>
                );
              })}

              {/* Logout button if user is logged in */}
              {user && onLogout && (
                <>
                  <div className="my-1 border-t border-gray-700" />
                  <button
                    onClick={() => {
                      onLogout();
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">Logout</span>
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
