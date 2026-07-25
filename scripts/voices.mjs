/**
 * Obsazení: mluvčí → hlas ElevenLabs. JEDNA POSTAVA = JEDEN HLAS, napevno,
 * ať admirál zní stejně v misi 2 i v misi 11. Změna voice_id u postavy znamená
 * přegenerovat všechny její repliky (smaž její mp3 a spusť gen-voiceovers).
 */
export const VOICES = {
  // vypravěč — briefingy a příběh (většina textu): teplý britský vypravěč
  narrator:            { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George',  stability: 0.50, style: 0.15 },
  // Albion (hráčova strana)
  admiral:             { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel',  stability: 0.55, style: 0.20 },
  port:                { id: 'Xb7hH8MSUJpSbSDYk0k2', name: 'Alice',   stability: 0.55, style: 0.10 },
  mate:                { id: 'pqHfZKP75CvOlQylNhV4', name: 'Bill',    stability: 0.45, style: 0.25 },
  bosun:               { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam',    stability: 0.45, style: 0.30 },
  gunner:              { id: 'SOYHLrjzK2X1ezoPC6cr', name: 'Harry',   stability: 0.40, style: 0.40 },
  lookout:             { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie', stability: 0.40, style: 0.40 },
  agent:               { id: 'goT3UYdM9bhm0n2lmKQx', name: 'Edward',  stability: 0.55, style: 0.25 },
  // protivníci
  'pirate-captain':    { id: 'N2lVS1w4EtoT3dr4eOWO', name: 'Callum',  stability: 0.40, style: 0.45 },
  pirate:              { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam',    stability: 0.40, style: 0.40 },
  'castilian-admiral': { id: 'l1zE9xgNpUTaQCZzpNJa', name: 'Alberto', stability: 0.50, style: 0.30 },
  'enemy-captain':     { id: 'nPczCjzI2devNBz1zQrb', name: 'Brian',   stability: 0.45, style: 0.30 },
}

/** Fallback pro neznámého mluvčího — ať generování nikdy nespadne. */
export const DEFAULT_VOICE = VOICES.narrator
export const MODEL_ID = 'eleven_multilingual_v2'
