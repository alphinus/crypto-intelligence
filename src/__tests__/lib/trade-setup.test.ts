import { describe, it, expect } from 'vitest';

// Inline the generateTradeSetup logic for testing (same as page.tsx)
interface TradeSetup {
  type: 'long' | 'short' | 'wait';
  entry: number;
  stopLoss: number;
  takeProfit: number[];
  riskReward: number;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
  timeframe: string;
  confluenceWithOtherTimeframes: boolean;
  tradingStyle: 'scalping' | 'intraday' | 'swing' | 'position';
}

function generateTradeSetup(
  timeframeData: { trend: string; momentum: number; klines: { close: number }[] },
  levels: { keySupport: number | null; keyResistance: number | null; currentPrice: number },
  emas: { currentEma50: number | null; currentEma200: number | null },
  timeframe: '1m' | '3m' | '5m' | '15m' | '1h' | '4h' | '1d'
): TradeSetup | null {
  if (!timeframeData.klines.length || !levels.currentPrice) return null;

  const price = levels.currentPrice;
  const trend = timeframeData.trend;
  const momentum = timeframeData.momentum;

  const tradingStyleMap: Record<string, 'scalping' | 'intraday' | 'swing' | 'position'> = {
    '1m': 'scalping',
    '3m': 'scalping',
    '5m': 'scalping',
    '15m': 'intraday',
    '1h': 'swing',
    '4h': 'swing',
    '1d': 'position',
  };
  const tradingStyle = tradingStyleMap[timeframe];

  if (trend === 'sideways' || Math.abs(momentum) < 20) {
    return {
      type: 'wait',
      entry: price,
      stopLoss: price * 0.98,
      takeProfit: [price * 1.02],
      riskReward: 1,
      confidence: 'low',
      reasoning: 'Kein klarer Trend - abwarten empfohlen',
      timeframe,
      confluenceWithOtherTimeframes: false,
      tradingStyle,
    };
  }

  const isLong = trend === 'up' && momentum > 20;
  const isShort = trend === 'down' && momentum < -20;

  if (!isLong && !isShort) {
    return {
      type: 'wait',
      entry: price,
      stopLoss: price * 0.98,
      takeProfit: [price * 1.02],
      riskReward: 1,
      confidence: 'low',
      reasoning: 'Gemischte Signale',
      timeframe,
      confluenceWithOtherTimeframes: false,
      tradingStyle,
    };
  }

  const emaConfirm = emas.currentEma50 && emas.currentEma200
    ? (isLong ? price > emas.currentEma50 && emas.currentEma50 > emas.currentEma200 : price < emas.currentEma50 && emas.currentEma50 < emas.currentEma200)
    : false;

  const confidence = emaConfirm ? 'high' : Math.abs(momentum) > 50 ? 'medium' : 'low';

  if (isLong) {
    const sl = levels.keySupport || price * 0.97;
    const risk = price - sl;
    // Fibonacci Extension TPs: 1.0x, 1.618x, 2.618x vom Risk
    const tp1 = price + risk * 1.0;
    const tp2 = price + risk * 1.618;
    const tp3 = price + risk * 2.618;
    return {
      type: 'long',
      entry: price,
      stopLoss: sl,
      takeProfit: [tp1, tp2, tp3],
      riskReward: risk > 0 ? (tp1 - price) / risk : 1,
      confidence,
      reasoning: `Aufwärtstrend (Mom: ${momentum}), ${emaConfirm ? 'EMA bestätigt' : 'ohne EMA-Bestätigung'}`,
      timeframe,
      confluenceWithOtherTimeframes: emaConfirm,
      tradingStyle,
    };
  } else {
    const sl = levels.keyResistance || price * 1.03;
    const risk = sl - price;
    const tp1 = price - risk * 1.0;
    const tp2 = price - risk * 1.618;
    const tp3 = price - risk * 2.618;
    return {
      type: 'short',
      entry: price,
      stopLoss: sl,
      takeProfit: [tp1, tp2, tp3],
      riskReward: risk > 0 ? (price - tp1) / risk : 1,
      confidence,
      reasoning: `Abwärtstrend (Mom: ${momentum}), ${emaConfirm ? 'EMA bestätigt' : 'ohne EMA-Bestätigung'}`,
      timeframe,
      confluenceWithOtherTimeframes: emaConfirm,
      tradingStyle,
    };
  }
}

describe('generateTradeSetup', () => {
  const mockKlines = [{ close: 100 }];

  describe('LONG trade calculations', () => {
    it('calculates TP1=1.0x, TP2=1.618x, TP3=2.618x correctly for LONG', () => {
      const result = generateTradeSetup(
        { trend: 'up', momentum: 60, klines: mockKlines },
        { currentPrice: 100, keySupport: 95, keyResistance: 110 },
        { currentEma50: null, currentEma200: null },
        '1h'
      );

      expect(result).not.toBeNull();
      expect(result!.type).toBe('long');
      expect(result!.entry).toBe(100);
      expect(result!.stopLoss).toBe(95);

      // Risk = 100 - 95 = 5
      // TP1 = 100 + 5*1.0 = 105
      // TP2 = 100 + 5*1.618 = 108.09
      // TP3 = 100 + 5*2.618 = 113.09
      expect(result!.takeProfit[0]).toBe(105);
      expect(result!.takeProfit[1]).toBeCloseTo(108.09, 1);
      expect(result!.takeProfit[2]).toBeCloseTo(113.09, 1);
    });

    it('uses default SL when keySupport is null', () => {
      const result = generateTradeSetup(
        { trend: 'up', momentum: 60, klines: mockKlines },
        { currentPrice: 100, keySupport: null, keyResistance: 110 },
        { currentEma50: null, currentEma200: null },
        '1h'
      );

      expect(result!.stopLoss).toBe(97); // 100 * 0.97
    });
  });

  describe('SHORT trade calculations', () => {
    it('calculates TPs in opposite direction for SHORT', () => {
      const result = generateTradeSetup(
        { trend: 'down', momentum: -60, klines: mockKlines },
        { currentPrice: 100, keySupport: 90, keyResistance: 103 },
        { currentEma50: null, currentEma200: null },
        '1h'
      );

      expect(result).not.toBeNull();
      expect(result!.type).toBe('short');
      expect(result!.entry).toBe(100);
      expect(result!.stopLoss).toBe(103);

      // Risk = 103 - 100 = 3
      // TP1 = 100 - 3*1.0 = 97
      // TP2 = 100 - 3*1.618 = 95.146
      // TP3 = 100 - 3*2.618 = 92.146
      expect(result!.takeProfit[0]).toBe(97);
      expect(result!.takeProfit[1]).toBeCloseTo(95.146, 1);
      expect(result!.takeProfit[2]).toBeCloseTo(92.146, 1);
    });
  });

  describe('WAIT conditions', () => {
    it('returns "wait" for sideways market', () => {
      const result = generateTradeSetup(
        { trend: 'sideways', momentum: 10, klines: mockKlines },
        { currentPrice: 100, keySupport: 95, keyResistance: 105 },
        { currentEma50: null, currentEma200: null },
        '1h'
      );

      expect(result!.type).toBe('wait');
      expect(result!.reasoning).toContain('abwarten');
    });

    it('returns "wait" for low momentum', () => {
      const result = generateTradeSetup(
        { trend: 'up', momentum: 15, klines: mockKlines }, // momentum < 20
        { currentPrice: 100, keySupport: 95, keyResistance: 105 },
        { currentEma50: null, currentEma200: null },
        '1h'
      );

      expect(result!.type).toBe('wait');
    });
  });

  describe('Confidence levels', () => {
    it('returns "high" confidence when EMA confirms for LONG', () => {
      const result = generateTradeSetup(
        { trend: 'up', momentum: 60, klines: mockKlines },
        { currentPrice: 100, keySupport: 95, keyResistance: 110 },
        { currentEma50: 98, currentEma200: 95 }, // Price > EMA50 > EMA200
        '1h'
      );

      expect(result!.confidence).toBe('high');
      expect(result!.confluenceWithOtherTimeframes).toBe(true);
    });

    it('returns "medium" confidence for strong momentum without EMA confirm', () => {
      const result = generateTradeSetup(
        { trend: 'up', momentum: 60, klines: mockKlines },
        { currentPrice: 100, keySupport: 95, keyResistance: 110 },
        { currentEma50: null, currentEma200: null },
        '1h'
      );

      expect(result!.confidence).toBe('medium');
    });

    it('returns "low" confidence for weak momentum without EMA confirm', () => {
      const result = generateTradeSetup(
        { trend: 'up', momentum: 25, klines: mockKlines },
        { currentPrice: 100, keySupport: 95, keyResistance: 110 },
        { currentEma50: null, currentEma200: null },
        '1h'
      );

      expect(result!.confidence).toBe('low');
    });
  });

  describe('Trading styles by timeframe', () => {
    it('assigns "scalping" style for 1m, 3m, 5m', () => {
      const timeframes = ['1m', '3m', '5m'] as const;
      for (const tf of timeframes) {
        const result = generateTradeSetup(
          { trend: 'up', momentum: 60, klines: mockKlines },
          { currentPrice: 100, keySupport: 95, keyResistance: 110 },
          { currentEma50: null, currentEma200: null },
          tf
        );
        expect(result!.tradingStyle).toBe('scalping');
      }
    });

    it('assigns "intraday" style for 15m', () => {
      const result = generateTradeSetup(
        { trend: 'up', momentum: 60, klines: mockKlines },
        { currentPrice: 100, keySupport: 95, keyResistance: 110 },
        { currentEma50: null, currentEma200: null },
        '15m'
      );
      expect(result!.tradingStyle).toBe('intraday');
    });

    it('assigns "swing" style for 1h, 4h', () => {
      const timeframes = ['1h', '4h'] as const;
      for (const tf of timeframes) {
        const result = generateTradeSetup(
          { trend: 'up', momentum: 60, klines: mockKlines },
          { currentPrice: 100, keySupport: 95, keyResistance: 110 },
          { currentEma50: null, currentEma200: null },
          tf
        );
        expect(result!.tradingStyle).toBe('swing');
      }
    });

    it('assigns "position" style for 1d', () => {
      const result = generateTradeSetup(
        { trend: 'up', momentum: 60, klines: mockKlines },
        { currentPrice: 100, keySupport: 95, keyResistance: 110 },
        { currentEma50: null, currentEma200: null },
        '1d'
      );
      expect(result!.tradingStyle).toBe('position');
    });
  });

  describe('Risk/Reward calculations', () => {
    it('calculates correct R/R for LONG (1:1 at TP1)', () => {
      const result = generateTradeSetup(
        { trend: 'up', momentum: 60, klines: mockKlines },
        { currentPrice: 100, keySupport: 95, keyResistance: 110 },
        { currentEma50: null, currentEma200: null },
        '1h'
      );

      // Risk = 5 (100-95), Reward at TP1 = 5 (105-100)
      // R/R = 5/5 = 1
      expect(result!.riskReward).toBe(1);
    });

    it('calculates correct R/R for SHORT (1:1 at TP1)', () => {
      const result = generateTradeSetup(
        { trend: 'down', momentum: -60, klines: mockKlines },
        { currentPrice: 100, keySupport: 90, keyResistance: 105 },
        { currentEma50: null, currentEma200: null },
        '1h'
      );

      // Risk = 5 (105-100), Reward at TP1 = 5 (100-95)
      expect(result!.riskReward).toBe(1);
    });
  });

  describe('Edge cases', () => {
    it('returns null for empty klines', () => {
      const result = generateTradeSetup(
        { trend: 'up', momentum: 60, klines: [] },
        { currentPrice: 100, keySupport: 95, keyResistance: 110 },
        { currentEma50: null, currentEma200: null },
        '1h'
      );

      expect(result).toBeNull();
    });

    it('returns null for zero currentPrice', () => {
      const result = generateTradeSetup(
        { trend: 'up', momentum: 60, klines: mockKlines },
        { currentPrice: 0, keySupport: 95, keyResistance: 110 },
        { currentEma50: null, currentEma200: null },
        '1h'
      );

      expect(result).toBeNull();
    });
  });
});
