// Alert Sound using Web Audio API
// Generates a simple notification beep without needing an audio file

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

export function playAlertSound(volume: number = 0.3): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    // Resume context if suspended (browsers require user interaction first)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // Create oscillator for the beep
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Frequency sweep for a pleasant notification sound
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5
    oscillator.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.1); // E6

    // Envelope for smooth sound
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    // Play
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  } catch (e) {
    console.warn('Failed to play alert sound:', e);
  }
}

// Double beep for important alerts
export function playUrgentAlertSound(volume: number = 0.4): void {
  playAlertSound(volume);
  setTimeout(() => playAlertSound(volume), 200);
}

// Test if audio is available
export function isAudioAvailable(): boolean {
  return getAudioContext() !== null;
}
