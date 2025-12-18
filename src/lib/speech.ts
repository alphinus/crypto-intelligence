// Web Speech API Wrapper für Audio-Zusammenfassungen

// Prüfe ob Speech Synthesis verfügbar ist (nur im Browser)
export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

// Spreche Text
export function speakText(
  text: string,
  options: {
    lang?: string;
    rate?: number;
    pitch?: number;
    volume?: number;
    onEnd?: () => void;
    onError?: (error: Error) => void;
  } = {}
): SpeechSynthesisUtterance | null {
  if (!isSpeechSupported()) {
    console.warn('Speech Synthesis nicht verfügbar');
    return null;
  }

  const {
    lang = 'de-DE',
    rate = 0.9,
    pitch = 1,
    volume = 1,
    onEnd,
    onError,
  } = options;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = rate;
  utterance.pitch = pitch;
  utterance.volume = volume;

  if (onEnd) {
    utterance.onend = onEnd;
  }

  if (onError) {
    utterance.onerror = (event) => onError(new Error(event.error));
  }

  // Stoppe vorherige Sprache
  speechSynthesis.cancel();

  // Starte neue Sprache
  speechSynthesis.speak(utterance);

  return utterance;
}

// Stoppe Sprache
export function stopSpeaking(): void {
  if (isSpeechSupported()) {
    speechSynthesis.cancel();
  }
}

// Pause/Resume
export function pauseSpeaking(): void {
  if (isSpeechSupported()) {
    speechSynthesis.pause();
  }
}

export function resumeSpeaking(): void {
  if (isSpeechSupported()) {
    speechSynthesis.resume();
  }
}

// Prüfe ob gerade gesprochen wird
export function isSpeaking(): boolean {
  if (!isSpeechSupported()) return false;
  return speechSynthesis.speaking;
}

// Verfügbare Stimmen für Deutsch
export function getGermanVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechSupported()) return [];

  return speechSynthesis.getVoices().filter(
    (voice) => voice.lang.startsWith('de')
  );
}

// Wähle beste deutsche Stimme
export function getBestGermanVoice(): SpeechSynthesisVoice | null {
  const voices = getGermanVoices();
  if (voices.length === 0) return null;

  // Bevorzuge lokale Stimmen (klingen meist besser)
  const localVoice = voices.find((v) => v.localService);
  if (localVoice) return localVoice;

  return voices[0];
}

// Generiere Audio-Zusammenfassung aus Report
export function generateAudioSummary(report: {
  overallSentiment: string;
  marketPhase: string;
  summary: string;
  riskLevel: string;
  confidenceScore: number;
  tradeRecommendation?: {
    type: string;
    confidence: string;
    reasoning: string;
  } | null;
  audioSummary?: string;
}): string {
  // Wenn audioSummary vom LLM vorhanden, nutze diese
  if (report.audioSummary) {
    return report.audioSummary;
  }

  // Sonst generiere aus Daten
  const sentimentText = {
    bullish: 'bullisch',
    bearish: 'bärisch',
    neutral: 'neutral',
  }[report.overallSentiment] || 'neutral';

  const riskText = {
    low: 'niedrig',
    medium: 'mittel',
    high: 'hoch',
  }[report.riskLevel] || 'mittel';

  let text = `Der Markt ist aktuell ${sentimentText} mit einer Konfidenz von ${report.confidenceScore} Prozent. `;
  text += `Wir befinden uns in der ${report.marketPhase}-Phase. `;
  text += `Das Risiko-Level ist ${riskText}. `;

  if (report.tradeRecommendation && report.tradeRecommendation.type !== 'wait') {
    const tradeType = report.tradeRecommendation.type === 'long' ? 'Long' : 'Short';
    text += `Die Empfehlung ist ein ${tradeType}-Trade mit ${report.tradeRecommendation.confidence} Konfidenz. `;
  } else {
    text += `Aktuell wird empfohlen abzuwarten. `;
  }

  return text;
}

// Slide-spezifische Audio-Texte
export function generateSlideAudio(
  slideIndex: number,
  data: {
    sentiment?: string;
    fearGreed?: number;
    topCoins?: Array<{ symbol: string; change24h: number }>;
    timeframes?: Record<string, { trend: string; momentum: number }>;
    levels?: { keySupport: number | null; keyResistance: number | null; currentPrice: number };
    tradeRecommendation?: { type: string; entry: number | 'market'; stopLoss: number; takeProfit: number[] } | null;
    signals?: Array<{ type: string; title: string }>;
  }
): string {
  switch (slideIndex) {
    case 0: // Marktübersicht
      const sentimentText = data.sentiment === 'bullish' ? 'bullisch' : data.sentiment === 'bearish' ? 'bärisch' : 'neutral';
      const fgText = data.fearGreed !== undefined ? `Der Fear and Greed Index steht bei ${data.fearGreed}.` : '';
      return `Die Marktstimmung ist aktuell ${sentimentText}. ${fgText}`;

    case 1: // Timeframe-Analyse
      if (!data.timeframes) return 'Timeframe-Daten werden geladen.';
      const trends = Object.entries(data.timeframes)
        .map(([tf, d]) => `${tf}: ${d.trend === 'up' ? 'aufwärts' : d.trend === 'down' ? 'abwärts' : 'seitwärts'}`)
        .join(', ');
      return `Die Timeframe-Analyse zeigt: ${trends}.`;

    case 2: // Technische Level
      if (!data.levels) return 'Level-Daten werden geladen.';
      const price = data.levels.currentPrice.toLocaleString('de-DE');
      const support = data.levels.keySupport?.toLocaleString('de-DE') || 'nicht definiert';
      const resistance = data.levels.keyResistance?.toLocaleString('de-DE') || 'nicht definiert';
      return `Bitcoin notiert bei ${price} Dollar. Der Key Support liegt bei ${support} Dollar, der Key Resistance bei ${resistance} Dollar.`;

    case 3: // Handlungsempfehlung
      if (!data.tradeRecommendation || data.tradeRecommendation.type === 'wait') {
        return 'Aktuell gibt es kein klares Trade-Setup. Die Empfehlung ist abzuwarten.';
      }
      const type = data.tradeRecommendation.type === 'long' ? 'Long' : 'Short';
      const entry = data.tradeRecommendation.entry === 'market' ? 'zum Marktpreis' : `bei ${data.tradeRecommendation.entry} Dollar`;
      return `Trade-Empfehlung: ${type} Position ${entry}. Stop Loss bei ${data.tradeRecommendation.stopLoss} Dollar.`;

    case 4: // Risiken & Warnungen
      if (!data.signals || data.signals.length === 0) {
        return 'Es gibt keine kritischen Warnungen.';
      }
      const warnings = data.signals.filter(s => s.type === 'warning');
      if (warnings.length === 0) {
        return 'Es gibt keine kritischen Warnungen.';
      }
      return `Achtung: ${warnings.map(w => w.title).join('. ')}.`;

    default:
      return '';
  }
}
