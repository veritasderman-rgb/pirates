/**
 * Výbava vlajkové lodi hráče (ekonomika). Po vytvoření scénáře přepíše
 * hráčovu velitelskou loď (doctrine 'player') na zvolený zakoupený trup a
 * aplikuje trvalé upgrady. Odděleno od workeru, aby šlo testovat.
 */
import { SHIP_CLASSES } from '../data/defs'
import type { ShipMods, SimState } from './types'

export function applyFlagshipLoadout(
  state: SimState, flagshipClass?: string, upgrades?: ShipMods,
): void {
  const flag = state.ships.find(s => s.doctrine === 'player')
  if (!flag) return
  // hráč velí SVÉ zakoupené lodi — přepiš třídu mise na vybraný trup a odvoď
  // z něj základní staty (jméno z mise zůstává kvůli příběhu)
  const cls = flagshipClass ? SHIP_CLASSES[flagshipClass] : undefined
  if (flagshipClass && cls && flagshipClass !== flag.classId) {
    flag.classId = flagshipClass
    flag.hullMax = cls.hullPoints
    flag.hull = cls.hullPoints
    flag.ammo = cls.gunsPerBroadside * 24
  }
  // upgrady navrch (pevnost trupu × hull mod)
  if (upgrades) {
    flag.mods = upgrades
    flag.hullMax = (flag.hullMax ?? flag.hull) * (upgrades.hull ?? 1)
    flag.hull = flag.hullMax
  }
}
