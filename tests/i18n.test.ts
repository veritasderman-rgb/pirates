import { describe, it, expect, afterEach } from 'vitest'
import { hasCs, setActiveLang, t, tp } from '../src/i18n/core'
import { localizeScenario } from '../src/i18n/scenario'
import { SCENARIOS } from '../src/data/missions'
import { MISSION_STORY, CAMPAIGN_INTRO, DEFEAT_GENERIC } from '../src/data/story'
import { BARKS } from '../src/data/barks'
import { SHIP_CLASSES } from '../src/data/defs'
import { sim } from '../src/sim/engine'
import { SIM_DT } from '../src/sim/constants'

afterEach(() => setActiveLang('en'))

/** Posbírá všechny přeložitelné texty ze scénáře. */
function scenarioStrings(id: string): { where: string; text: string }[] {
  const sc = SCENARIOS[id]
  const out: { where: string; text: string }[] = []
  const add = (where: string, text?: string): void => { if (text?.trim()) out.push({ where, text }) }
  add(`${id}.title`, sc.title)
  add(`${id}.briefing`, sc.briefing)
  sc.objectives.forEach(o => add(`${id}.obj.${o.id}`, o.text))
  // jména lodí/ostrovů jsou best-effort (španělská a vlastní jména se nepřekládají),
  // POPISY jsou povinné
  sc.ships.forEach(s => add(`${id}.shipdesc.${s.name}`, s.desc))
  for (const i of sc.islands ?? []) add(`${id}.isledesc.${i.id}`, i.desc)
  for (const trg of sc.triggers) for (const a of trg.actions) add(`${id}.${trg.id}.${a.kind}`, a.text)
  return out
}

describe('čeština — úplnost překladu obsahu', () => {
  it('všechny texty všech misí mají český překlad', () => {
    const missing: string[] = []
    for (const id of Object.keys(SCENARIOS)) {
      if (id === 'skirmish') continue
      for (const { where, text } of scenarioStrings(id)) {
        if (!hasCs(text)) missing.push(`${where}: "${text.slice(0, 60)}"`)
      }
    }
    expect(missing).toEqual([])
  })

  it('celý příběh (intro, porážka, prology, epilogy) má český překlad', () => {
    const missing: string[] = []
    if (!hasCs(CAMPAIGN_INTRO)) missing.push('CAMPAIGN_INTRO')
    if (!hasCs(DEFEAT_GENERIC)) missing.push('DEFEAT_GENERIC')
    for (const [id, st] of Object.entries(MISSION_STORY)) {
      if (st.prolog && !hasCs(st.prolog)) missing.push(`${id}.prolog`)
      if (st.epilog && !hasCs(st.epilog)) missing.push(`${id}.epilog`)
      if (st.epilogLose && !hasCs(st.epilogLose)) missing.push(`${id}.epilogLose`)
    }
    expect(missing).toEqual([])
  })

  it('všechny bojové výkřiky mají český překlad', () => {
    const missing = Object.entries(BARKS).filter(([, b]) => !hasCs(b.text)).map(([id]) => id)
    expect(missing).toEqual([])
  })

  it('všechny lodní třídy mají přeložené jméno', () => {
    const missing = Object.values(SHIP_CLASSES).filter(d => !hasCs(d.name)).map(d => d.id)
    expect(missing).toEqual([])
  })
})

describe('čeština — funkčnost', () => {
  it('t() překládá a padá zpět na angličtinu u neznámého textu', () => {
    setActiveLang('cs')
    expect(t('hull')).toBe('trup')
    expect(t('some-unknown-string-xyz')).toBe('some-unknown-string-xyz')
    setActiveLang('en')
    expect(t('hull')).toBe('hull')
  })

  it('tp() dosazuje do přeložené šablony', () => {
    setActiveLang('cs')
    expect(tp('Buy — {p} 🪙', { p: 280 })).toBe('Koupit — 280 🪙')
    setActiveLang('en')
    expect(tp('Buy — {p} 🪙', { p: 280 })).toBe('Buy — 280 🪙')
  })

  it('localizeScenario: mise 1 je česky (briefing, cíle, jména lodí)', () => {
    setActiveLang('cs')
    const sc = localizeScenario(SCENARIOS.mission01)
    expect(sc.briefing).toContain('Vlaštovka')
    expect(sc.ships.some(s => s.name === 'Mořská panna')).toBe(true)
    expect(sc.objectives[0].text).not.toBe(SCENARIOS.mission01.objectives[0].text)
    // původní modul zůstal anglicky (hluboká kopie)
    expect(SCENARIOS.mission01.briefing).toContain('Swallow')
  })

  it('sim s češtinou vydává české dynamické hlášky (výstřel salvy)', () => {
    setActiveLang('cs')
    const sc = localizeScenario(SCENARIOS.mission01)
    const st = sim.create(sc)
    const A = st.ships.find(s => s.doctrine === 'player')!
    const B = st.ships.find(s => s.side === 'enemy')!
    B.pos = { x: 0, y: -250 } // na dostřel, kolmo na pravobok (heading ~0)
    sim.applyOrder(st, { kind: 'fireBroadside', shipId: A.id, side: 'stbd', targetId: B.id, shot: 'round' })
    sim.tick(st, SIM_DT)
    const fire = st.events.find(e => e.kind === 'gunFire' && e.shipId === A.id)
    expect(fire, 'salva nevyšla — uprav geometrii testu').toBeTruthy()
    expect(fire!.text).toContain('PAL')
  })
})
