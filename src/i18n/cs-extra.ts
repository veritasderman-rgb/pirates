/**
 * Ručně přeložený obsah, který vznikl až PO anglickém překladu hry (a nemá
 * tedy českou verzi v git historii): vedlejší mise, jejich příběh, bojové
 * výkřiky a opravené Corona lore. Klíč = přesné anglické znění (kontrolu
 * úplnosti hlídá tests/i18n.test.ts). Přepisuje případné kolize z cs-content.
 */
export const CS_EXTRA: Record<string, string> = {
  // ==================== oprava: Corona lore (v historii je obrácená verze) ====================
  ['Corona — the largest hull the Castillan yards ever put to water. Four gun '
  + 'decks, gilding from keel to masthead and a crew of half a thousand men. She '
  + 'is not merely a ship, she is the floating throne of Don Cristóbal de Vega '
  + 'and the last card in his game for Halcyon. No one beats her alongside; '
  + 'whoever means to sink her must take her apart piece by piece — and pray her '
  + 'decks give out before he runs out of ships.']:
    'Corona — největší trup, jaký kdy castillské loděnice spustily na vodu. Čtyři '
    + 'dělové paluby, zlacení od kýlu po vrchol stěžně a posádka pěti stovek mužů. '
    + 'Není to jen loď, je to plovoucí trůn dona Cristóbala de Vegy a poslední '
    + 'karta v jeho hře o Halcyon. Bok proti boku ji neporazí nikdo; kdo ji chce '
    + 'potopit, musí ji rozebrat kus po kusu — a modlit se, aby její paluby '
    + 'povolily dřív, než jemu dojdou lodě.',

  // ==================== bojové výkřiky (barks) ====================
  'The flagship has fallen! Take up the colours — lead us on, Captain!':
    'Vlajková loď padla! Převezměte vlajku — veďte nás, kapitáne!',
  'We will not strike our colours!':
    'Vlajku nespustíme!',
  'To board we must lay alongside — close to sixty metres!':
    'Na boarding musíme přiléhnout bok k boku — na šedesát metrů!',
  'Grapples away! Boarders, with me!':
    'Háky vpřed! Výsadek, za mnou!',
  'Boarding party thrown back! Soften her with fire first!':
    'Výsadek odražen! Nejdřív ji změkčete palbou!',
  'Raking broadside! We tore her stem to stern!':
    'Podélná salva! Rozpárali jsme ji od přídě k zádi!',
  'They are raking us end to end! Turn your bow out of the line!':
    'Rakují nás podélně! Uhněte přídí z linie!',
  'Her rudder is shot away — she cannot steer!':
    'Kormidlo má ustřelené — nemůže zatáčet!',
  'Her rigging is in tatters — she is losing speed!':
    'Ráhnoví má v cárech — ztrácí rychlost!',
  'Her port guns are silenced!':
    'Děla levoboku umlčena!',
  'Her starboard guns are silenced!':
    'Děla pravoboku umlčena!',
  'Her crew is decimated — board her now!':
    'Posádka zdecimována — teď boarding!',

  // ==================== side01 — Pašerácká trasa ====================
  'Smuggler\'s Run': 'Pašerácká trasa',
  ['A SIDE COMMISSION, off the campaign\'s main track. Revenue swears a pack of '
  + 'smugglers is running contraband through the Tin Cays under merchant colours — '
  + 'brandy, powder and worse, bound for the free ports.\n\n'
  + 'HMS Swallow lies across their run. Three trim little sloops sail ahead of you '
  + 'wearing an honest face; close on them and their disguise will not hold. Sink '
  + 'them if you must — but a smuggler taken with her hold full is a fat prize and '
  + 'a purse for the crew, so slow them with chain shot and force them to strike '
  + 'their colours. Mind the Cays and the Sieve reef: the sloops draw next to '
  + 'nothing and slip over the shoals, but the Swallow does not.']:
    'VEDLEJŠÍ ZAKÁZKA, stranou hlavní linie kampaně. Celní úřad přísahá, že přes '
    + 'Cínové ostrůvky proudí pod kupeckou vlajkou kontraband — brandy, střelný '
    + 'prach a horší věci, vše do svobodných přístavů.\n\n'
    + 'HMS Vlaštovka jim leží napříč trasou. Před tebou plují tři úhledné šalupy '
    + 's poctivou tváří; přibliž se, a jejich maska nevydrží. Potop je, když musíš '
    + '— ale pašerák zajatý s plným podpalubím je tučná kořist a prémie pro '
    + 'posádku, tak je zpomal řetězovými a přinuť je spustit vlajku. Pozor na '
    + 'ostrůvky a útes Cedník: šalupy neponoří skoro nic a přes mělčiny '
    + 'proklouznou, Vlaštovka ne.',
  'Coral Cay': 'Korálový ostrůvek',
  ['Coral Cay — a hummock of white sand and scrub. Smugglers water here and '
  + 'wait out the tide; a lookout on its ridge can see a sail an hour off.']:
    'Korálový ostrůvek — hrbolek bílého písku a křovin. Pašeráci tu nabírají vodu '
    + 'a čekají na příliv; hlídka na hřebeni vidí plachtu hodinu plavby daleko.',
  'Smuggler\'s Cay': 'Pašerácký ostrůvek',
  ['Smuggler\'s Cay — a low island honeycombed with caves at the waterline, '
  + 'where more than one cargo has been landed under a moonless sky.']:
    'Pašerácký ostrůvek — nízký ostrov provrtaný jeskyněmi u čáry ponoru, kde už '
    + 'nejeden náklad přistál pod bezměsíčnou oblohou.',
  'The Sieve': 'Cedník',
  ['The Sieve — a shelf of coral a fathom under the surface. Sloops sail '
  + 'clean over it; anything with a keel leaves its bottom strewn across the reef.']:
    'Cedník — korálová deska sáh pod hladinou. Šalupy přes ni čistě přeplují; '
    + 'cokoli s kýlem tu nechá dno rozseté po útesu.',
  'Nightjar': 'Lelek',
  'Marigold': 'Měsíček',
  'Two Brothers': 'Dva bratři',
  ['A neat little sloop under merchant colours, sitting suspiciously low in '
  + 'the water for a trader in ballast.']:
    'Úhledná šalupka pod kupeckou vlajkou — na obchodníka plujícího v zátěži sedí '
    + 've vodě podezřele hluboko.',
  ['A well-found sloop flying an honest flag — though her scuppers smell of '
  + 'brandy and her gunports have seen recent use.']:
    'Dobře vystrojená šalupa pod poctivou vlajkou — jenže z odtoků jí táhne brandy '
    + 'a střílny nesou stopy nedávné práce.',
  ['The last of the three — she keeps close to the Cays, ready to slip into '
  + 'the shoals where no man-of-war dares follow.']:
    'Poslední z trojice — drží se při ostrůvcích, připravená vklouznout do mělčin, '
    + 'kam se za ní žádná válečná loď neodváží.',
  ['A genuine trader on a lawful run, papers in order — the honest face the '
  + 'smugglers hide behind.']:
    'Skutečný obchodník na řádné trase, papíry v pořádku — ta poctivá tvář, za '
    + 'kterou se pašeráci schovávají.',
  ['A coasting fishing smack riding at anchor off the Cays, her crew mending '
  + 'nets and minding their own business.']:
    'Pobřežní rybářská bárka na kotvě u ostrůvků — posádka spravuje sítě a hledí '
    + 'si svého.',
  'Take or sink all three smuggler sloops': 'Zajmi, nebo potop všechny tři pašerácké šalupy',
  'For a prize: force a smuggler to strike her colours': 'Pro kořist: přinuť pašeráka spustit vlajku',
  ['Revenue Office: "Three of them, Swallow, all in trader\'s clothing. '
  + 'Close the range and their manifests will not bear looking at. Bring them '
  + 'in with their holds full if you can — the crew will thank you for it."']:
    'Celní úřad: „Jsou tři, Vlaštovko, všichni v kupeckém převleku. Zkraťte '
    + 'vzdálenost a jejich manifesty neobstojí. Přiveďte je s plným podpalubím, '
    + 'půjde-li to — posádka vám poděkuje."',
  ['They draw a fathom and a half at most and will run for the Sieve and '
  + 'the shoals the instant they smell us. Cut the corner, get to windward, '
  + 'and mind we don\'t pile the Swallow onto that reef ourselves.']:
    'Neponoří víc než půldruhého sáhu a poběží k Cedníku a do mělčin, jakmile nás '
    + 'ucítí. Řízni zatáčku, dostaň se do návětří — a hlavně ať Vlaštovku na ten '
    + 'útes nenavezeme sami.',
  'The sloops throw off their merchant colours and scatter — smugglers, and armed!':
    'Šalupy odhazují kupecké vlajky a rozprchávají se — pašeráci, a ozbrojení!',
  ['Contrabandista: "Colours down, lads — it\'s a king\'s dog! Zorra, '
  + 'Nightjar, into the shoals! I\'ll hold the deep water and buy you the run!"']:
    'Contrabandista: „Vlajky dolů, chlapci — královský pes! Zorro, Lelku, do '
    + 'mělčin! Já podržím hlubokou vodu a získám vám náskok!"',
  ['Chain shot to bring down their spars, captain, then round to finish or '
  + 'grape to clear a deck for boarding. A struck sloop with her hold full is '
  + 'worth three sent to the bottom.']:
    'Řetězové na ráhna, kapitáne, pak plné koule na dorážku — nebo kartáče vyčistit '
    + 'palubu před boardingem. Šalupa se spuštěnou vlajkou a plným podpalubím má '
    + 'cenu tří poslaných ke dnu.',
  'The run is broken — every smuggler taken or sunk, and the Tin Cays quiet again.':
    'Trasa je zlomená — všichni pašeráci zajati nebo potopeni a nad Cínovými '
    + 'ostrůvky je zase klid.',
  'HMS Swallow has gone down, and the smugglers with their cargo slip away into the Cays.':
    'HMS Vlaštovka se potopila a pašeráci i s nákladem mizí mezi ostrůvky.',

  // ---------- side01 příběh ----------
  ['The Tin Cays, a bright forenoon and a steady wind. No fleet action here, no '
  + 'Castillan seal — only the Revenue Office, a tip-off, and three trim sloops '
  + 'wearing an honest face that will not survive a second look. HMS Swallow lies '
  + 'across their run; the rest is chase and gunnery.']:
    'Cínové ostrůvky, jasné dopoledne a stálý vítr. Žádná bitva flotil, žádná '
    + 'castillská pečeť — jen celní úřad, tip od udavače a tři úhledné šalupy '
    + 's poctivou tváří, která nepřežije druhý pohled. HMS Vlaštovka jim leží '
    + 'napříč trasou; zbytek je honička a dělostřelba.',
  ['The smugglers\' run is broken. Whatever came out of their holds — brandy and '
  + 'powder, and manifests that named no honest port — will not reach the free '
  + 'ports now. It was no part of the war against de Vega, but the crew have their '
  + 'prize money and the Cays are quiet, and a captain takes his easy days where '
  + 'the sea offers them.']:
    'Pašerácká trasa je zlomená. Co vydala jejich podpalubí — brandy, prach a '
    + 'manifesty bez jediného poctivého přístavu — do svobodných přístavů už '
    + 'nedopluje. S válkou proti de Vegovi to nemělo nic společného, ale posádka má '
    + 'své prémie, nad ostrůvky je klid — a kapitán bere lehké dny tam, kde mu je '
    + 'moře nabídne.',
  ['The sloops scattered into the shoals where the Swallow could not follow, and '
  + 'took their cargo with them. The Revenue Office logs it as "contact lost". A '
  + 'small failure, in the scale of the war — but the free ports will drink to it.']:
    'Šalupy se rozprchly do mělčin, kam za nimi Vlaštovka nemohla, a náklad vzaly '
    + 's sebou. Celní úřad to zapíše jako „kontakt ztracen". V měřítku války malé '
    + 'selhání — ale ve svobodných přístavech na ně budou pít.',

  // ==================== side02 — Útes vraků ====================
  'The Wreckers\' Reef': 'Útes vraků',
  ['A SIDE COMMISSION, away from the campaign\'s main track. For a season now ships '
  + 'have been lost on Widow\'s Comb with never a storm to blame. The truth is worse '
  + 'than weather: wreckers on Beacon Rock burn a false light to draw honest captains '
  + 'onto the reefs, then row out to plunder the wrecks and cut down any who reach '
  + 'the shore.\n\n'
  + 'HMS Goshawk is sent to end it. A corsair galley and a pirate brig lurk in the '
  + 'shoals — sink them or force them to strike. The galley rows where the wind fails '
  + 'and draws too little to fear the reefs; the brig will bleed you into the shallows '
  + 'and rake you when you touch. The Goshawk draws three fathoms and more: hold the '
  + 'deep channels, read the reefs, and do NOT run her aground.']:
    'VEDLEJŠÍ ZAKÁZKA, stranou hlavní linie kampaně. Už celou sezónu se na Vdovině '
    + 'hřebeni ztrácejí lodě, a bouři z toho vinit nelze. Pravda je horší než '
    + 'počasí: vraci na Majákové skále pálí falešné světlo, lákají poctivé kapitány '
    + 'na útesy — a pak vyplouvají obrat vraky a pobít každého, kdo dosáhne břehu.\n\n'
    + 'HMS Krahujec pluje s tím skoncovat. V mělčinách číhá korzárský koráb a '
    + 'pirátská briga — potop je, nebo je přinuť spustit vlajku. Koráb vesluje tam, '
    + 'kde vítr selže, a ponoří tak málo, že se útesů bát nemusí; briga tě bude '
    + 'vykrvácet do mělčin a rakovat, jakmile škrtneš o dno. Krahujec ponoří tři '
    + 'sáhy i víc: drž se hlubokých kanálů, čti útesy a NENAJEĎ s ním na mělčinu.',
  'Beacon Rock': 'Majáková skála',
  ['Beacon Rock — a black fang of stone crowned by an old watch-fire. Tonight '
  + 'that fire burns for the wrong reasons, and the wreckers tend it well.']:
    'Majáková skála — černý kamenný tesák s korunou starého strážního ohně. Dnes '
    + 'v noci ten oheň hoří ze špatných důvodů a vraci ho pečlivě přikládají.',
  'Widow\'s Comb': 'Vdovin hřeben',
  ['Widow\'s Comb — the long tooth of reef that has claimed a season of ships. '
  + 'Three fathoms of water over it: a brig may chance it, a frigate never.']:
    'Vdovin hřeben — dlouhý zub útesu, který si vybral celou sezónu lodí. Tři sáhy '
    + 'vody nad ním: briga to může zkusit, fregata nikdy.',
  'The Grinder': 'Drtič',
  ['The Grinder — a shallow ledge that grinds the bottom out of anything that '
  + 'draws more than a fathom. The galley crosses it at will.']:
    'Drtič — mělká římsa, která vydrtí dno z čehokoli, co ponoří víc než sáh. '
    + 'Koráb ji křižuje, jak se mu zlíbí.',
  'Lantern Shoal': 'Lucernová mělčina',
  ['Lantern Shoal — the coral shelf beneath the false light, where the '
  + 'wreckers gather what the sea leaves them.']:
    'Lucernová mělčina — korálová deska pod falešným světlem, kde vraci sbírají, '
    + 'co jim moře nechá.',
  'The Teeth': 'Zuby',
  ['The Teeth — a scatter of coral heads to the south, unmarked on any '
  + 'honest chart.']:
    'Zuby — roztroušené korálové hlavy na jihu, nezanesené na žádné poctivé mapě.',
  ['El Segador — "the Reaper". A corsair galley that lies in the shoals on '
  + 'her oars, waiting for a hull to strike the reef before she darts out.']:
    'El Segador — „Žnec". Korzárský koráb, který leží v mělčinách na veslech a '
    + 'čeká, až nějaký trup škrtne o útes — pak vyrazí.',
  ['Falsa Luz — "the False Light". The wreckers\' brig, re-gunned and heavy '
  + 'with plundered cargo, keeper of the lying beacon on the Rock.']:
    'Falsa Luz — „Falešné světlo". Briga vraků, převyzbrojená a těžká uloupeným '
    + 'nákladem, strážkyně prolhaného majáku na Skále.',
  ['The merchantman Santa Rosa — last night\'s prey, hard on Widow\'s Comb '
  + 'with a broken back. Her people are ashore or drowned; you are too late for her.']:
    'Kupec Santa Rosa — včerejší kořist, naražená na Vdovině hřebeni se zlomenou '
    + 'páteří. Její lidé jsou na břehu, nebo utonuli; pro ni už jedeš pozdě.',
  'Sink or capture both wrecker vessels': 'Potop, nebo zajmi obě lodě vraků',
  'Keep the Goshawk off the reefs': 'Udrž Krahujce mimo útesy',
  ['There\'s the false light on the Rock, and there\'s the Santa Rosa on the '
  + 'Comb — poor devils. The channels run deep between the reefs; keep to them '
  + 'and we\'ll have the wreckers where they thought they were safe.']:
    'Tamhle je falešné světlo na Skále — a tamhle Santa Rosa na Hřebeni, chudáci. '
    + 'Kanály mezi útesy jsou hluboké; drž se jich a dostaneme vraky přesně tam, '
    + 'kde si mysleli, že jsou v bezpečí.',
  'The wreckers rouse — the galley runs out her oars and the brig makes sail!':
    'Vraci se probouzejí — koráb vysouvá vesla a briga napíná plachty!',
  ['From the brig: "A king\'s frigate, is it? Then come and get us, captain '
  + '— come across the Comb. The reef takes deep keels; we\'ll take what\'s left."']:
    'Z brigy: „Královská fregata, jo? Tak si pro nás pojď, kapitáne — pojď přes '
    + 'Hřeben. Útes si bere hluboké kýly; my si vezmeme, co zbude."',
  ['The galley\'s trying to draw us over the Grinder, captain — she draws '
  + 'nothing and skips clean across. Don\'t follow her onto the coral. Make her '
  + 'come to the deep water, or work the channels and rake her as she turns.']:
    'Koráb se nás snaží přetáhnout přes Drtič, kapitáne — neponoří nic a přeskočí '
    + 'ho čistě. Nechoď za ním na korál. Donutíme ho do hluboké vody, nebo pracuj '
    + 'v kanálech a rakuj ho v obratu.',
  ['The brig\'s hull is soft and her gunnery worse than ours — hull her with '
  + 'round shot. The galley\'s all oars and men: grape will thin them before '
  + 'they can think of boarding.']:
    'Briga má měkký trup a střílí hůř než my — plnými koulemi do trupu. Koráb jsou '
    + 'samá vesla a mužstvo: kartáče je proředí dřív, než pomyslí na boarding.',
  ['From the brig: "Enough — I strike! Put out the fire on the Rock, damn '
  + 'you, before it draws another soul onto the Comb."']:
    'Z brigy: „Dost — spouštím vlajku! Uhaste ten oheň na Skále, k čertu, než na '
    + 'Hřeben přiláká další duši."',
  'Both wreckers dealt with and the false light doused — Widow\'s Comb will keep an honest reckoning now.':
    'Obě lodě vraků vyřízeny a falešné světlo uhašeno — Vdovin hřeben teď povede '
    + 'poctivé účty.',
  ['We\'re on the reef, captain! Back the sails and warp her off before the '
  + 'wreckers close — this is exactly how they meant to have us!']:
    'Jsme na útesu, kapitáne! Zpětný vítr do plachet a stáhnout ji, než se vraci '
    + 'přiblíží — přesně takhle nás chtěli dostat!',
  'HMS Goshawk breaks up on Widow\'s Comb — the wreckers have their finest prize yet.':
    'HMS Krahujec se láme na Vdovině hřebeni — vraci mají svou nejtučnější kořist.',

  // ---------- side02 příběh ----------
  ['Widow\'s Comb, in the last of the light. This is no campaign against a crown, '
  + 'but a reckoning owed to every captain lost on these reefs to a lantern that '
  + 'lied. The false light burns on Beacon Rock; the Santa Rosa lies broken on the '
  + 'coral; and somewhere in the shoals the wreckers wait. HMS Goshawk draws deep '
  + '— sail carefully, and settle the account.']:
    'Vdovin hřeben v posledním světle dne. Tohle není tažení proti koruně, ale '
    + 'zúčtování dlužné každému kapitánovi, kterého na těchhle útesech zahubila '
    + 'lucerna, co lhala. Falešné světlo hoří na Majákové skále; Santa Rosa leží '
    + 'zlomená na korálu; a kdesi v mělčinách čekají vraci. Krahujec ponoří hodně '
    + '— pluj opatrně a vyrovnej účet.',
  ['The false light is out and the wreckers are finished — sunk or struck and bound '
  + 'for a rope ashore. No silver in it, no seal, no thread of the great net: only '
  + 'a stretch of reef that honest men may cross again without a lie to drown them. '
  + 'Some victories are worth more than the war remembers.']:
    'Falešné světlo zhaslo a s vraky je konec — potopení, nebo se spuštěnou vlajkou '
    + 'a s vyhlídkou na provaz na břehu. Žádné stříbro, žádná pečeť, žádná nit velké '
    + 'sítě: jen kus útesu, který poctiví lidé zase přeplují bez lži, jež by je '
    + 'utopila. Některá vítězství mají větší cenu, než si válka zapamatuje.',
  ['The Goshawk found the coral the wreckers meant her to find, and Widow\'s Comb '
  + 'took a frigate for its tally. The false light still burns on Beacon Rock, and '
  + 'the next ship down the channel will trust it just as the Santa Rosa did.']:
    'Krahujec našel korál přesně tam, kde ho vraci chtěli mít, a Vdovin hřeben si '
    + 'do svých účtů připsal fregatu. Falešné světlo na Majákové skále hoří dál — '
    + 'a příští loď v kanálu mu uvěří stejně jako Santa Rosa.',

  // ==================== skirmish (statické texty scénáře) ====================
  'Skirmish': 'Volná bitva',
  'Sink or capture the enemy squadron': 'Potop, nebo zajmi nepřátelskou eskadru',
  'Keep your flagship afloat': 'Udrž vlajkovou loď na hladině',
  'The enemy squadron is beaten — the sea is yours.': 'Nepřátelská eskadra je poražena — moře je tvoje.',
  'Your flagship has gone to the bottom.': 'Tvá vlajková loď klesla ke dnu.',
  'Gull Rock': 'Racčí skála',
  'A wind-scoured rock — its lee robs the wind, its shoals rob the keel.':
    'Větrem ošlehaná skála — její závětří bere vítr a její mělčiny berou kýl.',
  'Low Cay': 'Nízký ostrůvek',
  'A low sandy cay off the fighting ground.': 'Nízký písečný ostrůvek na kraji bojiště.',
  'Reefs just below the surface — sloops sail over, deep hulls leave their bottom here.':
    'Útesy těsně pod hladinou — šalupy přeplují, hluboké trupy tu nechají dno.',
  'Calm': 'Bezvětří',
  'Fresh breeze': 'Čerstvý vítr',
  'Storm': 'Bouře',
  'Open sea': 'Otevřené moře',
  'Islands': 'Ostrovy',
  'Reef': 'Útes',
}
