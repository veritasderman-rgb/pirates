/**
 * Český překlad UI (HUD, overlaye, tlačítka, tooltip texty). Klíč = přesné
 * anglické znění; položky s {x} jsou šablony pro tp(). České formulace drží
 * původní znění hry, kde existovalo (obnoveno z historie panels.ts).
 */
export const CS_UI: Record<string, string> = {
  // ---------- souhlas s cookies ----------
  'This game measures anonymous traffic (Google Analytics). No cookies are stored without your consent.':
    'Hra měří anonymní návštěvnost (Google Analytics). Bez souhlasu se neukládají žádné cookies.',
  'Accept': 'Souhlasím', 'Decline': 'Odmítnout', 'Cookies': 'Cookies',

  // ---------- topbar ----------
  'wind {kn} kn': 'vítr {kn} kn',
  'calm': 'bezvětří', 'light breeze': 'vánek', 'moderate wind': 'mírný vítr',
  'fresh breeze': 'čerstvý vítr', 'gale': 'vichr', 'storm': 'bouřka',

  // ---------- levý panel (vlastní loď) ----------
  'Ship': 'Loď', '— none selected —': '— nevybráno —',
  'hull': 'trup', 'morale': 'morálka',
  'rigging': 'ráhnoví', 'rudder': 'kormidlo', 'guns P': 'děla L', 'guns S': 'děla P', 'crew': 'posádka',
  'sails:': 'plachty:', 'set': 'napnuté', 'furled': 'svinuté', 'trim:': 'trim:',
  'oars:': 'vesla:', 'YES': 'ANO', 'no': 'ne', 'stamina:': 'stamina:',
  'speed:': 'rychlost:', 'ammo:': 'munice:',
  'guns ready: P {l} · S {s} of {g}': 'děla připravená: L {l} · P {s} z {g}',
  'point of sail:': 'bod plavby:',
  'in irons (no-go)': 'v kleštích (no-go)', 'close-hauled': 'ostře na vítr',
  'beam reach': 'na půl větru', 'broad reach (best)': 'zadoboční (nej)', 'running': 'po větru',

  // ---------- předpověď ----------
  'Weather — forecast': 'Počasí — předpověď', 'now': 'nyní',
  '▲ better': '▲ lepší', '▼ worse': '▼ horší',
  'arrow = where it blows · ▲/▼ = your point of sail on this heading gets better/worse':
    'šipka = kam vane · ▲/▼ = tvůj bod plavby při stálém kurzu se zlepší/zhorší',

  // ---------- pravý panel (cíl / kontakty / mise) ----------
  'Target': 'Cíl', 'Contacts': 'Kontakty', 'Mission': 'Mise',
  '— no target —': '— žádný cíl —',
  'Select an enemy on the map = target it (for manual FIRE port/stbd, surrender demand and boarding). Empty water = course for the selected ship. AUTO fires on its own at the most-damaged enemy in range — it ignores your target.':
    'Vyber nepřítele na mapě = zaměřit (pro ruční PAL levobok/pravobok, výzvu ke kapitulaci a boarding). Prázdná voda = kurz vybrané lodi. AUTO pálí samo na nejzraněnějšího nepřítele v dostřelu — zaměřený cíl neřeší.',
  'unknown class': 'neznámá třída', 'unknown': 'neznámý', ' (lost)': ' (ztracen)',
  'calm seas': 'klid na moři',
  '⚓ boarded — prize secured': '⚓ obsazena — kořist zajištěna',
  '⚑ struck her colours — close to ~60 m and give the "boarding" order':
    '⚑ vzdal se — připluj na ~60 m a dej „boarding"',
  'morale is cracking — try the "demand surrender"': 'nalomená morálka — zkus „výzvu ke kapitulaci"',
  'boarding': 'boarding',

  // ---------- taktický telegraf ----------
  '⚑ gage': '⚑ návětří', '🎯 raking': '🎯 raking', '⚓ boarding': '⚓ boarding',
  'windward ✓ (tighter broadside)': 'návětří ✓ (přesnější salva)',
  'leeward ✗ (smoke in your eyes)': 'závětří ✗ (kouř do očí)',
  'abeam of wind': 'bok větru',
  'lined on bow/stern — 2× devastating broadside!': 'linie na příď/záď — 2× ničivá salva!',
  'line up on the target\'s bow/stern': 'natoč se na příď/záď cíle',
  'odds ~{o}%': 'šance ~{o} %', ' · in range!': ' · na dosah!',

  // ---------- spodní lišta ----------
  'Round shot — tears the HULL. The path to sinking the enemy.':
    'Plné koule — trhají TRUP. Cesta k potopení nepřítele.',
  'Chain shot — tears SAILS and rigging. Slows the prize (to catch it / turn to a boarding).':
    'Řetězové — trhají PLACHTY a ráhnoví. Zpomalí kořist (dohnat / obrátit k boardingu).',
  'Grape shot — mows down the CREW. Breaks morale and sets up a boarding.':
    'Kartáč — kosí POSÁDKU. Láme morálku a připravuje na boarding.',
  'round → hull (sink)': 'koule → trup (potopení)',
  'chain → sails (slow)': 'řetěz → plachty (zpomalí)',
  'grape → crew (boarding)': 'kartáč → posádka (boarding)',
  'shot:': 'náboj:', 'round': 'koule', 'chain': 'řetěz', 'grape': 'kartáč',
  '⛵ sails': '⛵ plachty', 'trim −': 'trim −', 'trim +': 'trim +', '🚣 oars': '🚣 vesla',
  'Set/furl sails (without them the ship gets no drive from the wind)':
    'Vytáhnout/svinout plachty (bez nich loď nemá tah z větru)',
  'Reduce sail (slower)': 'Ubrat plachty (pomaleji)', 'Add sail (faster)': 'Přidat plachty (rychleji)',
  'Oars — a small drive independent of the wind (even upwind), but it tires the crew. Only some ships.':
    'Vesla — malý tah nezávislý na větru (i proti větru), ale unaví posádku. Jen některé lodě.',
  'Shot type for the broadside': 'Typ náboje pro salvu',
  'FIRE port': 'PAL levobok', 'FIRE stbd': 'PAL pravobok',
  'Fire the port broadside (target must be within the arc and range)':
    'Vypálit salvu z levoboku (cíl musí být v úhlu boku a dostřelu)',
  'Fire the starboard broadside': 'Vypálit salvu z pravoboku',
  'AUTO: firing': 'AUTO: pálí sám', 'AUTO: holding fire': 'AUTO: drží palbu',
  'Toggle: AUTO = the ship fires its bearing broadside at the most-damaged enemy in range on its own. Off = holds fire, you fire manually (FIRE port/stbd, Q/R).':
    'Přepínač: AUTO = loď sama pálí bok nesoucí na nejzraněnějšího nepřítele v dostřelu. Vypnuto = drží palbu, střílíš ručně (PAL levobok/pravobok, Q/R).',
  'demand surrender': 'výzva ke kapitulaci',
  'Demand the target strike her colours. Odds rise with her damage, crew losses and your superiority. Once she strikes, you can board her.':
    'Vyzvi zaměřený cíl ke kapitulaci. Šance roste s jeho poškozením, ztrátami posádky a tvou přesilou. Když spustí vlajku, můžeš ho obsadit.',
  'Boarding: lay alongside the target at ~60 m and give the order — the boarding party then fights on its own (watch the meter). Until she strikes, it is a bloody melee: both crews lose men, the weaker more. Grape shot softens her up first. If you bleed out, the party withdraws. A captured ship = a prize (more points than sinking).':
    'Boarding: přilehni k zaměřenému cíli na ~60 m a dej rozkaz — výsadek pak útočí sám (sleduj ukazatel). Dokud se cíl nevzdal, je to krvavý souboj: obě posádky ztrácí muže, slabší víc. Kartáč nepřítele předem změkčí. Vykrvácíš-li, výsadek se stáhne. Zajmutá loď = kořist (víc bodů než potopení).',
  'Light chase guns fore & aft — weak, but they fire along your bow/stern without turning broadside. Handy while running a ship down (the full broadside still hits far harder).':
    'Lehká stíhací děla na přídi a zádi — slabá, ale pálí podél osy bez natáčení boku. Hodí se v honičce (plná boční salva pořád bije mnohem tvrději).',
  '🎯 bow gun': '🎯 příďové dělo', '🎯 stern gun': '🎯 záďové dělo',
  'Fire the bow chaser — target must be roughly ahead (key F)':
    'Vypálit z příďového děla — cíl zhruba před přídí (klávesa F)',
  'Fire the stern chaser — target must be roughly astern (key G)':
    'Vypálit ze záďového děla — cíl zhruba za zádí (klávesa G)',

  // ---------- mluvčí ----------
  'Captain': 'Kapitán', 'Rusk (First Mate)': 'Rusk (I. důstojník)',
  'Hargrove (Master Gunner)': 'Hargrove (dělmistr)', 'Pip (Lookout)': 'Pip (hlídka)',
  'Tarr (Bosun)': 'Tarr (lodní mistr)', 'Enemy': 'Nepřítel', 'Pirate': 'Pirát',
  'Capt. Vane (Port Authority)': 'kpt. Vaneová (kapitanát)', 'Governor': 'Guvernér',
  'Admiral Thorne': 'admirál Thorne',
  'Silas Rourke "Black Surf"': 'Silas Rourke „Černý příboj"',
  'Almirante Herrera': 'almirante Herrera',

  // ---------- kampaňová mapa ----------
  'Treasury:': 'Pokladna:', 'Flagship:': 'Vlajková loď:',
  '🛠 PORT — shipyard & outfitting': '🛠 PŘÍSTAV — loděnice a výbava',
  '⚔ Skirmish': '⚔ Volná bitva',
  'you are here': 'jsi tady',
  'Intro': 'Úvod', 'Play the opening film again': 'Přehrát úvodní film znovu',

  // ---------- úvodní film (komentář ve videu je vždy anglicky) ----------
  'SKIP ▸': 'PŘESKOČIT ▸', '▶ WATCH THE INTRO': '▶ PŘEHRÁT ÚVOD',
  'Click a port (node) = set sail on the mission. A cleared mission (✔) unlocks the next. Cleared ones can be replayed (smaller reward). At port, buy a new hull or upgrade the one you have.':
    'Klikni na přístav (uzel) = vypluješ na misi. Splněná mise (✔) odemkne další. Splněné lze opakovat (menší odměna). V přístavu kup nový trup, nebo vylepši ten svůj.',
  '🔓 DEV: all missions unlocked (append ': '🔓 DEV: všechny mise odemčené (přidej ',
  ' to the URL to restore normal progression).': ' do URL pro návrat k normálnímu postupu).',

  // ---------- přístav ----------
  'PORT': 'PŘÍSTAV',
  'Spend doubloons on a <b>stronger hull</b> (shipyard), <b>upgrades</b> for the one you command, or <b>repairs</b> after a hard fight. Upgrades and damage both carry through the campaign.':
    'Utrácej dublony za <b>silnější trup</b> (loděnice), <b>vylepšení</b> lodi, které velíš, nebo <b>opravy</b> po těžkém boji. Vylepšení i poškození se nesou celou kampaní.',
  'Shipyard — flagship': 'Loděnice — vlajková loď',
  'Repair & careen': 'Oprava a careen',
  'Flagship outfitting': 'Výbava vlajkové lodi',
  'guns/side': 'děl/bok', 'range': 'dostřel', 'oars': 'vesla', 'yes': 'ano',
  '⚓ you command this ship': '⚓ této lodi velíš',
  'Command this ship': 'Převzít velení',
  'Buy — {p} 🪙': 'Koupit — {p} 🪙',
  '(in the shipyard)': '(v loděnici)',
  'Buy lvl {n} — {c} 🪙': 'Koupit úroveň {n} — {c} 🪙',
  '✔ MAX': '✔ MAX',
  '— condition': '— stav',
  'port guns': 'děla levoboku', 'stbd guns': 'děla pravoboku',
  'Battle damage carries between missions — patch her up before she sails again.':
    'Bojové poškození se nese mezi misemi — sprav ji, než zase vypluje.',
  'Repair to full — {c} 🪙': 'Opravit do plného stavu — {c} 🪙',
  '✔ fully repaired — she\'s ready for sea': '✔ plně opravená — připravená na moře',
  '← BACK TO MAP': '← ZPĚT NA MAPU',

  // ---------- briefing ----------
  'SET SAIL': 'VYPLOUT',
  'Controls: tap your own ship = select · tap a target = lock on · tap water = set course · <b>drag = pan</b> · <b>pinch = zoom</b> · <b>double-tap = centre</b> · the buttons around the edges handle sails, oars, fire and shot type.':
    'Ovládání: ťukni na svou loď = výběr · ťukni na cíl = zaměřit · ťukni na vodu = kurz · <b>tažení = posun</b> · <b>pinch = zoom</b> · <b>dvojklep = vycentrovat</b> · tlačítka po okrajích řeší plachty, vesla, palbu a typ náboje.',
  'Controls: click your own ship = select · click a target = lock on · click water = set course · <b>drag = pan the map</b> · wheel = zoom · <b>buttons at right (arrows/＋/－/◎) = pan, zoom and centre on ship</b> · space = pause · W sails · E oars · Q/R broadside · A auto · 1/2/3 shot type':
    'Ovládání: klik na svou loď = výběr · klik na cíl = zaměřit · klik na vodu = kurz · <b>tažení = posun mapy</b> · kolečko = zoom · <b>tlačítka vpravo (šipky/＋/－/◎) = posun, zoom a vycentrování</b> · mezerník = pauza · W plachty · E vesla · Q/R salva · A auto · 1/2/3 typ náboje',

  // ---------- výsledek ----------
  '⚓ VICTORY': '⚓ VÍTĚZSTVÍ', '☠ DEFEAT': '☠ PORÁŽKA',
  'Mission ended at {t}.': 'Mise skončila v čase {t}.',
  'Score:': 'Skóre:', 'Plunder:': 'Kořist:',
  '(dev — not saved)': '(dev — neukládá se)', '· treasury:': '· pokladna:',
  'Prizes (captured ships) earn more than sinking — at port, spend doubloons to upgrade your flagship.':
    'Kořist (zajaté lodě) vynáší víc než potápění — v přístavu utrať dublony za vylepšení vlajkové lodi.',
  'REPLAY': 'ZNOVU', '🛠 PORT': '🛠 PŘÍSTAV', 'CAMPAIGN MAP': 'KAMPAŇOVÁ MAPA',
  '⚔ NEW SKIRMISH': '⚔ NOVÁ BITVA',
  // odměny (profile.computeReward)
  'Victory': 'Vítězství',
  'Sunk ({n}×)': 'Potopené ({n}×)',
  'Prizes — captured ({n}×)': 'Kořist — zajaté ({n}×)',
  'Objectives met ({n}×)': 'Splněné cíle ({n}×)',
  'Replay (×0.4)': 'Opakování (×0.4)',
  // skóre (sim/score)
  'Objectives met ×{n}': 'Splněné cíle ×{n}',
  'Ships captured ×{n}': 'Zajaté lodě ×{n}',
  'Enemies sunk ×{n}': 'Potopení nepřátelé ×{n}',
  'Speed': 'Rychlost',
  'Own losses ×{n}': 'Vlastní ztráty ×{n}',

  // ---------- skirmish setup ----------
  'SKIRMISH': 'VOLNÁ BITVA',
  'A free battle on your terms — pick your ship, the enemy squadron, the weather and the ground, then fight. No campaign upgrades: a clean duel.':
    'Volná bitva podle tvých pravidel — vyber si loď, nepřátelskou eskadru, počasí a bojiště, a do toho. Bez kampaňových vylepšení: čistý souboj.',
  'Your ship': 'Tvoje loď', 'Enemy ship': 'Nepřátelská loď', 'Enemy squadron': 'Nepřátelská eskadra',
  'Weather': 'Počasí', 'Ground': 'Bojiště',
  '{n}/side · hull {h}': '{n}/bok · trup {h}',
  '⚔ BATTLE': '⚔ DO BOJE', '← Back to map': '← Zpět na mapu',

  // ---------- store (paywall — teď skrytý, přeloženo pro budoucnost) ----------
  'UNLOCK THE FULL GAME': 'ODEMKNI CELOU HRU',
  'Four missions in, the war for the Halcyon Archipelago is only beginning. One payment opens the rest of the campaign and the skirmish sandbox — forever.':
    'Po čtyřech misích válka o souostroví Halcyon teprve začíná. Jedna platba otevře zbytek kampaně i volnou bitvu — navždy.',
  '· one-time': '· jednorázově',
  'The full campaign — every mission beyond the first four': 'Celá kampaň — všechny mise za prvními čtyřmi',
  'All ★ side missions (bonus plunder)': 'Všechny ★ vedlejší mise (bonusová kořist)',
  'Skirmish — free-play custom battles': 'Volná bitva — souboje podle tvých pravidel',
  'One payment, yours forever — no subscription': 'Jedna platba, navždy tvoje — žádné předplatné',
  '🔓 Buy — {p}': '🔓 Koupit — {p}',
  'Restore purchase': 'Obnovit nákup',
  '🔓 Unlock full game — {p}': '🔓 Odemknout celou hru — {p}',
  // stavové hlášky nákupu a obnovy
  'Opening secure checkout…': 'Otevírám zabezpečenou pokladnu…',
  'Checkout is unavailable here (needs the deployed server). Locally, append ?own=1 to test.':
    'Pokladna tady není dostupná (vyžaduje nasazený server). Lokálně přidej ?own=1 pro testování.',
  'Enter the email you purchased with:': 'Zadej e-mail, se kterým jsi nakupoval:',
  'Looking up your purchase…': 'Hledám tvůj nákup…',
  'Purchase restored — the full game is unlocked!': 'Nákup obnoven — celá hra je odemčená!',
  'No purchase found for that email.': 'Pro tento e-mail nebyl nalezen žádný dokončený nákup.',
  'Restore is unavailable here (needs the deployed server).':
    'Obnovení tady není dostupné (vyžaduje nasazený server).',
  'UNLOCKING…': 'ODEMYKÁM…',
  'Confirming your purchase with the payment provider…': 'Ověřuji tvůj nákup u platební brány…',
  '⚓ THANK YOU': '⚓ DĚKUJEME',
  'The full game is unlocked — the whole archipelago is yours to take.':
    'Celá hra je odemčená — celé souostroví je tvoje.',
  'Payment not confirmed': 'Platba nepotvrzena',
  'We could not verify the purchase.': 'Nákup se nepodařilo ověřit.',
  'If you were charged, use “Restore purchase”.': 'Pokud ti byly strženy peníze, použij „Obnovit nákup".',
  'Back to map': 'Zpět na mapu',
  // popisky kontaktů na taktickém plátně
  'lost contact': 'ztracený kontakt',
  '(colours struck)': '(spustila vlajku)',

  // ---------- mobilní HUD ----------
  'sails': 'plachty', 'FIRE': 'PAL', 'auto': 'auto', 'hold': 'drž', 'surr': 'kapit.',
  'contact lost': 'kontakt ztracen', 'unidentified': 'neidentifikován',
  'Unknown contact': 'Neznámý kontakt',
  'No ship': 'Žádná loď', 'No target': 'Žádný cíl',
  'Hull': 'Trup', 'Rigging': 'Ráhnoví', 'Rudder': 'Kormidlo',
  'Guns (port)': 'Děla (levobok)', 'Guns (stbd)': 'Děla (pravobok)',
  'Crew': 'Posádka', 'Morale': 'Morálka', 'Ammo': 'Munice',
  'Sails': 'Plachty', 'Oars': 'Vesla', 'out': 'venku', 'shipped': 'zatažená',
  'Class': 'Třída', 'Range': 'Vzdálenost', 'Weather gage': 'Návětří',
  'Raking': 'Raking', 'yes — aligned': 'ano — v linii',
  'Boarding odds': 'Šance boardingu', 'surrendered': 'vzdala se', 'Status': 'Stav',
  'Contact lost — last known position only.': 'Kontakt ztracen — jen poslední známá poloha.',
  'Not yet identified.': 'Zatím neidentifikován.',
  'Close': 'Zavřít',
  'Quick guide': 'Rychlý průvodce',
  'Bars fill green→red as things break. Tap your bars or the target to see full numbers.':
    'Sloupce přecházejí ze zelené do červené, jak se věci lámou. Ťukni na své sloupce nebo na cíl a uvidíš přesná čísla.',
  'Rigging / sails': 'Ráhnoví / plachty', 'Guns': 'Děla',
  'Raking line': 'Linie rakingu', 'Fire the ready guns': 'Vypálit z nabitých děl', 'Board': 'Boarding',
  'Got it': 'Rozumím',
}
