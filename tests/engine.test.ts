import { describe, it, expect } from 'vitest'
import { sim } from '../src/sim/engine'
import { SCENARIOS } from '../src/data/missions'
import { SIM_DT } from '../src/sim/constants'
import type { Scenario, ShipState } from '../src/sim/types'

const run = (sc: Scenario, secs: number) => {
  const st = sim.create(sc)
  for (let i = 0; i < secs / SIM_DT; i++) sim.tick(st, SIM_DT)
  return st
}

describe('engine', () => {
  it('determinismus: dva běhy stejného scénáře jsou identické', () => {
    const a = run(SCENARIOS.mission01, 30)
    const b = run(SCENARIOS.mission01, 30)
    expect(JSON.stringify(a.ships.map(s => [s.pos, s.vel, s.hull])))
      .toBe(JSON.stringify(b.ships.map(s => [s.pos, s.vel, s.hull])))
  })

  it('mise 1: runner po t=40 s prchá (mění doktrínu a napne plachty)', () => {
    const st = run(SCENARIOS.mission01, 45)
    const runner = st.ships.find(s => s.name === 'Sea Maiden') as ShipState
    expect(runner.doctrine).toBe('runner')
    expect(runner.sailsUp).toBe(true)
    expect(st.flags['fleeing']).toBe(true)
  })

  it('boční salva na blízkou nepřátelskou loď ubere trup', () => {
    const sc: Scenario = {
      id: 'test-fire', title: 't', briefing: '', seed: 5,
      wind: { baseDir: 0, baseSpeed: 6 },
      ships: [
        // střelec míří pravobokem (heading +x → pravobok míří na −y)
        { classId: 'frigate-albion', side: 'player', name: 'A', pos: { x: 0, y: 0 }, vel: { x: 0, y: 0 }, heading: 0, doctrine: 'player', fireControl: { mode: 'auto', shot: 'round', engaged: false } },
        { classId: 'merch', side: 'enemy', name: 'B', pos: { x: 0, y: -250 }, vel: { x: 0, y: 0 }, heading: 0, doctrine: 'buoy' },
      ],
      objectives: [], triggers: [],
    }
    const st = run(sc, 20)
    const b = st.ships.find(s => s.name === 'B') as ShipState
    expect(b.hull).toBeLessThan(120) // kupec má hullPoints 120, salva ubrala
  })

  it('všechny mise se vytvoří bez chyby a mají cíle', () => {
    for (const sc of Object.values(SCENARIOS)) {
      const st = sim.create(sc)
      expect(st.ships.length).toBeGreaterThan(0)
      expect(sc.objectives.length).toBeGreaterThan(0)
    }
  })
})
