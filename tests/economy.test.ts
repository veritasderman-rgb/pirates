import { describe, it, expect } from 'vitest'
import { sim } from '../src/sim/engine'
import { applyFlagshipLoadout } from '../src/sim/loadout'
import { SHIPYARD, shipEntry, STARTER_HULL, pristineCondition, repairCost, isDamaged } from '../src/data/profile'
import { CAMPAIGN_NODES, isMissionUnlocked } from '../src/data/campaign'
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

  it('opotřebení: loď vyplouvá poškozená a oprava stojí dublony', () => {
    const st = sim.create(sc)
    const cond = { ...pristineCondition(), hull: 0.5, rudder: 0.3, crew: 0.7 }
    applyFlagshipLoadout(st, 'frigate-albion', undefined, cond)
    const flag = st.ships.find(s => s.doctrine === 'player') as ShipState
    // trup je půlka plné pevnosti fregaty, kormidlo a posádka odpovídají kondici
    expect(flag.hull).toBeCloseTo(SHIP_CLASSES['frigate-albion'].hullPoints * 0.5, 5)
    expect(flag.subsystems.rudder).toBeCloseTo(0.3, 5)
    expect(flag.subsystems.crew).toBeCloseTo(0.7, 5)
    // oprava: cena roste s poškozením, pristine je zdarma a „bez poškození"
    expect(isDamaged(cond)).toBe(true)
    expect(repairCost(cond)).toBeGreaterThan(0)
    expect(isDamaged(pristineCondition())).toBe(false)
    expect(repairCost(pristineCondition())).toBe(0)
  })

  it('opotřebení navrch upgradu: hull mod × pevnost × kondice', () => {
    const st = sim.create(sc)
    applyFlagshipLoadout(st, 'brig-albion', { hull: 1.2 }, { ...pristineCondition(), hull: 0.5 })
    const flag = st.ships.find(s => s.doctrine === 'player') as ShipState
    // hullMax = pevnost × 1.2 (upgrade); aktuální trup = hullMax × 0.5 (kondice)
    expect(flag.hullMax).toBeCloseTo(SHIP_CLASSES['brig-albion'].hullPoints * 1.2, 5)
    expect(flag.hull).toBeCloseTo(SHIP_CLASSES['brig-albion'].hullPoints * 1.2 * 0.5, 5)
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

  it('zámek postupu: první mise otevřená, pozdější zamčené bez prerekvizity', () => {
    expect(isMissionUnlocked('mission01', [])).toBe(true)       // bez requires
    expect(isMissionUnlocked('mission02', [])).toBe(false)      // vyžaduje mission01
    expect(isMissionUnlocked('mission02', ['mission01'])).toBe(true)
    expect(isMissionUnlocked('mission11', [])).toBe(false)      // URL/záložka neobejde
    expect(isMissionUnlocked('neexistuje', ['mission01'])).toBe(false)
  })
})
