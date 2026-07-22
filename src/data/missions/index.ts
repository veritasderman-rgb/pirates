/** Registr scénářů kampaně (pořadí = pořadí v menu). */
import type { Scenario } from '../../sim/types'
import { mission01 } from './mission01'
import { mission02 } from './mission02'

export const SCENARIOS: Record<string, Scenario> = {
  mission01,
  mission02,
}
