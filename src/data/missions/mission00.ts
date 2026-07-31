/**
 * Mise 0 — „Akademie" (tutoriál, šalupa). Závěrečná praktická zkouška na
 * rejdě Královské námořní akademie: nikdo nestřílí zpátky, cílem je naučit
 * hráče tři věci, na kterých stojí celá hra:
 *
 *   1. VÍTR — bóje leží PROTI větru, takže se k ní nedá plout přímo; hráč
 *      musí křižovat (nebo vytáhnout vesla).
 *   2. DĚLA — zakotvený terč na boční salvu a typy střeliva.
 *   3. BOARDING — opuštěný vrak, který se dá vzít jako kořist.
 *
 * Každý splněný úkol zvedne příznak; poslední trigger čeká na všechny tři.
 * Prohrát se prakticky nedá — terče jsou `buoy` (nemají doktrínu, která by
 * pálila), takže tutoriál nikoho nevyhodí.
 *
 * Id lodí (pořadí pole ships, od 1):
 *   1 = Vlaštovka (hráč), 2 = návětrná bóje, 3 = terč Stará želva,
 *   4 = vrak Kormorán, 5 = HMS Diligence (instruktor)
 */
import type { Scenario } from '../../sim/types'
import { circlePoly } from '../../sim/geom'

const PLAYER = 1
const MARK = 2
const HULK = 3
const DERELICT = 4

export const mission00: Scenario = {
  id: 'mission00',
  title: 'The Academy',
  briefing:
    'The sheltered roadstead of the Royal Naval Academy at Port Kestrel. Before a '
    + 'crown trusts you with a patrol, it wants to see you handle a ship. Admiral '
    + 'Thorne has set the course himself and will be watching from the Diligence.\n\n'
    + 'Three exercises: beat up to the windward mark, put a broadside into the old '
    + 'target hulk, and take the derelict Cormorant as a prize. Nothing out here '
    + 'shoots back — take your time and learn the ship.\n\n'
    + 'TRAINING: the wind blows to the EAST. The mark lies to the WEST, straight '
    + 'into it — you cannot sail there directly. Zigzag across the wind (TACK), or '
    + 'put out the OARS.',
  seed: 17001231,
  ambient: '#0e4152',
  // klidný cvičný vítr: stálý směr, malé poryvy — ať se lekce chová předvídatelně
  wind: { baseDir: 0, baseSpeed: 7.5, rotationRate: 0.0003, gustiness: 0.15 },

  islands: [
    {
      id: 'academy-point', name: 'Academy Point', kind: 'island',
      poly: circlePoly(650, -1500, 400, 13, 0.3),
      desc: 'Academy Point — a low green headland with the signal mast on its crown. '
        + 'Generations of cadets have learned here that the wind does not care what '
        + 'their orders say.',
    },
    {
      id: 'kestrel-shoal', name: 'Kestrel Shoal', kind: 'reef', depth: 3,
      poly: circlePoly(1500, -450, 240, 10, 0.35),
      desc: 'Kestrel Shoal — sand and weed a fathom under the surface. It has never '
        + 'sunk anyone, but it has ended a few careers.',
    },
  ],

  ships: [
    {
      classId: 'sloop-albion', side: 'player', name: 'HMS Swallow',
      pos: { x: 0, y: 0 }, vel: { x: 1.5, y: 0 }, heading: 0, doctrine: 'player',
      fireControl: { mode: 'hold', shot: 'round', engaged: false },
    },
    {
      classId: 'merch', side: 'neutral', name: 'Windward Mark',
      pos: { x: -1900, y: -300 }, vel: { x: 0, y: 0 }, heading: 0, doctrine: 'buoy',
      sailsUp: false, trim: 0,
      desc: 'A tarred barrel on a mooring, dead upwind of the anchorage. The whole '
        + 'point of it is that you cannot sail straight at it.',
    },
    {
      classId: 'merch', side: 'enemy', name: 'Old Tortoise',
      pos: { x: 900, y: 1100 }, vel: { x: 0, y: 0 }, heading: 1.4, doctrine: 'buoy',
      sailsUp: false, trim: 0,
      desc: 'A condemned merchant hull kept at moorings as a gunnery target. Her '
        + 'timbers have absorbed more shot than most ships in the fleet.',
    },
    {
      classId: 'merch', side: 'enemy', name: 'Cormorant',
      pos: { x: 2100, y: 300 }, vel: { x: 0, y: 0 }, heading: 2.6, doctrine: 'buoy',
      sailsUp: false, trim: 0,
      // Opuštěný vrak doopravdy: bez posádky, bez morálky a se staženou vlajkou.
      // Boarding je tím nesporný (updateBoarding krvácí jen proti bránícímu se
      // cíli), takže cvičení nestojí hráče ani jednoho muže — jinak by se ztráty
      // posádky přenesly z tutoriálu do kampaně jako trvalé opotřebení vlajkové
      // lodi (showOutcome ukládá stav přeživší lodi do profilu).
      surrendered: true, morale: 0, subsystems: { crew: 0 },
      desc: 'A derelict brought in for the boarding exercise — no crew, no colours, '
        + 'just enough deck left to teach a boarding party where to put its feet.',
    },
    {
      classId: 'brig-albion', side: 'player', name: 'HMS Diligence',
      pos: { x: -250, y: 800 }, vel: { x: 0, y: 0 }, heading: 0, doctrine: 'buoy',
      sailsUp: false, trim: 0,
      desc: 'The Academy\'s brig, at anchor with the examiners aboard. Every order '
        + 'you give today is being written down.',
    },
  ],

  objectives: [
    { id: 'obj-mark', text: 'Beat up to the windward mark (within 250 m)', state: 'open' },
    { id: 'obj-guns', text: 'Put a broadside into the target hulk', state: 'open' },
    { id: 'obj-board', text: 'Take the derelict Cormorant as a prize', state: 'open' },
  ],

  triggers: [
    {
      id: 'trg-welcome', once: true,
      conditions: [{ kind: 'time', t: 3 }],
      actions: [{
        kind: 'comm', speaker: 'admiral',
        text: 'Admiral Thorne: "Welcome to your last day as a cadet, captain. Three '
          + 'exercises, no enemy, no excuses. Show me you can read the wind and I will '
          + 'give you a ship of your own."',
      }],
    },
    {
      id: 'trg-wind-lesson', once: true,
      conditions: [{ kind: 'time', t: 10 }],
      actions: [{
        kind: 'comm', speaker: 'mate',
        text: 'SAILING SCHOOL: the wind blows to the EAST — see the rose in the corner. '
          + 'Set sail (W) and click open water to steer. We run fastest with the wind on '
          + 'our quarter; dead into it the sails go slack and we are IN IRONS.',
      }],
    },
    {
      id: 'trg-tack-lesson', once: true,
      conditions: [{ kind: 'time', t: 24 }],
      actions: [{
        kind: 'comm', speaker: 'bosun',
        text: 'The mark is dead upwind, so we cannot lay it in one board. TACK — steer '
          + 'about forty-five degrees off the wind, run a leg, then cut across to the '
          + 'other side. Zigzag up to it. In a flat calm, or if you get stuck, put out '
          + 'the OARS (E) — slow, but they do not care where the wind is.',
      }],
    },
    {
      id: 'trg-mark-done', once: true,
      conditions: [{ kind: 'distanceBelow', shipA: PLAYER, shipB: MARK, distance: 250 }],
      actions: [
        { kind: 'objectiveComplete', objectiveId: 'obj-mark' },
        { kind: 'setFlag', flag: 'mark-rounded' },
        {
          kind: 'comm', speaker: 'admiral',
          text: 'Thorne: "Rounded, and not badly. That is the whole art of it — the '
            + 'faster ship does not win, the one that reads the wind does. Now the guns: '
            + 'the old hulk lies to the south-east."',
        },
      ],
    },
    {
      id: 'trg-gun-lesson', once: true,
      conditions: [{ kind: 'flag', flag: 'mark-rounded' }, { kind: 'time', t: 30 }],
      actions: [{
        kind: 'comm', speaker: 'gunner',
        text: 'GUNNERY: we fire from the SIDE, not the bow — bring the hulk abeam and '
          + 'give her FIRE port or starboard (Q/R). Three shots to choose from (1/2/3): '
          + 'ROUND tears the hull, CHAIN cuts sails and rigging to slow a runner, GRAPE '
          + 'mows down the crew before a boarding.',
      }],
    },
    {
      id: 'trg-guns-done', once: true,
      // práh musí padnout po JEDNÉ salvě, jinak by nováček správně vystřelil a
      // nic by se nestalo. Šalupa má 4 děla po 6 poškození a do trupu jde jen
      // část (round 0,55 · chain 0,25 · grape 0,2), takže na 120bodovém trupu
      // hulky stačí 0,98 — projde i salva kartáčem, kterou lekce taky nabízí.
      conditions: [{ kind: 'hullBelow', shipId: HULK, fraction: 0.98 }],
      actions: [
        { kind: 'objectiveComplete', objectiveId: 'obj-guns' },
        { kind: 'setFlag', flag: 'guns-fired' },
        {
          kind: 'comm', speaker: 'gunner',
          text: 'Straight into her! Remember the other trick: cross a ship\'s bow or '
            + 'stern and your whole broadside runs the length of her deck. That is a '
            + 'RAKE, and it hurts twice as much.',
        },
      ],
    },
    {
      id: 'trg-board-lesson', once: true,
      conditions: [{ kind: 'flag', flag: 'guns-fired' }],
      actions: [{
        kind: 'comm', speaker: 'bosun',
        text: 'Last one: the derelict to the east. She is a bare hulk — no crew, no '
          + 'colours, nobody to fight. Lay us alongside her, inside about sixty metres, '
          + 'and give the BOARDING order; the party does the rest. On a live enemy it is '
          + 'a bloody business, so soften her with grape first — but a captured ship is '
          + 'worth far more than one on the bottom.',
      }],
    },
    {
      id: 'trg-board-done', once: true,
      conditions: [{ kind: 'shipBoarded', shipId: DERELICT }],
      actions: [
        { kind: 'objectiveComplete', objectiveId: 'obj-board' },
        { kind: 'setFlag', flag: 'boarded' },
        { kind: 'comm', speaker: 'mate', text: 'Cormorant is ours — prize crew aboard!' },
      ],
    },
    {
      // potopil ji místo obsazení: úkol uznáme (tutoriál nikoho netrestá),
      // ale ať si odnese, že kořist má větší cenu než vrak na dně
      id: 'trg-board-sunk', once: true,
      conditions: [{ kind: 'shipDestroyed', shipId: DERELICT }],
      actions: [
        { kind: 'objectiveComplete', objectiveId: 'obj-board' },
        { kind: 'setFlag', flag: 'boarded' },
        {
          kind: 'comm', speaker: 'admiral',
          text: 'Thorne: "You sank the exercise, captain. It counts — but a prize pays '
            + 'the crew and a wreck pays nobody. Remember that when it is a real hull."',
        },
      ],
    },
    {
      id: 'trg-pass', once: true,
      conditions: [
        { kind: 'flag', flag: 'mark-rounded' },
        { kind: 'flag', flag: 'guns-fired' },
        { kind: 'flag', flag: 'boarded' },
      ],
      actions: [{
        kind: 'winMission',
        text: 'Examination passed. Admiral Thorne: "Sloop HMS Swallow is yours, captain. '
          + 'Report to the customs patrol in the strait off Turtle Island."',
      }],
    },
    {
      id: 'trg-player-lost', once: true,
      conditions: [{ kind: 'shipDestroyed', shipId: PLAYER }],
      actions: [{ kind: 'loseMission', text: 'You lost the Swallow on an examination day. The Academy has seen worse — but not much worse.' }],
    },
  ],
}
