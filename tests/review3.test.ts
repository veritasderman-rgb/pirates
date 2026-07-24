import { describe, it, expect } from 'vitest'
import { sim } from '../src/sim/engine'
import { SCENARIOS } from '../src/data/missions'
import { SIM_DT } from '../src/sim/constants'
import type { ShipState } from '../src/sim/types'

describe('opravy z review PR #7', () => {
  it('mise 2: ztráta eskorty = prohra, i když kupec přežije (a vlajku nepřebere civil)', () => {
    const st = sim.create(SCENARIOS.mission02)
    const ostriz = st.ships.find(s => s.name === 'HMS Goshawk') as ShipState
    ostriz.destroyed = true; ostriz.hull = 0
    sim.tick(st, SIM_DT)
    expect(st.outcome).toBe('lose')
    // žádný přeživší kupec se nestal velitelem
    const merchCommander = st.ships.find(s => s.classId === 'merch' && s.doctrine === 'player')
    expect(merchCommander).toBeFalsy()
  })

  it('mise 9: vítězství vyžaduje eskadru, ne zničení pevnosti', () => {
    const st = sim.create(SCENARIOS.mission09)
    const fort = st.ships.find(s => s.classId === 'fort-coastal') as ShipState
    // vyřaď eskadru (id 5,6,7), pevnost nech stát
    for (const id of [5, 6, 7]) {
      const s = st.ships.find(x => x.id === id) as ShipState
      s.destroyed = true; s.hull = 0
    }
    sim.tick(st, SIM_DT); sim.tick(st, SIM_DT)
    expect(st.outcome).toBe('win')
    expect(fort.destroyed).toBe(false) // pevnost pořád stojí
  })
})
