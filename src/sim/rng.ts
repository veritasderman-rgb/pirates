/**
 * Deterministický seedovaný PRNG (mulberry32).
 * Stav žije v SimState.rng — replaye a žebříček jsou tak férové.
 */
import type { RngState } from './types'

/** Vrátí náhodné číslo v [0, 1) a posune stav rng.s. */
export function rand(rng: RngState): number {
  rng.s = (rng.s + 0x6d2b79f5) >>> 0
  let t = rng.s
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

/** Náhodné číslo v [lo, hi). */
export const randRange = (rng: RngState, lo: number, hi: number): number =>
  lo + rand(rng) * (hi - lo)

/**
 * Deterministický hash-šum ze tří čísel do [0,1) — BEZ posunu stavu rng.
 * Pro plynulá pole (vítr, poryvy), kde chceme hodnotu jako funkci pozice/času.
 */
export function hashNoise(a: number, b: number, c: number): number {
  let h = 2166136261 >>> 0
  for (const v of [a, b, c]) {
    // rozprostři reálné číslo do 32bit mřížky
    const q = Math.floor(v * 1000) | 0
    h = Math.imul(h ^ (q & 0xffff), 16777619) >>> 0
    h = Math.imul(h ^ ((q >>> 16) & 0xffff), 16777619) >>> 0
  }
  h ^= h >>> 13
  h = Math.imul(h, 0x5bd1e995) >>> 0
  h ^= h >>> 15
  return (h >>> 0) / 4294967296
}
