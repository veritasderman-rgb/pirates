/** Registr scénářů kampaně (pořadí = pořadí v menu). */
import type { Scenario } from '../../sim/types'
import { mission01 } from './mission01'
import { mission02 } from './mission02'
import { mission03 } from './mission03'
import { mission04 } from './mission04'
import { mission05 } from './mission05'
import { mission06 } from './mission06'
import { mission07 } from './mission07'
import { mission08 } from './mission08'
import { mission09 } from './mission09'
import { mission10 } from './mission10'
import { mission11 } from './mission11'
import { side01 } from './side01'
import { side02 } from './side02'

export const SCENARIOS: Record<string, Scenario> = {
  mission01,
  mission02,
  mission03,
  mission04,
  mission05,
  mission06,
  mission07,
  mission08,
  mission09,
  mission10,
  mission11,
  // volitelné vedlejší mise (odbočky na mapě)
  side01,
  side02,
}
