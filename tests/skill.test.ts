import { describe, it, expect } from 'vitest'
import { sim } from '../src/sim/engine'
import { weatherGage, rakeAvailable, canChase, bestChaser, chaseGunCount } from '../src/sim/weapons'
import { boardingOdds } from '../src/sim/surrender'
import { SIM_DT } from '../src/sim/constants'
import type { Scenario, ShipState, SimState } from '../src/sim/types'

const ship = (over: Partial<ShipState> & { name: string; pos: ShipState['pos'] }): ShipState => ({
  id: 0, side: 'enemy', classId: 'merch', heading: 0, vel: { x: 0, y: 0 },
  sailsUp: false, trim: 1, oaring: false, oarStamina: 1, nav: null, tack: 1,
  subsystems: { rigging: 1, rudder: 1, gunsPort: 1, gunsStbd: 1, crew: 1 },
  hull: 120, ammo: 40, morale: 1, reloadPort: 0, reloadStbd: 0, reloadBow: 0, reloadStern: 0,
  destroyed: false, surrendered: false, boarded: false, doctrine: 'buoy',
  fireControl: { mode: 'hold', shot: 'round', engaged: false }, lastSurrenderDemandAt: -999,
  ...over,
})

describe('dovednostní boj', () => {
  it('weather gage: návětří dává vyšší hodnotu než závětří', () => {
    // vítr vane k +x. Střelec na −x od cíle je v návětří (dir k cíli ~ +x).
    const upwind = weatherGage({ x: -100, y: 0 }, { x: 0, y: 0 }, 0)
    const downwind = weatherGage({ x: 100, y: 0 }, { x: 0, y: 0 }, 0)
    expect(upwind).toBeGreaterThan(0.9)
    expect(downwind).toBe(0)
  })

  it('rakeAvailable: linie podél osy cíle = true, z boku = false', () => {
    const tgt = ship({ name: 'T', pos: { x: 0, y: 0 }, heading: 0 }) // příď na +x
    const fromBow = ship({ name: 'F1', pos: { x: -200, y: 0 } })     // před přídí
    const fromSide = ship({ name: 'F2', pos: { x: 0, y: -200 } })    // z boku
    expect(rakeAvailable(fromBow, tgt)).toBe(true)
    expect(rakeAvailable(fromSide, tgt)).toBe(false)
  })

  it('boarding: útok na nevzdaný cíl ubírá posádku oběma stranám a postupuje', () => {
    const sc: Scenario = {
      id: 'test-board', title: 't', briefing: '', seed: 7,
      wind: { baseDir: 0, baseSpeed: 4 },
      ships: [
        { classId: 'frigate-albion', side: 'player', name: 'A', pos: { x: 0, y: 0 }, vel: { x: 0, y: 0 }, heading: 0, doctrine: 'player', fireControl: { mode: 'hold', shot: 'round', engaged: false } },
        { classId: 'merch', side: 'enemy', name: 'B', pos: { x: 40, y: 0 }, vel: { x: 0, y: 0 }, heading: 0, doctrine: 'buoy' },
      ],
      objectives: [], triggers: [],
    }
    const st: SimState = sim.create(sc)
    const A = st.ships.find(s => s.name === 'A') as ShipState
    const B = st.ships.find(s => s.name === 'B') as ShipState
    const crewA0 = A.subsystems.crew, crewB0 = B.subsystems.crew

    sim.applyOrder(st, { kind: 'board', shipId: A.id, targetId: B.id })
    // jeden rozkaz stačí — výsadek útočí sám každý tick
    for (let i = 0; i < 40 && !B.boarded; i++) sim.tick(st, SIM_DT)

    expect((B.boardingProgress ?? 0)).toBeGreaterThan(0)
    expect(B.subsystems.crew).toBeLessThan(crewB0) // obránce krvácí
    expect(A.subsystems.crew).toBeLessThan(crewA0) // i útočník krvácí (risk)
  })

  it('boardingOdds: převaha posádky/morálky = vyšší šance', () => {
    const strong = ship({ name: 'S', pos: { x: 0, y: 0 }, doctrine: 'player', morale: 1, subsystems: { rigging: 1, rudder: 1, gunsPort: 1, gunsStbd: 1, crew: 1 } })
    const weak = ship({ name: 'W', pos: { x: 40, y: 0 }, morale: 0.3, subsystems: { rigging: 1, rudder: 1, gunsPort: 1, gunsStbd: 1, crew: 0.3 } })
    expect(boardingOdds(strong, weak)).toBeGreaterThan(0.7)
  })
})

describe('stíhací děla (příď/záď)', () => {
  it('chaseGunCount: válečné lodě je mají, kupec ne', () => {
    expect(chaseGunCount(ship({ name: 'F', pos: { x: 0, y: 0 }, classId: 'frigate-albion' }))).toBeGreaterThan(0)
    expect(chaseGunCount(ship({ name: 'M', pos: { x: 0, y: 0 }, classId: 'merch' }))).toBe(0)
  })

  it('bestChaser: cíl vpřed = příď, z boku = žádné, vzadu = záď', () => {
    const me = ship({ name: 'me', pos: { x: 0, y: 0 }, heading: 0, classId: 'frigate-albion' }) // příď na +x
    expect(bestChaser(me, ship({ name: 'a', pos: { x: 400, y: 0 } }))).toBe('bow')
    expect(canChase(me, 'bow', ship({ name: 'b', pos: { x: 0, y: -400 } }))).toBe(false) // z boku
    expect(bestChaser(me, ship({ name: 's', pos: { x: -400, y: 0 } }))).toBe('stern')
  })

  it('příďové dělo štípne cíl vpřed bez natočení boku, pak se nabíjí', () => {
    const sc: Scenario = {
      id: 'test-chase', title: 't', briefing: '', seed: 11, wind: { baseDir: 0, baseSpeed: 5 },
      ships: [
        { classId: 'frigate-albion', side: 'player', name: 'A', pos: { x: 0, y: 0 }, vel: { x: 0, y: 0 }, heading: 0, doctrine: 'player', fireControl: { mode: 'hold', shot: 'round', engaged: false } },
        { classId: 'merch', side: 'enemy', name: 'B', pos: { x: 300, y: 0 }, vel: { x: 0, y: 0 }, heading: 0, doctrine: 'buoy' },
      ],
      objectives: [], triggers: [],
    }
    const st = sim.create(sc)
    const A = st.ships.find(s => s.name === 'A') as ShipState
    const B = st.ships.find(s => s.name === 'B') as ShipState
    const hull0 = B.hull
    sim.applyOrder(st, { kind: 'fireChaser', shipId: A.id, end: 'bow', targetId: B.id, shot: 'round' })
    expect(A.reloadBow).toBeGreaterThan(0)         // vystřelil → nabíjí se
    for (let i = 0; i < 60; i++) sim.tick(st, SIM_DT)
    expect(B.hull).toBeLessThan(hull0)             // koule z přídě zasáhla cíl vpřed
  })
})
