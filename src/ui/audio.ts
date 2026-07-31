/**
 * AudioManager — syntetizované zvukové efekty (WebAudio, žádné soubory).
 * AudioContext se odemyká prvním uživatelským gestem (autoplay politika).
 * Stejný efekt hraje max ~1× za 60 ms (dávky událostí při kompresi času).
 */
import type { SimState } from '../sim/types'
import { activeLang } from '../i18n/core'
import { SHIP_CLASSES } from '../data/defs'
import { dist } from '../sim/vec'
import { hostileTo } from '../sim/util'

/** Hudební stavy (soubory public/audio/music-<stav>.mp3; viz docs/AUDIO_PROMPTS.md). */
export type MusicState = 'menu' | 'cruise' | 'tension' | 'combat' | 'victory' | 'defeat'

const MUSIC_RANK: Partial<Record<MusicState, number>> = { cruise: 0, tension: 1, combat: 2 }
/** hystereze: bojový stav smí KLESNOUT až po tolika ms klidu */
const MUSIC_CALM_MS = 12_000
const MUSIC_FADE_MS = 2500
/** hlasitost hudby a její stažení pod mluvené slovo (dabing) */
const MUSIC_VOL = 0.6
const MUSIC_DUCK_VOL = 0.16
/** stejný bojový výkřik nejdřív takhle po sobě (ať se neopakuje dokola) */
const BARK_COOLDOWN_MS = 25_000
/** racci: kolik variant, jak hlasitě a jak často (první / dál náhodně v rozpětí) */
const GULL_FILES = ['gulls-1', 'gulls-2', 'gulls-3']
const GULL_VOL = 0.3
const GULL_FIRST_MS = 20_000
const GULL_MIN_MS = 45_000
const GULL_MAX_MS = 105_000

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
  /** mise s vlastní bojovou stopou (public/audio/mission-<id>.mp3) */
  private missionId: string | null = null
  /** běží úvodní film — hudební automat celou dobu mlčí */
  private introMode = false

  // ---------- ambient racků ----------
  private gullTimer = 0
  private gullAt = 0

  // ---------- dabing (voiceover) ----------
  private vo: HTMLAudioElement | null = null
  private voQueue: string[] = []
  private voPlayed = new Set<string>()
  private ducked = false   // hudba je stažená pod mluvené slovo
  private barkAt: Record<string, number> = {}
  private voBlocked = false  // autoplay zakázán → čeká se na gesto uživatele
  voiceMuted = false

  unlock(): void {
    if (!this.unlocked) {
      this.unlocked = true
      this.setMusic(this.menuMode ? 'menu' : 'cruise')
      this.startGulls()
    }
    // dabing čekal na gesto (autoplay) — teď ho rozjeď od zadržené repliky
    if (this.voBlocked && !this.vo && this.voQueue.length) { this.voBlocked = false; this.pumpVoice() }
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

  /**
   * Zařadí namluvenou repliku (public/vo/<id>.mp3). Repliky se nepřekrývají —
   * hrají po sobě; každá jen jednou za misi. Chybějící klip se tiše přeskočí,
   * takže hra funguje i bez dabingu.
   */
  speak(id: string | undefined, opts: { force?: boolean; bark?: boolean } = {}): void {
    if (!id || this.muted || this.voiceMuted) return
    if (opts.bark) {
      // bojový výkřik: smí se opakovat (s odstupem), ale NEČEKÁ ve frontě —
      // za dlouhým briefingem by dohrál až dávno po situaci, tak radši mlčí
      const now = performance.now()
      if (this.vo || this.voQueue.length) return
      if (now - (this.barkAt[id] ?? -Infinity) < BARK_COOLDOWN_MS) return
      this.barkAt[id] = now
    } else {
      if (!opts.force && this.voPlayed.has(id)) return
      this.voPlayed.add(id)
    }
    this.voQueue.push(id)
    if (!this.vo) this.pumpVoice()
  }

  /** Zastaví právě hrající repliku i frontu (např. přechod na jinou obrazovku). */
  stopVoice(): void {
    this.voQueue.length = 0
    if (this.vo) { this.vo.pause(); this.vo = null }
    this.duckMusic(false)
  }

  /** Nová mise → repliky se smí přehrát znovu. */
  resetVoice(): void {
    this.stopVoice()
    this.voPlayed.clear()
  }

  private pumpVoice(): void {
    const id = this.voQueue[0]
    if (id === undefined) { this.vo = null; this.duckMusic(false); return }
    const el = new Audio(`vo/${activeLang() === 'cs' ? 'cs/' : ''}${encodeURIComponent(id)}.mp3`)
    el.volume = 0.95
    this.vo = el
    this.duckMusic(true)
    const next = (): void => {
      if (this.vo !== el) return
      this.voQueue.shift()   // tuhle repliku máme odbytou (dohrála / chybí)
      this.vo = null
      this.pumpVoice()
    }
    el.addEventListener('ended', next)
    el.addEventListener('error', next)   // klip chybí → jen pokračuj
    el.play().then(() => { this.voBlocked = false }).catch((err: unknown) => {
      // autoplay zakázán (vstup přes ?mission= před prvním gestem): NEZAHazuj
      // frontu — nech ji čekat a rozjeď ji, až uživatel klikne (viz unlock())
      if ((err as { name?: string })?.name === 'NotAllowedError') {
        if (this.vo === el) { this.vo = null; this.voBlocked = true; this.duckMusic(false) }
      } else next()
    })
  }

  /** Ztlumí hudbu pod mluvené slovo (a zase vrátí) — přes cíl fade smyčky. */
  private duckMusic(on: boolean): void {
    if (this.ducked === on) return
    this.ducked = on
    this.startFade()
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

  /**
   * Bojová stopa aktuální mise. Ve stavu `combat` se místo obecné
   * `music-combat.mp3` pouští `mission-<id>.mp3`, takže má každá mise vlastní
   * vrchol boje; klidné stavy zůstávají společné, aby crossfady pořád zněly
   * jako jedna skladba. Chybí-li stopa mise, spadne se na obecnou (viz
   * ensureTrack) — hra tedy funguje i s neúplnou hudbou.
   */
  setMissionTheme(id: string | null): void {
    if (this.missionId === id) return
    this.missionId = id
    // zahoď načtenou bojovou stopu, ať se příště vytvoří ze správného souboru
    const old = this.tracks.combat
    if (old) { old.pause(); delete this.tracks.combat }
    if (this.music === 'combat') { this.music = null; this.setMusic('combat') }
  }

  /** Úvodní film má vlastní zvukovou stopu — hudba hry po tu dobu mlčí. */
  setIntroMode(on: boolean): void {
    if (this.introMode === on) return
    this.introMode = on
    if (on) {
      for (const el of Object.values(this.tracks)) el?.pause()
      this.music = null
    } else if (this.unlocked) {
      this.setMusic(this.menuMode ? 'menu' : 'cruise')
    }
  }

  /**
   * Racci — občasný ambient nad klidnou hudbou (menu, plavba, napětí). V boji
   * a pod mluveným slovem mlčí, ať nepřekáží. Chybějící soubor se tiše ignoruje.
   */
  private startGulls(): void {
    if (this.gullTimer) return
    this.gullAt = performance.now() + GULL_FIRST_MS
    this.gullTimer = window.setInterval(() => this.maybeGulls(), 5000)
  }

  private maybeGulls(): void {
    if (this.muted || this.introMode || this.vo) return
    if (this.music === 'combat' || this.music === 'victory' || this.music === 'defeat') return
    const now = performance.now()
    if (now < this.gullAt) return
    this.gullAt = now + GULL_MIN_MS + Math.random() * (GULL_MAX_MS - GULL_MIN_MS)
    const file = GULL_FILES[Math.floor(Math.random() * GULL_FILES.length)]
    const el = new Audio(`audio/${file}.mp3`)
    el.volume = GULL_VOL
    el.addEventListener('error', () => { /* ambient chybí — nevadí */ })
    void el.play().catch(() => { /* autoplay/404 */ })
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
    // dabing dialogů (nezávisí na WebAudio kontextu — vlastní <audio> element).
    // Scénářové repliky hrají jednou za misi; bojové výkřiky (bark-*) se smí
    // opakovat s odstupem, ale nikdy nečekají ve frontě.
    for (const e of state.events) {
      if (!e.voiceId || (e.kind !== 'comm' && e.kind !== 'message')) continue
      this.speak(e.voiceId, e.voiceId.startsWith('bark-') ? { bark: true } : {})
    }
    if (!this.ctx || this.muted) return
    for (const e of state.events) {
      switch (e.kind) {
        case 'gunFire': if (this.can('gun')) this.boom(0.55, 0.18); break
        case 'ballHit': if (this.can('hit')) this.thud(); break
        case 'ballMiss': if (this.can('splash')) this.splash(); break
        case 'shipDestroyed': if (this.can('boom')) this.boom(0.9, 0.6); break
        case 'aground': if (this.can('aground')) this.thud(); break
        case 'subsystemHit': if (this.can('sub')) this.bell(); break
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
    const cached = this.tracks[state]
    if (cached) return cached
    const generic = `audio/music-${state}.mp3`
    // boj hraje stopu mise, je-li nějaká nastavená; ostatní stavy jsou společné
    const wanted = state === 'combat' && this.missionId ? `audio/mission-${this.missionId}.mp3` : generic
    const el = new Audio(wanted)
    el.loop = state !== 'victory' && state !== 'defeat'
    el.volume = 0
    el.preload = 'auto'
    el.addEventListener('error', () => {
      // stopa mise chybí (404) → spadni jednou na obecnou bojovou hudbu;
      // když chybí i ta, zůstane ticho a hra běží dál
      if (wanted === generic || el.src.endsWith(generic)) return
      el.src = generic
      if (this.music === state) void el.play().catch(() => { /* autoplay/404 */ })
    })
    this.tracks[state] = el
    return el
  }

  private setMusic(state: MusicState): void {
    if (this.introMode || this.music === state) return
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
    let last = performance.now()
    const loop = (): void => {
      const now = performance.now()
      // cíl se čte za běhu — ducking pod dabing tak umí smyčku přesměrovat
      const target = this.ducked ? MUSIC_DUCK_VOL : MUSIC_VOL
      const delta = ((now - last) / MUSIC_FADE_MS) * MUSIC_VOL
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
