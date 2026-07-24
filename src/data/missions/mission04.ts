/**
 * Mise 4 — „Depeše" (fregata, honba). Rychlý castillský kurýr veze
 * zapečetěné rozkazy k přístavu Punta Negra pod pobřežní pevností. Dostihni
 * ho a zajmi/potop DŘÍV, než se schová pod děla pevnosti. Kurýr je rychlejší
 * na volném větru — musíš mu uříznout cestu, chytit čistý vítr a nebát se
 * dostat na dostřel pevnosti.
 *
 * Id: 1 = HMS Fortuna (hráč), 2 = kurýr „Céfiro", 3 = pevnost Punta Negra,
 *     4 = přístavní bóje (cíl kurýra)
 */
import type { Scenario } from '../../sim/types'
import { circlePoly } from '../../sim/geom'

const FORTUNA = 1
const COURIER = 2
const HAVEN = 4

export const mission04: Scenario = {
  id: 'mission04',
  title: 'Dispatches',
  briefing:
    'The captured orders from the Q-ship were bound for the Castillan port of Punta '
    + 'Negra. Before we could act, a courier — the "Céfiro" — put out from there with '
    + 'a reply, and now she is racing back under the protection of the fortress.\n\n'
    + 'Run her down and seize those dispatches. The Céfiro is faster on a clean wind, '
    + 'but she must make for the harbor; cut off her path, hold your best point of '
    + 'sail and put out oars in a calm. Beware the Punta Negra Fortress — its shot '
    + 'carries farther than yours.',
  seed: 17031530,
  ambient: '#0e2b38',
  // vítr tak, aby plavba k přístavu (na východ) byla zadoboční (rychlá honba)
  wind: { baseDir: 1.22, baseSpeed: 8.5, rotationRate: 0.001, gustiness: 0.5 },

  islands: [
    { id: 'negra', name: 'Punta Negra', kind: 'island', poly: circlePoly(6900, -300, 560, 16, 0.3),
      desc: 'Punta Negra — a black basalt cape; the Castillan port lies in its lee, '
        + 'and a coastal battery guards the throat.' },
    { id: 'sisters', name: 'The Sisters', kind: 'island', poly: circlePoly(2800, 1500, 420, 12, 0.35),
      desc: 'Two rocks, "The Sisters" — the strait between them cuts the way short, for whoever dares.' },
    { id: 'shoal', name: 'Sandbar', kind: 'reef', depth: 3, poly: circlePoly(4200, -1100, 340, 10, 0.4) },
  ],

  ships: [
    {
      // hráč má weather gage: startuje vpředu a nad trasou kurýra, aby ho
      // mohl zachytit úhlem (uříznout cestu), ne ho marně honit z ocasu
      classId: 'frigate-albion', side: 'player', name: 'HMS Fortuna',
      pos: { x: 2600, y: 1100 }, vel: { x: 4, y: 0 }, heading: 0.2, doctrine: 'player',
      fireControl: { mode: 'hold', shot: 'chain', engaged: false },
    },
    {
      // transit: pluje svůj kurz k přístavu a neutíká náhodně — drží termín honby
      classId: 'courier-castilla', side: 'enemy', name: 'Céfiro',
      pos: { x: 1400, y: -1200 }, vel: { x: 5, y: 0 }, heading: 0.2, doctrine: 'transit',
      nav: { kind: 'course', dest: { x: 6050, y: -300 }, arriveAtRest: false }, trim: 1,
      desc: 'The courier sloop "Céfiro" — fast as the wind itself, unarmed. She carries '
        + 'the thing we came for.',
    },
    {
      // baterie u hrdla přístavu, na vodě; natočená tak, aby nesla děla k moři (na západ)
      classId: 'fort-coastal', side: 'enemy', name: 'Punta Negra Fortress',
      pos: { x: 6250, y: -300 }, vel: { x: 0, y: 0 }, heading: Math.PI / 2, doctrine: 'fort',
      sailsUp: false, trim: 0,
      desc: 'The Punta Negra coastal battery — the stone throat of the Castillan port. '
        + 'Its red-hot shot carries farther than ship\'s guns.',
    },
    {
      classId: 'merch', side: 'neutral', name: 'Harbor Entrance',
      pos: { x: 6150, y: -300 }, vel: { x: 0, y: 0 }, heading: 0, doctrine: 'buoy',
      sailsUp: false, trim: 0,
      desc: 'The entrance buoy of Punta Negra harbor — beyond it the Céfiro is under '
        + 'the fortress\'s protection and out of our reach.',
    },
  ],

  objectives: [
    { id: 'obj-catch', text: 'Run down the courier Céfiro (within 400 m)', state: 'open' },
    { id: 'obj-seize', text: 'Capture or sink the courier before she reaches the harbor', state: 'open' },
  ],

  triggers: [
    {
      id: 'trg-brief', once: true, conditions: [{ kind: 'time', t: 3 }],
      actions: [{
        kind: 'comm', speaker: 'admiral',
        text: 'Admiral Thorne: "I want those dispatches whole, captain — not on the '
          + 'seabed. Slow her with chain shot to the sails and force her to surrender. '
          + 'And don\'t stray under the fortress any more than you must."',
      }],
    },
    {
      id: 'trg-wind-tip', once: true, conditions: [{ kind: 'time', t: 18 }],
      actions: [{
        kind: 'comm', speaker: 'mate',
        text: 'Rusk: "On a clean wind she\'s pulling away. Cut her off by the shorter '
          + 'way through the Sisters and catch a broad reach — that\'s where we run her down."',
      }],
    },
    {
      id: 'trg-caught', once: true,
      conditions: [{ kind: 'distanceBelow', shipA: FORTUNA, shipB: COURIER, distance: 400 }],
      actions: [
        { kind: 'objectiveComplete', objectiveId: 'obj-catch' },
        {
          kind: 'comm', speaker: 'gunner',
          text: 'Hargrove: "In range! Chain shot to her rigging to slow her — then grape '
            + 'on the deck and we take her with the grapples."',
        },
      ],
    },
    {
      id: 'trg-courier-struck', once: true, conditions: [{ kind: 'shipSurrendered', shipId: COURIER }],
      actions: [
        { kind: 'objectiveComplete', objectiveId: 'obj-seize' },
        { kind: 'winMission', text: 'The Céfiro struck her colours — the dispatches are ours. De Vega was answering to someone higher.' },
      ],
    },
    {
      id: 'trg-courier-sunk', once: true, conditions: [{ kind: 'shipDestroyed', shipId: COURIER }],
      actions: [
        { kind: 'objectiveComplete', objectiveId: 'obj-seize' },
        { kind: 'winMission', text: 'The Céfiro sunk. The dispatches went down with her — but the messenger will not return home.' },
      ],
    },
    {
      id: 'trg-escaped', once: true,
      conditions: [{ kind: 'distanceBelow', shipA: COURIER, shipB: HAVEN, distance: 350 }],
      actions: [
        { kind: 'objectiveFail', objectiveId: 'obj-seize' },
        { kind: 'loseMission', text: 'The Céfiro slipped in under the guns of the fortress. The dispatches are gone.' },
      ],
    },
    {
      id: 'trg-player-lost', once: true, conditions: [{ kind: 'shipDestroyed', shipId: FORTUNA }],
      actions: [{ kind: 'loseMission', text: 'HMS Fortuna has sunk under the guns of Punta Negra.' }],
    },
  ],
}
