# Voiceovers (English)

Every spoken line in the game is voiced: mission briefings, story prologues and
epilogues, and in-mission radio chatter. Audio lives in `public/vo/<id>.mp3` and
is generated with ElevenLabs from the game's own text — the TypeScript mission
and story files remain the single source of truth.

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
under speech, and plays each line once per mission. A missing clip is skipped
silently, so the game runs fine without any audio present.
