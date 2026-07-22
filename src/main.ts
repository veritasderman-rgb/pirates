/**
 * Bootstrap UI: bridge → plot → panely → controller. Briefing na start
 * (pauza), výběr misí, win/lose overlay dle outcome.
 */
import { SimBridge } from './worker/bridge'
import { TacticalPlot } from './ui/plot'
import { Panels, esc, fmtTime } from './ui/panels'
import { UIController } from './ui/input'
import { AudioManager } from './ui/audio'
import { SCENARIOS } from './data/missions'
import { CAMPAIGN_INTRO, DEFEAT_GENERIC, MISSION_STORY } from './data/story'
import { scoreMission } from './sim/score'
import type { Scenario, SimState } from './sim/types'

const canvas = document.getElementById('plot') as HTMLCanvasElement

const bridge = new SimBridge()
const plot = new TacticalPlot(canvas)
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
window.addEventListener('pointerdown', () => audio.unlock(), { once: false })

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

function showMissionSelect(): void {
  const rows = Object.values(SCENARIOS).map((sc, i) =>
    `<div class="mrow"><button data-mission="${esc(sc.id)}">${i + 1}. ${esc(sc.title)}</button>`
    + `<div class="mdesc">${esc(firstSentence(sc.briefing))}</div></div>`).join('')
  const el = overlay(
    `<h1>PIRATES</h1>`
    + `<div class="brief story">${esc(CAMPAIGN_INTRO)}</div>`
    + `<h2>Výběr mise</h2>${rows}`)
  el.querySelectorAll<HTMLButtonElement>('button[data-mission]').forEach(b =>
    b.addEventListener('click', () => { el.remove(); bridge.start(b.dataset.mission!) }))
}

function showBriefing(sc: Scenario): void {
  const prolog = MISSION_STORY[sc.id]?.prolog
  const el = overlay(
    `<h2>${esc(sc.title)}</h2>`
    + (prolog ? `<div class="brief story">${esc(prolog)}</div>` : '')
    + `<div class="brief">${esc(sc.briefing)}</div>`
    + `<div class="hint">Ovládání: klik na vlastní loď = výběr · klik na cíl = zaměření · `
    + `klik na vodu = kurz · Shift+táhnutí = posun mapy · kolečko = zoom · `
    + `mezerník = pauza · W plachty · E vesla · Q/R boční salva · A auto · 1/2/3 náboj</div>`
    + `<button id="btn-start">VYPLOUT</button>`)
  el.querySelector('#btn-start')!.addEventListener('click', () => {
    el.remove()
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
