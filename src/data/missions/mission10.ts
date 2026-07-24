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
  title: 'The Silver Fleet',
  briefing:
    'Behind the fortress of Cádiz lies Castilla\'s last treasure fleet at anchor: two '
    + 'galleons full of colonial silver, guarded by a ship of the line and two '
    + 'frigates. That silver pays for de Vega\'s war — we take it from him.\n\n'
    + 'You lead the Sovereign, the frigates Fortuna and Valour, the brig Goshawk and '
    + 'the sloop Swallow. Break the escort and sink or (better) capture both galleons. '
    + 'Grape on the decks, then board — a captured treasure galleon is the end of the '
    + 'Castillan treasury.',
  seed: 17052208,
  ambient: '#0b2731',
  wind: { baseDir: 2.1, baseSpeed: 7.5, rotationRate: 0.0012, gustiness: 0.6 },

  islands: [
    { id: 'inner-n', name: 'Inner Bay (north)', kind: 'island', poly: circlePoly(2400, 2200, 640, 15, 0.3) },
    { id: 'inner-s', name: 'Inner Bay (south)', kind: 'island', poly: circlePoly(2600, -2300, 660, 15, 0.3) },
    { id: 'mole', name: 'The Quay', kind: 'island', poly: circlePoly(4600, 0, 400, 12, 0.28), desc: 'A stone quay dividing the inner anchorage.' },
    { id: 'bar10', name: 'Anchor Shallows', kind: 'reef', depth: 4, poly: circlePoly(3400, 700, 320, 10, 0.4) },
  ],

  ships: [
    { classId: 'liner-albion', side: 'player', name: 'HMS Sovereign', pos: { x: 0, y: 0 }, vel: { x: 2, y: 0 }, heading: 0, doctrine: 'player', fireControl: { mode: 'auto', shot: 'round', engaged: false } },
    { classId: 'frigate-albion', side: 'player', name: 'HMS Fortuna', pos: { x: -400, y: 900 }, vel: { x: 3, y: 0 }, heading: 0, doctrine: 'raider', fireControl: { mode: 'auto', shot: 'round', engaged: false } },
    { classId: 'brig-albion', side: 'player', name: 'HMS Goshawk', pos: { x: -500, y: -400 }, vel: { x: 3, y: 0 }, heading: 0, doctrine: 'raider', fireControl: { mode: 'auto', shot: 'grape', engaged: false } },
    { classId: 'sloop-albion', side: 'player', name: 'HMS Swallow', pos: { x: -500, y: -900 }, vel: { x: 3, y: 0 }, heading: 0, doctrine: 'raider', fireControl: { mode: 'auto', shot: 'chain', engaged: false } },
    { classId: 'liner-castilla', side: 'enemy', name: 'Bastión del Mar', pos: { x: 4000, y: 200 }, vel: { x: -1, y: 0 }, heading: Math.PI, doctrine: 'attack', fireControl: { mode: 'auto', shot: 'round', engaged: false } },
    { classId: 'frigate-castilla', side: 'enemy', name: 'Tiburón', pos: { x: 3600, y: 1600 }, vel: { x: -2, y: 0 }, heading: Math.PI, doctrine: 'attack', fireControl: { mode: 'auto', shot: 'round', engaged: false } },
    { classId: 'frigate-castilla', side: 'enemy', name: 'Barracuda', pos: { x: 3700, y: -1500 }, vel: { x: -2, y: 0 }, heading: Math.PI, doctrine: 'attack', fireControl: { mode: 'auto', shot: 'round', engaged: false } },
    { classId: 'galleon-castilla', side: 'enemy', name: 'Nuestra Señora', pos: { x: 5200, y: 700 }, vel: { x: -1, y: 0 }, heading: Math.PI, doctrine: 'attack', fireControl: { mode: 'auto', shot: 'round', engaged: false }, desc: 'A treasure galleon full of silver — the prize of dreams.' },
    { classId: 'galleon-castilla', side: 'enemy', name: 'Santa Fortuna', pos: { x: 5200, y: -700 }, vel: { x: -1, y: 0 }, heading: Math.PI, doctrine: 'attack', fireControl: { mode: 'auto', shot: 'round', engaged: false }, desc: 'The fleet\'s second treasure galleon.' },
    // 5. spojenec (id 10, na konci pole — neposouvá id nepřátel v triggerech)
    { classId: 'frigate-albion', side: 'player', name: 'HMS Valour', pos: { x: -400, y: 500 }, vel: { x: 3, y: 0 }, heading: 0, doctrine: 'raider', fireControl: { mode: 'auto', shot: 'round', engaged: false } },
  ],

  objectives: [
    { id: 'obj-escort', text: 'Break the escort (ship of the line + 2 frigates)', state: 'open' },
    { id: 'obj-silver', text: 'Destroy or capture both treasure galleons', state: 'open' },
  ],

  triggers: [
    { id: 'trg-brief', once: true, conditions: [{ kind: 'time', t: 4 }], actions: [{ kind: 'comm', speaker: 'admiral', text: 'Admiral Thorne: "This silver keeps de Vega\'s war afloat. Take it from him — and if a galleon can be captured rather than sunk, capture her. The crown can put silver to use just as well as Castilla."' }] },
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
    { id: 'trg-win', once: true, conditions: [{ kind: 'flag', flag: 'e5' }, { kind: 'flag', flag: 'e6' }, { kind: 'flag', flag: 'e7' }, { kind: 'flag', flag: 'g8' }, { kind: 'flag', flag: 'g9' }], actions: [{ kind: 'winMission', text: 'The silver fleet is dealt with. Without silver, de Vega\'s war is dead — all that remains is the man himself and Corona.' }] },
    { id: 'trg-lost', once: true, conditions: [{ kind: 'allDestroyed', side: 'player' }], actions: [{ kind: 'loseMission', text: 'HMS Sovereign fell among the galleons. The silver sailed on.' }] },
  ],
}
