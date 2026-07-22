import { describe, it, expect } from 'vitest'
import { pointInPoly, segIntersectsPoly, circlePoly } from '../src/sim/geom'
import { sim } from '../src/sim/engine'
import { onLand, blocksLine, groundingAt } from '../src/sim/terrain'
import type { Scenario } from '../src/sim/types'

describe('geometrie a terén', () => {
  const square = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }]

  it('pointInPoly', () => {
    expect(pointInPoly({ x: 5, y: 5 }, square)).toBe(true)
    expect(pointInPoly({ x: 15, y: 5 }, square)).toBe(false)
  })

  it('segIntersectsPoly protne polygon', () => {
    expect(segIntersectsPoly({ x: -5, y: 5 }, { x: 15, y: 5 }, square)).toBe(true)
    expect(segIntersectsPoly({ x: -5, y: 20 }, { x: 15, y: 20 }, square)).toBe(false)
  })

  const scenario: Scenario = {
    id: 'test-terrain', title: 't', briefing: '', seed: 1,
    wind: { baseDir: 0, baseSpeed: 8 },
    islands: [
      { id: 'i', kind: 'island', poly: circlePoly(1000, 0, 300, 12) },
      { id: 'r', kind: 'reef', depth: 2, poly: circlePoly(0, 1000, 200, 12) },
    ],
    ships: [{ classId: 'frigate-albion', side: 'player', name: 'T', pos: { x: -2000, y: 0 }, vel: { x: 0, y: 0 }, heading: 0, doctrine: 'player' }],
    objectives: [], triggers: [],
  }

  it('onLand a blocksLine přes ostrov', () => {
    const st = sim.create(scenario)
    expect(onLand(st, { x: 1000, y: 0 })).toBe(true)
    expect(onLand(st, { x: -500, y: 0 })).toBe(false)
    // přímka přes ostrov je blokovaná, mimo něj ne
    expect(blocksLine(st, { x: -2000, y: 0 }, { x: 3000, y: 0 })).toBe(true)
    expect(blocksLine(st, { x: -2000, y: 2000 }, { x: 3000, y: 2000 })).toBe(false)
  })

  it('fregata (velký draft) uvázne na útesu, ale ne LOS blokace', () => {
    const st = sim.create(scenario)
    const ship = st.ships[0]
    const g = groundingAt(st, ship, { x: 0, y: 1000 }) // uvnitř útesu
    expect(g).not.toBeNull()
    // útes nekryje výhled
    expect(blocksLine(st, { x: 0, y: -2000 }, { x: 0, y: 3000 })).toBe(false)
  })
})
