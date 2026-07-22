/** Registr scénářů kampaně (pořadí = pořadí v menu). */
import type { Scenario } from '../../sim/types'
import { mission01 } from './mission01'
import { mission02 } from './mission02'
import { mission03 } from './mission03'
import { mission04 } from './mission04'
import { mission05 } from './mission05'
import { mission06 } from './mission06'

export const SCENARIOS: Record<string, Scenario> = {
  mission01,
  mission02,
  mission03,
  mission04,
  mission05,
  mission06,
}
