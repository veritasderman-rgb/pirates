import { describe, it, expect } from 'vitest'
import { sim } from '../src/sim/engine'
import { SCENARIOS } from '../src/data/missions'
import { SIM_DT } from '../src/sim/constants'
import type { ShipState } from '../src/sim/types'

describe('opravy z review #4', () => {
  it('mise 5: potopení vlajkové lodi samo NEvyhraje, dokud žije smečka', () => {
    const st = sim.create(SCENARIOS.mission05)
    const flag = st.ships.find(s => s.name === 'Černý příboj') as ShipState
    const sloops = st.ships.filter(s => s.name === 'Sup' || s.name === 'Mořská saň')

    flag.destroyed = true; flag.hull = 0
    sim.tick(st, SIM_DT)
    expect(st.outcome).toBe('running') // smečka ještě žije
    expect(st.objectives.find(o => o.id === 'obj-flag')!.state).toBe('done')

    for (const s of sloops) { s.destroyed = true; s.hull = 0 }
    sim.tick(st, SIM_DT); sim.tick(st, SIM_DT)
    expect(st.outcome).toBe('win')
    expect(st.objectives.find(o => o.id === 'obj-pack')!.state).toBe('done')
  })

  it('mise 3: Q-loď je do odhalení neutrál v masce kupce, pak nepřítel', () => {
    const st = sim.create(SCENARIOS.mission03)
    const player = st.ships.find(s => s.side === 'player') as ShipState
    const qship = st.ships.find(s => s.name === 'Santa Rosa') as ShipState

    // před odhalením: neutrál, maskovaný jako kupec
    expect(qship.side).toBe('neutral')
    expect(qship.disguise).toBe('merch')
    // rozjeď senzory a zkontroluj hlášenou třídu kontaktu
    sim.tick(st, SIM_DT)
    let con = st.contacts.player.find(c => c.shipId === qship.id)
    expect(con?.classGuess).toBe('merch') // hlásí se jako kupec

    // přiblíž hráče na dostřel zvratu (< 550 m)
    player.pos = { x: qship.pos.x - 500, y: qship.pos.y }
    for (let i = 0; i < 8; i++) sim.tick(st, SIM_DT)
    expect(qship.side).toBe('enemy')     // past sklapla
    expect(qship.disguise).toBeUndefined()
    con = st.contacts.player.find(c => c.shipId === qship.id)
    expect(con?.classGuess).toBe('qship-castilla')
  })

  it('mise 4: kurýr (transit) pluje k přístavu a při nečinnosti hráče unikne (termín drží)', () => {
    const st = sim.create(SCENARIOS.mission04)
    const courier = st.ships.find(s => s.name === 'Céfiro') as ShipState
    const x0 = courier.pos.x
    for (let i = 0; i < 500 / SIM_DT; i++) {
      sim.tick(st, SIM_DT)
      if (st.outcome !== 'running') break
    }
    expect(courier.pos.x).toBeGreaterThan(x0 + 1000) // míří k přístavu, neutíká pryč
    expect(st.outcome).toBe('lose')                   // hráč nezasáhl → kurýr unikl
  })
})
