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
  title: 'The Crown',
  briefing:
    'This is where it ends. De Vega has played his last card — the flagship Corona, '
    + 'four decks of guns, the largest hull Castilla ever launched. Around her a ship '
    + 'of the line, two frigates and the fortress of Cádiz.\n\n'
    + 'You lead the largest fleet Albion could muster: two ships of the line '
    + '(Sovereign, Valiant), the frigates Fortuna, Valour and Dauntless and the brig '
    + 'Goshawk. You won\'t beat Corona alongside — hem her in, split your fire, rake '
    + 'her bow and stern. End de Vega\'s game for Halcyon.',
  seed: 17053100,
  ambient: '#0a2530',
  wind: { baseDir: 1.0, baseSpeed: 8, rotationRate: 0.0013, gustiness: 0.65 },

  islands: [
    { id: 'crown-n', name: 'Crown Cape (north)', kind: 'island', poly: circlePoly(2200, 2600, 640, 15, 0.3) },
    { id: 'crown-m', name: 'Sentinel Rock', kind: 'island', poly: circlePoly(3400, 0, 560, 14, 0.3), desc: 'A rocky island in the middle of the roadstead — round it cleverly and you hem Corona in.' },
    { id: 'crown-s', name: 'Crown Cape (south)', kind: 'island', poly: circlePoly(2400, -2700, 640, 15, 0.3) },
    { id: 'bar11', name: 'King\'s Shallows', kind: 'reef', depth: 4, poly: circlePoly(4800, 1200, 340, 10, 0.4) },
  ],

  ships: [
    { classId: 'liner-albion', side: 'player', name: 'HMS Sovereign', pos: { x: -300, y: 0 }, vel: { x: 2, y: 0 }, heading: 0, doctrine: 'player', fireControl: { mode: 'auto', shot: 'round', engaged: false } },
    { classId: 'liner-albion', side: 'player', name: 'HMS Valiant', pos: { x: -600, y: 1000 }, vel: { x: 2, y: 0 }, heading: 0, doctrine: 'raider', fireControl: { mode: 'auto', shot: 'round', engaged: false } },
    { classId: 'frigate-albion', side: 'player', name: 'HMS Fortuna', pos: { x: -500, y: -1000 }, vel: { x: 3, y: 0 }, heading: 0, doctrine: 'raider', fireControl: { mode: 'auto', shot: 'round', engaged: false } },
    { classId: 'frigate-albion', side: 'player', name: 'HMS Valour', pos: { x: -800, y: 1800 }, vel: { x: 3, y: 0 }, heading: 0, doctrine: 'raider', fireControl: { mode: 'auto', shot: 'round', engaged: false } },
    { classId: 'brig-albion', side: 'player', name: 'HMS Goshawk', pos: { x: -800, y: -1800 }, vel: { x: 3, y: 0 }, heading: 0, doctrine: 'raider', fireControl: { mode: 'auto', shot: 'chain', engaged: false } },
    { classId: 'fort-coastal', side: 'enemy', name: 'Fortress of Cádiz', pos: { x: 3300, y: 300 }, vel: { x: 0, y: 0 }, heading: Math.PI / 2, doctrine: 'fort', sailsUp: false, trim: 0 },
    { classId: 'flagship-castilla', side: 'enemy', name: 'Corona', pos: { x: 5000, y: 0 }, vel: { x: -1, y: 0 }, heading: Math.PI, doctrine: 'attack', fireControl: { mode: 'auto', shot: 'round', engaged: false }, desc: 'The flagship of Don Cristóbal de Vega — his floating throne and his last card.' },
    { classId: 'liner-castilla', side: 'enemy', name: 'Invencible', pos: { x: 4600, y: -1400 }, vel: { x: -1, y: 0 }, heading: Math.PI, doctrine: 'attack', fireControl: { mode: 'auto', shot: 'round', engaged: false } },
    { classId: 'frigate-castilla', side: 'enemy', name: 'Furia', pos: { x: 4400, y: 1600 }, vel: { x: -2, y: 0 }, heading: Math.PI, doctrine: 'attack', fireControl: { mode: 'auto', shot: 'round', engaged: false } },
    { classId: 'frigate-castilla', side: 'enemy', name: 'Ira', pos: { x: 4800, y: -400 }, vel: { x: -2, y: 0 }, heading: Math.PI, doctrine: 'attack', fireControl: { mode: 'auto', shot: 'round', engaged: false } },
    // 6. spojenec (id 11, na konci pole — neposouvá id nepřátel v triggerech)
    { classId: 'frigate-albion', side: 'player', name: 'HMS Dauntless', pos: { x: -900, y: 400 }, vel: { x: 3, y: 0 }, heading: 0, doctrine: 'raider', fireControl: { mode: 'auto', shot: 'round', engaged: false } },
  ],

  objectives: [
    { id: 'obj-corona', text: 'Destroy or capture the flagship Corona', state: 'open' },
    { id: 'obj-fleet', text: 'Break the Castillan fleet (ship of the line + 2 frigates)', state: 'open' },
  ],

  triggers: [
    { id: 'trg-brief', once: true, conditions: [{ kind: 'time', t: 4 }], actions: [{ kind: 'comm', speaker: 'agent', text: 'Don Cristóbal de Vega: "So you came all this way after all, captain. Admirable. But Corona will not kneel before a handful of hulls. Halcyon shall know a new master — and it will not be your crown."' }] },
    { id: 'trg-tactic', once: true, conditions: [{ kind: 'time', t: 25 }], actions: [{ kind: 'comm', speaker: 'mate', text: 'Rusk: "Corona has more guns than both our ships of the line together. We can\'t let her concentrate her fire — Valiant to port, us to starboard, the frigates rake her stern. We hem her in against Sentinel Rock."' }] },
    { id: 'trg-corona-half', once: true, conditions: [{ kind: 'hullBelow', shipId: CORONA, fraction: 0.5 }], actions: [{ kind: 'comm', speaker: 'agent', text: 'Don Cristóbal de Vega: "Impossible… Corona is bleeding? Keep firing, you cowards! For the silver and the crown!"' }] },
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
    { id: 'corona-struck', once: true, conditions: [{ kind: 'shipSurrendered', shipId: CORONA }], actions: [{ kind: 'setFlag', flag: 'corona' }, { kind: 'objectiveComplete', objectiveId: 'obj-corona' }, { kind: 'comm', speaker: 'agent', text: 'Don Cristóbal de Vega: "Enough… I strike my colours. You have won Halcyon, captain. Enjoy it, until someone tries to take it from you too."' }] },
    // výhra: Corona + flotila
    { id: 'trg-win', once: true, conditions: [{ kind: 'flag', flag: 'corona' }, { kind: 'flag', flag: 'c8' }, { kind: 'flag', flag: 'c9' }, { kind: 'flag', flag: 'c10' }], actions: [{ kind: 'winMission', text: 'Corona is silent and Castillan power in Halcyon is broken. De Vega\'s game is over — and the sea, the islands and the wind belong once more to those who can read them. Captain, you have won the war you were meant to prevent.' }] },
    { id: 'trg-lost', once: true, conditions: [{ kind: 'allDestroyed', side: 'player' }], actions: [{ kind: 'loseMission', text: 'HMS Sovereign is going down, and the Albion line with her. Corona sails on — and Halcyon gets a new master.' }] },
  ],
}
