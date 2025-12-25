import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

// Lazy initialization
let groqClient: Groq | null = null;

function getGroqClient(): Groq {
  if (!groqClient) {
    groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }
  return groqClient;
}

interface ChatContext {
  selectedCoin?: {
    symbol: string;
    name: string;
    price: number;
    change24h: number;
  } | null;
  tradeRecommendations?: Record<string, {
    type: string;
    entry: number;
    stopLoss: number;
    takeProfit: number;
    confidence: number;
  }> | null;
  tradeScores?: Record<string, { total: number }> | null;
  fearGreed?: { value: number; label: string } | null;
  fundingRates?: { btc: number; eth: number; sol: number } | null;
  topCoins?: Array<{ symbol: string; price: number; change24h: number }> | null;
}

function buildSystemPrompt(context: ChatContext): string {
  const coin = context.selectedCoin;
  const fearGreed = context.fearGreed;

  // Get funding rate for the selected coin
  let fundingRate: number | undefined;
  if (context.fundingRates && coin) {
    const coinKey = coin.symbol.toUpperCase().replace('USDT', '').toLowerCase() as 'btc' | 'eth' | 'sol';
    fundingRate = context.fundingRates[coinKey];
  }

  // Besten Trade finden
  let bestTrade = null;
  let bestScore = 0;
  if (context.tradeRecommendations && context.tradeScores) {
    for (const [tf, setup] of Object.entries(context.tradeRecommendations)) {
      const score = context.tradeScores[tf]?.total || 0;
      if (score > bestScore) {
        bestScore = score;
        bestTrade = { timeframe: tf, ...setup, score };
      }
    }
  }

  return `Du bist Satoshi, ein freundlicher und kompetenter Crypto-Trading-Assistent.
Der User heisst Elvis.

DEINE PERSOENLICHKEIT:
- Du bist hilfsbereit, präzise und ehrlich
- Du antwortest auf Deutsch
- Du gibst konkrete Zahlen und Daten wenn möglich
- Du bist professionell aber auch freundlich
- Du sagst "Ich weiss es nicht" wenn du unsicher bist
- Du gibst KEINE Finanzberatung, nur technische Analyse

AKTUELLE DATEN:
${coin ? `- Ausgewählter Coin: ${coin.symbol.replace('USDT', '')} @ $${coin.price.toLocaleString()}
- 24h Änderung: ${coin.change24h >= 0 ? '+' : ''}${coin.change24h.toFixed(2)}%` : '- Kein Coin ausgewählt'}
${fearGreed ? `- Fear & Greed Index: ${fearGreed.value} (${fearGreed.label})` : ''}
${fundingRate !== undefined ? `- Funding Rate: ${(fundingRate * 100).toFixed(4)}%` : ''}
${bestTrade ? `- Beste Trade-Empfehlung: ${bestTrade.type.toUpperCase()} auf ${bestTrade.timeframe}
  - Score: ${bestTrade.score}/100
  - Entry: $${bestTrade.entry?.toLocaleString() || 'N/A'}
  - Stop Loss: $${bestTrade.stopLoss?.toLocaleString() || 'N/A'}
  - Take Profit: $${bestTrade.takeProfit?.toLocaleString() || 'N/A'}` : '- Keine Trade-Daten verfügbar'}
${context.topCoins ? `- Top Coins: ${context.topCoins.slice(0, 3).map(c => `${c.symbol} (${c.change24h >= 0 ? '+' : ''}${c.change24h.toFixed(1)}%)`).join(', ')}` : ''}

REGELN:
- Antworte kurz und praezise (max 3-4 Saetze)
- Nutze die aktuellen Daten in deiner Antwort
- Verwende **fett** fuer wichtige Zahlen
- Keine Emojis uebertreiben (max 1-2)
- Bei unklaren Fragen, frag nach oder erklaere was du brauchst`;
}

export async function POST(request: Request) {
  try {
    const { message, context } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Nachricht erforderlich' },
        { status: 400 }
      );
    }

    const systemPrompt = buildSystemPrompt(context || {});

    const completion = await getGroqClient().chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 500,
    });

    const response = completion.choices[0]?.message?.content || 'Hmm, ich konnte keine Antwort generieren.';

    return NextResponse.json({
      success: true,
      response,
    });
  } catch (error) {
    console.error('Satoshi Chat API error:', error);

    // Check if it's an API key issue
    if (error instanceof Error && error.message.includes('API key')) {
      return NextResponse.json(
        { success: false, error: 'API-Key nicht konfiguriert', response: 'Ups, mein Gehirn ist gerade offline. Bitte GROQ_API_KEY in den Settings prüfen!' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Chat-Fehler', response: 'Da ist was schiefgelaufen. Versuch es nochmal!' },
      { status: 500 }
    );
  }
}
