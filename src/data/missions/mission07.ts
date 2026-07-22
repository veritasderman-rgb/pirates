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
  title: 'Odveta',
  briefing:
    'Tři majáky Castillu nezastavily — jen rozzuřily. De Vega poslal v odvetě '
    + 'eskadru fregat na albionskou kotvící stanici u Rackova ostrova.\n\n'
    + 'Zaženeš je s Fortunou, Ostřížem a Vlaštovkou. Tři castillské fregaty '
    + 'mají širší salvy, ale horší výcvik — drž se pohyblivosti, rozděl palbu '
    + 'a nedej jim srovnat boky všem naráz.',
  seed: 17050212,
  ambient: '#0d2c37',
  wind: { baseDir: 0.4, baseSpeed: 8, rotationRate: 0.001, gustiness: 0.5 },

  islands: [
    { id: 'gull', name: 'Rackův ostrov', kind: 'island', poly: circlePoly(2600, 900, 620, 15, 0.3),
      desc: 'Rackův ostrov — albionská kotvící stanice v jeho závětří.' },
    { id: 'skerry', name: 'Skaliska', kind: 'reef', depth: 3, poly: circlePoly(1400, -1400, 320, 10, 0.4) },
  ],

  ships: [
    { classId: 'frigate-albion', side: 'player', name: 'HMS Fortuna', pos: { x: 0, y: 0 }, vel: { x: 3, y: 0 }, heading: 0, doctrine: 'player', fireControl: { mode: 'auto', shot: 'round', engaged: false } },
    { classId: 'brig-albion', side: 'player', name: 'HMS Ostříž', pos: { x: -350, y: 550 }, vel: { x: 3, y: 0 }, heading: 0, doctrine: 'raider', fireControl: { mode: 'auto', shot: 'round', engaged: false } },
    { classId: 'sloop-albion', side: 'player', name: 'HMS Vlaštovka', pos: { x: -350, y: -500 }, vel: { x: 3, y: 0 }, heading: 0, doctrine: 'raider', fireControl: { mode: 'auto', shot: 'chain', engaged: false } },
    { classId: 'frigate-castilla', side: 'enemy', name: 'Tormenta', pos: { x: 3800, y: 300 }, vel: { x: -3, y: 0 }, heading: Math.PI, doctrine: 'attack', fireControl: { mode: 'auto', shot: 'round', engaged: false } },
    { classId: 'frigate-castilla', side: 'enemy', name: 'Relámpago', pos: { x: 4100, y: 1400 }, vel: { x: -3, y: 0 }, heading: Math.PI, doctrine: 'attack', fireControl: { mode: 'auto', shot: 'round', engaged: false } },
    { classId: 'frigate-castilla', side: 'enemy', name: 'Trueno Menor', pos: { x: 4100, y: -1200 }, vel: { x: -3, y: 0 }, heading: Math.PI, doctrine: 'attack', fireControl: { mode: 'auto', shot: 'round', engaged: false } },
    // 4. spojenec (id 7, na konci pole, ať se neposunou id nepřátel v triggerech)
    { classId: 'frigate-albion', side: 'player', name: 'HMS Odvaha', pos: { x: -350, y: 100 }, vel: { x: 3, y: 0 }, heading: 0, doctrine: 'raider', fireControl: { mode: 'auto', shot: 'round', engaged: false } },
  ],

  objectives: [{ id: 'obj-squadron', text: 'Vyřaď castillskou eskadru (3 fregaty)', state: 'open' }],

  triggers: [
    { id: 'trg-brief', once: true, conditions: [{ kind: 'time', t: 4 }], actions: [{ kind: 'comm', speaker: 'admiral', text: 'admirál Thorne: „Tohle je de Vegova vizitka, kapitáne. Zažeňte je od stanice a ukažte Castille, že Tři majáky nebyly náhoda."' }] },
    { id: 'e4a', once: true, conditions: [{ kind: 'shipDestroyed', shipId: 4 }], actions: [{ kind: 'setFlag', flag: 'e4' }] },
    { id: 'e4b', once: true, conditions: [{ kind: 'shipSurrendered', shipId: 4 }], actions: [{ kind: 'setFlag', flag: 'e4' }] },
    { id: 'e5a', once: true, conditions: [{ kind: 'shipDestroyed', shipId: 5 }], actions: [{ kind: 'setFlag', flag: 'e5' }] },
    { id: 'e5b', once: true, conditions: [{ kind: 'shipSurrendered', shipId: 5 }], actions: [{ kind: 'setFlag', flag: 'e5' }] },
    { id: 'e6a', once: true, conditions: [{ kind: 'shipDestroyed', shipId: 6 }], actions: [{ kind: 'setFlag', flag: 'e6' }] },
    { id: 'e6b', once: true, conditions: [{ kind: 'shipSurrendered', shipId: 6 }], actions: [{ kind: 'setFlag', flag: 'e6' }] },
    { id: 'trg-win', once: true, conditions: [{ kind: 'flag', flag: 'e4' }, { kind: 'flag', flag: 'e5' }, { kind: 'flag', flag: 'e6' }], actions: [{ kind: 'objectiveComplete', objectiveId: 'obj-squadron' }, { kind: 'winMission', text: 'Odveta odražena. Castillská eskadra je rozbita a stanice drží. De Vega bude muset vymyslet něco lepšího.' }] },
    { id: 'trg-lost', once: true, conditions: [{ kind: 'allDestroyed', side: 'player' }], actions: [{ kind: 'loseMission', text: 'HMS Fortuna padla — stanice u Rackova ostrova je ztracena.' }] },
  ],
}
