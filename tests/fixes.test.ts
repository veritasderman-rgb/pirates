import { describe, it, expect } from 'vitest'
import { sim } from '../src/sim/engine'
import { SIM_DT } from '../src/sim/constants'
import { windAt } from '../src/sim/wind'
import { hostileTo } from '../src/sim/util'
import { circlePoly } from '../src/sim/geom'
import { mission02 } from '../src/data/missions/mission02'
import type { Scenario, ShipState } from '../src/sim/types'

describe('opravy z review', () => {
  it('loď potopená na mělčině se označí destroyed a ohlásí to', () => {
    const sc: Scenario = {
      id: 'test-ground', title: 't', briefing: '', seed: 1,
      wind: { baseDir: 0, baseSpeed: 6 },
      islands: [{ id: 'i', kind: 'island', poly: circlePoly(0, 0, 300, 12) }],
      ships: [{
        classId: 'frigate-albion', side: 'player', name: 'T',
        pos: { x: -305, y: 0 }, vel: { x: 30, y: 0 }, heading: 0, doctrine: 'player',
        sailsUp: false, hull: 0.5,
      }],
      objectives: [], triggers: [],
    }
    const st = sim.create(sc)
    let sank = false
    for (let i = 0; i < 40; i++) {
      sim.tick(st, SIM_DT)
      if (st.events.some(e => e.kind === 'shipDestroyed')) sank = true
    }
    expect(st.ships[0].destroyed).toBe(true)
    expect(sank).toBe(true)
  })

  it('závětří za ostrovem sníží sílu větru v poli', () => {
    const sc: Scenario = {
      id: 'test-lee', title: 't', briefing: '', seed: 1,
      wind: { baseDir: 0, baseSpeed: 8 }, // vítr vane k +x
      islands: [{ id: 'i', kind: 'island', poly: circlePoly(0, 0, 300, 12) }],
      ships: [{ classId: 'sloop-albion', side: 'player', name: 'T', pos: { x: 0, y: 0 }, vel: { x: 0, y: 0 }, heading: 0, doctrine: 'player' }],
      objectives: [], triggers: [],
    }
    const st = sim.create(sc)
    const openW = windAt(st, { x: -600, y: 0 }) // návětří
    const leeW = windAt(st, { x: 500, y: 0 })   // závětří (po větru za ostrovem)
    expect(leeW.speed).toBeLessThan(openW.speed)
  })

  it('konvoj v misi 2 je na straně player → piráti (enemy) na něj útočí', () => {
    // faction model: enemy je hostilní k player (a tedy i k eskortovaným kupcům)
    expect(hostileTo('enemy', 'player')).toBe(true)
    expect(hostileTo('enemy', 'neutral')).toBe(false)
    const merchants = mission02.ships.filter(s => s.classId === 'merch')
    expect(merchants.length).toBe(2)
    for (const m of merchants) expect(m.side).toBe('player')
  })

  it('pirát na AUTO pálí na eskortovaného kupce (strana player) a ubere mu trup', () => {
    const sc: Scenario = {
      id: 'test-pirate-fire', title: 't', briefing: '', seed: 9,
      wind: { baseDir: 0, baseSpeed: 6 },
      ships: [
        // pirát míří pravobokem (heading +x → pravobok na −y)
        { classId: 'brig-pirate', side: 'enemy', name: 'P', pos: { x: 0, y: 0 }, vel: { x: 0, y: 0 }, heading: 0, doctrine: 'attack', fireControl: { mode: 'auto', shot: 'round', engaged: false } },
        // eskortovaný kupec Albionu (strana player, ne neutral)
        { classId: 'merch', side: 'player', name: 'Kupec', pos: { x: 0, y: -250 }, vel: { x: 0, y: 0 }, heading: 0, doctrine: 'buoy' },
      ],
      objectives: [], triggers: [],
    }
    const st = sim.create(sc)
    for (let i = 0; i < 20 / SIM_DT; i++) sim.tick(st, SIM_DT)
    const merch = st.ships.find(s => s.name === 'Kupec') as ShipState
    expect(merch.hull).toBeLessThan(120) // piráti teď na konvoj skutečně střílí
  })
})
