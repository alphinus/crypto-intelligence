'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

export type HelpLevel = 'beginner' | 'pro';

interface HelpContextValue {
  level: HelpLevel;
  setLevel: (level: HelpLevel) => void;
  showTour: boolean;
  startTour: () => void;
  endTour: () => void;
  hasCompletedTour: boolean;
  setHasCompletedTour: (completed: boolean) => void;
  isMinimized: boolean;
  setIsMinimized: (minimized: boolean) => void;
  // Neue States für Welcome-Back
  showWelcomeBack: boolean;
  dismissWelcomeBack: () => void;
}

const HelpContext = createContext<HelpContextValue | null>(null);

const STORAGE_KEY = 'crypto-intelligence-help';

interface StoredHelpState {
  level: HelpLevel;
  hasCompletedTour: boolean;
  isMinimized: boolean;
  lastVisit: string | null; // ISO Date string
}

interface HelpProviderProps {
  children: ReactNode;
}

export function HelpProvider({ children }: HelpProviderProps) {
  const [level, setLevelState] = useState<HelpLevel>('beginner');
  const [showTour, setShowTour] = useState(false);
  const [hasCompletedTour, setHasCompletedTourState] = useState(false);
  const [isMinimized, setIsMinimizedState] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [lastVisit, setLastVisit] = useState<string | null>(null);
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: StoredHelpState = JSON.parse(stored);
        setLevelState(parsed.level || 'beginner');
        setHasCompletedTourState(parsed.hasCompletedTour || false);
        setIsMinimizedState(parsed.isMinimized || false);
        setLastVisit(parsed.lastVisit || null);
      }
    } catch (e) {
      console.error('Failed to load help state:', e);
    }
    setIsHydrated(true);
  }, []);

  // Auto-start tour for first-time visitors
  useEffect(() => {
    if (isHydrated && !hasCompletedTour) {
      // Small delay to let the page render first
      const timer = setTimeout(() => {
        setShowTour(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isHydrated, hasCompletedTour]);

  // Welcome-back logic for returning users
  useEffect(() => {
    if (isHydrated && hasCompletedTour && !isMinimized && !showTour) {
      const now = new Date();

      // Check if last visit was > 1 hour ago
      const hoursSinceLastVisit = lastVisit
        ? (now.getTime() - new Date(lastVisit).getTime()) / (1000 * 60 * 60)
        : Infinity;

      if (hoursSinceLastVisit > 1) {
        // Show welcome-back message
        setShowWelcomeBack(true);

        // Auto-hide after 5 seconds
        const timer = setTimeout(() => {
          setShowWelcomeBack(false);
        }, 5000);

        return () => clearTimeout(timer);
      }

      // Update lastVisit timestamp
      setLastVisit(now.toISOString());
    }
  }, [isHydrated, hasCompletedTour, isMinimized, showTour]); // Don't include lastVisit to prevent loop

  // Save to localStorage when state changes
  useEffect(() => {
    if (!isHydrated) return;

    try {
      const state: StoredHelpState = {
        level,
        hasCompletedTour,
        isMinimized,
        lastVisit,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save help state:', e);
    }
  }, [level, hasCompletedTour, isMinimized, lastVisit, isHydrated]);

  const setLevel = useCallback((newLevel: HelpLevel) => {
    setLevelState(newLevel);
  }, []);

  const startTour = useCallback(() => {
    setShowTour(true);
    setIsMinimizedState(false);
  }, []);

  const endTour = useCallback(() => {
    setShowTour(false);
    setHasCompletedTourState(true);
  }, []);

  const setHasCompletedTour = useCallback((completed: boolean) => {
    setHasCompletedTourState(completed);
  }, []);

  const setIsMinimized = useCallback((minimized: boolean) => {
    setIsMinimizedState(minimized);
  }, []);

  const dismissWelcomeBack = useCallback(() => {
    setShowWelcomeBack(false);
  }, []);

  const value: HelpContextValue = {
    level,
    setLevel,
    showTour,
    startTour,
    endTour,
    hasCompletedTour,
    setHasCompletedTour,
    isMinimized,
    setIsMinimized,
    showWelcomeBack,
    dismissWelcomeBack,
  };

  return (
    <HelpContext.Provider value={value}>
      {children}
    </HelpContext.Provider>
  );
}

export function useHelp(): HelpContextValue {
  const context = useContext(HelpContext);
  if (!context) {
    throw new Error('useHelp must be used within a HelpProvider');
  }
  return context;
}
