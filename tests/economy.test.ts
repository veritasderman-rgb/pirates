import { describe, it, expect } from 'vitest'
import { sim } from '../src/sim/engine'
import { applyFlagshipLoadout } from '../src/sim/loadout'
import { SHIPYARD, shipEntry, STARTER_HULL } from '../src/data/profile'
import { CAMPAIGN_NODES } from '../src/data/campaign'
import { SHIP_CLASSES } from '../src/data/defs'
import { SCENARIOS } from '../src/data/missions'
import type { Scenario, ShipState } from '../src/sim/types'

const sc: Scenario = {
  id: 'test-loadout', title: 't', briefing: '', seed: 3,
  wind: { baseDir: 0, baseSpeed: 6 },
  ships: [
    { classId: 'sloop-albion', side: 'player', name: 'A', pos: { x: 0, y: 0 }, vel: { x: 0, y: 0 }, heading: 0, doctrine: 'player', fireControl: { mode: 'hold', shot: 'round', engaged: false } },
    { classId: 'merch', side: 'enemy', name: 'B', pos: { x: 500, y: 0 }, vel: { x: 0, y: 0 }, heading: 0, doctrine: 'buoy' },
  ],
  objectives: [], triggers: [],
}

describe('ekonomika / loděnice', () => {
  it('loděnice: každý trup existuje ve třídách a startovní je zdarma', () => {
    for (const e of SHIPYARD) expect(SHIP_CLASSES[e.classId]).toBeTruthy()
    expect(shipEntry(STARTER_HULL)?.price).toBe(0)
    // ceny rostou s eskalací
    const prices = SHIPYARD.map(e => e.price)
    for (let i = 1; i < prices.length; i++) expect(prices[i]).toBeGreaterThan(prices[i - 1])
  })

  it('výběr vlajkové lodi přepíše třídu i pevnost trupu', () => {
    const st = sim.create(sc)
    applyFlagshipLoadout(st, 'frigate-albion')
    const flag = st.ships.find(s => s.doctrine === 'player') as ShipState
    expect(flag.classId).toBe('frigate-albion')
    expect(flag.hull).toBe(SHIP_CLASSES['frigate-albion'].hullPoints)
    expect(flag.hullMax).toBe(SHIP_CLASSES['frigate-albion'].hullPoints)
  })

  it('upgrady se aplikují navrch zvoleného trupu (hull mod × pevnost)', () => {
    const st = sim.create(sc)
    applyFlagshipLoadout(st, 'brig-albion', { hull: 1.3 })
    const flag = st.ships.find(s => s.doctrine === 'player') as ShipState
    expect(flag.hullMax).toBeCloseTo(SHIP_CLASSES['brig-albion'].hullPoints * 1.3, 5)
    expect(flag.mods?.hull).toBe(1.3)
  })

  it('bez volby trupu zůstane loď mise beze změny třídy', () => {
    const st = sim.create(sc)
    applyFlagshipLoadout(st, undefined, undefined)
    const flag = st.ships.find(s => s.doctrine === 'player') as ShipState
    expect(flag.classId).toBe('sloop-albion')
  })
})

describe('kampaňová mapa', () => {
  it('každý uzel odkazuje na existující misi a prerekvizita je platný uzel', () => {
    const ids = new Set(CAMPAIGN_NODES.map(n => n.id))
    for (const n of CAMPAIGN_NODES) {
      expect(SCENARIOS[n.id]).toBeTruthy()
      if (n.requires) expect(ids.has(n.requires)).toBe(true)
    }
  })

  it('mapa pokrývá všechny mise kampaně', () => {
    const nodeIds = new Set(CAMPAIGN_NODES.map(n => n.id))
    for (const id of Object.keys(SCENARIOS)) expect(nodeIds.has(id)).toBe(true)
  })
})
