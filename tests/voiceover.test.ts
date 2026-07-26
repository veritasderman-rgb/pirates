import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { SCENARIOS } from '../src/data/missions'
import { MISSION_STORY } from '../src/data/story'
import { BARKS } from '../src/data/barks'
import { sim } from '../src/sim/engine'
import { SIM_DT } from '../src/sim/constants'
import type { SimEvent } from '../src/sim/types'

const voDir = resolve(__dirname, '../public/vo')
const manifest = JSON.parse(readFileSync(resolve(voDir, 'manifest.json'), 'utf8')) as {
  lines: { id: string; speaker: string; text: string; kind: string }[]
}
const ids = new Set(manifest.lines.map(l => l.id))

describe('dabing — manifest a klipy', () => {
  it('každá replika v manifestu má vygenerovaný mp3 soubor', () => {
    const missing = manifest.lines.filter(l => !existsSync(resolve(voDir, `${l.id}.mp3`))).map(l => l.id)
    expect(missing).toEqual([])
  })

  it('každá replika má i ČESKÝ klip (public/vo/cs) a český text', () => {
    const noClip = manifest.lines.filter(l => !existsSync(resolve(voDir, 'cs', `${l.id}.mp3`))).map(l => l.id)
    const noText = manifest.lines.filter(l => !(l as { textCs?: string }).textCs).map(l => l.id)
    expect(noClip).toEqual([])
    expect(noText).toEqual([])
  })

  it('každá mise má namluvený briefing', () => {
    for (const id of Object.keys(SCENARIOS)) expect(ids.has(`brief-${id}`)).toBe(true)
  })

  it('každá mise má namluvený prolog i oba epilogy', () => {
    for (const [id, st] of Object.entries(MISSION_STORY)) {
      if (st.prolog) expect(ids.has(`story-${id}-prolog`), `${id} prolog`).toBe(true)
      if (st.epilog) expect(ids.has(`story-${id}-epilog`), `${id} epilog`).toBe(true)
      if (st.epilogLose) expect(ids.has(`story-${id}-epilog-lose`), `${id} epilog-lose`).toBe(true)
    }
  })

  it('každá dialogová hláška v misích je namluvená', () => {
    const missing: string[] = []
    for (const [missionId, sc] of Object.entries(SCENARIOS)) {
      for (const trg of sc.triggers) {
        let n = 0
        for (const a of trg.actions) {
          if (a.kind !== 'comm' && a.kind !== 'message') continue
          const id = `${missionId}-${trg.id}${n++ ? `-${n}` : ''}`
          if (!ids.has(id)) missing.push(id)
        }
      }
    }
    expect(missing).toEqual([])
  })

  it('každý bojový výkřik ze simulace je namluvený', () => {
    for (const id of Object.keys(BARKS)) {
      expect(ids.has(id), `manifest missing ${id}`).toBe(true)
      expect(existsSync(resolve(voDir, `${id}.mp3`)), `no clip for ${id}`).toBe(true)
    }
  })

  it('každá hláška se speakerem mimo triggery má voiceId (jinak by mlčela)', () => {
    // hlídá regresi: kdo přidá comm/message se speakerem do simulace, musí
    // doplnit i bark — jinak se replika zobrazí, ale nikdo ji neřekne
    const srcs = ['weapons.ts', 'surrender.ts', 'engine.ts']
      .map(f => readFileSync(resolve(__dirname, '../src/sim', f), 'utf8'))
      .join('\n')
    const emits = srcs.split(/state\.events\.push\(\{/).slice(1)
    const spoken = emits.filter(e => /kind: '(comm|message)'/.test(e.slice(0, 400)) && /speaker:/.test(e.slice(0, 400)))
    expect(spoken.length).toBeGreaterThan(0)
    for (const e of spoken) {
      expect(/voiceId:/.test(e.slice(0, 500)), `spoken event without voiceId: ${e.slice(0, 90)}`).toBe(true)
    }
  })

  it('voiceId vydaný enginem odpovídá existujícímu klipu (schéma se nerozešlo)', () => {
    // odsimuluj misi 1 a posbírej voiceId z reálně vydaných událostí
    const st = sim.create(SCENARIOS.mission01)
    const seen: SimEvent[] = []
    for (let i = 0; i < Math.round(120 / SIM_DT); i++) {
      sim.tick(st, SIM_DT)
      seen.push(...st.events.filter(e => e.voiceId))
      st.events.length = 0
    }
    expect(seen.length).toBeGreaterThan(0)      // něco se opravdu odvysílalo
    for (const e of seen) {
      expect(ids.has(e.voiceId!), `engine emitted unknown voiceId ${e.voiceId}`).toBe(true)
      expect(existsSync(resolve(voDir, `${e.voiceId}.mp3`)), `no clip for ${e.voiceId}`).toBe(true)
    }
  })
})
