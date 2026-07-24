/**
 * HUD nad mapou: vlastní loď (trup, subsystémy, plachty/vesla, bod plavby),
 * cíl a kontakty, cíle mise, lišta rozkazů a log komunikace. Prosté DOM,
 * přerender ze snapshotu. Akce tlačítek přes data-act delegací.
 */
import type { ShipState, SimState, SimEvent, ShotType } from '../sim/types'
import { SHIP_CLASSES } from '../data/defs'
import { offWindAngle, sailEfficiency, inNoGo } from '../sim/sail'
import { forecastWind } from '../sim/wind'
import { weatherGage, rakeAvailable, canChase, chaseGunCount, effectiveChaseGuns } from '../sim/weapons'
import { boardingOdds } from '../sim/surrender'
import { BOARD_RANGE } from '../sim/constants'
import { dist } from '../sim/vec'

/** Šipka směru větru (kam vane) — 8 světových stran. */
const windArrow = (dir: number): string => {
  const deg = (((dir * 180) / Math.PI) % 360 + 360) % 360
  return ['→', '↗', '↑', '↖', '←', '↙', '↓', '↘'][Math.round(deg / 45) % 8]
}

export type PanelAction =
  | 'toggle-sails' | 'trim-up' | 'trim-down' | 'toggle-oars'
  | 'shot-round' | 'shot-chain' | 'shot-grape' | 'shot-cycle'
  | 'fire-port' | 'fire-stbd' | 'fire-bow' | 'fire-stern' | 'fire' | 'toggle-auto' | 'board' | 'demand' | 'hold'
  | 'comp-0' | 'comp-1' | 'comp-2' | 'comp-4' | 'comp-8'

export interface UiState {
  selectedId: number | null
  targetId: number | null
  compression: number
  shot: ShotType
}

/** Vykreslovací vrstva HUD — implementuje desktop Panels i mobilní MobileHud. */
export interface Hud {
  render(state: SimState, ui: UiState): void
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
  offDeg < 45 ? 'in irons (no-go)' : offDeg < 60 ? 'close-hauled'
    : offDeg < 100 ? 'beam reach' : offDeg < 150 ? 'broad reach (best)' : 'running'

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
    const kn = Math.round(state.wind.speed * 1.94)
    const label = kn < 5 ? 'calm' : kn < 11 ? 'light breeze' : kn < 16 ? 'moderate wind'
      : kn < 22 ? 'fresh breeze' : kn < 28 ? 'gale' : 'storm'
    const icon = kn < 5 ? '🌤' : kn < 22 ? '🧭' : '🌩'
    this.topbar.innerHTML =
      `<span class="tb-time">⏱ ${fmtTime(state.t)}</span>`
      + `<span class="tb-comp">${btns}</span>`
      + `<span class="tb-wind">${icon} wind ${kn} kn · ${label}</span>`
  }

  private renderLeft(state: SimState, ui: UiState): void {
    const sh = state.ships.find(s => s.id === ui.selectedId)
    if (!sh) { this.left.innerHTML = '<div class="panel"><h3>Ship</h3><div class="dim">— none selected —</div></div>'; return }
    const def = SHIP_CLASSES[sh.classId]
    const hp = sh.hullMax ?? def?.hullPoints ?? 100
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
      + `<div class="row"><span>hull</span>${bar(sh.hull / hp, '#4fd0e0')}</div>`
      + `<div class="row"><span>morale</span>${bar(sh.morale, '#d8c24f')}</div>`
      + `<div class="subs">`
      + `<div>rigging ${bar(ss.rigging)}</div><div>rudder ${bar(ss.rudder)}</div>`
      + `<div>guns P ${bar(ss.gunsPort)}</div><div>guns S ${bar(ss.gunsStbd)}</div>`
      + `<div>crew ${bar(ss.crew)}</div>`
      + `</div>`
      + `<div class="row2"><span>sails: <b>${sh.sailsUp ? 'set' : 'furled'}</b></span>`
      + `<span>trim: <b>${Math.round(sh.trim * 100)}%</b></span></div>`
      + `<div class="row2"><span>oars: <b>${def?.canRow ? (sh.oaring ? 'YES' : 'no') : '—'}</b></span>`
      + `<span>stamina: ${bar(sh.oarStamina, '#8ad0a0')}</span></div>`
      + `<div class="row2"><span>speed: <b>${spd} kn</b></span><span>ammo: <b>${sh.ammo}</b></span></div>`
      + `<div class="row2"><span>guns ready: <b>P ${gunsL} · S ${gunsR}</b> of ${gpb}</span></div>`
      + `<div class="pos ${inNoGo(offWindAngle(sh.heading, state.wind)) ? 'nogo' : eff > 0.85 ? 'good' : ''}">`
      + `point of sail: ${POS_NAME(off)} (${Math.round(eff * 100)}%)</div>`
      + `</div>`
      + this.forecastHtml(state, sh)
  }

  /** Předpověď počasí: nyní / +5 / +10 / +15 min + trend pro vybranou loď. */
  private forecastHtml(state: SimState, sh: ShipState | undefined): string {
    const nowEff = sh ? sailEfficiency(offWindAngle(sh.heading, state.wind)) : 0
    const steps: [string, number][] = [['now', 0], ['+5 min', 300], ['+10 min', 600], ['+15 min', 900]]
    const rows = steps.map(([label, dt]) => {
      const w = dt === 0 ? state.wind : forecastWind(state, dt)
      const kn = Math.round(w.speed * 1.94)
      let trend = '<span class="dim">—</span>'
      if (sh) {
        const eff = sailEfficiency(offWindAngle(sh.heading, w))
        const d = eff - nowEff
        trend = Math.abs(d) < 0.06 ? '<span class="dim">=</span>'
          : d > 0 ? '<span class="ok">▲ better</span>' : '<span class="bad">▼ worse</span>'
      }
      return `<div class="fc-row"><span class="fc-t">${label}</span>`
        + `<span class="fc-a">${windArrow(w.dir)}</span><span class="fc-k">${kn} kn</span>`
        + `<span class="fc-tr">${trend}</span></div>`
    }).join('')
    return `<div class="panel fc"><h3>Weather — forecast</h3>${rows}`
      + `<div class="fc-hint">arrow = where it blows · ▲/▼ = your point of sail on this heading gets better/worse</div></div>`
  }

  private renderRight(state: SimState, ui: UiState): void {
    // cíl
    let tHtml = '<div class="dim">— no target —</div>'
      + '<div class="fc-hint">Click an enemy on the map = target it (for manual FIRE port/stbd Q/R, '
      + 'surrender demand and boarding). Empty water = course for the selected ship. '
      + 'AUTO fires on its own at the most-damaged enemy in range — it ignores your target.</div>'
    const tgt = state.ships.find(s => s.id === ui.targetId)
    if (tgt) {
      const con = state.contacts.player.find(c => c.shipId === tgt.id)
      // respektuj masku: třídu i obrázek ber z classGuess (ne skutečné classId)
      const shownClass = con?.classGuess ?? tgt.classId
      const def = SHIP_CLASSES[shownClass]
      const hp = tgt.hullMax ?? SHIP_CLASSES[tgt.classId]?.hullPoints ?? 100
      const known = con && con.idQuality >= 1
      // živá taktická data (morálka, boarding) jen u aktuálně viditelného a
      // identifikovaného cíle — u ztraceného (memory) kontaktu senzory drží jen
      // poslední známou polohu, ne aktuální stav, tak ho nesmíme prozrazovat
      const liveId = !!(con && con.idQuality >= 1 && !con.memory)
      const cls = known ? esc(def?.name ?? shownClass) : 'unknown class'
      const nearSurr = liveId && !tgt.surrendered && !tgt.boarded && tgt.morale < 0.35 && tgt.side !== 'player'
      tHtml = `<div class="row"><b>${esc(tgt.name)}</b> ${tgt.boarded ? '⚓' : tgt.surrendered ? '⚑' : ''}</div>`
        + (known ? `<img class="ship-img" src="img/ship-${esc(shownClass)}.png" alt="" onerror="this.style.display='none'">` : '')
        + `<div class="row"><span>${cls}</span></div>`
        + `<div class="row"><span>hull</span>${bar(tgt.hull / hp, '#e0603a')}</div>`
        + (liveId ? `<div class="row"><span>morale</span>${bar(tgt.morale, '#d8c24f')}</div>` : '')
        + (tgt.boarded ? `<div class="hintline ok">⚓ boarded — prize secured</div>`
          : tgt.surrendered ? `<div class="hintline ok">⚑ struck her colours — close to ~60 m and give the "boarding" order</div>`
          : nearSurr ? `<div class="hintline">morale is cracking — try the "demand surrender"</div>` : '')
        + (liveId && tgt.boardingProgress && tgt.boardingProgress < 1 && !tgt.boarded
          ? `<div class="row"><span>boarding</span>${bar(tgt.boardingProgress, '#8ad0a0')}</div>` : '')
        + this.tacticsHtml(state, tgt, liveId)
    }
    // kontakty
    const contacts = state.contacts.player.map(c => {
      const sh = state.ships.find(s => s.id === c.shipId)
      if (!sh || sh.destroyed) return ''
      const nm = c.idQuality >= 1 ? sh.name : 'unknown'
      const side = sh.side === 'enemy' ? '✗' : '•'
      return `<div class="ct ${sh.side}">${side} ${esc(nm)}${c.memory ? ' (lost)' : ''}</div>`
    }).join('')
    // cíle mise
    const objs = state.objectives.map(o => {
      const m = o.state === 'done' ? '■' : o.state === 'failed' ? '✗' : '□'
      return `<div class="obj ${o.state}">${m} ${esc(o.text)}</div>`
    }).join('')
    this.right.innerHTML =
      `<div class="panel"><h3>Target</h3>${tHtml}</div>`
      + `<div class="panel"><h3>Contacts</h3>${contacts || '<div class="dim">calm seas</div>'}</div>`
      + `<div class="panel"><h3>Mission</h3>${objs}</div>`
  }

  /**
   * Taktický telegraf u zaměřeného nepřítele: návětrná výhoda (weather gage),
   * dostupnost rakingu a šance boardingu — aby hráč viděl, kdy má jeho manévr
   * zásadní dopad. Gage/rake jsou čistá geometrie (viditelná z mapy), odds
   * potřebuje živá data cíle (posádka/morálka), proto jen u liveId.
   */
  private tacticsHtml(state: SimState, tgt: ShipState, liveId: boolean): string {
    if (tgt.side === 'player' || tgt.boarded || tgt.destroyed) return ''
    const flag = state.ships.find(s => s.doctrine === 'player' && !s.destroyed)
    if (!flag) return ''
    const rows: string[] = []
    // weather gage
    const gage = weatherGage(flag.pos, tgt.pos, state.wind.dir)
    const gLabel = gage > 0.55 ? '<span class="ok">windward ✓ (tighter broadside)</span>'
      : gage < 0.3 ? '<span class="bad">leeward ✗ (smoke in your eyes)</span>'
      : '<span class="dim">abeam of wind</span>'
    rows.push(`<div class="tac-row"><span>⚑ gage</span>${gLabel}</div>`)
    // raking
    const rk = rakeAvailable(flag, tgt)
    rows.push(`<div class="tac-row"><span>🎯 raking</span>${rk
      ? '<span class="ok">lined on bow/stern — 2× devastating broadside!</span>'
      : '<span class="dim">line up on the target\'s bow/stern</span>'}</div>`)
    // boarding odds (only for a live-identified target)
    if (liveId && !tgt.surrendered) {
      const odds = Math.round(boardingOdds(flag, tgt) * 100)
      const near = dist(flag.pos, tgt.pos) <= BOARD_RANGE
      const cls = odds >= 60 ? 'ok' : odds >= 45 ? '' : 'bad'
      rows.push(`<div class="tac-row"><span>⚓ boarding</span>`
        + `<span class="${cls}">odds ~${odds}%${near ? ' · in range!' : ''}</span></div>`)
    }
    return `<div class="tactics">${rows.join('')}</div>`
  }

  private renderBottom(state: SimState, ui: UiState): void {
    const sh = state.ships.find(s => s.id === ui.selectedId)
    if (!sh || sh.side !== 'player') { this.bottom.innerHTML = ''; return }
    const shotTip: Record<ShotType, string> = {
      round: 'Round shot — tears the HULL. The path to sinking the enemy.',
      chain: 'Chain shot — tears SAILS and rigging. Slows the prize (to catch it / turn to a boarding).',
      grape: 'Grape shot — mows down the CREW. Breaks morale and sets up a boarding.',
    }
    const shotDesc: Record<ShotType, string> = {
      round: 'round → hull (sink)', chain: 'chain → sails (slow)', grape: 'grape → crew (boarding)',
    }
    const shotBtn = (s: ShotType, label: string): string =>
      `<button data-act="shot-${s}" class="${ui.shot === s ? 'active' : ''}" title="${esc(shotTip[s])}">${label}</button>`
    const auto = sh.fireControl.mode === 'auto'
    this.bottom.innerHTML =
      `<div class="obg"><button data-act="toggle-sails" class="${sh.sailsUp ? 'active' : ''}" title="Set/furl sails (without them the ship gets no drive from the wind)">⛵ sails</button>`
      + `<button data-act="trim-down" title="Reduce sail (slower)">trim −</button><button data-act="trim-up" title="Add sail (faster)">trim +</button>`
      + `<button data-act="toggle-oars" class="${sh.oaring ? 'active' : ''}" ${SHIP_CLASSES[sh.classId]?.canRow ? '' : 'disabled'} title="Oars — a small drive independent of the wind (even upwind), but it tires the crew. Only some ships.">🚣 oars</button></div>`
      + `<div class="obg" title="Shot type for the broadside">shot: ${shotBtn('round', 'round')}${shotBtn('chain', 'chain')}${shotBtn('grape', 'grape')}`
      + `<span class="shot-desc">${esc(shotDesc[ui.shot])}</span></div>`
      + `<div class="obg"><button data-act="fire-port" ${sh.reloadPort > 0 ? 'disabled' : ''} title="Fire the port broadside (target must be within the arc and range)">FIRE port</button>`
      + `<button data-act="fire-stbd" ${sh.reloadStbd > 0 ? 'disabled' : ''} title="Fire the starboard broadside">FIRE stbd</button>`
      + `<button data-act="toggle-auto" class="${auto ? 'active' : ''}" title="Toggle: AUTO = the ship fires its bearing broadside at the most-damaged enemy in range on its own. Off = holds fire, you fire manually (FIRE port/stbd, Q/R).">${auto ? 'AUTO: firing' : 'AUTO: holding fire'}</button></div>`
      + this.chaserHtml(state, ui, sh)
      + `<div class="obg"><button data-act="demand" title="Demand the target strike her colours. Odds rise with her damage, crew losses and your superiority. Once she strikes, you can board her.">demand surrender</button>`
      + `<button data-act="board" title="Boarding: lay alongside the target at ~60 m and give the order — the boarding party then fights on its own (watch the meter). Until she strikes, it is a bloody melee: both crews lose men, the weaker more. Grape shot softens her up first. If you bleed out, the party withdraws. A captured ship = a prize (more points than sinking).">boarding</button></div>`
  }

  /** Stíhací děla (příď/záď) — jen má-li je loď; slabá palba podél osy v honičce. */
  private chaserHtml(state: SimState, ui: UiState, sh: ShipState): string {
    if (chaseGunCount(sh) <= 0) return ''
    const tgt = ui.targetId !== null ? state.ships.find(s => s.id === ui.targetId) : undefined
    const noGuns = effectiveChaseGuns(sh) <= 0 // děla rozstřílená → stíhací umlkla
    const bowDis = noGuns || sh.reloadBow > 0 || !(tgt && !tgt.destroyed && canChase(sh, 'bow', tgt))
    const sternDis = noGuns || sh.reloadStern > 0 || !(tgt && !tgt.destroyed && canChase(sh, 'stern', tgt))
    return `<div class="obg" title="Light chase guns fore &amp; aft — weak, but they fire along your bow/stern without turning broadside. Handy while running a ship down (the full broadside still hits far harder).">`
      + `<button data-act="fire-bow" ${bowDis ? 'disabled' : ''} title="Fire the bow chaser — target must be roughly ahead (key F)">🎯 bow gun</button>`
      + `<button data-act="fire-stern" ${sternDis ? 'disabled' : ''} title="Fire the stern chaser — target must be roughly astern (key G)">🎯 stern gun</button></div>`
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
  captain: 'Captain', mate: 'Rusk (First Mate)', gunner: 'Hargrove (Master Gunner)',
  lookout: 'Pip (Lookout)', bosun: 'Tarr (Bosun)', 'enemy-captain': 'Enemy',
  pirate: 'Pirate', port: 'Capt. Vane (Port Authority)', governor: 'Governor',
  admiral: 'Admiral Thorne', agent: 'Don Cristóbal de Vega',
  'pirate-captain': 'Silas Rourke "Black Surf"', 'castilian-admiral': 'Almirante Herrera',
}[s] ?? s)
