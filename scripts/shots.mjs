/**
 * Filmový scénář — seznam klipů, které se generují přes Veo (Gemini API).
 *
 * Každý záběr rozpohybuje JEDEN obrázek z public/img/ (image-to-video), takže
 * video vždy sedí na tu samou malbu, kterou hráč vidí jako statický poster.
 * Tím se drží jednotný výtvarný styl a chybějící video nikdy nevadí — spadne
 * se zpátky na obrázek.
 *
 *   id      výsledný soubor public/video/<id>.mp4
 *   seed    zdrojový obrázek v public/img/ (první snímek)
 *   prompt  popis pohybu (styl držíme stejný ve všech promptech)
 *   loop    true = záběr se sestříhá do bezešvé smyčky (briefingy)
 */

/** Společná stylová hlavička — ať všechny klipy vypadají jako jeden film. */
const STYLE =
  'Cinematic oil painting come to life, age of sail, painterly brushwork and film grain, '
  + 'muted period palette, no text, no captions, no modern objects. '

export const INTRO_SHOTS = [
  {
    id: 'intro-1',
    seed: 'scene-frigate-under-sail.jpg',
    prompt: STYLE
      + 'A royal frigate under full canvas runs before a fresh breeze on the open sea. '
      + 'Sails billow and strain, the ensign snaps at the gaff, the hull rises and falls '
      + 'through a long swell, spray bursting from the bow. Slow majestic camera push in '
      + 'from astern, low above the water. Grand and stately, no combat yet.',
  },
  {
    id: 'intro-2',
    seed: 'scene-command-deck.jpg',
    prompt: STYLE
      + 'On the quarterdeck of a frigate in action: naval officers in blue and gold coats, '
      + 'the captain pointing across the water as he gives an order, a drummer beating to '
      + 'quarters, a midshipman with a speaking trumpet, powder smoke drifting across the '
      + 'deck. Coats and rigging move in the wind. Slow camera drift, shallow depth of field.',
  },
  {
    id: 'intro-3',
    seed: 'scene-frigate-duel.jpg',
    prompt: STYLE
      + 'Two ships of the line locked broadside to broadside in a heavy sea. Their gun '
      + 'decks erupt in rolling orange flashes, thick powder smoke boils across the water '
      + 'between the hulls, torn rigging whips, the sea heaves under both ships. Slow '
      + 'cinematic dolly across the gap. Thunderous and violent.',
  },
  {
    id: 'intro-4',
    seed: 'scene-boarding-assault.jpg',
    prompt: STYLE
      + 'A boarding action at the rails of two ships grappled together: sailors swarm '
      + 'across with cutlasses and boarding pikes, smoke and embers in the air, the naval '
      + 'ensign streaming above the melee, both hulls grinding on the swell. Handheld '
      + 'camera, chaotic energy, then settling on the colours flying overhead.',
  },
]

/** Briefing mise → záběr; klidnější pohyb, sestříhá se do smyčky pod text. */
export const BRIEF_SHOTS = [
  {
    id: 'brief-mission00', seed: 'scene-frigate-under-sail.jpg', loop: true,
    prompt: STYLE + 'A trim sloop stands out of a sheltered anchorage on a bright '
      + 'training morning, sails filling and drawing, calm green water sliding past '
      + 'her side, a headland and signal mast beyond. Slow camera push in. Fresh, '
      + 'orderly, everything still ahead.',
  },
  {
    id: 'brief-mission01', seed: 'scene-merchantman-mist.jpg', loop: true,
    prompt: STYLE + 'A lone merchantman drifts at anchor in a still morning mist, sails '
      + 'hanging slack, her reflection trembling on glassy water, thin fog curling past '
      + 'the hull. Almost motionless. Very slow camera push in. Quiet and uneasy.',
  },
  {
    id: 'brief-mission02', seed: 'scene-convoy-defence.jpg', loop: true,
    prompt: STYLE + 'A frigate holds station to windward of her convoy in a rising sea, '
      + 'her broadside flashing at a raider closing from leeward, merchantmen labouring '
      + 'astern under grey squall clouds. Slow lateral camera drift, heavy swell.',
  },
  {
    id: 'brief-mission03', seed: 'scene-gundeck-broadside.jpg', loop: true,
    prompt: STYLE + 'Below on the gun deck, a gun crew runs out a cannon and fires through '
      + 'the port: recoil snaps the carriage back on its tackles, muzzle flash and smoke '
      + 'blow out over the water, lantern light swings, men heave on the ropes. Slow push '
      + 'along the deck. Cramped, hot and tense.',
  },
  {
    id: 'brief-mission04', seed: 'scene-coastal-fortress.jpg', loop: true,
    prompt: STYLE + 'A stone coastal fortress on a black rock takes the sea head-on, heavy '
      + 'surf exploding white against the cliffs, storm cloud racing behind the battlements, '
      + 'distant sails on the horizon. Slow camera rise. Cold and forbidding.',
  },
  {
    id: 'brief-mission05', seed: 'scene-pirate-sloop-storm.jpg', loop: true,
    prompt: STYLE + 'A battered pirate sloop drives through a black squall under a torn '
      + 'skull-and-bones flag, patched sails straining, crew crouched along the rail, spray '
      + 'sheeting over the bow. Slow camera drift, wild sea. Menacing.',
  },
  {
    id: 'brief-mission06', seed: 'scene-castilian-frigate-storm.jpg', loop: true,
    prompt: STYLE + 'A great red-and-gold ship of the line stands out of a storm under full '
      + 'sail, gun ports open along three decks, banners streaming, heavy sea breaking along '
      + 'her side. Slow camera push in from ahead. Overwhelming and proud.',
  },
  {
    id: 'brief-mission07', seed: 'scene-fireship-night.jpg', loop: true,
    prompt: STYLE + 'At night a fireship burns down on two anchored warships: flames roar up '
      + 'her rigging, embers stream across black water, firelight dances on the hulls and '
      + 'the smoke overhead. Slow camera drift across the burning hull. Hellish orange glow.',
  },
  {
    id: 'brief-mission08', seed: 'scene-moonlit-chase.jpg', loop: true,
    prompt: STYLE + 'A moonlit chase on a rough sea: a small fast cutter runs hard with a '
      + 'dark square-rigged ship looming astern, moonlight breaking through cloud on the '
      + 'wave crests, spray driving over both decks. Slow tracking camera. Cold and urgent.',
  },
  {
    id: 'brief-mission09', seed: 'scene-fortress-bombardment.jpg', loop: true,
    prompt: STYLE + 'Warships stand in close under a cliff-top fortress and trade fire with '
      + 'it: guns flash on the battlements and along the ships\' sides, shot throws tall white '
      + 'splashes among the hulls, smoke rolls down the rock. Slow lateral camera move. Loud '
      + 'and desperate.',
  },
  {
    id: 'brief-mission10', seed: 'scene-silver-galleon.jpg', loop: true,
    prompt: STYLE + 'A heavy treasure galleon, gilded and deep-laden, wallows slowly through '
      + 'a long swell under towering canvas, gold leaf catching the light on her carved stern, '
      + 'water streaming from her sides. Slow camera arc around the hull. Rich and ponderous.',
  },
  {
    id: 'brief-mission11', seed: 'scene-castilian-three-decker.jpg', loop: true,
    prompt: STYLE + 'An enormous four-decked flagship lies across the roadstead, gun ports '
      + 'open in row upon row, admiral\'s banners streaming from every mast, sea heaving along '
      + 'her towering side. Slow camera rise up the hull. Monumental and threatening.',
  },
  {
    id: 'brief-side01', seed: 'scene-port-unloading.jpg', loop: true,
    prompt: STYLE + 'A busy quay: dockers roll barrels and swing crates ashore from a moored '
      + 'merchantman, a revenue officer checks a manifest among the crowd, gulls wheel over '
      + 'the masts, cloud shadow moving across the wet stone. Slow camera drift. Everyday and '
      + 'bustling, with something being hidden.',
  },
  {
    id: 'brief-side02', seed: 'scene-rescue-dawn.jpg', loop: true,
    prompt: STYLE + 'At dawn a ship\'s boat pulls survivors from a cold sea while a wrecked '
      + 'hull settles on the reef behind them, oars working, men hauling bodies over the '
      + 'gunwale, pale gold light spreading along the horizon. Slow camera drift. Grim and '
      + 'exhausted.',
  },
]

export const ALL_SHOTS = [...INTRO_SHOTS, ...BRIEF_SHOTS]
