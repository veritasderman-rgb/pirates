/**
 * Tutoriál (mise 0) — regrese na dvě věci, které se v code review ukázaly jako
 * tiše rozbité a hráč by o ně zakopl hned v první misi hry:
 *
 *   1. Kormorán musí být OPRAVDU opuštěný vrak. Kdyby naskočil s plnou
 *      posádkou, byl by boarding sporný, hráčův výsadek by ve cvičení krvácel
 *      a showOutcome by tu ztrátu uložil do profilu jako trvalé opotřebení
 *      vlajkové lodi — tutoriál by poškodil kampaň.
 *   2. Dělostřelecký úkol musí padnout po JEDNÉ salvě. S příliš přísným prahem
 *      nováček správně vystřelí, nic se nestane a čeká přes několik nabíjení.
 */
import { describe, it, expect } from 'vitest'
import { sim } from '../src/sim/engine'
import { SCENARIOS } from '../src/data/missions'
import { SIM_DT, BOARD_RANGE } from '../src/sim/constants'
import { SHIP_CLASSES } from '../src/data/defs'
import type { ShipState } from '../src/sim/types'

const tick = (st: ReturnType<typeof sim.create>, secs: number): void => {
  for (let i = 0; i < secs / SIM_DT; i++) sim.tick(st, SIM_DT)
}
const byName = (st: ReturnType<typeof sim.create>, n: string): ShipState =>
  st.ships.find(s => s.name === n) as ShipState

describe('mise 0 — Akademie (tutoriál)', () => {
  it('Kormorán je opuštěný vrak: staženou vlajku a nulovou posádku má hned na startu', () => {
    const st = sim.create(SCENARIOS.mission00)
    const wreck = byName(st, 'Cormorant')
    expect(wreck.surrendered).toBe(true)
    expect(wreck.subsystems.crew).toBe(0)
    expect(wreck.morale).toBe(0)
  })

  it('boarding vraku nestojí hráče ani jednoho muže (ztráta by se přenesla do kampaně)', () => {
    const st = sim.create(SCENARIOS.mission00)
    const me = byName(st, 'HMS Swallow')
    const wreck = byName(st, 'Cormorant')
    const crewBefore = me.subsystems.crew

    // přilož se k vraku a vydej rozkaz k boardingu
    me.pos = { x: wreck.pos.x, y: wreck.pos.y + BOARD_RANGE * 0.5 }
    me.vel = { x: 0, y: 0 }
    me.sailsUp = false
    me.boardingTargetId = wreck.id
    tick(st, 60)

    expect(wreck.boarded).toBe(true)
    expect(me.subsystems.crew).toBe(crewBefore)
    expect(st.objectives.find(o => o.id === 'obj-board')?.state).toBe('done')
  })

  it('dělostřelecký úkol padne po jedné salvě — i tou nejslabší municí (kartáč)', () => {
    const st = sim.create(SCENARIOS.mission00)
    const hulk = byName(st, 'Old Tortoise')
    const hp = SHIP_CLASSES[hulk.classId].hullPoints
    const me = byName(st, 'HMS Swallow')
    const def = SHIP_CLASSES[me.classId]

    // nejhorší případ: salva kartáčem, do trupu jde jen zlomek poškození
    const worstBroadside = def.gunsPerBroadside * def.gunDamage * 0.2
    hulk.hull = hp - worstBroadside
    tick(st, 1)

    expect(st.objectives.find(o => o.id === 'obj-guns')?.state).toBe('done')
    expect(st.flags['guns-fired']).toBe(true)
  })

  it('splnění všech tří cvičení misi ukončí výhrou', () => {
    const st = sim.create(SCENARIOS.mission00)
    st.flags['mark-rounded'] = true
    st.flags['guns-fired'] = true
    st.flags['boarded'] = true
    tick(st, 1)
    expect(st.outcome).toBe('win')
  })
})
