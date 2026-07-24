/**
 * UIController — propojení plot ↔ panely ↔ bridge. Drží výběr lodi/cíle,
 * mapuje kliky na mapě a akce panelů na Order objekty, obsluhuje klávesy.
 */
import type { Order, ShipState, ShotType, SimState, Broadside } from '../sim/types'
import type { SimBridge } from '../worker/bridge'
import type { Renderer } from './renderer'
import type { PanelAction, Hud } from './panels'
import { bestBroadside } from '../sim/weapons'

const SHOT_ORDER: ShotType[] = ['round', 'chain', 'grape']

const COMP_LADDER = [0, 1, 2, 4, 8]

export class UIController {
  private state: SimState | null = null
  private selectedId: number | null = null
  private targetId: number | null = null
  private shot: ShotType = 'round'
  private compression = 0
  private lastRunning = 1

  constructor(
    private bridge: SimBridge,
    private plot: Renderer,
    private panels: Hud,
    private canvas: HTMLCanvasElement,
  ) {
    this.bindCanvas()
    this.bindKeys()
  }

  handleSnapshot(state: SimState, compression: number): void {
    this.state = state
    this.compression = compression
    if (compression > 0) this.lastRunning = compression
    // výchozí výběr / re-výběr po ztrátě lodi = aktuální velitelská loď hráče
    const sel = state.ships.find(s => s.id === this.selectedId)
    if (!sel || sel.destroyed || sel.side !== 'player') {
      const cmd = state.ships.find(s => s.side === 'player' && s.doctrine === 'player' && !s.destroyed)
        ?? state.ships.find(s => s.side === 'player' && !s.destroyed)
      if (cmd) { this.selectedId = cmd.id; this.plot.follow(cmd.id) }
    }
    this.plot.setState(state)
    this.plot.selectedId = this.selectedId
    this.plot.targetId = this.targetId
    this.plot.compression = compression
    this.panels.render(state, {
      selectedId: this.selectedId, targetId: this.targetId,
      compression, shot: this.shot,
    })
  }

  setCompression(f: number): void {
    this.compression = f
    this.bridge.setCompression(f)
  }

  private selectedShip(): ShipState | null {
    if (!this.state || this.selectedId === null) return null
    return this.state.ships.find(s => s.id === this.selectedId
      && s.side === 'player' && !s.destroyed && !s.surrendered) ?? null
  }

  // ---------- klik na mapě ----------
  private bindCanvas(): void {
    let downAt = { x: 0, y: 0 }
    let moved = false
    this.canvas.addEventListener('pointerdown', e => {
      if (e.button === 2 || e.shiftKey) return
      downAt = { x: e.clientX, y: e.clientY }; moved = false
    })
    window.addEventListener('pointermove', e => {
      if (Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 6) moved = true
    })
    this.canvas.addEventListener('pointerup', e => {
      if (e.button === 2 || e.shiftKey || moved) return
      const rect = this.canvas.getBoundingClientRect()
      const sx = e.clientX - rect.left, sy = e.clientY - rect.top
      this.onClick(sx, sy, e.shiftKey)
    })
  }

  private onClick(sx: number, sy: number, append: boolean): void {
    if (!this.state) return
    const id = this.plot.pick(sx, sy)
    if (id !== null) {
      const sh = this.state.ships.find(s => s.id === id)
      if (sh && sh.side === 'player' && !sh.destroyed) {
        this.selectedId = id; this.plot.follow(id)
      } else {
        this.targetId = id
      }
      return
    }
    // prázdná voda → kurz vybrané vlastní lodi
    const sel = this.selectedShip()
    if (sel) {
      const w = this.plot.s2w(sx, sy)
      this.order({ kind: 'setCourse', shipId: sel.id, dest: w, arriveAtRest: false, append })
    }
  }

  // ---------- akce panelů ----------
  handleAction(a: PanelAction): void {
    if (a.startsWith('comp-')) {
      const f = Number(a.slice(5))
      this.setCompression(f)
      return
    }
    const sel = this.selectedShip()
    if (!sel) return
    switch (a) {
      case 'toggle-sails': this.order({ kind: 'setSails', shipId: sel.id, on: !sel.sailsUp }); break
      case 'trim-up': this.order({ kind: 'setTrim', shipId: sel.id, trim: Math.min(1, sel.trim + 0.15) }); break
      case 'trim-down': this.order({ kind: 'setTrim', shipId: sel.id, trim: Math.max(0, sel.trim - 0.15) }); break
      case 'toggle-oars': this.order({ kind: 'setOars', shipId: sel.id, on: !sel.oaring }); break
      case 'shot-round': this.shot = 'round'; break
      case 'shot-chain': this.shot = 'chain'; break
      case 'shot-grape': this.shot = 'grape'; break
      case 'shot-cycle': this.shot = SHOT_ORDER[(SHOT_ORDER.indexOf(this.shot) + 1) % SHOT_ORDER.length]; break
      case 'fire-port': this.fire(sel, 'port'); break
      case 'fire-stbd': this.fire(sel, 'stbd'); break
      case 'fire': {
        // mobil: jedno tlačítko vypálí bok, který zrovna nese na cíl (jen když nese)
        if (this.targetId === null) break
        const tgt = this.state?.ships.find(s => s.id === this.targetId)
        const side = tgt ? bestBroadside(sel, tgt) : null
        if (side) this.fire(sel, side)
        break
      }
      case 'toggle-auto':
        this.order({ kind: 'setFireControl', shipId: sel.id,
          fc: { mode: sel.fireControl.mode === 'auto' ? 'hold' : 'auto', shot: this.shot } })
        break
      case 'hold': this.order({ kind: 'holdFire', shipId: sel.id }); break
      case 'demand': if (this.targetId !== null) this.order({ kind: 'demandSurrender', shipId: sel.id, targetId: this.targetId }); break
      case 'board': if (this.targetId !== null) this.order({ kind: 'board', shipId: sel.id, targetId: this.targetId }); break
    }
  }

  private fire(sel: ShipState, side: Broadside): void {
    if (this.targetId === null) return
    this.order({ kind: 'fireBroadside', shipId: sel.id, side, targetId: this.targetId, shot: this.shot })
  }

  private order(o: Order): void { this.bridge.sendOrder(o) }

  // ---------- klávesy ----------
  private bindKeys(): void {
    window.addEventListener('keydown', e => {
      if (e.key === ' ') { e.preventDefault(); this.togglePause(); return }
      const sel = this.selectedShip()
      switch (e.key.toLowerCase()) {
        case 'w': if (sel) this.order({ kind: 'setSails', shipId: sel.id, on: !sel.sailsUp }); break
        case 'e': if (sel) this.order({ kind: 'setOars', shipId: sel.id, on: !sel.oaring }); break
        case 'q': if (sel) this.fire(sel, 'port'); break
        case 'r': if (sel) this.fire(sel, 'stbd'); break
        case '1': this.shot = 'round'; break
        case '2': this.shot = 'chain'; break
        case '3': this.shot = 'grape'; break
        case 'a': if (sel) this.order({ kind: 'setFireControl', shipId: sel.id, fc: { mode: sel.fireControl.mode === 'auto' ? 'hold' : 'auto', shot: this.shot } }); break
      }
    })
  }

  private togglePause(): void {
    if (this.compression > 0) this.setCompression(0)
    else this.setCompression(this.lastRunning || 1)
  }
}
