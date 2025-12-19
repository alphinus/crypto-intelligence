'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { TabId } from './TabNavigation';

interface TabPanelProps {
  id: TabId;
  activeTab: TabId;
  children: React.ReactNode;
}

const tabContentVariants = {
  hidden: {
    opacity: 0,
    x: 20,
    transition: { duration: 0.2 }
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94] as const, // easeOutQuad
    }
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: { duration: 0.2 }
  }
};

export function TabPanel({ id, activeTab, children }: TabPanelProps) {
  const isActive = id === activeTab;

  return (
    <AnimatePresence mode="wait">
      {isActive && (
        <motion.div
          key={id}
          variants={tabContentVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          role="tabpanel"
          id={`tabpanel-${id}`}
          aria-labelledby={`tab-${id}`}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Alternative: All panels rendered but hidden (for preserving state)
export function TabPanelPersistent({ id, activeTab, children }: TabPanelProps) {
  const isActive = id === activeTab;

  return (
    <motion.div
      animate={{
        opacity: isActive ? 1 : 0,
        x: isActive ? 0 : 20,
        pointerEvents: isActive ? 'auto' : 'none',
        position: isActive ? 'relative' : 'absolute',
      }}
      transition={{ duration: 0.3 }}
      role="tabpanel"
      id={`tabpanel-${id}`}
      aria-labelledby={`tab-${id}`}
      aria-hidden={!isActive}
      className={isActive ? '' : 'invisible h-0 overflow-hidden'}
    >
      {children}
    </motion.div>
  );
}
