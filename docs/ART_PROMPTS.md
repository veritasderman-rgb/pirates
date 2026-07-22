# Pirates — grafika: zadání a prompty

> Co hra potřebuje vykreslit a jak. **Portréty postav** se ve hře zobrazují
> v logu komunikace a aktivují se automaticky, jakmile soubory vložíš do
> `public/img/`. Lodě a mapa se kreslí vektorově v enginu — sprity nejsou
> potřeba. Ostatní grafika (scény, ikona) je volitelná a označená.
>
> Postavy a svět viz [`LORE.md`](LORE.md).

---

## Jak to hra načítá

- **Portréty:** hra hledá `public/img/<klíč-mluvčího>.png`. Klíč je hodnota
  `Speaker` (viz `src/sim/types.ts`). Chybějící soubor se **tiše skryje** —
  hra funguje i bez portrétů, jen se nezobrazí. Vlož PNG do `public/img/`
  a při dalším načtení se objeví.
- V logu se portrét vykresluje jako **malý čtvereček ~26 px** (`object-fit:
  cover`, zaoblené rohy, teal rámeček). Zdroj klidně větší — doporučeno
  **512×512 px**, ať je ostrý na retina displejích a použitelný i jinde.

**Cílový formát portrétů:** PNG, **512×512 px**, čtverec, kompozice
**hlava a ramena (bust)**, obličej vyplní ~60 % plochy a je vycentrovaný
(aby ořez na čtverec fungoval). Pozadí tmavé, jemná viněta — ne bílé.

---

## Styl (společný pro všechny portréty)

Jednotný vzhled je důležitější než detail. Drž se toho u všech postav:

- **Doba a svět:** fiktivní **zlatý věk pirátství** (přelom 17.–18. století).
  Albion = anglicko-nizozemský nádech, Castilla = španělský, piráti =
  ošuntělá směs. Žádné reálné vlajky/znaky ani reálné historické osoby.
- **Technika:** **malovaný olejový portrét**, tahy štětce viditelné, jako
  dobový portrét kapitána — ne fotorealismus, ne kreslený komiks, ne 3D render.
- **Osvětlení:** jeden teplý zdroj z levé strany (lucerna / okno kajuty),
  hluboké stíny, tmavé pozadí s jemnou vinětou. Dramatické, „šerosvit".
- **Paleta:** ladit s UI hry — **studená modrozelená** (moře, #0a2630 /
  #4fd0e0) v pozadí a stínech, **teplé akcenty** (mosaz, zlato #d8c24f,
  osmahlá pleť, dřevo) na postavě. Castillská strana o odstín tepleji/rudě
  (#e0805a). Tlumené, ne pestré.
- **Kompozice:** hlava a ramena, mírně z tříčtvrtního profilu, pohled k divákovi
  nebo těsně vedle. Čitelná silueta klobouku/účesu (aby postava byla poznat
  i v 26px).

**Doporučený „stylový suffix"** — připoj k promptu každé postavy:

> *oil painting portrait, golden age of sail, head and shoulders bust, dramatic
> chiaroscuro lighting from the left, dark teal vignette background, muted
> palette of sea-green shadows and warm brass/gold highlights, painterly visible
> brushstrokes, weathered realism, cinematic, square composition, face centered
> — not a photo, not 3D, not cartoon*

---

## Portréty postav (soubor → prompt)

### Albion (spojenci)

**`public/img/captain.png` — Kapitán (hráč)**
> Fictional Albion naval captain, the player character — early 30s, resolute
> and level-headed, short dark hair, clean-shaven or light stubble, sharp
> sea-weathered face. Dark navy-blue coat with brass buttons and a touch of
> gold braid at the collar, white cravat, bicorne hat. Calm confidence, a hint
> of the weight of command in the eyes. + *stylový suffix*

**`public/img/admiral.png` — admirál Edmund Thorne**
> Fictional Albion fleet admiral, late 60s, grizzled old sea wolf. Deeply lined
> weathered face, white side-whiskers, a pale scar across one cheek, tired but
> flint-hard grey eyes. Heavy dark-blue admiral's coat, thick gold epaulettes
> and braid, high collar. Stern, commanding, carries decades of war. + *suffix*

**`public/img/port.png` — přístavní kapitánka Odette Vaneová**
> Fictional Albion harbourmaster, a sharp-eyed woman in her 40s, dark hair
> pinned up under a modest tricorne, keen observant expression. Practical dark
> teal coat over a waistcoat, a brass spyglass or ledger at hand. Shrewd, alert
> — the first to notice when something doesn't add up. + *suffix*

**`public/img/mate.png` — I. důstojník Rusk**
> Fictional Albion first officer, late 30s, steady and tactical. Sandy hair tied
> back, honest weather-beaten face, faint smile of dry competence. Dark blue
> officer's coat, plainer than the captain's, spyglass in hand. The reliable
> right hand in the heat of battle. + *suffix*

**`public/img/gunner.png` — dělmistr Hargrove**
> Fictional Albion master gunner, burly veteran in his 50s, soot-streaked face,
> grey stubble, one eyebrow singed, a leather eyepatch or powder-burn scar.
> Rolled shirtsleeves, leather apron, red neckerchief, brass powder horn. Gruff,
> half-deaf from the guns, grinning at a good broadside. + *suffix*

**`public/img/lookout.png` — hlídka Pip**
> Fictional Albion ship's lookout, a youth of maybe 16, wind-tousled hair,
> freckles, wide eager eyes, a knitted cap. Simple sailor's slops, a small brass
> spyglass. Young, sharp-sighted, the eyes on the masthead. + *suffix*

**`public/img/bosun.png` — lodní mistr Tarr**
> Fictional Albion boatswain, broad-shouldered man in his 40s, shaved head under
> a red bandana, thick arms, rope coiled over one shoulder, a whistle on a cord.
> Practical and unflappable, the man who keeps the ship together and leads the
> boarding party. + *suffix*

### Protivníci

**`public/img/pirate-captain.png` — Silas Rourke „Černý příboj"**
> Fictional pirate captain of the Shallows brotherhood, dangerous charisma, late
> 40s. Long dark hair with grey streaks, braided beard, gold earring, a black
> weather-stained coat over mismatched finery looted from many ships, a brace of
> pistols. Cruel confident grin, hungry eyes. Ragged, roguish, menacing. + *suffix*

**`public/img/agent.png` — Don Cristóbal de Vega (castillský agent)**
> Fictional Castilian spymaster, austere aristocrat in his 50s, hidden hand
> behind the plot. Pale sharp face, neat black goatee, cold intelligent eyes,
> black brocade doublet with a silver-threaded high collar, a single dark ring.
> Restrained, elegant, quietly ruthless — a man who never touches a sword but
> moves fleets. Warmer reddish shadow accent. + *suffix*

**`public/img/castilian-admiral.png` — almirante Ramón Herrera**
> Fictional Castilian fleet admiral, proud commander in his 50s, silver-shot
> black hair and pointed beard, imperious bearing. Ornate deep-red and gold
> Castilian admiral's coat, heavy gold aiguillettes, gorget at the throat.
> Certain of his tonnage and his cause, contemptuous of smaller ships. Warm
> crimson/gold palette. + *suffix*

### Generičtí mluvčí (volitelné — když nechceš pojmenované)

- **`public/img/enemy-captain.png`** — generický nepřátelský kapitán (castillský
  důstojník, chladný, tmavě rudý kabát). *Suffix.*
- **`public/img/pirate.png`** — generický pirát smečky (ošuntělý, šátek, jizva,
  divoký pohled). *Suffix.*
- **`public/img/governor.png`** — koloniální guvernér (obtloustlý, paruka,
  drahý kabát, ustaraný). *Suffix.*

---

## Scény (briefingy a menu) — zapojeno ve hře

Hra vykresluje na začátku výběru mise a v briefingu obrázek scény (16:9,
~1280×720 nebo 640×349). Chybějící se **tiše skryje**. Soubor → kde se použije:

| Soubor | Kde | Námět |
|---|---|---|
| `public/img/scene-court.png` | menu / výběr mise | dvůr albionské koruny |
| `public/img/scene-ambush.png` | briefing **mise 2** | pirátská flotila na obzoru (konvoj) |
| `public/img/scene-castilla-port.png` | briefing **mise 4** | castillská flotila v zátoce (kurýr k přístavu) |
| `public/img/scene-pirate-cove.png` | briefing **mise 5** | pirátská zátoka pod pevností |
| `public/img/scene-beacons.png` | briefing **mise 6** | bitva v úžině u Tří majáků |

Volitelně lze doplnit i `scene-*` pro mise 1 a 3 (ranní úžina u korálového
ostrova; osamělý kupec za bezvětří, tušení nebezpečí) — přidej soubor a řekni,
namapuji ho v `MISSION_SCENES` (`src/main.ts`).

Styl scén: *dramatic maritime oil painting, golden age of sail, stormy
cinematic light, muted teal-and-amber palette* + konkrétní námět.

---

## Lodě (obrázky tříd) — prompty

Obrázky lodí se ve hře zobrazují v **panelu vlastní lodi a cíle** (a jako
briefingy). **Hotovo:** `ship-sloop-albion`, `ship-brig-albion`,
`ship-frigate-albion`, `ship-galleon-castilla`, `ship-liner-castilla`,
`ship-brig-pirate`, `ship-sloop-pirate`, `ship-merch`. **Chybí ještě:**
`ship-frigate-castilla`, `ship-galley-corsair`, `ship-fort-coastal`
(+ nové třídy `ship-liner-albion`, `ship-flagship-castilla`) — dogeneruj je
podle promptů níže a vlož do `public/img/`, naskočí samy.

Engine kreslí lodě na mapě **vektorově**, takže obrázky lodí nejsou pro běh
nutné. Doporučený formát:
**PNG, 1024×576 (16:9) nebo 800×500**, loď z profilu (bok) na moři, ať je
poznat silueta a olachtoví. Ulož jako `public/img/ship-<id třídy>.png`
(id tříd viz `src/data/defs.ts`).

**Společný styl lodí** (připoj ke každému promptu):

> *broadside profile view of a single sailing warship at sea, golden age of
> sail, oil painting, dramatic overcast light, muted teal sea and sky, warm
> wood-and-brass hull, rigging and sails detailed, three-quarter side angle,
> cinematic, painterly — not a photo, not 3D, no text or labels*

### Albion (studená modrá, čisté linie, disciplína)

- **`ship-sloop-albion.png`** — *single-masted Albion navy sloop, small and
  nimble, a few gunports, clean dark-blue hull with a white stripe, crisp
  white sails, oars shipped along the side.* + styl
- **`ship-brig-albion.png`** — *two-masted Albion navy brig, seven gunports a
  side, dark-blue hull with white gunstrake, orderly rigging, a small white
  ensign.* + styl
- **`ship-frigate-albion.png`** — *elegant Albion navy frigate, single gun
  deck of thirteen ports, tall masts, dark-blue-and-white hull, fast lines,
  white ensign snapping.* + styl
- **`ship-liner-albion.png`** — *Albion navy ship of the line, three gun decks,
  twenty-eight ports a side, imposing dark-blue-and-gold hull with white
  gunstrakes, towering masts, an admiral's flag — disciplined and massive.* + styl

### Castilla (červená a zlato, tonáž, honosnost)

- **`ship-frigate-castilla.png`** — *Castilian frigate, heavier and taller
  than the Albion type, ornate stern gallery, deep-red hull with gilded
  carvings, fourteen gunports a side.* + styl
- **`ship-galleon-castilla.png`** — *tall Castilian treasure galleon, towering
  fore- and sterncastles, richly gilded, deep-red and gold, few but heavy
  guns, riding low with silver in her hold.* + styl
- **`ship-liner-castilla.png`** — *massive Castilian three-decker ship of the
  line, thirty gunports a side, imposing red-and-black hull with gold trim,
  a floating fortress, admiral's pennant.* + styl
- **`ship-flagship-castilla.png`** — *the grandest Castilian flagship ever built,
  four gun decks, thirty-four ports a side, drowning in gold carving and
  ornament, a towering gilded sterncastle, deep-red hull — a floating throne.* + styl

### Piráti (látané, temné, kořistní)

- **`ship-sloop-pirate.png`** — *ragged pirate sloop, patched dark sails,
  weather-beaten hull of mismatched planks, a few guns, black flag, crew
  crowding the rail.* + styl
- **`ship-brig-pirate.png`** — *pirate brig, a captured merchantman refitted
  for war, dark patched hull, extra gunports cut crudely, black flag with a
  crude device, menacing.* + styl
- **`ship-galley-corsair.png`** — *corsair war galley, long low oared hull,
  a single lateen sail, a forward gun, banks of oars biting the water, built
  for coastal straits and dead calms.* + styl

### Neutrálové a stavby

- **`ship-merch.png`** — *plump merchantman, round bluff-bowed hull heavy with
  cargo, only a couple of small guns, plain tan sails, defenceless and
  tempting.* + styl
- **`ship-fort-coastal.png`** — *stone coastal fortress guarding a harbour
  mouth, tiered gun batteries in the rock, cannons run out over the sea,
  waves breaking at its base.* + styl (spíš pevnost než loď)

---

## Ikona / favicon (volitelné)

- `public/img/icon-512.png` a `icon-192.png` (+ odkaz v `index.html`). Prompt:
  *emblém hry — zkřížené dělo a kotva pod korunou, na tmavě modrozeleném poli,
  mosazný reliéf, plochý ikonický styl, čitelný v malé velikosti.*

---

## Checklist při renderování

1. Zachovej **čtvercový formát 512×512** a kompozici bust s vycentrovaným
   obličejem (ořez na 26px nesmí uříznout hlavu).
2. Použij **stylový suffix** u všech postav — konzistence > detail.
3. Ulož jako **PNG** do `public/img/` přesně pod klíčem mluvčího
   (`captain.png`, `admiral.png`, …).
4. Zkontroluj ve hře: portréty naskočí v logu komunikace u příslušných hlášek.
