/**
 * Bootstrap UI: bridge → plot → panely → controller. Briefing na start
 * (pauza), výběr misí, win/lose overlay dle outcome.
 */
import { SimBridge } from './worker/bridge'
import { TacticalPlot } from './ui/plot'
import { Plot3D } from './ui/plot3d'
import type { Renderer } from './ui/renderer'
import { Panels, esc, fmtTime } from './ui/panels'
import { UIController } from './ui/input'
import { AudioManager } from './ui/audio'
import { SCENARIOS } from './data/missions'
import { CAMPAIGN_INTRO, DEFEAT_GENERIC, MISSION_STORY } from './data/story'
import { scoreMission } from './sim/score'
import type { Scenario, SimState } from './sim/types'

const canvas = document.getElementById('plot') as HTMLCanvasElement

// přepínač rendereru: ?r=3d nebo uložená volba → WebGL 3D, jinak 2D Canvas.
// Přepínač jen přenačte stránku s druhým rendererem — 2D hra zůstává netknutá.
const use3d = new URLSearchParams(location.search).get('r') === '3d'
  || localStorage.getItem('r3d') === '1'
const bridge = new SimBridge()
const plot: Renderer = use3d ? new Plot3D(canvas) : new TacticalPlot(canvas)

const rBtn = document.createElement('button')
rBtn.textContent = use3d ? '2D' : '3D'
rBtn.title = 'Přepnout renderer (2D Canvas ↔ 3D WebGL)'
rBtn.style.cssText = 'position:absolute;top:6px;right:120px;z-index:9'
rBtn.addEventListener('click', () => {
  localStorage.setItem('r3d', use3d ? '0' : '1')
  location.reload()
})
document.body.appendChild(rBtn)
const panels = new Panels(
  document.getElementById('topbar')!,
  document.getElementById('hud-left')!,
  document.getElementById('hud-right')!,
  document.getElementById('hud-bottom')!,
  document.getElementById('hud-log')!,
  a => controller.handleAction(a),
)
const controller = new UIController(bridge, plot, panels, canvas)
const audio = new AudioManager()
audio.setMenuMode(true)
window.addEventListener('pointerdown', () => audio.unlock(), { once: false })

// navigační pad — posun/zoom mapy bez myši (klik i podržení)
const navpad = document.getElementById('navpad')
const NAV: Record<string, () => void> = {
  up: () => plot.panByScreen(0, 110),
  down: () => plot.panByScreen(0, -110),
  left: () => plot.panByScreen(110, 0),
  right: () => plot.panByScreen(-110, 0),
  in: () => plot.zoomStep(1.18),
  out: () => plot.zoomStep(1 / 1.18),
  center: () => plot.recenter(),
}
let navTimer = 0
const stopNav = (): void => { if (navTimer) { clearInterval(navTimer); navTimer = 0 } }
navpad?.addEventListener('pointerdown', e => {
  const b = (e.target as HTMLElement).closest('[data-nav]') as HTMLElement | null
  if (!b) return
  e.preventDefault()
  const fn = NAV[b.dataset.nav ?? '']
  if (!fn) return
  fn()
  if (b.dataset.nav !== 'center') { stopNav(); navTimer = window.setInterval(fn, 55) }
})
window.addEventListener('pointerup', stopNav)
window.addEventListener('pointercancel', stopNav)
navpad?.addEventListener('pointerleave', stopNav)

let outcomeShown = false
let currentMissionId = ''

function overlay(html: string): HTMLElement {
  const el = document.createElement('div')
  el.className = 'overlay'
  el.innerHTML = `<div class="box">${html}</div>`
  document.body.appendChild(el)
  return el
}

function firstSentence(t: string): string {
  const i = t.indexOf('.')
  return i >= 0 ? t.slice(0, i + 1) : t
}

/** Úvodní scéna/obrázek mise (public/img/<hodnota>.png); chybějící se skryje. */
const MISSION_SCENES: Record<string, string> = {
  mission01: 'ship-sloop-albion',
  mission02: 'scene-ambush',
  mission03: 'ship-merch',
  mission04: 'scene-castilla-port',
  mission05: 'scene-pirate-cove',
  mission06: 'scene-beacons',
  mission07: 'ship-liner-castilla',
  mission08: 'scene-castilla-port',
  mission09: 'ship-frigate-albion',
  mission10: 'ship-galleon-castilla',
  mission11: 'scene-beacons',
}

function showMissionSelect(): void {
  const rows = Object.values(SCENARIOS).map((sc, i) =>
    `<div class="mrow"><button data-mission="${esc(sc.id)}">${i + 1}. ${esc(sc.title)}</button>`
    + `<div class="mdesc">${esc(firstSentence(sc.briefing))}</div></div>`).join('')
  const el = overlay(
    `<img class="menu-img" src="img/scene-court.png" alt="" onerror="this.remove()">`
    + `<h1>PIRATES</h1>`
    + `<div class="brief story">${esc(CAMPAIGN_INTRO)}</div>`
    + `<h2>Výběr mise</h2>${rows}`)
  el.querySelectorAll<HTMLButtonElement>('button[data-mission]').forEach(b =>
    b.addEventListener('click', () => { el.remove(); bridge.start(b.dataset.mission!) }))
}

function showBriefing(sc: Scenario): void {
  const prolog = MISSION_STORY[sc.id]?.prolog
  const scene = MISSION_SCENES[sc.id]
  const el = overlay(
    (scene ? `<img class="brief-img" src="img/${scene}.png" alt="" onerror="this.remove()">` : '')
    + `<h2>${esc(sc.title)}</h2>`
    + (prolog ? `<div class="brief story">${esc(prolog)}</div>` : '')
    + `<div class="brief">${esc(sc.briefing)}</div>`
    + `<div class="hint">Ovládání: klik na vlastní loď = výběr · klik na cíl = zaměření · `
    + `klik na vodu = kurz · <b>tažení = posun mapy</b> · kolečko = zoom · `
    + `<b>tlačítka vpravo (šipky/＋/－/◎) = posun, zoom a vycentrování na loď</b> · `
    + `mezerník = pauza · W plachty · E vesla · Q/R boční salva · A auto · 1/2/3 náboj</div>`
    + `<button id="btn-start">VYPLOUT</button>`)
  el.querySelector('#btn-start')!.addEventListener('click', () => {
    el.remove()
    audio.setMenuMode(false) // konec briefingu → adaptivní bojová hudba
    controller.setCompression(1)
  })
}

function showOutcome(state: SimState): void {
  const win = state.outcome === 'win'
  const objs = state.objectives.map(o => {
    const m = o.state === 'done' ? '■' : o.state === 'failed' ? '✗' : '□'
    return `<div class="obj ${o.state}">${m} ${esc(o.text)}</div>`
  }).join('')
  const prizes = state.ships.filter(s => s.boarded && s.side !== 'player').length
  const sunk = state.ships.filter(s => s.destroyed && s.side === 'enemy').length
  const losses = state.ships.filter(s => s.side === 'player' && s.destroyed).length
  const score = scoreMission({
    missionId: currentMissionId, outcome: win ? 'win' : 'lose', t: state.t,
    objectivesDone: state.objectives.filter(o => o.state === 'done').length,
    ownLosses: losses, prizesTaken: prizes, enemySunk: sunk,
  })
  const story = MISSION_STORY[currentMissionId]
  const epilog = win ? story?.epilog : (story?.epilogLose ?? DEFEAT_GENERIC)
  const scoreHtml = `<div class="score"><div class="stot">Skóre: <b>${score.total}</b></div>`
    + score.breakdown.map(l => `<div class="row"><span>${esc(l.label)}</span><span class="${l.points >= 0 ? 'ok' : 'bad'}">${l.points >= 0 ? '+' : ''}${l.points}</span></div>`).join('')
    + `</div>`
  const el = overlay(
    `<h2 class="${win ? 'win' : 'lose'}">${win ? '⚓ VÍTĚZSTVÍ' : '☠ PORÁŽKA'}</h2>`
    + `<div class="brief">Mise ukončena v čase ${fmtTime(state.t)}.</div>`
    + objs
    + (win ? scoreHtml : '')
    + (epilog ? `<div class="brief story">${esc(epilog)}</div>` : '')
    + `<div style="margin-top:14px"><button id="btn-again">ZNOVU</button> <button id="btn-menu">VÝBĚR MISE</button></div>`)
  el.querySelector('#btn-again')!.addEventListener('click', () => { location.href = `${location.pathname}?mission=${encodeURIComponent(currentMissionId)}` })
  el.querySelector('#btn-menu')!.addEventListener('click', () => { location.href = location.pathname })
}

bridge.onReady = scenario => {
  currentMissionId = scenario.id
  showBriefing(scenario)
  plot.start()
}

bridge.onSnapshot = (state, compression) => {
  audio.onSnapshot(state)
  controller.handleSnapshot(state, compression)
  if (!outcomeShown && state.outcome !== 'running') {
    outcomeShown = true
    controller.setCompression(0)
    showOutcome(state)
  }
}

// start: ?mission=id přeskočí menu, jinak výběr mise
const requested = new URLSearchParams(location.search).get('mission')
if (requested && SCENARIOS[requested]) bridge.start(requested)
else showMissionSelect()
