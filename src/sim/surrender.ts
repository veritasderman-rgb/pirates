/**
 * Kapitulace a boarding. Nízká morálka → loď spustí vlajku. Sousední
 * nepřítel ji pak může obsadit výsadkem (kořist zajištěna). Pro piráty
 * je zajmutí lodi cennější než potopení.
 */
import type { ShipState, SimState } from './types'
import {
  SURRENDER_MORALE, SURRENDER_CHANCE, SURRENDER_COOLDOWN,
  SURRENDER_GUNS_OUT_BONUS, BOARD_RANGE, BOARD_RATE,
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

/** Rozkaz boarding: zahájí/pokračuje obsazování cíle, je-li dost blízko. */
export function board(state: SimState, from: ShipState, targetId: number): void {
  const target = state.ships.find(s => s.id === targetId && !s.destroyed)
  if (!target || target.boarded) return
  if (dist(from.pos, target.pos) > BOARD_RANGE) {
    if (from.doctrine === 'player') {
      state.events.push({
        t: state.t, kind: 'message', shipId: from.id, side: from.side, speaker: 'mate',
        text: 'Na boarding musíme přiléhnout bok k boku — přibliž se!',
      })
    }
    return
  }
  // převaha posádky útočníka vs. obránce (vzdaná loď se skoro nebrání)
  // upgrade výsadku (board) zvyšuje sílu útočníkovy posádky
  const atk = from.subsystems.crew * from.morale * (from.mods?.board ?? 1)
  const def = target.surrendered ? 0.1 : target.subsystems.crew * target.morale
  const adv = Math.max(0.05, atk - def * 0.5)
  const m = progressMap(state)
  m[target.id] = (m[target.id] ?? 0) + BOARD_RATE * adv
  target.boardingProgress = Math.min(1, m[target.id])
  if (m[target.id] >= 1) {
    target.boarded = true
    target.surrendered = true
    target.doctrine = 'surrendered'
    target.sailsUp = false
    state.events.push({
      t: state.t, kind: 'board', shipId: target.id, side: from.side, pos: { ...target.pos },
      slowdown: true, speaker: 'captain',
      text: `${target.name} obsazena! Kořist je naše.`,
    })
  } else if (from.doctrine === 'player') {
    state.events.push({
      t: state.t, kind: 'message', shipId: from.id, side: from.side, speaker: 'bosun',
      text: `Výsadek na palubě nepřítele… (${Math.round(m[target.id] * 100)} %)`,
    })
  }
}
