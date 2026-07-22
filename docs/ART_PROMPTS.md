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

## Volitelná grafika (zatím ji hra nevykresluje)

Tyhle assety **nejsou nutné** — engine je nepoužívá. Pokud je vyrenderuješ,
lze je snadno zapojit do briefing overlaye / menu (řekni a doplním kód).

- **Ikona / favicon** — `public/img/icon-512.png` a `icon-192.png`
  (a odkaz v `index.html`). Prompt: *emblém hry — zkřížené dělo a kotva pod
  korunou, na tmavě modrozeleném poli, mosazný reliéf, plochý ikonický styl,
  čitelný v malé velikosti.*
- **Scény k briefingům misí** (16:9, ~1280×720), atmosféra každé mise —
  volitelně jedna na misi:
  - *mission01* — šalupa v ranní úžině u nízkého korálového ostrova.
  - *mission02* — konvoj kupců v úzké soutěsce mezi dvěma ostrovy, plachty
    pirátů v návětří.
  - *mission03* — osamělý kupec za mrtvého bezvětří, tušení nebezpečí.
  - *mission04* — rychlý kurýr prchá k černému mysu s pevností, čerstvý vítr.
  - *mission05* — pirátská zátoka za úsvitu pod kamennou baterií.
  - *mission06* — řadová loď a fregata v úžině mezi třemi majáky, kouř děl.
  Styl: *dramatic maritime oil painting, golden age of sail, stormy cinematic
  light, muted teal-and-amber palette* + konkrétní scéna.

---

## Checklist při renderování

1. Zachovej **čtvercový formát 512×512** a kompozici bust s vycentrovaným
   obličejem (ořez na 26px nesmí uříznout hlavu).
2. Použij **stylový suffix** u všech postav — konzistence > detail.
3. Ulož jako **PNG** do `public/img/` přesně pod klíčem mluvčího
   (`captain.png`, `admiral.png`, …).
4. Zkontroluj ve hře: portréty naskočí v logu komunikace u příslušných hlášek.
