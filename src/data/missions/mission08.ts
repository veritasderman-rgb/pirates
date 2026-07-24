/**
 * Mise 8 — „Lov na de Vegu" (eskadra 3 vs 4). De Vega prchá na kurýru pod
 * ochranou pomocného křižníku a dvou fregat. Rozbij jeho eskortu — de Vega
 * sám unikne k Cádizu (a připraví finále), ale jeho štít padne.
 *
 * Id: 1 Fortuna(hráč) 2 Ostříž 3 spojenecká fregata | 4 Q-loď 5-6 fregaty 7 de Vegův kurýr
 */
import type { Scenario } from '../../sim/types'
import { circlePoly } from '../../sim/geom'

const FORTUNA = 1
const VEGA = 7

export const mission08: Scenario = {
  id: 'mission08',
  title: 'The Hunt for de Vega',
  briefing:
    'The scouts have finally fixed his position: Don Cristóbal de Vega himself, on a '
    + 'fast courier, is making for Cádiz under the protection of an auxiliary cruiser '
    + 'and two frigates.\n\n'
    + 'We won\'t catch his courier before she slips away — but we can break his escort '
    + 'and strip him of his shield. You lead the Fortuna, the Goshawk and the allied '
    + 'frigate Valour. Deal with the Q-ship and both frigates; let the courier run.',
  seed: 17050930,
  ambient: '#0c2934',
  wind: { baseDir: 2.7, baseSpeed: 8.5, rotationRate: 0.001, gustiness: 0.55 },

  islands: [
    { id: 'wreck', name: 'The Wrecks', kind: 'island', poly: circlePoly(3000, -1500, 560, 14, 0.32) },
    { id: 'twin', name: 'The Twin', kind: 'island', poly: circlePoly(2200, 1700, 460, 12, 0.3) },
    { id: 'bar8', name: 'The Shoal', kind: 'reef', depth: 3, poly: circlePoly(4000, 400, 340, 10, 0.4) },
  ],

  ships: [
    { classId: 'frigate-albion', side: 'player', name: 'HMS Fortuna', pos: { x: 0, y: 0 }, vel: { x: 3, y: 0 }, heading: 0, doctrine: 'player', fireControl: { mode: 'auto', shot: 'round', engaged: false } },
    { classId: 'brig-albion', side: 'player', name: 'HMS Goshawk', pos: { x: -350, y: 600 }, vel: { x: 3, y: 0 }, heading: 0, doctrine: 'raider', fireControl: { mode: 'auto', shot: 'round', engaged: false } },
    { classId: 'frigate-albion', side: 'player', name: 'HMS Valour', pos: { x: -400, y: -600 }, vel: { x: 3, y: 0 }, heading: 0, doctrine: 'raider', fireControl: { mode: 'auto', shot: 'round', engaged: false } },
    { classId: 'qship-castilla', side: 'enemy', name: 'Sombra', pos: { x: 3600, y: 200 }, vel: { x: -3, y: 0 }, heading: Math.PI, doctrine: 'attack', fireControl: { mode: 'auto', shot: 'round', engaged: false } },
    { classId: 'frigate-castilla', side: 'enemy', name: 'Vendaval', pos: { x: 4000, y: 1300 }, vel: { x: -3, y: 0 }, heading: Math.PI, doctrine: 'attack', fireControl: { mode: 'auto', shot: 'round', engaged: false } },
    { classId: 'frigate-castilla', side: 'enemy', name: 'Aguacero', pos: { x: 4200, y: -900 }, vel: { x: -3, y: 0 }, heading: Math.PI, doctrine: 'attack', fireControl: { mode: 'auto', shot: 'round', engaged: false } },
    { classId: 'courier-castilla', side: 'enemy', name: 'de Vega\'s Courier', pos: { x: 5200, y: 200 }, vel: { x: -4, y: 0 }, heading: Math.PI, doctrine: 'transit', nav: { kind: 'course', dest: { x: 9000, y: 200 }, arriveAtRest: false }, trim: 1, desc: 'A fast courier aboard which Don Cristóbal de Vega is fleeing.' },
    // 4. spojenec (id 8, na konci pole, ať se neposunou id nepřátel v triggerech)
    { classId: 'sloop-albion', side: 'player', name: 'HMS Swallow', pos: { x: -400, y: 100 }, vel: { x: 3, y: 0 }, heading: 0, doctrine: 'raider', fireControl: { mode: 'auto', shot: 'chain', engaged: false } },
  ],

  objectives: [{ id: 'obj-escort', text: 'Break de Vega\'s escort (Q-ship + 2 frigates)', state: 'open' }],

  triggers: [
    { id: 'trg-brief', once: true, conditions: [{ kind: 'time', t: 4 }], actions: [{ kind: 'comm', speaker: 'agent', text: 'Don Cristóbal de Vega: "You have courage, captain, I grant you that. But courage is not a fleet. Sombra, hold them up — we\'ll meet at Cádiz, where Corona awaits you."' }] },
    { id: 'trg-vega-flees', once: true, conditions: [{ kind: 'distanceAbove', shipA: VEGA, shipB: FORTUNA, distance: 6500 }], actions: [{ kind: 'comm', speaker: 'mate', text: 'Rusk: "The courier is gone, we can\'t catch her. But his escort stayed — let\'s break it, and de Vega sails to the finale stripped bare."' }] },
    { id: 'e4a', once: true, conditions: [{ kind: 'shipDestroyed', shipId: 4 }], actions: [{ kind: 'setFlag', flag: 'e4' }] },
    { id: 'e4b', once: true, conditions: [{ kind: 'shipSurrendered', shipId: 4 }], actions: [{ kind: 'setFlag', flag: 'e4' }] },
    { id: 'e5a', once: true, conditions: [{ kind: 'shipDestroyed', shipId: 5 }], actions: [{ kind: 'setFlag', flag: 'e5' }] },
    { id: 'e5b', once: true, conditions: [{ kind: 'shipSurrendered', shipId: 5 }], actions: [{ kind: 'setFlag', flag: 'e5' }] },
    { id: 'e6a', once: true, conditions: [{ kind: 'shipDestroyed', shipId: 6 }], actions: [{ kind: 'setFlag', flag: 'e6' }] },
    { id: 'e6b', once: true, conditions: [{ kind: 'shipSurrendered', shipId: 6 }], actions: [{ kind: 'setFlag', flag: 'e6' }] },
    { id: 'trg-win', once: true, conditions: [{ kind: 'flag', flag: 'e4' }, { kind: 'flag', flag: 'e5' }, { kind: 'flag', flag: 'e6' }], actions: [{ kind: 'objectiveComplete', objectiveId: 'obj-escort' }, { kind: 'winMission', text: 'The escort on the bottom. De Vega reached Cádiz without his shield — and there it will be decided.' }] },
    { id: 'trg-lost', once: true, conditions: [{ kind: 'allDestroyed', side: 'player' }], actions: [{ kind: 'loseMission', text: 'HMS Fortuna fell. De Vega vanished and the hunt is over.' }] },
  ],
}
