/**
 * Engine — integrace modulů do SimApi.
 * Tick: cooldowny → vítr → fyzika → koule → senzory → AI → palba →
 *   kapitulace → posádka → triggery → čas.
 */
import type { Order, Scenario, ShipState, SimApi, SimState } from './types'
import { globalWind, updateWind } from './wind'
import { updateShipPhysics } from './physics'
import { updateBalls, fireBroadside } from './weapons'
import { updateSensors } from './sensors'
import { updateFireControl } from './firecontrol'
import { updateCrew } from './crew'
import { collectAIOrders } from './ai'
import { demandSurrender, board, updateSurrender } from './surrender'
import { spawnShip, updateTriggers } from './scenario'
import { SIM_DT } from './constants'
import { SCENARIOS } from '../data/missions'

const scenarioCopies = new WeakMap<SimState, Scenario>()
const scenarioSeeds = new WeakMap<SimState, { cfg: Scenario['wind']; seed: number }>()

const copyScenario = (sc: Scenario): Scenario => ({
  ...sc, triggers: sc.triggers.map(t => ({ ...t, fired: false })),
})

function scenarioFor(state: SimState): Scenario | null {
  const cached = scenarioCopies.get(state)
  if (cached) return cached
  const src = SCENARIOS[state.scenarioId]
  if (!src) return null
  const copy = copyScenario(src)
  scenarioCopies.set(state, copy)
  return copy
}

/**
 * Nástupnictví vlajky: pokud strana hráče nemá živou velitelskou loď (doctrine
 * 'player'), ale má jinou živou loď, přenese na ni vlajku (velení). Prohru
 * scénáře řeší podmínka 'allDestroyed' — až když padne CELÁ flotila.
 */
function updatePlayerCommand(state: SimState): void {
  const alive = state.ships.filter(s => s.side === 'player' && !s.destroyed && !s.surrendered)
  if (alive.length === 0) return
  if (alive.some(s => s.doctrine === 'player')) return
  const flag = alive[0]
  flag.doctrine = 'player'
  flag.fireControl.mode = 'auto'
  state.events.push({
    t: state.t, kind: 'comm', speaker: 'admiral', slowdown: true,
    text: `Vlajková loď padla — vlajku přebírá ${flag.name}! Veď nás dál, kapitáne.`,
  })
}

const shipById = (state: SimState, id: number): ShipState | undefined =>
  state.ships.find(s => s.id === id)

const liveTarget = (state: SimState, id: number): ShipState | undefined => {
  const s = shipById(state, id)
  return s && !s.destroyed ? s : undefined
}

function applyOrder(state: SimState, order: Order): void {
  const ship = shipById(state, order.shipId)
  if (!ship || ship.destroyed || ship.surrendered) return

  switch (order.kind) {
    case 'setCourse':
      if (order.append === true && ship.nav?.kind === 'course') {
        ship.nav.then = [...(ship.nav.then ?? []), { ...order.dest }]
        ship.nav.arriveAtRest = order.arriveAtRest
      } else {
        ship.nav = { kind: 'course', dest: { ...order.dest }, arriveAtRest: order.arriveAtRest }
      }
      break
    case 'intercept':
      ship.nav = { kind: 'intercept', targetId: order.targetId }
      break
    case 'setHeading':
      ship.nav = { kind: 'heading', heading: order.heading }
      break
    case 'setSails':
      ship.sailsUp = order.on
      break
    case 'setTrim':
      ship.trim = Math.max(0, Math.min(1, order.trim))
      break
    case 'setOars':
      ship.oaring = order.on
      break
    case 'fireBroadside': {
      const target = liveTarget(state, order.targetId)
      if (target) fireBroadside(state, ship, order.side, target, order.shot)
      break
    }
    case 'setFireControl': {
      const fc = ship.fireControl
      if (order.fc.mode !== undefined) fc.mode = order.fc.mode
      if (order.fc.shot !== undefined) fc.shot = order.fc.shot
      fc.engaged = false
      break
    }
    case 'holdFire':
      ship.fireControl.mode = 'hold'
      ship.fireControl.engaged = false
      break
    case 'demandSurrender':
      demandSurrender(state, ship, order.targetId)
      break
    case 'board':
      board(state, ship, order.targetId)
      break
  }
}

export const sim: SimApi = {
  create(scenario: Scenario): SimState {
    const state: SimState = {
      t: 0,
      rng: { s: scenario.seed >>> 0 },
      nextId: 1,
      wind: globalWind(scenario.wind, scenario.seed, 0),
      islands: (scenario.islands ?? []).map(i => ({ ...i, poly: i.poly.map(p => ({ ...p })) })),
      ships: [],
      balls: [],
      contacts: { player: [], enemy: [], neutral: [] },
      events: [],
      flags: {},
      objectives: scenario.objectives.map(o => ({ ...o })),
      outcome: 'running',
      scenarioId: scenario.id,
    }
    for (const spec of scenario.ships) spawnShip(state, spec)
    scenarioCopies.set(state, copyScenario(scenario))
    scenarioSeeds.set(state, { cfg: scenario.wind, seed: scenario.seed })
    updateSensors(state, 0)
    return state
  },

  tick(state: SimState, dt: number): void {
    if (state.outcome !== 'running') return

    // (1) cooldowny nabíjení
    for (const ship of state.ships) {
      ship.reloadPort = Math.max(0, ship.reloadPort - dt)
      ship.reloadStbd = Math.max(0, ship.reloadStbd - dt)
    }
    // (2) vítr
    const ws = scenarioSeeds.get(state)
    if (ws) updateWind(state, ws.cfg, ws.seed)
    // (3) fyzika lodí
    for (const ship of state.ships) if (!ship.destroyed) updateShipPhysics(state, ship, dt)
    // (4) dělové koule
    updateBalls(state, dt)
    // (5) senzory
    updateSensors(state, dt)
    // (6) AI
    for (const order of collectAIOrders(state)) applyOrder(state, order)
    // (7) řízení palby (AUTO)
    updateFireControl(state)
    // (8) kapitulace
    updateSurrender(state, dt)
    // (8b) nástupnictví vlajky: padne-li velitelská loď hráče, admirál přenese
    // vlajku na jinou loď flotily (prohra až když padne celá flotila)
    updatePlayerCommand(state)
    // (9) posádka
    updateCrew(state, dt)
    // (10) triggery
    const scenario = scenarioFor(state)
    if (scenario) updateTriggers(state, scenario)
    // (11) čas
    state.t += dt
  },

  applyOrder,
}
