/** Skóre mise — deterministické z průběhu. */

export interface ScoreInput {
  missionId: string
  outcome: 'win' | 'lose'
  t: number
  objectivesDone: number
  ownLosses: number
  prizesTaken: number   // zajaté (obsazené) lodě — pro piráty cenné
  enemySunk: number
}

export interface ScoreLine { label: string; points: number }
export interface ScoreResult { total: number; breakdown: ScoreLine[] }

export function scoreMission(inp: ScoreInput): ScoreResult {
  const b: ScoreLine[] = []
  if (inp.outcome === 'win') b.push({ label: 'Vítězství', points: 1000 })
  b.push({ label: `Splněné cíle ×${inp.objectivesDone}`, points: inp.objectivesDone * 250 })
  b.push({ label: `Zajaté lodě ×${inp.prizesTaken}`, points: inp.prizesTaken * 300 })
  b.push({ label: `Potopení nepřátelé ×${inp.enemySunk}`, points: inp.enemySunk * 120 })
  const timeBonus = Math.max(0, 600 - Math.round(inp.t))
  b.push({ label: 'Rychlost', points: timeBonus })
  b.push({ label: `Vlastní ztráty ×${inp.ownLosses}`, points: -inp.ownLosses * 400 })
  const total = Math.max(0, b.reduce((s, l) => s + l.points, 0))
  return { total, breakdown: b }
}
