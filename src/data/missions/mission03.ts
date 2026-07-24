/**
 * Mise 3 — „Vlčí past" (fregata). Zvrat: castillská Q-loď.
 * Osamělý „kupec" driftuje u Kotlového ostrova. Přiblížíš se ke kontrole —
 * a on zblízka odklopí boky: pomocný křižník plný děl. Přežij přepad a
 * potop ho, nebo přinuť ke kapitulaci a obsaď (uvnitř jsou další rozkazy).
 *
 * Id: 1 = HMS Fortuna (hráč), 2 = „Santa Rosa" (Q-loď), 3 = pravý kupec (bóje)
 */
import type { Scenario } from '../../sim/types'
import { circlePoly } from '../../sim/geom'

const FORTUNA = 1
const QSHIP = 2

export const mission03: Scenario = {
  id: 'mission03',
  title: 'Wolf Trap',
  briefing:
    'HMS Fortuna patrols off Cauldron Island. Port Command reports a lone '
    + 'merchantman, the "Santa Rosa", drifting in the strait with no escort — '
    + 'after what happened at the Narrows, suspiciously calm.\n\n'
    + 'Check her over. But keep your distance and ready your sides: if it is a '
    + 'trap, it will spring only up close — and a Q-ship gets the first broadside '
    + 'for free. You break her fastest by raking her bow or stern, where she has '
    + 'no guns.',
  seed: 17031102,
  ambient: '#0d2f3c',
  wind: { baseDir: 2.4, baseSpeed: 8, rotationRate: 0.0009, gustiness: 0.4 },

  islands: [
    { id: 'kettle', name: 'Cauldron Island', kind: 'island', poly: circlePoly(-1800, -1200, 640, 15, 0.3),
      desc: 'Cauldron Island — a volcanic cone with a deep bay; a favourite hiding place.' },
    { id: 'reef-n', name: 'Crow\'s Reef', kind: 'reef', depth: 3, poly: circlePoly(1600, 1400, 300, 10, 0.4) },
  ],

  ships: [
    {
      classId: 'frigate-albion', side: 'player', name: 'HMS Fortuna',
      pos: { x: 0, y: 0 }, vel: { x: 3, y: 0 }, heading: 0, doctrine: 'player',
      fireControl: { mode: 'hold', shot: 'round', engaged: false },
    },
    {
      // do odhalení se tváří jako neutrální kupec (disguise) — teprve zvrat
      // z ní udělá nepřátelskou Q-loď (setSide + revealClass smaže masku)
      classId: 'qship-castilla', side: 'neutral', name: 'Santa Rosa', disguise: 'merch',
      pos: { x: 1800, y: 200 }, vel: { x: 0, y: 0 }, heading: 3.0, doctrine: 'buoy',
      desc: 'The merchantman "Santa Rosa" — on paper she carries wine and oil. She '
        + 'sits low in the water in the strait, as though waiting for someone to come close.',
    },
    {
      classId: 'merch', side: 'neutral', name: 'Coração',
      pos: { x: -900, y: 1600 }, vel: { x: 2, y: 0 }, heading: 0.2, doctrine: 'freighter',
      nav: { kind: 'course', dest: { x: 6000, y: 1200 }, arriveAtRest: false },
      desc: 'A genuine merchantman on her run — a valid manifest, a frightened crew.',
    },
  ],

  objectives: [
    { id: 'obj-approach', text: 'Check over the Santa Rosa (close to within 600 m)', state: 'open' },
    { id: 'obj-defeat', text: 'Destroy or capture the Q-ship', state: 'open' },
  ],

  triggers: [
    {
      id: 'trg-brief', once: true, conditions: [{ kind: 'time', t: 4 }],
      actions: [{
        kind: 'comm', speaker: 'admiral',
        text: 'Admiral Thorne: "Fortuna, after the Narrows I trust no lone merchantman. '
          + 'Check that ship over — but keep your guns ready. If it is a trap, I want '
          + 'it to snap shut on them, not on you."',
      }],
    },
    {
      id: 'trg-approach', once: true,
      conditions: [{ kind: 'distanceBelow', shipA: FORTUNA, shipB: QSHIP, distance: 600 }],
      actions: [{ kind: 'objectiveComplete', objectiveId: 'obj-approach' }],
    },
    {
      id: 'trg-spring', once: true,
      conditions: [{ kind: 'distanceBelow', shipA: FORTUNA, shipB: QSHIP, distance: 550 }],
      actions: [
        { kind: 'message', text: 'The Santa Rosa drops her sides — GUNS! It\'s a Q-ship!' },
        { kind: 'setSide', shipId: QSHIP, side: 'enemy' },
        { kind: 'setDoctrine', shipId: QSHIP, doctrine: 'attack' },
        { kind: 'revealClass', shipId: QSHIP },
        {
          kind: 'comm', speaker: 'agent',
          text: 'An unknown voice on the Castillan channel: "Welcome, captain. Don '
            + 'Cristóbal de Vega sends his regards — and regrets that this voyage will '
            + 'be your last."',
        },
      ],
    },
    {
      id: 'trg-hint-rake', once: true,
      conditions: [{ kind: 'hullBelow', shipId: FORTUNA, fraction: 0.7 }],
      actions: [{
        kind: 'comm', speaker: 'mate',
        text: 'Rusk: "She\'s trading us broadside for broadside, captain — we won\'t win '
          + 'that. Dance around her and rake her stern, where she has no guns; once or '
          + 'twice and she\'s done."',
      }],
    },
    {
      id: 'trg-qship-sunk', once: true, conditions: [{ kind: 'shipDestroyed', shipId: QSHIP }],
      actions: [
        { kind: 'objectiveComplete', objectiveId: 'obj-defeat' },
        { kind: 'winMission', text: 'The Santa Rosa is on the bottom. The trap snapped shut on empty air.' },
      ],
    },
    {
      id: 'trg-qship-struck', once: true, conditions: [{ kind: 'shipSurrendered', shipId: QSHIP }],
      actions: [
        { kind: 'objectiveComplete', objectiveId: 'obj-defeat' },
        {
          kind: 'comm', speaker: 'bosun',
          text: 'Tarr: "They\'ve surrendered! In the captain\'s cabin, Castillan orders '
            + 'and a seal — de Vega. The admiralty will want to see this."',
        },
        { kind: 'winMission', text: 'The Q-ship captured, orders and all. The net has its first name: de Vega.' },
      ],
    },
    {
      id: 'trg-player-lost', once: true, conditions: [{ kind: 'shipDestroyed', shipId: FORTUNA }],
      actions: [{ kind: 'loseMission', text: 'HMS Fortuna has sunk — the trap snapped shut.' }],
    },
  ],
}
