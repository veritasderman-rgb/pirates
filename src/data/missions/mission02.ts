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
  title: 'Konvoj v Soutěsce',
  briefing:
    'HMS Ostříž vede dva kupce Soutěskou — úžinou mezi Kančím a Mlžným ostrovem. '
    + 'Rozvědka varuje před pirátskou smečkou, která tu číhá v návětří.\n\n'
    + 'Kupci plují k východnímu vjezdu; tvým úkolem je udržet je naživu a vyřídit '
    + 'piráty. Využij ostrovy: v úžině se velké lodě špatně otáčejí a v závětří '
    + 'ztrácejí vítr. Řetězovou salvou zpomal, plnou potop, kartáčem proděravěj '
    + 'posádku před výsadkem.',
  seed: 17020918,
  ambient: '#0e3340',
  wind: { baseDir: 0.1, baseSpeed: 7.5, rotationRate: 0.001, gustiness: 0.5 },

  islands: [
    { id: 'boar', name: 'Kančí ostrov', kind: 'island', poly: circlePoly(2600, 1500, 700, 16, 0.3),
      desc: 'Kančí ostrov — zalesněný hřbet nad severním břehem Soutěsky.' },
    { id: 'mist', name: 'Mlžný ostrov', kind: 'island', poly: circlePoly(3200, -1600, 620, 14, 0.35),
      desc: 'Mlžný ostrov — nižší, obklopený mělčinami; za ním vítr téměř ustává.' },
    { id: 'reef-mid', name: 'Střední mělčina', kind: 'reef', depth: 3, poly: circlePoly(3000, 0, 300, 10, 0.4),
      desc: 'Mělčina uprostřed úžiny — past pro těžké kýly.' },
  ],

  ships: [
    {
      classId: 'brig-albion', side: 'player', name: 'HMS Ostříž',
      pos: { x: 300, y: 0 }, vel: { x: 3, y: 0 }, heading: 0.1, doctrine: 'player',
      fireControl: { mode: 'auto', shot: 'round', engaged: false },
    },
    {
      // eskortovaní kupci jsou albionští (strana player) — piráti (enemy) na ně
      // útočí, hráč je chrání; doktrína freighter je nechá prchat, ne bojovat
      classId: 'merch', side: 'player', name: 'Naděje',
      pos: { x: -200, y: 250 }, vel: { x: 2.5, y: 0 }, heading: 0.1, doctrine: 'freighter',
      nav: { kind: 'course', dest: { x: 6500, y: 400 }, arriveAtRest: false }, trim: 1,
      desc: 'Kupecká loď Naděje — náklad plátna a koření pro východní přístav.',
    },
    {
      classId: 'merch', side: 'player', name: 'Vytrvalost',
      pos: { x: -450, y: -200 }, vel: { x: 2.5, y: 0 }, heading: 0.1, doctrine: 'freighter',
      nav: { kind: 'course', dest: { x: 6500, y: -300 }, arriveAtRest: false }, trim: 1,
      desc: 'Kupecká loď Vytrvalost — sesterská loď Naděje, stejná linka.',
    },
    {
      classId: 'sloop-pirate', side: 'enemy', name: 'Krysí ocas',
      pos: { x: 2400, y: 2100 }, vel: { x: -2, y: -1 }, heading: 3.6, doctrine: 'buoy',
    },
    {
      classId: 'sloop-pirate', side: 'enemy', name: 'Hladová vlna',
      pos: { x: 3000, y: -2200 }, vel: { x: -2, y: 1 }, heading: 2.6, doctrine: 'buoy',
    },
    {
      classId: 'brig-pirate', side: 'enemy', name: 'Černý příboj',
      pos: { x: 4200, y: 200 }, vel: { x: -3, y: 0 }, heading: Math.PI, doctrine: 'buoy',
      desc: 'Vlajková briga pirátského kapitána — vynoří se, až smečka sevře kořist.',
    },
  ],

  objectives: [
    { id: 'obj-convoy', text: 'Doveď aspoň jednoho kupce k východnímu vjezdu', state: 'open' },
    { id: 'obj-pirates', text: 'Vyřiď pirátskou smečku', state: 'open' },
  ],

  triggers: [
    {
      id: 'trg-intro', once: true,
      conditions: [{ kind: 'time', t: 4 }],
      actions: [{
        kind: 'comm', speaker: 'lookout',
        text: 'Plachty v návětří! Dvě šalupy od ostrovů — pirátská smečka, kapitáne. '
          + 'A za nimi něco většího.',
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
        { kind: 'comm', speaker: 'pirate', text: 'Pirátská briga: „Vztyčte černou! Berem všechno, co plave!"' },
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
        { kind: 'winMission', text: 'Smečka rozprášena, konvoj v bezpečí. Soutěska je zase průchozí.' },
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
        { kind: 'loseMission', text: 'Oba kupci na dně. Konvoj byl ztracen.' },
      ],
    },
    {
      // ztráta eskorty = prohra (kupci jsou bezbranní); m2 nemá bojovou flotilu,
      // proto ne allDestroyed, ale konkrétní eskortní loď
      id: 'trg-player-lost', once: true,
      conditions: [{ kind: 'shipDestroyed', shipId: OSTRIZ }],
      actions: [{ kind: 'loseMission', text: 'HMS Ostříž se potopila — konvoj zůstal bez ochrany.' }],
    },
  ],
}
