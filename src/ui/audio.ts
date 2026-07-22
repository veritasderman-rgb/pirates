/**
 * AudioManager — syntetizované zvukové efekty (WebAudio, žádné soubory).
 * AudioContext se odemyká prvním uživatelským gestem (autoplay politika).
 * Stejný efekt hraje max ~1× za 60 ms (dávky událostí při kompresi času).
 */
import type { SimState } from '../sim/types'

export class AudioManager {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private noiseBuf: AudioBuffer | null = null
  private last: Record<string, number> = {}
  muted = false

  unlock(): void {
    if (this.ctx) return
    try {
      const Ctor = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)
      this.ctx = new Ctor()
      this.master = this.ctx.createGain()
      this.master.gain.value = 0.5
      this.master.connect(this.ctx.destination)
      // šumový buffer pro exploze/šplouchnutí
      const n = this.ctx.sampleRate * 1
      this.noiseBuf = this.ctx.createBuffer(1, n, this.ctx.sampleRate)
      const d = this.noiseBuf.getChannelData(0)
      let seed = 12345
      for (let i = 0; i < n; i++) { seed = (seed * 1103515245 + 12345) & 0x7fffffff; d[i] = (seed / 0x3fffffff) - 1 }
    } catch { this.ctx = null }
  }

  private can(key: string): boolean {
    const now = performance.now()
    if ((this.last[key] ?? 0) > now - 60) return false
    this.last[key] = now
    return true
  }

  /** Reaguje na události posledního snapshotu. */
  onSnapshot(state: SimState): void {
    if (!this.ctx || this.muted) return
    for (const e of state.events) {
      switch (e.kind) {
        case 'gunFire': if (this.can('gun')) this.boom(0.55, 0.18); break
        case 'ballHit': if (this.can('hit')) this.thud(); break
        case 'ballMiss': if (this.can('splash')) this.splash(); break
        case 'shipDestroyed': if (this.can('boom')) this.boom(0.9, 0.6); break
        case 'aground': if (this.can('aground')) this.thud(); break
        case 'surrender':
        case 'board': if (this.can('bell')) this.bell(); break
      }
    }
  }

  private boom(gain: number, dur: number): void {
    const ctx = this.ctx!, t = ctx.currentTime
    const src = ctx.createBufferSource(); src.buffer = this.noiseBuf
    const filt = ctx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 320
    const g = ctx.createGain(); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur)
    src.connect(filt); filt.connect(g); g.connect(this.master!)
    src.start(t); src.stop(t + dur)
  }

  private thud(): void {
    const ctx = this.ctx!, t = ctx.currentTime
    const osc = ctx.createOscillator(); osc.type = 'square'; osc.frequency.setValueAtTime(120, t); osc.frequency.exponentialRampToValueAtTime(50, t + 0.12)
    const g = ctx.createGain(); g.gain.setValueAtTime(0.35, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.15)
    osc.connect(g); g.connect(this.master!); osc.start(t); osc.stop(t + 0.15)
  }

  private splash(): void {
    const ctx = this.ctx!, t = ctx.currentTime
    const src = ctx.createBufferSource(); src.buffer = this.noiseBuf
    const filt = ctx.createBiquadFilter(); filt.type = 'highpass'; filt.frequency.value = 900
    const g = ctx.createGain(); g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.2)
    src.connect(filt); filt.connect(g); g.connect(this.master!); src.start(t); src.stop(t + 0.2)
  }

  private bell(): void {
    const ctx = this.ctx!, t = ctx.currentTime
    for (const [f, d] of [[880, 0.6], [1320, 0.5]] as const) {
      const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = f
      const g = ctx.createGain(); g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.001, t + d)
      osc.connect(g); g.connect(this.master!); osc.start(t); osc.stop(t + d)
    }
  }
}
