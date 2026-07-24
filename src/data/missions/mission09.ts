/**
 * Mise 9 — „Blokáda Cádizu" (eskadra 4 vs 4+pevnost). Poprvé velíš KAPITÁLNÍ
 * lodi: řadové lodi HMS Sovereign. Prolom vnější obranu Cádizu — pevnost a
 * castillskou eskadru — a otevři cestu k pokladní flotile uvnitř.
 *
 * Id: 1 Sovereign(hráč, řadová) 2 Fortuna 3 Ostříž | 4 pevnost 5-6 fregaty 7 galeona
 */
import type { Scenario } from '../../sim/types'
import { circlePoly } from '../../sim/geom'

const SOVEREIGN = 1

export const mission09: Scenario = {
  id: 'mission09',
  title: 'The Blockade of Cádiz',
  briefing:
    'De Vega has withdrawn into Cádiz — the anchorage where Castilla is gathering her '
    + 'last treasure fleet. The admiralty has entrusted you with a capital ship: the '
    + 'ship of the line HMS Sovereign, twenty-eight guns to a side.\n\n'
    + 'Fight your way past the coastal battery and break the Castillan squadron at the '
    + 'gate — two frigates and a treasure galleon. You need not raze the battery; it '
    + 'is enough to silence it or survive its gauntlet and deal with the ships. The '
    + 'Sovereign is slow and turns poorly — let her hold the line and pour out '
    + 'broadsides while the Fortuna and the Goshawk dance around and rake. Mind the '
    + 'shoals, a capital keel runs deep.',
  seed: 17051614,
  ambient: '#0b2833',
  wind: { baseDir: 1.5, baseSpeed: 8, rotationRate: 0.0012, gustiness: 0.6 },

  islands: [
    { id: 'cadiz-n', name: 'Cádiz (north cape)', kind: 'island', poly: circlePoly(3400, 2000, 700, 16, 0.3) },
    { id: 'cadiz-s', name: 'Cádiz (south cape)', kind: 'island', poly: circlePoly(3600, -2100, 720, 16, 0.3),
      desc: 'The south cape of Cádiz — the treasure fleet lies at anchor in its lee.' },
    { id: 'bar9', name: 'Outer Shallows', kind: 'reef', depth: 4, poly: circlePoly(2600, 0, 380, 12, 0.4) },
  ],

  ships: [
    { classId: 'liner-albion', side: 'player', name: 'HMS Sovereign', pos: { x: -200, y: 0 }, vel: { x: 2, y: 0 }, heading: 0, doctrine: 'player', fireControl: { mode: 'auto', shot: 'round', engaged: false } },
    { classId: 'frigate-albion', side: 'player', name: 'HMS Fortuna', pos: { x: -500, y: 800 }, vel: { x: 3, y: 0 }, heading: 0, doctrine: 'raider', fireControl: { mode: 'auto', shot: 'round', engaged: false } },
    { classId: 'brig-albion', side: 'player', name: 'HMS Goshawk', pos: { x: -600, y: -700 }, vel: { x: 3, y: 0 }, heading: 0, doctrine: 'raider', fireControl: { mode: 'auto', shot: 'round', engaged: false } },
    { classId: 'fort-coastal', side: 'enemy', name: 'Cádiz Battery', pos: { x: 3200, y: 250 }, vel: { x: 0, y: 0 }, heading: Math.PI / 2, doctrine: 'fort', sailsUp: false, trim: 0 },
    { classId: 'frigate-castilla', side: 'enemy', name: 'Centinela', pos: { x: 3600, y: 1500 }, vel: { x: -2, y: 0 }, heading: Math.PI, doctrine: 'attack', fireControl: { mode: 'auto', shot: 'round', engaged: false } },
    { classId: 'frigate-castilla', side: 'enemy', name: 'Guardián', pos: { x: 3700, y: -1300 }, vel: { x: -2, y: 0 }, heading: Math.PI, doctrine: 'attack', fireControl: { mode: 'auto', shot: 'round', engaged: false } },
    { classId: 'galleon-castilla', side: 'enemy', name: 'Baluarte', pos: { x: 4200, y: 200 }, vel: { x: -1, y: 0 }, heading: Math.PI, doctrine: 'attack', fireControl: { mode: 'auto', shot: 'round', engaged: false } },
  ],

  objectives: [{ id: 'obj-break', text: 'Break the Castillan squadron at the gate of Cádiz (2 frigates + galleon)', state: 'open' }],

  triggers: [
    { id: 'trg-brief', once: true, conditions: [{ kind: 'time', t: 4 }], actions: [{ kind: 'comm', speaker: 'admiral', text: 'Admiral Thorne: "The Sovereign is yours, captain — command her well. Break that defence and seal de Vega inside Cádiz. The rest we settle within."' }] },
    { id: 'trg-liner-tip', once: true, conditions: [{ kind: 'time', t: 20 }], actions: [{ kind: 'comm', speaker: 'mate', text: 'Rusk: "The Sovereign is no sloop — she doesn\'t dodge, she holds the line. Let the frigates keep the frigates busy; we pour broadside after broadside into the galleon and the fortress." ' }] },
    { id: 'e5a', once: true, conditions: [{ kind: 'shipDestroyed', shipId: 5 }], actions: [{ kind: 'setFlag', flag: 'e5' }] },
    { id: 'e5b', once: true, conditions: [{ kind: 'shipSurrendered', shipId: 5 }], actions: [{ kind: 'setFlag', flag: 'e5' }] },
    { id: 'e6a', once: true, conditions: [{ kind: 'shipDestroyed', shipId: 6 }], actions: [{ kind: 'setFlag', flag: 'e6' }] },
    { id: 'e6b', once: true, conditions: [{ kind: 'shipSurrendered', shipId: 6 }], actions: [{ kind: 'setFlag', flag: 'e6' }] },
    { id: 'e7a', once: true, conditions: [{ kind: 'shipDestroyed', shipId: 7 }], actions: [{ kind: 'setFlag', flag: 'e7' }] },
    { id: 'e7b', once: true, conditions: [{ kind: 'shipSurrendered', shipId: 7 }], actions: [{ kind: 'setFlag', flag: 'e7' }] },
    { id: 'trg-win', once: true, conditions: [{ kind: 'flag', flag: 'e5' }, { kind: 'flag', flag: 'e6' }, { kind: 'flag', flag: 'e7' }], actions: [{ kind: 'objectiveComplete', objectiveId: 'obj-break' }, { kind: 'winMission', text: 'The outer defence of Cádiz has fallen. De Vega is shut inside with the treasure fleet — and you hold the key to the door.' }] },
    { id: 'trg-lost', once: true, conditions: [{ kind: 'allDestroyed', side: 'player' }], actions: [{ kind: 'loseMission', text: 'HMS Sovereign went down under the guns of Cádiz. The blockade is broken.' }] },
  ],
}
