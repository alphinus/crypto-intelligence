'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { Kline } from '@/lib/binance-klines';

// Binance WebSocket Kline Message Format
interface BinanceKlineMessage {
  e: string;      // Event type
  E: number;      // Event time
  s: string;      // Symbol
  k: {
    t: number;    // Kline start time
    T: number;    // Kline close time
    s: string;    // Symbol
    i: string;    // Interval
    f: number;    // First trade ID
    L: number;    // Last trade ID
    o: string;    // Open price
    c: string;    // Close price
    h: string;    // High price
    l: string;    // Low price
    v: string;    // Base asset volume
    n: number;    // Number of trades
    x: boolean;   // Is this kline closed?
    q: string;    // Quote asset volume
    V: string;    // Taker buy base asset volume
    Q: string;    // Taker buy quote asset volume
  };
}

interface UseBinanceWebSocketOptions {
  symbol: string;
  interval: string;
  onKlineUpdate?: (kline: Kline, isClosed: boolean) => void;
  onNewKline?: (kline: Kline) => void;
  enabled?: boolean;
}

interface UseBinanceWebSocketReturn {
  liveKline: Kline | null;
  isConnected: boolean;
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'error';
  reconnect: () => void;
  lastUpdate: Date | null;
  error: string | null;
}

// Map interval to Binance format
const intervalMap: Record<string, string> = {
  '1m': '1m',
  '3m': '3m',
  '5m': '5m',
  '15m': '15m',
  '1h': '1h',
  '4h': '4h',
  '1d': '1d',
};

export function useBinanceWebSocket({
  symbol,
  interval,
  onKlineUpdate,
  onNewKline,
  enabled = true,
}: UseBinanceWebSocketOptions): UseBinanceWebSocketReturn {
  const [liveKline, setLiveKline] = useState<Kline | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPongRef = useRef<number>(Date.now());
  const lastStateUpdateRef = useRef<number>(0);
  const THROTTLE_MS = 500; // Throttle state updates to max 2 per second

  // Store callbacks in refs to avoid triggering reconnection
  const onKlineUpdateRef = useRef(onKlineUpdate);
  const onNewKlineRef = useRef(onNewKline);

  // Keep refs updated
  useEffect(() => {
    onKlineUpdateRef.current = onKlineUpdate;
  }, [onKlineUpdate]);

  useEffect(() => {
    onNewKlineRef.current = onNewKline;
  }, [onNewKline]);

  const MAX_RECONNECT_ATTEMPTS = 5;
  const HEARTBEAT_INTERVAL = 30000; // 30 seconds
  const HEARTBEAT_TIMEOUT = 10000; // 10 seconds without pong = reconnect

  // Parse Binance kline to our Kline format
  const parseKline = useCallback((k: BinanceKlineMessage['k']): Kline => ({
    openTime: k.t,
    open: parseFloat(k.o),
    high: parseFloat(k.h),
    low: parseFloat(k.l),
    close: parseFloat(k.c),
    volume: parseFloat(k.v),
    closeTime: k.T,
    quoteVolume: parseFloat(k.q),
    trades: k.n,
  }), []);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!enabled) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    const binanceInterval = intervalMap[interval] || interval;
    const streamName = `${symbol.toLowerCase()}usdt@kline_${binanceInterval}`;
    const wsUrl = `wss://stream.binance.com:9443/ws/${streamName}`;

    setConnectionState('connecting');
    setError(null);

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setConnectionState('connected');
        setError(null);
        reconnectAttempts.current = 0;
        lastPongRef.current = Date.now();

        // Start heartbeat
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
        }
        heartbeatIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            // Check if we received a message recently
            const timeSinceLastPong = Date.now() - lastPongRef.current;
            if (timeSinceLastPong > HEARTBEAT_TIMEOUT) {
              console.warn('[WebSocket] No activity, reconnecting...');
              ws.close();
              return;
            }
            // Send ping (Binance will auto-respond with pong)
            try {
              ws.send(JSON.stringify({ method: 'ping' }));
            } catch {
              // Ignore ping errors
            }
          }
        }, HEARTBEAT_INTERVAL);
      };

      ws.onmessage = (event) => {
        lastPongRef.current = Date.now();

        try {
          const data: BinanceKlineMessage = JSON.parse(event.data);

          if (data.e === 'kline' && data.k) {
            const kline = parseKline(data.k);
            const isClosed = data.k.x;
            const now = Date.now();

            // Throttle state updates (but always update on candle close)
            const shouldUpdateState = isClosed || (now - lastStateUpdateRef.current >= THROTTLE_MS);

            if (shouldUpdateState) {
              lastStateUpdateRef.current = now;
              setLiveKline(kline);
              setLastUpdate(new Date());

              // Call callbacks via refs (to avoid reconnection on callback change)
              if (onKlineUpdateRef.current) {
                onKlineUpdateRef.current(kline, isClosed);
              }
            }

            // Always trigger new kline callback when kline closes
            if (isClosed && onNewKlineRef.current) {
              onNewKlineRef.current(kline);
            }
          }
        } catch (e) {
          console.error('[WebSocket] Parse error:', e);
        }
      };

      ws.onerror = (event) => {
        console.error('[WebSocket] Error:', event);
        setError('WebSocket connection error');
        setConnectionState('error');
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        setConnectionState('disconnected');

        // Clear heartbeat
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }

        // Attempt reconnect if not intentional close
        if (event.code !== 1000 && enabled) {
          if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
            reconnectAttempts.current++;

            console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current}/${MAX_RECONNECT_ATTEMPTS})`);

            reconnectTimeoutRef.current = setTimeout(() => {
              connect();
            }, delay);
          } else {
            setError(`Failed to connect after ${MAX_RECONNECT_ATTEMPTS} attempts`);
            setConnectionState('error');
          }
        }
      };
    } catch (e) {
      console.error('[WebSocket] Connection error:', e);
      setError('Failed to create WebSocket connection');
      setConnectionState('error');
    }
  }, [enabled, symbol, interval, parseKline]); // Callbacks are now in refs

  // Manual reconnect
  const reconnect = useCallback(() => {
    reconnectAttempts.current = 0;
    setError(null);

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Small delay before reconnecting
    setTimeout(() => {
      connect();
    }, 100);
  }, [connect]);

  // Connect on mount and when symbol/interval changes
  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      // Cleanup on unmount or dependency change
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }

      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmount');
        wsRef.current = null;
      }
    };
  }, [connect, enabled, symbol, interval]);

  return {
    liveKline,
    isConnected,
    connectionState,
    reconnect,
    lastUpdate,
    error,
  };
}

export default useBinanceWebSocket;
