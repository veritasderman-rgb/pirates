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
  optional?: boolean  // volitelná odbočka — nic ji nevyžaduje, jen bonusová kořist
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
  // volitelné odbočky (bonusová kořist) — otevřou se po dané misi, nic je nevyžaduje
  { id: 'side01', x: 330, y: 430, requires: 'mission02', optional: true },
  { id: 'side02', x: 640, y: 380, requires: 'mission05', optional: true },
]

/**
 * Je mise odemčená? Uzel existuje a jeho prerekvizita je splněná (nebo žádná
 * není). Sdílené pravidlo pro mapu i vstup přes `?mission=` URL — aby záložka
 * ani ručně upravená adresa neobešly postup kampaní.
 */
export function isMissionUnlocked(missionId: string, cleared: readonly string[]): boolean {
  const node = CAMPAIGN_NODES.find(n => n.id === missionId)
  if (!node) return false
  return !node.requires || cleared.includes(node.requires)
}

/** Kolik prvních hlavních misí je zdarma (demo). Zbytek je za jednorázový nákup. */
export const FREE_MISSIONS = 4

/**
 * Je mise za paywallem? Zdarma jsou první FREE_MISSIONS hlavní (nevolitelné)
 * mise; všechno další — hlavní linie od mission05 dál i bonusové ★ odbočky —
 * je součástí placeného odemčení celé hry. Sdílené pravidlo pro mapu i URL guard.
 */
export function isPaidMission(missionId: string): boolean {
  const node = CAMPAIGN_NODES.find(n => n.id === missionId)
  if (!node) return false
  if (node.optional) return true // bonusové odbočky jsou placený obsah
  const mains = CAMPAIGN_NODES.filter(n => !n.optional)
  return mains.findIndex(n => n.id === missionId) >= FREE_MISSIONS
}

/** Dekorativní ostrovy na mapě (jen vizuál). */
export const CAMPAIGN_ISLES: { x: number; y: number; r: number }[] = [
  { x: 130, y: 380, r: 34 }, { x: 360, y: 430, r: 26 }, { x: 500, y: 150, r: 30 },
  { x: 680, y: 320, r: 40 }, { x: 810, y: 90, r: 22 }, { x: 260, y: 150, r: 28 },
  { x: 900, y: 360, r: 32 },
]
