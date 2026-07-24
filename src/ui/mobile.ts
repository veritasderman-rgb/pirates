/**
 * Mobilní UX vrstva — aktivuje se jen na dotykových telefonech (nebo přes
 * ?ui=mobile). Sdílí simulaci i renderer s desktopem; nahrazuje jen HUD a
 * ovládání. Filozofie: mapa je hra, text → infografika. Žádné dlouhé popisky,
 * jen barevné ikonové ukazatele, palcová lišta akcí a bublinové hlášky.
 */
import type { Hud, PanelAction, UiState } from './panels'
import type { Renderer } from './renderer'
import type { ShipState, SimState, ShotType } from '../sim/types'
import { SHIP_CLASSES } from '../data/defs'
import { weatherGage, rakeAvailable, bestBroadside } from '../sim/weapons'
import { boardingOdds } from '../sim/surrender'
import { BOARD_RANGE } from '../sim/constants'
import { dist } from '../sim/vec'

/** Zapnout mobilní UX? Dotykové ovládání + malá obrazovka, s ?ui override. */
export function isMobileUX(): boolean {
  const q = new URLSearchParams(location.search).get('ui')
  if (q === 'mobile') return true
  if (q === 'desktop') return false
  const coarse = matchMedia('(pointer: coarse)').matches
  const small = Math.min(window.innerWidth, window.innerHeight) < 820
  return coarse && small
}

const esc = (s: string): string =>
  s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))

/** 0..1 → barva (červená → jantar → zelená). */
const gaugeCol = (v: number): string => v > 0.66 ? '#5cc98a' : v > 0.33 ? '#d8b24f' : '#e0603a'

const SHOT_ICON: Record<ShotType, string> = { round: '⚫', chain: '⛓', grape: '🔴' }
const SHOT_TAG: Record<ShotType, string> = { round: 'hull', chain: 'sails', grape: 'crew' }

/** Malý svislý ukazatel: ikona + barevný sloupec (bez textu). */
function pip(icon: string, v: number, title: string): string {
  const h = Math.round(Math.max(0, Math.min(1, v)) * 100)
  return `<div class="mh-pip" title="${title}"><div class="mh-pipbar"><i style="height:${h}%;background:${gaugeCol(v)}"></i></div>`
    + `<span class="mh-pipi">${icon}</span></div>`
}

/** Kompas větru: kruh + šipka směru (kam vane) + uzly. */
function windDial(dir: number, kn: number): string {
  const deg = -dir * 180 / Math.PI // svět y nahoru → obrazovka
  return `<div class="mh-wind"><svg viewBox="-12 -12 24 24" width="34" height="34">`
    + `<circle r="11" class="mh-wind-c"/>`
    + `<g transform="rotate(${deg.toFixed(1)})"><path d="M9 0 L-4 -5 L-1 0 L-4 5 Z" class="mh-wind-a"/></g>`
    + `</svg><span class="mh-wind-kn">${kn}</span></div>`
}

/** Prstenec šance (0..1) — SVG kruh s dash. */
function ring(v: number, label: string, cls: string): string {
  const R = 13, C = 2 * Math.PI * R, on = Math.round(C * Math.max(0, Math.min(1, v)))
  return `<div class="mh-ring ${cls}"><svg viewBox="-16 -16 32 32" width="34" height="34">`
    + `<circle r="${R}" class="mh-ring-bg"/>`
    + `<circle r="${R}" class="mh-ring-fg" stroke-dasharray="${on} ${C - on}" transform="rotate(-90)"/>`
    + `</svg><span class="mh-ring-t">${label}</span></div>`
}

export class MobileHud implements Hud {
  private root: HTMLElement
  private top: HTMLElement
  private status: HTMLElement
  private target: HTMLElement
  private actions: HTMLElement
  private toasts: HTMLElement
  private seenLog = 0

  constructor(private onAction: (a: PanelAction) => void) {
    document.body.classList.add('mobile')
    this.root = document.createElement('div')
    this.root.id = 'mhud'
    this.root.innerHTML =
      '<div id="mh-top"></div><div id="mh-status"></div><div id="mh-toasts"></div>'
      + '<div id="mh-target"></div><div id="mh-actions"></div>'
    document.body.appendChild(this.root)
    this.top = this.root.querySelector('#mh-top')!
    this.status = this.root.querySelector('#mh-status')!
    this.target = this.root.querySelector('#mh-target')!
    this.actions = this.root.querySelector('#mh-actions')!
    this.toasts = this.root.querySelector('#mh-toasts')!
    const handler = (e: Event): void => {
      const t = (e.target as HTMLElement).closest('[data-act]') as HTMLElement | null
      if (t && !t.hasAttribute('disabled')) { e.preventDefault(); this.onAction(t.dataset.act as PanelAction) }
    }
    for (const el of [this.top, this.target, this.actions]) el.addEventListener('pointerdown', handler)
  }

  render(state: SimState, ui: UiState): void {
    this.renderTop(state, ui)
    this.renderStatus(state, ui)
    this.renderTarget(state, ui)
    this.renderActions(state, ui)
    this.pumpToasts(state)
  }

  private renderTop(state: SimState, ui: UiState): void {
    const kn = Math.round(state.wind.speed * 1.94)
    const running = ui.compression > 0
    const speeds = [1, 2, 4]
    const spd = speeds.map(s =>
      `<button data-act="comp-${s}" class="mh-sp ${ui.compression === s ? 'on' : ''}">${s}×</button>`).join('')
    const m = Math.floor(state.t / 60), sec = Math.floor(state.t % 60)
    const objs = state.objectives.map(o => {
      const mk = o.state === 'done' ? '■' : o.state === 'failed' ? '✗' : '□'
      return `<div class="mh-obj ${o.state}">${mk} ${esc(o.text)}</div>`
    }).join('')
    this.top.innerHTML =
      `<button data-act="comp-${running ? 0 : 1}" class="mh-play">${running ? '❚❚' : '▶'}</button>`
      + `<span class="mh-time">${m}:${sec.toString().padStart(2, '0')}</span>`
      + `<span class="mh-spd">${spd}</span>`
      + windDial(state.wind.dir, kn)
      + `<div class="mh-objs">${objs}</div>`
  }

  private renderStatus(state: SimState, ui: UiState): void {
    const sh = state.ships.find(s => s.id === ui.selectedId)
    if (!sh) { this.status.innerHTML = ''; return }
    const def = SHIP_CLASSES[sh.classId]
    const hp = sh.hullMax ?? def?.hullPoints ?? 100
    const ss = sh.subsystems
    const guns = (ss.gunsPort + ss.gunsStbd) / 2
    this.status.innerHTML =
      pip('🛡', sh.hull / hp, 'hull') + pip('⛵', ss.rigging, 'rigging') + pip('🧭', ss.rudder, 'rudder')
      + pip('💥', guns, 'guns') + pip('👥', ss.crew, 'crew') + pip('🚩', sh.morale, 'morale')
  }

  private renderTarget(state: SimState, ui: UiState): void {
    const tgt = ui.targetId !== null ? state.ships.find(s => s.id === ui.targetId) : undefined
    if (!tgt || tgt.destroyed) { this.target.innerHTML = ''; return }
    const con = state.contacts.player.find(c => c.shipId === tgt.id)
    const known = !!(con && con.idQuality >= 1)
    // živá data (trup, gage, rake, šance) jen u aktuálně viditelného a
    // identifikovaného cíle — u ztraceného (memory) kontaktu senzory drží jen
    // poslední polohu, ne aktuální stav, tak ho nesmíme prozrazovat
    const live = !!(con && con.idQuality >= 1 && !con.memory) && tgt.side !== 'player'
    const hp = tgt.hullMax ?? SHIP_CLASSES[tgt.classId]?.hullPoints ?? 100
    const flag = state.ships.find(s => s.doctrine === 'player' && !s.destroyed)
    const bits: string[] = []
    if (flag && live) {
      const gage = weatherGage(flag.pos, tgt.pos, state.wind.dir)
      bits.push(`<span class="mh-t-ic ${gage > 0.55 ? 'on' : gage < 0.3 ? 'bad' : ''}" title="weather gage">⚑</span>`)
      bits.push(`<span class="mh-t-ic ${rakeAvailable(flag, tgt) ? 'on' : ''}" title="raking">🎯</span>`)
    }
    const badge = tgt.boarded ? '⚓' : tgt.surrendered ? '⚑' : ''
    const oddsRing = flag && live && !tgt.surrendered
      ? ring(boardingOdds(flag, tgt), `${Math.round(boardingOdds(flag, tgt) * 100)}%`,
          dist(flag.pos, tgt.pos) <= BOARD_RANGE ? 'near' : '')
      : ''
    const body = live
      ? `<div class="mh-t-bar"><i style="width:${Math.round(Math.max(0, tgt.hull / hp) * 100)}%"></i></div>`
        + `<div class="mh-t-ics">${bits.join('')}</div>`
      : `<div class="mh-t-lost">${con?.memory ? 'contact lost' : 'unidentified'}</div>`
    this.target.innerHTML =
      `<div class="mh-t-main"><div class="mh-t-name">${esc(known ? tgt.name : 'Unknown contact')} ${badge}</div>`
      + body + `</div>`
      + oddsRing
  }

  private renderActions(state: SimState, ui: UiState): void {
    const sh = state.ships.find(s => s.id === ui.selectedId)
    if (!sh || sh.side !== 'player') { this.actions.innerHTML = ''; return }
    const def = SHIP_CLASSES[sh.classId]
    const auto = sh.fireControl.mode === 'auto'
    const hasTgt = ui.targetId !== null
    const tgt = hasTgt ? state.ships.find(s => s.id === ui.targetId) : undefined
    // FIRE jen když bok, který NESE na cíl, je zároveň nabitý (jinak sim salvu odmítne)
    const bearSide = tgt && !tgt.destroyed ? bestBroadside(sh, tgt) : null
    const canFire = bearSide === 'port' ? sh.reloadPort <= 0
      : bearSide === 'stbd' ? sh.reloadStbd <= 0 : false
    const btn = (act: PanelAction, icon: string, label: string, on = false, dis = false): string =>
      `<button data-act="${act}" class="mh-btn ${on ? 'on' : ''}" ${dis ? 'disabled' : ''}>`
      + `<span class="mh-bi">${icon}</span><span class="mh-bl">${label}</span></button>`
    const ctx = tgt && tgt.side !== 'player' && !tgt.destroyed
      ? (!tgt.surrendered ? btn('demand', '⚑', 'surr') : '') + btn('board', '⚓', 'board')
      : ''
    this.actions.innerHTML =
      btn('toggle-sails', '⛵', 'sails', sh.sailsUp)
      + btn('toggle-oars', '🚣', 'oars', sh.oaring, !def?.canRow)
      + btn('shot-cycle', SHOT_ICON[ui.shot], SHOT_TAG[ui.shot])
      + btn('fire', '🔥', 'FIRE', false, !canFire)
      + btn('toggle-auto', auto ? '🎯' : '✋', auto ? 'auto' : 'hold', auto)
      + ctx
  }

  /** Nové události → mizející bubliny (nahrazuje textový log). */
  private pumpToasts(state: SimState): void {
    for (const e of state.events) {
      if (!e.text) continue
      if (e.kind === 'ballMiss' || e.kind === 'ballHit' || e.kind === 'gunFire') continue
      const div = document.createElement('div')
      div.className = `mh-toast ${e.speaker ? 'comm' : ''}`
      div.textContent = e.text
      this.toasts.appendChild(div)
      const el = div
      setTimeout(() => { el.style.opacity = '0' }, 3200)
      setTimeout(() => { el.remove() }, 3800)
    }
    while (this.toasts.childElementCount > 4) this.toasts.removeChild(this.toasts.firstChild!)
    this.seenLog = state.events.length
  }
}

/**
 * Dotykové gesta na plátně: prsty jsou tap (výběr/kurz — řeší controller) a
 * tažení jedním prstem (pan — řeší plot). Zde přidáváme sevření dvěma prsty =
 * zoom a dvojklep = vycentrování. Ostatní necháváme na existující vrstvě.
 */
export class TouchInput {
  private pinchD = 0
  private lastTap = 0
  // sledování aktuálního gesta: začátek prstu, jestli se hnul, jestli byl vícedotyk
  private startX = 0
  private startY = 0
  private moved = false
  private multi = false

  constructor(private canvas: HTMLCanvasElement, private plot: Renderer) {
    canvas.style.touchAction = 'none'
    canvas.addEventListener('touchstart', e => this.onStart(e), { passive: false })
    canvas.addEventListener('touchmove', e => this.onMove(e), { passive: false })
    canvas.addEventListener('touchend', e => this.onEnd(e), { passive: false })
  }

  private onStart(e: TouchEvent): void {
    if (e.touches.length === 1 && !this.multi) {
      this.startX = e.touches[0].clientX; this.startY = e.touches[0].clientY; this.moved = false
    }
    if (e.touches.length >= 2) { this.multi = true; e.preventDefault(); this.pinchD = this.spread(e) }
  }

  private onMove(e: TouchEvent): void {
    if (e.touches.length >= 2 && this.pinchD > 0) {
      this.multi = true
      e.preventDefault()
      const d = this.spread(e)
      if (d > 0) { this.plot.zoomStep(d / this.pinchD); this.pinchD = d }
    } else if (e.touches.length === 1) {
      const t = e.touches[0]
      if (Math.hypot(t.clientX - this.startX, t.clientY - this.startY) > 10) this.moved = true
    }
  }

  private onEnd(e: TouchEvent): void {
    if (e.touches.length < 2) this.pinchD = 0
    if (e.touches.length > 0) return // gesto ještě běží (zbývá prst)
    // dvojklep jen když gesto bylo čistý jednoprstý tap (bez tažení a bez pinche)
    const wasTap = !this.multi && !this.moved && (e.changedTouches?.length ?? 0) === 1
    this.multi = false; this.moved = false
    if (!wasTap) { this.lastTap = 0; return }
    const now = e.timeStamp || 0
    if (now - this.lastTap < 300) { this.plot.recenter(); this.lastTap = 0 }
    else this.lastTap = now
  }

  private spread(e: TouchEvent): number {
    const a = e.touches[0], b = e.touches[1]
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
  }
}
