/**
 * Vytáhne z misí a příběhu všechny mluvené repliky do manifestu pro dabing.
 * Zdroj pravdy jsou TS moduly — proto je nejdřív zabundlujeme esbuildem
 * (součást vite) a pak z nich čteme. Výstup: public/vo/manifest.json
 *
 *   node scripts/extract-lines.mjs [--stats]
 *
 * ID replik jsou stabilní (odvozená od mise/triggeru), takže přegenerovat
 * jednu hlášku nevynutí předabování zbytku.
 */
import { build } from 'esbuild'
import { mkdir, writeFile, rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const tmp = resolve(root, 'node_modules/.cache/vo-extract.mjs')

await mkdir(dirname(tmp), { recursive: true })
await build({
  entryPoints: [resolve(root, 'scripts/_lines-entry.ts')],
  outfile: tmp, bundle: true, format: 'esm', platform: 'node', logLevel: 'error',
})
const { SCENARIOS, MISSION_STORY, CAMPAIGN_INTRO, DEFEAT_GENERIC, BARKS } = await import(`file://${tmp}?t=${Date.now()}`)

/** Repliky: { id, speaker, text, kind } */
const lines = []
const seen = new Set()
const push = (id, speaker, text, kind) => {
  const t = (text ?? '').trim()
  if (!t || seen.has(id)) return
  seen.add(id)
  lines.push({ id, speaker, text: t, kind })
}

for (const [missionId, sc] of Object.entries(SCENARIOS)) {
  // briefing mise (vypravěč)
  push(`brief-${missionId}`, 'narrator', sc.briefing, 'briefing')
  // hlášky z triggerů
  for (const trg of sc.triggers ?? []) {
    let n = 0
    for (const a of trg.actions ?? []) {
      if (a.kind !== 'comm' && a.kind !== 'message') continue
      const suffix = n++ ? `-${n}` : ''
      push(`${missionId}-${trg.id}${suffix}`, a.speaker ?? 'narrator', a.text, a.kind)
    }
  }
}

// příběh: prolog / epilog / epilog při prohře
for (const [missionId, st] of Object.entries(MISSION_STORY ?? {})) {
  push(`story-${missionId}-prolog`, 'narrator', st.prolog, 'story')
  push(`story-${missionId}-epilog`, 'narrator', st.epilog, 'story')
  push(`story-${missionId}-epilog-lose`, 'narrator', st.epilogLose, 'story')
}
push('story-intro', 'narrator', CAMPAIGN_INTRO, 'story')
push('story-defeat', 'narrator', DEFEAT_GENERIC, 'story')

// bojové výkřiky ze simulace (generická namluvená varianta k dynamickému textu)
for (const [id, b] of Object.entries(BARKS ?? {})) push(id, b.speaker, b.text, 'bark')

lines.sort((a, b) => a.id.localeCompare(b.id))

const chars = lines.reduce((s, l) => s + l.text.length, 0)
const bySpeaker = {}
const byKind = {}
for (const l of lines) {
  bySpeaker[l.speaker] = (bySpeaker[l.speaker] ?? 0) + l.text.length
  byKind[l.kind] = (byKind[l.kind] ?? 0) + 1
}

if (process.argv.includes('--stats')) {
  console.log(`lines: ${lines.length}  characters: ${chars}`)
  console.log('by kind:', byKind)
  console.log('by speaker (chars):', Object.fromEntries(Object.entries(bySpeaker).sort((a, b) => b[1] - a[1])))
} else {
  const out = resolve(root, 'public/vo/manifest.json')
  await mkdir(dirname(out), { recursive: true })
  await writeFile(out, JSON.stringify({ lines }, null, 2))
  console.log(`wrote ${lines.length} lines (${chars} chars) → public/vo/manifest.json`)
}
await rm(tmp, { force: true })
