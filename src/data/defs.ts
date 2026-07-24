import type { ShipClassDef } from '../sim/types'

/**
 * Třídy lodí. Dvě koruny (Albion — hráč; Castilla — soupeř), volní piráti,
 * kupci a pobřežní pevnosti. Asymetrie stran je v `gunnery` (výcvik děl):
 * Albionské námořnictvo míří nejlíp, Castilla o něco hůř, piráti s kořistními
 * děly nejhůř; kupci se prakticky neubrání.
 *
 * Pohon: `sailArea` × `canRow`/`oarThrust` řídí tah, `hullDrag` doběhovou
 * rychlost, `turnRate` obratnost. Malý `draft` projede mělčiny.
 */
export const SHIP_CLASSES: Record<string, ShipClassDef> = {
  // ---------- Albion (hráč) ----------
  'sloop-albion': {
    id: 'sloop-albion', name: 'Sloop (Albion)', hullCode: 'SLOOP', tons: 90,
    sailArea: 0.82, canRow: true, oarThrust: 0.22, draft: 1.5, turnRate: 0.14,
    hullDrag: 0.034, hullPoints: 60, gunsPerBroadside: 4, gunDamage: 6, gunRange: 430,
    crew: 45, lookoutRange: 3200, gunnery: 0.9,
    lore: 'A single-masted sloop — the nimblest hull in the Royal Navy. '
      + 'She carries a handful of guns, slips across shoals no frigate would dare, '
      + 'and puts out oars when the wind dies. Courier, scout and smuggler-hunter; '
      + 'but in a straight fight with a cruiser she has no business being there.',
  },
  'brig-albion': {
    id: 'brig-albion', name: 'Brig (Albion)', hullCode: 'BRIG', tons: 200,
    sailArea: 1.0, canRow: false, oarThrust: 0, draft: 2.6, turnRate: 0.1,
    hullDrag: 0.048, hullPoints: 105, gunsPerBroadside: 7, gunDamage: 7, gunRange: 480,
    crew: 95, lookoutRange: 3800, gunnery: 0.9,
    lore: 'A two-masted brig — the backbone of patrol duty. Balanced sail area, '
      + 'a respectable broadside and crew enough for a boarding party. She carries '
      + 'no oars, so in a calm she sits; otherwise a dependable workhorse that '
      + 'hunts down merchantmen and holds a convoy together.',
  },
  'frigate-albion': {
    id: 'frigate-albion', name: 'Frigate (Albion)', hullCode: 'FRIGATE', tons: 700,
    sailArea: 1.12, canRow: false, oarThrust: 0, draft: 3.2, turnRate: 0.088,
    hullDrag: 0.044, hullPoints: 170, gunsPerBroadside: 13, gunDamage: 8, gunRange: 560,
    crew: 210, lookoutRange: 4600, gunnery: 0.92,
    lore: 'A frigate — the fast warship built for independent operations. Thirteen '
      + 'guns to a side, the finest gunnery in the fleet and a lookout perched on '
      + 'lofty masts. She hunts raiders and shields trade; but she cannot stand up '
      + 'to a ship of the line — her armour is a class thinner.',
  },

  // ---------- Castilla (soupeř) ----------
  'frigate-castilla': {
    id: 'frigate-castilla', name: 'Frigate (Castilla)', hullCode: 'FRIGATE', tons: 760,
    sailArea: 1.14, canRow: false, oarThrust: 0, draft: 3.4, turnRate: 0.084,
    hullDrag: 0.046, hullPoints: 180, gunsPerBroadside: 14, gunDamage: 8, gunRange: 540,
    crew: 230, lookoutRange: 4400, gunnery: 0.8,
    lore: 'A Castillan frigate — a hair heavier than the Albion, one gun stronger '
      + 'to a side, but with a crew a generation worse trained. She trusts to a '
      + 'wider broadside and to tonnage where she lacks precision.',
  },
  'galleon-castilla': {
    id: 'galleon-castilla', name: 'Treasure Galleon', hullCode: 'GALLEON', tons: 1100,
    sailArea: 1.3, canRow: false, oarThrust: 0, draft: 4.5, turnRate: 0.05,
    hullDrag: 0.09, hullPoints: 230, gunsPerBroadside: 8, gunDamage: 7, gunRange: 500,
    crew: 140, lookoutRange: 4200, gunnery: 0.7,
    lore: 'A treasure galleon — the floating strongbox of the Castillan crown. High '
      + 'sides, a hold crammed with silver and just guns enough to see off insolence. '
      + 'Slow, ponderous to turn, and her captain knows she is the prize every '
      + 'pirate at sea dreams of.',
  },
  'liner-castilla': {
    id: 'liner-castilla', name: 'Ship of the Line (Castilla)', hullCode: 'LINER', tons: 2000,
    sailArea: 1.5, canRow: false, oarThrust: 0, draft: 5.2, turnRate: 0.044,
    hullDrag: 0.082, hullPoints: 380, gunsPerBroadside: 30, gunDamage: 10, gunRange: 640,
    crew: 550, lookoutRange: 5200, gunnery: 0.82,
    lore: 'A ship of the line — a moving fortress of three gun decks. Thirty barrels '
      + 'to a side turn any line of battle into a wall of fire. The price is the '
      + 'manoeuvre: turning her takes an age and she dares not enter the shoals. '
      + 'Stand alongside her and you have lost; dance around her and rake her stern, '
      + 'and you have a chance.',
  },

  // ---------- piráti ----------
  'sloop-pirate': {
    id: 'sloop-pirate', name: 'Prize Sloop', hullCode: 'SLOOP', tons: 85,
    sailArea: 0.8, canRow: true, oarThrust: 0.24, draft: 1.4, turnRate: 0.145,
    hullDrag: 0.033, hullPoints: 55, gunsPerBroadside: 3, gunDamage: 6, gunRange: 400,
    crew: 55, lookoutRange: 3000, gunnery: 0.66,
    lore: 'The prize sloop of a pirate pack — fast, cheap and expendable. She hunts '
      + 'in packs: one pins the escort while the rest tear the convoy apart. Packed '
      + 'with a crew hungry to board, guns off the black market and no discipline '
      + 'at the firing.',
  },
  'brig-pirate': {
    id: 'brig-pirate', name: 'Pirate Brig', hullCode: 'BRIG', tons: 210,
    sailArea: 1.0, canRow: false, oarThrust: 0, draft: 2.5, turnRate: 0.102,
    hullDrag: 0.047, hullPoints: 100, gunsPerBroadside: 7, gunDamage: 7, gunRange: 460,
    crew: 120, lookoutRange: 3700, gunnery: 0.68,
    lore: 'The flagship of a pirate captain — a captured brig, patched and re-gunned. '
      + 'Her gunnery is poor, but her crew is many and hungry for plunder: pirates '
      + 'are loath to sink what they can board and sell.',
  },
  'galley-corsair': {
    id: 'galley-corsair', name: 'Corsair Galley', hullCode: 'GALLEY', tons: 300,
    sailArea: 0.6, canRow: true, oarThrust: 0.62, draft: 1.8, turnRate: 0.12,
    hullDrag: 0.07, hullPoints: 95, gunsPerBroadside: 3, gunDamage: 6, gunRange: 380,
    crew: 190, lookoutRange: 2900, gunnery: 0.7,
    lore: 'A corsair galley — the oared predator of coastal waters. When others sit '
      + 'nailed in place by a calm, the galley rows straight into the wind and runs '
      + 'her quarry down on her own terms. On the open sea and in a swell, though, '
      + 'she is slow and vulnerable — she belongs to the islands and the narrows.',
  },

  // ---------- neutrálové a stavby ----------
  'merch': {
    id: 'merch', name: 'Merchantman', hullCode: 'MERCH', tons: 800,
    sailArea: 1.0, canRow: false, oarThrust: 0, draft: 4.0, turnRate: 0.05,
    hullDrag: 0.1, hullPoints: 120, gunsPerBroadside: 2, gunDamage: 5, gunRange: 300,
    crew: 25, lookoutRange: 3000, gunnery: 0.3,
    lore: 'An ordinary merchantman — full of cargo, empty of guns. Two swivel '
      + 'barrels to scare off trouble, and otherwise she trusts to her escort and '
      + 'her prayers. Exactly what the pirates in these waters are after.',
  },
  'fort-coastal': {
    id: 'fort-coastal', name: 'Coastal Fort', hullCode: 'FORT', tons: 4000,
    sailArea: 0, canRow: false, oarThrust: 0, draft: 99, turnRate: 0,
    // nebezpečná, ale ne okamžitá smrt: dolet o něco delší než lodní děla,
    // menší kadence přesnosti — dá se přežít průjezd na okraji dostřelu
    hullDrag: 1, hullPoints: 700, gunsPerBroadside: 10, gunDamage: 7, gunRange: 620,
    crew: 300, lookoutRange: 5000, gunnery: 0.72,
    lore: 'A stone coastal battery guarding the harbor entrance. It moves nowhere, '
      + 'but its red-hot shot carries farther than ship\'s guns and its stone '
      + 'walls swallow broadside after broadside. To take the harbor you must first '
      + 'silence the fortress — or slip past beyond its range.',
  },

  /** řadová loď Albionu — kapitální loď hráče pro pozdní kampaň (m9+) */
  'liner-albion': {
    id: 'liner-albion', name: 'Ship of the Line (Albion)', hullCode: 'LINER', tons: 1900,
    sailArea: 1.45, canRow: false, oarThrust: 0, draft: 5.0, turnRate: 0.046,
    hullDrag: 0.08, hullPoints: 360, gunsPerBroadside: 28, gunDamage: 10, gunRange: 650,
    crew: 520, lookoutRange: 5200, gunnery: 0.9,
    lore: 'A ship of the line of the Royal Navy — Albion\'s answer to Castillan '
      + 'tonnage. Where Castilla builds mountains of steel, Albion builds a slightly '
      + 'smaller but better-trained fist: twenty-eight guns to a side, the finest '
      + 'gun crews in the fleet, and sides that let nothing through at close range. '
      + 'The price is the old familiar one — turning her takes an age and she dares '
      + 'not enter the shoals. But in a line of battle she has no equal among Albion '
      + 'hulls.',
  },

  // ---------- zvláštní (zvraty misí) ----------
  /** velká vlajková loď Castilly — de Vegův plovoucí trůn, finále kampaně (m11) */
  'flagship-castilla': {
    id: 'flagship-castilla', name: 'Flagship Corona', hullCode: 'LINER', tons: 2400,
    sailArea: 1.55, canRow: false, oarThrust: 0, draft: 5.5, turnRate: 0.038,
    hullDrag: 0.086, hullPoints: 460, gunsPerBroadside: 34, gunDamage: 11, gunRange: 660,
    crew: 650, lookoutRange: 5400, gunnery: 0.82,
    lore: 'Corona — the largest hull the Castillan yards ever put to water. Four gun '
      + 'decks, gilding from keel to masthead and a crew of half a thousand men. She '
      + 'is not merely a ship, she is the floating throne of Don Cristóbal de Vega '
      + 'and the last card in his game for Halcyon. No one beats her alongside; '
      + 'whoever means to sink her must take her apart piece by piece — and pray her '
      + 'decks give out before he runs out of ships.',
  },
  /** Q-loď: castillský pomocný křižník maskovaný za kupce — trup kupce, uvnitř děla */
  'qship-castilla': {
    id: 'qship-castilla', name: 'Auxiliary Cruiser (Q-ship)', hullCode: 'MERCH', tons: 780,
    sailArea: 1.0, canRow: false, oarThrust: 0, draft: 3.6, turnRate: 0.07,
    hullDrag: 0.075, hullPoints: 175, gunsPerBroadside: 9, gunDamage: 8, gunRange: 500,
    crew: 200, lookoutRange: 4000, gunnery: 0.78,
    lore: 'An auxiliary cruiser: the hull of a merchantman with a military gun deck '
      + 'beneath the cargo hatches. Castilla deploys them as traps for escorts — so '
      + 'long as she holds the mask she looks like a slow trader; up close she drops '
      + 'her sides and pours out a broadside no one would expect from a merchant. '
      + 'Once unmasked, her civilian hull and improvised deck betray her.',
  },
  /** kurýrní šalup: nejrychlejší trup, beze zbraní — nese zapečetěné rozkazy */
  'courier-castilla': {
    id: 'courier-castilla', name: 'Courier Sloop', hullCode: 'SLOOP', tons: 60,
    sailArea: 0.95, canRow: true, oarThrust: 0.2, draft: 1.3, turnRate: 0.15,
    // rychlý, ale ne nedostižný: o chlup rychlejší než fregata (0.044) —
    // ve stern chase ujede, dostihne se JEN uříznutím cesty (weather gage)
    hullDrag: 0.043, hullPoints: 45, gunsPerBroadside: 1, gunDamage: 5, gunRange: 350,
    crew: 30, lookoutRange: 3400, gunnery: 0.5,
    lore: 'A courier sloop — little more than a sail on an eggshell. The fastest hull '
      + 'the Castillan yards can build, made for one thing alone: to deliver '
      + 'dispatches before anyone can run her down. No guns and no armour; her only '
      + 'defence is speed, a clean wind, and oars for a calm.',
  },
}
