# Pirates — svět, příběh a mechanika

> Kanonický zdroj příběhu a světa hry *Pirates*. Odsud čerpají mise
> (`src/data/missions/*`), texty kampaně (`src/data/story.ts`) i popisy tříd
> lodí (`src/data/defs.ts`). Herní mechanika je tu popsaná tak, jak ji hráč
> zažívá; technický rozbor a čísla viz [`GAME_DESIGN.md`](GAME_DESIGN.md).

---

## Obsah

1. [Svět: Souostroví Halcyon](#1-svět-souostroví-halcyon)
2. [Historie](#2-historie)
3. [Mocnosti](#3-mocnosti)
4. [Hlavní zápletka kampaně](#4-hlavní-zápletka-kampaně)
5. [Postavy](#5-postavy)
6. [Typy lodí](#6-typy-lodí)
7. [Herní mechanika](#7-herní-mechanika)
8. [Mise kampaně](#8-mise-kampaně)

---

## 1. Svět: Souostroví Halcyon

**Halcyon** je vnitřní moře poseté stovkou ostrovů — od korálových hřbetů,
které se sotva zvedají nad hladinu, po zalesněné hory se sladkovodními
prameny a hlubokými zátokami. Neexistuje tu jediná pevnina; existuje jen
moře, průlivy a úžiny mezi ostrovy, a kdo ovládá úžiny, ovládá obchod.

Halcyon je křižovatka. Na západě leží bohatá **Koruna Albionu**, na jihu
hrdé **Castillské království**, a mezi nimi — ve stínu každé úžiny a v závětří
každého ostrova — **volní piráti**. Tři síly, jedno moře, které nikomu
nepatří, a jeden zdroj bohatství, o který se hraje: **náklad, který musí
proplout**.

### Vítr a moře

Halcyonu vládne **vítr**. Přes moře táhne převládající proudění, které se
během dne pomalu stáčí a v poryvech sílí a slábne. Za každým ostrovem leží
**závětří** — pás mrtvého, vířivého vzduchu, kde plachty ztrácejí tah. Kapitán
Halcyonu čte vítr jako mapu: kde ho chytit do plachet, kde ho ztratí, a kde
se schovat do závětří před nepřátelskou palbou za cenu ztráty rychlosti.

Ostrovy nejsou jen kulisy. **Mělčiny a útesy** lámou kýly těžkých lodí, ale
lehké čluny přes ně proklouznou — kdo zná dno, zná zkratky, které pronásledovateli
uzavřou cestu. Vysoké ostrovy **kryjí výhled**: flotila skrytá za horou zmizí
z dohledu a vynoří se z přepadu tam, kde ji nikdo nečeká.

### Obchodní tepny

Bohatství Halcyonu proudí po úzkých koridorech mezi ostrovy. Kdo tudy veze
náklad, platí — buď mýto koruně, nebo výkupné pirátům, nebo obojí. Dvě tepny
jsou nad ostatní:

- **Západní úžiny** — koridory k albionským přístavům, kde se vybírá mýto,
  z něhož žije albionské námořnictvo.
- **Stříbrná trasa** — cesta castillských **pokladních galeon**, které dvakrát
  ročně vezou stříbro z jižních kolonií do metropole. Pokladní flotila je
  tepnou i slabinou Castilly zároveň.

---

## 2. Historie

**Před dvěma sty lety** dorazily do Halcyonu první koruny — obě přesvědčené,
že prázdné moře patří tomu, kdo první vztyčí vlajku. Albion se usadil na
západě u nejlepších přístavů, Castilla na jihu blíž ke kolonijnímu stříbru.
Mezi nimi zůstala rozlehlá **Mělčina** — labyrint ostrovů, který nikdo
nedokázal spravovat, a tak se z něj stalo útočiště pro ty, kdo neuznávali
žádnou vlajku.

**Válka o úžiny** před osmdesáti lety měla rozhodnout, kdo Halcyonu vládne.
Nerozhodla. Obě koruny se vykrvácely na řadových bitvách v úžinách, kde se
těžké lodě nemohly otočit, a nakonec podepsaly **Mír u Tří majáků**: hranice
uprostřed moře, volný průjezd pro obchod, a mlčenlivá shoda, že Mělčina se
ponechá pirátům — levnější než ji dobývat.

Z toho míru vyrostla dnešní **studená rovnováha**. Albion zbohatl na mýtu
z úžin a postavil malé, ale nejlépe vycvičené námořnictvo v Halcyonu. Castilla
zůstala u tonáže a stříbra — víc lodí, víc děl, horší výcvik. A piráti Mělčiny
zjistili, že se vyplácí sloužit tomu, kdo zaplatí: **kaperské listy**, které
žádná koruna oficiálně nevydává a všechny tajně používají.

Rovnováha teď praská. **Castillské stříbrné doly stárnou**, pokladní flotily
řídnou a mýto z albionských úžin by castillskou pokladnu sanovalo na generaci.
Castilla válku nechce vést otevřeně — prohrála by ji jako posledně. Chce ji
vyhrát **v zastoupení**: rukama pirátů, které platí, aby uškrtili albionský
obchod dřív, než kdokoli pochopí, že za nájezdy nestojí chamtivost, ale plán.

---

## 3. Mocnosti

### Koruna Albionu (západ — hráč)

Obchodní, opatrná a bohatá. Albion žije z **mýta** vybíraného v západních
úžinách: kdo veze náklad mezi koloniemi a jádrem, platí koruně, a z mýta se
platí **Královské námořnictvo** — malé, ale technologicky a výcvikem nejlepší
široko daleko. Albionská děla míří přesněji než kohokoli jiného; albionské
lodě jsou rychlejší a obratnější, protože kvalita nahrazuje počet.

Albion válku nechce — válka je špatná pro obchod. Právě proto se jí, jako
posledně, nakonec nevyhne. Vládne mu **Admiralita** a kupecké gildy, jejichž
zájmy se ne vždy shodují: gildy chtějí levné mýto a bezpečné úžiny, admiralita
chce rozpočet a volnou ruku. Kapitán ve službě koruny se pohybuje mezi obojím.

**Doktrína:** kvalita nad kvantitou. Méně lodí, lepší výcvik děl, rychlejší
trupy. Vyhrávat manévrem, informacemi a přesností — ne se stavět bok po boku
proti přesile.

### Castillské království (jih — soupeř)

Hrdé, pomalé a napřené ke stříbru. Castilla stojí na **pokladních flotilách**:
konvojích stříbra, které dvakrát ročně táhnou z jižních kolonií do metropole
a platí všechno — dvůr, flotilu, mlčení. Jenže doly stárnou, flotily řídnou
a piráti je škubou. Castillská koruna sází na **tonáž a počet**: víc trupů,
širší salvy, víc děl na bok — a snáší, že výcvik zaostává o generaci.

Castilla nezapomněla na porážku ve Válce o úžiny. Otevřenou válku si nemůže
dovolit, a tak zvolila tišší cestu: **rozvrátit albionský obchod v zastoupení**,
platit pirátům Mělčiny za nájezdy na albionské konvoje, a vyprovokovat incident,
který z Albionu udělá v očích neutrálů agresora. Zapečetěné rozkazy s
castillskou pečetí, které se objevují na palubách „pirátských" lodí, jsou
první nití té sítě.

**Doktrína:** tonáž nadevše. Stát, sypat boční salvy a čekat, až protivníkovi
dojdou koule dřív než tobě trup.

### Volní piráti Halcyonu (Mělčina)

Mezi korunami, ve stínu každé úžiny, žije **Bratrstvo Mělčiny** — volná
konfederace pirátských kapitánů, kteří neuznávají žádnou vlajku a berou
všechno, co plave. Létají na **kořistních šalupách** a **látaných brigách**:
lodích z černého trhu a vraků, s děly nepřesnými, ale s posádkami početnými
a hladovými po kořisti. Pirát nerad potápí to, co se dá **obsadit a prodat** —
zajmutá loď je cennější než potopená.

Piráti loví ve smečkách: jedna loď váže eskortu, ostatní trhají konvoj. Jejich
domovem jsou úžiny a mělčiny, kde se velké lodě špatně otáčejí a kde znalost dna
znamená přežití. A protože pirát slouží tomu, kdo zaplatí, dá se **koupit** —
což je přesně to, na co Castilla vsadila.

### Neutrálové

- **Kupci** — plovoucí páteř Halcyonu. Naložení zbožím, prázdní na děla,
  spoléhají na eskortu a modlitbu. Přesně to, po čem piráti jdou.
- **Přístavy a pobřežní pevnosti** — kamenné baterie hlídají vjezdy do zátok.
  Nikam se nehnou, zato jejich žhavé koule dolétnou dál než lodní děla a
  zdi spolknou salvu za salvou. Dobýt přístav znamená nejdřív umlčet pevnost —
  nebo proklouznout mimo její dostřel.

---

## 4. Hlavní zápletka kampaně

Kampaň sleduje službu jednoho kapitána Královského námořnictva Albionu — od
celní hlídky v úžinách po lov na pirátské kapitány i castillské pokladní
flotily — a cestu Halcyonu od studeného míru k otevřené válce.

**Zápletka je zpravodajská.** Nájezdy na albionské konvoje zprvu vypadají jako
obyčejná pirátská chamtivost. Postupně ale vyplouvá vzorec: „kupci", kteří pod
plátnem vezou vojenský takeláž a zapečetěné rozkazy; pirátské brigy se stejnými
rozkazy v podpalubí; a jedna společná pečeť — **castillská**. Někdo platí
pirátům Mělčiny, aby uškrtili albionský obchod, a ten někdo mluví castillsky.

Kapitánovy mise nejsou epizody: každá posouvá válku, často aniž to v tu chvíli
tuší. Celní kontrola odhalí první nit; obrana konvoje ji potvrdí; a co začíná
jako hlídka, končí odhalením castillského plánu ve třech fázích — **rozvrátit
Mělčinu piráty v zastoupení, vyprovokovat incident, a nakonec udeřit na
albionské úžiny stříbrem placenou flotilou**.

Kapitánův oblouk je oblouk odpovědnosti: od člověka, který plní rozkazy, k
tomu, kdo pochopí, oč se hraje — a rozhodne, jestli válku, která se blíží,
rozpoutá, nebo jí předejde.

---

## 5. Postavy

Jména v závorkách jsou klíče mluvčích (`Speaker` v `src/sim/types.ts`) a
zároveň názvy souborů portrétů (`public/img/<klíč>.png`, viz
[`ART_PROMPTS.md`](ART_PROMPTS.md)).

**Albion (spojenci):**
- **Kapitán (hráč)** *(`captain`)* — důstojník Královského námořnictva Albionu.
  Kampaň ho vede od velení šalupě po útočnou eskadru. Jeho rozhodnutí u děl
  i u vyjednávání (potopit, nebo přinutit ke kapitulaci a obsadit) tvarují,
  jaký kapitán z něj vzejde.
- **Admirál Edmund Thorne** *(`admiral`)* — Admiralita Albionu. Starý mořský
  vlk s jizvou a s rozpočtem, který nikdy nestačí. Zadává mise, soudí je a ne
  vždy říká vše, co ví.
- **Přístavní kapitánka Odette Vaneová** *(`port`)* — správa úžin a kapitanát.
  Hlásí podezřelé kontakty a vybírá mýto; první, kdo si všimne, že něco nesedí.
- **I. důstojník Rusk** *(`mate`)* — kapitánova pravá ruka na palubě, hlas
  taktiky a chladné rozvahy uprostřed boje.
- **Dělmistr Hargrove** *(`gunner`)* — veterán u děl, hlas palby a střeliva.
- **Hlídka Pip** *(`lookout`)* — nejmladší z posádky, oči na stěžni.
- **Lodní mistr Tarr** *(`bosun`)* — drží loď pohromadě, velí opravám a výsadku.

**Protivníci:**
- **Silas Rourke „Černý příboj"** *(`pirate-captain`)* — pirátský kapitán
  Mělčiny, velitel smečky. Zprvu obyčejný lupič; jeho zapečetěné rozkazy
  prozradí, že slouží castillskému stříbru.
- **Don Cristóbal de Vega** *(`agent`)* — castillský agent, ruka, která platí
  piráty a splétá síť napříč Halcyonem. Tvář, kterou hráč dlouho nevidí — a
  skutečný protivník kampaně.
- **Almirante Ramón Herrera** *(`castilian-admiral`)* — velitel castillské
  pokladní eskadry. Hrdý, přesvědčený o převaze tonáže — protivník finále
  u Tří majáků.

---

## 6. Typy lodí

Třídy jsou definované v `src/data/defs.ts`. Pohon určuje plocha plachet
(`sailArea`), schopnost veslovat (`canRow`/`oarThrust`), vodní odpor
(`hullDrag`, doběhová rychlost) a obratnost (`turnRate`). Ponor (`draft`)
rozhoduje, které mělčiny loď přeplují. **Asymetrie stran** je ve výcviku děl
(`gunnery`): Albion míří nejlíp, Castilla o něco hůř, piráti nejhůř.

### Koruna Albionu (hráč)

- **Šalupa (Albion) — `sloop-albion`.** Jednostěžňová, nejmrštnější trup
  námořnictva. Uveze pár děl, projede mělčinu, kam se fregata neodváží, a do
  bezvětří nasadí vesla. Kurýr, zvěd a lovec pašeráků; v přímém boji s křižníkem
  nemá co pohledávat.
- **Briga (Albion) — `brig-albion`.** Dvoustěžňová páteř hlídkové služby.
  Vyvážená plachetní plocha, slušná boční salva, dost posádky na výsadek.
  Nevesluje — v bezvětří stojí; jinak spolehlivá pracantka.
- **Fregata (Albion) — `frigate-albion`.** Rychlá válečná loď pro samostatné
  operace. Třináct děl na bok, nejlepší výcvik ve flotile a dohled z vysokých
  stěžňů. Loví nájezdníky a chrání obchod; proti řadové lodi ale nepostojí —
  pancíř má tenčí o třídu.

### Castillské království (soupeř)

- **Fregata (Castilla) — `frigate-castilla`.** O vlas těžší než albionská,
  o čtrnácté dělo na bok silnější, ale s posádkou o generaci hůř vycvičenou.
  Sází na širší salvu a tonáž tam, kde jí chybí přesnost.
- **Pokladní galeona — `galleon-castilla`.** Plovoucí truhla koruny: vysoké
  boky, podpalubí plné stříbra a jen tolik děl, aby odradila drzost. Pomalá,
  těžko se otáčí — a její kapitán ví, že je kořistí snů každého piráta v Halcyonu.
- **Řadová loď (Castilla) — `liner-castilla`.** Pohyblivá pevnost o třech
  palubách děl. Třicet hlavní na bok promění linii v ohnivou zeď. Daní je
  manévr: obrátit ji trvá věčnost a do mělčin se neodváží. Kdo se jí postaví
  bok po boku, prohrál; kdo ji obtančí a rakuje do zádi, má šanci.

### Volní piráti

- **Kořistní šalupa — `sloop-pirate`.** Rychlá, laciná, postradatelná. Loví
  ve smečkách, přecpaná posádkou dychtivou po výsadku, s děly z černého trhu
  a bez kázně u palby.
- **Pirátská briga — `brig-pirate`.** Vlajková loď pirátského kapitána —
  kořistní, látaná, přezbrojená. Palba nepřesná, zato posádka početná a hladová:
  piráti neradi potápějí to, co se dá obsadit a prodat.
- **Korzárská galéra — `galley-corsair`.** Veslový dravec pobřežních vod. Když
  ostatní v bezvětří stojí jak přibití, galéra vesluje přímo proti větru a doráží
  kořist na vlastní podmínky. Na volném moři a ve vlnách je ale pomalá a
  zranitelná — patří k ostrovům a úžinám.

### Neutrálové a stavby

- **Kupecká loď — `merch`.** Plná zboží, prázdná na děla. Dvě otočné hlavně
  na odplašení a jinak spoléhá na eskortu. To, po čem piráti jdou.
- **Pobřežní pevnost — `fort-coastal`.** Kamenná baterie u vjezdu do přístavu.
  Nehne se, zato její žhavé koule dolétnou dál než lodní děla a zdi spolknou
  salvu za salvou.

---

## 7. Herní mechanika

Pirates je **taktická simulace plachetnicových bitev**: manévr rozhoduje
stejně jako děla. Simulace je deterministická (stejný seed → stejný průběh),
takže výsledky jsou přehratelné a férové pro žebříček.

### Vítr a body plavby

Loď nepohání motor, ale **vítr do plachet** — a kolik ho plachty vezmou,
závisí na **úhlu přídě k větru** (tzv. bod plavby):

- **Přímo do větru (± ~45°, „v kleštích")** — plachty plandají, tah je nulový.
  Tomuhle klínu se říká **no-go zóna**; přímo proti větru se plout nedá.
- **Ostře na vítr (~45°, close-hauled)** — plachty berou, ale málo; loď se
  plazí.
- **Na půl větru (~75–90°, beam reach)** — rychle.
- **Zadoboční vítr (~110–135°, broad reach)** — **nejrychlejší** bod plavby.
- **Přímo po větru (~180°, running)** — rychle, ale plachty si vzájemně stíní,
  takže o něco pomaleji než broad reach.

Vpravo nahoře je **růžice větru**: ukazuje směr větru, červenou no-go zónu a
barevně, na jakém bodu plavby zrovna vybraná loď je (zelená = skvělý, červená
= v kleštích). **Trim** (napnutí plachet) je jemné doladění tahu.

### Křižování (tacking)

Chceš-li se dostat proti větru, musíš **křižovat** — plout cik-cak, střídavě
ostře na vítr na obě strany, a přibližovat se k cíli po zubaté dráze. Autopilot
to umí sám: zadáš kurz do protivětru a loď začne halzovat. Křižování stojí čas
a vzdálenost — proto rychlejší loď, která si drží čistý vítr, diktuje, kdy a
kde se bojuje.

### Vesla

Některé lodě (šalupy, galéry) umí **veslovat**: malý tah **nezávislý na větru**,
jediná cesta přímo proti větru bez křižování — a záchrana v bezvětří. Vesla ale
vyčerpávají posádku (**stamina** se čerpá a pomalu doplňuje), takže se hodí na
krátké nájezdy, ne na trvalý pohon. Galéra na veslech je pánem úžin; galeona,
která veslovat neumí, je v bezvětří vydaná napospas.

### Ostrovy: kolize, mělčiny, závětří, mlha

- **Kolize** — na břeh se najet nesmí; loď uvázne, poškodí se a při dost silném
  nárazu se **potopí**.
- **Mělčiny a útesy** — nebezpečné jen pro **hluboký ponor** (galeona, řadová
  loď). Lehký člun přes ně proklouzne → zkratka, kterou pronásledovateli
  uzavřeš.
- **Závětří** — za ostrovem po směru větru je **slabší, vířivý vzduch**. Schováš
  se tam před palbou, ale ztratíš tah a riskuješ, že uvázneš bez větru.
- **Mlha / kryté výhledy** — ostrov mezi tebou a nepřítelem **přeruší dohled**.
  Ztracená loď zmizí z mapy jako **paměťový kontakt** na poslední známé pozici —
  ideální na přepad ze zátoky.

### Boj: boční salvy, střelivo, raking

Hlavní výzbroj je v **bocích** — lodě bojují **bok k boku** na paralelních
kurzech a pálí **boční salvy**. Po výstřelu se bok dlouho **nabíjí**, takže se
střílí z levoboku a pravoboku střídavě. Volíš **náklad do děla**:

- **Plné koule (round shot)** — trhají **trup**; loď „umírá po částech" (děla,
  kormidlo, ráhnoví, posádka), ne jeden HP bar.
- **Řetězové (chain shot)** — trhají **plachty a ráhnoví**; **zpomalí kořist**,
  abys ji dostihl nebo obrátil k výsadku. Klíčová zbraň honičky.
- **Kartáče (grape shot)** — kosí **posádku**; příprava na **boarding** a cesta
  ke zlomení morálky.

**Raking (palba do osy)** — dostat se před **příď nebo záď** nepřítele, kde
nemá boční děla, a střílet podél celé lodi. Historicky nejničivější manévr;
ve hře zdvojnásobuje poškození. Dědic taktiky „crossing the T".

### Morálka, kapitulace a boarding

Poškození, ztráty posádky a přesila lámou **morálku**. Se zlomenou morálkou
loď **spustí vlajku** a vzdá se — sama, nebo po tvé **výzvě ke kapitulaci**.
Vzdanou (nebo dost oslabenou) loď pak můžeš **obsadit výsadkem** (boarding):
přiléhneš bok k boku a převaha posádky rozhodne. Pro piráta — i pro kapitána,
který myslí na kořist — je **zajmutá loď cennější než potopená**.

### Dohled a mlha války

Vidíš jen to, co hlásí **hlídka na stěžni**: kontakty v dosahu dohledu a v
přímém výhledu (ostrovy kryjí). Loď mimo dohled zůstává jako **paměťový
kontakt** s poslední známou polohou a s rostoucí nejistotou — nevíš, kam se
mezitím pohnula. Vyšší stěžně (větší lodě) vidí dál.

### Čas a rozhodování

Bitvy na moři trvají dlouho, proto lze **zrychlit čas** (1× / 2× / 4× / 8×)
nebo **pauznout** (mezerník). Při důležité události — hlášce, potopení,
kapitulaci — čas sám spadne na 1×, aby ti nic neuniklo.

### Skóre

Po výhře se počítá **skóre**: bonus za vítězství a splněné cíle, body za
**zajaté lodě** (piráti cení kořist), za potopené nepřátele a za **rychlost**;
srážka za vlastní ztráty. Determinismus dělá skóre přehratelné a žebříček
férový.

---

## 8. Mise kampaně

Kampaň je stavěná ze **scénářů** (lodě + cíle + skriptované triggery se zvraty).
Šest misí tvoří ucelený oblouk od celní hlídky po řadovou bitvu:

1. **Hlídka u Želvího ostrova** (tutoriál) — celní kontrola v úžině. „Kupec"
   *Mořská panna* po výzvě odhodí masku a prchá na volné moře. Učí vítr, body
   plavby, trim, vesla a obeplutí ostrova — a odhalí první nit: vojenský takeláž
   a castillskou pečeť pod plátnem obyčejné bárky.
2. **Konvoj v Soutěsce** — eskorta dvou kupců úžinou mezi Kančím a Mlžným
   ostrovem. Z návětří udeří pirátská smečka (dvě šalupy + vlajková briga
   *Černý příboj*). Ubraň konvoj a vyřiď piráty — a v podpalubí brigy najdi
   stejné rozkazy jako na *Mořské panně*. Nit se mění v síť.
3. **Vlčí past** — zdánlivě osamělý kupec *Santa Rosa* je castillská **Q-loď**,
   která zblízka odklopí boky. Přežij přepad a znič či zajmi ji. Poprvé zazní
   jméno **Don Cristóbal de Vega**. Učí raking a boj zblízka.
4. **Depeše** — honba za rychlým kurýrem *Céfiro*, který veze rozkazy pod
   ochranu pevnosti Punta Negra. Dostihni ho dřív, než se schová pod děla —
   mistrovská lekce větru, křižování a vesel.
5. **Hnízdo** — obléhání pirátské zátoky Kostivého ostrova pod pobřežní baterií.
   S Fortunou a spojeneckou brigou rozbij smečku a zajmi *Silase Rourka*. Ten
   vydá poslední kus sítě: **almirante Herrera**, úžina u Tří majáků.
6. **Úžina u Tří majáků** (finále) — řadová bitva. Tři albionské lodě proti
   castillské **řadové lodi Trueno** a fregatě *Rayo*. Zastav poslední stříbro
   a s ním válku, kterou de Vega chystal. Řadovou loď obtancuj, rozděl palbu
   a rakuj do zádi.

**Další oblouk** (budoucí): odhalení a dopadení de Vegy, odveta Castilly,
a otázka, jestli lze Halcyonu udržet mír, když obě koruny vědí, co se u Tří
majáků málem stalo.

---

*Tento dokument je živý. Aktualizovat, jak přibývají mise a jak se svět
rozrůstá — vždy tak, aby seděl s `src/data/` (třídy, mise, texty).*
