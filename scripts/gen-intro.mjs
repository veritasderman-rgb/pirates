/**
 * Sestaví úvodní film hry — public/video/intro.mp4.
 *
 *   ELEVENLABS_API_KEY=... node scripts/gen-intro.mjs [--force] [--dry]
 *
 * Obraz už leží hotový v public/video/intro-1..4.mp4 (vyrobí gen-videos.mjs).
 * Tenhle skript k němu domíchá zvuk a slepí to dohromady:
 *
 *   1. vypravěč načte čtyři věty (ElevenLabs, TÝŽ hlas jako v celé hře),
 *   2. vygeneruje se hudební podklad na přesnou délku filmu,
 *   3. přidá se ambient racků pod úvodní záběr,
 *   4. hudba se stáhne pod mluvené slovo (ducking) a všechno se smíchá.
 *
 * Komentář je jen ANGLICKY (i v české verzi hry) — je zapečený ve videu.
 * Klíč se čte JEN z prostředí (nikdy se necommituje).
 *
 * Potřebuje ffmpeg: $FFMPEG, node_modules/ffmpeg-static, nebo ffmpeg v PATH.
 */
import { writeFile, mkdir, stat, rm, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { VOICES, MODEL_ID } from './voices.mjs'
import { INTRO_SHOTS } from './shots.mjs'

const run = promisify(execFile)
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const vidDir = resolve(root, 'public/video')
const tmpDir = resolve(root, '.intro-tmp')

const key = process.env.ELEVENLABS_API_KEY
if (!key) { console.error('ELEVENLABS_API_KEY is not set'); process.exit(1) }

const args = process.argv.slice(2)
const force = args.includes('--force')
const dry = args.includes('--dry')

/**
 * Komentář vypravěče. `at` je cílový čas ve filmu (s) — věta sedí na střih
 * svého záběru. Když se předchozí věta protáhne, další se posune až za ni,
 * aby se repliky nikdy nepřekryly.
 */
const NARRATION = [
  { at: 1.2, text: 'We return to the age of the King\'s officers.' },
  { at: 6.9, text: 'Mighty ships carried two crowns across the world\'s oceans — Albion, and Castilla.' },
  { at: 12.7, text: 'Between them lie a hundred islands, a shifting wind, and pirates who answer to no flag at all.' },
  { at: 18.5, text: 'Where the powers meet, the guns decide. Take your ship, Captain. Halcyon is waiting.' },
]

const MUSIC_PROMPT =
  'Instrumental cinematic main title for a golden-age-of-sail naval adventure. Key of D '
  + 'minor with a dorian colour, around 100 BPM. Opens noble and spacious — solo tin '
  + 'whistle and warm strings carrying a four-note heroic motif (D-A-Bb-A) over distant '
  + 'surf — then war drums and taiko enter and the motif builds into full heroic brass for '
  + 'a battle climax, ending on a strong sustained chord. Orchestral, sea-shanty flavour, '
  + 'no vocals, no lyrics.'

/** hlasitosti mixu — hudba jde pod komentář dolů, ať je vypravěči rozumět */
const MUSIC_VOL = 0.55
const MUSIC_DUCK = 0.18
const GULL_VOL = 0.22
const VO_VOL = 1.0
const TAIL_S = 2.2   // doznění a stmívačka za poslední větou

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

/** Délka média — ffmpeg ji vypíše do stderr, ffprobe nepotřebujeme. */
const duration = async file => {
  const { stderr } = await run(FF, ['-i', file, '-f', 'null', '-']).catch(e => e)
  const m = /time=(\d+):(\d+):(\d+\.\d+)/g
  let last = null, hit
  while ((hit = m.exec(stderr ?? '')) !== null) last = hit
  if (!last) throw new Error(`cannot read duration of ${file}`)
  return (+last[1]) * 3600 + (+last[2]) * 60 + (+last[3])
}

const el = async (url, body, accept = 'audio/mpeg') => {
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'xi-api-key': key, 'Content-Type': 'application/json', Accept: accept },
      body: JSON.stringify(body),
    })
    if (res.ok) return Buffer.from(await res.arrayBuffer())
    const txt = (await res.text()).slice(0, 200)
    if (attempt === 4) throw new Error(`HTTP ${res.status} ${txt}`)
    await sleep(attempt * 4000)
  }
}

const dst = resolve(vidDir, 'intro.mp4')
if (!force && await exists(dst)) {
  console.log('intro.mp4 already exists — use --force to rebuild')
  process.exit(0)
}
for (const s of INTRO_SHOTS) {
  if (!await exists(resolve(vidDir, `${s.id}.mp4`))) {
    console.error(`missing ${s.id}.mp4 — run: node scripts/gen-videos.mjs --only intro`)
    process.exit(1)
  }
}
if (dry) { console.log('DRY — would build intro.mp4 from', INTRO_SHOTS.map(s => s.id).join(', ')); process.exit(0) }

await mkdir(tmpDir, { recursive: true })

// ---------- 1. obraz: slepení čtyř záběrů ----------
const list = INTRO_SHOTS.map(s => `file '${resolve(vidDir, `${s.id}.mp4`)}'`).join('\n')
await writeFile(resolve(tmpDir, 'concat.txt'), list)
const silent = resolve(tmpDir, 'silent.mp4')
await ff('-f', 'concat', '-safe', '0', '-i', resolve(tmpDir, 'concat.txt'), '-c', 'copy', silent)
const videoLen = await duration(silent)
console.log(`video  ${videoLen.toFixed(2)}s from ${INTRO_SHOTS.length} shots`)

// ---------- 2. komentář ----------
const voice = VOICES.narrator
const lines = []
let cursor = 0
for (const [i, n] of NARRATION.entries()) {
  const file = resolve(tmpDir, `vo-${i + 1}.mp3`)
  const raw = await el(`https://api.elevenlabs.io/v1/text-to-speech/${voice.id}`, {
    text: n.text, model_id: MODEL_ID,
    voice_settings: { stability: voice.stability, similarity_boost: 0.75, style: voice.style, use_speaker_boost: true },
  })
  await writeFile(file, raw)
  const len = await duration(file)
  const at = Math.max(n.at, cursor)     // nikdy nemluv přes předchozí větu
  cursor = at + len + 0.45
  lines.push({ file, at, len })
  console.log(`vo ${i + 1}  @${at.toFixed(2)}s  ${len.toFixed(2)}s  "${n.text.slice(0, 48)}…"`)
}

// film končí 2,2 s po poslední větě (nebo s obrazem, je-li delší)
const speechEnd = lines[lines.length - 1].at + lines[lines.length - 1].len
const totalLen = Math.max(videoLen, speechEnd + TAIL_S)
console.log(`total  ${totalLen.toFixed(2)}s`)

// ---------- 3. hudba a racci ----------
const musicFile = resolve(tmpDir, 'music.mp3')
await writeFile(musicFile, await el('https://api.elevenlabs.io/v1/music', {
  prompt: MUSIC_PROMPT, music_length_ms: Math.round(totalLen * 1000),
}))
const gullFile = resolve(tmpDir, 'gulls.mp3')
await writeFile(gullFile, await el('https://api.elevenlabs.io/v1/sound-generation', {
  text: 'A few seagulls calling over open water with a soft sea breeze and distant surf, natural outdoor ambience, no music',
  duration_seconds: 8, prompt_influence: 0.6,
}))

// ---------- 4. mix ----------
// Obraz: je-li komentář delší než záběry, poslední snímek se podrží; na konci
// stmívačka do černé. Zvuk: hudba + racci + věty na svých časech, hudba se
// automaticky stahuje pod mluvené slovo (sidechaincompress).
const fadeAt = Math.max(0, totalLen - 1.6)
const voInputs = lines.flatMap(l => ['-i', l.file])
const voPrep = lines.map((l, i) =>
  `[${i + 3}:a]adelay=${Math.round(l.at * 1000)}|${Math.round(l.at * 1000)},volume=${VO_VOL}[v${i}]`).join(';')
const voMix = lines.map((_, i) => `[v${i}]`).join('')

await ff(
  '-i', silent, '-i', musicFile, '-i', gullFile, ...voInputs,
  '-filter_complex',
  // obraz
  `[0:v]tpad=stop_mode=clone:stop_duration=${Math.max(0, totalLen - videoLen).toFixed(2)},`
  + `fade=t=out:st=${fadeAt.toFixed(2)}:d=1.6,trim=0:${totalLen.toFixed(2)},setpts=PTS-STARTPTS[vout];`
  // komentář → jedna stopa. asplit je nutný: jedna větev řídí ducking hudby,
  // druhá jde do výsledného mixu (jeden label smí ffmpeg spotřebovat jen jednou)
  + `${voPrep};${voMix}amix=inputs=${lines.length}:normalize=0,`
  + `aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo,asplit=2[voduck][vomix];`
  // racci pod úvodní záběr
  + `[2:a]adelay=1200|1200,volume=${GULL_VOL}[gulls];`
  // hudba se stahuje pod komentář
  + `[1:a]volume=${MUSIC_VOL},`
  + `aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo,atrim=0:${totalLen.toFixed(2)}[m0];`
  + `[m0][voduck]sidechaincompress=threshold=0.05:ratio=6:attack=20:release=600:makeup=1[mduck];`
  + `[mduck][gulls][vomix]amix=inputs=3:normalize=0:dropout_transition=0[amix];`
  // srovnání hlasitosti: mix po duckingu vychází tišší než hudba ve hře,
  // tak ho zvedneme k plné úrovni a limiterem uřízneme špičky
  + `[amix]volume=4.5dB,alimiter=limit=0.95,`
  + `afade=t=out:st=${fadeAt.toFixed(2)}:d=1.6,atrim=0:${totalLen.toFixed(2)}[aout]`,
  '-map', '[vout]', '-map', '[aout]',
  '-c:v', 'libx264', '-profile:v', 'main', '-pix_fmt', 'yuv420p', '-crf', '26', '-preset', 'slow',
  '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', dst,
)

await rm(tmpDir, { recursive: true, force: true })
const size = (await readFile(dst)).length
console.log(`\ndone — ${dst} (${(size / 1024 / 1024).toFixed(1)} MB, ${totalLen.toFixed(1)}s)`)
console.log(`music duck ${MUSIC_VOL} → ~${MUSIC_DUCK} under narration`)
