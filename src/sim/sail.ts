/**
 * Model plavby: převod větru na dopředný tah podle bodu plavby (points of
 * sail) + veslový tah. Čisté funkce — testovatelné, sim je volá z physics.
 */
import type { ShipClassDef, ShipState, Wind } from './types'
import { angleDiff } from './vec'
import {
  POINTS_OF_SAIL, SAIL_THRUST_K, WIND_REF_SPEED, WIND_SPEED_EXP,
  WIND_FACTOR_CAP, NO_GO_DEG,
} from './constants'

/** Násobič tahu podle síly větru (roste, se stropem). */
export function windFactor(speed: number): number {
  const f = Math.pow(Math.max(0, speed) / WIND_REF_SPEED, WIND_SPEED_EXP)
  return Math.min(WIND_FACTOR_CAP, f)
}

/**
 * Úhel přídě od směru, ODKUD vítr vane (rad, 0..π). 0 = přímo do větru
 * (no-go), π = přímo po větru (running). Wind.dir = kam vítr vane.
 */
export function offWindAngle(heading: number, wind: Wind): number {
  const windFrom = wind.dir + Math.PI
  return Math.abs(angleDiff(heading, windFrom))
}

/** Efektivita plachet dle bodu plavby (lineární interpolace z tabulky). */
export function sailEfficiency(offWindRad: number): number {
  const deg = (offWindRad * 180) / Math.PI
  const t = POINTS_OF_SAIL
  if (deg <= t[0][0]) return t[0][1]
  for (let i = 1; i < t.length; i++) {
    if (deg <= t[i][0]) {
      const [d0, e0] = t[i - 1]
      const [d1, e1] = t[i]
      const k = (deg - d0) / (d1 - d0)
      return e0 + (e1 - e0) * k
    }
  }
  return t[t.length - 1][1]
}

/** Je heading v no-go zóně (nedá se plout přímo, nutno křižovat/veslovat)? */
export function inNoGo(offWindRad: number): boolean {
  return (offWindRad * 180) / Math.PI < NO_GO_DEG
}

/**
 * Dopředné zrychlení z plachet (m/s²). Nula, když plachty svinuté nebo
 * v no-go zóně. Škáluje plocha plachet, síla větru, bod plavby, trim
 * a zdraví ráhnoví.
 */
export function sailThrustAccel(ship: ShipState, def: ShipClassDef, wind: Wind): number {
  if (!ship.sailsUp) return 0
  const off = offWindAngle(ship.heading, wind)
  const eff = sailEfficiency(off)
  if (eff <= 0) return 0
  return SAIL_THRUST_K * def.sailArea * windFactor(wind.speed)
    * eff * ship.trim * ship.subsystems.rigging
}

/**
 * Dopředné zrychlení z vesel (m/s²) — nezávislé na větru. Nula, když loď
 * nevesluje, neumí veslovat, nebo je bez staminy/posádky.
 */
export function oarThrustAccel(ship: ShipState, def: ShipClassDef): number {
  if (!ship.oaring || !def.canRow) return 0
  return def.oarThrust * ship.subsystems.crew * ship.oarStamina
}
