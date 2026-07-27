/**
 * Vygeneruje klipy z scripts/shots.mjs přes Veo (Gemini API) do public/video/.
 *
 *   GEMINI_API_KEY=... node scripts/gen-videos.mjs [--only <idPrefix>] [--force]
 *                                                 [--model <id>] [--dry]
 *
 * Klíč se čte JEN z prostředí (nikdy se necommituje). Hotové mp4 se přeskakují,
 * takže opakované spuštění nespotřebovává kvótu — přegenerování vynutí --force
 * nebo smazání konkrétního souboru.
 *
 * Každý záběr rozpohybuje obrázek z public/img/ (image-to-video), takže video
 * navazuje na tutéž malbu, která slouží jako poster. Výstup je bez zvuku a
 * překódovaný na malou stopáž — jde do gitu vedle hry.
 *
 * Potřebuje ffmpeg: $FFMPEG, node_modules/ffmpeg-static, nebo ffmpeg v PATH.
 */
import { readFile, writeFile, mkdir, stat, rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { ALL_SHOTS } from './shots.mjs'

const run = promisify(execFile)
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const imgDir = resolve(root, 'public/img')
const outDir = resolve(root, 'public/video')
const tmpDir = resolve(root, '.video-tmp')

const key = process.env.GEMINI_API_KEY
if (!key) { console.error('GEMINI_API_KEY is not set'); process.exit(1) }

const args = process.argv.slice(2)
const arg = (n, d) => args.includes(n) ? args[args.indexOf(n) + 1] : d
const only = arg('--only', null)
const model = arg('--model', 'veo-3.1-lite-generate-preview')
const force = args.includes('--force')
const dry = args.includes('--dry')

const API = 'https://generativelanguage.googleapis.com/v1beta'
/** Hotový = existuje A NENÍ prázdný — nedopsaný soubor se musí vyrobit znovu. */
const exists = async p => { try { return (await stat(p)).size > 0 } catch { return false } }
const sleep = ms => new Promise(r => setTimeout(r, ms))

/** ffmpeg: explicitní cesta → ffmpeg-static → PATH. */
const ffmpegPath = async () => {
  if (process.env.FFMPEG) return process.env.FFMPEG
  try { return (await import('ffmpeg-static')).default } catch { /* není nainstalovaný */ }
  return 'ffmpeg'
}
const FF = await ffmpegPath()
const ff = (...a) => run(FF, ['-y', '-loglevel', 'error', ...a])

/** Seed pro Veo: ořez na 16:9 a 1280×720, ať se první snímek nezdeformuje. */
const makeSeed = async (seed, dst) => {
  await ff('-i', resolve(imgDir, seed),
    '-vf', 'scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720', '-q:v', '3', dst)
  return (await readFile(dst)).toString('base64')
}

/** Odešle úlohu a počká na výsledek (Veo běží asynchronně, řádově minuty). */
const generate = async (shot, b64) => {
  const body = {
    instances: [{ prompt: shot.prompt, image: { bytesBase64Encoded: b64, mimeType: 'image/jpeg' } }],
    parameters: { aspectRatio: '16:9', durationSeconds: 6, resolution: '720p' },
  }
  let op = null
  // start úlohy — 429 (kvóta) není chyba scénáře, jen počkej a zkus znovu
  for (let attempt = 1; attempt <= 5 && !op; attempt++) {
    const res = await fetch(`${API}/models/${model}:predictLongRunning?key=${key}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    if (res.ok) { op = (await res.json()).name; break }
    const txt = (await res.text()).slice(0, 200)
    if (attempt === 5) throw new Error(`submit HTTP ${res.status} ${txt}`)
    await sleep(res.status === 429 ? attempt * 30_000 : attempt * 3000)
  }
  // poll
  for (let i = 0; i < 120; i++) {
    await sleep(10_000)
    const res = await fetch(`${API}/${op}?key=${key}`)
    if (!res.ok) continue
    const d = await res.json()
    if (d.error) throw new Error(`op failed: ${JSON.stringify(d.error).slice(0, 200)}`)
    if (!d.done) continue
    const uri = d.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri
    if (!uri) throw new Error(`no video in response: ${JSON.stringify(d.response).slice(0, 200)}`)
    const dl = await fetch(`${uri}${uri.includes('?') ? '&' : '?'}key=${key}`)
    if (!dl.ok) throw new Error(`download HTTP ${dl.status}`)
    return Buffer.from(await dl.arrayBuffer())
  }
  throw new Error('timed out waiting for the operation')
}

/**
 * Překódování do webové stopáže. `loop` záběry se sestříhají do bezešvé
 * smyčky: konec se prolne přes začátek (xfade), takže při opakování nikde
 * není střih. Zvuk zahazujeme — briefingy hrají potichu pod hudbou.
 */
const encode = async (raw, dst, loop) => {
  const src = resolve(tmpDir, 'raw.mp4')
  await writeFile(src, raw)
  const XF = 1 // délka prolnutí smyčky (s)
  // briefingy jsou malé smyčky pod textem, intro se hraje přes celou obrazovku
  const vf = loop ? 'scale=960:540' : 'scale=1280:720'
  const common = ['-an', '-c:v', 'libx264', '-profile:v', 'main', '-pix_fmt', 'yuv420p',
    '-crf', loop ? '30' : '26', '-preset', 'slow', '-movflags', '+faststart']
  if (loop) {
    const dur = Number((await run(FF.replace(/ffmpeg$/, 'ffprobe'), [
      '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', src,
    ]).then(r => r.stdout).catch(() => '6'))) || 6
    const body = Math.max(1, dur - XF)
    // POZOR: vstup je uvedený DVAKRÁT schválně. Kdyby se [0:v] větvilo na dva
    // trimy, ffmpeg se zablokuje (jeden trim čeká na data, která druhý zahodil)
    // a výsledkem je prázdný soubor. Dva dekodéry = každá větev čte po svém.
    // xfade navíc vyžaduje konstantní frame rate, proto fps+settb.
    const chain = `setpts=PTS-STARTPTS,${vf},fps=24,settb=AVTB`
    await ff('-i', src, '-i', src, '-filter_complex',
      `[0:v]trim=0:${body},${chain}[a];`
      + `[1:v]trim=${body}:${dur},${chain}[b];`
      + `[b][a]xfade=transition=fade:duration=${XF}:offset=0[v]`,
      '-map', '[v]', ...common, dst)
  } else {
    await ff('-i', src, '-vf', vf, ...common, dst)
  }
}

await mkdir(outDir, { recursive: true })
await mkdir(tmpDir, { recursive: true })

const todo = ALL_SHOTS.filter(s => !only || s.id.startsWith(only))
let made = 0, skipped = 0, failed = 0
for (const [i, shot] of todo.entries()) {
  const dst = resolve(outDir, `${shot.id}.mp4`)
  const tag = `[${i + 1}/${todo.length}] ${shot.id} ← ${shot.seed}`
  if (!force && await exists(dst)) { skipped++; console.log(`skip ${tag}`); continue }
  if (dry) { console.log(`DRY  ${tag}`); continue }
  try {
    const b64 = await makeSeed(shot.seed, resolve(tmpDir, `${shot.id}-seed.jpg`))
    const raw = await generate(shot, b64)
    await encode(raw, dst, !!shot.loop)
    made++
    console.log(`ok   ${tag}`)
  } catch (e) {
    failed++
    console.error(`FAIL ${tag}: ${e.message}`)
  }
}

await rm(tmpDir, { recursive: true, force: true })
console.log(`\ndone — generated ${made}, skipped ${skipped}, failed ${failed} (model ${model})`)
if (failed) process.exit(1)
