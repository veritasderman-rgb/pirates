/**
 * Posádka: polní opravy provizorně vracejí subsystémy do hry (do stropu),
 * morálka se pomalu vzpamatovává mimo palbu.
 */
import type { ShipState, SimState } from './types'
import { REPAIR_RATE, REPAIR_CAP } from './constants'
import { dist } from './vec'
import { hostileTo } from './util'

export function updateCrew(state: SimState, dt: number): void {
  for (const ship of state.ships) {
    if (ship.destroyed || ship.surrendered) continue
    const crew = ship.subsystems.crew
    if (crew <= 0.05) continue
    const rate = REPAIR_RATE * crew * dt

    // provizorní oprava subsystémů do stropu (kromě samotné posádky)
    for (const k of ['rigging', 'rudder', 'gunsPort', 'gunsStbd'] as const) {
      const v = ship.subsystems[k]
      if (v < REPAIR_CAP) ship.subsystems[k] = Math.min(REPAIR_CAP, v + rate)
    }

    // morálka se vzpamatuje, pokud poblíž není nepřítel
    let underThreat = false
    for (const o of state.ships) {
      if (o.destroyed || !hostileTo(ship.side, o.side)) continue
      if (dist(ship.pos, o.pos) < 2500) { underThreat = true; break }
    }
    if (!underThreat && ship.morale < 1) {
      ship.morale = Math.min(1, ship.morale + 0.01 * dt)
    }
  }
}
