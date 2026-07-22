import { describe, it, expect } from 'vitest'
import { sim } from '../src/sim/engine'
import type { Scenario } from '../src/sim/types'
import { SIM_DT } from '../src/sim/constants'

/** Scénář s jednou lodí a zadaným větrem/headingem. */
function oneShip(heading: number, windDir: number, opts: Partial<{ oaring: boolean; canRowClass: string }> = {}): Scenario {
  return {
    id: 'test-phys', title: 't', briefing: '', seed: 1,
    wind: { baseDir: windDir, baseSpeed: 9 },
    ships: [{
      classId: opts.canRowClass ?? 'frigate-albion', side: 'player', name: 'T',
      pos: { x: 0, y: 0 }, vel: { x: 0, y: 0 }, heading, doctrine: 'player',
      sailsUp: true, trim: 1, oaring: opts.oaring ?? false,
    }],
    objectives: [], triggers: [],
  }
}

const speedAfter = (sc: Scenario, secs: number): number => {
  const st = sim.create(sc)
  for (let i = 0; i < secs / SIM_DT; i++) sim.tick(st, SIM_DT)
  const s = st.ships[0]
  return Math.hypot(s.vel.x, s.vel.y)
}

describe('fyzika plavby', () => {
  it('na zadoboční vítr loď zrychlí', () => {
    // vítr k +x (dir 0), příď na +x → plujeme po větru (rychlé)
    expect(speedAfter(oneShip(0, 0), 30)).toBeGreaterThan(3)
  })

  it('přímo proti větru bez vesel loď (skoro) stojí', () => {
    // příď na −x, vítr k +x → no-go
    expect(speedAfter(oneShip(Math.PI, 0), 30)).toBeLessThan(1)
  })

  it('vesla dají tah i proti větru (galéra)', () => {
    const withOars = speedAfter(oneShip(Math.PI, 0, { oaring: true, canRowClass: 'galley-corsair' }), 30)
    const withoutOars = speedAfter(oneShip(Math.PI, 0, { oaring: false, canRowClass: 'galley-corsair' }), 30)
    expect(withOars).toBeGreaterThan(withoutOars + 0.5)
  })

  it('beam reach je rychlejší než close-hauled', () => {
    // vítr k +x. beam ~ příď na +y (90° od větru). close-hauled ~ 45° do větru.
    const beam = speedAfter(oneShip(Math.PI / 2, 0), 40)
    const close = speedAfter(oneShip((135 * Math.PI) / 180, 0), 40)
    expect(beam).toBeGreaterThan(close)
  })
})
