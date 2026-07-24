/**
 * Mise 1 — „Hlídka u Želvího ostrova" (tutoriál, šalupa).
 * Celní kontrola: „kupec" Mořská panna po výzvě odhodí masku a od t=40 s
 * PRCHÁ na volné moře (po větru, broad reach). Honička s termínem, ve které
 * se hráč učí body plavby, trim, vesla a obeplutí ostrova.
 *
 * Id lodí (pořadí pole ships, od 1):
 *   1 = Vlaštovka (hráč), 2 = Mořská panna, 3 = bóje „Volné moře"
 */
import type { Scenario } from '../../sim/types'
import { circlePoly } from '../../sim/geom'

const PLAYER = 1
const RUNNER = 2
const BUOY = 3

export const mission01: Scenario = {
  id: 'mission01',
  title: 'Patrol off Turtle Island',
  briefing:
    'HMS Swallow holds the customs patrol in the strait off Turtle Island. Port '
    + 'Command reports a merchantman, the Sea Maiden, with a suspicious manifest — '
    + 'carry out an inspection: close to within 300 metres. Beware: if she has '
    + 'something to hide, she will crowd on sail and run for open water.\n\n'
    + 'TRAINING: the wind blows to the east — catch it in your sails (you sail '
    + 'fastest on a broad reach, with the wind on your quarter), trim to suit, and '
    + 'put out oars in a calm or into the wind. The island must be sailed AROUND — '
    + 'do not run onto the shoals.',
  seed: 17010704,
  ambient: '#0d3b4a',
  wind: { baseDir: 0.15, baseSpeed: 8.5, rotationRate: 0.0008, gustiness: 0.4 },

  islands: [
    {
      id: 'turtle', name: 'Turtle Island', kind: 'island',
      poly: circlePoly(3000, -250, 520, 14, 0.35),
      desc: 'Turtle Island — a low coral ridge in the middle of the strait. It rises '
        + 'barely above the water, but its shoals were breaking keels long before the '
        + 'first crown ever sailed here.',
    },
    {
      id: 'reef-e', name: 'Dragon\'s Teeth', kind: 'reef', depth: 2,
      poly: circlePoly(3750, 700, 260, 10, 0.4),
      desc: 'Dragon\'s Teeth — reefs just below the surface. Sloops sail over them; '
        + 'anything with a deeper draft leaves its bottom here.',
    },
  ],

  ships: [
    {
      classId: 'sloop-albion', side: 'player', name: 'HMS Swallow',
      pos: { x: 0, y: 0 }, vel: { x: 2, y: 0 }, heading: 0.15, doctrine: 'player',
      fireControl: { mode: 'hold', shot: 'round', engaged: false },
    },
    {
      classId: 'merch', side: 'enemy', name: 'Sea Maiden',
      pos: { x: 1100, y: 150 }, vel: { x: 1, y: 0 }, heading: 0.2, doctrine: 'buoy',
      desc: 'The merchantman Sea Maiden — on paper she carries salt and canvas. She '
        + 'sits unusually calm in the strait, as though waiting for someone.',
    },
    {
      classId: 'merch', side: 'neutral', name: 'Open Water',
      pos: { x: 6800, y: 300 }, vel: { x: 0, y: 0 }, heading: 0, doctrine: 'buoy',
      sailsUp: false, trim: 0,
      desc: 'A navigation buoy on the edge of patrolled waters. Beyond it open water '
        + 'begins — and there no crown can reach.',
    },
    {
      classId: 'merch', side: 'neutral', name: 'Albatross',
      pos: { x: 1500, y: -1400 }, vel: { x: 3, y: 0.5 }, heading: 0.1, doctrine: 'freighter',
      nav: { kind: 'course', dest: { x: 7000, y: -1000 }, arriveAtRest: false },
      desc: 'A merchantman on a regular run — valid transit, a manifest that, for '
        + 'once, checks out.',
    },
  ],

  objectives: [
    { id: 'obj-inspect', text: 'Inspect the Sea Maiden (within 300 m)', state: 'open' },
    { id: 'obj-stop', text: 'Do not let her escape to open water', state: 'open' },
  ],

  triggers: [
    {
      id: 'trg-traffic-ident', once: true,
      conditions: [{ kind: 'time', t: 2 }],
      actions: [{ kind: 'revealClass', shipId: 4 }],
    },
    {
      id: 'trg-hail', once: true,
      conditions: [{ kind: 'time', t: 5 }],
      actions: [{
        kind: 'comm', speaker: 'port',
        text: 'Port Command hails the Swallow: "Stop the Sea Maiden and carry out an '
          + 'inspection. Close to within three hundred metres of her — and keep your '
          + 'eyes on the masthead."',
      }],
    },
    {
      id: 'trg-wind-lesson', once: true,
      conditions: [{ kind: 'time', t: 10 }],
      actions: [{
        kind: 'comm', speaker: 'mate',
        text: 'SAILING SCHOOL: the wind blows to the east. We sail fastest with it on '
          + 'our quarter (a broad reach). Dead into the wind the sails take nothing — '
          + 'there you must TACK (zigzag) or put out the OARS. Watch the wind rose in '
          + 'the corner.',
      }],
    },
    {
      id: 'trg-panna-reply', once: true,
      conditions: [{ kind: 'time', t: 22 }],
      actions: [{
        kind: 'comm', speaker: 'enemy-captain',
        text: 'Sea Maiden: "We\'re carrying salt and we\'re behind schedule, patrol. '
          + 'We\'ll take this up with the governor — don\'t hold us up."',
      }],
    },
    {
      id: 'trg-flee', once: true,
      conditions: [{ kind: 'time', t: 40 }],
      actions: [
        { kind: 'message', text: 'The Sea Maiden crowds on all sail and runs for open water!' },
        { kind: 'setDoctrine', shipId: RUNNER, doctrine: 'runner' },
        { kind: 'setFlag', flag: 'fleeing' },
        { kind: 'revealClass', shipId: RUNNER },
        {
          kind: 'comm', speaker: 'lookout',
          text: 'I knew that calm stank! Under her sails she\'s got military rigging — '
            + 'no merchantman. She\'s running before the wind, captain, run her down '
            + 'before she vanishes past the buoy!',
        },
      ],
    },
    {
      id: 'trg-tack-lesson', once: true,
      conditions: [{ kind: 'flag', flag: 'fleeing' }, { kind: 'time', t: 60 }],
      actions: [{
        kind: 'comm', speaker: 'mate',
        text: 'She\'s running before the wind, where she\'s fast. Hold full trim and a '
          + 'clean wind — and MIND Turtle Island: sail around it, don\'t run onto the '
          + 'shoals. In its lee the wind falls off and you\'d lose your drive.',
      }],
    },
    {
      id: 'trg-inspect-done', once: true,
      conditions: [{ kind: 'distanceBelow', shipA: PLAYER, shipB: RUNNER, distance: 300 }],
      actions: [
        { kind: 'objectiveComplete', objectiveId: 'obj-inspect' },
        {
          kind: 'comm', speaker: 'gunner',
          text: 'We\'re on her! At this range the guns will tear her rigging away — slow '
            + 'her with a chain-shot broadside, sink her with round shot, or force her '
            + 'to strike her colours and board her.',
        },
      ],
    },
    {
      id: 'trg-runner-destroyed', once: true,
      conditions: [{ kind: 'shipDestroyed', shipId: RUNNER }],
      actions: [
        { kind: 'objectiveComplete', objectiveId: 'obj-stop' },
        { kind: 'winMission', text: 'The Sea Maiden lies on the bottom. Port Command: well done, Swallow.' },
      ],
    },
    {
      id: 'trg-runner-struck', once: true,
      conditions: [{ kind: 'shipSurrendered', shipId: RUNNER }],
      actions: [
        { kind: 'objectiveComplete', objectiveId: 'obj-stop' },
        { kind: 'winMission', text: 'The Sea Maiden struck her colours — captured with her cargo. Excellent.' },
      ],
    },
    {
      id: 'trg-runner-escaped', once: true,
      conditions: [{ kind: 'distanceBelow', shipA: RUNNER, shipB: BUOY, distance: 400 }],
      actions: [
        { kind: 'objectiveFail', objectiveId: 'obj-stop' },
        { kind: 'loseMission', text: 'The Sea Maiden escaped to open water. Port Command will not be pleased.' },
      ],
    },
    {
      id: 'trg-player-lost', once: true,
      conditions: [{ kind: 'shipDestroyed', shipId: PLAYER }],
      actions: [{ kind: 'loseMission', text: 'HMS Swallow has sunk.' }],
    },
  ],
}
