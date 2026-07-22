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
  title: 'Blokáda Cádizu',
  briefing:
    'De Vega se stáhl do Cádizu — kotviště, kde Castilla shromažďuje poslední '
    + 'pokladní flotilu. Admiralita ti svěřila kapitální loď: řadovou loď HMS '
    + 'Sovereign, dvacet osm děl na bok.\n\n'
    + 'Prober se kolem pobřežní baterie a rozbij castillskou eskadru u brány — '
    + 'dvě fregaty a pokladní galeonu. Baterii nemusíš srovnat se zemí; stačí ji '
    + 'umlčet nebo přežít její gauntlet a vyřídit lodě. Sovereign je pomalá a '
    + 'špatně se otáčí — nech ji držet linii a sypat salvy, zatímco Fortuna '
    + 'a Ostříž tančí kolem a rakují. Pozor na mělčiny, kapitální kýl je hluboký.',
  seed: 17051614,
  ambient: '#0b2833',
  wind: { baseDir: 1.5, baseSpeed: 8, rotationRate: 0.0012, gustiness: 0.6 },

  islands: [
    { id: 'cadiz-n', name: 'Cádiz (severní mys)', kind: 'island', poly: circlePoly(3400, 2000, 700, 16, 0.3) },
    { id: 'cadiz-s', name: 'Cádiz (jižní mys)', kind: 'island', poly: circlePoly(3600, -2100, 720, 16, 0.3),
      desc: 'Jižní mys Cádizu — v jeho závětří kotví pokladní flotila.' },
    { id: 'bar9', name: 'Vnější mělčina', kind: 'reef', depth: 4, poly: circlePoly(2600, 0, 380, 12, 0.4) },
  ],

  ships: [
    { classId: 'liner-albion', side: 'player', name: 'HMS Sovereign', pos: { x: -200, y: 0 }, vel: { x: 2, y: 0 }, heading: 0, doctrine: 'player', fireControl: { mode: 'auto', shot: 'round', engaged: false } },
    { classId: 'frigate-albion', side: 'player', name: 'HMS Fortuna', pos: { x: -500, y: 800 }, vel: { x: 3, y: 0 }, heading: 0, doctrine: 'raider', fireControl: { mode: 'auto', shot: 'round', engaged: false } },
    { classId: 'brig-albion', side: 'player', name: 'HMS Ostříž', pos: { x: -600, y: -700 }, vel: { x: 3, y: 0 }, heading: 0, doctrine: 'raider', fireControl: { mode: 'auto', shot: 'round', engaged: false } },
    { classId: 'fort-coastal', side: 'enemy', name: 'Baterie Cádizu', pos: { x: 3200, y: 250 }, vel: { x: 0, y: 0 }, heading: Math.PI / 2, doctrine: 'fort', sailsUp: false, trim: 0 },
    { classId: 'frigate-castilla', side: 'enemy', name: 'Centinela', pos: { x: 3600, y: 1500 }, vel: { x: -2, y: 0 }, heading: Math.PI, doctrine: 'attack', fireControl: { mode: 'auto', shot: 'round', engaged: false } },
    { classId: 'frigate-castilla', side: 'enemy', name: 'Guardián', pos: { x: 3700, y: -1300 }, vel: { x: -2, y: 0 }, heading: Math.PI, doctrine: 'attack', fireControl: { mode: 'auto', shot: 'round', engaged: false } },
    { classId: 'galleon-castilla', side: 'enemy', name: 'Baluarte', pos: { x: 4200, y: 200 }, vel: { x: -1, y: 0 }, heading: Math.PI, doctrine: 'attack', fireControl: { mode: 'auto', shot: 'round', engaged: false } },
  ],

  objectives: [{ id: 'obj-break', text: 'Rozbij castillskou eskadru u brány Cádizu (2 fregaty + galeona)', state: 'open' }],

  triggers: [
    { id: 'trg-brief', once: true, conditions: [{ kind: 'time', t: 4 }], actions: [{ kind: 'comm', speaker: 'admiral', text: 'admirál Thorne: „Sovereign je vaše, kapitáne — velte jí dobře. Prolomte tu obranu a zavřete de Vegu v Cádizu. Zbytek dořešíme uvnitř."' }] },
    { id: 'trg-liner-tip', once: true, conditions: [{ kind: 'time', t: 20 }], actions: [{ kind: 'comm', speaker: 'mate', text: 'Rusk: „Sovereign není šalupa — neuhýbá, drží linii. Nech fregaty, ať zaměstnají fregaty; my stypem salvu za salvou do galeony a pevnosti." ' }] },
    { id: 'e5a', once: true, conditions: [{ kind: 'shipDestroyed', shipId: 5 }], actions: [{ kind: 'setFlag', flag: 'e5' }] },
    { id: 'e5b', once: true, conditions: [{ kind: 'shipSurrendered', shipId: 5 }], actions: [{ kind: 'setFlag', flag: 'e5' }] },
    { id: 'e6a', once: true, conditions: [{ kind: 'shipDestroyed', shipId: 6 }], actions: [{ kind: 'setFlag', flag: 'e6' }] },
    { id: 'e6b', once: true, conditions: [{ kind: 'shipSurrendered', shipId: 6 }], actions: [{ kind: 'setFlag', flag: 'e6' }] },
    { id: 'e7a', once: true, conditions: [{ kind: 'shipDestroyed', shipId: 7 }], actions: [{ kind: 'setFlag', flag: 'e7' }] },
    { id: 'e7b', once: true, conditions: [{ kind: 'shipSurrendered', shipId: 7 }], actions: [{ kind: 'setFlag', flag: 'e7' }] },
    { id: 'trg-win', once: true, conditions: [{ kind: 'flag', flag: 'e5' }, { kind: 'flag', flag: 'e6' }, { kind: 'flag', flag: 'e7' }], actions: [{ kind: 'objectiveComplete', objectiveId: 'obj-break' }, { kind: 'winMission', text: 'Vnější obrana Cádizu padla. De Vega je zavřený uvnitř s pokladní flotilou — a klíč od dveří máš ty.' }] },
    { id: 'trg-lost', once: true, conditions: [{ kind: 'allDestroyed', side: 'player' }], actions: [{ kind: 'loseMission', text: 'HMS Sovereign klesla pod děly Cádizu. Blokáda je zlomena.' }] },
  ],
}
