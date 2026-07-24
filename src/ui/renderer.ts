/**
 * Společné rozhraní vykreslovací vrstvy — implementují ho jak 2D TacticalPlot,
 * tak WebGL Plot3D. Umožňuje přepnout renderer beze změny controlleru/mainu.
 */
import type { SimState, Vec2 } from '../sim/types'

export interface Renderer {
  selectedId: number | null
  targetId: number | null
  compression: number
  setState(state: SimState): void
  start(): void
  stop(): void
  follow(id: number | null): void
  /** loď/kontakt nejblíž kliknutí (px), nebo null */
  pick(sx: number, sy: number): number | null
  /** obrazovka → svět (pro klik na vodu = kurz) */
  s2w(sx: number, sy: number): Vec2
  panByScreen(dxPx: number, dyPx: number): void
  zoomStep(factor: number): void
  recenter(): void
}
