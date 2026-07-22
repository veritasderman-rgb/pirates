/**
 * Mise 5 — „Hnízdo" (fregata + spojenec). Bratrstvo Mělčiny kotví v zátoce
 * Kostivého ostrova pod pobřežní pevností. Vplouváš s HMS Fortuna a spojeneckou
 * brigou HMS Ostříž rozbít pirátskou smečku i vlajkovou brigu Silase Rourka
 * „Černého příboje". Pozor na pevnost a mělčiny v zátoce.
 *
 * Id: 1 = Fortuna (hráč), 2 = Ostříž (spojenec), 3 = pevnost,
 *     4–5 = pirátské šalupy, 6 = Černý příboj (Rourke)
 */
import type { Scenario } from '../../sim/types'
import { circlePoly } from '../../sim/geom'

const FORTUNA = 1
const P1 = 4
const P2 = 5
const FLAG = 6

export const mission05: Scenario = {
  id: 'mission05',
  title: 'Hnízdo',
  briefing:
    'Depeše prozradily hnízdo: Bratrstvo Mělčiny kotví v zátoce Kostivého '
    + 'ostrova, kryté pobřežní baterií. Velí mu Silas Rourke „Černý příboj" — '
    + 'muž, kterého platí de Vega.\n\n'
    + 'Vplouváš s Fortunou a spojeneckou brigou Ostříž. Rozbij smečku a zajmi '
    + 'nebo potop Rourkovu vlajkovou brigu. Baterie u vjezdu je nebezpečná — '
    + 'drž se jejího dostřelu jen, když musíš, a v úzké zátoce nenajížděj na '
    + 'mělčiny. Rozděl s Ostřížem palbu a rakuj, kde se dá.',
  seed: 17040309,
  ambient: '#0c2a35',
  wind: { baseDir: 0.5, baseSpeed: 7, rotationRate: 0.0008, gustiness: 0.55 },

  islands: [
    { id: 'bone-n', name: 'Kostivý ostrov (sever)', kind: 'island', poly: circlePoly(3200, 2100, 780, 16, 0.28),
      desc: 'Severní hřbet Kostivého ostrova — kryje zátoku před větrem i pohledy.' },
    { id: 'bone-s', name: 'Kostivý ostrov (jih)', kind: 'island', poly: circlePoly(3400, -2000, 760, 16, 0.3) },
    { id: 'bar', name: 'Kostěná lavice', kind: 'reef', depth: 3, poly: circlePoly(2500, 0, 380, 12, 0.4),
      desc: 'Mělčina napříč vjezdem — past pro hluboké kýly, průchod jen pro lehké.' },
  ],

  ships: [
    {
      classId: 'frigate-albion', side: 'player', name: 'HMS Fortuna',
      pos: { x: -400, y: 400 }, vel: { x: 3, y: 0 }, heading: 0, doctrine: 'player',
      fireControl: { mode: 'auto', shot: 'round', engaged: false },
    },
    {
      classId: 'brig-albion', side: 'player', name: 'HMS Ostříž',
      pos: { x: -700, y: -300 }, vel: { x: 3, y: 0 }, heading: 0, doctrine: 'raider',
      fireControl: { mode: 'auto', shot: 'round', engaged: false },
      desc: 'Spojenecká briga HMS Ostříž — velí jí tvůj starý druh z Konvoje v Soutěsce.',
    },
    {
      classId: 'fort-coastal', side: 'enemy', name: 'Baterie Kostivého ostrova',
      pos: { x: 3300, y: 250 }, vel: { x: 0, y: 0 }, heading: 0, doctrine: 'fort',
      sailsUp: false, trim: 0,
    },
    {
      classId: 'sloop-pirate', side: 'enemy', name: 'Sup', pos: { x: 3600, y: 1100 }, vel: { x: 0, y: 0 }, heading: 3.4, doctrine: 'buoy',
    },
    {
      classId: 'sloop-pirate', side: 'enemy', name: 'Mořská saň', pos: { x: 3700, y: -1000 }, vel: { x: 0, y: 0 }, heading: 2.9, doctrine: 'buoy',
    },
    {
      classId: 'brig-pirate', side: 'enemy', name: 'Černý příboj',
      pos: { x: 4200, y: 0 }, vel: { x: 0, y: 0 }, heading: Math.PI, doctrine: 'buoy',
      desc: 'Vlajková briga Silase Rourka — látaná, přezbrojená, s posádkou hladovou '
        + 'po kořisti. Muž, který slouží castillskému stříbru.',
    },
  ],

  objectives: [
    { id: 'obj-flag', text: 'Znič nebo zajmi Rourkovu vlajkovou brigu', state: 'open' },
    { id: 'obj-pack', text: 'Rozbij pirátskou smečku', state: 'open' },
  ],

  triggers: [
    {
      id: 'trg-brief', once: true, conditions: [{ kind: 'time', t: 4 }],
      actions: [{
        kind: 'comm', speaker: 'admiral',
        text: 'admirál Thorne: „Rourke je klíč, kapitáne. Přiveďte mi ho živého, '
          + 'jestli to půjde — muž, který bere castillské stříbro, ví jména. Ostříž '
          + 'kryje váš druhý bok."',
      }],
    },
    {
      id: 'trg-wake', once: true,
      conditions: [{ kind: 'distanceBelow', shipA: FORTUNA, shipB: FLAG, distance: 2600 }],
      actions: [
        { kind: 'message', text: 'Hnízdo se probouzí — piráti zvedají plachty a baterie se otáčí!' },
        { kind: 'setDoctrine', shipId: P1, doctrine: 'raider' },
        { kind: 'setDoctrine', shipId: P2, doctrine: 'raider' },
        { kind: 'setDoctrine', shipId: FLAG, doctrine: 'raider' },
        { kind: 'revealClass', shipId: FLAG },
        { kind: 'comm', speaker: 'pirate-captain',
          text: 'Silas Rourke: „Královský pes až v mém hnízdě? Vztyčte černou, chlapi — '
            + 'a ať si ho baterie osladí!"' },
      ],
    },
    // každý pirát vyřízen (potopen NEBO vzdán) → flag
    { id: 'f1s', once: true, conditions: [{ kind: 'shipDestroyed', shipId: P1 }], actions: [{ kind: 'setFlag', flag: 'p1' }] },
    { id: 'f1k', once: true, conditions: [{ kind: 'shipSurrendered', shipId: P1 }], actions: [{ kind: 'setFlag', flag: 'p1' }] },
    { id: 'f2s', once: true, conditions: [{ kind: 'shipDestroyed', shipId: P2 }], actions: [{ kind: 'setFlag', flag: 'p2' }] },
    { id: 'f2k', once: true, conditions: [{ kind: 'shipSurrendered', shipId: P2 }], actions: [{ kind: 'setFlag', flag: 'p2' }] },
    {
      id: 'trg-pack', once: true, conditions: [{ kind: 'flag', flag: 'p1' }, { kind: 'flag', flag: 'p2' }],
      actions: [{ kind: 'objectiveComplete', objectiveId: 'obj-pack' }],
    },
    // vlajková loď vyřízena (potopena / vzdána) → flag + splněný dílčí cíl,
    // ale VÍTĚZSTVÍ až po vyřízení celé smečky (obj-pack)
    {
      id: 'trg-flag-sunk', once: true, conditions: [{ kind: 'shipDestroyed', shipId: FLAG }],
      actions: [
        { kind: 'objectiveComplete', objectiveId: 'obj-flag' },
        { kind: 'setFlag', flag: 'flag-out' },
      ],
    },
    {
      id: 'trg-flag-struck', once: true, conditions: [{ kind: 'shipSurrendered', shipId: FLAG }],
      actions: [
        { kind: 'objectiveComplete', objectiveId: 'obj-flag' },
        { kind: 'setFlag', flag: 'flag-out' },
        { kind: 'comm', speaker: 'pirate-captain',
          text: 'Silas Rourke: „Dost! Spouštím vlajku… a jestli chcete de Vegu, kapitáne, '
            + 'poslední stříbro míří na úžinu u Tří majáků. Almirante Herrera. Víc nevím."' },
      ],
    },
    {
      id: 'trg-win', once: true,
      conditions: [{ kind: 'flag', flag: 'flag-out' }, { kind: 'flag', flag: 'p1' }, { kind: 'flag', flag: 'p2' }],
      actions: [{ kind: 'winMission', text: 'Hnízdo vyčištěno a Rourke vyřízen. Síť má poslední jméno: Herrera, úžina u Tří majáků.' }],
    },
    {
      id: 'trg-player-lost', once: true, conditions: [{ kind: 'allDestroyed', side: 'player' }],
      actions: [{ kind: 'loseMission', text: 'HMS Fortuna padla v zátoce Kostivého ostrova.' }],
    },
  ],
}
