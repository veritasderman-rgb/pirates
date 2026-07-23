/**
 * HUD nad mapou: vlastní loď (trup, subsystémy, plachty/vesla, bod plavby),
 * cíl a kontakty, cíle mise, lišta rozkazů a log komunikace. Prosté DOM,
 * přerender ze snapshotu. Akce tlačítek přes data-act delegací.
 */
import type { ShipState, SimState, SimEvent, ShotType } from '../sim/types'
import { SHIP_CLASSES } from '../data/defs'
import { offWindAngle, sailEfficiency, inNoGo } from '../sim/sail'
import { forecastWind } from '../sim/wind'

/** Šipka směru větru (kam vane) — 8 světových stran. */
const windArrow = (dir: number): string => {
  const deg = (((dir * 180) / Math.PI) % 360 + 360) % 360
  return ['→', '↗', '↑', '↖', '←', '↙', '↓', '↘'][Math.round(deg / 45) % 8]
}

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
    const gpb = def?.gunsPerBroadside ?? 0
    const gunsL = Math.round(gpb * ss.gunsPort)
    const gunsR = Math.round(gpb * ss.gunsStbd)
    this.left.innerHTML =
      `<div class="panel"><h3>${esc(sh.name)}</h3>`
      + `<img class="ship-img" src="img/ship-${esc(sh.classId)}.png" alt="" onerror="this.style.display='none'">`
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
      + `<div class="row2"><span>děla připravená: <b>L ${gunsL} · P ${gunsR}</b> z ${gpb}</span></div>`
      + `<div class="pos ${inNoGo(offWindAngle(sh.heading, state.wind)) ? 'nogo' : eff > 0.85 ? 'good' : ''}">`
      + `bod plavby: ${POS_NAME(off)} (${Math.round(eff * 100)}%)</div>`
      + `</div>`
      + this.forecastHtml(state, sh)
  }

  /** Předpověď počasí: nyní / +5 / +10 / +15 min + trend pro vybranou loď. */
  private forecastHtml(state: SimState, sh: ShipState | undefined): string {
    const nowEff = sh ? sailEfficiency(offWindAngle(sh.heading, state.wind)) : 0
    const steps: [string, number][] = [['nyní', 0], ['+5 min', 300], ['+10 min', 600], ['+15 min', 900]]
    const rows = steps.map(([label, dt]) => {
      const w = dt === 0 ? state.wind : forecastWind(state, dt)
      const kn = Math.round(w.speed * 1.94)
      let trend = '<span class="dim">—</span>'
      if (sh) {
        const eff = sailEfficiency(offWindAngle(sh.heading, w))
        const d = eff - nowEff
        trend = Math.abs(d) < 0.06 ? '<span class="dim">=</span>'
          : d > 0 ? '<span class="ok">▲ lepší</span>' : '<span class="bad">▼ horší</span>'
      }
      return `<div class="fc-row"><span class="fc-t">${label}</span>`
        + `<span class="fc-a">${windArrow(w.dir)}</span><span class="fc-k">${kn} kn</span>`
        + `<span class="fc-tr">${trend}</span></div>`
    }).join('')
    return `<div class="panel fc"><h3>Počasí — předpověď</h3>${rows}`
      + `<div class="fc-hint">šipka = kam vane · ▲/▼ = tvůj bod plavby při stálém kurzu se zlepší/zhorší</div></div>`
  }

  private renderRight(state: SimState, ui: UiState): void {
    // cíl
    let tHtml = '<div class="dim">— žádný cíl —</div>'
    const tgt = state.ships.find(s => s.id === ui.targetId)
    if (tgt) {
      const con = state.contacts.player.find(c => c.shipId === tgt.id)
      // respektuj masku: třídu i obrázek ber z classGuess (ne skutečné classId)
      const shownClass = con?.classGuess ?? tgt.classId
      const def = SHIP_CLASSES[shownClass]
      const hp = SHIP_CLASSES[tgt.classId]?.hullPoints ?? 100
      const known = con && con.idQuality >= 1
      // živá taktická data (morálka, boarding) jen u aktuálně viditelného a
      // identifikovaného cíle — u ztraceného (memory) kontaktu senzory drží jen
      // poslední známou polohu, ne aktuální stav, tak ho nesmíme prozrazovat
      const liveId = !!(con && con.idQuality >= 1 && !con.memory)
      const cls = known ? esc(def?.name ?? shownClass) : 'neznámá třída'
      const nearSurr = liveId && !tgt.surrendered && !tgt.boarded && tgt.morale < 0.35 && tgt.side !== 'player'
      tHtml = `<div class="row"><b>${esc(tgt.name)}</b> ${tgt.boarded ? '⚓' : tgt.surrendered ? '⚑' : ''}</div>`
        + (known ? `<img class="ship-img" src="img/ship-${esc(shownClass)}.png" alt="" onerror="this.style.display='none'">` : '')
        + `<div class="row"><span>${cls}</span></div>`
        + `<div class="row"><span>trup</span>${bar(tgt.hull / hp, '#e0603a')}</div>`
        + (liveId ? `<div class="row"><span>morálka</span>${bar(tgt.morale, '#d8c24f')}</div>` : '')
        + (tgt.boarded ? `<div class="hintline ok">⚓ obsazena — kořist zajištěna</div>`
          : tgt.surrendered ? `<div class="hintline ok">⚑ vzdal se — připluj na ~60 m a dej „boarding"</div>`
          : nearSurr ? `<div class="hintline">nalomená morálka — zkus „výzvu ke kapitulaci"</div>` : '')
        + (liveId && tgt.boardingProgress && tgt.boardingProgress < 1 && !tgt.boarded
          ? `<div class="row"><span>boarding</span>${bar(tgt.boardingProgress, '#8ad0a0')}</div>` : '')
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
    const shotTip: Record<ShotType, string> = {
      round: 'Plné koule — trhají TRUP. Cesta k potopení nepřítele.',
      chain: 'Řetězové — trhají PLACHTY a ráhnoví. Zpomalí kořist (dohnat / obrátit k boardingu).',
      grape: 'Kartáč — kosí POSÁDKU. Láme morálku a připravuje na boarding.',
    }
    const shotDesc: Record<ShotType, string> = {
      round: 'koule → trup (potopení)', chain: 'řetěz → plachty (zpomalí)', grape: 'kartáč → posádka (boarding)',
    }
    const shotBtn = (s: ShotType, label: string): string =>
      `<button data-act="shot-${s}" class="${ui.shot === s ? 'active' : ''}" title="${esc(shotTip[s])}">${label}</button>`
    const auto = sh.fireControl.mode === 'auto'
    this.bottom.innerHTML =
      `<div class="obg"><button data-act="toggle-sails" class="${sh.sailsUp ? 'active' : ''}" title="Vytáhnout/svinout plachty (bez nich loď nemá tah z větru)">⛵ plachty</button>`
      + `<button data-act="trim-down" title="Ubrat plachet (pomaleji)">trim −</button><button data-act="trim-up" title="Přidat plachet (rychleji)">trim +</button>`
      + `<button data-act="toggle-oars" class="${sh.oaring ? 'active' : ''}" ${SHIP_CLASSES[sh.classId]?.canRow ? '' : 'disabled'} title="Vesla — malý tah nezávislý na větru (i proti větru), ale unaví posádku. Jen některé lodě.">🚣 vesla</button></div>`
      + `<div class="obg" title="Typ náboje pro salvu">náboj: ${shotBtn('round', 'koule')}${shotBtn('chain', 'řetěz')}${shotBtn('grape', 'kartáč')}`
      + `<span class="shot-desc">${esc(shotDesc[ui.shot])}</span></div>`
      + `<div class="obg"><button data-act="fire-port" ${sh.reloadPort > 0 ? 'disabled' : ''} title="Vypálit salvu z levoboku (cíl musí být v úhlu boku a dostřelu)">PAL levobok</button>`
      + `<button data-act="fire-stbd" ${sh.reloadStbd > 0 ? 'disabled' : ''} title="Vypálit salvu z pravoboku">PAL pravobok</button>`
      + `<button data-act="toggle-auto" class="${auto ? 'active' : ''}" title="Automatická palba: loď sama pálí bok, který nese na nejzraněnějšího nepřítele v dostřelu">AUTO</button></div>`
      + `<div class="obg"><button data-act="demand" title="Vyzvi zaměřený cíl ke kapitulaci. Šance roste s jeho poškozením, ztrátami posádky a tvou přesilou. Když spustí vlajku, můžeš ho obsadit.">výzva ke kapitulaci</button>`
      + `<button data-act="board" title="Boarding: přilehni k zaměřenému cíli na ~60 m a obsaď ho výsadkem. Rozhoduje převaha posádky (kartáč předtím pomáhá). Vzdaná loď se skoro nebrání. Zajmutá loď = kořist (víc bodů než potopení).">boarding</button></div>`
  }

  private renderLog(state: SimState): void {
    for (const e of state.events) {
      if (e.kind === 'ballMiss' || (!e.text && e.kind !== 'gunFire')) continue
      if (!e.text) continue
      const portrait = e.speaker
        ? `<img class="portrait" src="img/${e.speaker}.png" alt="" onerror="this.style.display='none'">`
        : ''
      const sp = e.speaker ? `<b class="sp-${e.speaker}">${speakerName(e.speaker)}:</b> ` : ''
      const div = document.createElement('div')
      div.className = `logline ${e.speaker ? 'comm' : ''}`
      div.innerHTML = `${portrait}<span class="lt">${fmtTime(e.t)}</span> ${sp}${esc(e.text)}`
      this.log.appendChild(div)
    }
    while (this.log.childElementCount > 60) this.log.removeChild(this.log.firstChild!)
    this.log.scrollTop = this.log.scrollHeight
  }
}

const speakerName = (s: string): string => ({
  captain: 'Kapitán', mate: 'Rusk (I. důstojník)', gunner: 'Hargrove (dělmistr)',
  lookout: 'Pip (hlídka)', bosun: 'Tarr (lodní mistr)', 'enemy-captain': 'Nepřítel',
  pirate: 'Pirát', port: 'kpt. Vaneová (kapitanát)', governor: 'Guvernér',
  admiral: 'admirál Thorne', agent: 'Don Cristóbal de Vega',
  'pirate-captain': 'Silas Rourke „Černý příboj"', 'castilian-admiral': 'almirante Herrera',
}[s] ?? s)
