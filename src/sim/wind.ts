/**
 * Větrné pole: globální vítr (evolvuje v čase) + lokální poryvy z hash-šumu
 * + závětří za ostrovy. Deterministické (funkce času a pozice, seed ze scénáře).
 */
import type { SimState, Vec2, Wind, WindConfig } from './types'
import { fromAngle } from './vec'
import { hashNoise } from './rng'
import { leeFactor } from './terrain'
import { LEE_DEPTH, LEE_MIN_FACTOR } from './constants'

/** Globální vítr v čase t z konfigurace (bez lokálních poryvů). */
export function globalWind(cfg: WindConfig, seed: number, t: number): Wind {
  const rot = (cfg.rotationRate ?? 0) * t
  // pomalé kolísání směru i síly z hash-šumu (perioda ~stovky s)
  const gust = cfg.gustiness ?? 0
  const dirWobble = (hashNoise(seed * 0.001, t * 0.01, 7) - 0.5) * gust * 0.6
  const spdWobble = 1 + (hashNoise(seed * 0.001, t * 0.013, 13) - 0.5) * gust * 0.5
  return {
    dir: cfg.baseDir + rot + dirWobble,
    speed: Math.max(0.5, cfg.baseSpeed * spdWobble),
  }
}

/** Aktualizuje state.wind (voláno enginem každý tick). */
export function updateWind(state: SimState, cfg: WindConfig, seed: number): void {
  state.wind = globalWind(cfg, seed, state.t)
}

/**
 * Vítr v konkrétním bodě: globální + lokální poryv + závětří ostrovů.
 * Vrací {dir, speed}. Poryv jen mírně mění směr, hlavně sílu.
 */
export function windAt(state: SimState, p: Vec2): Wind {
  const base = state.wind
  const g = state.islands.length ? 0.15 : 0.12
  // lokální poryv z hash-šumu pozice (mřížka ~150 m) a času
  const cell = 150
  const n = hashNoise(Math.floor(p.x / cell), Math.floor(p.y / cell), Math.floor(state.t / 6))
  const gustDir = base.dir + (n - 0.5) * 0.4 * g * 3
  let speed = base.speed * (1 + (n - 0.5) * g)
  // závětří za ostrovy
  const wd = fromAngle(base.dir)
  const lee = leeFactor(state, p, wd, LEE_DEPTH, LEE_MIN_FACTOR)
  speed *= lee
  return { dir: gustDir, speed: Math.max(0, speed) }
}
