export interface TourStep {
  id: string;
  target: string | null; // CSS selector or null for welcome/goodbye
  title: string;
  content: string;
  beginnerContent?: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  showChatDemo?: boolean; // Flag to show chat demo in this step
  phase?: string; // Optional phase grouping
}

// Personalisierung für den ersten User
const USER_NAME = 'Elvis';

export const TOUR_STEPS: TourStep[] = [
  // === PHASE 1: WILLKOMMEN ===
  {
    id: 'welcome',
    target: null,
    title: `Konnichiwa, ${USER_NAME}!`,
    content: `Hey ${USER_NAME}! Ich bin Satoshi, dein persoenlicher Crypto-Assistent. Lass mich dir das Dashboard zeigen!`,
    beginnerContent: 'Keine Sorge, ich erklaere dir alles Schritt fuer Schritt - auch wenn du neu bei Crypto bist!',
    position: 'center',
    phase: 'welcome',
  },
  {
    id: 'level-select',
    target: null,
    title: `${USER_NAME}, waehle dein Level`,
    content: 'Bist du neu bei Crypto oder schon ein alter Hase?',
    position: 'center',
    phase: 'welcome',
  },

  // === PHASE 2: NAVIGATION ===
  {
    id: 'header-menu',
    target: '[data-tour="header-menu"]',
    title: 'Header & Menu',
    content: 'Hier kannst du zwischen Dark/Light Mode wechseln und die Settings oeffnen.',
    beginnerContent: 'Dark Mode ist angenehmer fuer die Augen beim Trading, besonders nachts.',
    position: 'bottom',
    phase: 'navigation',
  },
  {
    id: 'sidebar',
    target: '[data-tour="sidebar"]',
    title: 'Coin-Auswahl',
    content: 'Hier siehst du die Top-Coins und kannst einen auswaehlen.',
    beginnerContent: 'BTC = Bitcoin (die erste Kryptowaehrung), ETH = Ethereum (fuer Smart Contracts), SOL = Solana (sehr schnell).',
    position: 'right',
    phase: 'navigation',
  },
  {
    id: 'timeframe-selector',
    target: '[data-tour="timeframe"]',
    title: 'Timeframe-Auswahl',
    content: 'Waehle den Zeitrahmen fuer den Chart: 5m, 15m, 1h, 4h oder 1d.',
    beginnerContent: '5m = 5 Minuten pro Kerze (schnell, fuer Daytrading). 4h = 4 Stunden (fuer Swing-Trading). 1d = 1 Tag (langfristig).',
    position: 'bottom',
    phase: 'navigation',
  },

  // === PHASE 3: CHART & ANALYSE ===
  {
    id: 'chart',
    target: '[data-tour="chart"]',
    title: 'Der Chart',
    content: 'Der Chart zeigt den Preis-Verlauf. Die farbigen Linien sind Support und Resistance Levels.',
    beginnerContent: 'Support = Preis-Untergrenze wo Kaeufer einsteigen. Resistance = Obergrenze wo Verkaeufer aktiv werden.',
    position: 'bottom',
    phase: 'chart',
  },
  {
    id: 'indicators-toggle',
    target: '[data-tour="indicators"]',
    title: 'Indikatoren',
    content: 'Aktiviere RSI, MACD oder EMA Linien fuer zusaetzliche Analyse.',
    beginnerContent: 'RSI = Zeigt ob ein Coin ueberkauft (>70) oder ueberverkauft (<30) ist. MACD = Trend-Bestaetigung. EMA = Gleitende Durchschnitte.',
    position: 'bottom',
    phase: 'chart',
  },
  {
    id: 'confluence-zones',
    target: '[data-tour="confluence"]',
    title: 'Confluence Zones',
    content: 'Hier siehst du, wo mehrere Zeitrahmen das gleiche Support/Resistance Level haben.',
    beginnerContent: 'Wenn 1h UND 4h das gleiche Preisniveau als wichtig markieren, ist es ein besonders starkes Level!',
    position: 'left',
    phase: 'chart',
  },
  {
    id: 'trade-signals',
    target: '[data-tour="trade-signals"]',
    title: 'Trade Signale',
    content: 'Hier siehst du Empfehlungen fuer verschiedene Timeframes (5m, 15m, 1h, 4h, 1d).',
    beginnerContent: 'Long = Auf steigende Kurse setzen (kaufen). Short = Auf fallende Kurse setzen. Score = Je hoeher, desto besser das Signal.',
    position: 'top',
    phase: 'chart',
  },

  // === PHASE 4: TABS ERKUNDEN ===
  {
    id: 'tabs',
    target: '[data-tour="tabs"]',
    title: 'Die Tabs',
    content: 'Trading = Chart & Signale. Sentiment = Marktstimmung. Reports = KI-Analysen. Meme = Memecoins.',
    position: 'bottom',
    phase: 'tabs',
  },
  {
    id: 'sentiment',
    target: '[data-tour="sentiment"]',
    title: 'Sentiment Tab',
    content: 'Hier siehst du die Marktstimmung aus verschiedenen Quellen.',
    beginnerContent: 'Fear & Greed zeigt ob Anleger aengstlich (Fear) oder gierig (Greed) sind. Extreme Fear ist oft ein guter Kaufzeitpunkt!',
    position: 'top',
    phase: 'tabs',
  },
  {
    id: 'memecoins-tab',
    target: '[data-tour="memecoins-tab"]',
    title: 'Meme Coins Tab',
    content: 'Die heissesten Memecoins: DOGE, SHIB, PEPE, WIF und mehr!',
    beginnerContent: 'Memecoins sind hoch-riskant aber koennen hohe Gewinne bringen. Nur investieren was du verlieren kannst!',
    position: 'bottom',
    phase: 'tabs',
  },
  {
    id: 'liquidations-info',
    target: '[data-tour="liquidations"]',
    title: 'Liquidationen',
    content: 'Zeigt wo grosse Positionen liquidiert werden. Wichtig fuer Volatilitaets-Vorhersagen.',
    beginnerContent: 'Wenn viele Trader bei einem Preis-Level liquidiert werden, kann das starke Preisbewegungen ausloesen.',
    position: 'left',
    phase: 'tabs',
  },

  // === PHASE 5: FEATURES ===
  {
    id: 'fear-greed-widget',
    target: '[data-tour="fear-greed"]',
    title: 'Fear & Greed Index',
    content: 'Der Fear & Greed Index zeigt die Marktstimmung von 0 (Extreme Angst) bis 100 (Extreme Gier).',
    beginnerContent: 'Extreme Angst (0-25) = Guter Kaufzeitpunkt. Extreme Gier (75-100) = Vorsicht, Korrektur moeglich!',
    position: 'right',
    phase: 'features',
  },
  {
    id: 'top-gainers-ticker',
    target: '[data-tour="gainer-ticker"]',
    title: 'Top Gainer & Loser',
    content: 'Scrollendes Ticker-Band mit den Top-Gewinnern und Verlierern der letzten 24h.',
    position: 'bottom',
    phase: 'features',
  },
  {
    id: 'report-button',
    target: '[data-tour="report-button"]',
    title: 'KI-Reports',
    content: 'Klicke hier um einen detaillierten KI-Report zu generieren.',
    beginnerContent: 'Die KI analysiert alle Daten und gibt dir eine Zusammenfassung mit Empfehlungen.',
    position: 'bottom',
    phase: 'features',
  },
  {
    id: 'chat-intro',
    target: null,
    title: 'Dein Trading-Assistent',
    content: 'Klick jederzeit auf mich, um Fragen zu stellen! Ich kann dir Trades empfehlen, Risiken einschaetzen und den Markt erklaeren.',
    beginnerContent: 'Du kannst mich z.B. fragen: "Soll ich jetzt kaufen?", "Was macht ETH?" oder "Wie ist das Risiko?"',
    position: 'center',
    showChatDemo: true,
    phase: 'features',
  },

  // === PHASE 6: ABSCHLUSS ===
  {
    id: 'goodbye',
    target: null,
    title: `Viel Erfolg, ${USER_NAME}!`,
    content: `Das war's, ${USER_NAME}! Ich bin unten rechts immer fuer dich da. Klick auf mich wenn du Fragen hast! 🚀`,
    position: 'center',
    phase: 'goodbye',
  },
];

// Export step count for progress indicator
export const TOTAL_STEPS = TOUR_STEPS.length;

// Get steps by phase for grouping
export function getStepsByPhase() {
  const phases: Record<string, TourStep[]> = {};
  TOUR_STEPS.forEach(step => {
    const phase = step.phase || 'other';
    if (!phases[phase]) phases[phase] = [];
    phases[phase].push(step);
  });
  return phases;
}
