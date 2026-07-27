/**
 * Bojová hudba po misích — zadání pro ElevenLabs Music.
 *
 * Každá mise má vlastní bitevní stopu (`public/audio/mission-<id>.mp3`), kterou
 * hudební automat pouští ve stavu `combat` místo obecné `music-combat.mp3`.
 * Klidné stavy (menu/cruise/tension) zůstávají společné, takže se přechody
 * pořád crossfadují do jedné skladby — jen vrchol boje zní v každé misi jinak.
 *
 * Všechny prompty drží JEDNU hudební identitu z docs/AUDIO_PROMPTS.md: D moll
 * (dórský nádech), 4tónový hrdinský motiv D–A–B♭–A, orchestr + taiko + housle a
 * píšťala se šantyovým nádechem, instrumentálně. Mění se jen barva a náboj mise.
 */

/** Společný základ promptu — bez něj by se stopy rozutekly do různých světů. */
const IDENTITY =
  'Instrumental cinematic naval battle score in the golden age of sail. Key of D minor '
  + 'with a dorian colour, 4/4, driving taiko and war drums, staccato strings, heroic low '
  + 'brass, fiddle and tin whistle with a sea-shanty flavour. A recurring four-note heroic '
  + 'motif (D-A-Bb-A) runs through the piece. Orchestral, no vocals, no lyrics. '
  + 'Loopable, consistent tempo, no fade-out at the end. '

export const MISSION_TRACKS = [
  {
    id: 'mission01',
    prompt: IDENTITY + 'Around 110 BPM. A dawn patrol in a narrow strait that turns out '
      + 'wrong: watchful and restrained at first, low strings and a lone drum, then the '
      + 'motif hardens into brass as a suspicion becomes a fight. First blood, not yet war.',
  },
  {
    id: 'mission02',
    prompt: IDENTITY + 'Around 125 BPM. A scrappy running fight to defend a convoy in a '
      + 'tight strait — wild fiddle, snapping hand drums and a raw shanty swagger for the '
      + 'pirate pack, answered by disciplined naval brass. Dirty, quick and dangerous.',
  },
  {
    id: 'mission03',
    prompt: IDENTITY + 'Around 120 BPM. A trap springing shut: a few bars of uneasy quiet, '
      + 'then a shattering brass and percussion hit as a disguised warship runs out her guns. '
      + 'Shock, betrayal, then a furious close-range duel. Sharp accents, sudden dynamics.',
  },
  {
    id: 'mission04',
    prompt: IDENTITY + 'Around 132 BPM. A relentless sea chase under the guns of a fortress: '
      + 'perpetual-motion string ostinato like a hull tearing through water, urgent ticking '
      + 'percussion, the motif snatched between horns and whistle. Breathless pursuit.',
  },
  {
    id: 'mission05',
    prompt: IDENTITY + 'Around 128 BPM. Storming a pirate nest at dawn: brutal, drunken '
      + 'shanty rhythm on heavy drums and accordion, snarling low brass, fire and smoke in '
      + 'the orchestration. Savage and lawless, the naval motif cutting through the din.',
  },
  {
    id: 'mission06',
    prompt: IDENTITY + 'Around 122 BPM. The great fleet action of the campaign: full heroic '
      + 'orchestra, thundering taiko, the four-note motif stated at full power in the brass '
      + 'over surging strings. Broad, noble, overwhelming — the battle everything led to.',
  },
  {
    id: 'mission07',
    prompt: IDENTITY + 'Around 126 BPM. Beating off a reprisal raid on a burning anchorage: '
      + 'defensive and desperate, hammering drums, strings clawing upward, brass calls like '
      + 'alarm bells over the smoke. Grim resolve rather than glory.',
  },
  {
    id: 'mission08',
    prompt: IDENTITY + 'Around 130 BPM. A personal hunt across open water: cold, relentless '
      + 'and predatory, a low ostinato that never lets go, sparse high strings, the motif '
      + 'whispered in muted brass and only released at the very end. Obsessive and dark.',
  },
  {
    id: 'mission09',
    prompt: IDENTITY + 'Around 118 BPM. Breaking a fortified harbour mouth with a ship of the '
      + 'line: enormous slow-swinging weight, deep brass and timpani like three gun decks '
      + 'firing together, stone-and-iron grandeur. Massive, siege-like, implacable.',
  },
  {
    id: 'mission10',
    prompt: IDENTITY + 'Around 124 BPM. Taking a treasure fleet: heat and greed in the '
      + 'orchestration, a southern Castilian colour with guitar-like plucked strings and '
      + 'castanet-flavoured percussion woven into the naval brass. Glittering and rapacious.',
  },
  {
    id: 'mission11',
    prompt: IDENTITY + 'Around 120 BPM. The final battle against an enemy flagship: the '
      + 'largest statement of the score, full orchestra and massed drums, the heroic motif '
      + 'building through the whole piece to a blazing brass climax. Epic, decisive, final.',
  },
  {
    id: 'side01',
    prompt: IDENTITY + 'Around 134 BPM. Running down smugglers in bright sunlight: lighter '
      + 'and roguish, quick fiddle and whistle trading the motif, brisk hand percussion, a '
      + 'wink of accordion. Adventurous and fast rather than deadly — an easy day at sea.',
  },
  {
    id: 'side02',
    prompt: IDENTITY + 'Around 112 BPM. A reckoning with wreckers on a night reef: eerie and '
      + 'vengeful, hollow low drones, scraping strings, a false-light shimmer of harp and '
      + 'glass, the motif turned cold and hard. Dread first, grim satisfaction last.',
  },
]

/** Ambient racků — hraje se náhodně v klidných stavech (víc variant = neopakuje se). */
export const GULL_SFX = [
  { id: 'gulls-1', prompt: 'A few seagulls calling lazily over open water, distant and airy, soft sea breeze, natural outdoor ambience, no music' },
  { id: 'gulls-2', prompt: 'Two or three seagulls crying close overhead then drifting away, gentle waves below, natural outdoor ambience, no music' },
  { id: 'gulls-3', prompt: 'A small flock of seagulls squabbling in the distance over a harbour, faint surf and rigging creak, natural outdoor ambience, no music' },
]
