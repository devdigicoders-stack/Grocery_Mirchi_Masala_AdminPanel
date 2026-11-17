/**
 * Dynamic Notification Audio Synthesizer (Web Audio API)
 * Generates a clean, modern, multi-tone chime (Ding-Dong) with 0 external mp3 dependencies.
 * Works offline, instant, zero latency.
 */

class SoundManager {
  constructor() {
    this.audioCtx = null
    this.isMuted = false
    try {
      this.isMuted = localStorage.getItem('mirch_masala_sound_muted') === 'true'
    } catch (_) {}
  }

  // Lazy-initialize audio context on first user gesture or sound
  _getContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass()
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume()
    }
    return this.audioCtx
  }

  /**
   * Play crystal-clear modern chime (Ding-Dong / Marimba tone)
   */
  playNotificationTone() {
    if (this.isMuted) return

    try {
      const ctx = this._getContext()
      if (!ctx) return

      const now = ctx.currentTime

      // Tone 1: 880 Hz (A5 - High bell)
      const osc1 = ctx.createOscillator()
      const gain1 = ctx.createGain()

      osc1.type = 'sine'
      osc1.frequency.setValueAtTime(880, now)

      gain1.gain.setValueAtTime(0.25, now)
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35)

      osc1.connect(gain1)
      gain1.connect(ctx.destination)

      osc1.start(now)
      osc1.stop(now + 0.35)

      // Tone 2: 1320 Hz (Harmonic chime, delayed 100ms)
      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()

      osc2.type = 'sine'
      osc2.frequency.setValueAtTime(1320, now + 0.1)

      gain2.gain.setValueAtTime(0.0001, now)
      gain2.gain.setValueAtTime(0.3, now + 0.1)
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55)

      osc2.connect(gain2)
      gain2.connect(ctx.destination)

      osc2.start(now + 0.1)
      osc2.stop(now + 0.55)
    } catch (e) {
      console.warn('Audio tone error:', e.message)
    }
  }

  /**
   * Play urgent alert tone (for deadline warning or high priority alert)
   */
  playUrgentTone() {
    if (this.isMuted) return

    try {
      const ctx = this._getContext()
      if (!ctx) return

      const now = ctx.currentTime

      // Double beep
      [0, 0.18].forEach((delay) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.type = 'triangle'
        osc.frequency.setValueAtTime(1046.5, now + delay) // C6

        gain.gain.setValueAtTime(0.2, now + delay)
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.12)

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.start(now + delay)
        osc.stop(now + delay + 0.12)
      })
    } catch (_) {}
  }

  toggleMute() {
    this.isMuted = !this.isMuted
    try {
      localStorage.setItem('mirch_masala_sound_muted', String(this.isMuted))
    } catch (_) {}
    return this.isMuted
  }

  getMuted() {
    return this.isMuted
  }
}

export const soundManager = new SoundManager()
export default soundManager
