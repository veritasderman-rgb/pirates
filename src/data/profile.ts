/**
 * Kapitánský profil — trvalá ekonomika mezi misemi (localStorage).
 * Kořist a potopení dávají dublony; za ně se kupují upgrady vlajkové lodi,
 * které si hráč nese celou kampaní. Deterministické, čistě klientské.
 */
import type { ShipMods } from '../sim/types'

export type UpKey = 'gun' | 'hull' | 'speed' | 'acc' | 'board'
export type Upgrades = Record<UpKey, number>

export interface Profile {
  money: number
  up: Upgrades
  cleared: string[]   // id misí, které už byly poprvé dokončeny (plná odměna jen jednou)
  flagship: string    // třída aktuálně velené vlajkové lodi
  fleet: string[]     // vlastněné trupy (loděnice)
}

const KEY = 'pirates.profile.v1'
/** Startovní trup — mrštná šalupa, jako v úvodní misi. */
export const STARTER_HULL = 'sloop-albion'
const fresh = (): Profile => ({
  money: 0, up: { gun: 0, hull: 0, speed: 0, acc: 0, board: 0 }, cleared: [],
  flagship: STARTER_HULL, fleet: [STARTER_HULL],
})

export function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return fresh()
    const p = JSON.parse(raw) as Partial<Profile>
    const f = fresh()
    const fleet = Array.isArray(p.fleet) && p.fleet.length ? p.fleet : f.fleet
    const flagship = p.flagship && fleet.includes(p.flagship) ? p.flagship : fleet[0]
    return { ...f, ...p, up: { ...f.up, ...p.up }, fleet, flagship }
  } catch { return fresh() }
}
export function saveProfile(p: Profile): void {
  try { localStorage.setItem(KEY, JSON.stringify(p)) } catch { /* ignore */ }
}

/** Definice upgradů: název, popis, max úroveň, cena další úrovně, efekt/úroveň. */
export const UPGRADE_DEFS: Record<UpKey, {
  name: string; desc: string; max: number; base: number; step: number; per: number
}> = {
  gun: { name: 'Těžší děla', desc: 'silnější boční salva', max: 5, base: 120, step: 110, per: 0.12 },
  hull: { name: 'Zesílený trup', desc: 'víc pevnosti trupu', max: 5, base: 120, step: 110, per: 0.15 },
  acc: { name: 'Cvičení dělmistrů', desc: 'přesnější palba (víc zásahů)', max: 5, base: 100, step: 90, per: 0.15 },
  speed: { name: 'Měděné dno', desc: 'vyšší rychlost', max: 4, base: 150, step: 130, per: 0.09 },
  board: { name: 'Nájezdníci', desc: 'silnější výsadek (rychlejší boarding)', max: 4, base: 130, step: 120, per: 0.22 },
}
export const UP_ORDER: UpKey[] = ['gun', 'hull', 'acc', 'speed', 'board']

/** Cena povýšení z úrovně `level` na `level+1`. */
export function upgradeCost(key: UpKey, level: number): number {
  const d = UPGRADE_DEFS[key]
  return d.base + level * d.step
}

/** Násobiče statů pro sim z úrovní upgradů. */
export function modsFrom(up: Upgrades): ShipMods {
  return {
    gun: 1 + up.gun * UPGRADE_DEFS.gun.per,
    hull: 1 + up.hull * UPGRADE_DEFS.hull.per,
    acc: 1 + up.acc * UPGRADE_DEFS.acc.per,
    speed: 1 + up.speed * UPGRADE_DEFS.speed.per,
    board: 1 + up.board * UPGRADE_DEFS.board.per,
  }
}

/**
 * Loděnice — trupy Královského námořnictva, které si hráč může koupit jako
 * vlajkovou loď. Pořadí = eskalace síly i ceny. Startovní šalupu má zdarma;
 * dražší trupy unesou víc děl a pevnějsí bok, ale hůř projedou mělčinu.
 * Cena je v dublonech; jméno/staty tahá UI ze SHIP_CLASSES podle classId.
 */
export interface ShipyardEntry { classId: string; price: number; blurb: string }
export const SHIPYARD: ShipyardEntry[] = [
  { classId: 'sloop-albion', price: 0,
    blurb: 'Startovní trup. Mrštná, mělký ponor, do bezvětří nasadí vesla. Slabá salva.' },
  { classId: 'brig-albion', price: 280,
    blurb: 'Vyvážená pracantka: silnější salva a dost posádky na výsadek. Nevesluje.' },
  { classId: 'frigate-albion', price: 720,
    blurb: 'Rychlá válečná loď — 13 děl na bok, nejlepší výcvik, daleký dohled.' },
  { classId: 'liner-albion', price: 1600,
    blurb: 'Řadová loď — plovoucí pevnost. Zdrcující bok a tlustý pancíř, ale těžkopádná.' },
]

export const shipEntry = (classId: string): ShipyardEntry | undefined =>
  SHIPYARD.find(s => s.classId === classId)

/** Odměna za misi: kořist (zajaté) vydělá výrazně víc než potopené. */
export interface MissionResult {
  missionId: string; win: boolean; enemySunk: number; prizes: number; objectivesDone: number
}
export interface RewardBreak { label: string; coins: number }

export function computeReward(r: MissionResult, alreadyCleared: boolean): { total: number; parts: RewardBreak[] } {
  if (!r.win) return { total: 0, parts: [] }
  const parts: RewardBreak[] = [{ label: 'Vítězství', coins: 100 }]
  if (r.enemySunk) parts.push({ label: `Potopeno (${r.enemySunk}×)`, coins: r.enemySunk * 45 })
  if (r.prizes) parts.push({ label: `Kořist — zajato (${r.prizes}×)`, coins: r.prizes * 140 })
  if (r.objectivesDone) parts.push({ label: `Splněné cíle (${r.objectivesDone}×)`, coins: r.objectivesDone * 40 })
  let total = parts.reduce((s, p) => s + p.coins, 0)
  if (alreadyCleared) { total = Math.round(total * 0.4); parts.push({ label: 'Opakování (×0,4)', coins: 0 }) }
  return { total, parts }
}
