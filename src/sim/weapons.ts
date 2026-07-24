/**
 * Děla: boční salvy, balistika koulí a zásahy. Tři typy střeliva
 * (round/chain/grape) mapují na subsystémy. Palba podél osy cíle = raking.
 */
import type { Ball, Broadside, ShipState, ShotType, SimState, Vec2 } from './types'
import {
  BALL_SPEED, RELOAD_TIME, GUN_SPREAD_PER_M, ACCURACY_BASE,
  CHAIN_HULL_FACTOR, CHAIN_RIG_FACTOR, GRAPE_HULL_FACTOR, GRAPE_CREW_FACTOR,
  RAKE_BONUS, RAKE_CONE, SUBSYSTEM_SHARE, MORALE_HULL_WEIGHT, MORALE_CREW_WEIGHT,
  DAMAGE_SCALE, SUBSYSTEM_DISABLED, WEATHER_GAGE_ACC,
  CHASE_CONE, CHASE_RELOAD, CHASE_DMG_FACTOR,
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

export type ChaseEnd = 'bow' | 'stern'

/** Směr stíhacího děla ve světě (rad): příď = kurz, záď = kurz + π. */
export function chaserDir(ship: ShipState, end: ChaseEnd): number {
  return end === 'bow' ? ship.heading : ship.heading + Math.PI
}

/** Počet stíhacích děl (na přídi i zádi). Odvozeno z třídy; pevnosti nemají. */
export function chaseGunCount(ship: ShipState): number {
  const def = SHIP_CLASSES[ship.classId]
  if (!def || def.hullCode === 'FORT') return 0
  if (def.chaseGuns !== undefined) return def.chaseGuns
  return def.gunsPerBroadside >= 6 ? 2 : def.gunsPerBroadside >= 3 ? 1 : 0
}

/** Nese stíhací dělo (příď/záď) na cíl a je v dostřelu? Úzký kužel podél osy. */
export function canChase(ship: ShipState, end: ChaseEnd, target: ShipState): boolean {
  const def = SHIP_CLASSES[ship.classId]
  if (!def) return false
  if (dist(ship.pos, target.pos) > def.gunRange) return false
  const toT = angleOf(sub(target.pos, ship.pos))
  return Math.abs(angleDiff(toT, chaserDir(ship, end))) < CHASE_CONE
}

/** Který konec (pokud vůbec) může stíhacím dělem pálit na cíl? Přednost přídi. */
export function bestChaser(ship: ShipState, target: ShipState): ChaseEnd | null {
  if (chaseGunCount(ship) <= 0) return null
  if (canChase(ship, 'bow', target)) return 'bow'
  if (canChase(ship, 'stern', target)) return 'stern'
  return null
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

/**
 * Návětrná výhoda (weather gage) 0..1: jak přesně je střelec v návětří cíle.
 * 1 = vítr fouká přímo od střelce k cíli (kouř letí na nepřítele, čistý výhled),
 * 0 = střelec je v závětří (kouř a spršky do očí). Pro bonus přesnosti i UI.
 */
export function weatherGage(from: Vec2, target: Vec2, windDir: number): number {
  const toTarget = angleOf(sub(target, from))
  return Math.max(0, Math.cos(angleDiff(toTarget, windDir)))
}

/**
 * Je linie střelec→cíl podél podélné osy cíle (raking)? Čistá geometrie pro
 * UI telegraf — neřeší, jestli zrovna nese bok. Shoduje se s testem v applyHit.
 */
export function rakeAvailable(from: ShipState, target: ShipState): boolean {
  const dir = angleOf(sub(target.pos, from.pos))
  const alongBow = Math.abs(angleDiff(dir, target.heading))
  const alongStern = Math.abs(angleDiff(dir, target.heading + Math.PI))
  return alongBow < RAKE_CONE || alongStern < RAKE_CONE
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
  // upgrady vlajkové lodi: přesnost stahuje rozptyl, děla zvyšují poškození.
  // weather gage: pálíš-li z návětří, kouř letí na nepřítele a salva sedí přesněji
  const gage = weatherGage(ship.pos, target.pos, state.wind.dir)
  const spread = GUN_SPREAD_PER_M * d
    / (Math.max(0.3, def.gunnery) * (ship.mods?.acc ?? 1) * (1 + WEATHER_GAGE_ACC * gage))
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
      ? `${side === 'port' ? 'Port' : 'Starboard'} — FIRE! (${n} guns, ${shotName(shot)})`
      : `${ship.name} fires a broadside.`,
  })
  return true
}

const shotName = (s: ShotType): string =>
  s === 'round' ? 'round shot' : s === 'chain' ? 'chain shot' : 'grape shot'

/**
 * Stíhací dělo (příď/záď): pár lehkých děl mířících podél osy. Slabé oproti
 * boční salvě, ale nemusíš kvůli němu natáčet bok — při honičce jím štípeš cíl
 * před sebou. Vrací true, pokud vypálil.
 */
export function fireChaser(
  state: SimState, ship: ShipState, end: ChaseEnd, target: ShipState, shot: ShotType,
): boolean {
  const def = SHIP_CLASSES[ship.classId]
  if (!def || ship.destroyed || ship.surrendered) return false
  const reload = end === 'bow' ? ship.reloadBow : ship.reloadStern
  if (reload > 0) return false
  const guns = chaseGunCount(ship)
  if (guns <= 0 || ship.ammo <= 0) return false
  if (!canChase(ship, end, target)) return false

  const d = dist(ship.pos, target.pos)
  const aim = leadPoint(ship.pos, target)
  const baseAng = angleOf(sub(aim, ship.pos))
  const gage = weatherGage(ship.pos, target.pos, state.wind.dir)
  const spread = GUN_SPREAD_PER_M * d
    / (Math.max(0.3, def.gunnery) * (ship.mods?.acc ?? 1) * (1 + WEATHER_GAGE_ACC * gage))
  const dmgPer = def.gunDamage * CHASE_DMG_FACTOR * (0.85 + 0.15 * ACCURACY_BASE) * (ship.mods?.gun ?? 1)

  const dir = chaserDir(ship, end)
  const n = Math.min(guns, ship.ammo)
  for (let i = 0; i < n; i++) {
    const jitter = (rand(state.rng) - 0.5) * 2 * spread
    state.balls.push({
      id: state.nextId++, side: ship.side, shot,
      pos: add(ship.pos, scale(fromAngle(dir), hitRadius(ship) * 0.9)),
      vel: fromAngle(baseAng + jitter, BALL_SPEED),
      targetId: target.id, range: def.gunRange * 1.1, damage: dmgPer,
    })
  }
  ship.ammo -= n
  if (end === 'bow') ship.reloadBow = CHASE_RELOAD
  else ship.reloadStern = CHASE_RELOAD

  state.events.push({
    t: state.t, kind: 'gunFire', shipId: ship.id, side: ship.side, count: n,
    pos: { ...ship.pos }, dir,
    speaker: ship.doctrine === 'player' ? 'gunner' : undefined,
    text: ship.doctrine === 'player'
      ? `${end === 'bow' ? 'Bow' : 'Stern'} chaser — fire! (${n} guns, ${shotName(shot)})`
      : '',
  })
  return true
}

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

  // zásah přiřkneme hráčovu tahu, pálil-li hráč — pak z něj plynou „hlášky"
  const byPlayer = ball.side === 'player'

  let hullDmg = dmg
  if (ball.shot === 'chain') {
    hullDmg = dmg * CHAIN_HULL_FACTOR
    damageSubsystem(state, ship, 'rigging', dmg * CHAIN_RIG_FACTOR, byPlayer)
  } else if (ball.shot === 'grape') {
    hullDmg = dmg * GRAPE_HULL_FACTOR
    damageSubsystem(state, ship, 'crew', dmg * GRAPE_CREW_FACTOR, byPlayer)
  } else {
    // round shot: většina do trupu, část do náhodného subsystému
    const toSub = dmg * SUBSYSTEM_SHARE
    hullDmg = dmg - toSub
    hitRandomSubsystem(state, ship, toSub, byPlayer)
  }

  const before = ship.hull
  ship.hull = Math.max(0, ship.hull - hullDmg)
  const def = SHIP_CLASSES[ship.classId]
  const hp = def?.hullPoints ?? 100

  // morálka klesá se ztrátou trupu a posádky
  ship.morale = Math.max(0, ship.morale
    - (before - ship.hull) / hp * MORALE_HULL_WEIGHT * 0.1
    - (ball.shot === 'grape' ? MORALE_CREW_WEIGHT * 0.02 : 0))

  // vizuální zásah (kouř/tříska na plotu) — text nese samostatná hláška níže
  state.events.push({
    t: state.t, kind: 'ballHit', shipId: ship.id, side: ball.side, pos: { ...ship.pos }, text: '',
  })

  // raking = a deliberate devastating manoeuvre → loud callout credited to the firer
  if (raked) {
    const zone = alongBow < alongStern ? 'bow' : 'stern'
    if (byPlayer) {
      state.events.push({
        t: state.t, kind: 'comm', shipId: ship.id, side: 'player', speaker: 'gunner',
        slowdown: true, pos: { ...ship.pos },
        text: `RAKING! A raking broadside tore ${ship.name} from ${zone} to stern!`,
      })
    } else if (ship.doctrine === 'player') {
      state.events.push({
        t: state.t, kind: 'comm', shipId: ship.id, side: ship.side, speaker: 'mate',
        slowdown: true, pos: { ...ship.pos },
        text: `They're raking us end to end — ${ship.name} is groaning! Turn your bow out of the line.`,
      })
    }
  }

  if (ship.hull <= 0 && !ship.destroyed) {
    ship.destroyed = true
    state.events.push({
      t: state.t, kind: 'shipDestroyed', shipId: ship.id, side: ship.side, pos: { ...ship.pos },
      slowdown: true,
      text: `${ship.name} is going down!`,
    })
  }
}

/** Rozdělí subsystémové poškození do náhodně vybraného systému. */
function hitRandomSubsystem(state: SimState, ship: ShipState, dmg: number, byPlayer: boolean): void {
  const keys: (keyof ShipState['subsystems'])[] = ['rigging', 'rudder', 'gunsPort', 'gunsStbd', 'crew']
  const k = keys[Math.floor(rand(state.rng) * keys.length)]
  damageSubsystem(state, ship, k, dmg, byPlayer)
}

/**
 * Ubere subsystému poškození a při překročení prahu „vyřazení" vyšle hlášku.
 * Pálil-li hráč, hláška je hlasitá a přiřkne výsledek jeho tahu; jinak strohý
 * `subsystemHit`. Práh se hlásí jen JEDNOU (hrana), takže žádný spam.
 */
function damageSubsystem(
  state: SimState, ship: ShipState, k: keyof ShipState['subsystems'], dmg: number, byPlayer: boolean,
): void {
  const prev = ship.subsystems[k]
  if (prev <= 0) return
  ship.subsystems[k] = Math.max(0, prev - dmg / 100)
  if (prev > SUBSYSTEM_DISABLED && ship.subsystems[k] <= SUBSYSTEM_DISABLED) {
    if (byPlayer) {
      state.events.push({
        t: state.t, kind: 'comm', shipId: ship.id, side: 'player', speaker: 'gunner',
        slowdown: true, pos: { ...ship.pos }, text: disableCallout(ship.name, k),
      })
    } else {
      state.events.push({
        t: state.t, kind: 'subsystemHit', shipId: ship.id, side: ship.side, pos: { ...ship.pos },
        text: `${ship.name}: ${subName(k)} knocked out!`,
      })
    }
  }
}

const subName = (k: string): string => ({
  rigging: 'rigging', rudder: 'rudder', gunsPort: 'port guns',
  gunsStbd: 'starboard guns', crew: 'crew',
}[k] ?? k)

/** Callouts crediting the player's hit with a concrete consequence (legibility). */
const disableCallout = (name: string, k: string): string => ({
  rudder: `${name}: rudder shot away — she can't steer any more!`,
  rigging: `${name}: rigging in tatters — she's losing speed, we're catching her!`,
  gunsPort: `${name}: port guns silenced!`,
  gunsStbd: `${name}: starboard guns silenced!`,
  crew: `${name}: crew decimated — board her now!`,
}[k] ?? `${name}: ${subName(k)} knocked out!`)
