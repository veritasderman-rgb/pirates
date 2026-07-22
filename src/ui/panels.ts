/**
 * HUD nad mapou: vlastní loď (trup, subsystémy, plachty/vesla, bod plavby),
 * cíl a kontakty, cíle mise, lišta rozkazů a log komunikace. Prosté DOM,
 * přerender ze snapshotu. Akce tlačítek přes data-act delegací.
 */
import type { ShipState, SimState, SimEvent, ShotType } from '../sim/types'
import { SHIP_CLASSES } from '../data/defs'
import { offWindAngle, sailEfficiency, inNoGo } from '../sim/sail'

export type PanelAction =
  | 'toggle-sails' | 'trim-up' | 'trim-down' | 'toggle-oars'
  | 'shot-round' | 'shot-chain' | 'shot-grape'
  | 'fire-port' | 'fire-stbd' | 'toggle-auto' | 'board' | 'demand' | 'hold'
  | 'comp-0' | 'comp-1' | 'comp-2' | 'comp-4' | 'comp-8'

export interface UiState {
  selectedId: number | null
  targetId: number | null
  compression: number
  shot: ShotType
}

export const esc = (s: string): string =>
  s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))

export const fmtTime = (t: number): string => {
  const m = Math.floor(t / 60), s = Math.floor(t % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

const bar = (v: number, col = '#4fd0e0'): string =>
  `<span class="bar"><i style="width:${Math.round(Math.max(0, Math.min(1, v)) * 100)}%;background:${col}"></i></span>`

const POS_NAME = (offDeg: number): string =>
  offDeg < 45 ? 'v kleštích (no-go)' : offDeg < 60 ? 'ostře na vítr'
    : offDeg < 100 ? 'na půl větru' : offDeg < 150 ? 'zadoboční (nej)' : 'po větru'

export class Panels {
  private log: HTMLElement
  private lastLogLen = 0

  constructor(
    private topbar: HTMLElement,
    private left: HTMLElement,
    private right: HTMLElement,
    private bottom: HTMLElement,
    logEl: HTMLElement,
    private onAction: (a: PanelAction) => void,
  ) {
    this.log = logEl
    const handler = (e: Event): void => {
      const t = (e.target as HTMLElement).closest('[data-act]') as HTMLElement | null
      if (t) { e.preventDefault(); this.onAction(t.dataset.act as PanelAction) }
    }
    for (const el of [topbar, bottom]) el.addEventListener('pointerdown', handler)
  }

  render(state: SimState, ui: UiState): void {
    this.renderTop(state, ui)
    this.renderLeft(state, ui)
    this.renderRight(state, ui)
    this.renderBottom(state, ui)
    this.renderLog(state)
  }

  private renderTop(state: SimState, ui: UiState): void {
    const comps = [0, 1, 2, 4, 8]
    const btns = comps.map(c =>
      `<button data-act="comp-${c}" class="${ui.compression === c ? 'active' : ''}">${c === 0 ? '❚❚' : c + '×'}</button>`).join('')
    const wind = `vítr ${Math.round(state.wind.speed * 1.94)} kn`
    this.topbar.innerHTML =
      `<span class="tb-time">⏱ ${fmtTime(state.t)}</span>`
      + `<span class="tb-comp">${btns}</span>`
      + `<span class="tb-wind">🧭 ${wind}</span>`
  }

  private renderLeft(state: SimState, ui: UiState): void {
    const sh = state.ships.find(s => s.id === ui.selectedId)
    if (!sh) { this.left.innerHTML = '<div class="panel"><h3>Loď</h3><div class="dim">— nevybráno —</div></div>'; return }
    const def = SHIP_CLASSES[sh.classId]
    const hp = def?.hullPoints ?? 100
    const off = (offWindAngle(sh.heading, state.wind) * 180) / Math.PI
    const eff = sailEfficiency(offWindAngle(sh.heading, state.wind))
    const spd = Math.round(Math.hypot(sh.vel.x, sh.vel.y) * 1.94)
    const ss = sh.subsystems
    this.left.innerHTML =
      `<div class="panel"><h3>${esc(sh.name)}</h3>`
      + `<div class="row"><span>${esc(def?.name ?? sh.classId)}</span></div>`
      + `<div class="row"><span>trup</span>${bar(sh.hull / hp, '#4fd0e0')}</div>`
      + `<div class="row"><span>morálka</span>${bar(sh.morale, '#d8c24f')}</div>`
      + `<div class="subs">`
      + `<div>ráhnoví ${bar(ss.rigging)}</div><div>kormidlo ${bar(ss.rudder)}</div>`
      + `<div>děla L ${bar(ss.gunsPort)}</div><div>děla P ${bar(ss.gunsStbd)}</div>`
      + `<div>posádka ${bar(ss.crew)}</div>`
      + `</div>`
      + `<div class="row2"><span>plachty: <b>${sh.sailsUp ? 'napnuté' : 'svinuté'}</b></span>`
      + `<span>trim: <b>${Math.round(sh.trim * 100)}%</b></span></div>`
      + `<div class="row2"><span>vesla: <b>${def?.canRow ? (sh.oaring ? 'ANO' : 'ne') : '—'}</b></span>`
      + `<span>stamina: ${bar(sh.oarStamina, '#8ad0a0')}</span></div>`
      + `<div class="row2"><span>rychlost: <b>${spd} kn</b></span><span>munice: <b>${sh.ammo}</b></span></div>`
      + `<div class="pos ${inNoGo(offWindAngle(sh.heading, state.wind)) ? 'nogo' : eff > 0.85 ? 'good' : ''}">`
      + `bod plavby: ${POS_NAME(off)} (${Math.round(eff * 100)}%)</div>`
      + `</div>`
  }

  private renderRight(state: SimState, ui: UiState): void {
    // cíl
    let tHtml = '<div class="dim">— žádný cíl —</div>'
    const tgt = state.ships.find(s => s.id === ui.targetId)
    if (tgt) {
      const def = SHIP_CLASSES[tgt.classId]
      const hp = def?.hullPoints ?? 100
      const con = state.contacts.player.find(c => c.shipId === tgt.id)
      const cls = con && con.idQuality >= 1 ? esc(def?.name ?? tgt.classId) : 'neznámá třída'
      tHtml = `<div class="row"><b>${esc(tgt.name)}</b> ${tgt.surrendered ? '⚑' : ''}</div>`
        + `<div class="row"><span>${cls}</span></div>`
        + `<div class="row"><span>trup</span>${bar(tgt.hull / hp, '#e0603a')}</div>`
    }
    // kontakty
    const contacts = state.contacts.player.map(c => {
      const sh = state.ships.find(s => s.id === c.shipId)
      if (!sh || sh.destroyed) return ''
      const nm = c.idQuality >= 1 ? sh.name : 'neznámý'
      const side = sh.side === 'enemy' ? '✗' : '•'
      return `<div class="ct ${sh.side}">${side} ${esc(nm)}${c.memory ? ' (ztracen)' : ''}</div>`
    }).join('')
    // cíle mise
    const objs = state.objectives.map(o => {
      const m = o.state === 'done' ? '■' : o.state === 'failed' ? '✗' : '□'
      return `<div class="obj ${o.state}">${m} ${esc(o.text)}</div>`
    }).join('')
    this.right.innerHTML =
      `<div class="panel"><h3>Cíl</h3>${tHtml}</div>`
      + `<div class="panel"><h3>Kontakty</h3>${contacts || '<div class="dim">klid na moři</div>'}</div>`
      + `<div class="panel"><h3>Mise</h3>${objs}</div>`
  }

  private renderBottom(state: SimState, ui: UiState): void {
    const sh = state.ships.find(s => s.id === ui.selectedId)
    if (!sh || sh.side !== 'player') { this.bottom.innerHTML = ''; return }
    const shotBtn = (s: ShotType, label: string): string =>
      `<button data-act="shot-${s}" class="${ui.shot === s ? 'active' : ''}">${label}</button>`
    const auto = sh.fireControl.mode === 'auto'
    this.bottom.innerHTML =
      `<div class="obg"><button data-act="toggle-sails" class="${sh.sailsUp ? 'active' : ''}">⛵ plachty</button>`
      + `<button data-act="trim-down">trim −</button><button data-act="trim-up">trim +</button>`
      + `<button data-act="toggle-oars" class="${sh.oaring ? 'active' : ''}" ${SHIP_CLASSES[sh.classId]?.canRow ? '' : 'disabled'}>🚣 vesla</button></div>`
      + `<div class="obg">náboj: ${shotBtn('round', 'koule')}${shotBtn('chain', 'řetěz')}${shotBtn('grape', 'kartáč')}</div>`
      + `<div class="obg"><button data-act="fire-port" ${sh.reloadPort > 0 ? 'disabled' : ''}>PAL levobok</button>`
      + `<button data-act="fire-stbd" ${sh.reloadStbd > 0 ? 'disabled' : ''}>PAL pravobok</button>`
      + `<button data-act="toggle-auto" class="${auto ? 'active' : ''}">AUTO</button></div>`
      + `<div class="obg"><button data-act="demand">výzva ke kapitulaci</button>`
      + `<button data-act="board">boarding</button></div>`
  }

  private renderLog(state: SimState): void {
    for (const e of state.events) {
      if (e.kind === 'ballMiss' || (!e.text && e.kind !== 'gunFire')) continue
      if (!e.text) continue
      const sp = e.speaker ? `<b class="sp-${e.speaker}">${speakerName(e.speaker)}:</b> ` : ''
      const div = document.createElement('div')
      div.className = `logline ${e.speaker ? 'comm' : ''}`
      div.innerHTML = `<span class="lt">${fmtTime(e.t)}</span> ${sp}${esc(e.text)}`
      this.log.appendChild(div)
    }
    while (this.log.childElementCount > 60) this.log.removeChild(this.log.firstChild!)
    this.log.scrollTop = this.log.scrollHeight
  }
}

const speakerName = (s: string): string => ({
  captain: 'Kapitán', mate: 'Kormidelník', gunner: 'Dělmistr', lookout: 'Hlídka',
  bosun: 'Lodní mistr', 'enemy-captain': 'Nepřítel', pirate: 'Pirát', port: 'Kapitanát',
  governor: 'Guvernér',
}[s] ?? s)
