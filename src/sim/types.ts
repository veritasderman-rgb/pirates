/**
 * Sdílený kontrakt simulace. VŠECHNY moduly (wind, sail, physics, weapons,
 * sensors, terrain, scenario, ai, engine, UI) pracují proti těmto typům.
 * Jednotky: metry, sekundy, m/s. Úhly v radiánech. 2D hladina moře, y nahoru.
 */

// ---------- základní ----------

export interface Vec2 { x: number; y: number }

export type Side = 'player' | 'enemy' | 'neutral'

/** Seedovaný PRNG stav (mulberry32) — součást SimState kvůli determinismu. */
export interface RngState { s: number }

/** Druh nákladu do děla (hráč volí) — mapuje na zasažený subsystém. */
export type ShotType = 'round' | 'chain' | 'grape'

/** Bok lodi. */
export type Broadside = 'port' | 'stbd'

// ---------- definice (statická data, src/data) ----------

export interface ShipClassDef {
  id: string
  name: string
  /** SLOOP, BRIG, FRIGATE, GALLEON, GALLEY, LINER, MERCH, FORT */
  hullCode: string
  /** výtlak v tunách (jen lore/škálování) */
  tons: number
  /** plocha plachet — hlavní násobič větrného tahu */
  sailArea: number
  /** loď umí veslovat (do protivětru bez křižování) */
  canRow: boolean
  /** tah vesel (m/s² při plné posádce a stamině); 0 pokud !canRow */
  oarThrust: number
  /** ponor: draft > hloubka mělčiny = uváznutí; malé lodě projedou */
  draft: number
  /** rychlost otáčení kormidla (rad/s při plné rychlosti a zdravém kormidle) */
  turnRate: number
  /** vodní odpor podél kýlu (dopředný drag) — menší = rychlejší doběh */
  hullDrag: number
  /** strukturní body trupu (vyčerpání = potopení) */
  hullPoints: number
  /** počet děl na jeden bok */
  gunsPerBroadside: number
  /** stíhací děla na přídi i zádi (volitelné; chybí = odvodí se z gunsPerBroadside) */
  chaseGuns?: number
  /** poškození jedné dělové koule (round shot) na trup před odečtením */
  gunDamage: number
  /** dostřel děl (m) */
  gunRange: number
  /** velikost posádky (morálka, boarding, obsluha vesel) */
  crew: number
  /** dohled z koše — dosah rozpoznání kontaktu (m) */
  lookoutRange: number
  /** kvalita výcviku 0–1 — násobič přesnosti salvy (asymetrie stran) */
  gunnery: number
  /** lore třídy (rozklikávací detail v UI) */
  lore?: string
}

// ---------- stav simulace ----------

/** Řízení palby lodi. */
export interface FireControl {
  mode: 'hold' | 'auto'
  /** volený náklad do děla */
  shot: ShotType
  /** interní stav enginu: minulý tick byl cíl v dostřelu (hrana pro hlášky) */
  engaged: boolean
}

/** Poškoditelné subsystémy — hodnoty 0–1 (1 = plně funkční). */
export interface Subsystems {
  /** ráhnoví a plachty — škáluje větrný tah */
  rigging: number
  /** kormidlo — škáluje rychlost otáčení */
  rudder: number
  /** děla levoboku — škáluje počet funkčních děl */
  gunsPort: number
  /** děla pravoboku */
  gunsStbd: number
  /** posádka — škáluje vesla, opravy, morálku a boarding */
  crew: number
}

/** Navigační plán autopilota. */
export type NavPlan =
  | { kind: 'course'; dest: Vec2; arriveAtRest: boolean; then?: Vec2[] }
  | { kind: 'intercept'; targetId: number }
  | { kind: 'heading'; heading: number }
  | null

/** Stav lodi. heading = směr přídě (rad). */
export interface ShipState {
  id: number
  side: Side
  classId: string
  name: string
  pos: Vec2
  vel: Vec2
  /** směr přídě (rad) */
  heading: number
  /** plachty vytaženy (false = svinuté/kotva; nulový větrný tah) */
  sailsUp: boolean
  /** nastavení plachet 0–1 (kolik plátna; analogie plynu) */
  trim: number
  /** loď vesluje (pokud canRow) */
  oaring: boolean
  /** stamina veslařů 0–1 (čerpá se veslováním, doplňuje odpočinkem) */
  oarStamina: number
  /** aktivní navigační plán autopilota */
  nav: NavPlan
  /** interní: která hala se právě křižuje (+1 = pravobok na vítr, −1 = levobok) */
  tack: 1 | -1
  subsystems: Subsystems
  hull: number
  /** zásoba dělových nábojů (dohromady pro všechny typy) */
  ammo: number
  /** morálka 0–1 (klesá se ztrátami/poškozením → kapitulace) */
  morale: number
  /** cooldowny nabití děl (s do další salvy) na bok */
  reloadPort: number
  reloadStbd: number
  /** cooldowny stíhacích děl na přídi / zádi */
  reloadBow: number
  reloadStern: number
  destroyed: boolean
  /** loď spustila vlajku (nebojuje, dá se obsadit) */
  surrendered: boolean
  /** loď byla obsazena výsadkem (kořist zajištěna) */
  boarded: boolean
  /** postup obsazování výsadkem 0–1 (roste, když poblíž běží boarding) */
  boardingProgress?: number
  /** aktivní boarding: cíl, na který loď vysílá výsadek (persistentní záměr) */
  boardingTargetId?: number
  /** AI doktrína ('player' = ovládá hráč, 'surrendered' = spustila vlajku) */
  doctrine: string
  /** násobiče statů z upgradů (jen hráčova vlajková loď); chybí = bez úprav */
  mods?: ShipMods
  /** efektivní max trupu (def.hullPoints × hull mod) — pro UI ukazatel */
  hullMax?: number
  fireControl: FireControl
  /** sim čas poslední výzvy ke kapitulaci NA tuto loď (cooldown) */
  lastSurrenderDemandAt: number
  /** popisek pro detail po kliknutí (přístavy, kupci, bóje…) */
  desc?: string
  /**
   * Maskovací třída: dokud je nastavená, senzory hlásí TUTO třídu místo
   * skutečné (Q-loď se tváří jako kupec). Zvrat odhalí přes `revealClass`,
   * který disguise smaže. Chybí-li, hlásí se skutečná classId.
   */
  disguise?: string
}

/** Letící dělová koule. */
export interface Ball {
  id: number
  side: Side
  shot: ShotType
  pos: Vec2
  vel: Vec2
  /** id lodi, na kterou byla salva mířena (pro AUTO souhrn) */
  targetId: number
  /** zbývající dolet (m) — po vyčerpání koule padá do moře */
  range: number
  /** poškození koule (po odečtu palby/výcviku) */
  damage: number
}

// ---------- vítr a terén ----------

/** Aktuální globální vítr (evolvuje v čase, deterministicky ze seedu). */
export interface Wind {
  /** směr, KAM vítr vane (rad) */
  dir: number
  /** síla (m/s) */
  speed: number
}

/** Konfigurace větru ve scénáři. */
export interface WindConfig {
  /** základní směr, kam vane (rad) */
  baseDir: number
  /** základní síla (m/s) */
  baseSpeed: number
  /** rychlost pomalé rotace směru (rad/s) */
  rotationRate?: number
  /** míra poryvů 0–1 (0 = stálý vítr) */
  gustiness?: number
}

/** Ostrov / útes / přístav — statická překážka mapy. */
export interface Island {
  id: string
  name?: string
  kind: 'island' | 'reef' | 'port'
  /** obrys (konvexní polygon, body proti směru hod. ručiček) */
  poly: Vec2[]
  /**
   * reef: hloubka mělčiny (m) — loď s draftem > depth uvázne, menší projede.
   * island/port: nepoužito (pevná zem).
   */
  depth?: number
  /** port: strana, jejíž pobřežní děla brání přístav */
  side?: Side
  desc?: string
}

// ---------- rozkazy (UI/AI -> engine) ----------

export type Order =
  | { kind: 'setCourse'; shipId: number; dest: Vec2; arriveAtRest: boolean; append?: boolean }
  | { kind: 'intercept'; shipId: number; targetId: number }
  | { kind: 'setHeading'; shipId: number; heading: number }
  | { kind: 'setSails'; shipId: number; on: boolean }
  | { kind: 'setTrim'; shipId: number; trim: number }
  | { kind: 'setOars'; shipId: number; on: boolean }
  | { kind: 'fireBroadside'; shipId: number; side: Broadside; targetId: number; shot: ShotType }
  | { kind: 'fireChaser'; shipId: number; end: 'bow' | 'stern'; targetId: number; shot: ShotType }
  | { kind: 'setFireControl'; shipId: number; fc: Partial<Omit<FireControl, 'engaged'>> }
  | { kind: 'holdFire'; shipId: number }
  | { kind: 'demandSurrender'; shipId: number; targetId: number }
  | { kind: 'board'; shipId: number; targetId: number }

// ---------- události (engine -> UI/scenario) ----------

export type Speaker =
  | 'captain' | 'mate' | 'gunner' | 'lookout' | 'bosun'
  | 'enemy-captain' | 'pirate' | 'port' | 'governor'
  // pojmenované postavy kampaně (viz docs/LORE.md, docs/ART_PROMPTS.md)
  | 'admiral' | 'agent' | 'pirate-captain' | 'castilian-admiral'

export interface SimEvent {
  t: number
  kind:
    | 'gunFire' | 'ballHit' | 'ballMiss' | 'shipDestroyed' | 'subsystemHit'
    | 'contactNew' | 'contactClassified' | 'message' | 'objective'
    | 'comm' | 'surrender' | 'board' | 'aground'
  text: string
  shipId?: number
  side?: Side
  count?: number
  /** UI: událost, u které má komprese času spadnout na 1× */
  slowdown?: boolean
  /** světová pozice pro efekt plotu (kouř, výbuch, šplouchnutí) */
  pos?: Vec2
  /** světový úhel efektu (rad) — např. směr boku, ze kterého padla salva */
  dir?: number
  speaker?: Speaker
}

// ---------- kontakty ----------

export interface Contact {
  shipId: number
  pos: Vec2
  vel: Vec2
  /** stáří dat v s (zpoždění hlášení hlídky) */
  age: number
  /** 0 = jen plachta na obzoru, 1 = třída známa, 2 = plná identifikace */
  idQuality: 0 | 1 | 2
  classGuess: string
  /** kontakt zmizel z dohledu — poslední známé zakreslení */
  memory?: boolean
  /** statický objekt (přístav/ostrovní baterie) — poloha se nemění */
  staticObject?: boolean
}

// ---------- scénář / mise ----------

export interface TriggerCondition {
  kind: 'time' | 'distanceBelow' | 'distanceAbove' | 'shipDestroyed' | 'flag'
    | 'shipsDestroyedCount' | 'shipSurrendered' | 'shipBoarded' | 'classified'
    | 'flagNot' | 'hullBelow' | 'aground' | 'allDestroyed'
  t?: number
  shipA?: number
  shipB?: number
  distance?: number
  shipId?: number
  flag?: string
  side?: Side
  count?: number
  fraction?: number
}

export interface TriggerAction {
  kind: 'message' | 'setDoctrine' | 'spawnShip' | 'revealClass' | 'setFlag'
    | 'objectiveComplete' | 'objectiveFail' | 'winMission' | 'loseMission'
    | 'addObjective' | 'comm' | 'setSide'
  text?: string
  shipId?: number
  doctrine?: string
  ship?: ShipSpec
  flag?: string
  objectiveId?: string
  speaker?: Speaker
  side?: Side
}

export interface Trigger {
  id: string
  once: boolean
  fired?: boolean
  conditions: TriggerCondition[]
  actions: TriggerAction[]
}

export interface Objective { id: string; text: string; state: 'open' | 'done' | 'failed' }

/** Specifikace lodi ve scénáři (částečný ShipState + povinné položení). */
export type ShipSpec = Partial<ShipState> & {
  classId: string; side: Side; name: string; pos: Vec2; vel: Vec2
}

export interface Scenario {
  id: string
  title: string
  briefing: string
  seed: number
  wind: WindConfig
  islands?: Island[]
  ships: ShipSpec[]
  objectives: Objective[]
  triggers: Trigger[]
  /** barva hladiny/atmosféry (css) */
  ambient?: string
}

// ---------- celkový stav ----------

export interface SimState {
  t: number
  rng: RngState
  nextId: number
  wind: Wind
  /** konfigurace větru a seed scénáře — pro deterministickou předpověď počasí */
  windCfg: WindConfig
  seed: number
  islands: Island[]
  ships: ShipState[]
  balls: Ball[]
  contacts: Record<Side, Contact[]>
  events: SimEvent[]
  flags: Record<string, boolean>
  objectives: Objective[]
  outcome: 'running' | 'win' | 'lose'
  scenarioId: string
}

// ---------- API enginu ----------

export interface SimApi {
  create(scenario: Scenario): SimState
  tick(state: SimState, dt: number): void
  applyOrder(state: SimState, order: Order): void
}

// ---------- worker bridge ----------

/** Násobiče statů z upgradů vlajkové lodi (ekonomika). Chybějící = 1. */
export interface ShipMods {
  gun?: number      // poškození salvy
  hull?: number     // pevnost trupu
  speed?: number    // tah plachet (rychlost)
  acc?: number      // přesnost (počet zásahů)
  board?: number    // síla výsadku
}

/** Stav opotřebení vlajkové lodi (0..1, 1 = bez poškození). Nese se mezi misemi. */
export interface ShipCondition {
  hull: number
  rigging: number
  rudder: number
  gunsPort: number
  gunsStbd: number
  crew: number
}

export type WorkerInMsg =
  | { kind: 'init'; scenarioId: string; upgrades?: ShipMods; flagshipClass?: string; condition?: ShipCondition }
  | { kind: 'order'; order: Order }
  | { kind: 'setCompression'; factor: number }
  | { kind: 'snapshotRequest' }

export type WorkerOutMsg =
  | { kind: 'snapshot'; state: SimState; compression: number }
  | { kind: 'ready'; scenario: Scenario }
