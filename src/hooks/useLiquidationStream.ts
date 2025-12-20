'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type {
  Liquidation,
  LiquidationStats,
  BinanceLiquidationMessage,
} from '@/types/liquidations';

const LIQUIDATION_WS_URL = 'wss://fstream.binance.com/ws/!forceOrder@arr';
const MAX_LIQUIDATIONS = 100;
const RECONNECT_DELAY = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;
const HEARTBEAT_INTERVAL = 30000;

interface UseLiquidationStreamOptions {
  symbols?: string[];
  enabled?: boolean;
  onLargeLiquidation?: (liquidation: Liquidation) => void;
  largeLiquidationThreshold?: number; // USD
}

export function useLiquidationStream({
  symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'],
  enabled = true,
  onLargeLiquidation,
  largeLiquidationThreshold = 100000,
}: UseLiquidationStreamOptions = {}) {
  const [liquidations, setLiquidations] = useState<Liquidation[]>([]);
  const [stats, setStats] = useState<LiquidationStats>({
    totalLongUsd: 0,
    totalShortUsd: 0,
    count: 0,
    largestLiquidation: null,
  });
  const [isConnected, setIsConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const symbolsRef = useRef(symbols);

  // Update symbols ref
  useEffect(() => {
    symbolsRef.current = symbols;
  }, [symbols]);

  const parseLiquidationMessage = useCallback(
    (data: BinanceLiquidationMessage): Liquidation | null => {
      try {
        const order = data.o;
        const symbol = order.s;

        // Filter by symbols
        if (!symbolsRef.current.some((s) => symbol.startsWith(s.replace('USDT', '')))) {
          return null;
        }

        const quantity = parseFloat(order.q);
        const price = parseFloat(order.ap) || parseFloat(order.p);
        const usdValue = quantity * price;

        // SELL side means Long position was liquidated
        // BUY side means Short position was liquidated
        const side: 'LONG' | 'SHORT' = order.S === 'SELL' ? 'LONG' : 'SHORT';

        return {
          id: `${order.T}-${symbol}-${order.S}`,
          symbol: symbol.replace('USDT', ''),
          side,
          quantity,
          price,
          usdValue,
          timestamp: order.T,
        };
      } catch (e) {
        console.warn('Failed to parse liquidation message:', e);
        return null;
      }
    },
    []
  );

  const connect = useCallback(() => {
    if (!enabled || typeof window === 'undefined') return;

    try {
      const ws = new WebSocket(LIQUIDATION_WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Liquidation WebSocket connected');
        setIsConnected(true);
        reconnectAttempts.current = 0;

        // Start heartbeat
        heartbeatRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ method: 'ping' }));
          }
        }, HEARTBEAT_INTERVAL);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as BinanceLiquidationMessage;

          if (data.e !== 'forceOrder') return;

          const liquidation = parseLiquidationMessage(data);
          if (!liquidation) return;

          // Add to list
          setLiquidations((prev) => {
            const updated = [liquidation, ...prev].slice(0, MAX_LIQUIDATIONS);
            return updated;
          });

          // Update stats
          setStats((prev) => {
            const newStats = { ...prev };
            newStats.count += 1;

            if (liquidation.side === 'LONG') {
              newStats.totalLongUsd += liquidation.usdValue;
            } else {
              newStats.totalShortUsd += liquidation.usdValue;
            }

            if (!prev.largestLiquidation || liquidation.usdValue > prev.largestLiquidation.usdValue) {
              newStats.largestLiquidation = liquidation;
            }

            return newStats;
          });

          // Callback for large liquidations
          if (liquidation.usdValue >= largeLiquidationThreshold && onLargeLiquidation) {
            onLargeLiquidation(liquidation);
          }
        } catch (e) {
          // Ignore parse errors (might be pong response)
        }
      };

      ws.onerror = (error) => {
        console.error('Liquidation WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('Liquidation WebSocket closed');
        setIsConnected(false);

        // Clear heartbeat
        if (heartbeatRef.current) {
          clearInterval(heartbeatRef.current);
          heartbeatRef.current = null;
        }

        // Attempt reconnect
        if (enabled && reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts.current += 1;
          setTimeout(connect, RECONNECT_DELAY * reconnectAttempts.current);
        }
      };
    } catch (e) {
      console.error('Failed to create liquidation WebSocket:', e);
    }
  }, [enabled, parseLiquidationMessage, onLargeLiquidation, largeLiquidationThreshold]);

  // Connect on mount
  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    };
  }, [enabled, connect]);

  // Reset stats function
  const resetStats = useCallback(() => {
    setStats({
      totalLongUsd: 0,
      totalShortUsd: 0,
      count: 0,
      largestLiquidation: null,
    });
    setLiquidations([]);
  }, []);

  return {
    liquidations,
    stats,
    isConnected,
    resetStats,
  };
}
