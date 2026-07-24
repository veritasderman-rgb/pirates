/**
 * Mise 6 — „Úžina u Tří majáků" (finále, eskadra). Poslední castillské stříbro
 * míří pod ochranou eskadry almiranteho Herrery na albionské úžiny. Postav se
 * mu v úžině u Tří majáků: HMS Fortuna a dvě spojenecké lodě proti castillské
 * řadové lodi Trueno a fregatě Rayo. Řadovou loď bok po boku neporazíš —
 * obtancuj ji, rozděl palbu a rakuj do zádi.
 *
 * Id: 1 = Fortuna (hráč), 2 = Ostříž (spojenec), 3 = Vlaštovka (spojenec),
 *     4 = Trueno (řadová, Herrera), 5 = Rayo (fregata)
 */
import type { Scenario } from '../../sim/types'
import { circlePoly } from '../../sim/geom'

const FORTUNA = 1
const TRUENO = 4
const RAYO = 5

export const mission06: Scenario = {
  id: 'mission06',
  title: 'The Strait of the Three Beacons',
  briefing:
    'This is where it is decided. The last of Castilla\'s treasure silver is sailing '
    + 'for the Albion straits under the squadron of almirante Herrera — and with it, '
    + 'the war de Vega has been preparing all along. Stop him in the strait at the '
    + 'Three Beacons.\n\n'
    + 'You lead the Fortuna, the brig Goshawk and the sloop Swallow against the ship '
    + 'of the line Trueno and the frigate Rayo. The Trueno has thirty guns to a side — '
    + 'no one beats her alongside. Use the strait and the islands: a ship of the line '
    + 'turns slowly, loses her drive in a wind shadow and dares not enter the shoals. '
    + 'Split your fire, dance around her and rake her bow and stern, where she has no guns.',
  seed: 17041721,
  ambient: '#0b2733',
  wind: { baseDir: 1.9, baseSpeed: 8, rotationRate: 0.0011, gustiness: 0.6 },

  islands: [
    { id: 'beacon-n', name: 'North Beacon', kind: 'island', poly: circlePoly(1200, 2400, 560, 14, 0.3) },
    { id: 'beacon-m', name: 'Middle Beacon', kind: 'island', poly: circlePoly(3000, 0, 640, 16, 0.28),
      desc: 'The middle of the Three Beacons — it splits the strait into two channels; the key to the whole battle.' },
    { id: 'beacon-s', name: 'South Beacon', kind: 'island', poly: circlePoly(1400, -2400, 560, 14, 0.32) },
    { id: 'reef-w', name: 'Beacon Teeth', kind: 'reef', depth: 3, poly: circlePoly(4600, 1200, 340, 10, 0.4) },
  ],

  ships: [
    {
      classId: 'frigate-albion', side: 'player', name: 'HMS Fortuna',
      pos: { x: -600, y: 300 }, vel: { x: 3, y: 0 }, heading: 0, doctrine: 'player',
      fireControl: { mode: 'auto', shot: 'round', engaged: false },
    },
    {
      classId: 'brig-albion', side: 'player', name: 'HMS Goshawk',
      pos: { x: -900, y: 900 }, vel: { x: 3, y: 0 }, heading: 0, doctrine: 'raider',
      fireControl: { mode: 'auto', shot: 'round', engaged: false },
    },
    {
      classId: 'sloop-albion', side: 'player', name: 'HMS Swallow',
      pos: { x: -900, y: -400 }, vel: { x: 3, y: 0 }, heading: 0, doctrine: 'raider',
      fireControl: { mode: 'auto', shot: 'chain', engaged: false },
    },
    {
      classId: 'liner-castilla', side: 'enemy', name: 'Trueno',
      pos: { x: 4600, y: 200 }, vel: { x: -2, y: 0 }, heading: Math.PI, doctrine: 'attack',
      fireControl: { mode: 'auto', shot: 'round', engaged: false },
      desc: 'The ship of the line Trueno — the flagship of almirante Herrera, three '
        + 'gun decks. A moving fortress, the heart of the Castillan plan.',
    },
    {
      classId: 'frigate-castilla', side: 'enemy', name: 'Rayo',
      pos: { x: 4200, y: -1100 }, vel: { x: -2, y: 1 }, heading: 3.4, doctrine: 'attack',
      fireControl: { mode: 'auto', shot: 'round', engaged: false },
    },
  ],

  objectives: [
    { id: 'obj-trueno', text: 'Destroy or capture the ship of the line Trueno', state: 'open' },
    { id: 'obj-rayo', text: 'Take out the frigate Rayo', state: 'open' },
  ],

  triggers: [
    {
      id: 'trg-brief', once: true, conditions: [{ kind: 'time', t: 4 }],
      actions: [{
        kind: 'comm', speaker: 'castilian-admiral',
        text: 'Almirante Herrera: "So this is the whole of Albion\'s answer? A frigate '
          + 'and two eggshells? Don Cristóbal, you overrated them. Trueno, forward."',
      }],
    },
    {
      id: 'trg-tactic', once: true, conditions: [{ kind: 'time', t: 22 }],
      actions: [{
        kind: 'comm', speaker: 'mate',
        text: 'Rusk: "We can\'t let her bring her broadside to bear. We split around the '
          + 'Middle Beacon, close on the Trueno from both sides and rake her stern — she '
          + 'turns slowly and can\'t guard both flanks at once."',
      }],
    },
    {
      id: 'trg-herrera-defiant', once: true, conditions: [{ kind: 'hullBelow', shipId: TRUENO, fraction: 0.5 }],
      actions: [{
        kind: 'comm', speaker: 'castilian-admiral',
        text: 'Almirante Herrera: "They\'re raking our stern… who taught them to sail '
          + 'like this? Hold the line! For the crown and the silver!"',
      }],
    },

    // Rayo vyřízena (potopena / vzdána) → flag
    { id: 'rayo-s', once: true, conditions: [{ kind: 'shipDestroyed', shipId: RAYO }], actions: [{ kind: 'setFlag', flag: 'rayo' }, { kind: 'objectiveComplete', objectiveId: 'obj-rayo' }] },
    { id: 'rayo-k', once: true, conditions: [{ kind: 'shipSurrendered', shipId: RAYO }], actions: [{ kind: 'setFlag', flag: 'rayo' }, { kind: 'objectiveComplete', objectiveId: 'obj-rayo' }] },

    // Trueno vyřízena → flag
    { id: 'trueno-s', once: true, conditions: [{ kind: 'shipDestroyed', shipId: TRUENO }], actions: [{ kind: 'setFlag', flag: 'trueno' }, { kind: 'objectiveComplete', objectiveId: 'obj-trueno' }] },
    { id: 'trueno-k', once: true, conditions: [{ kind: 'shipSurrendered', shipId: TRUENO }], actions: [{ kind: 'setFlag', flag: 'trueno' }, { kind: 'objectiveComplete', objectiveId: 'obj-trueno' }] },

    {
      id: 'trg-win', once: true, conditions: [{ kind: 'flag', flag: 'trueno' }, { kind: 'flag', flag: 'rayo' }],
      actions: [{
        kind: 'winMission',
        text: 'Herrera\'s squadron is broken, the silver never reached the straits. The '
          + 'war de Vega was preparing does not come to pass today at the Three Beacons. '
          + 'Halcyon breathes — for now.',
      }],
    },
    {
      id: 'trg-player-lost', once: true, conditions: [{ kind: 'allDestroyed', side: 'player' }],
      actions: [{ kind: 'loseMission', text: 'HMS Fortuna fell at the Three Beacons — and with her Albion\'s last hope of holding the strait.' }],
    },
  ],
}
