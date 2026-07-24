/**
 * Mise 2 — „Konvoj v Soutěsce" (obrana, briga).
 * HMS Ostříž eskortuje dva kupce úžinou mezi ostrovy. Z návětří se vynoří
 * pirátská smečka (dvě šalupy + briga). Ubraň konvoj: potop nebo přinuť
 * ke kapitulaci všechny piráty; ztráta obou kupců = prohra.
 *
 * Id: 1 = Ostříž (hráč), 2–3 = kupci, 4–5 = pirátské šalupy, 6 = pirátská briga
 */
import type { Scenario } from '../../sim/types'
import { circlePoly } from '../../sim/geom'

const OSTRIZ = 1
const MERCH_A = 2
const MERCH_B = 3
const PIRATE1 = 4
const PIRATE2 = 5
const PIRATE_BRIG = 6

export const mission02: Scenario = {
  id: 'mission02',
  title: 'Convoy in the Narrows',
  briefing:
    'HMS Goshawk leads two merchantmen through the Narrows — the strait between Boar '
    + 'Island and Mist Island. Scouts warn of a pirate pack lying in wait to windward.\n\n'
    + 'The merchantmen are making for the eastern entrance; your task is to keep them '
    + 'alive and deal with the pirates. Use the islands: in the strait big ships turn '
    + 'poorly and lose the wind in the lee. Slow them with chain shot, sink them with '
    + 'round, and thin their crews with grape before a boarding party.',
  seed: 17020918,
  ambient: '#0e3340',
  wind: { baseDir: 0.1, baseSpeed: 7.5, rotationRate: 0.001, gustiness: 0.5 },

  islands: [
    { id: 'boar', name: 'Boar Island', kind: 'island', poly: circlePoly(2600, 1500, 700, 16, 0.3),
      desc: 'Boar Island — a wooded ridge above the northern shore of the Narrows.' },
    { id: 'mist', name: 'Mist Island', kind: 'island', poly: circlePoly(3200, -1600, 620, 14, 0.35),
      desc: 'Mist Island — lower, ringed with shoals; behind it the wind all but dies.' },
    { id: 'reef-mid', name: 'Middle Shallows', kind: 'reef', depth: 3, poly: circlePoly(3000, 0, 300, 10, 0.4),
      desc: 'A shoal in the middle of the strait — a trap for heavy keels.' },
  ],

  ships: [
    {
      classId: 'brig-albion', side: 'player', name: 'HMS Goshawk',
      pos: { x: 300, y: 0 }, vel: { x: 3, y: 0 }, heading: 0.1, doctrine: 'player',
      fireControl: { mode: 'auto', shot: 'round', engaged: false },
    },
    {
      // eskortovaní kupci jsou albionští (strana player) — piráti (enemy) na ně
      // útočí, hráč je chrání; doktrína freighter je nechá prchat, ne bojovat
      classId: 'merch', side: 'player', name: 'Hope',
      pos: { x: -200, y: 250 }, vel: { x: 2.5, y: 0 }, heading: 0.1, doctrine: 'freighter',
      nav: { kind: 'course', dest: { x: 6500, y: 400 }, arriveAtRest: false }, trim: 1,
      desc: 'The merchantman Hope — a cargo of canvas and spices for the eastern port.',
    },
    {
      classId: 'merch', side: 'player', name: 'Perseverance',
      pos: { x: -450, y: -200 }, vel: { x: 2.5, y: 0 }, heading: 0.1, doctrine: 'freighter',
      nav: { kind: 'course', dest: { x: 6500, y: -300 }, arriveAtRest: false }, trim: 1,
      desc: 'The merchantman Perseverance — sister ship to the Hope, the same run.',
    },
    {
      classId: 'sloop-pirate', side: 'enemy', name: 'Rat\'s Tail',
      pos: { x: 2400, y: 2100 }, vel: { x: -2, y: -1 }, heading: 3.6, doctrine: 'buoy',
    },
    {
      classId: 'sloop-pirate', side: 'enemy', name: 'Hungry Wave',
      pos: { x: 3000, y: -2200 }, vel: { x: -2, y: 1 }, heading: 2.6, doctrine: 'buoy',
    },
    {
      classId: 'brig-pirate', side: 'enemy', name: 'Black Surf',
      pos: { x: 4200, y: 200 }, vel: { x: -3, y: 0 }, heading: Math.PI, doctrine: 'buoy',
      desc: 'The flagship brig of the pirate captain — she shows herself once the pack closes on its prey.',
    },
  ],

  objectives: [
    { id: 'obj-convoy', text: 'Protect the convoy — at least one merchantman must survive', state: 'open' },
    { id: 'obj-pirates', text: 'Deal with the pirate pack (sink or force surrender)', state: 'open' },
  ],

  triggers: [
    {
      id: 'trg-intro', once: true,
      conditions: [{ kind: 'time', t: 4 }],
      actions: [{
        kind: 'comm', speaker: 'lookout',
        text: 'Sails to windward! Two sloops off the islands — a pirate pack, captain. '
          + 'And behind them, something larger.',
      }],
    },
    {
      id: 'trg-ambush', once: true,
      conditions: [{ kind: 'time', t: 8 }],
      actions: [
        { kind: 'setDoctrine', shipId: PIRATE1, doctrine: 'raider' },
        { kind: 'setDoctrine', shipId: PIRATE2, doctrine: 'raider' },
        { kind: 'revealClass', shipId: PIRATE1 },
        { kind: 'revealClass', shipId: PIRATE2 },
      ],
    },
    {
      id: 'trg-brig-joins', once: true,
      conditions: [{ kind: 'time', t: 35 }],
      actions: [
        { kind: 'setDoctrine', shipId: PIRATE_BRIG, doctrine: 'raider' },
        { kind: 'revealClass', shipId: PIRATE_BRIG },
        { kind: 'comm', speaker: 'pirate', text: 'Pirate brig: "Run up the black! We take everything that floats!"' },
      ],
    },

    // — každý pirát „vyřízen" (potopen NEBO vzdán) nastaví svůj flag —
    { id: 'p1-sunk', once: true, conditions: [{ kind: 'shipDestroyed', shipId: PIRATE1 }], actions: [{ kind: 'setFlag', flag: 'p1-out' }] },
    { id: 'p1-struck', once: true, conditions: [{ kind: 'shipSurrendered', shipId: PIRATE1 }], actions: [{ kind: 'setFlag', flag: 'p1-out' }] },
    { id: 'p2-sunk', once: true, conditions: [{ kind: 'shipDestroyed', shipId: PIRATE2 }], actions: [{ kind: 'setFlag', flag: 'p2-out' }] },
    { id: 'p2-struck', once: true, conditions: [{ kind: 'shipSurrendered', shipId: PIRATE2 }], actions: [{ kind: 'setFlag', flag: 'p2-out' }] },
    { id: 'p3-sunk', once: true, conditions: [{ kind: 'shipDestroyed', shipId: PIRATE_BRIG }], actions: [{ kind: 'setFlag', flag: 'p3-out' }] },
    { id: 'p3-struck', once: true, conditions: [{ kind: 'shipSurrendered', shipId: PIRATE_BRIG }], actions: [{ kind: 'setFlag', flag: 'p3-out' }] },

    {
      id: 'trg-pirates-cleared', once: true,
      conditions: [{ kind: 'flag', flag: 'p1-out' }, { kind: 'flag', flag: 'p2-out' }, { kind: 'flag', flag: 'p3-out' }],
      actions: [
        { kind: 'objectiveComplete', objectiveId: 'obj-pirates' },
        { kind: 'objectiveComplete', objectiveId: 'obj-convoy' },
        { kind: 'winMission', text: 'The pack is scattered, the convoy safe. The Narrows is passable again.' },
      ],
    },

    // — prohra: oba kupci ztraceni —
    { id: 'mA-lost', once: true, conditions: [{ kind: 'shipDestroyed', shipId: MERCH_A }], actions: [{ kind: 'setFlag', flag: 'mA-out' }] },
    { id: 'mB-lost', once: true, conditions: [{ kind: 'shipDestroyed', shipId: MERCH_B }], actions: [{ kind: 'setFlag', flag: 'mB-out' }] },
    {
      id: 'trg-convoy-lost', once: true,
      conditions: [{ kind: 'flag', flag: 'mA-out' }, { kind: 'flag', flag: 'mB-out' }],
      actions: [
        { kind: 'objectiveFail', objectiveId: 'obj-convoy' },
        { kind: 'loseMission', text: 'Both merchantmen on the bottom. The convoy is lost.' },
      ],
    },
    {
      // ztráta eskorty = prohra (kupci jsou bezbranní); m2 nemá bojovou flotilu,
      // proto ne allDestroyed, ale konkrétní eskortní loď
      id: 'trg-player-lost', once: true,
      conditions: [{ kind: 'shipDestroyed', shipId: OSTRIZ }],
      actions: [{ kind: 'loseMission', text: 'HMS Goshawk has sunk — the convoy is left unprotected.' }],
    },
  ],
}
