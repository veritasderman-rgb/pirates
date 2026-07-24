/**
 * Řízení palby: lodě v režimu AUTO pálí na nepřítele, na kterého MOHOU nést bok,
 * a přednostně na toho NEJZRANĚNĚJŠÍHO (soustředění palby — flotila dorazí
 * poškozené cíle a nerozmělňuje salvy). Zvoleným střelivem.
 */
import type { ShipState, SimState } from './types'
import { dist } from './vec'
import { bestBroadside, fireBroadside, bestChaser, fireChaser } from './weapons'
import { SHIP_CLASSES } from '../data/defs'
import { hostileTo } from './util'

export function updateFireControl(state: SimState): void {
  for (const ship of state.ships) {
    if (ship.destroyed || ship.surrendered) continue
    if (ship.fireControl.mode !== 'auto') continue

    // kandidáti: nepřátelé, na které lze právě nést bok
    let target: ShipState | null = null
    let bestHull = Infinity
    let bestDist = Infinity
    for (const other of state.ships) {
      if (other.destroyed || other.surrendered) continue
      if (!hostileTo(ship.side, other.side)) continue
      // kandidát, na kterého lze nést bok NEBO aspoň stíhací dělo (honička)
      if (!bestBroadside(ship, other) && !bestChaser(ship, other)) continue
      const hp = SHIP_CLASSES[other.classId]?.hullPoints ?? 100
      const frac = other.hull / hp
      const d = dist(ship.pos, other.pos)
      // přednost nejzraněnějšímu (nižší podíl trupu), při shodě bližšímu
      if (frac < bestHull - 0.001 || (Math.abs(frac - bestHull) <= 0.001 && d < bestDist)) {
        bestHull = frac; bestDist = d; target = other
      }
    }
    if (!target) { ship.fireControl.engaged = false; continue }

    // přednost plné boční salvě; nenese-li bok, aspoň štípni stíhacím dělem
    const side = bestBroadside(ship, target)
    ship.fireControl.engaged = true
    if (side) {
      fireBroadside(state, ship, side, target, ship.fireControl.shot)
    } else {
      const end = bestChaser(ship, target)
      if (end) fireChaser(state, ship, end, target, ship.fireControl.shot)
      else ship.fireControl.engaged = false
    }
  }
}
