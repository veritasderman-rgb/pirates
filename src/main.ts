/**
 * Bootstrap UI: bridge → plot → panely → controller. Briefing na start
 * (pauza), výběr misí, win/lose overlay dle outcome.
 */
import { SimBridge } from './worker/bridge'
import { TacticalPlot } from './ui/plot'
import { Plot3D } from './ui/plot3d'
import type { Renderer } from './ui/renderer'
import { Panels, esc, fmtTime, type Hud } from './ui/panels'
import { isMobileUX, MobileHud, TouchInput } from './ui/mobile'
import { UIController } from './ui/input'
import { AudioManager } from './ui/audio'
import { SCENARIOS } from './data/missions'
import { CAMPAIGN_INTRO, DEFEAT_GENERIC, MISSION_STORY } from './data/story'
import { scoreMission } from './sim/score'
import { loadProfile, saveProfile, modsFrom, computeReward, upgradeCost, UPGRADE_DEFS, UP_ORDER, SHIPYARD, shipEntry, shipCondition, isDamaged, repairCost, type UpKey } from './data/profile'
import { CAMPAIGN_NODES, CAMPAIGN_ISLES, isMissionUnlocked, isPaidMission } from './data/campaign'
import { isOwned, applyOwnDevFlag, isDevOwned, saveLicense, STORE_PRICE_LABEL, UNLOCK_PERKS } from './data/entitlement'
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
rBtn.id = 'r-toggle'
rBtn.textContent = use3d ? '2D' : '3D'
rBtn.title = 'Switch renderer (2D Canvas ↔ 3D WebGL)'
rBtn.style.cssText = 'position:absolute;top:6px;right:120px;z-index:9'
rBtn.addEventListener('click', () => {
  localStorage.setItem('r3d', use3d ? '0' : '1')
  location.reload()
})
document.body.appendChild(rBtn)
// na telefonu se aktivuje samostatná dotyková vrstva (infografický HUD),
// jinak klasické desktopové panely. Sim i renderer zůstávají sdílené.
const mobile = isMobileUX()
const hud: Hud = mobile
  ? new MobileHud(a => controller.handleAction(a))
  : new Panels(
    document.getElementById('topbar')!,
    document.getElementById('hud-left')!,
    document.getElementById('hud-right')!,
    document.getElementById('hud-bottom')!,
    document.getElementById('hud-log')!,
    a => controller.handleAction(a),
  )
const controller = new UIController(bridge, plot, hud, canvas)
if (mobile) new TouchInput(canvas, plot)

// kapitánský profil (dublony + upgrady) — nese se mezi misemi (localStorage)
let profile = loadProfile()

// DEV: odemknutí všech misí pro testování. `?unlock=all` zapne (a uloží, takže
// platí i po přenačtení), `?unlock=off` vypne. Neovlivňuje odměny ani postup.
const UNLOCK_KEY = 'pirates.unlockAll'
{
  const u = new URLSearchParams(location.search).get('unlock')
  try {
    if (u === 'all') localStorage.setItem(UNLOCK_KEY, '1')
    else if (u === 'off' || u === '0') localStorage.removeItem(UNLOCK_KEY)
  } catch { /* ignore */ }
}
const allUnlocked = ((): boolean => { try { return localStorage.getItem(UNLOCK_KEY) === '1' } catch { return false } })()

// paywall: jednorázové odemčení celé hry. `?own=1` je vývojářský přepínač pro
// testování placeného obsahu bez platby (obdoba ?unlock=all). DEV odemčení misí
// zároveň uděluje vlastnictví, ať tester může placené mise skutečně hrát.
applyOwnDevFlag(location.search)
const owned = (): boolean => allUnlocked || isOwned()

const startMission = (id: string): void =>
  bridge.start(id, modsFrom(profile.up), profile.flagship, shipCondition(profile, profile.flagship))

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
  side01: 'scene-ambush',
  side02: 'scene-pirate-cove',
}

function showCampaignMap(): void {
  const cleared = new Set(profile.cleared)
  const byId = new Map(CAMPAIGN_NODES.map(n => [n.id, n]))
  const avail = (n: typeof CAMPAIGN_NODES[number]): boolean =>
    allUnlocked || isMissionUnlocked(n.id, profile.cleared)
  // stav uzlu: done → paid (postup OK, ale za paywallem) → open → locked (postup)
  const nodeState = (n: typeof CAMPAIGN_NODES[number]): 'done' | 'paid' | 'open' | 'locked' =>
    cleared.has(n.id) ? 'done'
      : !avail(n) ? 'locked'
      : isPaidMission(n.id) && !owned() ? 'paid'
      : 'open'

  const isles = CAMPAIGN_ISLES.map(i => `<circle cx="${i.x}" cy="${i.y}" r="${i.r}" class="cm-isle"/>`).join('')
  const routes = CAMPAIGN_NODES.filter(n => n.requires).map(n => {
    const a = byId.get(n.requires!)!, b = n
    const st = nodeState(n)
    return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="cm-route ${st}${n.optional ? ' opt' : ''}"/>`
  }).join('')
  let mainNo = 0
  const nodes = CAMPAIGN_NODES.map(n => {
    const sc = SCENARIOS[n.id]; if (!sc) return ''
    const num = n.optional ? '★' : `${++mainNo}`
    const st = nodeState(n)
    const badge = cleared.has(n.id) ? '✔' : st === 'paid' ? '🔒' : num
    // klikací jsou dostupné (open/paid); zamčené postupem ne. Paid vede do storu.
    const attr = st !== 'locked' ? ` data-mission="${esc(n.id)}" data-paid="${st === 'paid' ? '1' : '0'}"` : ''
    return `<g class="cm-node ${st}${n.optional ? ' opt' : ''}"${attr} transform="translate(${n.x},${n.y})">`
      + `<circle r="19" class="cm-c"/><text class="cm-num" y="5">${badge}</text>`
      + `<text class="cm-title" y="37">${esc(sc.title)}</text></g>`
  }).join('')
  // „jsi tady" — první nesplněný dostupný uzel (kam plout dál), jinak poslední
  const next = CAMPAIGN_NODES.find(n => !cleared.has(n.id) && avail(n))
    ?? CAMPAIGN_NODES[CAMPAIGN_NODES.length - 1]
  const marker = `<g transform="translate(${next.x},${next.y - 34})" class="cm-you">`
    + `<text class="cm-you-i" y="0">⛵</text><text class="cm-you-t" y="15">you are here</text></g>`

  const flagName = SHIP_CLASSES[profile.flagship]?.name ?? profile.flagship
  const el = overlay(
    `<h1>PIRATES</h1>`
    + `<div class="brief story">${esc(firstSentence(CAMPAIGN_INTRO))}</div>`
    + `<div class="cm-bar"><span>Treasury: <b>${profile.money} 🪙</b></span>`
    + `<span>Flagship: <b>${esc(flagName)}</b></span>`
    + `<button id="btn-port">🛠 PORT — shipyard &amp; outfitting</button>`
    + (owned() ? '' : `<button id="btn-store" class="cm-buy">🔓 Unlock full game — ${esc(STORE_PRICE_LABEL)}</button>`)
    + `</div>`
    + `<div class="cm-wrap"><svg viewBox="0 0 1000 600" class="cm-map">${isles}${routes}${nodes}${marker}</svg></div>`
    + (allUnlocked ? `<div class="fc-hint" style="color:#e8c874">🔓 DEV: all missions unlocked (append <b>?unlock=off</b> to the URL to restore normal progression).</div>` : '')
    + `<div class="fc-hint">Click a port (node) = set sail on the mission. A cleared mission (✔) unlocks the next. `
    + `Cleared ones can be replayed (smaller reward). At port, buy a new hull or upgrade the one you have.</div>`)
  el.querySelector('.box')!.classList.add('wide')
  el.querySelector('#btn-port')!.addEventListener('click', () => { el.remove(); showOutfitting() })
  el.querySelector('#btn-store')?.addEventListener('click', () => { el.remove(); showStore() })
  el.querySelectorAll<SVGGElement>('g[data-mission]').forEach(g =>
    g.addEventListener('click', () => {
      // placený uzel (za paywallem) vede do storu, ostatní rovnou vyplouvají
      if (g.dataset.paid === '1') { el.remove(); showStore() }
      else { el.remove(); startMission(g.dataset.mission!) }
    }))
}

/**
 * Store — jednorázové odemčení celé hry (kampaň 5+, ★ odbočky, skirmish).
 * Buy → serverless /api/create-checkout → přesměrování na Stripe. Restore →
 * e-mail → /api/restore. Bez /api (lokální preview) tlačítka hlásí chybu; pro
 * test placeného obsahu lokálně použij ?own=1.
 */
function showStore(): void {
  const perks = UNLOCK_PERKS.map(p => `<li>${esc(p)}</li>`).join('')
  const el = overlay(
    `<h1>UNLOCK THE FULL GAME</h1>`
    + `<div class="brief story">Four missions in, the war for the Halcyon Archipelago is only beginning. One payment opens the rest of the campaign and the skirmish sandbox — forever.</div>`
    + `<div class="store-price">${esc(STORE_PRICE_LABEL)} <span class="dim">· one-time</span></div>`
    + `<ul class="store-perks">${perks}</ul>`
    + (isDevOwned() ? `<div class="fc-hint" style="color:#e8c874">🔓 DEV: ownership simulated via <b>?own=1</b> (append <b>?own=off</b> to restore the paywall).</div>` : '')
    + `<div id="store-msg" class="store-msg"></div>`
    + `<div class="store-actions">`
    + `<button id="btn-buy">🔓 Buy — ${esc(STORE_PRICE_LABEL)}</button>`
    + `<button id="btn-restore">Restore purchase</button>`
    + `<button id="btn-store-back">← Back to map</button>`
    + `</div>`)
  const msg = el.querySelector('#store-msg') as HTMLElement
  const setMsg = (t: string, bad = false): void => { msg.textContent = t; msg.className = `store-msg ${bad ? 'bad' : 'ok'}` }

  el.querySelector('#btn-buy')!.addEventListener('click', async () => {
    setMsg('Opening secure checkout…')
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ origin: location.origin, path: location.pathname }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json() as { url?: string }
      if (data.url) location.href = data.url
      else throw new Error('no checkout url')
    } catch {
      setMsg('Checkout is unavailable here (needs the deployed server). Locally, append ?own=1 to test.', true)
    }
  })

  el.querySelector('#btn-restore')!.addEventListener('click', async () => {
    const email = prompt('Enter the email you purchased with:')?.trim()
    if (!email) return
    setMsg('Looking up your purchase…')
    try {
      const res = await fetch('/api/restore', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json() as { token?: string; error?: string }
      if (res.ok && data.token) {
        saveLicense({ token: data.token, email, issuedAt: Date.now() })
        setMsg('Purchase restored — the full game is unlocked!')
        setTimeout(() => { el.remove(); showCampaignMap() }, 900)
      } else {
        setMsg(data.error || 'No purchase found for that email.', true)
      }
    } catch {
      setMsg('Restore is unavailable here (needs the deployed server).', true)
    }
  })

  el.querySelector('#btn-store-back')!.addEventListener('click', () => { el.remove(); showCampaignMap() })
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
      const stats = stat('hull', `${def.hullPoints}`) + stat('guns/side', `${def.gunsPerBroadside}`)
        + stat('range', `${def.gunRange} m`) + (def.canRow ? stat('oars', 'yes') : '')
      const action = active ? `<span class="mdesc ok">⚓ you command this ship</span>`
        : owned ? `<button data-pick="${esc(e.classId)}">Command this ship</button>`
        : `<button data-hull="${esc(e.classId)}" ${canBuy ? '' : 'disabled'}>Buy — ${e.price} 🪙</button>`
      return `<div class="mrow sy-ship ${active ? 'active' : ''}">`
        + `<div class="row"><b>${esc(def.name)}</b>${owned && !active ? ' <span class="dim">(in the shipyard)</span>' : ''}</div>`
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
          : `<button data-buy="${k}" ${can ? '' : 'disabled'}>Buy lvl ${lvl + 1} — ${cost} 🪙</button>`)
        + `</div>`
    }).join('')
    // ---- oprava: vlajková loď se opotřebuje mezi misemi, tady se careenuje ----
    const flagName = SHIP_CLASSES[profile.flagship]?.name ?? profile.flagship
    const cond = shipCondition(profile, profile.flagship)
    const cbar = (label: string, v: number): string => {
      const pct = Math.round(Math.max(0, Math.min(1, v)) * 100)
      const col = v > 0.66 ? '#5cc98a' : v > 0.33 ? '#d8b24f' : '#e0603a'
      return `<div class="cond-row"><span>${label}</span>`
        + `<span class="cond-bar"><i style="width:${pct}%;background:${col}"></i></span></div>`
    }
    const rcost = repairCost(cond)
    const repairHtml = `<h2>Repair &amp; careen</h2>`
      + `<div class="mrow"><div class="row"><b>${esc(flagName)}</b> — condition</div>`
      + cbar('hull', cond.hull) + cbar('rigging', cond.rigging) + cbar('rudder', cond.rudder)
      + cbar('port guns', cond.gunsPort) + cbar('stbd guns', cond.gunsStbd) + cbar('crew', cond.crew)
      + (isDamaged(cond)
        ? `<div class="mdesc">Battle damage carries between missions — patch her up before she sails again.</div>`
          + `<button data-repair="1" ${profile.money >= rcost ? '' : 'disabled'}>Repair to full — ${rcost} 🪙</button>`
        : `<div class="mdesc ok">✔ fully repaired — she's ready for sea</div>`)
      + `</div>`
    box.innerHTML = `<h1>PORT</h1>`
      + `<div class="score"><div class="stot">Treasury: <b>${profile.money} 🪙</b></div></div>`
      + `<div class="hint">Spend doubloons on a <b>stronger hull</b> (shipyard), <b>upgrades</b> for the one you command, or <b>repairs</b> after a hard fight. Upgrades and damage both carry through the campaign.</div>`
      + `<h2>Shipyard — flagship</h2>${ships}`
      + repairHtml
      + `<h2>Flagship outfitting</h2>${rows}`
      + `<div style="margin-top:12px"><button id="btn-back">← BACK TO MAP</button></div>`
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
    box.querySelector<HTMLButtonElement>('button[data-repair]')?.addEventListener('click', () => {
      const cost = repairCost(shipCondition(profile, profile.flagship))
      if (profile.money >= cost) {
        profile.money -= cost; delete profile.condition[profile.flagship]; saveProfile(profile); draw()
      }
    })
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
    + `<div class="hint">Controls: click your own ship = select · click a target = lock on · `
    + `click water = set course · <b>drag = pan the map</b> · wheel = zoom · `
    + `<b>buttons at right (arrows/＋/－/◎) = pan, zoom and centre on ship</b> · `
    + `space = pause · W sails · E oars · Q/R broadside · A auto · 1/2/3 shot type</div>`
    + `<button id="btn-start">SET SAIL</button>`)
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
  // trvalé opotřebení: ulož stav přeživší vlajkové lodi (bojová poškození se
  // nesou do další mise, dokud je hráč v přístavu neopraví). Padne-li loď,
  // stav se nemění — mise je prohra, hráč ji opakuje s dřívějším stavem.
  // v DEV režimu (?unlock=all) neukládej nic do profilu — testovací běhy nesmí
  // změnit skutečný postup, dublony ani opotřebení lodi
  const survivor = state.ships.find(s => s.doctrine === 'player' && !s.destroyed && s.classId === profile.flagship)
  if (survivor && !allUnlocked) {
    const hpFull = survivor.hullMax ?? SHIP_CLASSES[survivor.classId]?.hullPoints ?? 100
    const ss = survivor.subsystems
    profile.condition[profile.flagship] = {
      hull: Math.max(0, Math.min(1, survivor.hull / hpFull)),
      rigging: ss.rigging, rudder: ss.rudder, gunsPort: ss.gunsPort, gunsStbd: ss.gunsStbd, crew: ss.crew,
    }
    saveProfile(profile)
  }
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
    if (!allUnlocked) {
      profile.money += rew.total
      if (!already) profile.cleared.push(currentMissionId)
      saveProfile(profile)
    }
    rewardHtml = `<div class="score"><div class="stot">Plunder: <b>+${rew.total} 🪙</b>`
      + (allUnlocked ? ` <span class="dim">(dev — not saved)</span>` : ` · treasury: ${profile.money} 🪙`) + `</div>`
      + rew.parts.map(p => `<div class="row"><span>${esc(p.label)}</span><span class="ok">${p.coins ? '+' + p.coins : ''}</span></div>`).join('')
      + `</div>` + (allUnlocked ? '' : `<div class="hint">Prizes (captured ships) earn more than sinking — at port, spend doubloons to upgrade your flagship.</div>`)
  }
  const story = MISSION_STORY[currentMissionId]
  const epilog = win ? story?.epilog : (story?.epilogLose ?? DEFEAT_GENERIC)
  const scoreHtml = `<div class="score"><div class="stot">Score: <b>${score.total}</b></div>`
    + score.breakdown.map(l => `<div class="row"><span>${esc(l.label)}</span><span class="${l.points >= 0 ? 'ok' : 'bad'}">${l.points >= 0 ? '+' : ''}${l.points}</span></div>`).join('')
    + `</div>`
  const el = overlay(
    `<h2 class="${win ? 'win' : 'lose'}">${win ? '⚓ VICTORY' : '☠ DEFEAT'}</h2>`
    + `<div class="brief">Mission ended at ${fmtTime(state.t)}.</div>`
    + objs
    + (win ? scoreHtml : '')
    + rewardHtml
    + (epilog ? `<div class="brief story">${esc(epilog)}</div>` : '')
    + `<div style="margin-top:14px"><button id="btn-again">REPLAY</button> `
    + (win ? `<button id="btn-port">🛠 PORT</button> ` : '')
    + `<button id="btn-menu">CAMPAIGN MAP</button></div>`)
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

/**
 * Návrat ze Stripe checkoutu: `?purchase=success&session_id=…` ověří platbu na
 * serveru, uloží licenci a vyčistí URL; `?purchase=cancel` otevře zpět store.
 * Vrací true, když návrat obsloužil (a bootstrap už nespouští nic dalšího).
 */
async function handlePurchaseReturn(): Promise<boolean> {
  const q = new URLSearchParams(location.search)
  const purchase = q.get('purchase')
  if (!purchase) return false
  const clean = (): void => history.replaceState(null, '', location.pathname)
  if (purchase === 'cancel') { clean(); showStore(); return true }
  if (purchase === 'success') {
    const sessionId = q.get('session_id')
    clean()
    const el = overlay(`<h1>UNLOCKING…</h1><div class="brief">Confirming your purchase with the payment provider…</div>`)
    try {
      const res = await fetch('/api/verify-session', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
      const data = await res.json() as { token?: string; email?: string; error?: string }
      el.remove()
      if (res.ok && data.token) {
        saveLicense({ token: data.token, email: data.email, issuedAt: Date.now() })
        const ok = overlay(`<h1 class="win">⚓ THANK YOU</h1><div class="brief story">The full game is unlocked — the whole archipelago is yours to take.</div>`
          + `<div style="margin-top:14px"><button id="btn-go">SET SAIL</button></div>`)
        ok.querySelector('#btn-go')!.addEventListener('click', () => { ok.remove(); showCampaignMap() })
      } else {
        const bad = overlay(`<h1 class="lose">Payment not confirmed</h1><div class="brief">${esc(data.error || 'We could not verify the purchase.')} If you were charged, use “Restore purchase”.</div>`
          + `<div style="margin-top:14px"><button id="btn-go">Back to map</button></div>`)
        bad.querySelector('#btn-go')!.addEventListener('click', () => { bad.remove(); showCampaignMap() })
      }
    } catch {
      el.remove(); showCampaignMap()
    }
    return true
  }
  return false
}

// start: nejdřív případný návrat z platby, pak `?mission=` (respektuje postup
// kampaní i paywall — záložka/URL neobejde zámek), jinak kampaňová mapa
void (async (): Promise<void> => {
  if (await handlePurchaseReturn()) return
  const requested = new URLSearchParams(location.search).get('mission')
  const progressOk = requested && (allUnlocked || isMissionUnlocked(requested, profile.cleared))
  const payOk = requested && (!isPaidMission(requested) || owned())
  if (requested && SCENARIOS[requested] && progressOk && payOk) startMission(requested)
  else showCampaignMap()
})()
