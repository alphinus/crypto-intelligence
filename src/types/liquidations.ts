// Liquidation Types for Binance Futures

export interface Liquidation {
  id: string;
  symbol: string;
  side: 'LONG' | 'SHORT'; // SELL = Long liquidated, BUY = Short liquidated
  quantity: number;
  price: number;
  usdValue: number;
  timestamp: number;
}

export interface LiquidationLevel {
  price: number;
  type: 'long' | 'short';
  estimatedVolume: number; // Estimated volume in USD
  leverage: number; // Typical leverage (10x, 25x, 50x, 100x)
}

export interface LiquidationHeatmapData {
  price: number;
  longVolume: number;
  shortVolume: number;
}

export interface LiquidationStats {
  totalLongUsd: number;
  totalShortUsd: number;
  count: number;
  largestLiquidation: Liquidation | null;
}

// Binance WebSocket message format
export interface BinanceLiquidationMessage {
  e: 'forceOrder';
  E: number; // Event time
  o: {
    s: string; // Symbol (e.g., "BTCUSDT")
    S: 'BUY' | 'SELL'; // Side - SELL = Long liq, BUY = Short liq
    o: string; // Order type
    f: string; // Time in force
    q: string; // Original quantity
    p: string; // Price
    ap: string; // Average price
    X: string; // Order status
    l: string; // Order last filled quantity
    z: string; // Order filled accumulated quantity
    T: number; // Trade time
  };
}
