# Pirates

Browserová taktická simulace **plachetnicových bitev** — dvě koruny, kupci
a volní piráti mezi nimi. Manévr podle **větru** (body plavby, křižování,
přechod na **vesla** do protivětru), **ostrovy** jako překážky (obeplouvání,
mělčiny, závětří, mlha) a boční **dělové salvy** s raking fire a boardingem.

Stavíme na architektuře už hotové vesmírné hry **„Wall of Battle"** (repo
`honorverse`): TypeScript + Canvas + Web Worker, deterministická simulace,
data-driven mise se zvraty. Mění se měřítko, lodě a přibývají tři nové
mechaniky (vítr, plavba/vesla, terén).

**Stav projektu:** hratelný prototyp (milníky M1–M4). Vítr a body plavby,
vesla + křižování, ostrovy (kolize / závětří / mlha), boční dělové salvy se
třemi typy střeliva, raking, kapitulace a boarding, dvě mise s příběhem.

## Spuštění

```bash
npm install
npm run dev        # vývojový server (Vite) → otevři vypsanou adresu
npm run build      # produkční build (tsc --noEmit && vite build)
npm test           # testy (Vitest)
```

**Ovládání:** klik na vlastní loď = výběr · klik na cíl = zaměření · klik na
vodu = kurz · Shift+táhnutí = posun mapy · kolečko = zoom · mezerník = pauza ·
`W` plachty · `E` vesla · `Q`/`R` boční salva · `A` auto-palba · `1`/`2`/`3`
náboj (koule/řetěz/kartáč). Vpravo nahoře je růžice větru s no-go zónou a
aktuálním bodem plavby vybrané lodi.

## Architektura

`src/sim/` je čistá deterministická simulace (běží ve Web Workeru), `src/ui/`
je prezentace (Canvas + DOM HUD), `src/data/` jsou třídy lodí, mise a příběh.
Podrobnosti a plán dalších milníků viz níže.

📖 **[Svět, příběh a mechanika](docs/LORE.md)** — historie Souostroví Halcyon,
dvě koruny (Albion vs. Castilla) a volní piráti, hlavní zápletka kampaně (6 misí),
postavy, popis všech typů lodí a herní mechanika tak, jak ji hráč zažívá.

🎨 **[Grafika — zadání a prompty](docs/ART_PROMPTS.md)** — portréty postav
(a další grafika) s přesnými názvy souborů a prompty pro renderování.

🎵 **[Hudba — prompty pro Suno.ai](docs/AUDIO_PROMPTS.md)** — adaptivní stopy
(menu/plavba/napětí/boj/výhra/porážka) s prompty a jednotnou hudební identitou.

📄 **[Herní návrh a plán přenosu](docs/GAME_DESIGN.md)** — koncept vesmír→moře,
recyklační tabulka (co kopírovat / upravit / napsat nově), detailní návrh
větru a plavby, třídy lodí, model boje, mise a milníky implementace.

### Assety (portréty a hudba)

Grafika ani hudba nejsou pro běh nutné. Jakmile vyrenderuješ **portréty**
(`public/img/<mluvčí>.png`) nebo **hudbu** (`public/audio/music-<stav>.mp3`)
podle promptů výše a vložíš je do `public/`, hra je **sama načte** — portréty
naskočí v logu komunikace, hudba se rozezní adaptivně. Nic v kódu se neupravuje.
