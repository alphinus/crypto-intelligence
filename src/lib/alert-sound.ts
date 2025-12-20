// Alert Sound using Web Audio API
// Generates a simple notification beep without needing an audio file

export type AlertSoundType = 'beep' | 'chime' | 'alert';

// Sound configurations for different alert types
const SOUND_CONFIGS: Record<AlertSoundType, { freq1: number; freq2: number; duration: number; type: OscillatorType }> = {
  beep: { freq1: 880, freq2: 1320, duration: 0.3, type: 'sine' },      // Short beep (current)
  chime: { freq1: 523, freq2: 784, duration: 0.5, type: 'triangle' },  // Gentle chime (C5 to G5)
  alert: { freq1: 440, freq2: 880, duration: 0.15, type: 'square' },   // Urgent alarm (plays twice)
};

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported:', e);
      return null;
    }
  }

  return audioContext;
}

export function playAlertSound(soundType: AlertSoundType = 'beep', volume: number = 0.3): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const config = SOUND_CONFIGS[soundType];

  try {
    // Resume context if suspended (browsers require user interaction first)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // Create oscillator for the sound
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Use configured sound type and frequencies
    oscillator.type = config.type;
    oscillator.frequency.setValueAtTime(config.freq1, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(config.freq2, ctx.currentTime + config.duration * 0.3);

    // Envelope for smooth sound
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + config.duration);

    // Play
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + config.duration);

    // Alert type plays twice for urgency
    if (soundType === 'alert') {
      setTimeout(() => playAlertSound('beep', volume * 0.8), 200);
    }
  } catch (e) {
    console.warn('Failed to play alert sound:', e);
  }
}

// Double beep for important alerts
export function playUrgentAlertSound(soundType: AlertSoundType = 'alert', volume: number = 0.4): void {
  playAlertSound(soundType, volume);
  setTimeout(() => playAlertSound(soundType, volume * 0.8), 250);
}

// Test if audio is available
export function isAudioAvailable(): boolean {
  return getAudioContext() !== null;
}
