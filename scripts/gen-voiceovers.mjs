/**
 * Vygeneruje anglické voiceovery přes ElevenLabs podle public/vo/manifest.json.
 * Hlas se bere z obsazení (scripts/voices.mjs) — jedna postava = jeden hlas.
 *
 *   ELEVENLABS_API_KEY=... node scripts/gen-voiceovers.mjs [--only <idPrefix>] [--force] [--dry]
 *
 * Klíč se čte JEN z prostředí (nikdy se necommituje). Už existující mp3 se
 * přeskakují, takže opakované spuštění nespotřebovává kvótu — přegenerování
 * vynutí --force nebo smazání konkrétního souboru.
 */
import { readFile, writeFile, mkdir, access } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { VOICES, DEFAULT_VOICE, MODEL_ID } from './voices.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = resolve(root, 'public/vo')

const key = process.env.ELEVENLABS_API_KEY
if (!key) { console.error('ELEVENLABS_API_KEY is not set'); process.exit(1) }

const args = process.argv.slice(2)
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null
const lang = args.includes('--lang') ? args[args.indexOf('--lang') + 1] : 'en'
const force = args.includes('--force')
const dry = args.includes('--dry')

const { lines } = JSON.parse(await readFile(resolve(outDir, 'manifest.json'), 'utf8'))
const todo = lines.filter(l => !only || l.id.startsWith(only))
// cs klipy žijí v public/vo/cs/ a čtou textCs; chybějící překlad je tvrdá
// chyba, ať česká verze nikdy tiše nemluví anglicky
const langDir = lang === 'cs' ? resolve(outDir, 'cs') : outDir
if (lang === 'cs') {
  const missing = todo.filter(l => !l.textCs)
  if (missing.length) {
    console.error('missing Czech translations for:', missing.map(l => l.id).join(', '))
    process.exit(1)
  }
}
await mkdir(langDir, { recursive: true })

const exists = async p => { try { await access(p); return true } catch { return false } }
const sleep = ms => new Promise(r => setTimeout(r, ms))

let made = 0, skipped = 0, failed = 0, chars = 0
for (const [i, line] of todo.entries()) {
  const file = resolve(langDir, `${line.id}.mp3`)
  if (!force && await exists(file)) { skipped++; continue }
  const voice = VOICES[line.speaker] ?? DEFAULT_VOICE
  const text = lang === 'cs' ? line.textCs : line.text
  const tag = `[${i + 1}/${todo.length}] ${lang}:${line.id} (${line.speaker} → ${voice.name}, ${text.length}c)`
  if (dry) { console.log(`DRY ${tag}`); chars += text.length; continue }

  let ok = false
  for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
    try {
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice.id}`, {
        method: 'POST',
        headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          model_id: MODEL_ID,
          voice_settings: {
            stability: voice.stability ?? 0.5,
            similarity_boost: 0.75,
            style: voice.style ?? 0.2,
            use_speaker_boost: true,
          },
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status} ${(await res.text()).slice(0, 160)}`)
      await writeFile(file, Buffer.from(await res.arrayBuffer()))
      ok = true; made++; chars += text.length
      console.log(`ok  ${tag}`)
    } catch (e) {
      if (attempt === 3) { failed++; console.error(`FAIL ${tag}: ${e.message}`) }
      else await sleep(attempt * 2000)
    }
  }
  await sleep(250) // šetrné tempo vůči API
}

console.log(`\ndone — generated ${made}, skipped ${skipped}, failed ${failed}, ~${chars} characters used`)
if (failed) process.exit(1)
