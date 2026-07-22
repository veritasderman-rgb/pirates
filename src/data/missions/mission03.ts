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
  title: 'Vlčí past',
  briefing:
    'HMS Fortuna hlídkuje u Kotlového ostrova. Kapitanát hlásí osamělou '
    + 'kupeckou loď „Santa Rosa", která bez eskorty drifuje v úžině — po '
    + 'událostech u Soutěsky až podezřele klidně.\n\n'
    + 'Prověř ji. Ale drž si odstup a připrav boky: jestli je to past, '
    + 'odhalí se až zblízka — a Q-loď má první salvu zadarmo. Nejrychleji '
    + 'ji zlomíš rakem do přídě nebo zádě, kde nemá děla.',
  seed: 17031102,
  ambient: '#0d2f3c',
  wind: { baseDir: 2.4, baseSpeed: 8, rotationRate: 0.0009, gustiness: 0.4 },

  islands: [
    { id: 'kettle', name: 'Kotlový ostrov', kind: 'island', poly: circlePoly(-1800, -1200, 640, 15, 0.3),
      desc: 'Kotlový ostrov — sopečný kužel s hlubokou zátokou; oblíbená skrýš.' },
    { id: 'reef-n', name: 'Vraní útes', kind: 'reef', depth: 3, poly: circlePoly(1600, 1400, 300, 10, 0.4) },
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
      desc: 'Kupecká loď „Santa Rosa" — na papíře veze víno a olej. Sedí v úžině '
        + 'nízko na vodě, jako by čekala, až se někdo přiblíží.',
    },
    {
      classId: 'merch', side: 'neutral', name: 'Coração',
      pos: { x: -900, y: 1600 }, vel: { x: 2, y: 0 }, heading: 0.2, doctrine: 'freighter',
      nav: { kind: 'course', dest: { x: 6000, y: 1200 }, arriveAtRest: false },
      desc: 'Pravý kupec na lince — platný manifest, vyděšená posádka.',
    },
  ],

  objectives: [
    { id: 'obj-approach', text: 'Prověř Santa Rosu (přibliž se na 600 m)', state: 'open' },
    { id: 'obj-defeat', text: 'Znič nebo zajmi Q-loď', state: 'open' },
  ],

  triggers: [
    {
      id: 'trg-brief', once: true, conditions: [{ kind: 'time', t: 4 }],
      actions: [{
        kind: 'comm', speaker: 'admiral',
        text: 'admirál Thorne: „Fortuno, po Soutěsce nevěřím žádnému osamělému kupci. '
          + 'Prověřte tu loď — ale mějte děla připravená. Jestli je to past, chci, '
          + 'aby sklapla na ně, ne na vás."',
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
        { kind: 'message', text: 'Santa Rosa odklápí boky — DĚLA! Je to Q-loď!' },
        { kind: 'setSide', shipId: QSHIP, side: 'enemy' },
        { kind: 'setDoctrine', shipId: QSHIP, doctrine: 'attack' },
        { kind: 'revealClass', shipId: QSHIP },
        {
          kind: 'comm', speaker: 'agent',
          text: 'Neznámý hlas na castillské frekvenci: „Vítejte, kapitáne. Don Cristóbal '
            + 'de Vega vás zdraví — a lituje, že tahle plavba bude vaše poslední."',
        },
      ],
    },
    {
      id: 'trg-hint-rake', once: true,
      conditions: [{ kind: 'hullBelow', shipId: FORTUNA, fraction: 0.7 }],
      actions: [{
        kind: 'comm', speaker: 'mate',
        text: 'Rusk: „Bere nás bok za bok, kapitáne — to nevyhrajeme. Obtančit ji a '
          + 'raknout do zádi, kde děla nemá; jednou dvakrát a je po ní."',
      }],
    },
    {
      id: 'trg-qship-sunk', once: true, conditions: [{ kind: 'shipDestroyed', shipId: QSHIP }],
      actions: [
        { kind: 'objectiveComplete', objectiveId: 'obj-defeat' },
        { kind: 'winMission', text: 'Santa Rosa je na dně. Past sklapla naprázdno.' },
      ],
    },
    {
      id: 'trg-qship-struck', once: true, conditions: [{ kind: 'shipSurrendered', shipId: QSHIP }],
      actions: [
        { kind: 'objectiveComplete', objectiveId: 'obj-defeat' },
        {
          kind: 'comm', speaker: 'bosun',
          text: 'Tarr: „Vzdali se! V kajutě kapitána castillské rozkazy a pečeť — '
            + 'de Vega. Admiralita tohle bude chtít vidět."',
        },
        { kind: 'winMission', text: 'Q-loď zajata i s rozkazy. Síť má první jméno: de Vega.' },
      ],
    },
    {
      id: 'trg-player-lost', once: true, conditions: [{ kind: 'shipDestroyed', shipId: FORTUNA }],
      actions: [{ kind: 'loseMission', text: 'HMS Fortuna se potopila — past sklapla.' }],
    },
  ],
}
