'use client';

import { motion } from 'framer-motion';
import { Bell, TrendingUp, TrendingDown, Brain, X } from 'lucide-react';
import type { AlertNotification as AlertNotificationType } from '@/types/alerts';

interface AlertNotificationProps {
  notification: AlertNotificationType;
  onDismiss: (id: string) => void;
  index: number;
}

export function AlertNotification({ notification, onDismiss, index }: AlertNotificationProps) {
  const { alert, message, currentPrice } = notification;

  // Icon based on alert type
  const getIcon = () => {
    switch (alert.type) {
      case 'price':
        return alert.condition === 'above' ? (
          <TrendingUp className="w-5 h-5 text-green-400" />
        ) : (
          <TrendingDown className="w-5 h-5 text-red-400" />
        );
      case 'signal':
        return alert.signalType === 'long' ? (
          <TrendingUp className="w-5 h-5 text-green-400" />
        ) : (
          <TrendingDown className="w-5 h-5 text-red-400" />
        );
      case 'sentiment':
        return <Brain className="w-5 h-5 text-purple-400" />;
      default:
        return <Bell className="w-5 h-5 text-yellow-400" />;
    }
  };

  // Background color based on alert type
  const getBgColor = () => {
    switch (alert.type) {
      case 'price':
        return alert.condition === 'above'
          ? 'bg-green-500/10 border-green-500/50'
          : 'bg-red-500/10 border-red-500/50';
      case 'signal':
        return alert.signalType === 'long'
          ? 'bg-green-500/10 border-green-500/50'
          : 'bg-red-500/10 border-red-500/50';
      case 'sentiment':
        return 'bg-purple-500/10 border-purple-500/50';
      default:
        return 'bg-yellow-500/10 border-yellow-500/50';
    }
  };

  // Label color
  const getLabelColor = () => {
    switch (alert.type) {
      case 'price':
        return alert.condition === 'above' ? 'text-green-400' : 'text-red-400';
      case 'signal':
        return alert.signalType === 'long' ? 'text-green-400' : 'text-red-400';
      case 'sentiment':
        return 'text-purple-400';
      default:
        return 'text-yellow-400';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      style={{ top: `${16 + index * 90}px` }}
      className={`fixed right-4 ${getBgColor()} border rounded-lg p-4 max-w-sm z-[100] shadow-lg backdrop-blur-sm`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className={`font-medium ${getLabelColor()}`}>
            {alert.symbol.toUpperCase()}
            <span className="ml-2 text-xs text-gray-400 font-normal">
              {alert.type === 'price' && 'Preis-Alert'}
              {alert.type === 'signal' && `${alert.timeframe} Signal`}
              {alert.type === 'sentiment' && 'Sentiment'}
            </span>
          </div>
          <div className="text-sm text-gray-300 mt-1">
            {message}
          </div>
          <div className="text-xs text-gray-500 mt-1.5">
            Aktueller Preis: ${currentPrice.toLocaleString('en-US', {
              maximumFractionDigits: currentPrice >= 1000 ? 0 : 2,
            })}
          </div>
        </div>
        <button
          onClick={() => onDismiss(notification.id)}
          className="flex-shrink-0 p-1 hover:bg-gray-700/50 rounded transition-colors"
        >
          <X className="w-4 h-4 text-gray-400 hover:text-white" />
        </button>
      </div>

      {/* Progress bar for auto-dismiss */}
      <motion.div
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: 10, ease: 'linear' }}
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 origin-left rounded-b-lg"
      />
    </motion.div>
  );
}

// Container component for multiple notifications
interface AlertNotificationsContainerProps {
  notifications: AlertNotificationType[];
  onDismiss: (id: string) => void;
}

export function AlertNotificationsContainer({ notifications, onDismiss }: AlertNotificationsContainerProps) {
  return (
    <>
      {notifications.slice(0, 5).map((notification, index) => (
        <AlertNotification
          key={notification.id}
          notification={notification}
          onDismiss={onDismiss}
          index={index}
        />
      ))}
    </>
  );
}
