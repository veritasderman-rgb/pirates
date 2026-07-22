/**
 * Řízení palby: lodě v režimu AUTO pálí na nepřítele, na kterého MOHOU nést bok,
 * a přednostně na toho NEJZRANĚNĚJŠÍHO (soustředění palby — flotila dorazí
 * poškozené cíle a nerozmělňuje salvy). Zvoleným střelivem.
 */
import type { ShipState, SimState } from './types'
import { dist } from './vec'
import { bestBroadside, fireBroadside } from './weapons'
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
      if (!bestBroadside(ship, other)) continue
      const hp = SHIP_CLASSES[other.classId]?.hullPoints ?? 100
      const frac = other.hull / hp
      const d = dist(ship.pos, other.pos)
      // přednost nejzraněnějšímu (nižší podíl trupu), při shodě bližšímu
      if (frac < bestHull - 0.001 || (Math.abs(frac - bestHull) <= 0.001 && d < bestDist)) {
        bestHull = frac; bestDist = d; target = other
      }
    }
    if (!target) { ship.fireControl.engaged = false; continue }

    const side = bestBroadside(ship, target)
    if (!side) { ship.fireControl.engaged = false; continue }
    ship.fireControl.engaged = true
    fireBroadside(state, ship, side, target, ship.fireControl.shot)
  }
}
