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
  title: 'Depeše',
  briefing:
    'Zajaté rozkazy z Q-lodi mířily do castillského přístavu Punta Negra. '
    + 'Než jsme stačili zasáhnout, vyplul odtud kurýr „Céfiro" s odpovědí — '
    + 'a teď pádí zpátky pod ochranu pevnosti.\n\n'
    + 'Dostihni ho a zajmi ty depeše. Céfiro je rychlejší na čistém větru, '
    + 'ale musí k přístavu; uřízni mu cestu, drž nejlepší bod plavby a do '
    + 'bezvětří nasaď vesla. Pozor na pevnost Punta Negra — její koule '
    + 'dolétnou dál než tvoje.',
  seed: 17031530,
  ambient: '#0e2b38',
  wind: { baseDir: 3.1, baseSpeed: 8.5, rotationRate: 0.001, gustiness: 0.5 },

  islands: [
    { id: 'negra', name: 'Punta Negra', kind: 'island', poly: circlePoly(6200, -400, 720, 16, 0.3),
      desc: 'Punta Negra — černý čedičový mys s castillským přístavem v závětří.' },
    { id: 'sisters', name: 'Sestry', kind: 'island', poly: circlePoly(2800, 1500, 420, 12, 0.35),
      desc: 'Dvě skaliska „Sestry" — úžina mezi nimi krátí cestu, kdo si troufne.' },
    { id: 'shoal', name: 'Písečná lavice', kind: 'reef', depth: 3, poly: circlePoly(4200, -900, 340, 10, 0.4) },
  ],

  ships: [
    {
      classId: 'frigate-albion', side: 'player', name: 'HMS Fortuna',
      pos: { x: 0, y: 0 }, vel: { x: 4, y: 0 }, heading: 0.2, doctrine: 'player',
      fireControl: { mode: 'hold', shot: 'chain', engaged: false },
    },
    {
      classId: 'courier-castilla', side: 'enemy', name: 'Céfiro',
      pos: { x: 1400, y: -300 }, vel: { x: 5, y: 0 }, heading: 0, doctrine: 'runner',
      nav: { kind: 'course', dest: { x: 6000, y: -300 }, arriveAtRest: false }, trim: 1,
      desc: 'Kurýrní šalup „Céfiro" — rychlý jako vítr sám, beze zbraní. Veze to, '
        + 'kvůli čemu tu jsme.',
    },
    {
      classId: 'fort-coastal', side: 'enemy', name: 'Pevnost Punta Negra',
      pos: { x: 6200, y: 300 }, vel: { x: 0, y: 0 }, heading: 0, doctrine: 'fort',
      sailsUp: false, trim: 0,
      desc: 'Pobřežní baterie Punta Negra — kamenné hrdlo castillského přístavu. '
        + 'Její žhavé koule dolétnou dál než lodní děla.',
    },
    {
      classId: 'merch', side: 'neutral', name: 'Vjezd do přístavu',
      pos: { x: 6400, y: -300 }, vel: { x: 0, y: 0 }, heading: 0, doctrine: 'buoy',
      sailsUp: false, trim: 0,
      desc: 'Vjezdová bóje přístavu Punta Negra — za ní je Céfiro pod ochranou '
        + 'pevnosti a mimo náš dosah.',
    },
  ],

  objectives: [
    { id: 'obj-catch', text: 'Dostihni kurýr Céfiro (na 400 m)', state: 'open' },
    { id: 'obj-seize', text: 'Zajmi nebo potop kurýr, než dorazí do přístavu', state: 'open' },
  ],

  triggers: [
    {
      id: 'trg-brief', once: true, conditions: [{ kind: 'time', t: 3 }],
      actions: [{
        kind: 'comm', speaker: 'admiral',
        text: 'admirál Thorne: „Ty depeše chci celé, kapitáne — ne na dně. Zpomalte '
          + 'ho řetězovými do plachet a přinuťte ke kapitulaci. A nepleťte se pod '
          + 'pevnost víc, než musíte."',
      }],
    },
    {
      id: 'trg-wind-tip', once: true, conditions: [{ kind: 'time', t: 18 }],
      actions: [{
        kind: 'comm', speaker: 'mate',
        text: 'Rusk: „Na čistém větru nám ujíždí. Uřízni mu to zkratší cestou přes '
          + 'Sestry a chyť si zadoboční vítr — tam ho doženeme."',
      }],
    },
    {
      id: 'trg-caught', once: true,
      conditions: [{ kind: 'distanceBelow', shipA: FORTUNA, shipB: COURIER, distance: 400 }],
      actions: [
        { kind: 'objectiveComplete', objectiveId: 'obj-catch' },
        {
          kind: 'comm', speaker: 'gunner',
          text: 'Hargrove: „Na dostřel! Řetězovou mu do ráhnoví, ať zpomalí — pak '
            + 'kartáč na palubu a bereme ho do háku."',
        },
      ],
    },
    {
      id: 'trg-courier-struck', once: true, conditions: [{ kind: 'shipSurrendered', shipId: COURIER }],
      actions: [
        { kind: 'objectiveComplete', objectiveId: 'obj-seize' },
        { kind: 'winMission', text: 'Céfiro spustil vlajku — depeše jsou naše. De Vega odpovídal někomu výš.' },
      ],
    },
    {
      id: 'trg-courier-sunk', once: true, conditions: [{ kind: 'shipDestroyed', shipId: COURIER }],
      actions: [
        { kind: 'objectiveComplete', objectiveId: 'obj-seize' },
        { kind: 'winMission', text: 'Céfiro potopen. Depeše šly ke dnu s ním — ale posel se domů nevrátí.' },
      ],
    },
    {
      id: 'trg-escaped', once: true,
      conditions: [{ kind: 'distanceBelow', shipA: COURIER, shipB: HAVEN, distance: 350 }],
      actions: [
        { kind: 'objectiveFail', objectiveId: 'obj-seize' },
        { kind: 'loseMission', text: 'Céfiro proklouzl pod děla pevnosti. Depeše jsou pryč.' },
      ],
    },
    {
      id: 'trg-player-lost', once: true, conditions: [{ kind: 'shipDestroyed', shipId: FORTUNA }],
      actions: [{ kind: 'loseMission', text: 'HMS Fortuna se potopila pod děly Punta Negry.' }],
    },
  ],
}
