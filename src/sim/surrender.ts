/**
 * Kapitulace a boarding. Nízká morálka → loď spustí vlajku. Sousední
 * nepřítel ji pak může obsadit výsadkem (kořist zajištěna). Pro piráty
 * je zajmutí lodi cennější než potopení.
 */
import type { ShipState, SimState } from './types'
import {
  SURRENDER_MORALE, SURRENDER_CHANCE, SURRENDER_COOLDOWN,
  SURRENDER_GUNS_OUT_BONUS, BOARD_RANGE, BOARD_PROGRESS_RATE,
  BOARD_DEF_CASUALTY, BOARD_ATK_CASUALTY, BOARD_DEF_MORALE, BOARD_ABORT_CREW,
} from './constants'
import { rand } from './rng'
import { dist } from './vec'
import { effectiveGuns } from './weapons'
import { hostileTo } from './util'

/** Progres obsazení lodi — sledovaný mimo SimState (per stav). */
const boardProgress = new WeakMap<SimState, Record<number, number>>()

const progressMap = (state: SimState): Record<number, number> => {
  let m = boardProgress.get(state)
  if (!m) { m = {}; boardProgress.set(state, m) }
  return m
}

/** Zbraně vyřazené / bez munice? (bonus ke kapitulaci) */
export function weaponsOut(ship: ShipState): boolean {
  return ship.ammo <= 0 || (effectiveGuns(ship, 'port') + effectiveGuns(ship, 'stbd')) <= 0
}

/** Přímá výzva ke kapitulaci (rozkaz hráče). */
export function demandSurrender(state: SimState, from: ShipState, targetId: number): void {
  const target = state.ships.find(s => s.id === targetId && !s.destroyed)
  if (!target || target.surrendered) return
  if (state.t - target.lastSurrenderDemandAt < SURRENDER_COOLDOWN) return
  target.lastSurrenderDemandAt = state.t

  // šance dle morálky, poškození a přesily
  let chance = (1 - target.morale) * 0.6
  if (weaponsOut(target)) chance += SURRENDER_GUNS_OUT_BONUS
  if (target.hull < 0.35 * (100)) chance += 0.15
  if (rand(state.rng) < chance) {
    strike(state, target)
  } else {
    state.events.push({
      t: state.t, kind: 'comm', side: target.side, speaker: 'enemy-captain',
      text: `${target.name} odmítá spustit vlajku!`,
    })
  }
}

/** Loď spustí vlajku a přestane bojovat. */
export function strike(state: SimState, ship: ShipState): void {
  ship.surrendered = true
  ship.doctrine = 'surrendered'
  ship.sailsUp = false
  ship.oaring = false
  ship.fireControl.mode = 'hold'
  ship.fireControl.engaged = false
  state.events.push({
    t: state.t, kind: 'surrender', shipId: ship.id, side: ship.side, pos: { ...ship.pos },
    slowdown: true, speaker: 'enemy-captain',
    text: `${ship.name} spustila vlajku a vzdává se!`,
  })
}

/** Automatická kapitulace při zlomené morálce (voláno každý tick). */
export function updateSurrender(state: SimState, dt: number): void {
  for (const ship of state.ships) {
    if (ship.destroyed || ship.surrendered || ship.doctrine === 'player') continue
    if (ship.morale >= SURRENDER_MORALE) continue
    let chance = SURRENDER_CHANCE * dt * (1 + (SURRENDER_MORALE - ship.morale) * 3)
    if (weaponsOut(ship)) chance += SURRENDER_GUNS_OUT_BONUS * dt
    if (rand(state.rng) < chance) strike(state, ship)
  }
}

/** Síla útočníkova výsadku vs. odpor obránce (vzdaná loď se skoro nebrání). */
function boardStrength(from: ShipState, target: ShipState): { atk: number; def: number } {
  const atk = Math.max(0.03, from.subsystems.crew) * Math.max(0.15, from.morale) * (from.mods?.board ?? 1)
  const def = target.surrendered ? 0.08
    : Math.max(0.03, target.subsystems.crew) * Math.max(0.1, target.morale)
  return { atk, def }
}

/** Šance, že výsadek loď obsadí (0..1) — pro UI telegraf i hlášku před akcí. */
export function boardingOdds(from: ShipState, target: ShipState): number {
  const { atk, def } = boardStrength(from, target)
  return atk / (atk + def)
}

/**
 * Rozkaz boarding: nastaví persistentní záměr obsadit cíl. Vlastní kontaktní
 * boj pak řeší `updateBoarding` každý tick (postup + ztráty na obou stranách).
 */
export function board(state: SimState, from: ShipState, targetId: number): void {
  const target = state.ships.find(s => s.id === targetId && !s.destroyed)
  if (!target || target.boarded) return
  if (dist(from.pos, target.pos) > BOARD_RANGE) {
    if (from.doctrine === 'player') {
      state.events.push({
        t: state.t, kind: 'message', shipId: from.id, side: from.side, speaker: 'mate',
        text: 'Na boarding musíme přiléhnout bok k boku — přibliž se na ~60 m!',
      })
    }
    return
  }
  const already = from.boardingTargetId === targetId
  from.boardingTargetId = targetId
  // ohlaš šance před vrhem háků (risk/odměna: hráč vidí, do čeho jde)
  if (from.doctrine === 'player' && !already) {
    const odds = Math.round(boardingOdds(from, target) * 100)
    const verdict = target.surrendered ? 'vzdala se — jistá kořist'
      : odds >= 65 ? 'převaha je naše' : odds >= 45 ? 'vyrovnané — riskantní!' : 'jsme v nevýhodě — hrozí ztráty!'
    state.events.push({
      t: state.t, kind: 'comm', shipId: from.id, side: from.side, speaker: 'bosun', slowdown: true,
      text: `Háky na ${target.name}! Naše šance ~${odds} % — ${verdict}`,
    })
  }
}

/**
 * Kontaktní boj výsadků (voláno každý tick). Loď s aktivním `boardingTargetId`
 * postupuje v obsazení cíle; dokud se cíl nevzdal, obě posádky krvácí — slabší
 * ztrácí víc. Vykrvácí-li útočník, výsadek se stáhne (boarding selhal).
 */
export function updateBoarding(state: SimState, dt: number): void {
  const m = progressMap(state)
  for (const from of state.ships) {
    const tid = from.boardingTargetId
    if (tid === undefined) continue
    if (from.destroyed || from.surrendered) { from.boardingTargetId = undefined; continue }
    const target = state.ships.find(s => s.id === tid)
    if (!target || target.destroyed || target.boarded) { from.boardingTargetId = undefined; continue }
    // odpluli od sebe — výsadek vyčkává na opětovné přilehnutí (záměr drží)
    if (dist(from.pos, target.pos) > BOARD_RANGE) continue

    const { atk, def } = boardStrength(from, target)
    const contested = !target.surrendered

    // krvavý boj muže proti muži — poměr sil rozhoduje o ztrátách
    if (contested) {
      const ratio = Math.max(0.3, Math.min(3, atk / (def + 0.01)))
      target.subsystems.crew = Math.max(0, target.subsystems.crew - BOARD_DEF_CASUALTY * ratio * dt)
      from.subsystems.crew = Math.max(0, from.subsystems.crew - BOARD_ATK_CASUALTY / ratio * dt)
      target.morale = Math.max(0, target.morale - BOARD_DEF_MORALE * dt)
      // útočník příliš vykrvácel → stáhni výsadek (boarding selhal)
      if (from.subsystems.crew <= BOARD_ABORT_CREW) {
        from.boardingTargetId = undefined
        m[target.id] = 0
        target.boardingProgress = 0
        if (from.doctrine === 'player') {
          state.events.push({
            t: state.t, kind: 'comm', shipId: from.id, side: from.side, speaker: 'bosun', slowdown: true,
            text: `Výsadek zatlačen zpět — stahujeme se z ${target.name}! Změkči ji palbou.`,
          })
        }
        continue
      }
    }

    const adv = Math.max(0.05, atk - def * 0.5)
    m[target.id] = (m[target.id] ?? target.boardingProgress ?? 0) + BOARD_PROGRESS_RATE * adv * dt
    target.boardingProgress = Math.min(1, m[target.id])
    if (m[target.id] >= 1) {
      target.boarded = true
      target.surrendered = true
      target.doctrine = 'surrendered'
      target.sailsUp = false
      from.boardingTargetId = undefined
      state.events.push({
        t: state.t, kind: 'board', shipId: target.id, side: from.side, pos: { ...target.pos },
        slowdown: true, speaker: 'captain',
        text: `${target.name} obsazena! Kořist je naše.`,
      })
    }
  }
}
