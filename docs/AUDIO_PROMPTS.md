# Pirates — hudba: zadání a prompty pro Suno.ai

> Hra má **adaptivní hudební automat**: podle situace přepíná mezi stopami a
> crossfaduje mezi nimi (~2,5 s). Stopy se aktivují automaticky, jakmile je
> vložíš do `public/audio/`. Chybějící soubor se **tiše ignoruje** — hra běží
> i bez hudby (zvukové efekty jsou syntetizované v enginu, ty řešit nemusíš).
>
> Tenhle dokument je připravený k vyrenderování v **Suno.ai**: u každé stopy je
> název souboru, styl (do pole *Style of Music*) a popis, plus společná
> hudební identita, aby stopy zněly jako jeden soundtrack.

---

## Jak to hra načítá

- Hra hledá `public/audio/music-<stav>.mp3`. Stav volí automat z dění na mapě.
- **Formát:** MP3, stereo, ~192 kbps stačí.
- **Smyčky:** `menu`, `cruise`, `tension`, `combat` musí jít **plynule
  zaloopovat** (konec navazuje na začátek — v Suno použij *Extend*/*Loop* nebo
  stopu ustřihni na hudební frázi bez doznívajícího ocasu). `victory` a
  `defeat` jsou **jednorázové** (klidně s doznělým koncem).
- **Délka:** smyčky ideálně **1:30–2:30**, jingly `victory`/`defeat` **10–20 s**.

### Kdy která stopa hraje (automat)

| Stav | Soubor | Kdy |
|---|---|---|
| **menu** | `music-menu.mp3` | v menu a na briefingu mise |
| **cruise** | `music-cruise.mp3` | klidná plavba, nepřítel daleko (> 2,5 km) |
| **tension** | `music-tension.mp3` | nepřítel v dohledu (< 2,5 km), ještě se nestřílí |
| **combat** | `music-combat.mp3` | boj: nepřítel < 600 m, létají koule, nebo trup < 40 % |
| **victory** | `music-victory.mp3` | výhra mise (jednorázově) |
| **defeat** | `music-defeat.mp3` | prohra mise (jednorázově) |

Eskalace (cruise → tension → combat) je okamžitá; **deeskalace má hysterezi
~12 s**, aby hudba nekmitala. Proto ať mají `cruise`/`tension`/`combat` stejné
tempo a tóninu — crossfade pak zní jako jedna skladba, co jen houstne.

---

## Společná hudební identita (drž u všech stop)

- **Žánr:** orchestrální **námořní / pirátské dobrodružství** (styl filmové
  hudby ke golden-age-of-sail), s lidovým nádechem sea shanty.
- **Nástroje:** smyčce (legato i staccato), nízké žestě (lesní rohy, tuba),
  ruční bubny a taiko/válečný buben, housle/fiddle, irská flétna (tin whistle),
  akordeon/concertina pro pirátskou barvu, občas cimbál/harfa pro moře.
- **Tónina:** **D moll** (dórský nádech), aby všechny stopy ladily.
- **Tempo:** kotva kolem **~100 BPM** (klid pomaleji, boj rychleji, ale
  příbuzné), společný taktový rámec 4/4 nebo 6/8.
- **Motiv:** krátký **4tónový hrdinský motiv** (např. D–A–B♭–A), který se
  objevuje napříč stopami v různé instrumentaci a náladě — tmelí soundtrack.
- **Bez zpěvu** (instrumentální); nanejvýš bezeslovné „hej!" výkřiky posádky
  v boji. V Suno zapni **Instrumental**.

Do Suno vlož **Style of Music** (řádek se štítky) a do popisu/lyrics pole dej
`[Instrumental]` + popis níže. Nech vygenerovat víc variant a vyber tu, co
nejlíp loopuje.

---

## Stopy (soubor → Suno prompt)

### `public/audio/music-menu.mp3` — Menu / briefing
- **Style of Music:** `cinematic nautical adventure, orchestral, sea shanty, slow, atmospheric, instrumental, D minor, tin whistle, strings, accordion`
- **Popis:** *Pomalé, honosné a trochu tesklivé úvodní téma — vítr v plachtách
  před vyplutím. Sólová irská flétna nese hrdinský 4tónový motiv nad měkkými
  smyčci a tichým akordeonem, vzdálený příboj a lodní zvon. Vznešené, zvoucí na
  dobrodružství, ale s nádechem melancholie moře. Beze bicích, klidné tempo
  ~80 BPM. Musí plynule loopovat.*

### `public/audio/music-cruise.mp3` — Klidná plavba
- **Style of Music:** `nautical folk adventure, warm orchestral, gentle sea shanty, mid-slow, instrumental, D minor, fiddle, whistle, light hand percussion`
- **Popis:** *Vlídná plavba za dobrého větru. Houpavý rytmus lehkých ručních
  bubnů, hravé housle a flétna si pohazují s hlavním motivem, akordeon udržuje
  pohodu. Optimistické, otevřené moře, ~95 BPM, 6/8 houpání. Nenápadné, ať
  nepřekáží — podklad pod plavbu. Plynulá smyčka.*

### `public/audio/music-tension.mp3` — Napětí (nepřítel v dohledu)
- **Style of Music:** `cinematic suspense, nautical, brooding orchestral, ostinato strings, low brass, instrumental, D minor, ~100 BPM`
- **Popis:** *Plachta na obzoru — nejistota. Tiché neklidné ostinato nízkých
  smyčců, vzdálený buben jak tep, náznaky hrdinského motivu v nízkých žestích,
  ale zdušené. Roste tušení boje, ještě bez výbuchu. Napjaté, temné, stálé
  tempo shodné s combat stopou. Loopovatelné.*

### `public/audio/music-combat.mp3` — Boj
- **Style of Music:** `epic battle, cinematic orchestral, nautical, driving taiko drums, brass fanfare, fast strings, sea shanty energy, instrumental, D minor, ~120 BPM`
- **Popis:** *Boční salvy hřmí. Ženoucí válečné bubny a taiko, rychlé staccato
  smyčce, plný žesťový hrdinský motiv jako fanfára, divoké housle a bezeslovné
  výkřiky posádky. Adrenalinové, hrdinské, nebezpečné. Silné, ale ne chaotické —
  ať drží puls boje. Stejná tónina/rámec jako tension. Plynulá smyčka.*

### `public/audio/music-victory.mp3` — Vítězství (jingle)
- **Style of Music:** `triumphant orchestral fanfare, nautical, brass and drums, sea shanty, major resolution, instrumental, ~15 seconds`
- **Popis:** *Krátká vítězná fanfára — hrdinský motiv naplno v žestích, buben,
  rozjásané housle, zvon, rozuzlení z D moll do durové kadence. Hrdé, radostné,
  „vlajka vlaje". Jednorázové, může doznít.*

### `public/audio/music-defeat.mp3` — Porážka (jingle)
- **Style of Music:** `somber orchestral, nautical lament, slow strings, solo whistle, minor, mournful, instrumental, ~15 seconds`
- **Popis:** *Krátký žalozpěv — pomalé sestupné smyčce, osamělá flétna nese
  zlomek hrdinského motivu v moll, vzdálený zvon jako za utonulé. Tíživé,
  důstojné, konec plavby. Jednorázové, doznívá do ticha.*

---

## Postup

1. V Suno u každé stopy vlož řádek **Style of Music** a do textu `[Instrumental]`
   + popis. Vygeneruj víc variant.
2. Vyber verzi, která **plynule loopuje** (u menu/cruise/tension/combat) a
   ladí tóninou/tempem s ostatními.
3. Exportuj jako **MP3** a ulož do `public/audio/` přesně pod názvy výše
   (`music-menu.mp3`, …).
4. Spusť hru — hudba naskočí sama a bude reagovat na dění (crossfade mezi stavy).
   Nic v kódu měnit nemusíš.
