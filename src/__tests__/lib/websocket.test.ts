import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBinanceWebSocket } from '@/hooks/useBinanceWebSocket';

// Enhanced Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  url: string;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    // Simulate async connection
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 10);
  }

  send(_data: string) {
    // Mock send - do nothing
  }

  close(code?: number, _reason?: string) {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close', { code: code || 1000 }));
    }
  }

  // Helper to simulate receiving a message
  simulateMessage(data: object) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data: JSON.stringify(data) }));
    }
  }

  // Helper to simulate error
  simulateError() {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }
}

// Store the last created WebSocket instance
let lastWebSocket: MockWebSocket | null = null;

describe('useBinanceWebSocket', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    lastWebSocket = null;

    // Override global WebSocket with our mock
    // @ts-expect-error - Mock WebSocket
    global.WebSocket = class extends MockWebSocket {
      constructor(url: string) {
        super(url);
        lastWebSocket = this;
      }
    };
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Connection', () => {
    it('connects to correct stream URL', async () => {
      renderHook(() =>
        useBinanceWebSocket({
          symbol: 'BTC',
          interval: '1h',
          enabled: true,
        })
      );

      // Fast-forward timers to trigger connection
      await vi.advanceTimersByTimeAsync(50);

      expect(lastWebSocket).not.toBeNull();
      expect(lastWebSocket!.url).toBe('wss://stream.binance.com:9443/ws/btcusdt@kline_1h');
    });

    it('uses lowercase symbol in URL', async () => {
      renderHook(() =>
        useBinanceWebSocket({
          symbol: 'ETH',
          interval: '4h',
          enabled: true,
        })
      );

      await vi.advanceTimersByTimeAsync(50);

      expect(lastWebSocket!.url).toContain('ethusdt');
    });

    it('sets isConnected to true when connected', async () => {
      const { result } = renderHook(() =>
        useBinanceWebSocket({
          symbol: 'BTC',
          interval: '1h',
          enabled: true,
        })
      );

      // Initially connecting (hook immediately starts connection when enabled)
      expect(result.current.isConnected).toBe(false);
      expect(result.current.connectionState).toBe('connecting');

      // Advance timers and wait for state update
      await act(async () => {
        await vi.advanceTimersByTimeAsync(50);
      });

      // After connection is established
      expect(result.current.isConnected).toBe(true);
      expect(result.current.connectionState).toBe('connected');
    });

    it('does not connect when enabled is false', async () => {
      renderHook(() =>
        useBinanceWebSocket({
          symbol: 'BTC',
          interval: '1h',
          enabled: false,
        })
      );

      await vi.advanceTimersByTimeAsync(100);

      expect(lastWebSocket).toBeNull();
    });
  });

  describe('Message Parsing', () => {
    it('parses kline data correctly', async () => {
      const onKlineUpdate = vi.fn();

      renderHook(() =>
        useBinanceWebSocket({
          symbol: 'BTC',
          interval: '1h',
          onKlineUpdate,
          enabled: true,
        })
      );

      await vi.advanceTimersByTimeAsync(50);

      // Simulate a kline message
      const klineMessage = {
        e: 'kline',
        E: 1699999999999,
        s: 'BTCUSDT',
        k: {
          t: 1699999900000,
          T: 1700000000000,
          s: 'BTCUSDT',
          i: '1h',
          f: 12345,
          L: 12346,
          o: '65000.00',
          c: '65100.50',
          h: '65200.00',
          l: '64900.00',
          v: '1000.5',
          n: 500,
          x: false, // Not closed yet
          q: '65000000.00',
          V: '500.0',
          Q: '32500000.00',
        },
      };

      act(() => {
        lastWebSocket!.simulateMessage(klineMessage);
      });

      expect(onKlineUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          openTime: 1699999900000,
          open: 65000,
          close: 65100.5,
          high: 65200,
          low: 64900,
          volume: 1000.5,
          closeTime: 1700000000000,
          trades: 500,
        }),
        false // isClosed
      );
    });

    it('calls onNewKline when kline is closed', async () => {
      const onNewKline = vi.fn();

      renderHook(() =>
        useBinanceWebSocket({
          symbol: 'BTC',
          interval: '1h',
          onNewKline,
          enabled: true,
        })
      );

      await vi.advanceTimersByTimeAsync(50);

      const closedKlineMessage = {
        e: 'kline',
        E: 1699999999999,
        s: 'BTCUSDT',
        k: {
          t: 1699999900000,
          T: 1700000000000,
          s: 'BTCUSDT',
          i: '1h',
          f: 12345,
          L: 12346,
          o: '65000.00',
          c: '65100.50',
          h: '65200.00',
          l: '64900.00',
          v: '1000.5',
          n: 500,
          x: true, // Closed!
          q: '65000000.00',
          V: '500.0',
          Q: '32500000.00',
        },
      };

      act(() => {
        lastWebSocket!.simulateMessage(closedKlineMessage);
      });

      expect(onNewKline).toHaveBeenCalled();
    });
  });

  describe('Reconnection', () => {
    it('cleans up on unmount', async () => {
      const { unmount } = renderHook(() =>
        useBinanceWebSocket({
          symbol: 'BTC',
          interval: '1h',
          enabled: true,
        })
      );

      await vi.advanceTimersByTimeAsync(50);

      const ws = lastWebSocket;
      expect(ws).not.toBeNull();

      unmount();

      expect(ws!.readyState).toBe(MockWebSocket.CLOSED);
    });
  });

  describe('Symbol/Interval Changes', () => {
    it('reconnects when symbol changes', async () => {
      const { rerender } = renderHook(
        ({ symbol, interval }: { symbol: string; interval: string }) =>
          useBinanceWebSocket({
            symbol,
            interval,
            enabled: true,
          }),
        { initialProps: { symbol: 'BTC', interval: '1h' } }
      );

      await vi.advanceTimersByTimeAsync(50);

      const firstWs = lastWebSocket;
      expect(firstWs!.url).toContain('btcusdt');

      // Change symbol
      rerender({ symbol: 'ETH', interval: '1h' });

      await vi.advanceTimersByTimeAsync(50);

      expect(lastWebSocket).not.toBe(firstWs);
      expect(lastWebSocket!.url).toContain('ethusdt');
    });

    it('reconnects when interval changes', async () => {
      const { rerender } = renderHook(
        ({ symbol, interval }: { symbol: string; interval: string }) =>
          useBinanceWebSocket({
            symbol,
            interval,
            enabled: true,
          }),
        { initialProps: { symbol: 'BTC', interval: '1h' } }
      );

      await vi.advanceTimersByTimeAsync(50);

      expect(lastWebSocket!.url).toContain('@kline_1h');

      // Change interval
      rerender({ symbol: 'BTC', interval: '4h' });

      await vi.advanceTimersByTimeAsync(50);

      expect(lastWebSocket!.url).toContain('@kline_4h');
    });
  });

  describe('Live Kline State', () => {
    it('updates liveKline state on message', async () => {
      const { result } = renderHook(() =>
        useBinanceWebSocket({
          symbol: 'BTC',
          interval: '1h',
          enabled: true,
        })
      );

      await vi.advanceTimersByTimeAsync(50);

      expect(result.current.liveKline).toBeNull();

      const klineMessage = {
        e: 'kline',
        E: 1699999999999,
        s: 'BTCUSDT',
        k: {
          t: 1699999900000,
          T: 1700000000000,
          s: 'BTCUSDT',
          i: '1h',
          f: 12345,
          L: 12346,
          o: '65000.00',
          c: '65100.50',
          h: '65200.00',
          l: '64900.00',
          v: '1000.5',
          n: 500,
          x: false,
          q: '65000000.00',
          V: '500.0',
          Q: '32500000.00',
        },
      };

      act(() => {
        lastWebSocket!.simulateMessage(klineMessage);
      });

      expect(result.current.liveKline).not.toBeNull();
      expect(result.current.liveKline!.close).toBe(65100.5);
      expect(result.current.lastUpdate).not.toBeNull();
    });
  });
});
