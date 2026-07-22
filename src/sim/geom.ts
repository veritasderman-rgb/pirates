/** Geometrie polygonů pro terén (kolize, LOS, průsečíky). */
import type { Vec2 } from './types'
import { sub, dot, len } from './vec'

/** Bod uvnitř polygonu (ray casting). */
export function pointInPoly(p: Vec2, poly: Vec2[]): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j]
    const intersect = (a.y > p.y) !== (b.y > p.y)
      && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x
    if (intersect) inside = !inside
  }
  return inside
}

/** Nejbližší bod na úsečce a→b k bodu p. */
export function closestOnSeg(p: Vec2, a: Vec2, b: Vec2): Vec2 {
  const ab = sub(b, a)
  const l2 = dot(ab, ab)
  if (l2 === 0) return { ...a }
  let t = dot(sub(p, a), ab) / l2
  t = Math.max(0, Math.min(1, t))
  return { x: a.x + ab.x * t, y: a.y + ab.y * t }
}

/** Nejmenší vzdálenost bodu p od obrysu polygonu. */
export function distToPolyEdge(p: Vec2, poly: Vec2[]): number {
  let best = Infinity
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const c = closestOnSeg(p, poly[j], poly[i])
    const d = len(sub(p, c))
    if (d < best) best = d
  }
  return best
}

/** Protíná úsečka a→b polygon? (LOS blokace, dráha koule) */
export function segIntersectsPoly(a: Vec2, b: Vec2, poly: Vec2[]): boolean {
  if (pointInPoly(a, poly) || pointInPoly(b, poly)) return true
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    if (segSeg(a, b, poly[j], poly[i])) return true
  }
  return false
}

/** Protínají se úsečky p1p2 a p3p4? */
export function segSeg(p1: Vec2, p2: Vec2, p3: Vec2, p4: Vec2): boolean {
  const d = (p2.x - p1.x) * (p4.y - p3.y) - (p2.y - p1.y) * (p4.x - p3.x)
  if (d === 0) return false
  const t = ((p3.x - p1.x) * (p4.y - p3.y) - (p3.y - p1.y) * (p4.x - p3.x)) / d
  const u = ((p3.x - p1.x) * (p2.y - p1.y) - (p3.y - p1.y) * (p2.x - p1.x)) / d
  return t >= 0 && t <= 1 && u >= 0 && u <= 1
}

/** Těžiště (centroid) polygonu — průměr vrcholů (stačí pro konvexní). */
export function centroid(poly: Vec2[]): Vec2 {
  let x = 0, y = 0
  for (const v of poly) { x += v.x; y += v.y }
  return { x: x / poly.length, y: y / poly.length }
}

/** Vytvoří přibližně kruhový polygon o n vrcholech (pomocník pro data misí). */
export function circlePoly(cx: number, cy: number, r: number, n = 12, jitter = 0): Vec2[] {
  const pts: Vec2[] = []
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    const rr = r * (1 - jitter * 0.5 + jitter * ((i * 2654435761 % 1000) / 1000))
    pts.push({ x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr })
  }
  return pts
}
