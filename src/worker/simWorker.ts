/**
 * Sim worker — simulace běží mimo UI vlákno. Tiká fixním SIM_DT,
 * komprese času = víc kroků na interval. Snapshoty ~20×/s.
 */
import { sim } from '../sim/engine'
import { SIM_DT } from '../sim/constants'
import { SCENARIOS } from '../data/missions'
import type { Scenario, SimState, WorkerInMsg, WorkerOutMsg } from '../sim/types'

const TICK_MS = 50
const MAX_STEPS = 20_000

let state: SimState | null = null
let compression = 0
let stepAcc = 0

const post = (msg: WorkerOutMsg): void => {
  ;(self as unknown as { postMessage(m: unknown): void }).postMessage(msg)
}

function loadScenario(id: string): Scenario {
  return SCENARIOS[id] ?? SCENARIOS.mission01
}

function sendSnapshot(): void {
  if (!state) return
  post({ kind: 'snapshot', state, compression })
  state.events = []
}

self.onmessage = (e: MessageEvent<WorkerInMsg>) => {
  const msg = e.data
  switch (msg.kind) {
    case 'init': {
      const scenario = loadScenario(msg.scenarioId)
      state = sim.create(scenario)
      compression = 0
      stepAcc = 0
      post({ kind: 'ready', scenario })
      sendSnapshot()
      break
    }
    case 'order':
      if (state) sim.applyOrder(state, msg.order)
      break
    case 'setCompression':
      compression = Math.max(0, Math.min(10_000, msg.factor))
      stepAcc = 0
      break
    case 'snapshotRequest':
      sendSnapshot()
      break
  }
}

setInterval(() => {
  if (!state) return
  if (compression > 0 && state.outcome === 'running') {
    stepAcc += (compression * (TICK_MS / 1000)) / SIM_DT
    let steps = Math.floor(stepAcc)
    stepAcc -= steps
    if (steps > MAX_STEPS) { steps = MAX_STEPS; stepAcc = 0 }
    let scanned = 0
    for (let i = 0; i < steps; i++) {
      sim.tick(state, SIM_DT)
      if (state.outcome !== 'running') break
      let hasSlowdown = false
      for (; scanned < state.events.length; scanned++) {
        if (state.events[scanned].slowdown) hasSlowdown = true
      }
      // důležitá událost (hláška, potopení, kapitulace…) SKUTEČNĚ zpomalí na 1×
      // — dropneme kompresi, snapshot ji tak nahlásí UI (kontrakt SimEvent.slowdown)
      if (hasSlowdown) {
        if (compression > 1) compression = 1
        stepAcc = 0
        break
      }
    }
  }
  sendSnapshot()
}, TICK_MS)
