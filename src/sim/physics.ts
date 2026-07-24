/**
 * Fyzika lodí: autopilot (kurz + křižování proti větru), otáčení se
 * steerage way, dopředný tah (plachty + vesla), boční odpor kýlu, integrace
 * a kolize s terénem. Jednotky m, s, m/s. Úhly rad.
 */
import type { ShipState, SimState, Vec2 } from './types'
import {
  ARRIVE_DIST, ARRIVE_SPEED, DEFAULT_HULL_DRAG, LATERAL_DRAG, SHIP_MAX_SPEED,
  STEER_MIN_FACTOR, STEER_SPEED, TACK_ANGLE_DEG, NO_GO_DEG,
  OAR_STAMINA_DRAIN, OAR_STAMINA_RECOVER, AGROUND_DAMAGE,
} from './constants'
import {
  add, angleDiff, angleOf, dot, fromAngle, len, normAngle, scale, sub,
} from './vec'
import { SHIP_CLASSES } from '../data/defs'
import { sailThrustAccel, oarThrustAccel } from './sail'
import { groundingAt, shoreRepulsion } from './terrain'
import { windAt } from './wind'

const TACK_RAD = (TACK_ANGLE_DEG * Math.PI) / 180
/** korridor kolem laylinie, ve kterém se drží aktuální hala (m) */
const TACK_CORRIDOR = 150

/**
 * Žádaný heading z nav plánu, včetně křižování: leží-li cíl v no-go zóně
 * proti větru, vrátí close-hauled kurz na té hale, která přibližuje k cíli.
 */
export function desiredHeading(state: SimState, ship: ShipState): number | null {
  const nav = ship.nav
  if (!nav) return null
  if (nav.kind === 'heading') return nav.heading

  let dest: Vec2
  if (nav.kind === 'intercept') {
    const target = state.ships.find(s => s.id === nav.targetId && !s.destroyed)
    if (!target) return null
    // jednoduchý lead: miř na predikovanou pozici cíle
    const rel = sub(target.pos, ship.pos)
    const closing = Math.max(1, len(ship.vel))
    const tLead = len(rel) / (closing + 4)
    dest = add(target.pos, scale(target.vel, tLead))
  } else {
    dest = nav.dest
  }

  const toDest = sub(dest, ship.pos)
  const d = len(toDest)
  const arriveAtRest = nav.kind === 'course' && nav.arriveAtRest
  if (d < ARRIVE_DIST && (!arriveAtRest || len(ship.vel) < ARRIVE_SPEED)) {
    return null
  }
  const bearing = angleOf(toDest)

  // v no-go zóně proti větru? pak křižovat
  const windFrom = state.wind.dir + Math.PI
  const off = Math.abs(angleDiff(bearing, windFrom))
  if ((off * 180) / Math.PI >= NO_GO_DEG) return bearing

  // beating to windward: vyber halu, drž korridor kolem laylinie
  const vAxis = fromAngle(windFrom + Math.PI / 2) // kolmo na osu větru
  const latOff = dot(toDest, vAxis)
  if (Math.abs(latOff) > TACK_CORRIDOR) ship.tack = latOff > 0 ? 1 : -1
  return normAngle(windFrom + ship.tack * TACK_RAD)
}

/**
 * Kompletní fyzikální krok lodi: waypointy → autopilot → otáčení → tah →
 * odpor → integrace → kolize s terénem → stamina vesel.
 */
export function updateShipPhysics(state: SimState, ship: ShipState, dt: number): void {
  if (ship.destroyed) return
  const def = SHIP_CLASSES[ship.classId]
  if (!def) return

  // (0) fronta waypointů: po dosažení dest posun na další
  const nav = ship.nav
  if (nav?.kind === 'course' && nav.then && nav.then.length > 0) {
    const dArr = Math.max(ARRIVE_DIST, len(ship.vel) * dt * 3)
    if (len(sub(nav.dest, ship.pos)) < dArr) {
      nav.dest = nav.then.shift() as Vec2
    }
  }

  // (1) autopilot
  let want = desiredHeading(state, ship)
  // vyhýbání břehu má přednost (jemné odstrčení kurzu)
  const rep = shoreRepulsion(state, ship.pos, def.draft * 30 + 120)
  if (rep) {
    const avoid = angleOf(rep)
    want = want === null ? avoid : blendAngle(want, avoid, len(rep) * 0.7)
  }

  // (2) otáčení k žádanému headingu — potřebuje steerage way (rychlost/vesla)
  if (want !== null) {
    const speed = len(ship.vel)
    let steer = Math.max(STEER_MIN_FACTOR, Math.min(1, speed / STEER_SPEED))
    if (ship.oaring && def.canRow) steer = Math.max(steer, 0.6)
    const rate = def.turnRate * ship.subsystems.rudder * steer
    const diff = angleDiff(want, ship.heading)
    const maxTurn = rate * dt
    ship.heading = Math.abs(diff) <= maxTurn ? want : normAngle(ship.heading + Math.sign(diff) * maxTurn)
  }

  // (3) dopředný tah: plachty + vesla, podél přídě.
  // LOKÁLNÍ vítr (poryvy + závětří ostrovů) — v závětří slábne tah, ne jen kresba.
  const localWind = windAt(state, ship.pos)
  const aSail = sailThrustAccel(ship, def, localWind)
  const aOar = oarThrustAccel(ship, def)
  // upgrade rychlosti (měděné dno) zvyšuje tah vlajkové lodi
  const aFwd = (aSail + aOar) * (ship.mods?.speed ?? 1)
  const fwdDir = fromAngle(ship.heading)

  // (4) rozklad rychlosti na dopřednou a boční složku (kýl silně brzdí boční)
  const fwdComp = dot(ship.vel, fwdDir)
  const latDir = { x: -fwdDir.y, y: fwdDir.x }
  const latComp = dot(ship.vel, latDir)
  const hullDrag = def.hullDrag || DEFAULT_HULL_DRAG
  let newFwd = fwdComp + (aFwd - hullDrag * fwdComp) * dt
  let newLat = latComp - LATERAL_DRAG * latComp * dt
  if (newFwd < 0 && aFwd === 0) newFwd = Math.max(newFwd, fwdComp) // netlač dozadu

  ship.vel = add(scale(fwdDir, newFwd), scale(latDir, newLat))
  const sp = len(ship.vel)
  if (sp > SHIP_MAX_SPEED) ship.vel = scale(ship.vel, SHIP_MAX_SPEED / sp)

  // (5) integrace + kolize s terénem (pobřežní pevnosti stojí na břehu —
  // terénní kolize se jich netýká, jinak by se „potápěly" na vlastním ostrově)
  const prev = { ...ship.pos }
  ship.pos = add(ship.pos, scale(ship.vel, dt))
  const isl = def.hullCode === 'FORT' ? null : groundingAt(state, ship, ship.pos)
  if (isl) {
    ship.pos = { ...prev }
    ship.vel = scale(ship.vel, 0.1)
    ship.hull = Math.max(0, ship.hull - AGROUND_DAMAGE)
    // trvalý náraz může loď potopit — pak ji vyřaď a ohlaš (jinak triggery
    // typu „hráč potopen" na terénní poškození nezareagují)
    if (ship.hull <= 0 && !ship.destroyed) {
      ship.destroyed = true
      state.events.push({
        t: state.t, kind: 'shipDestroyed', shipId: ship.id, side: ship.side,
        pos: { ...ship.pos }, slowdown: true,
        text: `${ship.name} se roztříštila na ${isl.kind === 'reef' ? 'útesu' : 'mělčině'}!`,
      })
      return
    }
    const key = `aground:${ship.id}`
    if (!state.flags[key]) {
      state.flags[key] = true
      state.events.push({
        t: state.t, kind: 'aground', shipId: ship.id, side: ship.side,
        pos: { ...ship.pos }, slowdown: ship.doctrine === 'player',
        speaker: ship.doctrine === 'player' ? 'bosun' : undefined,
        text: ship.doctrine === 'player'
          ? `Najeli jsme na ${isl.kind === 'reef' ? 'útes' : 'mělčinu'}! Zpětný vítr do plachet, dostat nás z toho!`
          : `${ship.name} uvázla na mělčině.`,
      })
    }
  } else {
    state.flags[`aground:${ship.id}`] = false
  }

  // (6) stamina vesel
  if (ship.oaring && def.canRow) {
    ship.oarStamina = Math.max(0, ship.oarStamina - OAR_STAMINA_DRAIN * dt)
  } else {
    ship.oarStamina = Math.min(1, ship.oarStamina + OAR_STAMINA_RECOVER * dt)
  }
}

/** Míchání dvou úhlů s vahou w∈[0,1] přikloněnou k b. */
function blendAngle(a: number, b: number, w: number): number {
  const k = Math.max(0, Math.min(1, w))
  return normAngle(a + angleDiff(b, a) * k)
}

/**
 * Predikce dráhy lodi (pro UI): duch se prožene stejnou fyzikou, ostatní
 * lodě balisticky. Čistá funkce — nic nemutuje mimo lokální kopie.
 */
export function predictPath(state: SimState, ship: ShipState, duration = 40, step = 1): Vec2[] {
  const ghost: ShipState = {
    ...ship, pos: { ...ship.pos }, vel: { ...ship.vel },
    subsystems: { ...ship.subsystems },
    nav: ship.nav ? (JSON.parse(JSON.stringify(ship.nav)) as ShipState['nav']) : null,
  }
  const gs = {
    ...state,
    ships: state.ships.map(s => s.id === ship.id ? ghost : { ...s, pos: { ...s.pos }, vel: { ...s.vel } }),
  } as SimState
  const pts: Vec2[] = []
  const n = Math.ceil(duration / step)
  for (let i = 0; i < n; i++) {
    for (const s of gs.ships) {
      if (s === ghost || s.destroyed) continue
      s.pos = add(s.pos, scale(s.vel, step))
    }
    updateShipPhysics(gs, ghost, step)
    pts.push({ x: ghost.pos.x, y: ghost.pos.y })
  }
  return pts
}
