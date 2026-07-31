/**
 * Vygeneruje bojovou hudbu misí a ambient racků přes ElevenLabs do public/audio/.
 *
 *   ELEVENLABS_API_KEY=... node scripts/gen-music.mjs [--only <idPrefix>]
 *                                                    [--force] [--dry]
 *
 * Klíč se čte JEN z prostředí (nikdy se necommituje). Hotové mp3 se přeskakují,
 * takže opakované spuštění nespotřebovává kvótu — přegenerování vynutí --force
 * nebo smazání konkrétního souboru.
 *
 * Stopy se stříhají do BEZEŠVÉ SMYČKY: konec se prolne přes začátek
 * (acrossfade), takže hudební automat může točit dokola bez slyšitelného
 * střihu. Chybějící soubor hra tiše ignoruje a vezme obecnou music-combat.mp3.
 *
 * Potřebuje ffmpeg: $FFMPEG, node_modules/ffmpeg-static, nebo ffmpeg v PATH.
 */
import { writeFile, mkdir, stat, rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { MISSION_TRACKS, GULL_SFX } from './tracks.mjs'

const run = promisify(execFile)
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = resolve(root, 'public/audio')
const tmpDir = resolve(root, '.audio-tmp')

const key = process.env.ELEVENLABS_API_KEY
if (!key) { console.error('ELEVENLABS_API_KEY is not set'); process.exit(1) }

const args = process.argv.slice(2)
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null
const force = args.includes('--force')
const dry = args.includes('--dry')

/** délka bojové smyčky před sestřihem a délka prolnutí na spoji (s) */
const TRACK_S = 84
const XFADE_S = 4

/** Hotový = existuje A NENÍ prázdný — nedopsaný soubor se musí vyrobit znovu. */
const exists = async p => { try { return (await stat(p)).size > 0 } catch { return false } }
const sleep = ms => new Promise(r => setTimeout(r, ms))

const ffmpegPath = async () => {
  if (process.env.FFMPEG) return process.env.FFMPEG
  try { return (await import('ffmpeg-static')).default } catch { /* není nainstalovaný */ }
  return 'ffmpeg'
}
const FF = await ffmpegPath()
const ff = (...a) => run(FF, ['-y', '-loglevel', 'error', ...a])

const post = async (url, body) => {
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) return Buffer.from(await res.arrayBuffer())
    const txt = (await res.text()).slice(0, 200)
    if (attempt === 4) throw new Error(`HTTP ${res.status} ${txt}`)
    await sleep(attempt * 4000)
  }
}

await mkdir(outDir, { recursive: true })
await mkdir(tmpDir, { recursive: true })

let made = 0, skipped = 0, failed = 0

// ---------- bojové stopy misí (bezešvá smyčka) ----------
const tracks = MISSION_TRACKS.filter(t => !only || t.id.startsWith(only))
for (const [i, track] of tracks.entries()) {
  const dst = resolve(outDir, `mission-${track.id}.mp3`)
  const tag = `[${i + 1}/${tracks.length}] mission-${track.id}`
  if (!force && await exists(dst)) { skipped++; console.log(`skip ${tag}`); continue }
  if (dry) { console.log(`DRY  ${tag}`); continue }
  try {
    const raw = await post('https://api.elevenlabs.io/v1/music', {
      prompt: track.prompt, music_length_ms: TRACK_S * 1000,
    })
    const src = resolve(tmpDir, `${track.id}.mp3`)
    await writeFile(src, raw)
    // smyčka: ocas se prolne přes hlavu, výsledek je o XFADE_S kratší.
    // POZOR: vstup je uvedený DVAKRÁT schválně. Kdyby se [0:a] větvilo na dva
    // trimy, ffmpeg se zablokuje (jeden trim čeká na data, která druhý zahodil)
    // a výsledkem je prázdná stopa. Dva dekodéry = každá větev čte po svém.
    const body = TRACK_S - XFADE_S
    await ff('-i', src, '-i', src, '-filter_complex',
      `[0:a]atrim=0:${body},asetpts=PTS-STARTPTS[a];`
      + `[1:a]atrim=${body}:${TRACK_S},asetpts=PTS-STARTPTS[b];`
      + `[b][a]acrossfade=d=${XFADE_S}:c1=tri:c2=tri[out]`,
      '-map', '[out]', '-c:a', 'libmp3lame', '-b:a', '112k', '-ar', '44100', dst)
    made++
    console.log(`ok   ${tag}`)
  } catch (e) { failed++; console.error(`FAIL ${tag}: ${e.message}`) }
}

// ---------- ambient racků (krátké jednorázové klipy) ----------
const gulls = GULL_SFX.filter(g => !only || g.id.startsWith(only))
for (const g of gulls) {
  const dst = resolve(outDir, `${g.id}.mp3`)
  if (!force && await exists(dst)) { skipped++; console.log(`skip ${g.id}`); continue }
  if (dry) { console.log(`DRY  ${g.id}`); continue }
  try {
    const raw = await post('https://api.elevenlabs.io/v1/sound-generation', {
      text: g.prompt, duration_seconds: 8, prompt_influence: 0.6,
    })
    const src = resolve(tmpDir, `${g.id}.mp3`)
    await writeFile(src, raw)
    // krátký náběh/doznění, ať racci nenaskočí střihem přes hudbu
    await ff('-i', src, '-af', 'afade=t=in:st=0:d=0.5,afade=t=out:st=7:d=1',
      '-c:a', 'libmp3lame', '-b:a', '96k', '-ar', '44100', dst)
    made++
    console.log(`ok   ${g.id}`)
  } catch (e) { failed++; console.error(`FAIL ${g.id}: ${e.message}`) }
}

await rm(tmpDir, { recursive: true, force: true })
console.log(`\ndone — generated ${made}, skipped ${skipped}, failed ${failed}`)
if (failed) process.exit(1)
