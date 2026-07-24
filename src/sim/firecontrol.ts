/**
 * Řízení palby: lodě v režimu AUTO pálí na nepřítele, na kterého MOHOU nést bok,
 * a přednostně na toho NEJZRANĚNĚJŠÍHO (soustředění palby — flotila dorazí
 * poškozené cíle a nerozmělňuje salvy). Zvoleným střelivem. Nenese-li žádný bok,
 * štípne cíl v ose slabým stíhacím dělem (honička).
 */
import type { ShipState, SimState } from './types'
import { dist } from './vec'
import { bestBroadside, fireBroadside, bestChaser, fireChaser } from './weapons'
import { SHIP_CLASSES } from '../data/defs'
import { hostileTo } from './util'

/** Nejzraněnější hostilní cíl splňující podmínku (při shodě bližší). */
function pickTarget(state: SimState, ship: ShipState, ok: (o: ShipState) => boolean): ShipState | null {
  let target: ShipState | null = null
  let bestHull = Infinity
  let bestDist = Infinity
  for (const other of state.ships) {
    if (other.destroyed || other.surrendered) continue
    if (!hostileTo(ship.side, other.side)) continue
    if (!ok(other)) continue
    const hp = SHIP_CLASSES[other.classId]?.hullPoints ?? 100
    const frac = other.hull / hp
    const d = dist(ship.pos, other.pos)
    if (frac < bestHull - 0.001 || (Math.abs(frac - bestHull) <= 0.001 && d < bestDist)) {
      bestHull = frac; bestDist = d; target = other
    }
  }
  return target
}

export function updateFireControl(state: SimState): void {
  for (const ship of state.ships) {
    if (ship.destroyed || ship.surrendered) continue
    if (ship.fireControl.mode !== 'auto') continue

    // 1) přednost plné boční salvě — vyber cíl JEN mezi těmi, na které nese bok
    const broadTgt = pickTarget(state, ship, o => !!bestBroadside(ship, o))
    if (broadTgt) {
      ship.fireControl.engaged = true
      fireBroadside(state, ship, bestBroadside(ship, broadTgt)!, broadTgt, ship.fireControl.shot)
      continue
    }

    // 2) žádný bok nenese → štípni stíhacím dělem nejzraněnějšího cíle v ose
    const chaseTgt = pickTarget(state, ship, o => !!bestChaser(ship, o))
    if (chaseTgt) {
      ship.fireControl.engaged = true
      fireChaser(state, ship, bestChaser(ship, chaseTgt)!, chaseTgt, ship.fireControl.shot)
    } else {
      ship.fireControl.engaged = false
    }
  }
}
