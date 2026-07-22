/**
 * Mise 11 — „Koruna" (FINÁLE, velká flotila 5 vs 4+pevnost). Poslední bitva
 * o Halcyon: de Vegova vlajková loď Corona a zbytek castillské moci proti tvé
 * flotile. Rozbij Coronu i eskadru a ukonči de Vegovu hru — nebo padni s vlajkovou
 * lodí a nech Halcyon jeho stříbru.
 *
 * Id: 1 Sovereign(hráč) 2 Valiant 3 Fortuna 4 Odvaha 5 Ostříž | 6 pevnost 7 Corona(de Vega) 8 liner 9-10 fregaty
 */
import type { Scenario } from '../../sim/types'
import { circlePoly } from '../../sim/geom'

const SOVEREIGN = 1
const CORONA = 7

export const mission11: Scenario = {
  id: 'mission11',
  title: 'Koruna',
  briefing:
    'Tady to končí. De Vega vytáhl poslední kartu — vlajkovou loď Corona, '
    + 'čtyři paluby děl, největší trup, jaký kdy Castilla spustila. Kolem ní '
    + 'řadová loď, dvě fregaty a pevnost Cádizu.\n\n'
    + 'Vedeš největší flotilu, jakou Albion sebral: dvě řadové lodi (Sovereign, '
    + 'Valiant), fregaty Fortunu, Odvahu a Neohroženou a brigu Ostříž. Coronu bok po boku '
    + 'neporazíš — sevři ji, rozděl palbu, rakuj do přídě a zádě. Ukonči '
    + 'de Vegovu hru o Halcyon.',
  seed: 17053100,
  ambient: '#0a2530',
  wind: { baseDir: 1.0, baseSpeed: 8, rotationRate: 0.0013, gustiness: 0.65 },

  islands: [
    { id: 'crown-n', name: 'Korunní mys (sever)', kind: 'island', poly: circlePoly(2200, 2600, 640, 15, 0.3) },
    { id: 'crown-m', name: 'Strážní skála', kind: 'island', poly: circlePoly(3400, 0, 560, 14, 0.3), desc: 'Skalní ostrov uprostřed rejdy — kdo ho obeplouvá chytře, sevře Coronu.' },
    { id: 'crown-s', name: 'Korunní mys (jih)', kind: 'island', poly: circlePoly(2400, -2700, 640, 15, 0.3) },
    { id: 'bar11', name: 'Královská mělčina', kind: 'reef', depth: 4, poly: circlePoly(4800, 1200, 340, 10, 0.4) },
  ],

  ships: [
    { classId: 'liner-albion', side: 'player', name: 'HMS Sovereign', pos: { x: -300, y: 0 }, vel: { x: 2, y: 0 }, heading: 0, doctrine: 'player', fireControl: { mode: 'auto', shot: 'round', engaged: false } },
    { classId: 'liner-albion', side: 'player', name: 'HMS Valiant', pos: { x: -600, y: 1000 }, vel: { x: 2, y: 0 }, heading: 0, doctrine: 'raider', fireControl: { mode: 'auto', shot: 'round', engaged: false } },
    { classId: 'frigate-albion', side: 'player', name: 'HMS Fortuna', pos: { x: -500, y: -1000 }, vel: { x: 3, y: 0 }, heading: 0, doctrine: 'raider', fireControl: { mode: 'auto', shot: 'round', engaged: false } },
    { classId: 'frigate-albion', side: 'player', name: 'HMS Odvaha', pos: { x: -800, y: 1800 }, vel: { x: 3, y: 0 }, heading: 0, doctrine: 'raider', fireControl: { mode: 'auto', shot: 'round', engaged: false } },
    { classId: 'brig-albion', side: 'player', name: 'HMS Ostříž', pos: { x: -800, y: -1800 }, vel: { x: 3, y: 0 }, heading: 0, doctrine: 'raider', fireControl: { mode: 'auto', shot: 'chain', engaged: false } },
    { classId: 'fort-coastal', side: 'enemy', name: 'Pevnost Cádizu', pos: { x: 3300, y: 300 }, vel: { x: 0, y: 0 }, heading: Math.PI / 2, doctrine: 'fort', sailsUp: false, trim: 0 },
    { classId: 'flagship-castilla', side: 'enemy', name: 'Corona', pos: { x: 5000, y: 0 }, vel: { x: -1, y: 0 }, heading: Math.PI, doctrine: 'attack', fireControl: { mode: 'auto', shot: 'round', engaged: false }, desc: 'Vlajková loď Dona Cristóbala de Vegy — jeho plovoucí trůn a poslední karta.' },
    { classId: 'liner-castilla', side: 'enemy', name: 'Invencible', pos: { x: 4600, y: -1400 }, vel: { x: -1, y: 0 }, heading: Math.PI, doctrine: 'attack', fireControl: { mode: 'auto', shot: 'round', engaged: false } },
    { classId: 'frigate-castilla', side: 'enemy', name: 'Furia', pos: { x: 4400, y: 1600 }, vel: { x: -2, y: 0 }, heading: Math.PI, doctrine: 'attack', fireControl: { mode: 'auto', shot: 'round', engaged: false } },
    { classId: 'frigate-castilla', side: 'enemy', name: 'Ira', pos: { x: 4800, y: -400 }, vel: { x: -2, y: 0 }, heading: Math.PI, doctrine: 'attack', fireControl: { mode: 'auto', shot: 'round', engaged: false } },
    // 6. spojenec (id 11, na konci pole — neposouvá id nepřátel v triggerech)
    { classId: 'frigate-albion', side: 'player', name: 'HMS Neohrožená', pos: { x: -900, y: 400 }, vel: { x: 3, y: 0 }, heading: 0, doctrine: 'raider', fireControl: { mode: 'auto', shot: 'round', engaged: false } },
  ],

  objectives: [
    { id: 'obj-corona', text: 'Znič nebo zajmi vlajkovou loď Corona', state: 'open' },
    { id: 'obj-fleet', text: 'Rozbij castillskou flotilu (řadová loď + 2 fregaty)', state: 'open' },
  ],

  triggers: [
    { id: 'trg-brief', once: true, conditions: [{ kind: 'time', t: 4 }], actions: [{ kind: 'comm', speaker: 'agent', text: 'Don Cristóbal de Vega: „Tak přece jen jste přišel až sem, kapitáne. Obdivuhodné. Ale Corona neklekne před hrstkou trupů. Pozná Halcyon nového pána — a nebude to vaše koruna."' }] },
    { id: 'trg-tactic', once: true, conditions: [{ kind: 'time', t: 25 }], actions: [{ kind: 'comm', speaker: 'mate', text: 'Rusk: „Corona má víc děl než dvě naše řadové lodi dohromady. Nesmíme jí dovolit soustředit palbu — Valiant zleva, my zprava, fregaty jí rakujou záď. Sevřeme ji o Strážní skálu."' }] },
    { id: 'trg-corona-half', once: true, conditions: [{ kind: 'hullBelow', shipId: CORONA, fraction: 0.5 }], actions: [{ kind: 'comm', speaker: 'agent', text: 'Don Cristóbal de Vega: „Nemožné… Corona krvácí? Držte palbu, vy zbabělci! Za stříbro a korunu!"' }] },
    // castillská flotila (bez Corony)
    { id: 'c8a', once: true, conditions: [{ kind: 'shipDestroyed', shipId: 8 }], actions: [{ kind: 'setFlag', flag: 'c8' }] },
    { id: 'c8b', once: true, conditions: [{ kind: 'shipSurrendered', shipId: 8 }], actions: [{ kind: 'setFlag', flag: 'c8' }] },
    { id: 'c9a', once: true, conditions: [{ kind: 'shipDestroyed', shipId: 9 }], actions: [{ kind: 'setFlag', flag: 'c9' }] },
    { id: 'c9b', once: true, conditions: [{ kind: 'shipSurrendered', shipId: 9 }], actions: [{ kind: 'setFlag', flag: 'c9' }] },
    { id: 'c10a', once: true, conditions: [{ kind: 'shipDestroyed', shipId: 10 }], actions: [{ kind: 'setFlag', flag: 'c10' }] },
    { id: 'c10b', once: true, conditions: [{ kind: 'shipSurrendered', shipId: 10 }], actions: [{ kind: 'setFlag', flag: 'c10' }] },
    { id: 'trg-fleet', once: true, conditions: [{ kind: 'flag', flag: 'c8' }, { kind: 'flag', flag: 'c9' }, { kind: 'flag', flag: 'c10' }], actions: [{ kind: 'objectiveComplete', objectiveId: 'obj-fleet' }] },
    // Corona
    { id: 'corona-sunk', once: true, conditions: [{ kind: 'shipDestroyed', shipId: CORONA }], actions: [{ kind: 'setFlag', flag: 'corona' }, { kind: 'objectiveComplete', objectiveId: 'obj-corona' }] },
    { id: 'corona-struck', once: true, conditions: [{ kind: 'shipSurrendered', shipId: CORONA }], actions: [{ kind: 'setFlag', flag: 'corona' }, { kind: 'objectiveComplete', objectiveId: 'obj-corona' }, { kind: 'comm', speaker: 'agent', text: 'Don Cristóbal de Vega: „Dost… spouštím vlajku. Vyhrál jste Halcyon, kapitáne. Užijte si ho, dokud vám ho někdo taky nezkusí vzít."' }] },
    // výhra: Corona + flotila
    { id: 'trg-win', once: true, conditions: [{ kind: 'flag', flag: 'corona' }, { kind: 'flag', flag: 'c8' }, { kind: 'flag', flag: 'c9' }, { kind: 'flag', flag: 'c10' }], actions: [{ kind: 'winMission', text: 'Corona mlčí a castillská moc v Halcyonu je zlomena. De Vegova hra skončila — a moře, ostrovy i vítr patří zas těm, kdo je umí číst. Kapitáne, vyhrál jsi válku, které jsi měl předejít.' }] },
    { id: 'trg-lost', once: true, conditions: [{ kind: 'allDestroyed', side: 'player' }], actions: [{ kind: 'loseMission', text: 'HMS Sovereign klesá a s ní albionská linie. Corona pluje dál — a Halcyon dostane nového pána.' }] },
  ],
}
