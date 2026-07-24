/**
 * Mise 7 — „Odveta" (eskadra 3 vs 3). Po porážce u Tří majáků udeří Castilla
 * v odvetě: eskadra fregat napadá albionskou kotvící stanici u Rackova ostrova.
 * Vedeš Fortunu, brigu Ostříž a šalupu Vlaštovku proti třem castillským fregatám.
 *
 * Id: 1 Fortuna(hráč) 2 Ostříž 3 Vlaštovka | 4-6 castillské fregaty
 */
import type { Scenario } from '../../sim/types'
import { circlePoly } from '../../sim/geom'

const FORTUNA = 1

export const mission07: Scenario = {
  id: 'mission07',
  title: 'Reprisal',
  briefing:
    'The Three Beacons did not stop Castilla — it only enraged her. In reprisal, de '
    + 'Vega has sent a squadron of frigates against the Albion anchor station at Gull '
    + 'Island.\n\n'
    + 'You drive them off with the Fortuna, the Goshawk and the Swallow. Three '
    + 'Castillan frigates have wider broadsides but worse training — trust to your '
    + 'mobility, split your fire and don\'t let them bring their broadsides to bear on '
    + 'you all at once.',
  seed: 17050212,
  ambient: '#0d2c37',
  wind: { baseDir: 0.4, baseSpeed: 8, rotationRate: 0.001, gustiness: 0.5 },

  islands: [
    { id: 'gull', name: 'Gull Island', kind: 'island', poly: circlePoly(2600, 900, 620, 15, 0.3),
      desc: 'Gull Island — an Albion anchor station in its lee.' },
    { id: 'skerry', name: 'The Crags', kind: 'reef', depth: 3, poly: circlePoly(1400, -1400, 320, 10, 0.4) },
  ],

  ships: [
    { classId: 'frigate-albion', side: 'player', name: 'HMS Fortuna', pos: { x: 0, y: 0 }, vel: { x: 3, y: 0 }, heading: 0, doctrine: 'player', fireControl: { mode: 'auto', shot: 'round', engaged: false } },
    { classId: 'brig-albion', side: 'player', name: 'HMS Goshawk', pos: { x: -350, y: 550 }, vel: { x: 3, y: 0 }, heading: 0, doctrine: 'raider', fireControl: { mode: 'auto', shot: 'round', engaged: false } },
    { classId: 'sloop-albion', side: 'player', name: 'HMS Swallow', pos: { x: -350, y: -500 }, vel: { x: 3, y: 0 }, heading: 0, doctrine: 'raider', fireControl: { mode: 'auto', shot: 'chain', engaged: false } },
    { classId: 'frigate-castilla', side: 'enemy', name: 'Tormenta', pos: { x: 3800, y: 300 }, vel: { x: -3, y: 0 }, heading: Math.PI, doctrine: 'attack', fireControl: { mode: 'auto', shot: 'round', engaged: false } },
    { classId: 'frigate-castilla', side: 'enemy', name: 'Relámpago', pos: { x: 4100, y: 1400 }, vel: { x: -3, y: 0 }, heading: Math.PI, doctrine: 'attack', fireControl: { mode: 'auto', shot: 'round', engaged: false } },
    { classId: 'frigate-castilla', side: 'enemy', name: 'Trueno Menor', pos: { x: 4100, y: -1200 }, vel: { x: -3, y: 0 }, heading: Math.PI, doctrine: 'attack', fireControl: { mode: 'auto', shot: 'round', engaged: false } },
    // 4. spojenec (id 7, na konci pole, ať se neposunou id nepřátel v triggerech)
    { classId: 'frigate-albion', side: 'player', name: 'HMS Valour', pos: { x: -350, y: 100 }, vel: { x: 3, y: 0 }, heading: 0, doctrine: 'raider', fireControl: { mode: 'auto', shot: 'round', engaged: false } },
  ],

  objectives: [{ id: 'obj-squadron', text: 'Take out the Castillan squadron (3 frigates)', state: 'open' }],

  triggers: [
    { id: 'trg-brief', once: true, conditions: [{ kind: 'time', t: 4 }], actions: [{ kind: 'comm', speaker: 'admiral', text: 'Admiral Thorne: "This is de Vega\'s calling card, captain. Drive them from the station and show Castilla the Three Beacons was no accident."' }] },
    { id: 'e4a', once: true, conditions: [{ kind: 'shipDestroyed', shipId: 4 }], actions: [{ kind: 'setFlag', flag: 'e4' }] },
    { id: 'e4b', once: true, conditions: [{ kind: 'shipSurrendered', shipId: 4 }], actions: [{ kind: 'setFlag', flag: 'e4' }] },
    { id: 'e5a', once: true, conditions: [{ kind: 'shipDestroyed', shipId: 5 }], actions: [{ kind: 'setFlag', flag: 'e5' }] },
    { id: 'e5b', once: true, conditions: [{ kind: 'shipSurrendered', shipId: 5 }], actions: [{ kind: 'setFlag', flag: 'e5' }] },
    { id: 'e6a', once: true, conditions: [{ kind: 'shipDestroyed', shipId: 6 }], actions: [{ kind: 'setFlag', flag: 'e6' }] },
    { id: 'e6b', once: true, conditions: [{ kind: 'shipSurrendered', shipId: 6 }], actions: [{ kind: 'setFlag', flag: 'e6' }] },
    { id: 'trg-win', once: true, conditions: [{ kind: 'flag', flag: 'e4' }, { kind: 'flag', flag: 'e5' }, { kind: 'flag', flag: 'e6' }], actions: [{ kind: 'objectiveComplete', objectiveId: 'obj-squadron' }, { kind: 'winMission', text: 'The reprisal is repelled. The Castillan squadron is broken and the station holds. De Vega will have to think of something better.' }] },
    { id: 'trg-lost', once: true, conditions: [{ kind: 'allDestroyed', side: 'player' }], actions: [{ kind: 'loseMission', text: 'HMS Fortuna fell — the station at Gull Island is lost.' }] },
  ],
}
