/**
 * TacticalPlot — vektorová mapa moře (canvas 2D). Svět: metry, y nahoru.
 * Obrazovka: px, y dolů. Kamera sleduje vybranou loď + pan tažením, zoom
 * kolečkem. Kreslí vodu, vítr (proudnice + růžice), ostrovy, lodě, koule.
 */
import type { Ball, Contact, Island, ShipClassDef, ShipState, SimState, Vec2 } from '../sim/types'
import { SHIP_CLASSES } from '../data/defs'
import { windAt } from '../sim/wind'
import { offWindAngle, sailEfficiency } from '../sim/sail'
import { NO_GO_DEG } from '../sim/constants'
import { fromAngle } from '../sim/vec'
import { hitRadius } from '../sim/weapons'
import { hashNoise } from '../sim/rng'
import { SCENARIOS } from '../data/missions'

const ZOOM_MIN = 0.008 // px/m (hodně oddálené)
const ZOOM_MAX = 5.5   // px/m (těsně u lodí — jednotlivé koule a detaily)
const PICK_PX = 18

/** částice krátkodobého efektu ve světě (kouř, záblesk, šplouchnutí, tříska…) */
type PKind = 'smoke' | 'flash' | 'splash' | 'drop' | 'spark' | 'debris' | 'fire' | 'ring'
interface Particle {
  x: number; y: number       // světová pozice (počátek)
  vx: number; vy: number     // světový drift (m/s, animuje se reálným časem)
  born: number; life: number // ms
  kind: PKind
  r0: number; r1: number     // světový poloměr začátek→konec (m)
  col: string
}

const CLR = {
  own: '#4fd0e0', ownDim: '#2f8a96',
  enemy: '#e0603a', enemyDim: '#8a3a24',
  neutral: '#d8c24f', neutralDim: '#8a7a2a',
  land: '#3a3222', landEdge: '#5a4d33',
  reef: '#1c4a55', port: '#6a5a3a',
  ball: '#ffe08a', wind: '#3f7d8a', text: '#cfeef2',
  // moře — jasnější, sytější (ANNO): hloubka → tyrkys u břehu
  seaHi: '#34a0af', seaLo: '#175a6c',
  crest: '#a6ecec', sparkle: '#eafcff',
  shallow: '#3fb6b0', shallowIn: '#7fd8c8', foam: '#f2fbfb',
  sand: '#d8c48e',
  // pevnina — bujná zeleň, les, pole, skála
  grassHi: '#7a9850', grassLo: '#3c5526', forest: '#274b22', forestHi: '#3a6630',
  field: '#c2a850', rock: '#8f8778', rockHi: '#a9a294',
}

/** světový směr slunce (odkud svítí) pro konzistentní nasvícení scény */
const SUN = { x: -0.55, y: 0.83 } // od SZ (svět: y nahoru)

/** posun barvy: amt>0 zesvětlí k bílé, amt<0 ztmaví k černé */
function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16)
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
  if (amt >= 0) { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt }
  else { r *= 1 + amt; g *= 1 + amt; b *= 1 + amt }
  return `rgb(${r | 0},${g | 0},${b | 0})`
}

export class TacticalPlot {
  private ctx: CanvasRenderingContext2D
  private state: SimState | null = null
  private cam: Vec2 = { x: 0, y: 0 }
  private scale = 0.06
  private followId: number | null = null
  private panning = false
  private lastPan: Vec2 = { x: 0, y: 0 }
  private userPanned = false
  private raf = 0
  private lastT = 0
  compression = 1
  selectedId: number | null = null
  targetId: number | null = null
  private parts: Particle[] = []
  private wakes: Particle[] = []              // pěnová brázda (kreslí se pod loděmi)
  private wakeAt = new Map<number, number>()  // shipId → čas poslední pěny brázdy
  private shake = 0        // síla otřesu kamery (px), tlumí se
  private snapT = 0        // performance.now() posledního snapshotu
  private exSim = 0        // extrapolovaný sim-čas (s) od posledního snapshotu

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!
    this.resize()
    window.addEventListener('resize', () => this.resize())
    this.bindPan()
  }

  private resize(): void {
    const dpr = window.devicePixelRatio || 1
    this.canvas.width = this.canvas.clientWidth * dpr
    this.canvas.height = this.canvas.clientHeight * dpr
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  setState(state: SimState): void {
    this.state = state
    this.snapT = performance.now()
    if (this.followId === null) {
      const own = state.ships.find(s => s.side === 'player' && !s.destroyed)
      if (own) { this.followId = own.id; this.selectedId = own.id }
    }
    // z událostí snapshotu vytvoř krátkodobé efekty (záblesk/jiskra/výbuch).
    // Každý snapshot nese ČERSTVOU dávku (worker události po odeslání maže),
    // takže zpracuj vždy — i když se sim čas nezměnil (pauza, ruční palba).
    const now = performance.now()
    const wx = Math.cos(state.wind.dir) * state.wind.speed
    const wy = Math.sin(state.wind.dir) * state.wind.speed
    for (const e of state.events) {
      if (!e.pos) continue
      if (e.kind === 'gunFire') this.emitGunFire(e.pos, e.dir ?? 0, e.count ?? 6, wx, wy, now)
      else if (e.kind === 'ballMiss') this.emitSplash(e.pos, now)
      else if (e.kind === 'ballHit') this.emitHit(e.pos, now)
      else if (e.kind === 'shipDestroyed') this.emitBoom(e.pos, wx, wy, now)
    }
    if (this.parts.length > 900) this.parts.splice(0, this.parts.length - 900)
  }

  private push(p: Particle): void { this.parts.push(p) }

  /** Salva: záblesky u hlavní + valící se kouř ven z boku a po větru. */
  private emitGunFire(pos: Vec2, dir: number, count: number, wx: number, wy: number, now: number): void {
    const dx = Math.cos(dir), dy = Math.sin(dir), kx = -dy, ky = dx
    const guns = Math.min(count, 12)
    for (let i = 0; i < guns; i++) {
      const along = (guns > 1 ? i / (guns - 1) - 0.5 : 0)
      const ox = pos.x + kx * along * 26, oy = pos.y + ky * along * 26
      const out = 3 + Math.random() * 4
      if (i % 3 === 0) this.push({ x: ox + dx * 7, y: oy + dy * 7, vx: dx * 9, vy: dy * 9, born: now, life: 130, kind: 'flash', r0: 4, r1: 9, col: '#ffe6a0' })
      this.push({ x: ox + dx * 9, y: oy + dy * 9, vx: dx * out + wx * 0.3 + (Math.random() - 0.5) * 3, vy: dy * out + wy * 0.3 + (Math.random() - 0.5) * 3, born: now, life: 1400 + Math.random() * 600, kind: 'smoke', r0: 5, r1: 26, col: '#c9c4b6' })
    }
  }

  /** Šplouchnutí koule do vody: rozbíhavý prstenec + vystřikující kapky. */
  private emitSplash(pos: Vec2, now: number): void {
    this.push({ x: pos.x, y: pos.y, vx: 0, vy: 0, born: now, life: 520, kind: 'ring', r0: 1, r1: 15, col: '#cdeef0' })
    const n = 5 + Math.floor(Math.random() * 4)
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.283, sp = 4 + Math.random() * 8
      this.push({ x: pos.x, y: pos.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, born: now, life: 420, kind: 'drop', r0: 2.2, r1: 0.5, col: '#eafbfc' })
    }
  }

  /** Zásah trupu: jiskry + dřevěné třísky + obláček kouře. */
  private emitHit(pos: Vec2, now: number): void {
    const n = 6 + Math.floor(Math.random() * 5)
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.283, sp = 6 + Math.random() * 12, wood = Math.random() < 0.5
      this.push({ x: pos.x, y: pos.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, born: now, life: wood ? 700 : 300, kind: wood ? 'debris' : 'spark', r0: wood ? 2.5 : 1.8, r1: wood ? 1 : 0.5, col: wood ? '#5a4326' : '#ffc070' })
    }
    this.push({ x: pos.x, y: pos.y, vx: 0, vy: 0, born: now, life: 800, kind: 'smoke', r0: 3, r1: 14, col: '#b8b2a2' })
  }

  /** Potopení: ohnivé jádro, rázová vlna, spousta trosek a kouřový sloup. */
  private emitBoom(pos: Vec2, wx: number, wy: number, now: number): void {
    this.push({ x: pos.x, y: pos.y, vx: 0, vy: 0, born: now, life: 600, kind: 'ring', r0: 2, r1: 60, col: '#ffd68a' })
    for (let i = 0; i < 3; i++) this.push({ x: pos.x, y: pos.y, vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4, born: now, life: 500 + i * 120, kind: 'fire', r0: 8 - i * 2, r1: 24 + i * 8, col: '#c85028' })
    const nd = 16 + Math.floor(Math.random() * 10)
    for (let i = 0; i < nd; i++) {
      const a = Math.random() * 6.283, sp = 8 + Math.random() * 22
      this.push({ x: pos.x, y: pos.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, born: now, life: 900 + Math.random() * 500, kind: 'debris', r0: 2 + Math.random() * 2, r1: 0.5, col: Math.random() < 0.5 ? '#4a3620' : '#2a2018' })
    }
    for (let i = 0; i < 8; i++) this.push({ x: pos.x, y: pos.y, vx: wx * 0.4 + (Math.random() - 0.5) * 4, vy: wy * 0.4 + (Math.random() - 0.5) * 4 + 2, born: now, life: 1800 + Math.random() * 900, kind: 'smoke', r0: 6, r1: 40, col: '#8a8478' })
    const sp = this.w2s(pos), cw = this.canvas.clientWidth, ch = this.canvas.clientHeight
    if (sp.x > -60 && sp.x < cw + 60 && sp.y > -60 && sp.y < ch + 60) this.shake = Math.min(16, this.shake + 9)
  }

  start(): void {
    this.lastT = performance.now()
    const loop = (): void => { this.render(); this.raf = requestAnimationFrame(loop) }
    this.raf = requestAnimationFrame(loop)
  }
  stop(): void { cancelAnimationFrame(this.raf) }

  follow(id: number | null): void { this.followId = id; this.userPanned = false }

  /** Vizuální pozice: snapshot + extrapolace rychlostí (plynulý pohyb 60 fps). */
  private rpos(o: { pos: Vec2; vel: Vec2 }): Vec2 {
    return { x: o.pos.x + o.vel.x * this.exSim, y: o.pos.y + o.vel.y * this.exSim }
  }

  // ---------- souřadnice ----------
  private w2s(p: Vec2): Vec2 {
    const cw = this.canvas.clientWidth, ch = this.canvas.clientHeight
    return { x: cw / 2 + (p.x - this.cam.x) * this.scale, y: ch / 2 - (p.y - this.cam.y) * this.scale }
  }
  s2w(sx: number, sy: number): Vec2 {
    const cw = this.canvas.clientWidth, ch = this.canvas.clientHeight
    return { x: this.cam.x + (sx - cw / 2) / this.scale, y: this.cam.y - (sy - ch / 2) / this.scale }
  }

  // ---------- interakce ----------
  private armed = false

  private bindPan(): void {
    // kolečko / pinch = zoom (jemnější krok u pinch s ctrl/meta)
    this.canvas.addEventListener('wheel', e => {
      e.preventDefault()
      const step = (e.ctrlKey || e.metaKey) ? 1.08 : 1.15
      this.zoomStep(e.deltaY < 0 ? step : 1 / step)
    }, { passive: false })

    // TAŽENÍ (jakýmkoli tlačítkem/prstem) = posun mapy; TAP/KLIK bez pohybu
    // zůstává klikem (výběr/kurz řeší controller). Funguje i na touchpadu.
    this.canvas.addEventListener('pointerdown', e => {
      this.armed = true
      this.lastPan = { x: e.clientX, y: e.clientY }
    })
    window.addEventListener('pointermove', e => {
      if (!this.armed) return
      const dx = e.clientX - this.lastPan.x, dy = e.clientY - this.lastPan.y
      if (!this.panning && Math.hypot(dx, dy) < 5) return // ještě to může být klik
      this.panning = true; this.userPanned = true
      this.cam.x -= dx / this.scale
      this.cam.y += dy / this.scale
      this.lastPan = { x: e.clientX, y: e.clientY }
    })
    window.addEventListener('pointerup', () => { this.armed = false; this.panning = false })
    this.canvas.addEventListener('contextmenu', e => e.preventDefault())
  }

  // ---------- veřejné ovládání kamery (tlačítka / klávesy) ----------
  /** posun kamery o daný počet OBRAZOVKových pixelů (obsah se pohne opačně) */
  panByScreen(dxPx: number, dyPx: number): void {
    this.userPanned = true
    this.cam.x -= dxPx / this.scale
    this.cam.y += dyPx / this.scale
  }
  /** krok zoomu (>1 přiblíží, <1 oddálí) */
  zoomStep(factor: number): void {
    this.scale = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, this.scale * factor))
  }
  /** znovu zaměř kameru na sledovanou loď (zruší ruční posun) */
  recenter(): void {
    this.userPanned = false
    const f = this.state?.ships.find(s => s.id === this.followId)
    if (f) this.cam = { ...this.rpos(f) }
  }

  /** loď/kontakt nejblíž kliknutí (do PICK_PX), nebo null. */
  pick(sx: number, sy: number): number | null {
    if (!this.state) return null
    let best: number | null = null, bd = PICK_PX
    const consider = (id: number, p: Vec2): void => {
      const s = this.w2s(p)
      const d = Math.hypot(s.x - sx, s.y - sy)
      if (d < bd) { bd = d; best = id }
    }
    // hit-test na VYKRESLENÉ (extrapolované) pozici, ať klik sedí i při vysoké
    // kompresi/zoomu, kdy je loď mezi snapshoty posunutá dál než pick radius
    for (const sh of this.state.ships) {
      if (sh.destroyed) continue
      if (sh.side === 'player') consider(sh.id, this.rpos(sh))
    }
    for (const c of this.state.contacts.player) {
      const sh = this.state.ships.find(s => s.id === c.shipId)
      // paměťový kontakt se vybírá na poslední ZNÁMÉ pozici, ne na živé
      if (sh && !sh.destroyed) consider(c.shipId, c.memory ? c.pos : this.rpos(sh))
    }
    return best
  }

  // ---------- render ----------
  private render(): void {
    const ctx = this.ctx, st = this.state
    const cw = this.canvas.clientWidth, ch = this.canvas.clientHeight
    const now = performance.now()
    this.lastT = now
    if (!st) { ctx.clearRect(0, 0, cw, ch); return }

    // extrapolace sim-času od posledního snapshotu (plynulý pohyb 60 fps).
    // pozice = snapshot + vel × exSim; comp škáluje kompresi času, strop
    // brání přestřelení, když snapshoty na chvíli váznou
    this.exSim = Math.min((now - this.snapT) / 1000 * (this.compression || 0), 2.0)

    // kamera plynule sleduje (extrapolovanou) loď — měkký dojezd místo skoku
    if (this.followId !== null && !this.userPanned) {
      const f = st.ships.find(s => s.id === this.followId)
      if (f) {
        const tp = this.rpos(f)
        this.cam.x += (tp.x - this.cam.x) * 0.18
        this.cam.y += (tp.y - this.cam.y) * 0.18
      }
    }

    // otřes kamery při blízkém výbuchu — dočasný posun cam (px→svět), tlumí se.
    // Sea je fullscreen fill (posun nevytvoří okraj); posunou se jen vlny/lodě.
    const shk = this.shake
    const ox = shk ? (Math.random() - 0.5) * shk : 0
    const oy = shk ? (Math.random() - 0.5) * shk : 0
    if (shk) { this.cam.x += ox / this.scale; this.cam.y -= oy / this.scale }

    const t = now / 1000
    this.drawSea(st, t)
    this.drawWind(st)
    this.drawGrid()
    for (const isl of st.islands) this.drawIsland(isl, t)
    this.drawRanges(st)
    this.drawCourse(st)
    this.emitWakes(st, now)
    this.drawWakes()
    for (const b of st.balls) this.drawBall(b)
    for (const sh of st.ships) this.drawShip(st, sh)
    this.drawFx()
    if (shk) {
      this.cam.x -= ox / this.scale; this.cam.y += oy / this.scale
      this.shake *= 0.88; if (this.shake < 0.3) this.shake = 0
    }
    this.drawVignette(st)
    this.drawWindRose(st)
  }

  /**
   * Animované moře: hloubkový gradient + rozvlněný třpyt driftující po větru.
   * Čistě kosmetické (performance.now()), nezasahuje do deterministické simulace.
   * Vzorkuje se v obrazovkové mřížce, fáze vlny je ukotvená ve světě (správný
   * parallax při posunu mapy). Při velkém oddálení jen jemný třpyt.
   */
  private drawSea(st: SimState, t: number): void {
    const ctx = this.ctx, cw = this.canvas.clientWidth, ch = this.canvas.clientHeight
    // hloubkový gradient (diagonální podle slunce)
    const g = ctx.createLinearGradient(0, 0, cw * 0.4, ch)
    g.addColorStop(0, CLR.seaHi); g.addColorStop(1, CLR.seaLo)
    ctx.fillStyle = g
    ctx.fillRect(0, 0, cw, ch)
    // měkký sluneční třpyt (rozjasní hladinu, rozbije plochý gradient)
    const sg = ctx.createRadialGradient(cw * 0.32, ch * 0.26, 0, cw * 0.32, ch * 0.26, Math.max(cw, ch) * 0.6)
    sg.addColorStop(0, 'rgba(150,225,225,0.16)'); sg.addColorStop(1, 'rgba(150,225,225,0)')
    ctx.fillStyle = sg
    ctx.fillRect(0, 0, cw, ch)

    if (this.scale < 0.014) return // hodně oddálené → jen hladká voda
    const wd = fromAngle(st.wind.dir)
    // směr hřebene vlny na obrazovce (kolmo na vítr; svět y nahoru → obraz dolů)
    const winS = { x: wd.x, y: -wd.y }
    const crest = { x: -winS.y, y: winS.x }
    const freq = 0.028               // 1/m — vlnová délka ~220 m
    const speed = 1.7                // drift hřebenů po větru
    const detail = this.scale > 0.03 // blíž = víc detailu
    const step = detail ? 32 : 48
    const L = Math.max(3.5, Math.min(8, this.scale * 90)) // délka čeřiny (px)
    ctx.lineCap = 'round'
    for (let sx = (step / 2); sx < cw; sx += step) {
      for (let sy = (step / 2); sy < ch; sy += step) {
        const w = this.s2w(sx, sy)
        const proj = w.x * wd.x + w.y * wd.y
        const ph = hashNoise(Math.floor(w.x / 180), Math.floor(w.y / 180), 3) * 6.283
        const amp = Math.sin(proj * freq - t * speed + ph)
        if (amp <= 0.2) continue
        const b = (amp - 0.2) / 0.8
        ctx.globalAlpha = 0.06 + b * 0.17
        ctx.strokeStyle = CLR.crest
        ctx.lineWidth = 1 + b * 1.3
        ctx.beginPath()
        ctx.moveTo(sx - crest.x * L, sy - crest.y * L)
        ctx.lineTo(sx + crest.x * L, sy + crest.y * L)
        ctx.stroke()
        // pěnová čepička na nejvyšších hřebenech (roste se silou větru)
        if (detail && b > 0.72 && st.wind.speed > 6) {
          ctx.globalAlpha = (b - 0.72) / 0.28 * 0.5
          ctx.fillStyle = CLR.foam
          ctx.beginPath(); ctx.arc(sx, sy, Math.max(0.8, L * 0.28), 0, Math.PI * 2); ctx.fill()
        }
      }
    }
    // třpytivé odlesky (rychlejší, řidší)
    if (detail) {
      const s2 = 66
      for (let sx = 22; sx < cw; sx += s2) {
        for (let sy = 40; sy < ch; sy += s2) {
          const w = this.s2w(sx, sy)
          const tw = hashNoise(Math.floor(w.x / 90), Math.floor(w.y / 90), 9)
          const amp = Math.sin(t * 2.3 + tw * 6.283)
          if (amp < 0.86) continue
          ctx.globalAlpha = (amp - 0.86) / 0.14 * 0.5
          ctx.fillStyle = CLR.sparkle
          ctx.beginPath(); ctx.arc(sx, sy, 1.4, 0, Math.PI * 2); ctx.fill()
        }
      }
    }
    ctx.globalAlpha = 1
  }

  /** Viněta tónovaná do atmosféry mise (ambient) — mood na okrajích, střed jasný. */
  private drawVignette(st: SimState): void {
    const ctx = this.ctx, cw = this.canvas.clientWidth, ch = this.canvas.clientHeight
    const amb = SCENARIOS[st.scenarioId]?.ambient ?? '#0a2630'
    const n = parseInt(amb.slice(1), 16)
    const r = ((n >> 16) & 255) * 0.55 | 0, g2 = ((n >> 8) & 255) * 0.55 | 0, b = (n & 255) * 0.55 | 0
    const g = ctx.createRadialGradient(cw / 2, ch / 2, Math.min(cw, ch) * 0.46,
      cw / 2, ch / 2, Math.max(cw, ch) * 0.74)
    g.addColorStop(0, `rgba(${r},${g2},${b},0)`)
    g.addColorStop(1, `rgba(${r},${g2},${b},0.38)`)
    ctx.fillStyle = g
    ctx.fillRect(0, 0, cw, ch)
  }

  /** Kružnice dostřelu děl kolem vybrané vlastní lodi, cíle a pevností. */
  private drawRanges(st: SimState): void {
    const ctx = this.ctx
    const ring = (p: Vec2, r: number, col: string): void => {
      const s = this.w2s(p), rp = r * this.scale
      if (rp < 12) return
      ctx.strokeStyle = col; ctx.globalAlpha = 0.5; ctx.lineWidth = 1
      ctx.setLineDash([4, 6])
      ctx.beginPath(); ctx.arc(s.x, s.y, rp, 0, Math.PI * 2); ctx.stroke()
      ctx.setLineDash([]); ctx.globalAlpha = 1
    }
    // vlastní vybraná loď — skutečná třída a pozice (bez maskování)
    const sel = st.ships.find(s => s.id === this.selectedId && s.side === 'player' && !s.destroyed)
    if (sel) { const d = SHIP_CLASSES[sel.classId]; if (d) ring(this.rpos(sel), d.gunRange, CLR.own) }

    // cizí loď — přes senzorový kontakt: respektuj masku (classGuess), paměť
    // (poslední známá pos) a jen když je třída aspoň částečně identifikovaná
    const enemyRing = (id: number): void => {
      const sh = st.ships.find(s => s.id === id && !s.destroyed)
      if (!sh) return
      if (sh.side === 'player') { const d = SHIP_CLASSES[sh.classId]; if (d) ring(this.rpos(sh), d.gunRange, CLR.own); return }
      const con = st.contacts.player.find(c => c.shipId === id)
      if (!con || con.idQuality < 1) return
      const d = SHIP_CLASSES[con.classGuess ?? sh.classId]
      if (!d || d.gunRange <= 0) return
      ring(con.memory ? con.pos : this.rpos(sh), d.gunRange, CLR.enemy)
    }
    if (this.targetId !== null) enemyRing(this.targetId)
    // pobřežní pevnosti — dosah je pro hráče klíčový (jen identifikované)
    for (const sh of st.ships) {
      if (sh.destroyed || sh.id === this.targetId) continue
      if (SHIP_CLASSES[sh.classId]?.hullCode === 'FORT') enemyRing(sh.id)
    }
  }

  /** Vykreslení částic (kouř, záblesky, šplouchance, jiskry, trosky, výbuchy). */
  private drawFx(): void {
    const ctx = this.ctx, now = performance.now()
    this.parts = this.parts.filter(p => now - p.born < p.life)
    ctx.lineCap = 'round'
    for (const p of this.parts) {
      const age = (now - p.born) / p.life
      const ageS = (now - p.born) / 1000
      const s = this.w2s({ x: p.x + p.vx * ageS, y: p.y + p.vy * ageS })
      const r = Math.max(0.8, (p.r0 + (p.r1 - p.r0) * age) * this.scale)
      const a = 1 - age
      switch (p.kind) {
        case 'smoke':
          ctx.globalAlpha = a * 0.5; ctx.fillStyle = p.col
          ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, Math.PI * 2); ctx.fill(); break
        case 'fire': {
          // bloom halo (měkká záře) + ohnivé jádro
          const gl = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r * 2.4)
          gl.addColorStop(0, `rgba(255,180,90,${a * 0.5})`); gl.addColorStop(1, 'rgba(255,180,90,0)')
          ctx.globalAlpha = 1; ctx.fillStyle = gl
          ctx.beginPath(); ctx.arc(s.x, s.y, r * 2.4, 0, Math.PI * 2); ctx.fill()
          ctx.globalAlpha = a * 0.9; ctx.fillStyle = age < 0.5 ? '#ffd26a' : p.col
          ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, Math.PI * 2); ctx.fill(); break
        }
        case 'flash': {
          const gl = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r * 3)
          gl.addColorStop(0, `rgba(255,230,150,${a * 0.6})`); gl.addColorStop(1, 'rgba(255,230,150,0)')
          ctx.globalAlpha = 1; ctx.fillStyle = gl
          ctx.beginPath(); ctx.arc(s.x, s.y, r * 3, 0, Math.PI * 2); ctx.fill()
          ctx.globalAlpha = a; ctx.fillStyle = p.col
          ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, Math.PI * 2); ctx.fill()
          ctx.globalAlpha = a * 0.6; ctx.fillStyle = '#fff6d8'
          ctx.beginPath(); ctx.arc(s.x, s.y, r * 0.5, 0, Math.PI * 2); ctx.fill(); break
        }
        case 'splash': case 'drop': case 'spark':
          ctx.globalAlpha = a; ctx.fillStyle = p.col
          ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, Math.PI * 2); ctx.fill(); break
        case 'debris': {
          ctx.globalAlpha = a; ctx.fillStyle = p.col
          const d = Math.max(1, r); ctx.fillRect(s.x - d / 2, s.y - d / 2, d, d); break
        }
        case 'ring':
          ctx.globalAlpha = a * 0.7; ctx.strokeStyle = p.col; ctx.lineWidth = Math.max(1, 2.5 * a)
          ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, Math.PI * 2); ctx.stroke(); break
      }
    }
    ctx.globalAlpha = 1
  }

  /** Průběžné dropování pěny do brázdy za pohybujícími se (viditelnými) loděmi. */
  private emitWakes(st: SimState, now: number): void {
    if (this.scale < 0.03) return
    for (const sh of st.ships) {
      if (sh.destroyed || sh.surrendered) continue
      if (sh.side !== 'player' && !st.contacts.player.some(c => c.shipId === sh.id && !c.memory)) continue
      const spd = Math.hypot(sh.vel.x, sh.vel.y)
      if (spd < 1.5) continue
      if (now - (this.wakeAt.get(sh.id) ?? 0) < 95) continue
      this.wakeAt.set(sh.id, now)
      const p = this.rpos(sh), back = fromAngle(sh.heading)
      const perp = { x: -back.y, y: back.x }, hr = hitRadius(sh), beam = hr * 0.35
      for (const sgn of [-1, 1]) {
        this.wakes.push({
          x: p.x - back.x * hr * 0.7 + perp.x * sgn * beam,
          y: p.y - back.y * hr * 0.7 + perp.y * sgn * beam,
          vx: -back.x * 0.5 + perp.x * sgn * 0.6, vy: -back.y * 0.5 + perp.y * sgn * 0.6,
          born: now, life: 2200, kind: 'smoke', r0: hr * 0.18, r1: hr * 0.6, col: '#dff2f2',
        })
      }
    }
    if (this.wakes.length > 400) this.wakes.splice(0, this.wakes.length - 400)
  }

  /** Vykreslení pěnové brázdy (pod loděmi) — měkké bílé stopy, které slábnou. */
  private drawWakes(): void {
    const ctx = this.ctx, now = performance.now()
    this.wakes = this.wakes.filter(p => now - p.born < p.life)
    for (const p of this.wakes) {
      const age = (now - p.born) / p.life, ageS = (now - p.born) / 1000
      const s = this.w2s({ x: p.x + p.vx * ageS, y: p.y + p.vy * ageS })
      const r = Math.max(0.8, (p.r0 + (p.r1 - p.r0) * age) * this.scale)
      ctx.globalAlpha = (1 - age) * 0.33
      ctx.fillStyle = p.col
      ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, Math.PI * 2); ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  private drawGrid(): void {
    // mřížka jen v taktickém odstupu; při přiblížení čistá „ANNO" hladina
    if (this.scale > 0.05) return
    const ctx = this.ctx, cw = this.canvas.clientWidth, ch = this.canvas.clientHeight
    const stepM = 500
    const s = stepM * this.scale
    if (s < 24) return
    ctx.strokeStyle = '#14485a'; ctx.globalAlpha = 0.5; ctx.lineWidth = 1
    const tl = this.s2w(0, 0), br = this.s2w(cw, ch)
    const x0 = Math.floor(tl.x / stepM) * stepM, x1 = Math.ceil(br.x / stepM) * stepM
    const y0 = Math.floor(br.y / stepM) * stepM, y1 = Math.ceil(tl.y / stepM) * stepM
    ctx.beginPath()
    for (let x = x0; x <= x1; x += stepM) { const a = this.w2s({ x, y: y0 }), b = this.w2s({ x, y: y1 }); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y) }
    for (let y = y0; y <= y1; y += stepM) { const a = this.w2s({ x: x0, y }), b = this.w2s({ x: x1, y }); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y) }
    ctx.stroke(); ctx.globalAlpha = 1
  }

  private drawWind(st: SimState): void {
    // proudnice větru jen v taktickém odstupu; při přiblížení je voda čistá
    // (směr větru pořád ukazuje růžice nahoře) — kinematičtější „ANNO" pohled
    if (this.scale > 0.05) return
    const ctx = this.ctx, cw = this.canvas.clientWidth, ch = this.canvas.clientHeight
    const spacing = 90
    ctx.strokeStyle = CLR.wind; ctx.fillStyle = CLR.wind; ctx.lineWidth = 1.5
    ctx.globalAlpha = 0.28
    for (let sx = spacing / 2; sx < cw; sx += spacing) {
      for (let sy = spacing / 2; sy < ch; sy += spacing) {
        const w = windAt(st, this.s2w(sx, sy))
        const len = 8 + w.speed * 1.6
        const d = fromAngle(w.dir)
        const ax = sx - d.x * len / 2, ay = sy + d.y * len / 2
        const bx = sx + d.x * len / 2, by = sy - d.y * len / 2
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke()
        // hrot
        ctx.beginPath(); ctx.arc(bx, by, 1.6, 0, Math.PI * 2); ctx.fill()
      }
    }
    ctx.globalAlpha = 1
  }

  private drawIsland(isl: Island, t: number): void {
    const ctx = this.ctx
    if (isl.poly.length < 3) return
    const path = (): void => {
      ctx.beginPath()
      isl.poly.forEach((p, i) => { const s = this.w2s(p); i ? ctx.lineTo(s.x, s.y) : ctx.moveTo(s.x, s.y) })
      ctx.closePath()
    }
    // těžiště + průměrný poloměr (px) pro adaptivní efekty
    let cx = 0, cy = 0
    for (const p of isl.poly) { const s = this.w2s(p); cx += s.x; cy += s.y }
    cx /= isl.poly.length; cy /= isl.poly.length
    let rPx = 0
    for (const p of isl.poly) { const s = this.w2s(p); rPx += Math.hypot(s.x - cx, s.y - cy) }
    rPx /= isl.poly.length

    if (isl.kind === 'reef') {
      // mělčina/útes — prosvítající světlá voda + animovaná pěna na hřebeni
      path()
      ctx.fillStyle = CLR.reef; ctx.globalAlpha = 0.35; ctx.fill(); ctx.globalAlpha = 1
      const pulse = 0.45 + 0.3 * Math.sin(t * 1.6 + isl.poly.length)
      ctx.strokeStyle = CLR.foam; ctx.globalAlpha = pulse; ctx.lineWidth = 1.4
      ctx.setLineDash([5, 5]); ctx.lineDashOffset = -t * 12; path(); ctx.stroke()
      ctx.setLineDash([]); ctx.lineDashOffset = 0; ctx.globalAlpha = 1
      return
    }

    // inset polygon helper (zmenšený obrys k těžišti)
    const inset = (k: number): void => {
      ctx.beginPath()
      isl.poly.forEach((p, i) => {
        const s = this.w2s(p)
        const px = cx + (s.x - cx) * k, py = cy + (s.y - cy) * k
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)
      })
      ctx.closePath()
    }
    const rnd = (a: number, b: number): number => hashNoise(isl.poly.length + a, b, a * 3 + 1)

    // mělčina: dvoubarevný tyrkysový prstenec hugující pobřeží (tmavší venku,
    // světlejší u břehu) — jako v ANNO
    const rw = Math.max(3, Math.min(22, rPx * 0.34))
    ctx.lineJoin = 'round'
    for (const [wMul, a, c] of [[2.2, 0.05, CLR.shallow], [1.3, 0.09, CLR.shallow],
      [0.6, 0.16, CLR.shallowIn]] as [number, number, string][]) {
      ctx.strokeStyle = c; ctx.globalAlpha = a; ctx.lineWidth = rw * wMul; path(); ctx.stroke()
    }
    ctx.globalAlpha = 1

    // příbojová pěna na břehu (animovaná, driftuje)
    const foamPulse = 0.6 + 0.3 * Math.sin(t * 1.3 + isl.poly.length * 1.7)
    ctx.strokeStyle = CLR.foam; ctx.globalAlpha = foamPulse
    ctx.lineWidth = Math.max(1.6, Math.min(5, rPx * 0.06))
    ctx.setLineDash([7, 5]); ctx.lineDashOffset = -t * 9; path(); ctx.stroke()
    ctx.setLineDash([]); ctx.lineDashOffset = 0; ctx.globalAlpha = 1

    // pláž (písečný lem)
    ctx.fillStyle = CLR.sand; path(); ctx.fill()

    // ---- pevnina (clip na inset, aby pláž zůstala po obvodu) ----
    ctx.save(); inset(0.86); ctx.clip()
    const detail = this.scale > 0.02 && rPx > 24
    if (isl.kind === 'port') {
      // přístavní ostrov — travnatý s městskou zástavbou
      ctx.fillStyle = CLR.grassLo; inset(0.86); ctx.fill()
    } else {
      // travnatý gradient nasvícený sluncem
      const sunS = { x: SUN.x, y: -SUN.y }
      const gr = ctx.createLinearGradient(cx - sunS.x * rPx, cy - sunS.y * rPx, cx + sunS.x * rPx, cy + sunS.y * rPx)
      gr.addColorStop(0, CLR.grassHi); gr.addColorStop(1, CLR.grassLo)
      ctx.fillStyle = gr; inset(0.86); ctx.fill()
    }

    if (detail) {
      // kopcové nasvícení — světlejší travnatý vrchol posunutý ke slunci (relief)
      const sunS = { x: SUN.x, y: -SUN.y }
      const hx = cx - sunS.x * rPx * 0.3, hy = cy - sunS.y * rPx * 0.3
      const hg = ctx.createRadialGradient(hx, hy, 0, hx, hy, rPx * 0.9)
      hg.addColorStop(0, 'rgba(170,200,120,0.45)'); hg.addColorStop(1, 'rgba(170,200,120,0)')
      ctx.fillStyle = hg; inset(0.86); ctx.fill()
      // pole (zlaté záhony) — pár plátů na sluneční straně
      const nF = rPx > 46 ? 2 : rPx > 30 ? 1 : 0
      for (let f = 0; f < nF; f++) {
        const ang = rnd(f + 7, 2) * 6.283
        const rad = (0.15 + rnd(f + 7, 3) * 0.3) * rPx
        const fx = cx + Math.cos(ang) * rad, fy = cy + Math.sin(ang) * rad
        const fw = rPx * (0.24 + rnd(f, 4) * 0.14), fh = rPx * (0.16 + rnd(f, 5) * 0.1)
        ctx.save(); ctx.translate(fx, fy); ctx.rotate(rnd(f, 6) * 3.14)
        ctx.fillStyle = CLR.field
        ctx.beginPath(); ctx.ellipse(0, 0, fw, fh, 0, 0, Math.PI * 2); ctx.fill()
        ctx.strokeStyle = 'rgba(150,120,50,0.4)'; ctx.lineWidth = 1
        for (let l = -2; l <= 2; l++) { ctx.beginPath(); ctx.moveTo(-fw, l * fh * 0.3); ctx.lineTo(fw, l * fh * 0.3); ctx.stroke() }
        ctx.restore()
      }
      // lesy (shluky korun) — nepravidelné tmavě zelené chuchvalce se světlem
      const nC = Math.max(2, Math.min(7, Math.floor(rPx / 20)))
      for (let c = 0; c < nC; c++) {
        const ang = rnd(c, 1) * 6.283
        const rad = Math.sqrt(rnd(c, 2)) * rPx * 0.62
        const gxc = cx + Math.cos(ang) * rad, gyc = cy + Math.sin(ang) * rad
        const blobs = 5 + Math.floor(rnd(c, 3) * 5)
        const cr = rPx * (0.09 + rnd(c, 4) * 0.05)
        for (let k = 0; k < blobs; k++) {
          const ba = rnd(c * 9 + k, 7) * 6.283, brad = rnd(c * 9 + k, 8) * cr * 1.6
          const bx = gxc + Math.cos(ba) * brad, by = gyc + Math.sin(ba) * brad
          ctx.fillStyle = CLR.forest
          ctx.beginPath(); ctx.arc(bx, by, cr, 0, Math.PI * 2); ctx.fill()
          ctx.fillStyle = CLR.forestHi
          ctx.beginPath(); ctx.arc(bx - cr * 0.3, by - cr * 0.3, cr * 0.5, 0, Math.PI * 2); ctx.fill()
        }
      }
      // skalnaté pobřeží — kamenný lem po obvodu + kameny na sluneční straně
      ctx.strokeStyle = CLR.rock; ctx.globalAlpha = 0.55
      ctx.lineWidth = Math.max(1.5, rPx * 0.07); inset(0.9); ctx.stroke(); ctx.globalAlpha = 1
      const nR = Math.min(20, Math.floor(rPx * 0.4))
      for (let i = 0; i < nR; i++) {
        const ang = rnd(i + 3, 9) * 6.283
        const px = cx + Math.cos(ang) * rPx * 0.88, py = cy + Math.sin(ang) * rPx * 0.88
        ctx.fillStyle = i % 2 ? CLR.rockHi : CLR.rock
        ctx.globalAlpha = 0.6
        ctx.beginPath(); ctx.arc(px, py, Math.max(0.8, rPx * 0.04), 0, Math.PI * 2); ctx.fill()
      }
      ctx.globalAlpha = 1
    }
    ctx.restore()

    // obrys pobřeží
    ctx.strokeStyle = '#2a3a20'; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.6; path(); ctx.stroke(); ctx.globalAlpha = 1

    if (isl.name && this.scale > 0.02) {
      ctx.fillStyle = '#d8c9a0'; ctx.font = '11px monospace'
      ctx.globalAlpha = 0.85
      ctx.fillText(isl.name, cx - ctx.measureText(isl.name).width / 2, cy)
      ctx.globalAlpha = 1
    }
  }

  private colorFor(side: string, dim = false): string {
    if (side === 'player') return dim ? CLR.ownDim : CLR.own
    if (side === 'enemy') return dim ? CLR.enemyDim : CLR.enemy
    return dim ? CLR.neutralDim : CLR.neutral
  }

  private drawShip(st: SimState, sh: ShipState): void {
    const ctx = this.ctx
    const def = SHIP_CLASSES[sh.classId]
    // nepřátele/neutrály kreslíme jen když je hráč vidí (kontakt), jinak ne
    const isPlayer = sh.side === 'player'
    const con = st.contacts.player.find(c => c.shipId === sh.id)
    if (!isPlayer && !con) return

    // paměťový kontakt (mimo dohled, např. za ostrovem): kresli GHOST na
    // poslední známé pozici, ne loď v reálném čase
    if (!isPlayer && con?.memory) {
      const gs = this.w2s(con.pos)
      ctx.strokeStyle = this.colorFor(sh.side, true); ctx.setLineDash([3, 3]); ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.arc(gs.x, gs.y, 9, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([])
      if (this.scale > 0.015) {
        ctx.fillStyle = this.colorFor(sh.side, true); ctx.font = '11px monospace'
        const nm = con.idQuality >= 1 ? sh.name : 'ztracený kontakt'
        ctx.fillText(`${nm} (?)`, gs.x + 12, gs.y)
      }
      return
    }
    const s = this.w2s(this.rpos(sh))
    const r = hitRadius(sh)
    const lenPx = Math.max(7, r * this.scale * 2.2)
    const wPx = Math.max(3, lenPx * 0.42)
    const col = this.colorFor(sh.side, sh.destroyed || sh.surrendered)
    const t = performance.now() / 1000
    // dělové porty odvoď z MASKOVANÉ třídy (classGuess), ne skutečné — jinak
    // by zamaskovaná Q-loď prozradila výzbroj (počet portů) před identifikací
    const visDef = isPlayer ? def : (SHIP_CLASSES[con?.classGuess ?? sh.classId] ?? def)
    const gunPorts = visDef?.gunsPerBroadside ?? 0

    if (def?.hullCode === 'FORT') this.drawFort(s, lenPx, col, sh, t)
    else if (sh.destroyed) this.drawWreck(s, lenPx, t)
    else this.drawVessel(st, sh, def, s, lenPx, wPx, col, t, gunPorts)

    // výběrový/cílový prstenec
    if (!sh.destroyed && sh.id === this.selectedId) { ctx.strokeStyle = CLR.own; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(s.x, s.y, lenPx + 6, 0, Math.PI * 2); ctx.stroke() }
    if (!sh.destroyed && sh.id === this.targetId) { ctx.strokeStyle = CLR.enemy; ctx.lineWidth = 2; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.arc(s.x, s.y, lenPx + 9, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]) }

    // jméno (u vlastních vždy, u ostatních dle identifikace)
    const showName = !sh.destroyed && (sh.side === 'player' || (con && con.idQuality >= 1) || sh.side === 'neutral')
    if (showName && this.scale > 0.015) {
      ctx.fillStyle = this.colorFor(sh.side)
      ctx.font = '11px monospace'
      const label = sh.surrendered ? `${sh.name} (vlajka dole)` : sh.name
      ctx.fillText(label, s.x + lenPx + 8, s.y - 4)
      if (def && (con?.idQuality === 2 || sh.side === 'player')) {
        ctx.fillStyle = '#7f97a0'
        ctx.fillText(def.name, s.x + lenPx + 8, s.y + 8)
      }
    }
  }

  /** Obrys trupu (příď +x, záď -x) v lokálním rámci; len a poloviční šířka hb. */
  private hullPath(len: number, hb: number): void {
    const ctx = this.ctx
    ctx.beginPath()
    ctx.moveTo(len * 0.95, 0)
    ctx.quadraticCurveTo(len * 0.62, hb, len * 0.12, hb)
    ctx.lineTo(-len * 0.55, hb * 0.9)
    ctx.quadraticCurveTo(-len * 0.72, hb * 0.5, -len * 0.72, 0)
    ctx.quadraticCurveTo(-len * 0.72, -hb * 0.5, -len * 0.55, -hb * 0.9)
    ctx.lineTo(len * 0.12, -hb)
    ctx.quadraticCurveTo(len * 0.62, -hb, len * 0.95, 0)
    ctx.closePath()
  }

  /** Procedurální 2.5D loď: stín, brázda, stínovaný trup, nafouklé plachty, vlajka. */
  private drawVessel(st: SimState, sh: ShipState, def: ShipClassDef | undefined,
    s: Vec2, lenPx: number, wPx: number, col: string, t: number, gunPorts: number): void {
    const ctx = this.ctx
    const ph = sh.id * 1.7
    const hb = wPx * 0.5
    const spd = Math.hypot(sh.vel.x, sh.vel.y)
    const surr = sh.surrendered
    const moving = spd > 0.4 && !surr

    // vržený stín na hladinu (obrazovkový rámec) — dodá výšku
    ctx.save()
    ctx.globalAlpha = 0.26; ctx.fillStyle = '#03121a'
    ctx.beginPath()
    ctx.ellipse(s.x + lenPx * 0.14, s.y + lenPx * 0.2, lenPx * 0.82, hb * 1.7, -sh.heading, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    ctx.save()
    ctx.translate(s.x, s.y)
    ctx.rotate(-sh.heading)

    // brázda za lodí (kýlová voda) — v lokálním rámci, míří na záď (-x)
    if (moving && lenPx > 9) {
      const wl = lenPx * (1.3 + Math.min(2.4, spd * 0.3))
      const g = ctx.createLinearGradient(-lenPx * 0.7, 0, -lenPx * 0.7 - wl, 0)
      g.addColorStop(0, 'rgba(228,244,246,0.42)'); g.addColorStop(1, 'rgba(228,244,246,0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.moveTo(-lenPx * 0.6, -hb * 0.9)
      ctx.lineTo(-lenPx * 0.7 - wl, -hb * 3)
      ctx.lineTo(-lenPx * 0.7 - wl, hb * 3)
      ctx.lineTo(-lenPx * 0.6, hb * 0.9)
      ctx.closePath(); ctx.fill()
    }

    // houpání (roll) — jemné zúžení boku podle času
    const roll = 1 + 0.07 * Math.sin(t * 2.2 + ph)
    ctx.scale(1, roll)

    // příďová pěna
    if (moving && lenPx > 9) {
      ctx.strokeStyle = 'rgba(233,247,248,0.7)'; ctx.lineWidth = Math.max(1, lenPx * 0.07)
      ctx.beginPath(); ctx.arc(lenPx * 0.85, 0, hb * 1.5, Math.PI * 0.62, Math.PI * 1.38); ctx.stroke()
    }

    ctx.globalAlpha = surr ? 0.72 : 1
    // vodoryska (tmavší, o něco širší)
    ctx.fillStyle = shade(col, -0.45); this.hullPath(lenPx * 1.02, hb * 1.12); ctx.fill()
    // hlavní trup
    ctx.fillStyle = col; this.hullPath(lenPx, hb); ctx.fill()
    // paluba (světlejší, užší)
    ctx.fillStyle = shade(col, 0.3); this.hullPath(lenPx * 0.78, hb * 0.5); ctx.fill()
    // dřevěná paluba: podélná prkna + záďová kajuta
    if (lenPx > 18) {
      ctx.strokeStyle = shade(col, 0.14); ctx.lineWidth = Math.max(0.4, lenPx * 0.02)
      for (const fy of [-0.28, 0.28]) {
        ctx.beginPath(); ctx.moveTo(lenPx * 0.66, hb * fy); ctx.lineTo(-lenPx * 0.5, hb * fy); ctx.stroke()
      }
      ctx.fillStyle = shade(col, -0.28)
      ctx.beginPath(); ctx.ellipse(-lenPx * 0.48, 0, lenPx * 0.13, hb * 0.4, 0, 0, Math.PI * 2); ctx.fill()
    }
    // středový prkenný pás
    ctx.strokeStyle = shade(col, -0.3); ctx.lineWidth = Math.max(0.6, lenPx * 0.04)
    ctx.beginPath(); ctx.moveTo(lenPx * 0.82, 0); ctx.lineTo(-lenPx * 0.66, 0); ctx.stroke()
    // dělové porty (počet dle MASKOVANÉ třídy — viz gunPorts)
    if (lenPx > 16 && gunPorts > 0) {
      const gpb = Math.min(6, gunPorts)
      ctx.fillStyle = shade(col, -0.55)
      for (let i = 0; i < gpb; i++) {
        const gx = lenPx * 0.42 - (gpb === 1 ? 0 : (i / (gpb - 1)) * lenPx * 0.95)
        for (const sgn of [-1, 1]) {
          ctx.beginPath(); ctx.arc(gx, sgn * hb * 0.95, Math.max(0.7, lenPx * 0.045), 0, Math.PI * 2); ctx.fill()
        }
      }
    }
    // obrys trupu
    ctx.strokeStyle = shade(col, -0.5); ctx.lineWidth = Math.max(0.7, lenPx * 0.05)
    this.hullPath(lenPx, hb); ctx.stroke()
    // sluncem nasvícený okraj (rim light) — světlý obrys posunutý ke slunci
    const ssx = SUN.x, ssy = -SUN.y
    const lsx = Math.cos(sh.heading) * ssx - Math.sin(sh.heading) * ssy
    const lsy = Math.sin(sh.heading) * ssx + Math.cos(sh.heading) * ssy
    const rim = Math.max(0.5, lenPx * 0.045)
    ctx.save(); ctx.translate(lsx * rim, lsy * rim)
    ctx.strokeStyle = 'rgba(255,244,208,0.5)'; ctx.lineWidth = Math.max(0.5, lenPx * 0.035)
    this.hullPath(lenPx * 0.98, hb * 0.98); ctx.stroke(); ctx.restore()

    // stěžně + plachty
    const delta = st.wind.dir - sh.heading
    const eff = sailEfficiency(offWindAngle(sh.heading, st.wind))
    const nMast = lenPx >= 26 ? 3 : lenPx >= 15 ? 2 : 1
    const sailUp = sh.sailsUp && !surr
    const full = (0.3 + 0.7 * eff) * (0.35 + 0.65 * sh.trim)
    const bl = hb * (1.1 + 2.2 * full)
    const belly = { x: Math.cos(delta) * bl, y: -Math.sin(delta) * bl }
    const yh = hb * 1.7
    for (let m = 0; m < nMast; m++) {
      const mx = nMast === 1 ? lenPx * 0.05 : lenPx * 0.45 - (m / (nMast - 1)) * lenPx * 0.95
      if (!sailUp || lenPx < 9) {
        ctx.strokeStyle = '#d9c9a6'; ctx.lineWidth = Math.max(0.8, lenPx * 0.06)
        ctx.beginPath(); ctx.moveTo(mx, -yh * 0.8); ctx.lineTo(mx, yh * 0.8); ctx.stroke()
      } else {
        // plachta jako nafouklá čočka bulící po větru (k závětří)
        ctx.beginPath()
        ctx.moveTo(mx, -yh)
        ctx.quadraticCurveTo(mx + belly.x, belly.y, mx, yh)
        ctx.quadraticCurveTo(mx + belly.x * 0.12, belly.y * 0.12, mx, -yh)
        ctx.closePath()
        ctx.fillStyle = 'rgba(244,247,244,0.96)'; ctx.fill()
        ctx.fillStyle = 'rgba(84,104,116,0.22)'
        ctx.beginPath()
        ctx.moveTo(mx, -yh)
        ctx.quadraticCurveTo(mx + belly.x, belly.y, mx, yh)
        ctx.quadraticCurveTo(mx + belly.x * 0.55, belly.y * 0.55, mx, -yh)
        ctx.closePath(); ctx.fill()
        ctx.strokeStyle = 'rgba(150,165,165,0.9)'; ctx.lineWidth = Math.max(0.5, lenPx * 0.028)
        ctx.beginPath(); ctx.moveTo(mx, -yh); ctx.quadraticCurveTo(mx + belly.x, belly.y, mx, yh); ctx.stroke()
      }
      // stěžeň
      ctx.fillStyle = '#2a1f14'; ctx.beginPath(); ctx.arc(mx, 0, Math.max(0.8, lenPx * 0.055), 0, Math.PI * 2); ctx.fill()
    }

    // čnělka (bowsprit) + přední trojúhelníková plachta (kosatka)
    if (lenPx > 14) {
      const foreMx = nMast === 1 ? lenPx * 0.05 : lenPx * 0.45
      const tip = lenPx * 1.06
      ctx.strokeStyle = '#2a1f14'; ctx.lineWidth = Math.max(0.6, lenPx * 0.05)
      ctx.beginPath(); ctx.moveTo(lenPx * 0.88, 0); ctx.lineTo(tip, 0); ctx.stroke()
      if (sailUp) {
        const side = -Math.sin(delta) >= 0 ? 1 : -1  // závětrná strana
        ctx.beginPath()
        ctx.moveTo(tip, 0)
        ctx.quadraticCurveTo((tip + foreMx) / 2, side * hb * (0.4 + full * 0.8), foreMx, side * hb * 0.15)
        ctx.lineTo(foreMx, -side * hb * 0.15)
        ctx.closePath()
        ctx.fillStyle = 'rgba(240,244,242,0.92)'; ctx.fill()
        ctx.strokeStyle = 'rgba(150,165,165,0.85)'; ctx.lineWidth = Math.max(0.5, lenPx * 0.025); ctx.stroke()
      }
    }

    // záďová vlajka (vlaje časem, barva strany)
    if (lenPx > 10) {
      const fx = -lenPx * 0.62, wv = Math.sin(t * 7 + ph)
      ctx.fillStyle = surr ? '#eef4f4' : col
      ctx.beginPath()
      ctx.moveTo(fx, 0)
      ctx.lineTo(fx, -hb * 1.3)
      ctx.lineTo(fx - lenPx * 0.32, -hb * 1.3 + wv * hb * 0.5)
      ctx.closePath(); ctx.fill()
      // emblém na vlajce (světlá tečka)
      if (!surr && lenPx > 16) {
        ctx.fillStyle = shade(col, 0.6)
        ctx.beginPath(); ctx.arc(fx - lenPx * 0.12, -hb * 1.02, Math.max(0.6, hb * 0.2), 0, Math.PI * 2); ctx.fill()
      }
    }
    ctx.globalAlpha = 1
    ctx.restore()

    // kouř z poškození (obrazovkový rámec, unáší po větru) — jen zblízka
    const hp = def?.hullPoints ?? 100
    const frac = sh.hull / hp
    if (frac < 0.55 && lenPx > 9) {
      const wd = fromAngle(st.wind.dir)
      const n = frac < 0.28 ? 3 : 1
      for (let i = 0; i < n; i++) {
        const drift = ((t * 0.5 + i * 0.33 + ph) % 1)
        const px = s.x + wd.x * drift * lenPx * 2.4
        const py = s.y - wd.y * drift * lenPx * 2.4 - drift * lenPx * 0.6
        ctx.globalAlpha = (1 - drift) * 0.32
        ctx.fillStyle = '#5a5550'
        ctx.beginPath(); ctx.arc(px, py, lenPx * (0.25 + drift * 0.5), 0, Math.PI * 2); ctx.fill()
      }
      ctx.globalAlpha = 1
    }
  }

  /** Pobřežní pevnost/baštu — kamenný bastion s cimbuřím a vlajkou. */
  private drawFort(s: Vec2, lenPx: number, col: string, sh: ShipState, t: number): void {
    const ctx = this.ctx
    const R = Math.max(9, lenPx * 0.7)
    const hexPath = (rad: number): void => {
      ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + Math.PI / 6
        const px = s.x + Math.cos(a) * rad, py = s.y + Math.sin(a) * rad
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)
      }
      ctx.closePath()
    }
    // stín
    ctx.globalAlpha = 0.3; ctx.fillStyle = '#03121a'
    ctx.beginPath(); ctx.ellipse(s.x + R * 0.2, s.y + R * 0.24, R, R * 0.9, 0, 0, Math.PI * 2); ctx.fill()
    ctx.globalAlpha = 1
    // kamenná zeď
    ctx.fillStyle = '#6f6a62'; hexPath(R); ctx.fill()
    ctx.strokeStyle = '#43403a'; ctx.lineWidth = 2; hexPath(R); ctx.stroke()
    // nasvícené nádvoří
    ctx.fillStyle = '#89837a'; hexPath(R * 0.62); ctx.fill()
    // cimbuří — kostky po obvodu
    ctx.fillStyle = '#5a564f'
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6
      const px = s.x + Math.cos(a) * R, py = s.y + Math.sin(a) * R
      ctx.fillRect(px - R * 0.1, py - R * 0.1, R * 0.2, R * 0.2)
    }
    // vlajka strany uprostřed
    const wv = Math.sin(t * 6 + sh.id)
    ctx.strokeStyle = '#2a1f14'; ctx.lineWidth = Math.max(1, R * 0.08)
    ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x, s.y - R * 0.8); ctx.stroke()
    ctx.fillStyle = col
    ctx.beginPath()
    ctx.moveTo(s.x, s.y - R * 0.8)
    ctx.lineTo(s.x + R * 0.5, s.y - R * 0.66 + wv * R * 0.08)
    ctx.lineTo(s.x, s.y - R * 0.5)
    ctx.closePath(); ctx.fill()
  }

  /** Vrak potopené lodi — tmavé trosky, mizí (boom efekt řeší výbuch zvlášť). */
  private drawWreck(s: Vec2, lenPx: number, t: number): void {
    const ctx = this.ctx
    ctx.globalAlpha = 0.5
    ctx.fillStyle = '#2a2620'
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + t * 0.2
      const px = s.x + Math.cos(a) * lenPx * 0.5, py = s.y + Math.sin(a) * lenPx * 0.35
      ctx.beginPath(); ctx.arc(px, py, Math.max(1.2, lenPx * 0.12), 0, Math.PI * 2); ctx.fill()
    }
    // rozlévající se skvrna
    ctx.globalAlpha = 0.18; ctx.fillStyle = '#1a1712'
    ctx.beginPath(); ctx.arc(s.x, s.y, lenPx * 0.7, 0, Math.PI * 2); ctx.fill()
    ctx.globalAlpha = 1
  }

  private drawBall(b: Ball): void {
    const ctx = this.ctx
    const s = this.w2s(this.rpos(b))
    const col = b.shot === 'chain' ? '#c8d8e0' : b.shot === 'grape' ? '#e0a060' : CLR.ball
    // tracer podél rychlosti — při přiblížení dlouhý (vidíš dráhu každé koule),
    // z výšky splyne do drobné tečky (salva). y: svět nahoru → obrazovka dolů.
    const tS = 0.09
    const tx = s.x - b.vel.x * tS * this.scale
    const ty = s.y + b.vel.y * tS * this.scale
    ctx.strokeStyle = col; ctx.globalAlpha = 0.55; ctx.lineWidth = Math.max(1, this.scale * 1.4)
    ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(s.x, s.y); ctx.stroke(); ctx.globalAlpha = 1
    const r = Math.max(1.4, Math.min(5, this.scale * 3))
    ctx.fillStyle = col
    ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, Math.PI * 2); ctx.fill()
  }

  private drawCourse(st: SimState): void {
    const ctx = this.ctx
    const sel = st.ships.find(s => s.id === this.selectedId && s.side === 'player' && !s.destroyed)
    if (!sel || !sel.nav) return
    let dest: Vec2 | null = null
    if (sel.nav.kind === 'course') {
      dest = sel.nav.dest
    } else if (sel.nav.kind === 'intercept') {
      const t = st.ships.find(s => s.id === (sel.nav as { targetId: number }).targetId)
      if (t) dest = t.pos
    }
    if (!dest) return
    const a = this.w2s(this.rpos(sel)), b = this.w2s(dest)
    ctx.strokeStyle = '#3aa0b0'; ctx.setLineDash([6, 6]); ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.setLineDash([])
    ctx.fillStyle = '#3aa0b0'; ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, Math.PI * 2); ctx.fill()
  }

  /** Kompasová růžice: směr větru + no-go zóna vůči přídi vybrané lodi. */
  private drawWindRose(st: SimState): void {
    const ctx = this.ctx
    // horní střed — mimo boční HUD panely (dřív schovaná pod pravým panelem)
    const cx = this.canvas.clientWidth / 2, cy = 74, R = 42
    ctx.save()
    ctx.globalAlpha = 0.92
    ctx.fillStyle = '#07222b'; ctx.strokeStyle = '#1c4a55'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill(); ctx.stroke()

    const sel = st.ships.find(s => s.id === this.selectedId)
    const windFrom = st.wind.dir + Math.PI
    // no-go zóna (klín kolem směru, ODKUD vane vítr) — kreslíme dvěma paprsky
    const nogo = (NO_GO_DEG * Math.PI) / 180
    const ray = (ang: number): void => {
      const d = fromAngle(ang)
      ctx.lineTo(cx + d.x * R, cy - d.y * R)
    }
    ctx.fillStyle = 'rgba(224,96,58,0.22)'
    ctx.beginPath(); ctx.moveTo(cx, cy)
    ray(windFrom - nogo); ray(windFrom); ray(windFrom + nogo)
    ctx.closePath(); ctx.fill()

    // šipka větru (kam vane)
    const wd = fromAngle(st.wind.dir)
    ctx.strokeStyle = CLR.wind; ctx.lineWidth = 3
    ctx.beginPath(); ctx.moveTo(cx - wd.x * R * 0.7, cy + wd.y * R * 0.7); ctx.lineTo(cx + wd.x * R * 0.7, cy - wd.y * R * 0.7); ctx.stroke()
    ctx.fillStyle = CLR.wind; ctx.beginPath(); ctx.arc(cx + wd.x * R * 0.7, cy - wd.y * R * 0.7, 3.5, 0, Math.PI * 2); ctx.fill()

    // příď vybrané lodi + bod plavby
    if (sel) {
      const hd = fromAngle(sel.heading)
      const off = offWindAngle(sel.heading, st.wind)
      const eff = sailEfficiency(off)
      ctx.strokeStyle = eff <= 0.05 ? CLR.enemy : eff > 0.85 ? CLR.own : CLR.neutral
      ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + hd.x * R * 0.85, cy - hd.y * R * 0.85); ctx.stroke()
      ctx.fillStyle = CLR.text; ctx.font = '10px monospace'
      ctx.fillText(`${Math.round(st.wind.speed * 1.94)} kn`, cx - 18, cy + R + 14)
    }
    ctx.restore()
  }
}
