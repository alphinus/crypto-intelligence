'use client';

import { motion } from 'framer-motion';
import { BarChart2, MessageSquare, Brain, Rocket } from 'lucide-react';

export type TabId = 'trading' | 'sentiment' | 'reports' | 'memecoins' | 'simulator';

interface Tab {
  id: TabId;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  description: string;
}

const TABS: Tab[] = [
  {
    id: 'trading',
    label: 'Trading',
    shortLabel: 'Trading',
    icon: <BarChart2 className="w-4 h-4" />,
    description: 'Chart, Signale, Liquidations, Alerts',
  },
  {
    id: 'sentiment',
    label: 'Sentiment',
    shortLabel: 'Sentiment',
    icon: <MessageSquare className="w-4 h-4" />,
    description: 'Markt-Stimmung, On-Chain, Social, YouTube',
  },
  {
    id: 'memecoins',
    label: 'Meme Coins',
    shortLabel: 'Memes',
    icon: <Rocket className="w-4 h-4" />,
    description: 'Meme Coins: DOGE, SHIB, PEPE, BONK, WIF',
  },
  {
    id: 'simulator',
    label: 'Simulator',
    shortLabel: 'Sim',
    icon: <Rocket className="w-4 h-4 text-yellow-400" />,
    description: 'Coin Creator & Trading Simulator (Lehrreich)',
  },
  {
    id: 'reports',
    label: 'Reports',
    shortLabel: 'Reports',
    icon: <Brain className="w-4 h-4" />,
    description: 'KI-generierte Markt- und Coin-Reports',
  },
];

interface TabNavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="border-b border-gray-800 bg-gray-900 sticky top-[130px] z-40 backdrop-blur-sm">
      <nav className="flex" aria-label="Tabs">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              whileHover={{ backgroundColor: 'rgba(31, 41, 55, 0.5)' }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className={`
                relative flex items-center gap-2 px-4 py-3 text-sm font-medium
                focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-inset
                ${isActive
                  ? 'text-blue-400 bg-gray-800/50'
                  : 'text-gray-400 hover:text-white'
                }
              `}
              aria-current={isActive ? 'page' : undefined}
              title={tab.description}
            >
              <motion.span
                animate={{ scale: isActive ? 1.1 : 1 }}
                transition={{ duration: 0.2 }}
              >
                {tab.icon}
              </motion.span>
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel}</span>
              {isActive && (
                <motion.span
                  layoutId="activeTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </nav>
    </div>
  );
}

// Export tabs for external use
export { TABS };
