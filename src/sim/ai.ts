/**
 * Taktická AI: věrohodné doktríny (útok / útěk / kotva / pevnost). Vrací
 * rozkazy, NEaplikuje je (to dělá engine přes applyOrder). Vítr řeší fyzika
 * (autopilot sám křižuje) — AI jen volí cíl a kurz.
 */
import type { Contact, Order, ShipState, SimState, Vec2 } from './types'
import { add, angleOf, dist, fromAngle, norm, scale, sub } from './vec'
import { SHIP_CLASSES } from '../data/defs'
import { hostileTo } from './util'

const estPos = (c: Contact): Vec2 => add(c.pos, scale(c.vel, c.age))

function nearestHostile(state: ShipState, contacts: Contact[], side: SimState['ships'][0]['side']): { c: Contact; d: number } | null {
  let best: { c: Contact; d: number } | null = null
  for (const c of contacts) {
    const d = dist(state.pos, estPos(c))
    if (!best || d < best.d) best = { c, d }
  }
  return best
}

export function collectAIOrders(state: SimState): Order[] {
  const orders: Order[] = []
  for (const ship of state.ships) {
    if (ship.destroyed || ship.surrendered) continue
    const doc = ship.doctrine
    if (doc === 'player' || doc === 'surrendered') continue

    const contacts = state.contacts[ship.side] ?? []
    const near = nearestHostile(ship, contacts, ship.side)

    switch (doc) {
      case 'buoy':
      case 'anchor':
        if (ship.sailsUp) orders.push({ kind: 'setSails', shipId: ship.id, on: false })
        break

      case 'transit':
        // pluje svůj nastavený kurz a nevšímá si nepřítele (kurýr, doprava) —
        // nezahazuje nav, takže termín/úniková podmínka scénáře drží
        if (!ship.sailsUp) orders.push({ kind: 'setSails', shipId: ship.id, on: true })
        if (ship.trim < 1) orders.push({ kind: 'setTrim', shipId: ship.id, trim: 1 })
        break

      case 'fort':
        // statická baterie: jen pálí, když má na koho
        if (ship.fireControl.mode !== 'auto') {
          orders.push({ kind: 'setFireControl', shipId: ship.id, fc: { mode: 'auto', shot: 'round' } })
        }
        break

      case 'runner':
      case 'merchant':
      case 'freighter': {
        // útěk: pryč od nejbližšího nepřítele (fyzika případně křižuje)
        if (!ship.sailsUp) orders.push({ kind: 'setSails', shipId: ship.id, on: true })
        if (ship.trim < 1) orders.push({ kind: 'setTrim', shipId: ship.id, trim: 1 })
        if (near) {
          const away = norm(sub(ship.pos, estPos(near.c)))
          const dest = add(ship.pos, scale(away, 6000))
          orders.push({ kind: 'setCourse', shipId: ship.id, dest, arriveAtRest: false })
        }
        break
      }

      case 'attack':
      case 'raider':
      case 'escort':
      default: {
        if (!ship.sailsUp) orders.push({ kind: 'setSails', shipId: ship.id, on: true })
        if (ship.fireControl.mode !== 'auto') {
          orders.push({ kind: 'setFireControl', shipId: ship.id, fc: { mode: 'auto', shot: 'round' } })
        }
        if (near) {
          const def = SHIP_CLASSES[ship.classId]
          const range = def?.gunRange ?? 500
          // drž se na dostřel a natoč bok: miř na bod vedle cíle (paralelní kurz)
          const targetPos = estPos(near.c)
          if (near.d > range * 0.7) {
            orders.push({ kind: 'intercept', shipId: ship.id, targetId: near.c.shipId })
          } else {
            // uvnitř dostřelu: veď paralelní kurz, ať nese bok
            const perp = fromAngle(angleOf(sub(targetPos, ship.pos)) + Math.PI / 2)
            const dest = add(ship.pos, scale(perp, 800))
            orders.push({ kind: 'setCourse', shipId: ship.id, dest, arriveAtRest: false })
          }
        }
        break
      }
    }
  }
  return orders
}
