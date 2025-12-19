'use client';

import { BarChart2, MessageSquare, Brain, BookOpen } from 'lucide-react';

export type TabId = 'trading' | 'sentiment' | 'reports' | 'resources';

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
    label: 'Chart & Trading',
    shortLabel: 'Trading',
    icon: <BarChart2 className="w-4 h-4" />,
    description: 'Live-Chart, Trade-Empfehlungen, Confluence Zones',
  },
  {
    id: 'sentiment',
    label: 'Sentiment & On-Chain',
    shortLabel: 'Sentiment',
    icon: <MessageSquare className="w-4 h-4" />,
    description: 'Reddit, Twitter, Telegram, DeFi, Futures, Bitcoin On-Chain',
  },
  {
    id: 'reports',
    label: 'KI Reports',
    shortLabel: 'Reports',
    icon: <Brain className="w-4 h-4" />,
    description: 'Markt- und Coin-Intelligence Reports',
  },
  {
    id: 'resources',
    label: 'Resources',
    shortLabel: 'Resources',
    icon: <BookOpen className="w-4 h-4" />,
    description: 'YouTube, News Archive',
  },
];

interface TabNavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="border-b border-gray-800 bg-gray-900/50 sticky top-[97px] z-40">
      <nav className="flex" aria-label="Tabs">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors
                focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-inset
                ${isActive
                  ? 'text-blue-400 bg-gray-800/50'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/30'
                }
              `}
              aria-current={isActive ? 'page' : undefined}
              title={tab.description}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel}</span>
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

// Export tabs for external use
export { TABS };
