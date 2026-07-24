/**
 * Větrné pole: globální vítr (evolvuje v čase) + lokální poryvy z hash-šumu
 * + závětří za ostrovy. Deterministické (funkce času a pozice, seed ze scénáře).
 */
import type { SimState, Vec2, Wind, WindConfig } from './types'
import { fromAngle } from './vec'
import { hashNoise } from './rng'
import { leeFactor } from './terrain'
import {
  LEE_DEPTH, LEE_MIN_FACTOR, WIND_ROTATION_SCALE,
  WEATHER_PERIOD, WEATHER_CALM, WEATHER_STORM,
} from './constants'

/**
 * Pomalé „počasí" 0..1 (0 = skoro bezvětří, 1 = bouřka) — deterministická
 * funkce času a seedu. Sinus s dlouhou periodou + jemná nepravidelnost z šumu,
 * takže se klid a bouřka pozvolna střídají a start mise je náhodně někde v cyklu.
 */
export function weatherPhase(seed: number, t: number): number {
  const off = hashNoise(seed * 0.001, 0, 21) * 6.283
  const s = Math.sin(t / WEATHER_PERIOD + off) * 0.5 + 0.5
  const n = hashNoise(seed * 0.001, Math.floor(t / 40) * 0.017, 31)
  return Math.min(1, Math.max(0, s * 0.82 + n * 0.18))
}

/** Storminess 0..1 z rychlosti větru (m/s) — sdílené mapování pro vizuál rendererů. */
export function storminess(speedMps: number): number {
  return Math.min(1, Math.max(0, (speedMps - 4) / 8))
}

/** Globální vítr v čase t z konfigurace (bez lokálních poryvů). */
export function globalWind(cfg: WindConfig, seed: number, t: number): Wind {
  const rot = (cfg.rotationRate ?? 0) * WIND_ROTATION_SCALE * t
  // pomalé kolísání směru i síly z hash-šumu (perioda ~stovky s)
  const gust = cfg.gustiness ?? 0
  const dirWobble = (hashNoise(seed * 0.001, t * 0.01, 7) - 0.5) * gust * 0.6
  const spdWobble = 1 + (hashNoise(seed * 0.001, t * 0.013, 13) - 0.5) * gust * 0.5
  // pomalé střídání bezvětří ↔ bouřka (násobič síly větru)
  const weather = WEATHER_CALM + (WEATHER_STORM - WEATHER_CALM) * weatherPhase(seed, t)
  return {
    dir: cfg.baseDir + rot + dirWobble,
    speed: Math.max(0.5, cfg.baseSpeed * spdWobble * weather),
  }
}

/** Aktualizuje state.wind (voláno enginem každý tick). */
export function updateWind(state: SimState, cfg: WindConfig, seed: number): void {
  state.wind = globalWind(cfg, seed, state.t)
}

/**
 * Předpověď globálního větru za `dtSeconds` sim-času (deterministická).
 * Bez lokálních poryvů/závětří — čistý trend, na který se hráč připraví.
 */
export function forecastWind(state: SimState, dtSeconds: number): Wind {
  return globalWind(state.windCfg, state.seed, state.t + dtSeconds)
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
