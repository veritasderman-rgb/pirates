/**
 * Mise 10 — „Stříbrná flotila" (eskadra 4 vs 5). Uvnitř Cádizu kotví poslední
 * pokladní flotila: dvě galeony plné stříbra pod ochranou řadové lodi a dvou
 * fregat. Znič nebo zajmi eskortu i obě galeony — stříbro je motor de Vegovy
 * války.
 *
 * Id: 1 Sovereign(hráč) 2 Fortuna 3 Ostříž 4 Vlaštovka | 5 liner 6-7 fregaty 8-9 galeony
 */
import type { Scenario } from '../../sim/types'
import { circlePoly } from '../../sim/geom'

const SOVEREIGN = 1

export const mission10: Scenario = {
  id: 'mission10',
  title: 'Stříbrná flotila',
  briefing:
    'Za pevností Cádizu kotví poslední pokladní flotila Castilly: dvě galeony '
    + 'plné koloniálního stříbra, kryté řadovou lodí a dvěma fregatami. To '
    + 'stříbro platí de Vegovu válku — vezmeme mu ho.\n\n'
    + 'Vedeš Sovereign, fregaty Fortunu a Odvahu, brigu Ostříž a šalupu Vlaštovku. Rozbij eskortu a obě '
    + 'galeony potop nebo (lépe) zajmi. Kartáč na paluby, pak boarding — '
    + 'zajatá pokladní galeona je konec castillské pokladny.',
  seed: 17052208,
  ambient: '#0b2731',
  wind: { baseDir: 2.1, baseSpeed: 7.5, rotationRate: 0.0012, gustiness: 0.6 },

  islands: [
    { id: 'inner-n', name: 'Vnitřní záliv (sever)', kind: 'island', poly: circlePoly(2400, 2200, 640, 15, 0.3) },
    { id: 'inner-s', name: 'Vnitřní záliv (jih)', kind: 'island', poly: circlePoly(2600, -2300, 660, 15, 0.3) },
    { id: 'mole', name: 'Mólo', kind: 'island', poly: circlePoly(4600, 0, 400, 12, 0.28), desc: 'Kamenné mólo dělící vnitřní kotviště.' },
    { id: 'bar10', name: 'Kotevní mělčina', kind: 'reef', depth: 4, poly: circlePoly(3400, 700, 320, 10, 0.4) },
  ],

  ships: [
    { classId: 'liner-albion', side: 'player', name: 'HMS Sovereign', pos: { x: 0, y: 0 }, vel: { x: 2, y: 0 }, heading: 0, doctrine: 'player', fireControl: { mode: 'auto', shot: 'round', engaged: false } },
    { classId: 'frigate-albion', side: 'player', name: 'HMS Fortuna', pos: { x: -400, y: 900 }, vel: { x: 3, y: 0 }, heading: 0, doctrine: 'raider', fireControl: { mode: 'auto', shot: 'round', engaged: false } },
    { classId: 'brig-albion', side: 'player', name: 'HMS Ostříž', pos: { x: -500, y: -400 }, vel: { x: 3, y: 0 }, heading: 0, doctrine: 'raider', fireControl: { mode: 'auto', shot: 'grape', engaged: false } },
    { classId: 'sloop-albion', side: 'player', name: 'HMS Vlaštovka', pos: { x: -500, y: -900 }, vel: { x: 3, y: 0 }, heading: 0, doctrine: 'raider', fireControl: { mode: 'auto', shot: 'chain', engaged: false } },
    { classId: 'liner-castilla', side: 'enemy', name: 'Bastión del Mar', pos: { x: 4000, y: 200 }, vel: { x: -1, y: 0 }, heading: Math.PI, doctrine: 'attack', fireControl: { mode: 'auto', shot: 'round', engaged: false } },
    { classId: 'frigate-castilla', side: 'enemy', name: 'Tiburón', pos: { x: 3600, y: 1600 }, vel: { x: -2, y: 0 }, heading: Math.PI, doctrine: 'attack', fireControl: { mode: 'auto', shot: 'round', engaged: false } },
    { classId: 'frigate-castilla', side: 'enemy', name: 'Barracuda', pos: { x: 3700, y: -1500 }, vel: { x: -2, y: 0 }, heading: Math.PI, doctrine: 'attack', fireControl: { mode: 'auto', shot: 'round', engaged: false } },
    { classId: 'galleon-castilla', side: 'enemy', name: 'Nuestra Señora', pos: { x: 5200, y: 700 }, vel: { x: -1, y: 0 }, heading: Math.PI, doctrine: 'attack', fireControl: { mode: 'auto', shot: 'round', engaged: false }, desc: 'Pokladní galeona plná stříbra — kořist snů.' },
    { classId: 'galleon-castilla', side: 'enemy', name: 'Santa Fortuna', pos: { x: 5200, y: -700 }, vel: { x: -1, y: 0 }, heading: Math.PI, doctrine: 'attack', fireControl: { mode: 'auto', shot: 'round', engaged: false }, desc: 'Druhá pokladní galeona flotily.' },
    // 5. spojenec (id 10, na konci pole — neposouvá id nepřátel v triggerech)
    { classId: 'frigate-albion', side: 'player', name: 'HMS Odvaha', pos: { x: -400, y: 500 }, vel: { x: 3, y: 0 }, heading: 0, doctrine: 'raider', fireControl: { mode: 'auto', shot: 'round', engaged: false } },
  ],

  objectives: [
    { id: 'obj-escort', text: 'Rozbij eskortu (řadová loď + 2 fregaty)', state: 'open' },
    { id: 'obj-silver', text: 'Znič nebo zajmi obě pokladní galeony', state: 'open' },
  ],

  triggers: [
    { id: 'trg-brief', once: true, conditions: [{ kind: 'time', t: 4 }], actions: [{ kind: 'comm', speaker: 'admiral', text: 'admirál Thorne: „Tohle stříbro drží de Vegovu válku nad vodou. Vezměte mu ho — a jestli jde galeonu zajmout místo potopit, zajměte. Koruna umí stříbro použít stejně dobře jako Castilla."' }] },
    // eskorta
    { id: 'e5a', once: true, conditions: [{ kind: 'shipDestroyed', shipId: 5 }], actions: [{ kind: 'setFlag', flag: 'e5' }] },
    { id: 'e5b', once: true, conditions: [{ kind: 'shipSurrendered', shipId: 5 }], actions: [{ kind: 'setFlag', flag: 'e5' }] },
    { id: 'e6a', once: true, conditions: [{ kind: 'shipDestroyed', shipId: 6 }], actions: [{ kind: 'setFlag', flag: 'e6' }] },
    { id: 'e6b', once: true, conditions: [{ kind: 'shipSurrendered', shipId: 6 }], actions: [{ kind: 'setFlag', flag: 'e6' }] },
    { id: 'e7a', once: true, conditions: [{ kind: 'shipDestroyed', shipId: 7 }], actions: [{ kind: 'setFlag', flag: 'e7' }] },
    { id: 'e7b', once: true, conditions: [{ kind: 'shipSurrendered', shipId: 7 }], actions: [{ kind: 'setFlag', flag: 'e7' }] },
    { id: 'trg-escort', once: true, conditions: [{ kind: 'flag', flag: 'e5' }, { kind: 'flag', flag: 'e6' }, { kind: 'flag', flag: 'e7' }], actions: [{ kind: 'objectiveComplete', objectiveId: 'obj-escort' }] },
    // galeony
    { id: 'g8a', once: true, conditions: [{ kind: 'shipDestroyed', shipId: 8 }], actions: [{ kind: 'setFlag', flag: 'g8' }] },
    { id: 'g8b', once: true, conditions: [{ kind: 'shipSurrendered', shipId: 8 }], actions: [{ kind: 'setFlag', flag: 'g8' }] },
    { id: 'g9a', once: true, conditions: [{ kind: 'shipDestroyed', shipId: 9 }], actions: [{ kind: 'setFlag', flag: 'g9' }] },
    { id: 'g9b', once: true, conditions: [{ kind: 'shipSurrendered', shipId: 9 }], actions: [{ kind: 'setFlag', flag: 'g9' }] },
    { id: 'trg-silver', once: true, conditions: [{ kind: 'flag', flag: 'g8' }, { kind: 'flag', flag: 'g9' }], actions: [{ kind: 'objectiveComplete', objectiveId: 'obj-silver' }] },
    // výhra
    { id: 'trg-win', once: true, conditions: [{ kind: 'flag', flag: 'e5' }, { kind: 'flag', flag: 'e6' }, { kind: 'flag', flag: 'e7' }, { kind: 'flag', flag: 'g8' }, { kind: 'flag', flag: 'g9' }], actions: [{ kind: 'winMission', text: 'Stříbrná flotila je vyřízena. Bez stříbra je de Vegova válka mrtvá — zbývá jen on sám a Corona.' }] },
    { id: 'trg-lost', once: true, conditions: [{ kind: 'allDestroyed', side: 'player' }], actions: [{ kind: 'loseMission', text: 'HMS Sovereign padla mezi galeonami. Stříbro proplulo.' }] },
  ],
}
