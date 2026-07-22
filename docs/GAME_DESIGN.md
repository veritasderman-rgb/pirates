# Pirates — herní návrh a plán přenosu z „Wall of Battle" (honorverse)

> **Pracovní název:** *Pirates* (dořešit).
> Browserová taktická simulace **plachetnicových bitev** — dvě koruny, kupci
> a volní piráti mezi nimi. Stavíme na už hotové kódové základně vesmírné hry
> **„Wall of Battle"** (repo `honorverse`): stejná architektura (TypeScript +
> Canvas + Web Worker), stejný scénářový/misní systém, jen **jiné měřítko,
> jiné lodě a tři nové mechaniky: vítr, plavba podle úhlu k větru (+ vesla)
> a ostrovy jako překážky.**
>
> **Stav:** fáze návrhu. Kód se zatím nepřenášel — tenhle dokument je plán,
> co a v jakém pořadí udělat.

---

## Obsah

1. [Verdikt a filozofie](#1-verdikt-a-filozofie)
2. [Koncept: vesmír → moře](#2-koncept-vesmír--moře)
3. [Architektura zdrojové hry (honorverse)](#3-architektura-zdrojové-hry-honorverse)
4. [Plán přenosu ve třech fázích](#4-plán-přenosu-ve-třech-fázích)
   - [Fáze 1 — KOPÍROVÁNÍ](#fáze-1--kopírování-vzít-skoro-beze-změny)
   - [Fáze 2 — ÚPRAVA](#fáze-2--úprava-adaptovat--napsat-nově)
   - [Fáze 3 — VYLADĚNÍ](#fáze-3--vyladění-balancování-a-pocit-ze-hry)
5. [Soubor po souboru (přehledová tabulka)](#5-soubor-po-souboru-přehledová-tabulka)
6. [Nové mechaniky — detailní návrh](#6-nové-mechaniky--detailní-návrh)
7. [Třídy lodí](#7-třídy-lodí)
8. [Model boje](#8-model-boje)
9. [Mise a příběh](#9-mise-a-příběh)
10. [Milníky implementace](#10-milníky-implementace)
11. [Otevřené otázky a rozhodnutí](#11-otevřené-otázky-a-rozhodnutí)

---

## 1. Verdikt a filozofie

**Jde to a jde to výborně.** Honorverse je paradoxně už dnes „age of sail ve
vesmíru" — autor předlohy (David Weber) tak fyziku psal schválně. Tři věci,
které pirátská hra potřebuje, jsou v kódu hotové:

- lodě se pohybují po mapě podle **vektorů a setrvačnosti** (tah se střádá do
  rychlosti — přesně jako u plachetnice, která nabírá vítr),
- bojuje se **bočními salvami** (broadside) — identické s dělovou palbou
  plachetnice,
- je tu **dvě-království + neutrálové + piráti** a kompletní **skriptovaný
  misní systém** se zvraty.

Filozofie zůstává stejná jako u honorverse: **věrný fyzikální/taktický model
před grafikou**, minimalistický vektorový displej, determinismus (seedovaný
PRNG → přehratelnost a žebříček), sim odděleně ve Web Workeru.

Tři nové věci (moře má na rozdíl od vakua terén a médium): **vítr**, **plavba
podle úhlu k větru + vesla** a **ostrovy jako překážky**. To jsou zároveň ty
tři prvky, které hru odliší od předlohy.

---

## 2. Koncept: vesmír → moře

Mapování je skoro 1:1:

| Honorverse (vesmír) | Pirates (moře) |
|---|---|
| Impelerový klín — dává zrychlení, ne rychlost; rychlost se střádá | Plachty (a vesla) — tah, který se střádá do rychlosti přes setrvačnost |
| `wedgeOn` (klín zapnut) | `sailsUp` (plachty vytaženy) — vypnutí = drift/kotva |
| `throttle` (výkon kompenzátoru 0–120 %) | `trim` (nastavení plachet) + volba plachty/vesla |
| Boční štíty (sidewall), rozpočet reaktoru tah vs. štít | Trup/pažení; blízký boj = průraz (rozpočet se dá zachovat jako „napnout plachty vs. připravit boky") |
| **Boční salva (broadside)** | **Dělová salva z boku** — beze změny konceptu |
| „Crossing the T" (palba do hrdla klínu) | **Raking fire** — palba podél osy do přídě/zádě, kde nepřítel nemá děla |
| Rakety s režimy pohonu (LO/HI) a naváděním | Dělové koule: balistické, krátký dosah, **bez navádění** → velké zjednodušení |
| Protirakety / bodová obrana (CM/PDLC) | Zrušit nebo zjednodušit (otočná děla/muškety proti přiblížení) |
| Subsystémy: impelery, šachty, senzory, ECM | Ráhnoví/plachty, děla, kormidlo, posádka |
| Hyperlimit (úniková čára soustavy) | Otevřené moře / horizont / bezpečný přístav |
| Planety, stanice (statické objekty mapy) | **Ostrovy, přístavy, pevnosti, útesy** |
| Senzory + světelné zpoždění + paměťové piny | Dohled / mlha / hlídka na stěžni; horizont a ostrovy blokují výhled |
| Kapitulace (strike/vzdát se) | **Strike the colors → boarding → plundr** (pro piráty jádro zábavy) |
| Dvě království (Avalon vs. Dorado) + piráti v Pomezí | Dvě koruny (např. Albion vs. Castilla) + kupci + volní piráti |
| Komprese času (bitvy trvají hodiny) | Honičky a manévry na moři taky trvají — komprese se hodí |
| **Vakuum — žádný terén, žádné médium** | **Moře — ostrovy (kolize), vítr (médium pohonu)** ← to nové |

---

## 3. Architektura zdrojové hry (honorverse)

Aby tenhle doc stál sám o sobě. Zdroj: repo `honorverse`, ~11,7 tis. řádků TS.

```
src/
  data/
    defs.ts            # třídy lodí + definice raket (statická data)
    story.ts           # intro kampaně, prology/epilogy misí
    missions/          # mission01..11 + index (registr scénářů)
  sim/                 # ČISTÁ simulace (bez DOM), deterministická
    types.ts           # SDÍLENÝ KONTRAKT: ShipState, Order, SimEvent,
                        #   Contact, Scenario, Trigger, SimApi, worker zprávy
    constants.ts       # fyzikální a herní konstanty (čísla na jednom místě)
    vec.ts  rng.ts     # vektory; seedovaný PRNG (mulberry32)
    physics.ts         # autopilot, otáčení, akcelerace, integrace, intercept,
                        #   brachystochrona, station-keeping formace, predikce dráhy
    weapons.ts         # salvy, režimy pohonu raket, energetika, retarget
    defense.ts         # protirakety, bodová obrana, návnady
    sensors.ts         # kontaktní picture per strana, mlha, paměťové piny
    ai.ts              # taktické doktríny (vrací Order, neaplikuje)
    firecontrol.ts     # AUTO palba, vrstvené salvy
    formation.ts       # řadová/šípová/rozptýlená formace (station-keeping)
    crew.ts            # polní opravy + náhodné události posádky
    surrender.ts       # kapitulace, morálka, doručení výzev (light-lag)
    scenario.ts        # spawn lodí ze specifikace + vyhodnocení triggerů
    engine.ts          # SimApi: create/tick/applyOrder — integruje moduly
    estimate.ts score.ts intercept.ts voice.ts   # odhady, skóre, hlášky
  ui/                  # prezentační vrstva (DOM/Canvas)
    plot.ts            # taktický displej (kamera, zoom, pan, extrapolace)
    panels.ts          # HUD (vlastní loď, kontakty, rozkazy, komunikace)
    input.ts           # UIController: výběr, mapování akcí na Order, klávesy
    audio.ts           # adaptivní hudba + syntetizované SFX (WebAudio)
    fx.ts roster.ts leaderboard.ts   # efekty/vraky, seznam lodí, žebříček
  worker/
    simWorker.ts       # sim běží v Web Workeru
    bridge.ts          # UI ↔ worker most (rozkazy dolů, snapshoty nahoru)
  main.ts              # bootstrap: briefing/outcome overlaye, výběr misí
index.html             # UI shell + PWA (manifest, service worker, mobilní ošetření)
```

**Klíčové vlastnosti, které chceme zdědit:**
- **Sim ↔ UI striktně oddělené** přes `types.ts` kontrakt a Web Worker.
  Můžeme přepsat mechaniku uvnitř `sim/` bez zásahu do UI a naopak.
- **Data-driven mise:** scénář = lodě + cíle + **triggery** (podmínky → akce).
  Kompletní skriptování zvratů bez psaní kódu enginu. Tohle přenášíme celé.
- **Determinismus:** vše náhodné jde ze `state.rng` (seed ve scénáři) →
  přehratelné běhy, férový žebříček.

---

## 4. Plán přenosu ve třech fázích

Pracovní postup přesně podle tří kroků: **nejdřív zkopírovat, co jde beze
změny; pak upravit, co mění mechaniku (a dopsat nové moduly); nakonec
vyladit čísla a pocit ze hry.**

### Fáze 1 — KOPÍROVÁNÍ (vzít skoro beze změny)

Instalatérské trubky enginu a UI shell. Přenést, přejmenovat projekt
(`wall-of-battle` → `pirates`), jinak nechat běžet.

- **`sim/vec.ts`, `sim/rng.ts`** — vektorová matematika, seedovaný PRNG. **100 %.**
- **`worker/simWorker.ts`, `worker/bridge.ts`** — celá Web-Worker架构. **100 %.**
- **`sim/engine.ts`** — tick smyčka (cooldowny → fyzika → projektily → obrana
  → senzory → AI → palba → posádka → triggery → čas). **~90 %** — jen
  přeskládat/přejmenovat fáze (klín→plachty), obsah modulů řeší fáze 2.
- **Scénářový systém** — `sim/scenario.ts` + typy `Trigger` /
  `TriggerCondition` / `TriggerAction` / `Objective` / `Scenario` z `types.ts`.
  **Přenést celé.** Jen se pak píší nové mise (viz kap. 9).
- **`sim/score.ts` + `ui/leaderboard.ts`** — skóre + žebříček. **Reuse**,
  přeladit váhy metrik.
- **`main.ts`** — bootstrap, briefing/outcome overlaye, výběr misí, úvod
  kampaně, PWA registrace. **~85 %** — jen texty a přebarvení.
- **`index.html`** — UI shell, HUD layout, PWA (manifest, service worker,
  mobilní ošetření, wake-lock, iOS fixy). **~90 %** — hlavně přebarvit
  paletu (zelený CIC monitor → moře/pergamen/dřevo) a přejmenovat titulek.
- **`ui/audio.ts`** — adaptivní hudební automat (cruise→tension→combat→
  critical→victory/defeat) + **syntetizované SFX ve WebAudio**. **~85 %** —
  logika automatu zůstává, jen nasyntetizovat dělo/vlny/vítr/zvon místo
  raket a nové MP3 stopy.
- **`ui/fx.ts`, `ui/roster.ts`** — efekty/vraky/siluety, seznam lodí. **~70 %**,
  nové siluety (plachetnice místo raketových trupů).

### Fáze 2 — ÚPRAVA (adaptovat + napsat nově)

Tady vzniká vlastní pirátská hra. Dvě větve: **(A) adaptovat** existující
soubory, **(B) napsat nové moduly** pro vítr a terén.

#### (A) Adaptovat

- **`sim/types.ts`** — kontrakt. **~70 %.** Přejmenovat/rozšířit pole:
  `wedgeOn`→`sailsUp`, `throttle`→`trim`, `subsystems` (impelery/šachty/…)
  → ráhnoví/plachty/kormidlo/děla/posádka. Přidat na loď `oaring` (vesluje),
  na `Contact` nic zásadního. Rozšířit `Scenario` o `wind` a `terrain`
  (viz nové moduly). Rozkazy (`Order`): přidat `setSails`, `setOars`,
  zjednodušit raketové (`launchLayered`/`retargetSalvo`/`launchPods` → pryč
  nebo → typy střeliva).
- **`sim/physics.ts`** — **klíčový soubor. ~50 %.** Zachovat: autopilota,
  otáčení `TURN_RATE`, semi-implicitní Euler integraci, **intercept solver**
  (honba za lodí), brachystochronu (dojezd/brzda), **station-keeping formace**
  (řadová „line of battle" je doslova z doby plachet), `predictPath`.
  **Vyměnit:** funkci `planningAccel` (dnes `maxAccelG·throttle·impelery`)
  za **větrný tah** (kap. 6). **Přidat:** kolizi/odpuzování od ostrovů a
  logiku křižování (tacking) do autopilota.
- **`sim/constants.ts`** — struktura zůstává (čísla na jednom místě), obsah
  se přeladí; přidat sekce `--- vítr ---`, `--- plavba ---`, `--- vesla ---`,
  `--- terén ---`. Zrušit ryze raketové konstanty (CM/PDLC/ECM/pody).
- **`data/defs.ts`** — schéma `ShipClassDef` reuse, obsah nový (kap. 7).
  Přidat pole: `sailArea`, `canRow`, `oarThrust`, `draft`, `turnRate`
  (plachetnice se otáčí pomaleji než impelerová loď — podtrhne roli větru).
  Rakety → typy dělového střeliva (round/chain/grape).
- **`sim/weapons.ts`** — **~40 %.** Boční salva koncepčně sedí; rakety →
  **dělové koule** (balistické, krátký dosah ~stovky m–2 km, let sekundy,
  bez navádění → smazat režimy pohonu, retarget, vrstvené salvy). Tři typy
  střeliva mapují na subsystémy (kap. 8).
- **`sim/defense.ts`** — **nízký reuse.** Bodovou obranu zrušit nebo silně
  zjednodušit (otočná děla proti přiblížení). Návnady pryč.
- **`sim/sensors.ts`** — **~40 %.** Koncept mlhy/dohledu/paměťových pinů
  reuse; „FTL detekce klínu na obří dosah" → **horizont** (dohled = f(výška
  stěžně)) + **zástin ostrovem** (LOS blokace přes `terrain`). Světelné
  zpoždění pryč (na moři irelevantní), nahradit zpožděním hlášení hlídky.
- **`sim/ai.ts`** — **~50 %.** Doktríny (nearest/biggest/escort/runner/…)
  reuse; AI navíc musí ctít **no-go zónu** větru (neplánovat kurz přímo do
  větru, umět křižovat) a **obeplouvat ostrovy**.
- **`ui/plot.ts`** — **~60 %.** Kamera/zoom/pan/extrapolace mezi snapshoty
  reuse. Přidat vykreslení: **voda** (pozadí), **vítr** (šipky/proudnice —
  odkud kam vane), **ostrovy** (polygony + mělčiny), **závětří**. Siluety
  plachetnic. Dostřel děl místo raketových obálek.
- **`ui/panels.ts` + `ui/input.ts`** — **~70 %.** HUD/ovládání framework
  reuse. Přidat: přepínač **plachty/vesla**, indikátor **bodu plavby**
  (kompasová růžice se směrem větru a barevnou zónou efektivity), trim
  plachet. Přejmenovat rozkazy (salva → bok děl, střelivo).
- **`sim/crew.ts` + `sim/surrender.ts`** — **~70 %.** Události posádky +
  kapitulace. Pro piráty tematicky ideální: kapitulace → **boarding**
  (výsadek) → **plundr**. `crew.ts` navíc obslouží **staminu veslařů**.
- **`sim/firecontrol.ts` + `sim/formation.ts`** — **reuse** (řadová formace =
  age of sail; AUTO palba na bok).
- **`data/story.ts`** — struktura (intro, prology, epilogy vázané na sebe,
  více konců dle flagů) reuse, texty nové (kap. 9).

#### (B) Napsat nově

- **`sim/wind.ts`** — **větrné pole.** Směr + síla + pomalá rotace v čase +
  lokální **poryvy** z hash-šumu (deterministicky ze seedu). **Závětří** za
  ostrovy (dotaz do `terrain`). API: `windAt(state, pos) → {dir, speed}`.
- **`sim/terrain.ts`** — **ostrovy.** Polygony/kružnice; API pro: kolizi
  (loď vs. břeh, `draft` vs. mělčina), **LOS blokaci** (senzory), blokaci
  dělových koulí (weapons), a poskytnutí dat plotu a wind (závětří).
- **`sim/sail.ts`** (nebo uvnitř `physics.ts`) — **model plavby:** křivka
  „bodů plavby" `E(θ)`, veslový tah, výpočet výsledného tahu (kap. 6).
- **Křižování (tacking)** — plánovač cik-cak noh do protivětru; využije
  existující frontu waypointů `nav.then[]`.
- **Nový art, hudba, lore** — grafika lodí/moře/ostrovů, hudební stopy,
  příběh kampaně.

### Fáze 3 — VYLADĚNÍ (balancování a pocit ze hry)

Až kostra běží a mechaniky fungují, dolaďuje se **na číslech v jednom místě**
(`constants.ts`, `defs.ts`) a **playtestem**:

- **Křivka bodů plavby** — aby beam/broad reach byl znatelně rychlejší než
  close-hauled a no-go zóna nutila křižovat/veslovat, ale hra nebyla
  frustrující (šířka no-go, sklon křivky).
- **Poměr plachty vs. vesla** — vesla musí být užitečná do protivětru, ale
  ne dominantní na volném moři (jinak vítr přestane hrát roli). Únava
  veslařů jako brzda.
- **Rychlost otáčení lodí** — plachetnice se otáčí pomaleji než impelerová
  loď; správná hodnota dělá z manévru a předvídání větru jádro taktiky.
- **Síla/dosah děl a odolnost trupů** — zdědit honorverse princip „loď umírá
  po částech" (spousta zásahů, každý bolí míň), ne HP bar. Chain shot na
  plachty jako klíčový taktický zásah (zpomalí kořist → dostihneš/obrátíš).
- **Vítr: síla, rychlost rotace, četnost/velikost poryvů, hloubka závětří** —
  aby počasí bylo čitelné, ale živé.
- **Ostrovy: hustota, velikost mělčin vs. draft tříd** — aby malé čluny měly
  reálnou výhodu zkratky přes mělčinu.
- **AI** — křižování a obeplouvání musí vypadat věrohodně; doladit doktríny.
- **Skóre a žebříček** — váhy (čas, ztráty, přesnost salv, zajaté lodě).

---

## 5. Soubor po souboru (přehledová tabulka)

Fáze: **K** = kopírovat (fáze 1), **U** = upravit (fáze 2A), **N** = nový
(fáze 2B). „Reuse" = hrubý odhad, kolik kódu přežije.

| Soubor | Fáze | Reuse | Poznámka |
|---|:--:|:--:|---|
| `sim/vec.ts` | K | 100 % | beze změny |
| `sim/rng.ts` | K | 100 % | beze změny |
| `worker/simWorker.ts` | K | 100 % | beze změny |
| `worker/bridge.ts` | K | 100 % | beze změny |
| `sim/engine.ts` | K | ~90 % | přeskládat/přejmenovat fáze ticku |
| `sim/scenario.ts` | K | ~95 % | spawn + triggery; drobné dle `types` |
| `sim/score.ts` | K | ~90 % | přeladit váhy |
| `ui/leaderboard.ts` | K | ~95 % | beze změny logiky |
| `main.ts` | K | ~85 % | texty, paleta, názvy scén |
| `index.html` | K | ~90 % | paleta, titulek, PWA meta |
| `ui/audio.ts` | K | ~85 % | nové SFX/MP3, automat zůstává |
| `ui/fx.ts` | K | ~70 % | nové siluety/efekty |
| `ui/roster.ts` | K | ~85 % | drobnosti |
| `sim/types.ts` | U | ~70 % | přejmenovat pole, +wind/terrain/oars |
| `sim/physics.ts` | U | ~50 % | vítr místo impeleru, +kolize, +tacking |
| `sim/constants.ts` | U | ~40 % | nové sekce, zrušit raketové |
| `data/defs.ts` | U | ~30 % | schéma reuse, obsah nový |
| `sim/weapons.ts` | U | ~40 % | rakety → dělové koule, 3 typy střeliva |
| `sim/sensors.ts` | U | ~40 % | horizont + zástin ostrovem |
| `sim/ai.ts` | U | ~50 % | no-go zóna, obeplouvání |
| `sim/crew.ts` | U | ~70 % | +stamina veslařů |
| `sim/surrender.ts` | U | ~70 % | kapitulace → boarding → plundr |
| `sim/firecontrol.ts` | U | ~80 % | AUTO palba na bok |
| `sim/formation.ts` | U | ~80 % | řadová formace |
| `ui/plot.ts` | U | ~60 % | voda, vítr, ostrovy, siluety |
| `ui/panels.ts` | U | ~70 % | růžice větru, plachty/vesla, trim |
| `ui/input.ts` | U | ~70 % | nové rozkazy, přepínače |
| `data/story.ts` | U | struktura | nové texty |
| `sim/defense.ts` | U | ~10 % | zrušit/silně zjednodušit |
| `sim/wind.ts` | N | — | větrné pole + poryvy + závětří |
| `sim/terrain.ts` | N | — | ostrovy: kolize, LOS, blokace koulí |
| `sim/sail.ts` | N | — | body plavby, veslový tah, výsledný tah |
| `data/missions/*` | N | — | nové mise (systém z fáze 1) |

---

## 6. Nové mechaniky — detailní návrh

### 6.1 Vítr jako pole

Začít jednoduše a přidávat vrstvy:

- **Základ:** globální směr `windDir` + síla `windSpeed`, pomalá rotace v čase
  (pár stupňů za minutu) — počasí se mění, ne skokově.
- **Poryvy (gusts):** lokální odchylky směru/síly z **hash-šumu** funkce
  pozice a času, deterministicky ze `state.rng` seedu (honorverse už
  deterministické kosmetické pole z hashe generuje — stejný idiom).
- **Závětří (lee):** za ostrovem (ve směru po větru od jeho obrysu) vítr
  slabší a vířivý — dotaz do `sim/terrain.ts`. Taktika: schovat se v závětří
  před palbou, ale riskovat ztrátu tahu a uváznutí.

API: `windAt(state, pos): { dir: number; speed: number }`. Plot z pole kreslí
šipky/proudnice (odkud kam vane) a barevně odlišuje poryvy/závětří.

### 6.2 Body plavby (points of sail)

Efektivita plachet = funkce úhlu **θ** mezi směrem přídě lodi a směrem,
**odkud** vítr vane (angle off the wind). Honorverse tenhle přesný idiom už
používá u `SIDEWALL_POWER_CURVE` (pole `[práh, faktor]` s lineární
interpolací) — plavební křivku napíšeme stejně:

```
θ (příď od směru větru)     efektivita tahu E(θ)   název bodu plavby
  0°  –  ~45°                ~0.00                  „v kleštích" (irons) — NO-GO
 ~45°                        ~0.55                  ostře na vítr (close-hauled)
 ~70°  – 90°                 ~0.90                  na půl větru (beam reach)
 ~110° – 135°                ~1.00                  zadoboční (broad reach) — NEJRYCHLEJŠÍ
 180°                        ~0.75                  přímo po větru (running) — plachty si stíní
```

```
tah_plachty = sailArea · f(windSpeed) · E(θ) · trim · zdraví_ráhnoví
```

- `f(windSpeed)` — roste se sílou větru (klidně ~lineárně/mírně kvadraticky),
  se stropem (v bouři se plachty refují, jinak škoda na ráhnoví).
- `trim` — hráčovo nastavení plachet (0–1, analogie `throttle`).
- `zdraví_ráhnoví` — chain shot do plachet ho sráží → loď zpomalí.

**Do protivětru se přímo nedá** (E≈0 v no-go zóně) — nutno **křižovat** nebo
**veslovat**.

### 6.3 Vesla / pádla

Per-třída vlastnost `canRow` (analogie dnešního `podCapacity`):

- galéra / šalupa / člun → **umí** veslovat,
- galeona / fregata / řadová loď → **neumí** (moc velké).

```
tah_vesla = oarThrust · zdraví_posádky · (1 − únava)     // NEZÁVISLÝ na větru
```

Vesla: malý, na větru nezávislý tah — **jediná cesta přímo proti větru bez
křižování**, ale pomalá a s **únavou posádky** (stamina se čerpá, doplňuje se
odpočinkem; napojení na `crew.ts`). Herní dilema: chytat vítr a kličkovat,
nebo pádlovat natvrdo (a vyčerpat veslaře před bojem).

Výsledný tah lodi = `max/kombinace` plachet a vesel podle režimu (hráč volí
`setSails` / `setOars`; některé lodě zvládnou obojí naráz s postihem).

### 6.4 Křižování (tacking / beating to windward)

Když cíl leží v no-go zóně, autopilot naplánuje **cik-cak nohy** střídavě pod
~45° na obě strany větru — analogie brachystochrony, jen s větrným omezením.
Implementace využije **existující frontu waypointů `nav.then[]`** (honorverse
ji už má pro vícebodové trasy). Přehození plachet na druhý bok (tack) stojí
chvilku ztráty rychlosti (loď „projede" no-go) — reálná daň, dobře čitelná.

### 6.5 Ostrovy jako překážky

`sim/terrain.ts` drží ostrovy (polygony nebo shluky kružnic) a poskytuje:

1. **Kolizi** — loď najetá na břeh uvázne/poškodí se; hlídá se `draft` lodi
   vs. hloubka. **Mělčiny (reef):** velký `draft` (galeona) najede, malý
   člun projede → zkratka jako taktika.
2. **Blokaci dohledu** — ostrov v přímce mezi pozorovatelem a kontaktem =
   kontakt není vidět (mlha/přepad z zálivu). Napojení na `sensors.ts`.
3. **Blokaci dělových koulí** — koule narazí do ostrova místo do cíle.
4. **Závětří** — obrys ostrova modifikuje větrné pole (kap. 6.1).

Nutí **obeplouvat** — přesně zadání. Přístavy/pevnosti jsou zvláštní „ostrov"
s děly (statická obrana, analogie honorverse orbitální stanice).

---

## 7. Třídy lodí

Nahradí obsah `data/defs.ts` (schéma `ShipClassDef` + nová pole `sailArea`,
`canRow`, `oarThrust`, `draft`, `turnRate`). Návrh sady:

| Třída | Role | Vesla | Draft | Poznámka |
|---|---|:--:|:--:|---|
| **Šalupa (sloop)** | rychlý zvěd/kurýr, 1 dělo/bok | ano | malý | mrštná, projede mělčiny |
| **Briga (brig)** | vyvážený nájezdník | ano (těžce) | střední | páteř pirátské flotily |
| **Fregata (frigate)** | rychlá válečná loď | ne | střední | lovec i eskorta |
| **Galeona (galleon)** | kupecký/pokladní kolos | ne | velký | pomalá, kořist snů |
| **Galéra (galley)** | veslová válečná loď | ano (hlavní pohon) | malý | silná do protivětru, slabá na volném moři/vlnách |
| **Řadová loď (ship-of-the-line)** | pohyblivá pevnost | ne | velký | vládne dělům, mizerně manévruje |
| **Kupecká loď (merchantman)** | bezbranná kořist | ne | velký | civilní, pár otočných děl |
| **Q-loď (disguised raider)** | válečná loď v masce kupce | ne | velký | zvrat mise — honorverse `merch-qship` má hotový přesně tenhle trik |

Asymetrie stran (jako honorverse `missileQuality`): koruna A sází na kvalitu
děl/výcvik, koruna B na počet trupů; piráti mají opotřebované kořistní lodě.

---

## 8. Model boje

- **Boční salvy** — hlavní výzbroj v bocích; lodě bojují bok k boku na
  paralelních kurzech (honorverse to už dělá). AUTO palba `firecontrol.ts`.
- **Raking fire** (dědic „crossing the T") — dostat se před **příď/záď**
  nepřítele, kde nemá boční děla → střílíš do dlouhé osy lodi, on skoro
  neodpoví. Historicky nejničivější manévr — přenáší se 1:1.
- **Dělové koule = balistické projektily**, krátký dosah (stovky m – ~2 km),
  let sekundy, **bez navádění**. Velké zjednodušení `weapons.ts` (pryč
  režimy pohonu, navádění, retarget, vrstvené salvy).
- **Tři typy střeliva** (hráč volí) → mapují na subsystémy:
  - **round shot** → trup (potopení, „umírá po částech"),
  - **chain shot** → plachty/ráhnoví (klíčové: **zpomalí kořist** → dostihneš
    ji nebo obrátíš k boardingu),
  - **grape shot** → posádka (příprava na **boarding** — proředit obránce).
- **Blízký boj / boarding** — kapitulace (`surrender.ts`) → výsadek → plundr.
  Morálka posádky (počet padlých, poškození, přesila) rozhoduje, jestli se
  nepřítel vzdá — pro piráty jádro (zajmout loď > potopit ji).
- **Pevnosti/přístavy** — statická pobřežní děla (analogie stanice), obléhání
  nebo proplížení kolem.

Princip odolnosti dědíme z honorverse: **loď snese 10–15 zásahů a umírá po
částech** (subsystémy: kormidlo, ráhnoví, děla, posádka), ne HP bar.

---

## 9. Mise a příběh

Skriptovací systém (scénář = lodě + cíle + triggery) se přenáší celý (fáze 1),
takže mise se **jen píší jako data**. Kostru kampaně lze recyklovat z
honorverse a jen převléknout:

1. **Tutoriál — celní/hlídková honička:** dostihnout „kupce", který po výzvě
   odhodí masku a prchá k volnému moři/přístavu. Učí: vítr a body plavby,
   trim, vektor jako zbraň (prolétnout kolem s převýšením rychlosti).
2. **Obrana konvoje** proti smečce lehkých nájezdníků (šalupy/brigy).
3. **Q-loď past:** „kupec" se zblízka odhalí jako válečná loď (hotový zvrat
   z `merch-qship`).
4. **Kurýr:** rychlá honba, kde jde jen o rychlost a vítr.
5. **Obléhání pevnosti / přístavu** (statická pobřežní obrana + ostrovy).
6. **Řadová bitva** dvou linií (formace `formation.ts`).

Svět: dvě koruny (např. **Albion** vs. **Castilla**), neutrální kupci a
**volní piráti** mezi nimi. `data/story.ts` (intro, prology, epilogy vázané
na sebe, více konců dle flagů) reuse — jen nové texty.

---

## 10. Milníky implementace

Doporučené pořadí (každý milník je hratelný/testovatelný stav):

- **M1 — Skelet:** portovat `vec/rng/worker/types/engine/scenario` + prázdná
  mapa moře, loď jede po kurzu, komprese času, jedna dummy mise.
  *(„nudné, ale běží a je deterministické")*
- **M2 — Vítr a plavba:** `wind.ts` + `sail.ts` + křivka bodů plavby + vesla
  + křižování. Indikátor bodu plavby v HUD. *(„hra už je o něčem")*
- **M3 — Ostrovy:** `terrain.ts`, kolize, obeplouvání, mělčiny vs. draft,
  závětří, mlha za ostrovem.
- **M4 — Boj:** boční salvy, tři typy střeliva, raking, kapitulace/boarding.
- **M5 — Kampaň + audio + art:** mise, hudba, grafika, žebříček, story.

Testy: honorverse má rozsáhlou sadu (`tests/*` — physics, engine, mise,
score, …) na Vitest. Framework a styl testů přenést; testy fyziky/plavby psát
nové (křivka bodů plavby, křižování, kolize s ostrovem, dostřel děl).

---

## 11. Otevřené otázky a rozhodnutí

- **Název hry a svět** — jména korun, éra (zlatý věk pirátství / fantasy?),
  tón (realistický vs. odlehčený).
- **Měřítko a jednotky** — honorverse jede v km/s a milionech km; moře chce
  metry/uzly a stovky metrů–kilometry. Zvolit jednotky a přepočítat
  `constants.ts` (kamera/zoom v `plot.ts` na to navazuje).
- **Vlny/proud** — chceme kromě větru i mořský proud a vliv vln na malé lodě,
  nebo to je nad rámec? (Lze přidat později jako další vrstva `wind.ts`.)
- **Hloubka veslového modelu** — jen tah + únava, nebo i rytmus/nájezd galéry
  na taran?
- **Kolik z bodové obrany zachovat** — úplně zrušit, nebo otočná děla/muškety
  proti přiblížení jako lehká vrstva?
- **Boarding jako minihra**, nebo jen výsledek morálky/přesily (jako
  honorverse kapitulace)?
- **Grafika** — zůstat u minimalistického vektoru (rychlé, konzistentní se
  zdrojem), nebo sprity lodí/moře?

---

*Tento dokument je živý plán. Aktualizovat, jak se rozhodnutí z kap. 11
uzavírají a milníky z kap. 10 plní.*
