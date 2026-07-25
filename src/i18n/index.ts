/**
 * Volba jazyka — JEN pro main vlákno (čte localStorage/URL/navigator).
 * Worker dostává jazyk v init zprávě a nastavuje si ho přes setActiveLang.
 * Priorita: ?lang=cs|en (uloží se) → localStorage → jazyk prohlížeče.
 */
import { setActiveLang, type Lang } from './core'
export { t, activeLang, hasCs, type Lang } from './core'

const LANG_KEY = 'pirates.lang'

export function currentLang(): Lang {
  try {
    const q = new URLSearchParams(location.search).get('lang')
    if (q === 'cs' || q === 'en') { localStorage.setItem(LANG_KEY, q); return q }
    const saved = localStorage.getItem(LANG_KEY)
    if (saved === 'cs' || saved === 'en') return saved
  } catch { /* private mode */ }
  return navigator.language?.toLowerCase().startsWith('cs') ? 'cs' : 'en'
}

export function setLang(l: Lang): void {
  try { localStorage.setItem(LANG_KEY, l) } catch { /* ignore */ }
  setActiveLang(l)
}

/** Inicializace na main vlákně — zavolat jednou při bootstrapu. */
export function initLang(): Lang {
  const l = currentLang()
  setActiveLang(l)
  try { document.documentElement.lang = l } catch { /* worker/test */ }
  return l
}
