/**
 * Řízení palby: lodě v režimu AUTO samy pálí bok, který může nést na
 * nejbližší nepřátelský cíl v dostřelu, zvoleným střelivem.
 */
import type { ShipState, SimState } from './types'
import { dist } from './vec'
import { bestBroadside, canBear, fireBroadside } from './weapons'
import { hostileTo } from './util'

export function updateFireControl(state: SimState): void {
  for (const ship of state.ships) {
    if (ship.destroyed || ship.surrendered) continue
    if (ship.fireControl.mode !== 'auto') continue

    // nejbližší nepřátelská loď, na kterou lze nést
    let target: ShipState | null = null
    let best = Infinity
    for (const other of state.ships) {
      if (other.destroyed || other.surrendered) continue
      if (!hostileTo(ship.side, other.side)) continue
      const d = dist(ship.pos, other.pos)
      if (d < best) { best = d; target = other }
    }
    if (!target) { ship.fireControl.engaged = false; continue }

    const side = bestBroadside(ship, target)
    if (!side) {
      if (ship.fireControl.engaged && canBear(ship, 'port', target)) { /* reloading */ }
      ship.fireControl.engaged = false
      continue
    }
    ship.fireControl.engaged = true
    fireBroadside(state, ship, side, target, ship.fireControl.shot)
  }
}
