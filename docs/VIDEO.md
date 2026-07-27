# Pirates — video: úvodní film a briefingové smyčky

> Hra je hratelná **i úplně bez videa**. Chybějící klip se tiše přeskočí:
> briefing zůstane u statického obrázku, úvodní film se přeskočí rovnou na
> kampaňovou mapu. Video je třešnička, ne závislost.

Všechno video se generuje přes **Veo 3.1** (Gemini API) z obrázků, které už
v repu leží — každý záběr rozpohybuje jednu konkrétní malbu z `public/img/`.
Díky tomu video nikdy neuteče výtvarnému stylu hry a statický obrázek se dá
použít jako `poster`, který drží kompozici, než se klip načte.

---

## Co v repu je

| Soubor | Co to je | Kde se hraje |
|---|---|---|
| `public/video/intro.mp4` | úvodní film ~24 s + komentář a hudba | první spuštění hry, pak tlačítko 🎬 na mapě |
| `public/video/intro-1..4.mp4` | čtyři němé záběry, ze kterých se film skládá | jen zdroj pro `intro.mp4` |
| `public/video/brief-<mise>.mp4` | bezešvá smyčka ~5 s, bez zvuku | briefing mise, pod textem |

Briefingové smyčky jsou 960×540, úvodní záběry 1280×720 (film se hraje přes
celou obrazovku, briefing jen v rámečku).

### Úvodní film

Čtyři šestivteřinové záběry v dramaturgickém oblouku — **plavba → důstojníci
→ dělostřelecký souboj → boarding** — a přes ně komentář vypravěče. Komentář
je **vždy anglicky**, i v české verzi hry: je zapečený ve zvukové stopě videa,
ne v `public/vo/`.

Text komentáře je v `scripts/gen-intro.mjs` (konstanta `NARRATION`), včetně
časů, na které věty sedí. Když se věta protáhne přes svůj střih, další se
automaticky posune, aby se repliky nepřekryly, a film se na konci o kousek
prodlouží podržením posledního snímku.

### Briefingové smyčky

Klidnější pohyb (pomalý nájezd, vlny, kouř) tematicky navázaný na to, co se
v misi bude dít. Sestříhané do **bezešvé smyčky**: konec se prolne přes
začátek, takže při opakování není slyšet ani vidět střih.

Hrají **potichu** (jinak by je autoplay politika prohlížeče nepustila) a
`poster` je ta samá malba, která se ukáže, když video chybí nebo se nenačte.

---

## Jak to vygenerovat

```bash
# klíč se čte JEN z prostředí — nikdy ho nedávej do repa
export GEMINI_API_KEY=...
export ELEVENLABS_API_KEY=...

node scripts/gen-videos.mjs               # všechny záběry (intro i briefingy)
node scripts/gen-videos.mjs --only intro  # jen úvodní záběry
node scripts/gen-videos.mjs --dry         # co by se generovalo
node scripts/gen-intro.mjs                # slepí intro.mp4 (komentář + hudba)
```

Hotové soubory se **přeskakují**, takže opakované spuštění nespotřebovává
kvótu — přegenerování vynutí `--force` nebo smazání konkrétního souboru.

Oba skripty potřebují **ffmpeg**: hledá se v `$FFMPEG`, pak
`node_modules/ffmpeg-static`, nakonec `ffmpeg` v PATH.

### Kvóta Veo

Veo má výrazně nižší limity než textové modely a při hromadném generování se
běžně narazí na `429 RESOURCE_EXHAUSTED`. Skript to bere jako normální stav:
odesílání zkusí pětkrát s prodlužující se pauzou a teprve pak záběr vzdá a jde
dál. Nedogenerované záběry se doplní dalším spuštěním (hotové se přeskočí).

Modely se dají přepnout — `--model veo-3.1-generate-preview` (nejvyšší
kvalita), `veo-3.1-fast-generate-preview`, výchozí je
`veo-3.1-lite-generate-preview`, který na tenhle malířský styl bohatě stačí.

---

## Kde se to mění

- **Záběry a prompty:** `scripts/shots.mjs` — každý záběr má `id`, zdrojový
  obrázek (`seed`), popis pohybu a příznak `loop`. Společná stylová hlavička
  `STYLE` drží všechny klipy v jednom filmu; sahej na ni jen když měníš styl
  celé hry.
- **Text komentáře a mix:** `scripts/gen-intro.mjs`.
- **Přiřazení scén misím:** `MISSION_SCENES` v `src/main.ts` — mění zároveň
  obrázek briefingu i to, ze které malby vzniká klip.

Přidat misi znamená doplnit řádek do `MISSION_SCENES`, záběr do `BRIEF_SHOTS`
a spustit generátor. Nic dalšího se v kódu nemění.

---

## Vstupní karta a pořadí obrazovek

Než se pustí úvodní film, ukáže se **vstupní karta** (`showEntry` v
`src/main.ts`) s dvěma cestami dovnitř, každou ve svém jazyce: **ENTER**
a **VSTUP**. Volba rovnou přepne jazyk celé hry, takže se nikde nepřenačítá
stránka.

Karta má i technický důvod: kliknutí je to **uživatelské gesto**, bez kterého
prohlížeč nepustí zvuk. Díky němu může úvodní film rozjet komentář i hudbu
naplno místo toho, aby čekal na tlačítko „přehrát".

Pořadí je tedy: `vstupní karta → (při prvním spuštění) úvodní film →
kampaňová mapa`. Vstup přímo do mise přes `?mission=` kartu ani film
nezdržuje.
