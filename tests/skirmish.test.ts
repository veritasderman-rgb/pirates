import { describe, it, expect } from 'vitest'
import { buildSkirmish, SKIRMISH_PLAYER_SHIPS, SKIRMISH_ENEMY_SHIPS, type SkirmishOptions } from '../src/data/skirmish'
import { sim } from '../src/sim/engine'
import { SIM_DT } from '../src/sim/constants'

const base: SkirmishOptions = {
  playerClass: 'frigate-albion', enemyClass: 'brig-pirate', enemyCount: 2, weather: 'breeze', map: 'open',
}

describe('skirmish — generátor scénáře', () => {
  it('nabídky lodí nejsou prázdné a mají známé třídy', () => {
    expect(SKIRMISH_PLAYER_SHIPS.length).toBeGreaterThan(0)
    expect(SKIRMISH_ENEMY_SHIPS.length).toBeGreaterThan(0)
  })

  it('hráč velí zvolené lodi, nepřátel je přesně tolik, kolik chce', () => {
    const sc = buildSkirmish({ ...base, enemyCount: 3 })
    const player = sc.ships.filter(s => s.side === 'player')
    const enemies = sc.ships.filter(s => s.side === 'enemy')
    expect(player).toHaveLength(1)
    expect(player[0].classId).toBe('frigate-albion')
    expect(enemies).toHaveLength(3)
    expect(enemies.every(e => e.classId === 'brig-pirate')).toBe(true)
  })

  it('počet nepřátel je ořezán na 1..4', () => {
    expect(buildSkirmish({ ...base, enemyCount: 9 }).ships.filter(s => s.side === 'enemy')).toHaveLength(4)
    expect(buildSkirmish({ ...base, enemyCount: 0 }).ships.filter(s => s.side === 'enemy')).toHaveLength(1)
  })

  it('má výherní i prohrávací trigger (celá flotila padne)', () => {
    const sc = buildSkirmish(base)
    const win = sc.triggers.find(t => t.actions.some(a => a.kind === 'winMission'))
    const lose = sc.triggers.find(t => t.actions.some(a => a.kind === 'loseMission'))
    expect(win!.conditions.some(c => c.kind === 'allDestroyed' && c.side === 'enemy')).toBe(true)
    expect(lose!.conditions.some(c => c.kind === 'allDestroyed' && c.side === 'player')).toBe(true)
  })

  it('seed je deterministický z voleb (stejné volby → stejný seed)', () => {
    expect(buildSkirmish(base).seed).toBe(buildSkirmish(base).seed)
    expect(buildSkirmish({ ...base, weather: 'storm' }).seed).not.toBe(buildSkirmish(base).seed)
  })

  it('bouře fouká silněji než klid', () => {
    expect(buildSkirmish({ ...base, weather: 'storm' }).wind.baseSpeed)
      .toBeGreaterThan(buildSkirmish({ ...base, weather: 'calm' }).wind.baseSpeed)
  })

  it('mapa reef přidá útes, open je bez překážek', () => {
    expect(buildSkirmish({ ...base, map: 'open' }).islands ?? []).toHaveLength(0)
    expect(buildSkirmish({ ...base, map: 'reef' }).islands!.some(i => i.kind === 'reef')).toBe(true)
  })

  it('scénář je hratelný: 200 s běhu bez NaN', () => {
    const st = sim.create(buildSkirmish({ ...base, enemyCount: 2, map: 'reef' }))
    for (let i = 0; i < Math.round(200 / SIM_DT); i++) sim.tick(st, SIM_DT)
    for (const s of st.ships) {
      expect(Number.isFinite(s.pos.x)).toBe(true)
      expect(Number.isFinite(s.pos.y)).toBe(true)
      expect(Number.isFinite(s.hull)).toBe(true)
    }
  })
})
