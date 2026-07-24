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
import { loadProfile, saveProfile, modsFrom, computeReward, upgradeCost, UPGRADE_DEFS, UP_ORDER, SHIPYARD, shipEntry, type UpKey } from './data/profile'
import { CAMPAIGN_NODES, CAMPAIGN_ISLES, isMissionUnlocked } from './data/campaign'
import { SHIP_CLASSES } from './data/defs'
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

// kapitánský profil (dublony + upgrady) — nese se mezi misemi (localStorage)
let profile = loadProfile()
const startMission = (id: string): void => bridge.start(id, modsFrom(profile.up), profile.flagship)

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

function showCampaignMap(): void {
  const cleared = new Set(profile.cleared)
  const byId = new Map(CAMPAIGN_NODES.map(n => [n.id, n]))
  const avail = (n: typeof CAMPAIGN_NODES[number]): boolean => isMissionUnlocked(n.id, profile.cleared)

  const isles = CAMPAIGN_ISLES.map(i => `<circle cx="${i.x}" cy="${i.y}" r="${i.r}" class="cm-isle"/>`).join('')
  const routes = CAMPAIGN_NODES.filter(n => n.requires).map(n => {
    const a = byId.get(n.requires!)!, b = n
    const st = cleared.has(n.id) ? 'done' : avail(n) ? 'open' : 'locked'
    return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="cm-route ${st}"/>`
  }).join('')
  const nodes = CAMPAIGN_NODES.map((n, i) => {
    const sc = SCENARIOS[n.id]; if (!sc) return ''
    const st = cleared.has(n.id) ? 'done' : avail(n) ? 'open' : 'locked'
    const badge = cleared.has(n.id) ? '✔' : `${i + 1}`
    const attr = st !== 'locked' ? ` data-mission="${esc(n.id)}"` : ''
    return `<g class="cm-node ${st}"${attr} transform="translate(${n.x},${n.y})">`
      + `<circle r="19" class="cm-c"/><text class="cm-num" y="5">${badge}</text>`
      + `<text class="cm-title" y="37">${esc(sc.title)}</text></g>`
  }).join('')
  // „jsi tady" — první nesplněný dostupný uzel (kam plout dál), jinak poslední
  const next = CAMPAIGN_NODES.find(n => !cleared.has(n.id) && avail(n))
    ?? CAMPAIGN_NODES[CAMPAIGN_NODES.length - 1]
  const marker = `<g transform="translate(${next.x},${next.y - 34})" class="cm-you">`
    + `<text class="cm-you-i" y="0">⛵</text><text class="cm-you-t" y="15">jsi tady</text></g>`

  const flagName = SHIP_CLASSES[profile.flagship]?.name ?? profile.flagship
  const el = overlay(
    `<h1>PIRATES</h1>`
    + `<div class="brief story">${esc(firstSentence(CAMPAIGN_INTRO))}</div>`
    + `<div class="cm-bar"><span>Pokladna: <b>${profile.money} 🪙</b></span>`
    + `<span>Vlajková loď: <b>${esc(flagName)}</b></span>`
    + `<button id="btn-port">🛠 PŘÍSTAV — loděnice &amp; výzbroj</button></div>`
    + `<div class="cm-wrap"><svg viewBox="0 0 1000 600" class="cm-map">${isles}${routes}${nodes}${marker}</svg></div>`
    + `<div class="fc-hint">Klikni na přístav (uzel) = vyplout na misi. Splněná mise (✔) odemkne další. `
    + `Splněné lze opakovat (menší odměna). V přístavu kup nový trup nebo vylepši ten stávající.</div>`)
  el.querySelector('.box')!.classList.add('wide')
  el.querySelector('#btn-port')!.addEventListener('click', () => { el.remove(); showOutfitting() })
  el.querySelectorAll<SVGGElement>('g[data-mission]').forEach(g =>
    g.addEventListener('click', () => { el.remove(); startMission(g.dataset.mission!) }))
}

/** Přístav — nákup trvalých upgradů vlajkové lodi za dublony. */
function showOutfitting(): void {
  const el = overlay('')
  const box = el.querySelector('.box') as HTMLElement
  const stat = (label: string, v: string): string => `<span class="sy-stat">${label} <b>${v}</b></span>`
  const draw = (): void => {
    // ---- loděnice: nákup / výběr trupu vlajkové lodi ----
    const ships = SHIPYARD.map(e => {
      const def = SHIP_CLASSES[e.classId]; if (!def) return ''
      const owned = profile.fleet.includes(e.classId)
      const active = profile.flagship === e.classId
      const canBuy = !owned && profile.money >= e.price
      const stats = stat('trup', `${def.hullPoints}`) + stat('děla/bok', `${def.gunsPerBroadside}`)
        + stat('dostřel', `${def.gunRange} m`) + (def.canRow ? stat('vesla', 'ano') : '')
      const action = active ? `<span class="mdesc ok">⚓ velíš této lodi</span>`
        : owned ? `<button data-pick="${esc(e.classId)}">Velet této lodi</button>`
        : `<button data-hull="${esc(e.classId)}" ${canBuy ? '' : 'disabled'}>Koupit — ${e.price} 🪙</button>`
      return `<div class="mrow sy-ship ${active ? 'active' : ''}">`
        + `<div class="row"><b>${esc(def.name)}</b>${owned && !active ? ' <span class="dim">(v loděnici)</span>' : ''}</div>`
        + `<div class="sy-stats">${stats}</div>`
        + `<div class="mdesc">${esc(e.blurb)}</div>${action}</div>`
    }).join('')
    // ---- vylepšení stávající lodi ----
    const rows = UP_ORDER.map(k => {
      const d = UPGRADE_DEFS[k], lvl = profile.up[k], maxed = lvl >= d.max
      const cost = maxed ? 0 : upgradeCost(k, lvl)
      const can = !maxed && profile.money >= cost
      const pips = '●'.repeat(lvl) + '○'.repeat(d.max - lvl)
      const bonus = Math.round(lvl * d.per * 100)
      return `<div class="mrow"><div class="row"><b>${esc(d.name)}</b> <span class="dim">${pips}${bonus ? ` (+${bonus}%)` : ''}</span></div>`
        + `<div class="mdesc">${esc(d.desc)}</div>`
        + (maxed ? `<div class="mdesc ok">✔ MAX</div>`
          : `<button data-buy="${k}" ${can ? '' : 'disabled'}>Koupit lvl ${lvl + 1} — ${cost} 🪙</button>`)
        + `</div>`
    }).join('')
    box.innerHTML = `<h1>PŘÍSTAV</h1>`
      + `<div class="score"><div class="stot">Pokladna: <b>${profile.money} 🪙</b></div></div>`
      + `<div class="hint">Utrať dublony dvěma směry: kup <b>silnější trup</b> (loděnice) nebo <b>vylepši</b> ten, kterému velíš. Upgrady platí pro aktuální vlajkovou loď a nesou se kampaní.</div>`
      + `<h2>Loděnice — vlajková loď</h2>${ships}`
      + `<h2>Výzbroj vlajkové lodi</h2>${rows}`
      + `<div style="margin-top:12px"><button id="btn-back">← ZPĚT NA MAPU</button></div>`
    box.querySelectorAll<HTMLButtonElement>('button[data-hull]').forEach(b =>
      b.addEventListener('click', () => {
        const c = b.dataset.hull!, e = shipEntry(c)
        if (e && !profile.fleet.includes(c) && profile.money >= e.price) {
          profile.money -= e.price; profile.fleet.push(c); profile.flagship = c; saveProfile(profile); draw()
        }
      }))
    box.querySelectorAll<HTMLButtonElement>('button[data-pick]').forEach(b =>
      b.addEventListener('click', () => {
        const c = b.dataset.pick!
        if (profile.fleet.includes(c)) { profile.flagship = c; saveProfile(profile); draw() }
      }))
    box.querySelectorAll<HTMLButtonElement>('button[data-buy]').forEach(b =>
      b.addEventListener('click', () => {
        const k = b.dataset.buy as UpKey, lvl = profile.up[k], cost = upgradeCost(k, lvl)
        if (lvl < UPGRADE_DEFS[k].max && profile.money >= cost) {
          profile.money -= cost; profile.up[k] = lvl + 1; saveProfile(profile); draw()
        }
      }))
    box.querySelector('#btn-back')!.addEventListener('click', () => { el.remove(); showCampaignMap() })
  }
  draw()
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
  // ekonomika: odměna v dublonech (plná jen při prvním dokončení mise)
  let rewardHtml = ''
  if (win) {
    const already = profile.cleared.includes(currentMissionId)
    const rew = computeReward({
      missionId: currentMissionId, win: true, enemySunk: sunk, prizes,
      objectivesDone: state.objectives.filter(o => o.state === 'done').length,
    }, already)
    profile.money += rew.total
    if (!already) profile.cleared.push(currentMissionId)
    saveProfile(profile)
    rewardHtml = `<div class="score"><div class="stot">Kořist: <b>+${rew.total} 🪙</b> · pokladna: ${profile.money} 🪙</div>`
      + rew.parts.map(p => `<div class="row"><span>${esc(p.label)}</span><span class="ok">${p.coins ? '+' + p.coins : ''}</span></div>`).join('')
      + `</div><div class="hint">Kořist (zajaté lodě) vynáší víc než potopení — v přístavu za dublony vylepši vlajkovou loď.</div>`
  }
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
    + rewardHtml
    + (epilog ? `<div class="brief story">${esc(epilog)}</div>` : '')
    + `<div style="margin-top:14px"><button id="btn-again">ZNOVU</button> `
    + (win ? `<button id="btn-port">🛠 PŘÍSTAV</button> ` : '')
    + `<button id="btn-menu">MAPA KAMPANĚ</button></div>`)
  el.querySelector('#btn-port')?.addEventListener('click', () => { el.remove(); showOutfitting() })
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
// přímý vstup `?mission=` respektuje postup kampaní (záložka/URL neobejde zámek)
if (requested && SCENARIOS[requested] && isMissionUnlocked(requested, profile.cleared)) startMission(requested)
else showCampaignMap()
