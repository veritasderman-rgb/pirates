/**
 * Děla: boční salvy, balistika koulí a zásahy. Tři typy střeliva
 * (round/chain/grape) mapují na subsystémy. Palba podél osy cíle = raking.
 */
import type { Ball, Broadside, ShipState, ShotType, SimState, Vec2 } from './types'
import {
  BALL_SPEED, RELOAD_TIME, GUN_SPREAD_PER_M, ACCURACY_BASE,
  CHAIN_HULL_FACTOR, CHAIN_RIG_FACTOR, GRAPE_HULL_FACTOR, GRAPE_CREW_FACTOR,
  RAKE_BONUS, RAKE_CONE, SUBSYSTEM_SHARE, MORALE_HULL_WEIGHT, MORALE_CREW_WEIGHT,
  DAMAGE_SCALE,
} from './constants'
import { add, angleDiff, angleOf, dist, fromAngle, len, norm, scale, sub, dot } from './vec'
import { SHIP_CLASSES } from '../data/defs'
import { rand } from './rng'
import { blocksLine } from './terrain'

/** poloměr trupu pro zásah (m) — škáluje s tonáží třídy */
export function hitRadius(ship: ShipState): number {
  const def = SHIP_CLASSES[ship.classId]
  return def ? 8 + def.tons / 60 : 12
}

/** směr daného boku ve světě (rad). */
export function broadsideDir(ship: ShipState, side: Broadside): number {
  return side === 'port' ? ship.heading + Math.PI / 2 : ship.heading - Math.PI / 2
}

/** počet funkčních děl na boku. */
export function effectiveGuns(ship: ShipState, side: Broadside): number {
  const def = SHIP_CLASSES[ship.classId]
  if (!def) return 0
  const health = side === 'port' ? ship.subsystems.gunsPort : ship.subsystems.gunsStbd
  return Math.round(def.gunsPerBroadside * health)
}

/** Je cíl v palebném úhlu daného boku a v dostřelu? */
export function canBear(ship: ShipState, side: Broadside, target: ShipState): boolean {
  const def = SHIP_CLASSES[ship.classId]
  if (!def) return false
  const d = dist(ship.pos, target.pos)
  if (d > def.gunRange) return false
  const toT = angleOf(sub(target.pos, ship.pos))
  const arc = Math.abs(angleDiff(toT, broadsideDir(ship, side)))
  return arc < 1.1 // ~63° půlúhel palebného vějíře
}

/** Který bok (pokud vůbec) může na cíl pálit? Preferuje ten s víc děly. */
export function bestBroadside(ship: ShipState, target: ShipState): Broadside | null {
  const p = canBear(ship, 'port', target) && effectiveGuns(ship, 'port') > 0
  const s = canBear(ship, 'stbd', target) && effectiveGuns(ship, 'stbd') > 0
  if (p && s) return effectiveGuns(ship, 'port') >= effectiveGuns(ship, 'stbd') ? 'port' : 'stbd'
  if (p) return 'port'
  if (s) return 'stbd'
  return null
}

/** Iterativní lead: kam mířit, aby koule potkala pohybující se cíl. */
function leadPoint(from: Vec2, target: ShipState): Vec2 {
  let t = dist(from, target.pos) / BALL_SPEED
  for (let i = 0; i < 3; i++) {
    const pred = add(target.pos, scale(target.vel, t))
    t = dist(from, pred) / BALL_SPEED
  }
  return add(target.pos, scale(target.vel, t))
}

/**
 * Odpal boční salvy. Vytvoří koule (jedna na funkční dělo) s rozptylem
 * rostoucím se vzdáleností. Vrací true, když salva vyšla.
 */
export function fireBroadside(
  state: SimState, ship: ShipState, side: Broadside, target: ShipState, shot: ShotType,
): boolean {
  const def = SHIP_CLASSES[ship.classId]
  if (!def || ship.destroyed || ship.surrendered) return false
  const reload = side === 'port' ? ship.reloadPort : ship.reloadStbd
  if (reload > 0) return false
  const guns = effectiveGuns(ship, side)
  if (guns <= 0 || ship.ammo <= 0) return false
  if (!canBear(ship, side, target)) return false

  const d = dist(ship.pos, target.pos)
  const aim = leadPoint(ship.pos, target)
  const baseAng = angleOf(sub(aim, ship.pos))
  // upgrady vlajkové lodi: přesnost stahuje rozptyl, děla zvyšují poškození
  const spread = GUN_SPREAD_PER_M * d / (Math.max(0.3, def.gunnery) * (ship.mods?.acc ?? 1))
  const dmgPer = def.gunDamage * (0.85 + 0.15 * ACCURACY_BASE) * (ship.mods?.gun ?? 1)

  const n = Math.min(guns, ship.ammo)
  for (let i = 0; i < n; i++) {
    const jitter = (rand(state.rng) - 0.5) * 2 * spread
    const ang = baseAng + jitter
    state.balls.push({
      id: state.nextId++, side: ship.side, shot,
      pos: add(ship.pos, scale(fromAngle(broadsideDir(ship, side)), hitRadius(ship) * 0.6)),
      vel: fromAngle(ang, BALL_SPEED),
      targetId: target.id, range: def.gunRange * 1.15, damage: dmgPer,
    })
  }
  ship.ammo -= n
  if (side === 'port') ship.reloadPort = RELOAD_TIME
  else ship.reloadStbd = RELOAD_TIME

  state.events.push({
    t: state.t, kind: 'gunFire', shipId: ship.id, side: ship.side, count: n,
    pos: { ...ship.pos }, dir: broadsideDir(ship, side),
    speaker: ship.doctrine === 'player' ? 'gunner' : undefined,
    text: ship.doctrine === 'player'
      ? `${side === 'port' ? 'Levobok' : 'Pravobok'} — PAL! (${n} děl, ${shotName(shot)})`
      : `${ship.name} pálí boční salvu.`,
  })
  return true
}

const shotName = (s: ShotType): string =>
  s === 'round' ? 'plné koule' : s === 'chain' ? 'řetězové' : 'kartáče'

/** Posun a vyhodnocení všech letících koulí za dt. */
export function updateBalls(state: SimState, dt: number): void {
  const surviving: Ball[] = []
  for (const ball of state.balls) {
    const prev = { ...ball.pos }
    const stepLen = BALL_SPEED * dt
    ball.pos = add(ball.pos, scale(ball.vel, dt))
    ball.range -= stepLen

    // náraz do pevné země?
    if (blocksLine(state, prev, ball.pos)) {
      state.events.push({ t: state.t, kind: 'ballMiss', pos: { ...ball.pos }, side: ball.side, text: '' })
      continue
    }

    // zásah lodi (nejbližší po dráze úseku)
    let hit: ShipState | null = null
    let hitAt = 1
    for (const sh of state.ships) {
      if (sh.destroyed || sh.side === ball.side) continue
      const r = hitRadius(sh)
      const t = segCircleT(prev, ball.pos, sh.pos, r)
      if (t !== null && t < hitAt) { hitAt = t; hit = sh }
    }
    if (hit) {
      applyHit(state, hit, ball, prev)
      continue
    }
    if (ball.range <= 0) {
      state.events.push({ t: state.t, kind: 'ballMiss', pos: { ...ball.pos }, side: ball.side, text: '' })
      continue
    }
    surviving.push(ball)
  }
  state.balls = surviving
}

/** Parametr t∈[0,1] prvního průniku úsečky a→b s kružnicí (střed c, r), nebo null. */
function segCircleT(a: Vec2, b: Vec2, c: Vec2, r: number): number | null {
  const d = sub(b, a)
  const f = sub(a, c)
  const A = dot(d, d)
  if (A === 0) return len(f) <= r ? 0 : null
  const B = 2 * dot(f, d)
  const C = dot(f, f) - r * r
  const disc = B * B - 4 * A * C
  if (disc < 0) return null
  const sq = Math.sqrt(disc)
  const t1 = (-B - sq) / (2 * A)
  const t2 = (-B + sq) / (2 * A)
  if (t1 >= 0 && t1 <= 1) return t1
  if (t2 >= 0 && t2 <= 1) return t2
  if (t1 < 0 && t2 > 1) return 0 // úsečka celá uvnitř
  return null
}

/** Aplikuj zásah koulí na loď: typ střeliva → subsystém, raking bonus, morálka. */
export function applyHit(state: SimState, ship: ShipState, ball: Ball, from: Vec2): void {
  let dmg = ball.damage * DAMAGE_SCALE

  // raking: koule přiletěla podél podélné osy lodi (do přídě/zádě)?
  const incoming = angleOf(sub(ship.pos, from))
  const alongBow = Math.abs(angleDiff(incoming, ship.heading))
  const alongStern = Math.abs(angleDiff(incoming, ship.heading + Math.PI))
  const raked = alongBow < RAKE_CONE || alongStern < RAKE_CONE
  if (raked) dmg *= RAKE_BONUS

  const ss = ship.subsystems
  let hullDmg = dmg
  let evtText = ''
  if (ball.shot === 'chain') {
    hullDmg = dmg * CHAIN_HULL_FACTOR
    ss.rigging = Math.max(0, ss.rigging - (dmg * CHAIN_RIG_FACTOR) / 100)
    evtText = 'ráhnoví'
  } else if (ball.shot === 'grape') {
    hullDmg = dmg * GRAPE_HULL_FACTOR
    ss.crew = Math.max(0, ss.crew - (dmg * GRAPE_CREW_FACTOR) / 100)
    evtText = 'posádka'
  } else {
    // round shot: většina do trupu, část do náhodného subsystému
    const toSub = dmg * SUBSYSTEM_SHARE
    hullDmg = dmg - toSub
    hitRandomSubsystem(state, ship, toSub)
  }

  const before = ship.hull
  ship.hull = Math.max(0, ship.hull - hullDmg)
  const def = SHIP_CLASSES[ship.classId]
  const hp = def?.hullPoints ?? 100

  // morálka klesá se ztrátou trupu a posádky
  ship.morale = Math.max(0, ship.morale
    - (before - ship.hull) / hp * MORALE_HULL_WEIGHT * 0.1
    - (ball.shot === 'grape' ? MORALE_CREW_WEIGHT * 0.02 : 0))

  state.events.push({
    t: state.t, kind: 'ballHit', shipId: ship.id, side: ball.side, pos: { ...ship.pos },
    text: raked ? `${ship.name}: RAKING zásah do ${ball.shot === 'chain' ? 'ráhnoví' : ball.shot === 'grape' ? 'paluby' : 'trupu'}!`
      : evtText ? `${ship.name}: zásah — ${evtText}.` : '',
  })

  if (ship.hull <= 0 && !ship.destroyed) {
    ship.destroyed = true
    state.events.push({
      t: state.t, kind: 'shipDestroyed', shipId: ship.id, side: ship.side, pos: { ...ship.pos },
      slowdown: true,
      text: `${ship.name} se potápí!`,
    })
  }
}

/** Rozdělí subsystémové poškození do náhodně vybraného systému. */
function hitRandomSubsystem(state: SimState, ship: ShipState, dmg: number): void {
  const keys: (keyof ShipState['subsystems'])[] = ['rigging', 'rudder', 'gunsPort', 'gunsStbd', 'crew']
  const k = keys[Math.floor(rand(state.rng) * keys.length)]
  const prev = ship.subsystems[k]
  ship.subsystems[k] = Math.max(0, prev - dmg / 100)
  if (prev > 0.4 && ship.subsystems[k] <= 0.4) {
    state.events.push({
      t: state.t, kind: 'subsystemHit', shipId: ship.id, side: ship.side,
      text: `${ship.name}: ${subName(k)} vyřazeno!`,
    })
  }
}

const subName = (k: string): string => ({
  rigging: 'ráhnoví', rudder: 'kormidlo', gunsPort: 'děla levoboku',
  gunsStbd: 'děla pravoboku', crew: 'posádka',
}[k] ?? k)
