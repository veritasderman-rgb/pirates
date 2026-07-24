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
  title: 'The Nest',
  briefing:
    'The dispatches gave away the nest: the Shoal Brotherhood lies at anchor in the '
    + 'bay of Bone Island, sheltered by a coastal battery. It is led by Silas Rourke, '
    + '"Black Surf" — a man on de Vega\'s payroll.\n\n'
    + 'You sail in with the Fortuna and the allied brig Goshawk. Smash the pack and '
    + 'capture or sink Rourke\'s flagship brig. The battery at the entrance is '
    + 'dangerous — stay within its range only when you must, and in the narrow bay do '
    + 'not run onto the shoals. Split your fire with the Goshawk and rake where you can.',
  seed: 17040309,
  ambient: '#0c2a35',
  wind: { baseDir: 0.5, baseSpeed: 7, rotationRate: 0.0008, gustiness: 0.55 },

  islands: [
    { id: 'bone-n', name: 'Bone Island (north)', kind: 'island', poly: circlePoly(3200, 2100, 780, 16, 0.28),
      desc: 'The northern ridge of Bone Island — it shelters the bay from wind and from prying eyes.' },
    { id: 'bone-s', name: 'Bone Island (south)', kind: 'island', poly: circlePoly(3400, -2000, 760, 16, 0.3) },
    { id: 'bar', name: 'Bone Shoal', kind: 'reef', depth: 3, poly: circlePoly(2500, 0, 380, 12, 0.4),
      desc: 'A shoal across the entrance — a trap for deep keels, passable only for light ones.' },
  ],

  ships: [
    {
      classId: 'frigate-albion', side: 'player', name: 'HMS Fortuna',
      pos: { x: -400, y: 400 }, vel: { x: 3, y: 0 }, heading: 0, doctrine: 'player',
      fireControl: { mode: 'auto', shot: 'round', engaged: false },
    },
    {
      classId: 'brig-albion', side: 'player', name: 'HMS Goshawk',
      pos: { x: -700, y: -300 }, vel: { x: 3, y: 0 }, heading: 0, doctrine: 'raider',
      fireControl: { mode: 'auto', shot: 'round', engaged: false },
      desc: 'The allied brig HMS Goshawk — commanded by your old comrade from the Convoy in the Narrows.',
    },
    {
      classId: 'fort-coastal', side: 'enemy', name: 'Bone Island Battery',
      pos: { x: 3300, y: 250 }, vel: { x: 0, y: 0 }, heading: 0, doctrine: 'fort',
      sailsUp: false, trim: 0,
    },
    {
      classId: 'sloop-pirate', side: 'enemy', name: 'Vulture', pos: { x: 3600, y: 1100 }, vel: { x: 0, y: 0 }, heading: 3.4, doctrine: 'buoy',
    },
    {
      classId: 'sloop-pirate', side: 'enemy', name: 'Sea Serpent', pos: { x: 3700, y: -1000 }, vel: { x: 0, y: 0 }, heading: 2.9, doctrine: 'buoy',
    },
    {
      classId: 'brig-pirate', side: 'enemy', name: 'Black Surf',
      pos: { x: 4200, y: 0 }, vel: { x: 0, y: 0 }, heading: Math.PI, doctrine: 'buoy',
      desc: 'Silas Rourke\'s flagship brig — patched, re-gunned, with a crew hungry '
        + 'for plunder. The man who serves Castillan silver.',
    },
  ],

  objectives: [
    { id: 'obj-flag', text: 'Destroy or capture Rourke\'s flagship brig', state: 'open' },
    { id: 'obj-pack', text: 'Smash the pirate pack', state: 'open' },
  ],

  triggers: [
    {
      id: 'trg-brief', once: true, conditions: [{ kind: 'time', t: 4 }],
      actions: [{
        kind: 'comm', speaker: 'admiral',
        text: 'Admiral Thorne: "Rourke is the key, captain. Bring him to me alive if '
          + 'you can — a man who takes Castillan silver knows names. The Goshawk covers '
          + 'your other flank."',
      }],
    },
    {
      id: 'trg-wake', once: true,
      conditions: [{ kind: 'distanceBelow', shipA: FORTUNA, shipB: FLAG, distance: 2600 }],
      actions: [
        { kind: 'message', text: 'The nest is waking — the pirates are setting sail and the battery is turning!' },
        { kind: 'setDoctrine', shipId: P1, doctrine: 'raider' },
        { kind: 'setDoctrine', shipId: P2, doctrine: 'raider' },
        { kind: 'setDoctrine', shipId: FLAG, doctrine: 'raider' },
        { kind: 'revealClass', shipId: FLAG },
        { kind: 'comm', speaker: 'pirate-captain',
          text: 'Silas Rourke: "A king\'s dog in my very nest? Run up the black, lads — '
            + 'and let the battery sweeten him up!"' },
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
          text: 'Silas Rourke: "Enough! I strike my colours… and if you want de Vega, '
            + 'captain, the last of the silver is making for the strait at the Three '
            + 'Beacons. Almirante Herrera. That\'s all I know."' },
      ],
    },
    {
      id: 'trg-win', once: true,
      conditions: [{ kind: 'flag', flag: 'flag-out' }, { kind: 'flag', flag: 'p1' }, { kind: 'flag', flag: 'p2' }],
      actions: [{ kind: 'winMission', text: 'The nest is cleared and Rourke dealt with. The net has its last name: Herrera, the strait at the Three Beacons.' }],
    },
    {
      id: 'trg-player-lost', once: true, conditions: [{ kind: 'allDestroyed', side: 'player' }],
      actions: [{ kind: 'loseMission', text: 'HMS Fortuna fell in the bay of Bone Island.' }],
    },
  ],
}
