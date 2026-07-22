import { describe, it, expect } from 'vitest'
import { sailEfficiency, offWindAngle, inNoGo, windFactor } from '../src/sim/sail'
import type { Wind } from '../src/sim/types'

describe('body plavby', () => {
  it('no-go zóna má nulovou efektivitu, broad reach maximum', () => {
    expect(sailEfficiency(0)).toBe(0)                       // přímo do větru
    expect(sailEfficiency((30 * Math.PI) / 180)).toBe(0)    // uvnitř no-go
    const closeHauled = sailEfficiency((45 * Math.PI) / 180)
    const beam = sailEfficiency((75 * Math.PI) / 180)
    const broad = sailEfficiency((120 * Math.PI) / 180)
    const running = sailEfficiency(Math.PI)
    expect(closeHauled).toBeGreaterThan(0)
    expect(beam).toBeGreaterThan(closeHauled)
    expect(broad).toBeGreaterThanOrEqual(beam)
    expect(running).toBeLessThan(broad)                     // po větru plachty stíní
  })

  it('offWindAngle: příď proti větru = 0, po větru = π', () => {
    const wind: Wind = { dir: 0, speed: 8 } // vítr vane k +x
    // příď na +x = plujeme po větru → π
    expect(offWindAngle(0, wind)).toBeCloseTo(Math.PI, 5)
    // příď na −x = plujeme proti větru → 0
    expect(offWindAngle(Math.PI, wind)).toBeCloseTo(0, 5)
  })

  it('inNoGo pod 45° od větru', () => {
    expect(inNoGo((20 * Math.PI) / 180)).toBe(true)
    expect(inNoGo((60 * Math.PI) / 180)).toBe(false)
  })

  it('windFactor roste se sílou větru a má strop', () => {
    expect(windFactor(0)).toBe(0)
    expect(windFactor(8)).toBeCloseTo(1, 5)
    expect(windFactor(16)).toBeGreaterThan(windFactor(8))
    expect(windFactor(1000)).toBeLessThanOrEqual(2.2)
  })
})
