/**
 * Jádro lokalizace — bezpečné i ve workeru (žádné localStorage/window).
 * Aktivní jazyk nastavuje main vlákno (index.ts) nebo worker (z init zprávy).
 * `t()` překládá podle přesného anglického znění; neznámý text vrací beze
 * změny, takže chybějící překlad nikdy nerozbije hru — jen zůstane anglicky.
 */
import { CS_CONTENT } from './cs-content'
import { CS_EXTRA } from './cs-extra'
import { CS_UI } from './cs-ui'

export type Lang = 'en' | 'cs'

const CS: Record<string, string> = { ...CS_CONTENT, ...CS_EXTRA, ...CS_UI }
// pár textů v misích má koncovou mezeru — přidej i trimované aliasy klíčů,
// ať lookup sedí bez ohledu na okrajové bílé znaky
for (const [k, v] of Object.entries(CS)) {
  const kt = k.trim()
  if (kt !== k && !(kt in CS)) CS[kt] = v.trim()
}

let active: Lang = 'en'

export function setActiveLang(l: Lang): void { active = l }
export function activeLang(): Lang { return active }

export function t(s: string): string {
  if (active === 'en') return s
  return CS[s] ?? s
}

/**
 * Šablonový překlad: klíč s {x} tokeny, hodnoty se dosadí po překladu.
 * tp('Buy — {p} 🪙', { p: 280 }) → 'Koupit — 280 🪙' (cs) / 'Buy — 280 🪙' (en).
 */
export function tp(key: string, vars: Record<string, string | number>): string {
  let s = t(key)
  for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v))
  return s
}

/** Má daný anglický text český překlad? (pro testy úplnosti a VO pipeline) */
export function hasCs(s: string): boolean { return s in CS }

/** Překlad bez ohledu na aktivní jazyk (pro generování českého dabingu). */
export function csOf(s: string): string | undefined { return CS[s] }
