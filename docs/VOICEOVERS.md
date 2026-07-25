# Voiceovers (English + Czech)

The game is fully bilingual (EN/CS — see the 🌐 toggle on the campaign map, or
`?lang=cs|en`). Every line exists in **both** languages with the **same cast**:
English clips live in `public/vo/<id>.mp3`, Czech in `public/vo/cs/<id>.mp3`
(the multilingual ElevenLabs model speaks Czech with the same voices). Czech
line text comes from the translation dictionary in `src/i18n/` — the manifest
carries `text` (EN) and `textCs`, and `--lang cs` refuses to run if any Czech
translation is missing, so the Czech build can never silently speak English.

```bash
ELEVENLABS_API_KEY=... npm run vo:gen              # English clips
ELEVENLABS_API_KEY=... npm run vo:gen -- --lang cs # Czech clips
```


Every spoken line is voiced: mission briefings, story prologues and epilogues,
scripted mission dialogue, and the combat chatter the simulation itself emits.
Audio lives in `public/vo/<id>.mp3` and is generated with ElevenLabs from the
game's own text — the TypeScript mission and story files remain the single
source of truth.

Two kinds of line, because they behave differently:

- **Scripted lines** (briefings, story, trigger dialogue) — the recorded audio
  matches the on-screen text word for word, and each plays once per mission.
- **Combat barks** (`bark-*`, from `src/data/barks.ts`) — raking, silenced guns,
  boarding and so on. Their on-screen text is *dynamic* (`${ship.name}`, odds,
  hit zone), so it cannot be pre-rendered; the voice line is a **generic**
  version of the same beat. The spoken line carries the emotion, the text
  carries the specifics. Barks may repeat (25 s cooldown per line) and are
  dropped rather than queued if something else is already speaking — a bark
  arriving after a 40 s briefing would be stale.

## One character = one voice

Casting lives in `scripts/voices.mjs` and is **fixed**: the admiral sounds the
same in mission 2 and mission 11. Changing a `voice_id` means regenerating all
of that character's lines.

| Speaker | Voice | Role |
|---|---|---|
| `narrator` | George (British, warm storyteller) | briefings + story |
| `admiral` | Daniel (British, formal) | Albion high command |
| `port` | Alice (British, professional) | Port Command |
| `mate` | Bill (old, wise) | your first mate |
| `bosun` | Adam (firm) | bosun |
| `gunner` | Harry (rough) | gun crew |
| `lookout` | Charlie (young, energetic) | masthead |
| `agent` | Edward (dark, low) | intelligence |
| `pirate-captain` | Callum (husky trickster) | Brotherhood |
| `pirate` | Liam | pirate crew |
| `castilian-admiral` | Alberto (Latin) | Castilla command |
| `enemy-captain` | Brian (deep) | enemy captains |

## How line IDs work

IDs are derived, never hand-written, so missions carry no audio bookkeeping:

- `brief-<missionId>` — mission briefing
- `story-<missionId>-prolog` / `-epilog` / `-epilog-lose`
- `<missionId>-<triggerId>` — first spoken line of a trigger;
  second and later get `-2`, `-3`, …
- `bark-<name>` — combat barks, keyed by hand in `src/data/barks.ts`

`updateTriggers()` in `src/sim/scenario.ts` computes the same ID and puts it on
the emitted event as `voiceId`; `scripts/extract-lines.mjs` uses the identical
scheme. `tests/voiceover.test.ts` asserts the two never drift and that every
manifest line has a real mp3.

## Regenerating

```bash
npm run vo:stats                     # how many lines / characters (quota check)
npm run vo:extract                   # rebuild public/vo/manifest.json from the game text
ELEVENLABS_API_KEY=... npm run vo:gen        # generate missing clips only
ELEVENLABS_API_KEY=... npm run vo:gen -- --only mission03   # just one mission
ELEVENLABS_API_KEY=... npm run vo:gen -- --force            # re-record everything
```

Existing mp3s are skipped, so re-running costs no quota. To re-record a single
line, delete its mp3 and run `vo:gen`. **The API key is read from the environment
only — never commit it.**

After editing mission or story text, run `vo:extract` and `vo:gen`: new lines get
new clips, and a changed text keeps its old clip until you delete it (the test
suite will still pass, so re-record deliberately).

## Playback

`AudioManager.speak(id)` queues clips so lines never overlap, ducks the music
under speech, and plays each scripted line once per mission. A missing clip is
skipped silently, so the game runs fine without any audio present.

Two details worth knowing:

- **Autoplay.** Entering a mission straight from `?mission=…` (bookmarks, the
  REPLAY button) means narration is queued before any user gesture, and the
  browser rejects `play()`. The queue is *held*, not dropped, and `unlock()`
  starts it on the first click — so the briefing is never silently lost.
- **The epilogue never cuts a line.** A trigger can fire dialogue and
  `winMission` in the same snapshot (e.g. mission 3's Q-ship surrender). The
  outcome screen queues the epilogue behind whatever is speaking instead of
  stopping it.
