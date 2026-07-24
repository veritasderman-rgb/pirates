/**
 * Vedlejší mise — „The Wreckers' Reef" (volitelný nájezd, fregata).
 * Vraci (wreckers) na Majákové skále zapalují falešné světlo a lákají lodě na
 * útesy Vdovina hřebene, kde je pak koráb a briga oberou o náklad i o životy.
 * HMS Goshawk připlouvá zúčtovat: proplout mezi útesy a potopit či zajmout obě
 * lodě vraků. Pozor — fregata má hluboký ponor a útesy ji roztrhnou; korzárský
 * koráb a pirátská briga číhají tam, kam se za nimi neodvážíš.
 *
 * Id lodí (pořadí pole ships, od 1):
 *   1 = Goshawk (hráč), 2 = El Segador (koráb), 3 = Falsa Luz (briga),
 *   4 = Santa Rosa (neutrální oběť)
 */
import type { Scenario } from '../../sim/types'
import { circlePoly } from '../../sim/geom'

const PLAYER = 1
const GALLEY = 2
const BRIG = 3

export const side02: Scenario = {
  id: 'side02',
  title: 'The Wreckers\' Reef',
  briefing:
    'A SIDE COMMISSION, away from the campaign\'s main track. For a season now ships '
    + 'have been lost on Widow\'s Comb with never a storm to blame. The truth is worse '
    + 'than weather: wreckers on Beacon Rock burn a false light to draw honest captains '
    + 'onto the reefs, then row out to plunder the wrecks and cut down any who reach '
    + 'the shore.\n\n'
    + 'HMS Goshawk is sent to end it. A corsair galley and a pirate brig lurk in the '
    + 'shoals — sink them or force them to strike. The galley rows where the wind fails '
    + 'and draws too little to fear the reefs; the brig will bleed you into the shallows '
    + 'and rake you when you touch. The Goshawk draws three fathoms and more: hold the '
    + 'deep channels, read the reefs, and do NOT run her aground.',
  seed: 20260714,
  ambient: '#0b2f38',
  wind: { baseDir: 0.6, baseSpeed: 6.5, rotationRate: 0.0008, gustiness: 0.6 },

  islands: [
    {
      id: 'beacon-rock', name: 'Beacon Rock', kind: 'island',
      poly: circlePoly(4200, 0, 520, 16, 0.3),
      desc: 'Beacon Rock — a black fang of stone crowned by an old watch-fire. Tonight '
        + 'that fire burns for the wrong reasons, and the wreckers tend it well.',
    },
    {
      id: 'widows-comb', name: 'Widow\'s Comb', kind: 'reef', depth: 3,
      poly: circlePoly(3000, -600, 440, 12, 0.4),
      desc: 'Widow\'s Comb — the long tooth of reef that has claimed a season of ships. '
        + 'Three fathoms of water over it: a brig may chance it, a frigate never.',
    },
    {
      id: 'the-grinder', name: 'The Grinder', kind: 'reef', depth: 2,
      poly: circlePoly(2100, 350, 360, 10, 0.42),
      desc: 'The Grinder — a shallow ledge that grinds the bottom out of anything that '
        + 'draws more than a fathom. The galley crosses it at will.',
    },
    {
      id: 'lantern-shoal', name: 'Lantern Shoal', kind: 'reef', depth: 2,
      poly: circlePoly(3650, 550, 380, 10, 0.4),
      desc: 'Lantern Shoal — the coral shelf beneath the false light, where the '
        + 'wreckers gather what the sea leaves them.',
    },
    {
      id: 'the-teeth', name: 'The Teeth', kind: 'reef', depth: 2,
      poly: circlePoly(2500, -1400, 320, 10, 0.44),
      desc: 'The Teeth — a scatter of coral heads to the south, unmarked on any '
        + 'honest chart.',
    },
  ],

  ships: [
    {
      classId: 'frigate-albion', side: 'player', name: 'HMS Goshawk',
      pos: { x: 0, y: 0 }, vel: { x: 3, y: 0 }, heading: 0.2, doctrine: 'player',
      fireControl: { mode: 'auto', shot: 'round', engaged: false },
    },
    {
      classId: 'galley-corsair', side: 'enemy', name: 'El Segador',
      pos: { x: 3200, y: 850 }, vel: { x: 0, y: 0 }, heading: 3.4, doctrine: 'buoy',
      sailsUp: false, trim: 0,
      desc: 'El Segador — "the Reaper". A corsair galley that lies in the shoals on '
        + 'her oars, waiting for a hull to strike the reef before she darts out.',
    },
    {
      classId: 'brig-pirate', side: 'enemy', name: 'Falsa Luz',
      pos: { x: 3800, y: -350 }, vel: { x: 0, y: 0 }, heading: Math.PI, doctrine: 'buoy',
      sailsUp: false, trim: 0,
      desc: 'Falsa Luz — "the False Light". The wreckers\' brig, re-gunned and heavy '
        + 'with plundered cargo, keeper of the lying beacon on the Rock.',
    },
    {
      classId: 'merch', side: 'neutral', name: 'Santa Rosa',
      pos: { x: 2850, y: -300 }, vel: { x: 0, y: 0 }, heading: 2.4, doctrine: 'buoy',
      sailsUp: false, trim: 0,
      desc: 'The merchantman Santa Rosa — last night\'s prey, hard on Widow\'s Comb '
        + 'with a broken back. Her people are ashore or drowned; you are too late for her.',
    },
  ],

  objectives: [
    { id: 'obj-raiders', text: 'Sink or capture both wrecker vessels', state: 'open' },
    { id: 'obj-reefs', text: 'Keep the Goshawk off the reefs', state: 'open' },
  ],

  triggers: [
    {
      id: 'trg-brief', once: true,
      conditions: [{ kind: 'time', t: 4 }],
      actions: [{
        kind: 'comm', speaker: 'mate',
        text: 'There\'s the false light on the Rock, and there\'s the Santa Rosa on the '
          + 'Comb — poor devils. The channels run deep between the reefs; keep to them '
          + 'and we\'ll have the wreckers where they thought they were safe.',
      }],
    },
    {
      id: 'trg-wake', once: true,
      conditions: [{ kind: 'distanceBelow', shipA: PLAYER, shipB: BRIG, distance: 2200 }],
      actions: [
        { kind: 'message', text: 'The wreckers rouse — the galley runs out her oars and the brig makes sail!' },
        { kind: 'revealClass', shipId: GALLEY },
        { kind: 'revealClass', shipId: BRIG },
        { kind: 'setDoctrine', shipId: GALLEY, doctrine: 'attack' },
        { kind: 'setDoctrine', shipId: BRIG, doctrine: 'attack' },
        { kind: 'setFlag', flag: 'woken' },
        {
          kind: 'comm', speaker: 'pirate-captain',
          text: 'From the brig: "A king\'s frigate, is it? Then come and get us, captain '
            + '— come across the Comb. The reef takes deep keels; we\'ll take what\'s left."',
        },
      ],
    },
    {
      id: 'trg-reef-warn', once: true,
      conditions: [{ kind: 'flag', flag: 'woken' }, { kind: 'time', t: 30 }],
      actions: [{
        kind: 'comm', speaker: 'lookout',
        text: 'The galley\'s trying to draw us over the Grinder, captain — she draws '
          + 'nothing and skips clean across. Don\'t follow her onto the coral. Make her '
          + 'come to the deep water, or work the channels and rake her as she turns.',
      }],
    },
    {
      id: 'trg-taunt', once: true,
      conditions: [{ kind: 'flag', flag: 'woken' }, { kind: 'time', t: 70 }],
      actions: [{
        kind: 'comm', speaker: 'gunner',
        text: 'The brig\'s hull is soft and her gunnery worse than ours — hull her with '
          + 'round shot. The galley\'s all oars and men: grape will thin them before '
          + 'they can think of boarding.',
      }],
    },

    // — každá loď vraků „vyřízena" (potopena NEBO vzdána) nastaví svůj flag —
    { id: 'g-sunk', once: true, conditions: [{ kind: 'shipDestroyed', shipId: GALLEY }], actions: [{ kind: 'setFlag', flag: 'g-out' }] },
    { id: 'g-struck', once: true, conditions: [{ kind: 'shipSurrendered', shipId: GALLEY }], actions: [{ kind: 'setFlag', flag: 'g-out' }] },
    { id: 'b-sunk', once: true, conditions: [{ kind: 'shipDestroyed', shipId: BRIG }], actions: [{ kind: 'setFlag', flag: 'b-out' }] },
    {
      id: 'b-struck', once: true, conditions: [{ kind: 'shipSurrendered', shipId: BRIG }],
      actions: [
        { kind: 'setFlag', flag: 'b-out' },
        {
          kind: 'comm', speaker: 'pirate-captain',
          text: 'From the brig: "Enough — I strike! Put out the fire on the Rock, damn '
            + 'you, before it draws another soul onto the Comb."',
        },
      ],
    },

    {
      id: 'trg-win', once: true,
      conditions: [{ kind: 'flag', flag: 'g-out' }, { kind: 'flag', flag: 'b-out' }],
      actions: [
        { kind: 'objectiveComplete', objectiveId: 'obj-raiders' },
        { kind: 'winMission', text: 'Both wreckers dealt with and the false light doused — Widow\'s Comb will keep an honest reckoning now.' },
      ],
    },
    // reef objective je splněn jen když jsi vyhrál BEZ najetí na útes
    {
      id: 'trg-reefs-kept', once: true,
      conditions: [{ kind: 'flag', flag: 'g-out' }, { kind: 'flag', flag: 'b-out' }, { kind: 'flagNot', flag: 'grounded' }],
      actions: [{ kind: 'objectiveComplete', objectiveId: 'obj-reefs' }],
    },
    // najetí na útes = ztráta reef objective (a jen ta — ne prohra ani jiné cíle)
    {
      id: 'trg-aground', once: true,
      conditions: [{ kind: 'aground', shipId: PLAYER }],
      actions: [
        { kind: 'setFlag', flag: 'grounded' },
        { kind: 'objectiveFail', objectiveId: 'obj-reefs' },
        {
          kind: 'comm', speaker: 'bosun',
          text: 'We\'re on the reef, captain! Back the sails and warp her off before the '
            + 'wreckers close — this is exactly how they meant to have us!',
        },
      ],
    },
    {
      id: 'trg-player-lost', once: true,
      conditions: [{ kind: 'shipDestroyed', shipId: PLAYER }],
      actions: [
        { kind: 'loseMission', text: 'HMS Goshawk breaks up on Widow\'s Comb — the wreckers have their finest prize yet.' },
      ],
    },
  ],
}
