/** Drobné sdílené pomůcky simulace. */
import type { Side } from './types'

/** Jsou strany vzájemně nepřátelské? (neutrál není nepřítel nikomu) */
export const hostileTo = (a: Side, b: Side): boolean =>
  (a === 'player' && b === 'enemy') || (a === 'enemy' && b === 'player')
