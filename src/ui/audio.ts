/**
 * AudioManager — syntetizované zvukové efekty (WebAudio, žádné soubory).
 * AudioContext se odemyká prvním uživatelským gestem (autoplay politika).
 * Stejný efekt hraje max ~1× za 60 ms (dávky událostí při kompresi času).
 */
import type { SimState } from '../sim/types'
import { SHIP_CLASSES } from '../data/defs'
import { dist } from '../sim/vec'
import { hostileTo } from '../sim/util'

/** Hudební stavy (soubory public/audio/music-<stav>.mp3; viz docs/AUDIO_PROMPTS.md). */
export type MusicState = 'menu' | 'cruise' | 'tension' | 'combat' | 'victory' | 'defeat'

const MUSIC_RANK: Partial<Record<MusicState, number>> = { cruise: 0, tension: 1, combat: 2 }
/** hystereze: bojový stav smí KLESNOUT až po tolika ms klidu */
const MUSIC_CALM_MS = 12_000
const MUSIC_FADE_MS = 2500

export class AudioManager {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private noiseBuf: AudioBuffer | null = null
  private last: Record<string, number> = {}
  muted = false

  // ---------- adaptivní hudba ----------
  private tracks: Partial<Record<MusicState, HTMLAudioElement>> = {}
  private music: MusicState | null = null
  private menuMode = true
  private unlocked = false
  private calmSince = 0
  private fadeTimer = 0

  unlock(): void {
    if (!this.unlocked) { this.unlocked = true; this.setMusic(this.menuMode ? 'menu' : 'cruise') }
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

  /** Menu vs. hra — přepíná mezi menu stopou a bojovým automatem. */
  setMenuMode(on: boolean): void {
    this.menuMode = on
    if (this.unlocked && on) this.setMusic('menu')
  }

  /** Určení hudebního stavu z posledního snapshotu. */
  private musicStateFor(state: SimState): MusicState {
    if (state.outcome === 'win') return 'victory'
    if (state.outcome === 'lose') return 'defeat'
    const own = state.ships.filter(s => s.side === 'player' && !s.destroyed)
    if (!own.length) return 'tension'
    let nearest = Infinity
    let lowHull = 1
    for (const s of own) {
      const hp = SHIP_CLASSES[s.classId]?.hullPoints ?? 100
      lowHull = Math.min(lowHull, s.hull / hp)
      for (const o of state.ships) {
        if (o.destroyed || o.surrendered || !hostileTo(s.side, o.side)) continue
        nearest = Math.min(nearest, dist(s.pos, o.pos))
      }
    }
    const ballsFlying = state.balls.length > 0
    if (lowHull < 0.4 || nearest < 600 || ballsFlying) return 'combat'
    if (nearest < 2500) return 'tension'
    return 'cruise'
  }

  /** Reaguje na události a stav posledního snapshotu (hudba + SFX). */
  onSnapshot(state: SimState): void {
    if (this.unlocked && !this.menuMode && !this.muted) {
      const want = this.musicStateFor(state)
      // eskalace hned, deeskalace s hysterezí (aby hudba nekmitala)
      const cur = this.music
      const curRank = cur ? MUSIC_RANK[cur] : undefined
      const wantRank = MUSIC_RANK[want]
      if (want === 'victory' || want === 'defeat') {
        this.setMusic(want)
      } else if (curRank === undefined || wantRank === undefined || wantRank >= curRank) {
        this.calmSince = 0
        this.setMusic(want)
      } else {
        // chce klesnout — počkej na klid
        const now = performance.now()
        if (this.calmSince === 0) this.calmSince = now
        if (now - this.calmSince > MUSIC_CALM_MS) { this.calmSince = 0; this.setMusic(want) }
      }
    }
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

  // ---------- hudba (HTMLAudioElement, crossfade; chybějící soubor = ticho) ----------
  private ensureTrack(state: MusicState): HTMLAudioElement {
    let el = this.tracks[state]
    if (!el) {
      el = new Audio(`audio/music-${state}.mp3`)
      el.loop = state !== 'victory' && state !== 'defeat'
      el.volume = 0
      el.preload = 'auto'
      // chybějící soubor (404) tiše ignoruj
      el.addEventListener('error', () => { /* žádná hudba — nevadí */ })
      this.tracks[state] = el
    }
    return el
  }

  private setMusic(state: MusicState): void {
    if (this.music === state) return
    this.music = state
    const next = this.ensureTrack(state)
    if (next.paused) { next.currentTime = 0; void next.play().catch(() => { /* autoplay/404 */ }) }
    this.startFade()
  }

  /**
   * Jeden trvalý fade ticker: aktuální stopu ztlumí NAHORU na cílovou hlasitost,
   * VŠECHNY ostatní načtené stopy dolů na 0 a při 0 je pauzne. Odolné vůči
   * přerušení jiným přechodem (nikdy nenechá starou stopu hrát „pod" novou).
   */
  private startFade(): void {
    if (this.fadeTimer) return
    const target = 0.6
    let last = performance.now()
    const loop = (): void => {
      const now = performance.now()
      const delta = ((now - last) / MUSIC_FADE_MS) * target
      last = now
      let active = false
      for (const [name, el] of Object.entries(this.tracks)) {
        if (!el) continue
        const goal = name === this.music ? target : 0
        if (el.volume < goal) el.volume = Math.min(goal, el.volume + delta)
        else if (el.volume > goal) el.volume = Math.max(goal, el.volume - delta)
        if (Math.abs(el.volume - goal) > 0.001) active = true
        else if (goal === 0 && !el.paused) el.pause()
      }
      this.fadeTimer = active ? requestAnimationFrame(loop) : 0
    }
    this.fadeTimer = requestAnimationFrame(loop)
  }
}
