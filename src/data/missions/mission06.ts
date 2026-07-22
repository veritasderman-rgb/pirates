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
  title: 'Úžina u Tří majáků',
  briefing:
    'Tady se to rozhodne. Poslední pokladní stříbro Castilly pluje na albionské '
    + 'úžiny pod eskadrou almiranteho Herrery — a s ním válka, kterou de Vega '
    + 'chystal celou dobu. Zastav ho v úžině u Tří majáků.\n\n'
    + 'Vedeš Fortunu, brigu Ostříž a šalupu Vlaštovku proti řadové lodi Trueno '
    + 'a fregatě Rayo. Trueno má třicet děl na bok — bok po boku ji nikdo '
    + 'neporazí. Využij úžinu a ostrovy: řadová loď se otáčí pomalu, ve větrném '
    + 'stínu ztrácí tah a do mělčin se neodváží. Rozděl palbu, obtancuj ji '
    + 'a rakuj do přídě a zádě, kde děla nemá.',
  seed: 17041721,
  ambient: '#0b2733',
  wind: { baseDir: 1.9, baseSpeed: 8, rotationRate: 0.0011, gustiness: 0.6 },

  islands: [
    { id: 'beacon-n', name: 'Severní maják', kind: 'island', poly: circlePoly(1200, 2400, 560, 14, 0.3) },
    { id: 'beacon-m', name: 'Prostřední maják', kind: 'island', poly: circlePoly(3000, 0, 640, 16, 0.28),
      desc: 'Prostřední z Tří majáků — dělí úžinu na dva průplavy; klíč k celé bitvě.' },
    { id: 'beacon-s', name: 'Jižní maják', kind: 'island', poly: circlePoly(1400, -2400, 560, 14, 0.32) },
    { id: 'reef-w', name: 'Majákové zuby', kind: 'reef', depth: 3, poly: circlePoly(4600, 1200, 340, 10, 0.4) },
  ],

  ships: [
    {
      classId: 'frigate-albion', side: 'player', name: 'HMS Fortuna',
      pos: { x: -600, y: 300 }, vel: { x: 3, y: 0 }, heading: 0, doctrine: 'player',
      fireControl: { mode: 'auto', shot: 'round', engaged: false },
    },
    {
      classId: 'brig-albion', side: 'player', name: 'HMS Ostříž',
      pos: { x: -900, y: 900 }, vel: { x: 3, y: 0 }, heading: 0, doctrine: 'raider',
      fireControl: { mode: 'auto', shot: 'round', engaged: false },
    },
    {
      classId: 'sloop-albion', side: 'player', name: 'HMS Vlaštovka',
      pos: { x: -900, y: -400 }, vel: { x: 3, y: 0 }, heading: 0, doctrine: 'raider',
      fireControl: { mode: 'auto', shot: 'chain', engaged: false },
    },
    {
      classId: 'liner-castilla', side: 'enemy', name: 'Trueno',
      pos: { x: 4600, y: 200 }, vel: { x: -2, y: 0 }, heading: Math.PI, doctrine: 'attack',
      fireControl: { mode: 'auto', shot: 'round', engaged: false },
      desc: 'Řadová loď Trueno — vlajková loď almiranteho Herrery, tři paluby děl. '
        + 'Pohyblivá pevnost, srdce castillského plánu.',
    },
    {
      classId: 'frigate-castilla', side: 'enemy', name: 'Rayo',
      pos: { x: 4200, y: -1100 }, vel: { x: -2, y: 1 }, heading: 3.4, doctrine: 'attack',
      fireControl: { mode: 'auto', shot: 'round', engaged: false },
    },
  ],

  objectives: [
    { id: 'obj-trueno', text: 'Znič nebo zajmi řadovou loď Trueno', state: 'open' },
    { id: 'obj-rayo', text: 'Vyřaď fregatu Rayo', state: 'open' },
  ],

  triggers: [
    {
      id: 'trg-brief', once: true, conditions: [{ kind: 'time', t: 4 }],
      actions: [{
        kind: 'comm', speaker: 'castilian-admiral',
        text: 'almirante Herrera: „Tak tohle je celá albionská odpověď? Fregata a dvě '
          + 'skořápky? Done Cristóbale, přeceňoval jste je. Trueno, kupředu."',
      }],
    },
    {
      id: 'trg-tactic', once: true, conditions: [{ kind: 'time', t: 22 }],
      actions: [{
        kind: 'comm', speaker: 'mate',
        text: 'Rusk: „Nesmíme jí dovolit srovnat boky. Rozdělíme se kolem Prostředního '
          + 'majáku, sevřeme Trueno ze dvou stran a rakneme jí do zádi — pomalu se otáčí, '
          + 'nedokáže krýt oba boky naráz."',
      }],
    },
    {
      id: 'trg-herrera-defiant', once: true, conditions: [{ kind: 'hullBelow', shipId: TRUENO, fraction: 0.5 }],
      actions: [{
        kind: 'comm', speaker: 'castilian-admiral',
        text: 'almirante Herrera: „Rakují nás do zádi… kdo je naučil takhle plout? '
          + 'Držte linii! Za korunu a stříbro!"',
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
        text: 'Herrerova eskadra rozbita, stříbro se na úžiny nedostalo. Válka, kterou '
          + 'de Vega chystal, se dnes u Tří majáků nekoná. Halcyon dýchá — prozatím.',
      }],
    },
    {
      id: 'trg-player-lost', once: true, conditions: [{ kind: 'shipDestroyed', shipId: FORTUNA }],
      actions: [{ kind: 'loseMission', text: 'HMS Fortuna padla u Tří majáků — a s ní poslední albionská naděje úžinu udržet.' }],
    },
  ],
}
