/**
 * Feedback Service
 * Synthesizes high-fidelity organic UI sound effects and triggers tactile haptic vibrations
 * via the browser Web Audio and Vibration APIs. High performance, zero external assets required.
 */

// Initialize Audio Context lazily to satisfy modern browser autoplay policies
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  // Resume if suspended by browser autoplay guards
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export const feedbackService = {
  /**
   * Synthesizes a high-fidelity sound effect using Web Audio API oscillators.
   */
  playSound(type: 'tap' | 'type' | 'notify' | 'success' | 'warn') {
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      if (type === 'tap') {
        // Ultra-short elegant organic UI tick
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.05);

        gain.gain.setValueAtTime(0.015, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.06);
      } 
      else if (type === 'type') {
        // Super minimal soft wooden keyclick tick
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400, now);
        osc.frequency.exponentialRampToValueAtTime(1000, now + 0.02);

        gain.gain.setValueAtTime(0.008, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.03);
      } 
      else if (type === 'notify') {
        // Elegant celestial dual-chime bell
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(523.25, now); // C5
        osc1.frequency.linearRampToValueAtTime(659.25, now + 0.12); // E5

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(783.99, now + 0.06); // G5
        osc2.frequency.linearRampToValueAtTime(1046.50, now + 0.25); // C6

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now + 0.06);
        osc1.stop(now + 0.45);
        osc2.stop(now + 0.45);
      } 
      else if (type === 'success') {
        // Gentle modern uplifting arpeggio
        const frequencies = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
        const dur = 0.08;

        frequencies.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + (i * dur));

          gain.gain.setValueAtTime(0, now + (i * dur));
          gain.gain.linearRampToValueAtTime(0.04, now + (i * dur) + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + (i * dur) + dur + 0.08);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + (i * dur));
          osc.stop(now + (i * dur) + dur + 0.1);
        });
      } 
      else if (type === 'warn') {
        // Warm dual-pulse organic caution bass
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.linearRampToValueAtTime(110, now + 0.25);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.setValueAtTime(0.12, now + 0.07);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.3);
      }
    } catch (e) {
      console.warn('Audio feedback synthesis failed:', e);
    }
  },

  /**
   * Triggers high-precision device haptic vibration pattern.
   */
  vibrate(pattern: 'tap' | 'type' | 'notify' | 'success' | 'warn' | number | number[]) {
    if (typeof window === 'undefined' || !navigator.vibrate) return;

    try {
      if (typeof pattern === 'number' || Array.isArray(pattern)) {
        navigator.vibrate(pattern);
        return;
      }

      switch (pattern) {
        case 'type':
          navigator.vibrate(6); // Minimal snappy feedback
          break;
        case 'tap':
          navigator.vibrate(12); // Tiny discrete bump
          break;
        case 'notify':
          navigator.vibrate([15, 60, 25]); // Elegant double shift
          break;
        case 'success':
          navigator.vibrate([10, 40, 15, 40, 20]); // Upward ripple
          break;
        case 'warn':
          navigator.vibrate([40, 70, 40]); // Low heavy warning rumble
          break;
      }
    } catch (e) {
      console.warn('Haptic vibration failed:', e);
    }
  },

  /**
   * Triggers combined sound and touch vibration feedback.
   */
  trigger(type: 'tap' | 'type' | 'notify' | 'success' | 'warn') {
    this.playSound(type);
    this.vibrate(type);
  }
};
