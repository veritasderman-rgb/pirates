/**
 * Vedlejší mise — „Smuggler's Run" (volitelný nájezd, briga).
 * HMS Swallow číhá u Cínových ostrůvků na skupinku pašeráckých šalup, které
 * pod maskou kupců proplouvají s kontrabandem mezi ostrovy a útesem. Dostihni
 * je: potop, nebo (lépe) přinuť ke kapitulaci a zajmi jako kořist. Dva pašeráci
 * po odhalení prchají, třetí se rozhodne bránit.
 *
 * Id lodí (pořadí pole ships, od 1):
 *   1 = Swallow (hráč), 2 = La Zorra, 3 = Contrabandista, 4 = Nightjar,
 *   5 = Marigold (neutrál), 6 = Two Brothers (neutrál)
 */
import type { Scenario } from '../../sim/types'
import { circlePoly } from '../../sim/geom'

const PLAYER = 1
const SMUG_A = 2
const SMUG_B = 3
const SMUG_C = 4
const MERCH_N = 5

export const side01: Scenario = {
  id: 'side01',
  title: 'Smuggler\'s Run',
  briefing:
    'A SIDE COMMISSION, off the campaign\'s main track. Revenue swears a pack of '
    + 'smugglers is running contraband through the Tin Cays under merchant colours — '
    + 'brandy, powder and worse, bound for the free ports.\n\n'
    + 'HMS Swallow lies across their run. Three trim little sloops sail ahead of you '
    + 'wearing an honest face; close on them and their disguise will not hold. Sink '
    + 'them if you must — but a smuggler taken with her hold full is a fat prize and '
    + 'a purse for the crew, so slow them with chain shot and force them to strike '
    + 'their colours. Mind the Cays and the Sieve reef: the sloops draw next to '
    + 'nothing and slip over the shoals, but the Swallow does not.',
  seed: 20260601,
  ambient: '#0e3a42',
  wind: { baseDir: 0.12, baseSpeed: 8, rotationRate: 0.0009, gustiness: 0.45 },

  islands: [
    {
      id: 'coral-cay', name: 'Coral Cay', kind: 'island',
      poly: circlePoly(3000, 1100, 480, 14, 0.32),
      desc: 'Coral Cay — a hummock of white sand and scrub. Smugglers water here and '
        + 'wait out the tide; a lookout on its ridge can see a sail an hour off.',
    },
    {
      id: 'smug-cay', name: 'Smuggler\'s Cay', kind: 'island',
      poly: circlePoly(2400, -1100, 420, 14, 0.34),
      desc: 'Smuggler\'s Cay — a low island honeycombed with caves at the waterline, '
        + 'where more than one cargo has been landed under a moonless sky.',
    },
    {
      id: 'sieve', name: 'The Sieve', kind: 'reef', depth: 2,
      poly: circlePoly(3400, -200, 300, 10, 0.4),
      desc: 'The Sieve — a shelf of coral a fathom under the surface. Sloops sail '
        + 'clean over it; anything with a keel leaves its bottom strewn across the reef.',
    },
  ],

  ships: [
    {
      classId: 'brig-albion', side: 'player', name: 'HMS Swallow',
      pos: { x: 0, y: 0 }, vel: { x: 3, y: 0 }, heading: 0.1, doctrine: 'player',
      fireControl: { mode: 'auto', shot: 'round', engaged: false },
    },
    // Pašeráci: maskováni jako kupci, plují svůj kurz na východ, dokud je
    // hráč neodhalí. La Zorra a Nightjar pak prchají, Contrabandista se bije.
    {
      classId: 'sloop-pirate', side: 'enemy', name: 'La Zorra',
      pos: { x: 1200, y: 400 }, vel: { x: 3, y: 0 }, heading: 0.1, doctrine: 'transit',
      disguise: 'merch', trim: 1,
      nav: { kind: 'course', dest: { x: 6000, y: -100 }, arriveAtRest: false },
      desc: 'A neat little sloop under merchant colours, sitting suspiciously low in '
        + 'the water for a trader in ballast.',
    },
    {
      classId: 'sloop-pirate', side: 'enemy', name: 'Contrabandista',
      pos: { x: 1500, y: -300 }, vel: { x: 3, y: 0 }, heading: 0.1, doctrine: 'transit',
      disguise: 'merch', trim: 1,
      nav: { kind: 'course', dest: { x: 6000, y: -300 }, arriveAtRest: false },
      desc: 'A well-found sloop flying an honest flag — though her scuppers smell of '
        + 'brandy and her gunports have seen recent use.',
    },
    {
      classId: 'sloop-pirate', side: 'enemy', name: 'Nightjar',
      pos: { x: 1750, y: 250 }, vel: { x: 3, y: 0 }, heading: 0.1, doctrine: 'transit',
      disguise: 'merch', trim: 1,
      nav: { kind: 'course', dest: { x: 6000, y: 600 }, arriveAtRest: false },
      desc: 'The last of the three — she keeps close to the Cays, ready to slip into '
        + 'the shoals where no man-of-war dares follow.',
    },
    {
      classId: 'merch', side: 'neutral', name: 'Marigold',
      pos: { x: 2600, y: -1500 }, vel: { x: 2, y: 0 }, heading: 0.1, doctrine: 'transit',
      trim: 1, nav: { kind: 'course', dest: { x: 6500, y: -1400 }, arriveAtRest: false },
      desc: 'A genuine trader on a lawful run, papers in order — the honest face the '
        + 'smugglers hide behind.',
    },
    {
      classId: 'merch', side: 'neutral', name: 'Two Brothers',
      pos: { x: 900, y: 1500 }, vel: { x: 0, y: 0 }, heading: 1.8, doctrine: 'buoy',
      sailsUp: false, trim: 0,
      desc: 'A coasting fishing smack riding at anchor off the Cays, her crew mending '
        + 'nets and minding their own business.',
    },
  ],

  objectives: [
    { id: 'obj-take', text: 'Take or sink all three smuggler sloops', state: 'open' },
    { id: 'obj-prize', text: 'For a prize: force a smuggler to strike her colours', state: 'open' },
  ],

  triggers: [
    {
      id: 'trg-brief', once: true,
      conditions: [{ kind: 'time', t: 4 }],
      actions: [{
        kind: 'comm', speaker: 'port',
        text: 'Revenue Office: "Three of them, Swallow, all in trader\'s clothing. '
          + 'Close the range and their manifests will not bear looking at. Bring them '
          + 'in with their holds full if you can — the crew will thank you for it."',
      }],
    },
    {
      id: 'trg-lesson', once: true,
      conditions: [{ kind: 'time', t: 10 }],
      actions: [{
        kind: 'comm', speaker: 'mate',
        text: 'They draw a fathom and a half at most and will run for the Sieve and '
          + 'the shoals the instant they smell us. Cut the corner, get to windward, '
          + 'and mind we don\'t pile the Swallow onto that reef ourselves.',
      }],
    },
    {
      id: 'trg-unmask', once: true,
      conditions: [{ kind: 'distanceBelow', shipA: PLAYER, shipB: SMUG_B, distance: 900 }],
      actions: [
        { kind: 'message', text: 'The sloops throw off their merchant colours and scatter — smugglers, and armed!' },
        { kind: 'revealClass', shipId: SMUG_A },
        { kind: 'revealClass', shipId: SMUG_B },
        { kind: 'revealClass', shipId: SMUG_C },
        { kind: 'setDoctrine', shipId: SMUG_A, doctrine: 'runner' },
        { kind: 'setDoctrine', shipId: SMUG_B, doctrine: 'attack' },
        { kind: 'setDoctrine', shipId: SMUG_C, doctrine: 'runner' },
        { kind: 'setFlag', flag: 'unmasked' },
        {
          kind: 'comm', speaker: 'enemy-captain',
          text: 'Contrabandista: "Colours down, lads — it\'s a king\'s dog! Zorra, '
            + 'Nightjar, into the shoals! I\'ll hold the deep water and buy you the run!"',
        },
      ],
    },
    {
      id: 'trg-chase', once: true,
      conditions: [{ kind: 'flag', flag: 'unmasked' }, { kind: 'time', t: 40 }],
      actions: [{
        kind: 'comm', speaker: 'gunner',
        text: 'Chain shot to bring down their spars, captain, then round to finish or '
          + 'grape to clear a deck for boarding. A struck sloop with her hold full is '
          + 'worth three sent to the bottom.',
      }],
    },

    // — každý pašerák „vyřízen" (potopen NEBO vzdán) nastaví svůj flag —
    { id: 'sa-sunk', once: true, conditions: [{ kind: 'shipDestroyed', shipId: SMUG_A }], actions: [{ kind: 'setFlag', flag: 'a-out' }] },
    { id: 'sa-struck', once: true, conditions: [{ kind: 'shipSurrendered', shipId: SMUG_A }], actions: [{ kind: 'setFlag', flag: 'a-out' }, { kind: 'setFlag', flag: 'a-prize' }] },
    { id: 'sb-sunk', once: true, conditions: [{ kind: 'shipDestroyed', shipId: SMUG_B }], actions: [{ kind: 'setFlag', flag: 'b-out' }] },
    { id: 'sb-struck', once: true, conditions: [{ kind: 'shipSurrendered', shipId: SMUG_B }], actions: [{ kind: 'setFlag', flag: 'b-out' }, { kind: 'setFlag', flag: 'b-prize' }] },
    { id: 'sc-sunk', once: true, conditions: [{ kind: 'shipDestroyed', shipId: SMUG_C }], actions: [{ kind: 'setFlag', flag: 'c-out' }] },
    { id: 'sc-struck', once: true, conditions: [{ kind: 'shipSurrendered', shipId: SMUG_C }], actions: [{ kind: 'setFlag', flag: 'c-out' }, { kind: 'setFlag', flag: 'c-prize' }] },

    // — bonusový cíl: aspoň jedna kořist zajata (kapitulace) —
    { id: 'prize-a', once: true, conditions: [{ kind: 'flag', flag: 'a-prize' }], actions: [{ kind: 'objectiveComplete', objectiveId: 'obj-prize' }] },
    { id: 'prize-b', once: true, conditions: [{ kind: 'flag', flag: 'b-prize' }], actions: [{ kind: 'objectiveComplete', objectiveId: 'obj-prize' }] },
    { id: 'prize-c', once: true, conditions: [{ kind: 'flag', flag: 'c-prize' }], actions: [{ kind: 'objectiveComplete', objectiveId: 'obj-prize' }] },

    {
      id: 'trg-win', once: true,
      conditions: [{ kind: 'flag', flag: 'a-out' }, { kind: 'flag', flag: 'b-out' }, { kind: 'flag', flag: 'c-out' }],
      actions: [
        { kind: 'objectiveComplete', objectiveId: 'obj-take' },
        { kind: 'winMission', text: 'The run is broken — every smuggler taken or sunk, and the Tin Cays quiet again.' },
      ],
    },
    {
      id: 'trg-player-lost', once: true,
      conditions: [{ kind: 'shipDestroyed', shipId: PLAYER }],
      actions: [{ kind: 'loseMission', text: 'HMS Swallow has gone down, and the smugglers with their cargo slip away into the Cays.' }],
    },
  ],
}
