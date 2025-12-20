'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { PriceAlert, AlertNotification, NewPriceAlert } from '@/types/alerts';

const STORAGE_KEY = 'crypto-intelligence-alerts';
const NOTIFICATION_AUTO_DISMISS_MS = 10000; // 10 seconds
const MAX_NOTIFICATIONS = 5;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function usePriceAlerts() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [notifications, setNotifications] = useState<AlertNotification[]>([]);
  const [mounted, setMounted] = useState(false);
  const autoDismissTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Load from localStorage on mount
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Reset triggeredAt for alerts that were triggered more than 5 minutes ago
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        const resetAlerts = parsed.map((alert: PriceAlert) => ({
          ...alert,
          triggeredAt: alert.triggeredAt && alert.triggeredAt < fiveMinutesAgo
            ? undefined
            : alert.triggeredAt,
        }));
        setAlerts(resetAlerts);
      }
    } catch (e) {
      console.error('Failed to load alerts from localStorage:', e);
    }
  }, []);

  // Save to localStorage when alerts change
  useEffect(() => {
    if (mounted && alerts.length >= 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
      } catch (e) {
        console.error('Failed to save alerts to localStorage:', e);
      }
    }
  }, [alerts, mounted]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      autoDismissTimers.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  // Add a new alert
  const addAlert = useCallback((newAlert: NewPriceAlert) => {
    const alert: PriceAlert = {
      ...newAlert,
      id: generateId(),
      createdAt: Date.now(),
    };
    setAlerts((prev) => [...prev, alert]);
    return alert;
  }, []);

  // Remove an alert
  const removeAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  }, []);

  // Toggle alert enabled state
  const toggleAlert = useCallback((id: string) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === id
          ? { ...alert, enabled: !alert.enabled, triggeredAt: undefined }
          : alert
      )
    );
  }, []);

  // Update an alert
  const updateAlert = useCallback((id: string, updates: Partial<PriceAlert>) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === id ? { ...alert, ...updates } : alert
      )
    );
  }, []);

  // Mark alert as triggered
  const markTriggered = useCallback((id: string, price: number) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === id
          ? { ...alert, triggeredAt: Date.now(), lastTriggeredPrice: price }
          : alert
      )
    );
  }, []);

  // Add a notification
  const addNotification = useCallback((alert: PriceAlert, currentPrice: number, message: string) => {
    const notification: AlertNotification = {
      id: generateId(),
      alert,
      currentPrice,
      message,
      triggeredAt: Date.now(),
      dismissed: false,
    };

    setNotifications((prev) => {
      // Keep only the most recent notifications
      const updated = [notification, ...prev].slice(0, MAX_NOTIFICATIONS);
      return updated;
    });

    // Auto-dismiss after timeout
    const timer = setTimeout(() => {
      dismissNotification(notification.id);
    }, NOTIFICATION_AUTO_DISMISS_MS);

    autoDismissTimers.current.set(notification.id, timer);

    return notification;
  }, []);

  // Dismiss a notification
  const dismissNotification = useCallback((id: string) => {
    // Clear auto-dismiss timer if exists
    const timer = autoDismissTimers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      autoDismissTimers.current.delete(id);
    }

    setNotifications((prev) =>
      prev.filter((n) => n.id !== id)
    );
  }, []);

  // Dismiss all notifications
  const dismissAllNotifications = useCallback(() => {
    autoDismissTimers.current.forEach((timer) => clearTimeout(timer));
    autoDismissTimers.current.clear();
    setNotifications([]);
  }, []);

  // Get active alerts count
  const activeAlertsCount = alerts.filter((a) => a.enabled).length;

  // Get alerts for a specific symbol
  const getAlertsForSymbol = useCallback(
    (symbol: string) => alerts.filter((a) => a.symbol.toUpperCase() === symbol.toUpperCase()),
    [alerts]
  );

  return {
    alerts,
    notifications,
    activeAlertsCount,
    addAlert,
    removeAlert,
    toggleAlert,
    updateAlert,
    markTriggered,
    addNotification,
    dismissNotification,
    dismissAllNotifications,
    getAlertsForSymbol,
  };
}
