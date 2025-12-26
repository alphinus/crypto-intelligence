// Satoshi Responder - Regelbasierte Antwort-Logik
// Für einfache Fragen kein API-Call nötig

import type { TimeframeTradeSetup, TradeScore } from './groq';
import type { FearGreedIndex, MarketData } from '@/types/news';
import type { FuturesOverviewData } from './binance-futures';

// App-Kontext für Satoshi
export interface SatoshiContext {
  selectedCoin: {
    symbol: string;
    name: string;
    price: number;
    change24h: number;
  } | null;
  tradeRecommendations: Record<string, TimeframeTradeSetup> | null;
  tradeScores: Record<string, TradeScore> | null;
  fearGreed: FearGreedIndex | null;
  futuresData: {
    fundingRates: FuturesOverviewData['fundingRates'];
    longShortRatio: FuturesOverviewData['longShortRatio'];
  } | null;
  topCoins: MarketData[] | null;
  allCoins: MarketData[] | null; // Alle geladenen Coins für Kursabfragen
}

// Chat-Nachricht
export interface ChatMessage {
  role: 'user' | 'satoshi';
  content: string;
  timestamp: Date;
}

// Pattern-Definitionen für regelbasierte Antworten
const PATTERNS = {
  BEST_TRADE: /welchen trade|bester trade|was tradest|trade empfehlung|welcher trade/i,
  SPOT_BUY: /spot.*kauf|kaufen|buy|soll ich.*kaufen|jetzt.*kaufen|guter.*einstieg|einsteigen|nachkaufen|was kaufen/i,
  COIN_PRICE: /was macht (.+)|wie steht (.+)|kurs von (.+)|preis von (.+)|(.+) kurs|(.+) preis/i,
  CURRENT_SCORE: /wie ist der score|score von|aktueller score|score\?/i,
  RISK: /riskant|risiko|gefährlich|sicher|wie sicher/i,
  DIRECTION: /long oder short|richtung|bullish oder bearish|short oder long/i,
  FEAR_GREED: /fear.*greed|angst.*gier|stimmung|marktsentiment|sentiment/i,
  FUNDING: /funding|rate|funding rate/i,
  PRICE: /preis|was kostet|aktueller kurs|kurs von/i,
  GREETING: /^(hi|hallo|hey|moin|servus|guten tag|morgen|abend)/i,
  THANKS: /danke|thx|thanks|merci/i,
  HELP: /hilfe|help|was kannst du|commands|befehle/i,
  TOP_COINS: /top coins|beste coins|welche coins|trending/i,
  SIMULATOR: /simulator|creator|coin erstellen|coin machen|simulation/i,
};

// Prüft ob eine Frage regelbasiert beantwortet werden kann
export function shouldUseAI(message: string): boolean {
  const normalizedMessage = message.toLowerCase().trim();

  // Kurze Nachrichten oft regelbasiert
  if (normalizedMessage.length < 5) return false;

  // Wenn ein Pattern matcht -> kein AI nötig
  const hasPattern = Object.values(PATTERNS).some(p => p.test(normalizedMessage));
  if (hasPattern) return false;

  // Komplexe Fragen brauchen AI
  const complexIndicators = [
    /warum/i,
    /erkläre|erklär mir/i,
    /wie funktioniert/i,
    /was bedeutet/i,
    /analysiere|analyse/i,
    /strategie/i,
    /portfolio/i,
    /meinung/i,
    /denkst du/i,
  ];

  return complexIndicators.some(p => p.test(normalizedMessage)) || !hasPattern;
}

// Findet den besten Trade aus allen Timeframes
function findBestTrade(
  recommendations: Record<string, TimeframeTradeSetup> | null,
  scores: Record<string, TradeScore> | null
): { timeframe: string; setup: TimeframeTradeSetup; score: number } | null {
  if (!recommendations || !scores) return null;

  let best: { timeframe: string; setup: TimeframeTradeSetup; score: number } | null = null;

  for (const [tf, setup] of Object.entries(recommendations)) {
    if (!setup) continue;
    const score = scores[tf]?.total || 0;

    if (!best || score > best.score) {
      best = { timeframe: tf, setup, score };
    }
  }

  return best;
}

// Formatiert einen Score als Risk-Level
function getRiskLevel(score: number): string {
  if (score >= 80) return 'Niedrig (starkes Setup)';
  if (score >= 60) return 'Mittel';
  if (score >= 40) return 'Erhöht';
  return 'Hoch (schwaches Setup)';
}

// Interpretiert Fear & Greed
function interpretFearGreed(value: number): string {
  if (value <= 20) return 'Extreme Angst - historisch guter Kaufzeitpunkt';
  if (value <= 40) return 'Angst - Markt ist vorsichtig';
  if (value <= 60) return 'Neutral - abwartende Stimmung';
  if (value <= 80) return 'Gier - Markt ist optimistisch';
  return 'Extreme Gier - Vorsicht vor Korrektur';
}

// Interpretiert Funding Rate
function interpretFunding(rate: number): string {
  const percent = rate * 100;
  if (percent > 0.05) return `${percent.toFixed(4)}% - Überhitzt (Longs zahlen viel)`;
  if (percent > 0.01) return `${percent.toFixed(4)}% - Leicht bullish`;
  if (percent > -0.01) return `${percent.toFixed(4)}% - Neutral`;
  if (percent > -0.05) return `${percent.toFixed(4)}% - Leicht bearish`;
  return `${percent.toFixed(4)}% - Überhitzt bearish (Shorts zahlen viel)`;
}

// Findet einen Coin anhand von Name oder Symbol
function findCoinByQuery(query: string, coins: MarketData[] | null): MarketData | null {
  if (!coins) return null;
  const normalizedQuery = query.toLowerCase().trim();

  // Exakte Symbol-Matches zuerst
  const exactSymbol = coins.find(c => c.symbol.toLowerCase() === normalizedQuery);
  if (exactSymbol) return exactSymbol;

  // Name-Match
  const nameMatch = coins.find(c => c.name.toLowerCase().includes(normalizedQuery));
  if (nameMatch) return nameMatch;

  // Partial Symbol-Match
  const partialSymbol = coins.find(c => c.symbol.toLowerCase().includes(normalizedQuery));
  return partialSymbol || null;
}

// Generiert Spot-Kaufempfehlung
function generateSpotBuyAdvice(context: SatoshiContext): string {
  const coin = context.selectedCoin;
  if (!coin) {
    return 'Wähle erst einen Coin aus, dann kann ich dir eine Kaufempfehlung geben.';
  }

  const best = findBestTrade(context.tradeRecommendations, context.tradeScores);
  const fearGreed = context.fearGreed?.value || 50;

  // Analyse-Faktoren
  const factors: string[] = [];
  let buyScore = 50; // Neutral start

  // Trade-Setup prüfen
  if (best) {
    if (best.setup.type === 'long' && best.score >= 70) {
      factors.push(`✅ Starkes Long-Setup (Score: ${best.score})`);
      buyScore += 20;
    } else if (best.setup.type === 'long' && best.score >= 50) {
      factors.push(`⚠️ Mittelmäßiges Long-Setup (Score: ${best.score})`);
      buyScore += 10;
    } else if (best.setup.type === 'short') {
      factors.push(`❌ Short-Setup aktiv - nicht kaufen`);
      buyScore -= 30;
    } else {
      factors.push(`⏸️ Warten empfohlen (Score: ${best.score})`);
      buyScore -= 10;
    }
  }

  // Fear & Greed prüfen
  if (fearGreed <= 25) {
    factors.push(`✅ Extreme Angst (${fearGreed}) - historisch guter Kaufzeitpunkt`);
    buyScore += 20;
  } else if (fearGreed <= 40) {
    factors.push(`🟡 Angst im Markt (${fearGreed}) - ok für DCA`);
    buyScore += 10;
  } else if (fearGreed >= 75) {
    factors.push(`⚠️ Extreme Gier (${fearGreed}) - Vorsicht!`);
    buyScore -= 20;
  }

  // 24h Change prüfen
  if (coin.change24h < -10) {
    factors.push(`🔴 Starker Dump (-${Math.abs(coin.change24h).toFixed(1)}%) - Vorsicht, könnte weitergehen`);
    buyScore -= 10;
  } else if (coin.change24h < -5) {
    factors.push(`🟡 Rückgang (-${Math.abs(coin.change24h).toFixed(1)}%) - potentieller Dip`);
    buyScore += 5;
  } else if (coin.change24h > 15) {
    factors.push(`⚠️ Starker Pump (+${coin.change24h.toFixed(1)}%) - nicht ins Messer greifen`);
    buyScore -= 15;
  }

  // Empfehlung generieren
  let recommendation: string;
  let emoji: string;

  if (buyScore >= 70) {
    recommendation = 'Guter Einstieg möglich';
    emoji = '✅';
  } else if (buyScore >= 50) {
    recommendation = 'Neutraler Zeitpunkt - DCA ok';
    emoji = '🟡';
  } else if (buyScore >= 30) {
    recommendation = 'Warten empfohlen';
    emoji = '⚠️';
  } else {
    recommendation = 'Nicht kaufen - ungünstiger Zeitpunkt';
    emoji = '❌';
  }

  const symbol = coin.symbol.replace('USDT', '');

  let response = `${emoji} **Spot-Kaufempfehlung für ${symbol}:**

**Aktueller Preis:** $${coin.price.toLocaleString()}
**24h:** ${coin.change24h >= 0 ? '+' : ''}${coin.change24h.toFixed(2)}%

**Analyse:**
${factors.map(f => `• ${f}`).join('\n')}

**Empfehlung:** ${recommendation}`;

  // Entry/SL hinzufügen wenn Long-Setup vorhanden
  if (best && best.setup.type === 'long') {
    response += `

**Möglicher Trade:**
• Entry: $${best.setup.entry?.toLocaleString() || 'Market'}
• Stop-Loss: $${best.setup.stopLoss?.toLocaleString() || 'N/A'} (${((1 - (best.setup.stopLoss || 0) / coin.price) * 100).toFixed(1)}%)
• Take-Profit: $${best.setup.takeProfit?.[0]?.toLocaleString() || 'N/A'}`;
  }

  response += '\n\n💡 **Tipp:** Nie alles auf einmal kaufen - DCA ist sicherer!';

  return response;
}

// Generiert regelbasierte Antwort
export function generateRuleBasedResponse(
  message: string,
  context: SatoshiContext
): string | null {
  const msg = message.toLowerCase().trim();

  // Greeting
  if (PATTERNS.GREETING.test(msg)) {
    return `Hey Elvis! 👋 Ich bin bereit. Der Markt zeigt gerade ${context.fearGreed ? `Fear & Greed bei ${context.fearGreed.value} (${context.fearGreed.label})` : 'gemischte Signale'
      }. Was möchtest du wissen?`;
  }

  // Thanks
  if (PATTERNS.THANKS.test(msg)) {
    return 'Gerne, Elvis! Frag mich jederzeit wenn du Hilfe brauchst. 🤖';
  }

  // Help
  if (PATTERNS.HELP.test(msg)) {
    return `Ich kann dir helfen mit:

**📈 Trading:**
• **Jetzt kaufen?** - Spot-Kaufempfehlung mit Analyse
• **Bester Trade?** - Zeige die stärkste Empfehlung
• **Long oder Short?** - Aktuelle Richtung
• **Risiko?** - Wie riskant ist der aktuelle Trade

**📊 Marktdaten:**
• **Was macht ETH?** - Kurs eines beliebigen Coins
• **Fear & Greed?** - Marktsentiment
• **Funding Rate?** - Futures-Finanzierung
• **Top Coins** - Die besten Performer
• **Simulator?** - Zeige Infos zum Coin Creator

Oder stell mir komplexere Fragen - da nutze ich KI!`;
  }

  // Simulator
  if (PATTERNS.SIMULATOR.test(msg)) {
    return `🚀 **Der Coin Simulator:**
Du kannst im neuen Tab **"Simulator"** deinen eigenen Memecoin erstellen! 
Dort lernst du wie Bonding Curves funktionieren und kannst mit Spielgeld traden.
Wähle einfach Name, Symbol und Logo aus und starte deine eigene Simulation.`;
  }

  // Best Trade
  if (PATTERNS.BEST_TRADE.test(msg)) {
    const best = findBestTrade(context.tradeRecommendations, context.tradeScores);
    if (!best) {
      return 'Ich habe gerade keine Trade-Daten. Wechsle zu einem Coin und warte bis die Analyse geladen ist.';
    }

    const { timeframe, setup, score } = best;
    const coin = context.selectedCoin?.symbol?.replace('USDT', '') || 'unbekannt';

    return `📊 **Beste Trade-Empfehlung für ${coin}:**

**${setup.type.toUpperCase()}** auf dem **${timeframe}** Timeframe
• Score: **${score}/100** (${getRiskLevel(score)})
• Entry: $${setup.entry?.toLocaleString() || 'N/A'}
• Stop Loss: $${setup.stopLoss?.toLocaleString() || 'N/A'}
• Take Profit: $${setup.takeProfit?.[0]?.toLocaleString() || 'N/A'}
• Confidence: ${setup.confidence || 'medium'}

${score >= 70 ? '✅ Solides Setup!' : score >= 50 ? '⚠️ Mittelmäßig - kleine Position' : '❌ Schwach - lieber abwarten'}`;
  }

  // Current Score
  if (PATTERNS.CURRENT_SCORE.test(msg)) {
    if (!context.tradeScores) {
      return 'Noch keine Score-Daten verfügbar.';
    }

    const scores = Object.entries(context.tradeScores)
      .map(([tf, s]) => `• ${tf}: ${s.total}/100`)
      .join('\n');

    return `📈 **Trade-Scores für ${context.selectedCoin?.symbol?.replace('USDT', '') || 'aktuellen Coin'}:**

${scores}

${findBestTrade(context.tradeRecommendations, context.tradeScores)?.timeframe || '4h'} hat den besten Score!`;
  }

  // Risk Assessment
  if (PATTERNS.RISK.test(msg)) {
    const best = findBestTrade(context.tradeRecommendations, context.tradeScores);
    const fearGreed = context.fearGreed?.value || 50;

    let riskFactors: string[] = [];

    if (best) {
      if (best.score < 50) riskFactors.push('Schwacher Trade-Score');
      if (best.score >= 70) riskFactors.push('Starker Trade-Score ✅');
    }

    if (fearGreed < 30) riskFactors.push('Extreme Angst im Markt (konträr bullish)');
    if (fearGreed > 75) riskFactors.push('Hohe Gier (Korrektur-Risiko)');

    if (context.futuresData?.fundingRates) {
      const btcFunding = context.futuresData.fundingRates.btc;
      if (btcFunding !== undefined && Math.abs(btcFunding) > 0.0005) {
        riskFactors.push('Extreme Funding Rate');
      }
    }

    return `⚠️ **Risiko-Bewertung:**

${riskFactors.length > 0 ? riskFactors.map(r => `• ${r}`).join('\n') : '• Keine besonderen Risikofaktoren'}

**Gesamt:** ${best ? getRiskLevel(best.score) : 'Keine Daten'}

Tipp: Nie mehr als 1-2% vom Portfolio pro Trade riskieren!`;
  }

  // Direction
  if (PATTERNS.DIRECTION.test(msg)) {
    const best = findBestTrade(context.tradeRecommendations, context.tradeScores);
    if (!best) {
      return 'Keine Richtungs-Empfehlung verfügbar.';
    }

    const direction = best.setup.type === 'long' ? '🟢 LONG (bullish)' : '🔴 SHORT (bearish)';

    return `Aktuelle Empfehlung: **${direction}**

Timeframe: ${best.timeframe}
Confidence: ${best.setup.confidence || 'medium'}
Score: ${best.score}/100`;
  }

  // Fear & Greed
  if (PATTERNS.FEAR_GREED.test(msg)) {
    if (!context.fearGreed) {
      return 'Fear & Greed Daten werden geladen...';
    }

    const { value, label } = context.fearGreed;

    return `🎭 **Fear & Greed Index: ${value}**

Klassifikation: **${label}**
${interpretFearGreed(value)}

${value <= 30 ? '💡 Historisch war extreme Angst oft ein guter Einstiegspunkt.' : ''}
${value >= 75 ? '💡 Bei extremer Gier vorsichtig sein - oft folgt eine Korrektur.' : ''}`;
  }

  // Funding Rate
  if (PATTERNS.FUNDING.test(msg)) {
    if (!context.futuresData?.fundingRates) {
      return 'Funding Rate Daten werden geladen...';
    }

    const coinSymbol = context.selectedCoin?.symbol?.toUpperCase()?.replace('USDT', '') || 'BTC';
    const fundingRates = context.futuresData.fundingRates;

    // Get funding rate for the coin (btc, eth, or sol)
    const coinKey = coinSymbol.toLowerCase() as 'btc' | 'eth' | 'sol';
    const fundingRate = fundingRates[coinKey];

    if (fundingRate === undefined) {
      return `Keine Funding Rate für ${coinSymbol} gefunden. Verfügbar: BTC, ETH, SOL`;
    }

    return `💰 **Funding Rate für ${coinSymbol}:**

${interpretFunding(fundingRate)}

${fundingRate > 0 ? 'Longs zahlen an Shorts (bullisher Markt)' : 'Shorts zahlen an Longs (bearisher Markt)'}`;
  }

  // Price
  if (PATTERNS.PRICE.test(msg)) {
    if (!context.selectedCoin) {
      return 'Wähle erst einen Coin aus.';
    }

    const { symbol, price, change24h } = context.selectedCoin;
    const changeEmoji = change24h >= 0 ? '📈' : '📉';

    return `${changeEmoji} **${symbol.replace('USDT', '')}:** $${price.toLocaleString()}

24h Änderung: ${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%`;
  }

  // Top Coins
  if (PATTERNS.TOP_COINS.test(msg)) {
    if (!context.topCoins || context.topCoins.length === 0) {
      return 'Coin-Daten werden geladen...';
    }

    const top5 = context.topCoins.slice(0, 5);
    const list = top5.map((c, i) => {
      const emoji = c.change24h >= 0 ? '🟢' : '🔴';
      return `${i + 1}. ${emoji} **${c.symbol.toUpperCase()}** $${c.price.toLocaleString()} (${c.change24h >= 0 ? '+' : ''}${c.change24h.toFixed(1)}%)`;
    }).join('\n');

    return `🏆 **Top 5 Coins:**

${list}`;
  }

  // Spot Buy Recommendation
  if (PATTERNS.SPOT_BUY.test(msg)) {
    return generateSpotBuyAdvice(context);
  }

  // Coin Price Query (z.B. "was macht ETH", "kurs von SOL")
  const coinPriceMatch = msg.match(PATTERNS.COIN_PRICE);
  if (coinPriceMatch) {
    // Finde den Coin-Namen aus den Match-Gruppen
    const query = (coinPriceMatch[1] || coinPriceMatch[2] || coinPriceMatch[3] ||
      coinPriceMatch[4] || coinPriceMatch[5] || coinPriceMatch[6])?.trim();

    if (query) {
      const coin = findCoinByQuery(query, context.allCoins);
      if (coin) {
        const changeEmoji = coin.change24h >= 0 ? '📈' : '📉';
        const changeColor = coin.change24h >= 0 ? '🟢' : '🔴';

        return `${changeEmoji} **${coin.name} (${coin.symbol.toUpperCase()}):**

**Preis:** $${coin.price.toLocaleString()}
**24h:** ${changeColor} ${coin.change24h >= 0 ? '+' : ''}${coin.change24h.toFixed(2)}%
**Volumen:** $${(coin.volume24h / 1_000_000).toFixed(1)}M
**Market Cap:** $${(coin.marketCap / 1_000_000_000).toFixed(2)}B

${coin.change24h > 5 ? '🚀 Starke Performance heute!' : coin.change24h < -5 ? '⚠️ Deutlicher Rückgang heute.' : ''}`;
      } else {
        return `Ich konnte "${query}" nicht finden. Versuch es mit dem Symbol (z.B. BTC, ETH, SOL) oder dem vollen Namen.`;
      }
    }
  }

  // Kein Pattern erkannt
  return null;
}

// Quick Action Chips
export const QUICK_ACTIONS = [
  { label: 'Jetzt kaufen?', message: 'Soll ich jetzt kaufen?' },
  { label: 'Bester Trade?', message: 'Welchen Trade würdest du nehmen?' },
  { label: 'Fear & Greed', message: 'Wie ist der Fear & Greed Index?' },
  { label: 'Top Coins', message: 'Zeig mir die Top Coins' },
];
