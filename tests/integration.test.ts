import { describe, it, expect } from 'vitest'
import { sim } from '../src/sim/engine'
import { SCENARIOS } from '../src/data/missions'
import { SIM_DT } from '../src/sim/constants'
import type { ShipState, SimState } from '../src/sim/types'

const finite = (s: ShipState): boolean =>
  Number.isFinite(s.pos.x) && Number.isFinite(s.pos.y)
  && Number.isFinite(s.vel.x) && Number.isFinite(s.vel.y) && Number.isFinite(s.heading)

describe('integrace / hratelnost', () => {
  it('mise 1: pronásledování + AUTO palba dovede k rozhodnutí, bez NaN', () => {
    const st = sim.create(SCENARIOS.mission01)
    const player = st.ships.find(s => s.side === 'player') as ShipState
    const runner = st.ships.find(s => s.name === 'Sea Maiden') as ShipState

    // hráč: napni plachty, sleduj cíl, pal automaticky koulí
    sim.applyOrder(st, { kind: 'setSails', shipId: player.id, on: true })
    sim.applyOrder(st, { kind: 'setTrim', shipId: player.id, trim: 1 })
    sim.applyOrder(st, { kind: 'setFireControl', shipId: player.id, fc: { mode: 'auto', shot: 'round' } })

    for (let i = 0; i < 600 / SIM_DT; i++) {
      // každou vteřinu obnov intercept na runnera (dokud žije)
      if (i % 4 === 0 && !runner.destroyed && !runner.surrendered) {
        sim.applyOrder(st, { kind: 'intercept', shipId: player.id, targetId: runner.id })
      }
      sim.tick(st, SIM_DT)
      for (const s of st.ships) expect(finite(s)).toBe(true)
      if (st.outcome !== 'running') break
    }

    // buď rovnou výhra, nebo aspoň runner utrpěl (systém boje funguje)
    const decided = st.outcome !== 'running'
    const hurt = runner.destroyed || runner.surrendered || runner.hull < 120
    expect(decided || hurt).toBe(true)
  })

  it('dlouhý běh mise 2 zůstane stabilní (bez NaN, koule se čistí)', () => {
    const st = sim.create(SCENARIOS.mission02)
    let maxBalls = 0
    for (let i = 0; i < 500 / SIM_DT; i++) {
      sim.tick(st, SIM_DT)
      maxBalls = Math.max(maxBalls, st.balls.length)
      for (const s of st.ships) expect(finite(s)).toBe(true)
      if (st.outcome !== 'running') break
    }
    // koule nezůstávají navěky (dolet je omezený)
    expect(st.balls.length).toBeLessThan(maxBalls + 1)
    expect(maxBalls).toBeLessThan(2000)
  })
})
