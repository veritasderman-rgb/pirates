/**
 * Skirmish — volná bitva mimo kampaň (placený obsah). Hráč zvolí svou loď,
 * složení nepřítele, počasí a mapu; z toho se vygeneruje ad-hoc Scenario pro
 * stejný sim engine. Deterministické: seed se odvozuje z voleb, takže stejné
 * nastavení dá stejnou bitvu (a REPLAY je opakovatelný).
 */
import type { Scenario, ShipSpec, Island, WindConfig } from '../sim/types'
import { circlePoly } from '../sim/geom'
import { SHIP_CLASSES } from './defs'

export type Weather = 'calm' | 'breeze' | 'storm'
export type SkirmishMap = 'open' | 'islands' | 'reef'

export interface SkirmishOptions {
  playerClass: string
  enemyClass: string
  enemyCount: number // 1..4
  weather: Weather
  map: SkirmishMap
}

/** Nabídka lodí hráče (vlastní Královské námořnictvo, eskalace síly). */
export const SKIRMISH_PLAYER_SHIPS = ['sloop-albion', 'brig-albion', 'frigate-albion', 'liner-albion']
/** Nabídka nepřátel (piráti + Castilla). */
export const SKIRMISH_ENEMY_SHIPS = [
  'sloop-pirate', 'brig-pirate', 'galley-corsair',
  'frigate-castilla', 'galleon-castilla', 'liner-castilla', 'flagship-castilla',
]

export const WEATHER_LABEL: Record<Weather, string> = { calm: 'Calm', breeze: 'Fresh breeze', storm: 'Storm' }
export const MAP_LABEL: Record<SkirmishMap, string> = { open: 'Open sea', islands: 'Islands', reef: 'Reef' }

const WEATHER_WIND: Record<Weather, { wind: WindConfig; ambient: string }> = {
  calm: { wind: { baseDir: 0.3, baseSpeed: 3.5, rotationRate: 0.0006, gustiness: 0.2 }, ambient: '#0e3c4a' },
  breeze: { wind: { baseDir: 0.3, baseSpeed: 8.5, rotationRate: 0.0009, gustiness: 0.45 }, ambient: '#0d3b4a' },
  storm: { wind: { baseDir: 0.3, baseSpeed: 13, rotationRate: 0.0016, gustiness: 0.9 }, ambient: '#0a2731' },
}

function mapIslands(kind: SkirmishMap): Island[] {
  if (kind === 'islands') {
    return [
      { id: 'sk-isle-a', name: 'Gull Rock', kind: 'island', poly: circlePoly(900, -1250, 420, 13, 0.32),
        desc: 'A wind-scoured rock — its lee robs the wind, its shoals rob the keel.' },
      { id: 'sk-isle-b', name: 'Low Cay', kind: 'island', poly: circlePoly(1250, 1200, 360, 12, 0.34),
        desc: 'A low sandy cay off the fighting ground.' },
    ]
  }
  if (kind === 'reef') {
    return [
      { id: 'sk-reef', name: 'The Teeth', kind: 'reef', depth: 2, poly: circlePoly(950, -300, 340, 11, 0.4),
        desc: 'Reefs just below the surface — sloops sail over, deep hulls leave their bottom here.' },
    ]
  }
  return []
}

/** Stabilní seed z voleb (bez Date/Math.random — determinismus). */
function seedFrom(o: SkirmishOptions): number {
  const s = `${o.playerClass}|${o.enemyClass}|${o.enemyCount}|${o.weather}|${o.map}`
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return (h >>> 0) || 1
}

/** Sestav skirmish scénář z voleb. */
export function buildSkirmish(o: SkirmishOptions): Scenario {
  const count = Math.max(1, Math.min(4, Math.round(o.enemyCount)))
  const w = WEATHER_WIND[o.weather]
  const pName = SHIP_CLASSES[o.playerClass]?.name ?? o.playerClass
  const eName = SHIP_CLASSES[o.enemyClass]?.name ?? o.enemyClass

  const ships: ShipSpec[] = [
    {
      classId: o.playerClass, side: 'player', name: `HMS ${pName}`,
      pos: { x: 0, y: 0 }, vel: { x: 2, y: 0 }, heading: 0, doctrine: 'player',
      fireControl: { mode: 'hold', shot: 'round', engaged: false },
    },
  ]
  // nepřátelé v rojnici před hráčem, čelem k němu — doctrine 'attack' (AI stáčí bok a pálí)
  for (let i = 0; i < count; i++) {
    const y = (i - (count - 1) / 2) * 560
    const x = 1650 + (i % 2) * 320
    ships.push({
      classId: o.enemyClass, side: 'enemy', name: count > 1 ? `${eName} ${i + 1}` : eName,
      pos: { x, y }, vel: { x: -1, y: 0 }, heading: Math.PI, doctrine: 'attack',
    })
  }

  return {
    id: 'skirmish',
    title: 'Skirmish',
    briefing: `A free engagement off the Halcyon shoals — no orders, no quarter asked.\n\n`
      + `You command the ${pName} against ${count}× ${eName}. Weather: ${WEATHER_LABEL[o.weather].toLowerCase()}. `
      + `Ground: ${MAP_LABEL[o.map].toLowerCase()}. Sink or take the lot — and keep your own hull off the bottom.`,
    seed: seedFrom(o),
    ambient: w.ambient,
    wind: w.wind,
    islands: mapIslands(o.map),
    ships,
    objectives: [
      { id: 'obj-clear', text: 'Sink or capture the enemy squadron', state: 'open' },
      { id: 'obj-survive', text: 'Keep your flagship afloat', state: 'open' },
    ],
    triggers: [
      {
        id: 'sk-win', once: true,
        conditions: [{ kind: 'allDestroyed', side: 'enemy' }],
        actions: [
          { kind: 'objectiveComplete', objectiveId: 'obj-clear' },
          { kind: 'winMission', text: 'The enemy squadron is beaten — the sea is yours.' },
        ],
      },
      {
        id: 'sk-lose', once: true,
        conditions: [{ kind: 'allDestroyed', side: 'player' }],
        actions: [
          { kind: 'objectiveFail', objectiveId: 'obj-survive' },
          { kind: 'loseMission', text: 'Your flagship has gone to the bottom.' },
        ],
      },
    ],
  }
}
