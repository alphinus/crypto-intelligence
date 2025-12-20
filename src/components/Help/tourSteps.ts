export interface TourStep {
  id: string;
  target: string | null; // CSS selector or null for welcome/goodbye
  title: string;
  content: string;
  beginnerContent?: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    target: null,
    title: 'Konnichiwa! Ich bin Satoshi',
    content: 'Willkommen beim Crypto Intelligence Dashboard! Ich zeige dir die wichtigsten Features.',
    beginnerContent: 'Keine Sorge, ich erklaere dir alles Schritt fuer Schritt - auch wenn du neu bei Crypto bist!',
    position: 'center',
  },
  {
    id: 'level-select',
    target: null,
    title: 'Waehle dein Level',
    content: 'Bist du neu bei Crypto oder schon erfahren?',
    position: 'center',
  },
  {
    id: 'sidebar',
    target: '[data-tour="sidebar"]',
    title: 'Coin-Auswahl',
    content: 'Hier siehst du die Top-Coins und kannst einen auswaehlen.',
    beginnerContent: 'BTC = Bitcoin (die erste Kryptowaehrung), ETH = Ethereum (fuer Smart Contracts), SOL = Solana (sehr schnell).',
    position: 'right',
  },
  {
    id: 'chart',
    target: '[data-tour="chart"]',
    title: 'Der Chart',
    content: 'Der Chart zeigt den Preis-Verlauf. Die farbigen Linien sind Support und Resistance Levels.',
    beginnerContent: 'Support = Preis-Untergrenze wo Kaeufer einsteigen. Resistance = Obergrenze wo Verkaeufer aktiv werden.',
    position: 'bottom',
  },
  {
    id: 'trade-signals',
    target: '[data-tour="trade-signals"]',
    title: 'Trade Signale',
    content: 'Hier siehst du Empfehlungen fuer verschiedene Timeframes (5m, 15m, 1h, 4h, 1d).',
    beginnerContent: 'Long = Auf steigende Kurse setzen (kaufen). Short = Auf fallende Kurse setzen. Score = Je hoeher, desto besser das Signal.',
    position: 'top',
  },
  {
    id: 'tabs',
    target: '[data-tour="tabs"]',
    title: 'Die Tabs',
    content: 'Trading = Chart & Signale. Sentiment = Marktstimmung. Reports = KI-Analysen.',
    position: 'bottom',
  },
  {
    id: 'sentiment',
    target: '[data-tour="sentiment"]',
    title: 'Sentiment Tab',
    content: 'Hier siehst du die Marktstimmung aus verschiedenen Quellen.',
    beginnerContent: 'Fear & Greed zeigt ob Anleger aengstlich (Fear) oder gierig (Greed) sind. Extreme Fear ist oft ein guter Kaufzeitpunkt!',
    position: 'top',
  },
  {
    id: 'report-button',
    target: '[data-tour="report-button"]',
    title: 'KI-Reports',
    content: 'Klicke hier um einen detaillierten KI-Report zu generieren.',
    beginnerContent: 'Die KI analysiert alle Daten und gibt dir eine Zusammenfassung mit Empfehlungen.',
    position: 'bottom',
  },
  {
    id: 'goodbye',
    target: null,
    title: 'Das war es!',
    content: 'Klick auf mich wenn du Hilfe brauchst. Viel Erfolg beim Trading!',
    position: 'center',
  },
];
