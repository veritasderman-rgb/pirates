/** Fyzikální a herní konstanty. Jednotky: metry, sekundy, m/s. Úhly rad. */

/** fixní krok simulace (s) — komprese času = víc kroků na snímek */
export const SIM_DT = 0.25

/** tvrdý strop rychlosti lodi (m/s ≈ 28 uzlů) */
export const SHIP_MAX_SPEED = 14

// ---------- plavba (vítr → tah) ----------

/** globální násobič větrného tahu (ladicí páka celého pohonu) */
export const SAIL_THRUST_K = 0.5
/** referenční síla větru (m/s), při které je windFactor = 1 */
export const WIND_REF_SPEED = 8
/** exponent závislosti tahu na síle větru */
export const WIND_SPEED_EXP = 1.3
/** strop windFactor (v bouři se plachty refují) */
export const WIND_FACTOR_CAP = 2.2

/**
 * Křivka bodů plavby: efektivita plachet podle úhlu přídě OD směru, ODKUD
 * vítr vane (0° = příď přímo do větru). Lineární interpolace mezi body —
 * stejný idiom jako honorverse SIDEWALL_POWER_CURVE.
 *   0–45°  „v kleštích" (irons) — no-go zóna
 *   45°    ostře na vítr (close-hauled)
 *   75°    na půl větru (beam reach)
 *   120°   zadoboční (broad reach) — nejrychlejší
 *   180°   přímo po větru (running) — plachty si stíní
 */
export const POINTS_OF_SAIL: ReadonlyArray<readonly [number, number]> = [
  [0, 0], [40, 0], [45, 0.45], [60, 0.75], [75, 0.9],
  [100, 1.0], [120, 1.0], [150, 0.85], [180, 0.72],
]

/** hranice no-go zóny (°) — pod tímto úhlem od větru plachty neberou */
export const NO_GO_DEG = 45

// ---------- integrace pohybu ----------

/** dopředný odpor jako záloha, když třída neurčí hullDrag */
export const DEFAULT_HULL_DRAG = 0.05
/** boční odpor (kýl) — silný, plachetnice skoro nesmýká */
export const LATERAL_DRAG = 0.9
/** rychlost, nad kterou má loď plnou manévrovatelnost (steerage way, m/s) */
export const STEER_SPEED = 2.0
/** minimální podíl otáčení i bez rychlosti (kormidlo + vesla srovnají) */
export const STEER_MIN_FACTOR = 0.12

// ---------- vesla ----------

/** rychlost čerpání staminy veslařů za s plného veslování */
export const OAR_STAMINA_DRAIN = 0.012
/** rychlost doplňování staminy za s bez veslování */
export const OAR_STAMINA_RECOVER = 0.006

// ---------- autopilot ----------

/** tolerance headingu, při které loď „dorazila" na kurz (m) */
export const ARRIVE_DIST = 40
/** práh zbytkové rychlosti pro arriveAtRest (m/s) */
export const ARRIVE_SPEED = 0.5
/** heading pro přehození plachet při křižování — úhel od větru (°) */
export const TACK_ANGLE_DEG = 48

// ---------- děla ----------

/** rychlost dělové koule (m/s) */
export const BALL_SPEED = 260
/** doba nabití jednoho boku (s) */
export const RELOAD_TIME = 20
/** základní zásah round shot rozptýlí přesnost dle vzdálenosti: plný do této (m) */
export const GUN_POINT_BLANK = 150
/** rozptyl salvy: sigma úhlu roste se vzdáleností (rad na m) */
export const GUN_SPREAD_PER_M = 0.00016
/** základní počet zásahů salvy = děla × ACCURACY_BASE × výcvik × ... */
export const ACCURACY_BASE = 0.55

/** chain shot: násobič poškození trupu (malý) a ráhnoví (velký) */
export const CHAIN_HULL_FACTOR = 0.25
export const CHAIN_RIG_FACTOR = 1.6
/** grape shot: násobič poškození trupu (malý) a posádky (velký) */
export const GRAPE_HULL_FACTOR = 0.2
export const GRAPE_CREW_FACTOR = 1.8

/** raking: palba do přídě/zádě (podél osy) — násobič poškození */
export const RAKE_BONUS = 2.0
/** úhlové okno raku od podélné osy cíle (rad) */
export const RAKE_CONE = 0.6

// ---------- poškození ----------

/**
 * Globální násobič veškerého poškození (ladicí páka tempa bitvy). < 1 =
 * lodě umírají POMALEJI — víc salv, čas sledovat degradaci subsystémů,
 * kapitální lodě nemažou malé jednou salvou. Škáluje trup i subsystémy
 * úměrně, takže „umírání po částech" zůstává, jen pozvolnější.
 */
export const DAMAGE_SCALE = 0.8

/** podíl poškození, který jde do náhodného subsystému místo trupu */
export const SUBSYSTEM_SHARE = 0.45

// ---------- posádka, opravy, morálka ----------

/** rychlost polních oprav subsystémů (podíl/s) */
export const REPAIR_RATE = 0.004
/** strop polní opravy za běhu */
export const REPAIR_CAP = 0.75
/** morálka: pokles za bod ztraceného trupu (podíl hullPoints) */
export const MORALE_HULL_WEIGHT = 0.8
/** morálka: pokles za ztracenou posádku */
export const MORALE_CREW_WEIGHT = 0.5

// ---------- kapitulace a boarding ----------

/** pod tuto morálku loď zvažuje kapitulaci */
export const SURRENDER_MORALE = 0.3
/** základní šance kapitulace za s pod prahem */
export const SURRENDER_CHANCE = 0.15
/** cooldown opakované výzvy na tentýž cíl (s) */
export const SURRENDER_COOLDOWN = 30
/** bonus šance kapitulace při vyřazených dělech / prázdné střelbě */
export const SURRENDER_GUNS_OUT_BONUS = 0.2
/** vzdálenost, na kterou lze zahájit boarding (m) */
export const BOARD_RANGE = 60
/** rychlost obsazení lodi výsadkem (podíl/s převahy) */
export const BOARD_RATE = 0.08

// ---------- dovednostní boj: čitelnost a telegraf ----------

/** práh, pod nímž je subsystém považován za „vyřazený" (hláška + telegraf) */
export const SUBSYSTEM_DISABLED = 0.4
/**
 * Weather gage (návětrná výhoda): maximální zpřesnění boční salvy, když
 * střelec pálí přesně po větru na cíl (kouř se valí na nepřítele, ne do
 * vlastních očí). Škáluje s tím, jak přesně je střelec v návětří.
 */
export const WEATHER_GAGE_ACC = 0.35

// ---------- kontaktní boj (grappling / boarding jako souboj) ----------

/** rychlost postupu obsazení za s při jednotkové převaze výsadku */
export const BOARD_PROGRESS_RATE = 0.17
/** úbytek posádky OBRÁNCE za s aktivního boje (× poměr sil) */
export const BOARD_DEF_CASUALTY = 0.06
/** úbytek posádky ÚTOČNÍKA za s aktivního boje (× poměr sil) */
export const BOARD_ATK_CASUALTY = 0.035
/** pokles morálky obránce za s probíhajícího boardingu */
export const BOARD_DEF_MORALE = 0.055
/** pod tuto posádku útočník výsadek odvolá (boarding selhal, riziko!) */
export const BOARD_ABORT_CREW = 0.12

// ---------- terén ----------

/** poškození trupu za s uváznutí na mělčině / nárazu na břeh */
export const AGROUND_DAMAGE = 0.6
/** odpuzující rychlost při nárazu na břeh (m/s) — loď se zastaví a odrazí */
export const AGROUND_PUSH = 3

/** globální zpomalení rotace větru — pozvolné změny počasí (čitelná předpověď) */
export const WIND_ROTATION_SCALE = 0.5

// ---------- počasí (pomalé střídání bezvětří ↔ bouřka) ----------

/** perioda sinu střídání počasí (s) — plný cyklus klid→bouře→klid ≈ 2π× */
export const WEATHER_PERIOD = 62
/** násobič základní síly větru v bezvětří (klid) */
export const WEATHER_CALM = 0.42
/** násobič základní síly větru v bouřce */
export const WEATHER_STORM = 1.85

// ---------- vítr: závětří ----------

/** hloubka závětří za ostrovem (m) — do této vzdálenosti po větru je slabší */
export const LEE_DEPTH = 800
/** minimální podíl síly větru v úplném závětří */
export const LEE_MIN_FACTOR = 0.25

// ---------- senzory ----------

/** interval aktualizace kontaktní picture (s) — zpoždění hlášení hlídky */
export const SENSOR_UPDATE_INTERVAL = 3
