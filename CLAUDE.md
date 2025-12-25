# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Dev Server Regeln (KRITISCH!)

**Fester Port für dieses Projekt: 3006**

Bevor du einen Dev-Server startest:

1. **NUR Port 3006 prüfen** (nicht alle Ports!):
   ```bash
   lsof -i :3006 | grep LISTEN
   ```

2. **Falls belegt, NUR Port 3006 freigeben**:
   ```bash
   lsof -ti :3006 | xargs kill -9 2>/dev/null
   ```

3. **Server starten**:
   ```bash
   PORT=3006 npm run dev
   ```
   Mit `run_in_background: true` Parameter.

**WICHTIG:**
- NIEMALS `pkill -f "next dev"` verwenden (würde ANDERE Apps beenden!)
- NIEMALS andere Ports (3000, 3001, etc.) prüfen oder freigeben
- Andere Apps auf anderen Ports NICHT anfassen
- Nutze alternativ: `npm run dev:3006` (räumt nur Port 3006 auf)

---

## Project Overview

Crypto Intelligence is a Next.js 16 cryptocurrency dashboard with AI-powered market analysis. The app uses Groq API for LLM analysis, Binance for real-time market data via WebSocket, and various free APIs for sentiment data.

## Development Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run lint     # Run ESLint
npm test         # Run Vitest tests
npm run test:coverage  # Run tests with coverage report
```

Single test file: `npx vitest src/__tests__/lib/trade-setup.test.ts`

## Architecture

### Data Flow

1. **API Routes** (`src/app/api/`) - Server-side data fetching from external APIs
2. **Lib modules** (`src/lib/`) - Data transformation, calculations, API clients
3. **Hooks** (`src/hooks/`) - WebSocket connections, state management, price alerts
4. **Components** (`src/components/`) - UI rendering, organized by feature

### Key Modules

- `src/lib/binance-klines.ts` - Binance API client with automatic US fallback (handles 451 blocks)
- `src/lib/groq.ts` - AI analysis using Groq (llama-3.3-70b-versatile for analysis, llama-3.1-8b-instant for bulk)
- `src/lib/technical-levels.ts` - Support/resistance, Fibonacci, confluence zone calculations
- `src/lib/llm-provider.ts` - Abstraction layer for switching LLM providers

### WebSocket Integration

- `useBinanceWebSocket` hook manages live kline updates
- Price updates flow through `handleKlineUpdate` callback in `page.tsx`
- Symbol validation prevents stale data from old WebSocket connections

### State Management

Main state lives in `src/app/page.tsx` (client component). Key state:
- `multiTimeframe` - Multi-timeframe technical data for selected coin
- `tradeRecommendations` - Generated trade setups per timeframe
- `tradeScores` - Ranked scoring with technical + sentiment weights

### Tab-Based UI

Three main tabs in `TabNavigation`: Trading (chart + signals), Sentiment (social data), Reports (AI analysis).

## External APIs

- **Binance** - Klines, futures data (free, no key needed)
- **CoinGecko** - Market data, fear/greed (free tier)
- **DefiLlama** - DeFi TVL data (free)
- **Mempool.space** - Bitcoin on-chain data (free)
- **Reddit** - Sentiment via JSON endpoints (free)
- **Groq** - LLM analysis (requires `GROQ_API_KEY`)

## Type Definitions

- `src/types/news.ts` - MarketData, FearGreedIndex, NewsArticle
- `src/types/alerts.ts` - Price alert types
- `src/types/liquidations.ts` - Liquidation stream types
- `src/lib/groq.ts` - Trade setup types (TimeframeTradeSetup, TradeScore, etc.)

## Rate Limiting

- AI reports have 3-minute cooldown (`REPORT_COOLDOWN`)
- Client-side cache for coin analysis (5-minute duration)
- Auto-refresh interval is 15 minutes to reduce Vercel invocations

## Testing

Tests use Vitest with jsdom environment. Setup file at `src/__tests__/setup.ts`. Test files follow pattern `src/__tests__/**/*.test.{ts,tsx}`.
