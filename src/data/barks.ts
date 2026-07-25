/**
 * Bojové výkřiky — hlášky, které nevydává scénář, ale sama simulace (raking,
 * umlčené subsystémy, boarding). Jejich TEXT je dynamický (dosazuje jméno lodi,
 * šance…), takže nejde nahrát jako pevný klip; namluvená je proto GENERICKÁ
 * varianta, zatímco na obrazovce zůstává konkrétní znění. Tak to dělají hry:
 * hlas nese emoci, text nese detail.
 *
 * Id se používá přímo jako voiceId (public/vo/<id>.mp3).
 */
export interface Bark { speaker: string; text: string }

export const BARKS: Record<string, Bark> = {
  'bark-flagship-fallen':   { speaker: 'admiral', text: 'The flagship has fallen! Take up the colours — lead us on, Captain!' },
  'bark-refuse-strike':     { speaker: 'enemy-captain', text: 'We will not strike our colours!' },
  'bark-board-range':       { speaker: 'mate', text: 'To board we must lay alongside — close to sixty metres!' },
  'bark-grapples':          { speaker: 'bosun', text: 'Grapples away! Boarders, with me!' },
  'bark-boarding-repulsed': { speaker: 'bosun', text: 'Boarding party thrown back! Soften her with fire first!' },
  'bark-raking-dealt':      { speaker: 'gunner', text: 'Raking broadside! We tore her stem to stern!' },
  'bark-raking-taken':      { speaker: 'mate', text: 'They are raking us end to end! Turn your bow out of the line!' },
  // umlčené/rozstřílené subsystémy cíle
  'bark-disable-rudder':    { speaker: 'gunner', text: 'Her rudder is shot away — she cannot steer!' },
  'bark-disable-rigging':   { speaker: 'gunner', text: 'Her rigging is in tatters — she is losing speed!' },
  'bark-disable-gunsPort':  { speaker: 'gunner', text: 'Her port guns are silenced!' },
  'bark-disable-gunsStbd':  { speaker: 'gunner', text: 'Her starboard guns are silenced!' },
  'bark-disable-crew':      { speaker: 'gunner', text: 'Her crew is decimated — board her now!' },
}

/** voiceId pro umlčený subsystém (fallback: bez hlasu, text stačí). */
export const disableBark = (k: string): string | undefined =>
  BARKS[`bark-disable-${k}`] ? `bark-disable-${k}` : undefined
