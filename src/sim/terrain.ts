/**
 * Terén: ostrovy, útesy a přístavy. Poskytuje kolizi (draft vs. mělčina),
 * blokaci dohledu (LOS) a blokaci dělových koulí, a data pro závětří.
 */
import type { Island, ShipState, Vec2, SimState } from './types'
import { pointInPoly, distToPolyEdge, segIntersectsPoly, closestOnSeg, centroid } from './geom'
import { sub, norm, len, scale, add } from './vec'
import { SHIP_CLASSES } from '../data/defs'

/** Je bod nad pevnou zemí (ostrov/přístav — ne útes)? */
export function onLand(state: SimState, p: Vec2): boolean {
  for (const isl of state.islands) {
    if (isl.kind === 'reef') continue
    if (pointInPoly(p, isl.poly)) return true
  }
  return false
}

/**
 * Uvázne loď na této pozici? Pevná zem vždy; útes jen když draft > depth.
 * Vrací ostrov, na kterém vázne, nebo null.
 */
export function groundingAt(state: SimState, ship: ShipState, p: Vec2): Island | null {
  const def = SHIP_CLASSES[ship.classId]
  const draft = def?.draft ?? 2
  for (const isl of state.islands) {
    if (isl.kind === 'reef') {
      if ((isl.depth ?? 0) < draft && pointInPoly(p, isl.poly)) return isl
    } else if (pointInPoly(p, isl.poly)) {
      return isl
    }
  }
  return null
}

/** Blokuje pevná zem přímku a→b (LOS / dráha koule)? */
export function blocksLine(state: SimState, a: Vec2, b: Vec2): boolean {
  for (const isl of state.islands) {
    if (isl.kind === 'reef') continue // útesy jsou pod hladinou, nekryjí
    if (segIntersectsPoly(a, b, isl.poly)) return true
  }
  return false
}

/**
 * Odpuzující vektor od nejbližšího břehu do vzdálenosti margin (pro AI/fyziku
 * — jemné odstrčení, aby loď břeh objela místo nabíjení do něj). Null = daleko.
 */
export function shoreRepulsion(state: SimState, p: Vec2, margin: number): Vec2 | null {
  let best: { d: number; away: Vec2 } | null = null
  for (const isl of state.islands) {
    if (isl.kind === 'reef') continue
    const d = distToPolyEdge(p, isl.poly)
    if (d < margin) {
      const away = pointInPoly(p, isl.poly)
        ? norm(sub(p, centroid(isl.poly)))
        : norm(sub(p, nearestEdgePoint(p, isl.poly)))
      if (!best || d < best.d) best = { d, away }
    }
  }
  return best ? scale(best.away, 1 - best.d / margin) : null
}

/** Nejbližší bod obrysu polygonu k p. */
function nearestEdgePoint(p: Vec2, poly: Vec2[]): Vec2 {
  let best = poly[0], bd = Infinity
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const c = closestOnSeg(p, poly[j], poly[i])
    const d = len(sub(p, c))
    if (d < bd) { bd = d; best = c }
  }
  return best
}

/**
 * Násobek síly větru v bodě kvůli závětří ostrovů (1 = plný vítr).
 * Bod ve stínu ostrova po směru větru dostane oslabení. windDir = kam vane.
 */
export function leeFactor(state: SimState, p: Vec2, windDir: Vec2, depth: number, minFactor: number): number {
  let factor = 1
  for (const isl of state.islands) {
    if (isl.kind === 'reef') continue
    const c = centroid(isl.poly)
    const rel = sub(p, c)
    // vzdálenost po směru větru za ostrovem (kladná = v závětří)
    const downwind = rel.x * windDir.x + rel.y * windDir.y
    if (downwind <= 0) continue
    // boční odchylka od osy větru
    const lateral = Math.abs(rel.x * -windDir.y + rel.y * windDir.x)
    const islandR = radiusOf(isl.poly, c)
    if (downwind < depth && lateral < islandR * 1.3) {
      const f = minFactor + (1 - minFactor) * (downwind / depth)
      factor = Math.min(factor, f)
    }
  }
  return factor
}

/** Poloměr ostrova (max vzdálenost vrcholu od těžiště) — pro cache lze rozšířit. */
export function radiusOf(poly: Vec2[], c: Vec2): number {
  let r = 0
  for (const v of poly) r = Math.max(r, len(sub(v, c)))
  return r
}

/** Přiblíží pozici lodi zpět na vodu, pokud najela na zem (jednoduché odstrčení). */
export function pushOffLand(state: SimState, ship: ShipState, prev: Vec2): void {
  const isl = groundingAt(state, ship, ship.pos)
  if (!isl) return
  // vrať na předchozí (vodní) pozici a zabrzdi
  ship.pos = { ...prev }
  ship.vel = scale(ship.vel, 0.2)
  // jemné odstrčení od těžiště
  const away = norm(sub(ship.pos, centroid(isl.poly)))
  ship.pos = add(ship.pos, scale(away, 1))
}
