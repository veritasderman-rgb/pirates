import { describe, it, expect } from 'vitest'
import { sim } from '../src/sim/engine'
import { SCENARIOS } from '../src/data/missions'
import { SIM_DT } from '../src/sim/constants'
import type { ShipState } from '../src/sim/types'

describe('nástupnictví vlajky a prohra flotily', () => {
  it('padne-li velitelská loď, vlajku přebere jiná loď a hra běží dál', () => {
    const st = sim.create(SCENARIOS.mission07)
    const flag = st.ships.find(s => s.doctrine === 'player') as ShipState
    flag.destroyed = true; flag.hull = 0
    sim.tick(st, SIM_DT)
    // někdo jiný z flotily je teď velitel a mise stále běží
    const cmd = st.ships.find(s => s.side === 'player' && !s.destroyed && s.doctrine === 'player')
    expect(cmd).toBeTruthy()
    expect(cmd!.id).not.toBe(flag.id)
    expect(st.outcome).toBe('running')
  })

  it('prohra až když padne CELÁ flotila hráče', () => {
    const st = sim.create(SCENARIOS.mission07)
    const own = st.ships.filter(s => s.side === 'player')
    // potop všechny kromě jedné → pořád běží
    for (const s of own.slice(1)) { s.destroyed = true; s.hull = 0 }
    sim.tick(st, SIM_DT)
    expect(st.outcome).toBe('running')
    // potop poslední → prohra
    own[0].destroyed = true; own[0].hull = 0
    sim.tick(st, SIM_DT)
    expect(st.outcome).toBe('lose')
  })
})
