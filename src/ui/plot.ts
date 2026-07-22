/**
 * TacticalPlot — vektorová mapa moře (canvas 2D). Svět: metry, y nahoru.
 * Obrazovka: px, y dolů. Kamera sleduje vybranou loď + pan tažením, zoom
 * kolečkem. Kreslí vodu, vítr (proudnice + růžice), ostrovy, lodě, koule.
 */
import type { Ball, Contact, Island, ShipState, SimState, Vec2 } from '../sim/types'
import { SHIP_CLASSES } from '../data/defs'
import { windAt } from '../sim/wind'
import { offWindAngle, sailEfficiency } from '../sim/sail'
import { NO_GO_DEG } from '../sim/constants'
import { fromAngle } from '../sim/vec'
import { hitRadius } from '../sim/weapons'

const ZOOM_MIN = 0.008 // px/m (hodně oddálené)
const ZOOM_MAX = 0.6
const PICK_PX = 18

const CLR = {
  own: '#4fd0e0', ownDim: '#2f8a96',
  enemy: '#e0603a', enemyDim: '#8a3a24',
  neutral: '#d8c24f', neutralDim: '#8a7a2a',
  land: '#3a3222', landEdge: '#5a4d33',
  reef: '#1c4a55', port: '#6a5a3a',
  ball: '#ffe08a', wind: '#3f7d8a', text: '#cfeef2',
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
    if (this.followId === null) {
      const own = state.ships.find(s => s.side === 'player' && !s.destroyed)
      if (own) { this.followId = own.id; this.selectedId = own.id }
    }
  }

  start(): void {
    this.lastT = performance.now()
    const loop = (): void => { this.render(); this.raf = requestAnimationFrame(loop) }
    this.raf = requestAnimationFrame(loop)
  }
  stop(): void { cancelAnimationFrame(this.raf) }

  follow(id: number | null): void { this.followId = id; this.userPanned = false }

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
  private bindPan(): void {
    this.canvas.addEventListener('wheel', e => {
      e.preventDefault()
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15
      this.scale = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, this.scale * factor))
    }, { passive: false })
    this.canvas.addEventListener('pointerdown', e => {
      if (e.button === 2 || e.shiftKey) {
        this.panning = true; this.userPanned = true
        this.lastPan = { x: e.clientX, y: e.clientY }
      }
    })
    window.addEventListener('pointermove', e => {
      if (!this.panning) return
      this.cam.x -= (e.clientX - this.lastPan.x) / this.scale
      this.cam.y += (e.clientY - this.lastPan.y) / this.scale
      this.lastPan = { x: e.clientX, y: e.clientY }
    })
    window.addEventListener('pointerup', () => { this.panning = false })
    this.canvas.addEventListener('contextmenu', e => e.preventDefault())
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
    for (const sh of this.state.ships) {
      if (sh.destroyed) continue
      if (sh.side === 'player') consider(sh.id, sh.pos)
    }
    for (const c of this.state.contacts.player) {
      const sh = this.state.ships.find(s => s.id === c.shipId)
      // paměťový kontakt se vybírá na poslední ZNÁMÉ pozici, ne na živé
      if (sh && !sh.destroyed) consider(c.shipId, c.memory ? c.pos : sh.pos)
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

    // kamera sleduje loď
    if (this.followId !== null && !this.userPanned) {
      const f = st.ships.find(s => s.id === this.followId)
      if (f) this.cam = { ...f.pos }
    }

    ctx.fillStyle = st.wind ? '#0b2a33' : '#0b2a33'
    ctx.fillStyle = '#0a2630'
    ctx.fillRect(0, 0, cw, ch)

    this.drawWind(st)
    this.drawGrid()
    for (const isl of st.islands) this.drawIsland(isl)
    this.drawCourse(st)
    for (const b of st.balls) this.drawBall(b)
    for (const sh of st.ships) this.drawShip(st, sh)
    this.drawWindRose(st)
  }

  private drawGrid(): void {
    const ctx = this.ctx, cw = this.canvas.clientWidth, ch = this.canvas.clientHeight
    const stepM = 500
    const s = stepM * this.scale
    if (s < 24) return
    ctx.strokeStyle = '#0f3540'; ctx.lineWidth = 1
    const tl = this.s2w(0, 0), br = this.s2w(cw, ch)
    const x0 = Math.floor(tl.x / stepM) * stepM, x1 = Math.ceil(br.x / stepM) * stepM
    const y0 = Math.floor(br.y / stepM) * stepM, y1 = Math.ceil(tl.y / stepM) * stepM
    ctx.beginPath()
    for (let x = x0; x <= x1; x += stepM) { const a = this.w2s({ x, y: y0 }), b = this.w2s({ x, y: y1 }); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y) }
    for (let y = y0; y <= y1; y += stepM) { const a = this.w2s({ x: x0, y }), b = this.w2s({ x: x1, y }); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y) }
    ctx.stroke()
  }

  private drawWind(st: SimState): void {
    const ctx = this.ctx, cw = this.canvas.clientWidth, ch = this.canvas.clientHeight
    const spacing = 90
    ctx.strokeStyle = CLR.wind; ctx.fillStyle = CLR.wind; ctx.lineWidth = 1.5
    ctx.globalAlpha = 0.5
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

  private drawIsland(isl: Island): void {
    const ctx = this.ctx
    if (isl.poly.length < 3) return
    ctx.beginPath()
    isl.poly.forEach((p, i) => { const s = this.w2s(p); i ? ctx.lineTo(s.x, s.y) : ctx.moveTo(s.x, s.y) })
    ctx.closePath()
    if (isl.kind === 'reef') {
      ctx.fillStyle = CLR.reef; ctx.globalAlpha = 0.4; ctx.fill(); ctx.globalAlpha = 1
      ctx.strokeStyle = '#2f6b78'; ctx.setLineDash([5, 5]); ctx.stroke(); ctx.setLineDash([])
    } else {
      ctx.fillStyle = isl.kind === 'port' ? CLR.port : CLR.land; ctx.fill()
      ctx.strokeStyle = CLR.landEdge; ctx.lineWidth = 2; ctx.stroke()
    }
    if (isl.name && this.scale > 0.02) {
      const c = this.w2s(isl.poly[0])
      ctx.fillStyle = '#8a7f5a'; ctx.font = '11px monospace'
      ctx.fillText(isl.name, c.x + 4, c.y)
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
    const s = this.w2s(sh.pos)
    const r = hitRadius(sh)
    const lenPx = Math.max(7, r * this.scale * 1.6)
    const wPx = Math.max(3, lenPx * 0.42)
    const col = this.colorFor(sh.side, sh.destroyed || sh.surrendered)

    ctx.save()
    ctx.translate(s.x, s.y)
    ctx.rotate(-sh.heading) // svět y nahoru → obrazovka y dolů
    // trup: špičatá příď
    ctx.beginPath()
    ctx.moveTo(lenPx, 0)
    ctx.lineTo(lenPx * 0.1, wPx / 2)
    ctx.lineTo(-lenPx * 0.7, wPx / 2)
    ctx.lineTo(-lenPx * 0.7, -wPx / 2)
    ctx.lineTo(lenPx * 0.1, -wPx / 2)
    ctx.closePath()
    ctx.fillStyle = sh.destroyed ? '#333' : col
    ctx.globalAlpha = sh.surrendered ? 0.6 : 1
    ctx.fill()
    ctx.globalAlpha = 1
    // plachta (čárka napříč, jen když napnuté a živé)
    if (sh.sailsUp && !sh.destroyed && !sh.surrendered) {
      ctx.strokeStyle = '#eaf6f8'; ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.moveTo(0, -wPx * 0.9); ctx.lineTo(0, wPx * 0.9); ctx.stroke()
    }
    ctx.restore()

    // výběrový/cílový prstenec
    if (sh.id === this.selectedId) { ctx.strokeStyle = CLR.own; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(s.x, s.y, lenPx + 6, 0, Math.PI * 2); ctx.stroke() }
    if (sh.id === this.targetId) { ctx.strokeStyle = CLR.enemy; ctx.lineWidth = 2; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.arc(s.x, s.y, lenPx + 9, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]) }

    // jméno (u vlastních vždy, u ostatních dle identifikace)
    const showName = sh.side === 'player' || (con && con.idQuality >= 1) || sh.side === 'neutral'
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

  private drawBall(b: Ball): void {
    const ctx = this.ctx
    const s = this.w2s(b.pos)
    ctx.fillStyle = b.shot === 'chain' ? '#c8d8e0' : b.shot === 'grape' ? '#e0a060' : CLR.ball
    ctx.beginPath(); ctx.arc(s.x, s.y, 2, 0, Math.PI * 2); ctx.fill()
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
    const a = this.w2s(sel.pos), b = this.w2s(dest)
    ctx.strokeStyle = '#3aa0b0'; ctx.setLineDash([6, 6]); ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.setLineDash([])
    ctx.fillStyle = '#3aa0b0'; ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, Math.PI * 2); ctx.fill()
  }

  /** Kompasová růžice: směr větru + no-go zóna vůči přídi vybrané lodi. */
  private drawWindRose(st: SimState): void {
    const ctx = this.ctx
    const cx = this.canvas.clientWidth - 66, cy = 66, R = 44
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
