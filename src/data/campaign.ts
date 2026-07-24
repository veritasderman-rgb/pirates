/**
 * Kampaňová mapa — rozložení misí jako přístavů na moři. Hráč pluje po trase
 * od jihozápadu k severovýchodu; splněná mise odemkne navazující uzel.
 * Souřadnice jsou ve viewBoxu mapy (viz main.ts showCampaignMap), 0..1000 × 0..600.
 * `requires` = id mise, kterou je nutné nejdřív splnit (páteř kampaně).
 */
export interface CampaignNode {
  id: string          // = missionId
  x: number
  y: number
  requires?: string   // prerekvizita (splněná mise), jinak dostupné od začátku
}

export const CAMPAIGN_NODES: CampaignNode[] = [
  { id: 'mission01', x: 90, y: 500 },
  { id: 'mission02', x: 210, y: 430, requires: 'mission01' },
  { id: 'mission03', x: 165, y: 300, requires: 'mission02' },
  { id: 'mission04', x: 300, y: 250, requires: 'mission03' },
  { id: 'mission05', x: 420, y: 340, requires: 'mission04' },
  { id: 'mission06', x: 540, y: 250, requires: 'mission05' },
  { id: 'mission07', x: 470, y: 130, requires: 'mission06' },
  { id: 'mission08', x: 620, y: 175, requires: 'mission07' },
  { id: 'mission09', x: 745, y: 285, requires: 'mission08' },
  { id: 'mission10', x: 850, y: 175, requires: 'mission09' },
  { id: 'mission11', x: 920, y: 80, requires: 'mission10' },
]

/** Dekorativní ostrovy na mapě (jen vizuál). */
export const CAMPAIGN_ISLES: { x: number; y: number; r: number }[] = [
  { x: 130, y: 380, r: 34 }, { x: 360, y: 430, r: 26 }, { x: 500, y: 150, r: 30 },
  { x: 680, y: 320, r: 40 }, { x: 810, y: 90, r: 22 }, { x: 260, y: 150, r: 28 },
  { x: 900, y: 360, r: 32 },
]
