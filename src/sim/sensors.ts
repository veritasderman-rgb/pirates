/**
 * Senzory / dohled: kontaktní picture per strana. Dohled = dosah koše
 * pozorovatele; přímku k cíli může přerušit ostrov (LOS blokace). Ztracený
 * kontakt zůstává jako paměťový pin (memory) s poslední známou polohou.
 */
import type { Contact, ShipState, SimState } from './types'
import { dist } from './vec'
import { SHIP_CLASSES } from '../data/defs'
import { SENSOR_UPDATE_INTERVAL } from './constants'
import { blocksLine } from './terrain'

const clock = new WeakMap<SimState, number>()

export function updateSensors(state: SimState, dt: number): void {
  const acc = (clock.get(state) ?? SENSOR_UPDATE_INTERVAL) + dt
  if (acc < SENSOR_UPDATE_INTERVAL) { clock.set(state, acc); return }
  clock.set(state, 0)

  for (const side of ['player', 'enemy'] as const) {
    const observers = state.ships.filter(s => s.side === side && !s.destroyed)
    const prev = state.contacts[side]
    const next: Contact[] = []

    for (const target of state.ships) {
      if (target.side === side || target.destroyed) continue
      // vidí ho aspoň jeden pozorovatel? (dohled + LOS)
      let seenBy: ShipState | null = null
      let bestD = Infinity
      for (const o of observers) {
        const def = SHIP_CLASSES[o.classId]
        const range = def?.lookoutRange ?? 3000
        const d = dist(o.pos, target.pos)
        if (d > range) continue
        if (blocksLine(state, o.pos, target.pos)) continue
        if (d < bestD) { bestD = d; seenBy = o }
      }

      const old = prev.find(c => c.shipId === target.id)
      const staticObj = (SHIP_CLASSES[target.classId]?.hullCode === 'FORT')
      if (seenBy) {
        // identifikace roste s blízkostí
        const idQuality: 0 | 1 | 2 = bestD < 700 ? 2 : bestD < 1800 ? 1 : 0
        const isNew = !old || old.memory
        next.push({
          shipId: target.id, pos: { ...target.pos }, vel: { ...target.vel },
          // maskovaná loď (Q-loď) hlásí falešnou třídu, dokud ji zvrat neodhalí
          age: 0, idQuality, classGuess: target.disguise ?? target.classId, staticObject: staticObj,
        })
        if (isNew) {
          state.events.push({
            t: state.t, kind: 'contactNew', side, pos: { ...target.pos },
            text: side === 'player' ? `Plachta na obzoru! ${idQuality >= 1 ? target.name : 'neznámý kontakt'}.` : '',
            speaker: side === 'player' ? 'lookout' : undefined,
          })
        }
      } else if (old) {
        // ztracen z dohledu → paměťový pin (statický objekt trvale přesně)
        next.push({ ...old, age: old.age + SENSOR_UPDATE_INTERVAL, memory: true })
      }
    }
    state.contacts[side] = next
  }
}
