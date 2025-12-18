# Crypto Intelligence MVP

KI-gestützte Crypto News Intelligence Platform - **100% kostenlos** im Betrieb.

## Features

- **News Aggregation**: 10+ RSS-Feeds von CoinDesk, Cointelegraph, Decrypt, etc.
- **KI-Analyse**: Sentiment-Erkennung und Marktüberblick via Groq (Llama 3.1)
- **Market Data**: Top 20 Coins von CoinGecko + Fear & Greed Index
- **Live Dashboard**: React 18 + TailwindCSS mit Auto-Refresh

## Schnellstart

```bash
cd /Users/mg1/Python/crypto-intelligence

# 1. Groq API Key holen (kostenlos): https://console.groq.com
# 2. .env.local bearbeiten und GROQ_API_KEY eintragen

# 3. Starten
npm run dev

# 4. Browser öffnen: http://localhost:3000
```

## Kostenlose APIs verwendet

| Service        | Zweck                    | Kosten  |
|----------------|--------------------------|---------|
| CoinGecko      | Preise, Market Cap       | $0      |
| Fear & Greed   | Markt-Sentiment          | $0      |
| Groq           | KI-Analyse (Llama 3.1)   | $0      |
| RSS Feeds      | Crypto News              | $0      |
| Vercel         | Hosting (optional)       | $0      |

## Projektstruktur

```
src/
├── app/
│   ├── api/
│   │   ├── news/       # RSS Feed Aggregation
│   │   ├── market/     # CoinGecko + Fear & Greed
│   │   └── analyze/    # Groq KI-Analyse
│   ├── page.tsx        # Dashboard
│   └── layout.tsx
├── components/
│   ├── NewsCard.tsx
│   └── MarketOverview.tsx
├── lib/
│   ├── feeds.ts        # RSS Feed Konfiguration
│   ├── rss-parser.ts   # RSS Parser
│   └── groq.ts         # Groq API Client
└── types/
    └── news.ts
```

## Nächste Schritte

- [ ] Supabase für Artikel-Speicherung
- [ ] Email-Alerts (Resend Free Tier)
- [ ] Reddit Sentiment Integration
- [ ] DefiLlama On-Chain Daten
- [ ] Vercel Deployment

## Deployment auf Vercel

```bash
# 1. Vercel CLI installieren
npm i -g vercel

# 2. Deployen
vercel

# 3. Environment Variables in Vercel Dashboard setzen
#    - GROQ_API_KEY
```

## Lizenz

MIT
