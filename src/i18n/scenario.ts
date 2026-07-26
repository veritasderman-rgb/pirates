/**
 * Lokalizace scénáře — hluboká kopie mise s přeloženými texty (briefing, cíle,
 * hlášky triggerů, jména a popisy lodí i ostrovů). Volá ji worker při initu,
 * takže VŠECHNO downstream (události, cíle, ready zpráva pro briefing) už je
 * v aktivním jazyce a UI nemusí nic řešit. Kopie zároveň chrání modulové
 * objekty misí před mutací (`fired` na triggerech).
 */
import type { Scenario } from '../sim/types'
import { t, activeLang } from './core'

export function localizeScenario(sc: Scenario): Scenario {
  const c: Scenario = JSON.parse(JSON.stringify(sc)) as Scenario
  if (activeLang() === 'en') return c
  c.title = t(c.title)
  c.briefing = t(c.briefing)
  for (const o of c.objectives) o.text = t(o.text)
  for (const s of c.ships) {
    s.name = t(s.name)
    if (s.desc) s.desc = t(s.desc)
  }
  for (const i of c.islands ?? []) {
    if (i.name) i.name = t(i.name)
    if (i.desc) i.desc = t(i.desc)
  }
  for (const trg of c.triggers) {
    for (const a of trg.actions) {
      if (a.text) a.text = t(a.text)
      if (a.ship) { a.ship.name = t(a.ship.name); if (a.ship.desc) a.ship.desc = t(a.ship.desc) }
    }
  }
  return c
}
