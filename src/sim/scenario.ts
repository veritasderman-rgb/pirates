/**
 * Scénářový systém: spawn lodí ze specifikace a vyhodnocení triggerů
 * (skriptované zvraty misí). Přeneseno z honorverse, přizpůsobeno moři.
 */
import type {
  Scenario, ShipSpec, ShipState, SimState, Subsystems, TriggerAction, TriggerCondition,
} from './types'
import { dist } from './vec'
import { SHIP_CLASSES } from '../data/defs'

const fullSubsystems = (): Subsystems => ({
  rigging: 1, rudder: 1, gunsPort: 1, gunsStbd: 1, crew: 1,
})

/** Vytvoří kompletní ShipState z definice třídy; id v pořadí pole ships od 1. */
export function spawnShip(state: SimState, spec: ShipSpec): ShipState {
  const def = SHIP_CLASSES[spec.classId]
  if (!def) throw new Error(`Neznámá třída lodi: ${spec.classId}`)
  if (spec.id !== undefined) state.nextId = Math.max(state.nextId, spec.id + 1)

  const ship: ShipState = {
    id: spec.id ?? state.nextId++,
    side: spec.side,
    classId: spec.classId,
    name: spec.name,
    pos: { ...spec.pos },
    vel: { ...spec.vel },
    heading: spec.heading ?? 0,
    sailsUp: spec.sailsUp ?? true,
    trim: spec.trim ?? 0.85,
    oaring: spec.oaring ?? false,
    oarStamina: spec.oarStamina ?? 1,
    nav: spec.nav ?? null,
    tack: spec.tack ?? 1,
    subsystems: spec.subsystems ? { ...fullSubsystems(), ...spec.subsystems } : fullSubsystems(),
    hull: spec.hull ?? def.hullPoints,
    hullMax: def.hullPoints,
    ammo: spec.ammo ?? def.gunsPerBroadside * 24,
    morale: spec.morale ?? 1,
    reloadPort: 0,
    reloadStbd: 0,
    destroyed: false,
    surrendered: false,
    boarded: false,
    doctrine: spec.doctrine ?? 'attack',
    fireControl: spec.fireControl ?? { mode: 'hold', shot: 'round', engaged: false },
    lastSurrenderDemandAt: -1e9,
    desc: spec.desc,
    disguise: spec.disguise,
  }
  state.ships.push(ship)
  return ship
}

const shipById = (state: SimState, id: number): ShipState | undefined =>
  state.ships.find(s => s.id === id)

function condMet(state: SimState, c: TriggerCondition): boolean {
  switch (c.kind) {
    case 'time': return state.t >= (c.t ?? 0)
    case 'flag': return state.flags[c.flag ?? ''] === true
    case 'flagNot': return state.flags[c.flag ?? ''] !== true
    case 'distanceBelow': {
      const a = shipById(state, c.shipA ?? -1), b = shipById(state, c.shipB ?? -1)
      return !!a && !!b && !a.destroyed && !b.destroyed && dist(a.pos, b.pos) < (c.distance ?? 0)
    }
    case 'distanceAbove': {
      const a = shipById(state, c.shipA ?? -1), b = shipById(state, c.shipB ?? -1)
      return !!a && !!b && dist(a.pos, b.pos) > (c.distance ?? 0)
    }
    case 'shipDestroyed': {
      const s = shipById(state, c.shipId ?? -1)
      return !!s && s.destroyed
    }
    case 'shipSurrendered': {
      const s = shipById(state, c.shipId ?? -1)
      return !!s && s.surrendered
    }
    case 'shipBoarded': {
      const s = shipById(state, c.shipId ?? -1)
      return !!s && s.boarded
    }
    case 'aground': return state.flags[`aground:${c.shipId}`] === true
    case 'allDestroyed': {
      // všechny lodě dané strany potopené nebo vzdané (celá flotila padla)
      const ships = state.ships.filter(s => s.side === c.side)
      return ships.length > 0 && ships.every(s => s.destroyed || s.surrendered)
    }
    case 'shipsDestroyedCount': {
      const n = state.ships.filter(s => s.side === c.side && s.destroyed).length
      return n >= (c.count ?? 1)
    }
    case 'classified': {
      const observer = c.side ?? 'player'
      const con = state.contacts[observer].find(k => k.shipId === c.shipId)
      return !!con && con.idQuality >= 1
    }
    case 'hullBelow': {
      const s = shipById(state, c.shipId ?? -1)
      if (!s || s.destroyed) return false
      const hp = SHIP_CLASSES[s.classId]?.hullPoints ?? 100
      return s.hull < (c.fraction ?? 0.5) * hp
    }
    default: return false
  }
}

function runAction(state: SimState, a: TriggerAction): void {
  switch (a.kind) {
    case 'message':
      state.events.push({ t: state.t, kind: 'message', text: a.text ?? '', speaker: a.speaker, slowdown: true })
      break
    case 'comm':
      state.events.push({ t: state.t, kind: 'comm', text: a.text ?? '', speaker: a.speaker, slowdown: true })
      break
    case 'setDoctrine': {
      const s = shipById(state, a.shipId ?? -1)
      if (s) s.doctrine = a.doctrine ?? s.doctrine
      break
    }
    case 'setSide': {
      const s = shipById(state, a.shipId ?? -1)
      if (s && a.side) s.side = a.side
      break
    }
    case 'spawnShip':
      if (a.ship) spawnShip(state, a.ship)
      break
    case 'revealClass': {
      // odhalí skutečnou třídu: smaže masku a zvýší kvalitu kontaktu hráče
      const s = shipById(state, a.shipId ?? -1)
      if (s) s.disguise = undefined
      const con = state.contacts.player.find(k => k.shipId === a.shipId)
      if (con) { con.idQuality = 2; if (s) con.classGuess = s.classId }
      break
    }
    case 'setFlag':
      if (a.flag) state.flags[a.flag] = true
      break
    case 'objectiveComplete': {
      const o = state.objectives.find(x => x.id === a.objectiveId)
      if (o) o.state = 'done'
      state.events.push({ t: state.t, kind: 'objective', text: o?.text ?? '', slowdown: true })
      break
    }
    case 'objectiveFail': {
      const o = state.objectives.find(x => x.id === a.objectiveId)
      if (o) o.state = 'failed'
      break
    }
    case 'addObjective':
      if (a.objectiveId) state.objectives.push({ id: a.objectiveId, text: a.text ?? '', state: 'open' })
      break
    case 'winMission':
      state.outcome = 'win'
      if (a.text) state.events.push({ t: state.t, kind: 'message', text: a.text, slowdown: true })
      break
    case 'loseMission':
      state.outcome = 'lose'
      if (a.text) state.events.push({ t: state.t, kind: 'message', text: a.text, slowdown: true })
      break
  }
}

export function updateTriggers(state: SimState, scenario: Scenario): void {
  for (const trg of scenario.triggers) {
    if (trg.once && trg.fired) continue
    if (trg.conditions.every(c => condMet(state, c))) {
      trg.fired = true
      for (const a of trg.actions) runAction(state, a)
    }
  }
}
