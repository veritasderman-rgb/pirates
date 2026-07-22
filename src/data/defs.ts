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
    id: 'sloop-albion', name: 'šalupa (Albion)', hullCode: 'SLOOP', tons: 90,
    sailArea: 0.82, canRow: true, oarThrust: 0.22, draft: 1.5, turnRate: 0.14,
    hullDrag: 0.034, hullPoints: 60, gunsPerBroadside: 4, gunDamage: 6, gunRange: 430,
    crew: 45, lookoutRange: 3200, gunnery: 0.9,
    lore: 'Jednostěžňová šalupa — nejmrštnější trup Královského námořnictva. '
      + 'Uveze pár děl, projede mělčinu, kam se fregata neodváží, a do bezvětří '
      + 'nasadí vesla. Kurýr, zvěd a lovec pašeráků; v přímém boji s křižníkem '
      + 'ale nemá co pohledávat.',
  },
  'brig-albion': {
    id: 'brig-albion', name: 'briga (Albion)', hullCode: 'BRIG', tons: 200,
    sailArea: 1.0, canRow: false, oarThrust: 0, draft: 2.6, turnRate: 0.1,
    hullDrag: 0.048, hullPoints: 105, gunsPerBroadside: 7, gunDamage: 7, gunRange: 480,
    crew: 95, lookoutRange: 3800, gunnery: 0.9,
    lore: 'Dvoustěžňová briga — páteř hlídkové služby. Vyvážená plachetní plocha, '
      + 'slušná boční salva a dost posádky na výsadek. Nevesluje, takže v bezvětří '
      + 'stojí; jinak spolehlivá pracantka, která uloví kupce a ubrání konvoj.',
  },
  'frigate-albion': {
    id: 'frigate-albion', name: 'fregata (Albion)', hullCode: 'FRIGATE', tons: 700,
    sailArea: 1.12, canRow: false, oarThrust: 0, draft: 3.2, turnRate: 0.088,
    hullDrag: 0.044, hullPoints: 170, gunsPerBroadside: 13, gunDamage: 8, gunRange: 560,
    crew: 210, lookoutRange: 4600, gunnery: 0.92,
    lore: 'Fregata — rychlá válečná loď pro samostatné operace. Třináct děl na bok, '
      + 'nejlepší výcvik děl ve flotile a dohled z vysokých stěžňů. Loví nájezdníky '
      + 'a chrání obchod; proti řadové lodi ale nepostojí — pancíř má tenčí o třídu.',
  },

  // ---------- Castilla (soupeř) ----------
  'frigate-castilla': {
    id: 'frigate-castilla', name: 'fregata (Castilla)', hullCode: 'FRIGATE', tons: 760,
    sailArea: 1.14, canRow: false, oarThrust: 0, draft: 3.4, turnRate: 0.084,
    hullDrag: 0.046, hullPoints: 180, gunsPerBroadside: 14, gunDamage: 8, gunRange: 540,
    crew: 230, lookoutRange: 4400, gunnery: 0.8,
    lore: 'Castillská fregata — o vlas těžší než albionská, o čtrnácté dělo na bok '
      + 'silnější, ale s posádkou o generaci hůř vycvičenou. Sází na širší salvu '
      + 'a tonáž tam, kde jí chybí přesnost.',
  },
  'galleon-castilla': {
    id: 'galleon-castilla', name: 'pokladní galeona', hullCode: 'GALLEON', tons: 1100,
    sailArea: 1.3, canRow: false, oarThrust: 0, draft: 4.5, turnRate: 0.05,
    hullDrag: 0.09, hullPoints: 230, gunsPerBroadside: 8, gunDamage: 7, gunRange: 500,
    crew: 140, lookoutRange: 4200, gunnery: 0.7,
    lore: 'Pokladní galeona — plovoucí truhla castillské koruny. Vysoké boky, '
      + 'plné podpalubí stříbra a jen tolik děl, aby odradila drzost. Pomalá, '
      + 'těžko se otáčí a její kapitán ví, že je kořistí snů každého piráta v moři.',
  },
  'liner-castilla': {
    id: 'liner-castilla', name: 'řadová loď (Castilla)', hullCode: 'LINER', tons: 2000,
    sailArea: 1.5, canRow: false, oarThrust: 0, draft: 5.2, turnRate: 0.044,
    hullDrag: 0.082, hullPoints: 380, gunsPerBroadside: 30, gunDamage: 10, gunRange: 640,
    crew: 550, lookoutRange: 5200, gunnery: 0.82,
    lore: 'Řadová loď — pohyblivá pevnost o třech palubách děl. Třicet hlavní na bok '
      + 'promění každou linii v ohnivou zeď. Daní je manévr: obrátit ji trvá věčnost '
      + 'a do mělčin se neodváží. Kdo se jí postaví bok po boku, prohrál; kdo ji '
      + 'obtančí a rakuje do zádi, má šanci.',
  },

  // ---------- piráti ----------
  'sloop-pirate': {
    id: 'sloop-pirate', name: 'kořistní šalupa', hullCode: 'SLOOP', tons: 85,
    sailArea: 0.8, canRow: true, oarThrust: 0.24, draft: 1.4, turnRate: 0.145,
    hullDrag: 0.033, hullPoints: 55, gunsPerBroadside: 3, gunDamage: 6, gunRange: 400,
    crew: 55, lookoutRange: 3000, gunnery: 0.66,
    lore: 'Kořistní šalupa pirátské smečky — rychlá, laciná a postradatelná. '
      + 'Loví ve smečkách: jedna váže eskortu, ostatní trhají konvoj. Přecpaná '
      + 'posádkou dychtivou po výsadku, s děly z černého trhu a bez kázně u palby.',
  },
  'brig-pirate': {
    id: 'brig-pirate', name: 'pirátská briga', hullCode: 'BRIG', tons: 210,
    sailArea: 1.0, canRow: false, oarThrust: 0, draft: 2.5, turnRate: 0.102,
    hullDrag: 0.047, hullPoints: 100, gunsPerBroadside: 7, gunDamage: 7, gunRange: 460,
    crew: 120, lookoutRange: 3700, gunnery: 0.68,
    lore: 'Vlajková loď pirátského kapitána — kořistní briga, látaná a přezbrojená. '
      + 'Palba nepřesná, zato posádka početná a hladová po kořisti: piráti neradi '
      + 'potápějí to, co se dá obsadit a prodat.',
  },
  'galley-corsair': {
    id: 'galley-corsair', name: 'korzárská galéra', hullCode: 'GALLEY', tons: 300,
    sailArea: 0.6, canRow: true, oarThrust: 0.62, draft: 1.8, turnRate: 0.12,
    hullDrag: 0.07, hullPoints: 95, gunsPerBroadside: 3, gunDamage: 6, gunRange: 380,
    crew: 190, lookoutRange: 2900, gunnery: 0.7,
    lore: 'Korzárská galéra — veslový dravec pobřežních vod. Když ostatní v bezvětří '
      + 'stojí jak přibití, galéra vesluje přímo proti větru a doráží kořist na vlastní '
      + 'podmínky. Na volném moři a ve vlnách je ale pomalá a zranitelná — patří k '
      + 'ostrovům a úžinám.',
  },

  // ---------- neutrálové a stavby ----------
  'merch': {
    id: 'merch', name: 'kupecká loď', hullCode: 'MERCH', tons: 800,
    sailArea: 1.0, canRow: false, oarThrust: 0, draft: 4.0, turnRate: 0.05,
    hullDrag: 0.1, hullPoints: 120, gunsPerBroadside: 2, gunDamage: 5, gunRange: 300,
    crew: 25, lookoutRange: 3000, gunnery: 0.3,
    lore: 'Obyčejná kupecká loď — plná zboží, prázdná na děla. Dvě otočné hlavně '
      + 'na odplašení a jinak spoléhá na eskortu a modlitbu. Přesně to, po čem '
      + 'piráti v těchhle vodách jdou.',
  },
  'fort-coastal': {
    id: 'fort-coastal', name: 'pobřežní pevnost', hullCode: 'FORT', tons: 4000,
    sailArea: 0, canRow: false, oarThrust: 0, draft: 99, turnRate: 0,
    // nebezpečná, ale ne okamžitá smrt: dolet o něco delší než lodní děla,
    // menší kadence přesnosti — dá se přežít průjezd na okraji dostřelu
    hullDrag: 1, hullPoints: 700, gunsPerBroadside: 10, gunDamage: 7, gunRange: 620,
    crew: 300, lookoutRange: 5000, gunnery: 0.72,
    lore: 'Kamenná pobřežní baterie, která hlídá vjezd do přístavu. Nikam se '
      + 'nehne, zato její žhavé koule dolétnou dál než lodní děla a kamenné zdi '
      + 'spolknou salvu za salvou. Dobýt přístav znamená nejdřív umlčet pevnost — '
      + 'nebo proklouznout mimo její dostřel.',
  },

  // ---------- zvláštní (zvraty misí) ----------
  /** Q-loď: castillský pomocný křižník maskovaný za kupce — trup kupce, uvnitř děla */
  'qship-castilla': {
    id: 'qship-castilla', name: 'pomocný křižník (Q-loď)', hullCode: 'MERCH', tons: 780,
    sailArea: 1.0, canRow: false, oarThrust: 0, draft: 3.6, turnRate: 0.07,
    hullDrag: 0.075, hullPoints: 175, gunsPerBroadside: 9, gunDamage: 8, gunRange: 500,
    crew: 200, lookoutRange: 4000, gunnery: 0.78,
    lore: 'Pomocný křižník: trup kupecké lodi, pod nákladovými poklopy vojenská '
      + 'paluba. Castilla je nasazuje jako pasti na eskorty — dokud drží masku, '
      + 'vypadá jako pomalý obchodník; zblízka odklopí boky a vysype salvu, jakou '
      + 'by u kupce nikdo nečekal. Jakmile je odhalen, zrazuje ho civilní trup '
      + 'a improvizovaná paluba.',
  },
  /** kurýrní šalup: nejrychlejší trup, beze zbraní — nese zapečetěné rozkazy */
  'courier-castilla': {
    id: 'courier-castilla', name: 'kurýrní šalup', hullCode: 'SLOOP', tons: 60,
    sailArea: 0.95, canRow: true, oarThrust: 0.2, draft: 1.3, turnRate: 0.15,
    // rychlý, ale ne nedostižný: o chlup rychlejší než fregata (0.044) —
    // ve stern chase ujede, dostihne se JEN uříznutím cesty (weather gage)
    hullDrag: 0.043, hullPoints: 45, gunsPerBroadside: 1, gunDamage: 5, gunRange: 350,
    crew: 30, lookoutRange: 3400, gunnery: 0.5,
    lore: 'Kurýrní šalup — v podstatě plachta na skořápce. Nejrychlejší trup, jaký '
      + 'castillské loděnice postaví, stavěný na jediné: doručit depeše dřív, než '
      + 'je někdo dostihne. Beze zbraní a bez pancíře; jeho jedinou obranou je '
      + 'rychlost, čistý vítr a vesla do bezvětří.',
  },
}
