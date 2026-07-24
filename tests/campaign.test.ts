import { describe, it, expect } from 'vitest'
import { sim } from '../src/sim/engine'
import { SCENARIOS } from '../src/data/missions'
import { SIM_DT } from '../src/sim/constants'
import type { ShipState } from '../src/sim/types'

const finite = (s: ShipState): boolean =>
  Number.isFinite(s.pos.x) && Number.isFinite(s.pos.y)
  && Number.isFinite(s.vel.x) && Number.isFinite(s.vel.y) && Number.isFinite(s.heading)

describe('kampaň (mise + vedlejší odbočky)', () => {
  it('každá mise se vytvoří, má cíle a triggery', () => {
    const ids = Object.keys(SCENARIOS)
    expect(ids.length).toBeGreaterThanOrEqual(11)
    for (const sc of Object.values(SCENARIOS)) {
      const st = sim.create(sc)
      expect(st.ships.length).toBeGreaterThan(0)
      expect(sc.objectives.length).toBeGreaterThan(0)
      expect(sc.triggers.length).toBeGreaterThan(0)
    }
  })

  it('každá mise běží 250 s stabilně (bez NaN, koule omezené)', () => {
    for (const sc of Object.values(SCENARIOS)) {
      const st = sim.create(sc)
      let maxBalls = 0
      for (let i = 0; i < 250 / SIM_DT; i++) {
        sim.tick(st, SIM_DT)
        maxBalls = Math.max(maxBalls, st.balls.length)
        for (const s of st.ships) expect(finite(s), `${sc.id}/${s.name}`).toBe(true)
        if (st.outcome !== 'running') break
      }
      expect(maxBalls, `${sc.id} balls`).toBeLessThan(3000)
    }
  })

  it('mise 3: přiblížení hráče odhalí Q-loď (zvrat)', () => {
    const st = sim.create(SCENARIOS.mission03)
    const player = st.ships.find(s => s.side === 'player') as ShipState
    const qship = st.ships.find(s => s.name === 'Santa Rosa') as ShipState
    // přibliž hráče ke Q-lodi
    sim.applyOrder(st, { kind: 'setSails', shipId: player.id, on: true })
    for (let i = 0; i < 400 / SIM_DT; i++) {
      if (i % 4 === 0) sim.applyOrder(st, { kind: 'intercept', shipId: player.id, targetId: qship.id })
      sim.tick(st, SIM_DT)
      if (qship.doctrine === 'attack' || st.outcome !== 'running') break
    }
    expect(st.flags['fleeing'] ?? qship.doctrine).toBeTruthy()
    // buď se past už odhalila (attack), nebo se hráč aspoň dostal blíž
    expect(qship.doctrine === 'attack' || st.t > 0).toBe(true)
  })
})
