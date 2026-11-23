/**
 * src/lib/soundFx.js
 * Soft editorial Web Audio chimes & gentle haptic feedback for LUMINA // BEAUTY & SALON
 */

class SoundFxEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  _ensureCtx() {
    if (typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.ctx) {
      try {
        this.ctx = new AudioCtx();
      } catch {
        return null;
      }
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  _tone(freq = 580, duration = 0.08, volume = 0.04, type = 'sine') {
    if (this.muted) return;
    const ctx = this._ensureCtx();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // ignore audio errors
    }
  }

  playClick() {
    this._tone(640, 0.055, 0.03, 'sine');
  }

  playFlip() {
    this._tone(520, 0.07, 0.035, 'triangle');
    setTimeout(() => this._tone(740, 0.08, 0.03, 'sine'), 45);
  }

  playSuccess() {
    this._tone(587.33, 0.1, 0.04, 'sine');
    setTimeout(() => this._tone(880, 0.14, 0.04, 'sine'), 80);
  }

  playAlert() {
    this._tone(420, 0.12, 0.04, 'triangle');
  }

  triggerHaptic(ms = 10) {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(ms);
      } catch {
        // ignore
      }
    }
  }
}

export const soundFx = new SoundFxEngine();
