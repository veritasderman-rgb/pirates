/**
 * Nárok na plnou hru — jednorázové odemčení (kampaň 5+, ★ odbočky a skirmish).
 * Klient drží podepsaný licenční token v localStorage; token vydává server
 * (/api/verify-session) až po skutečné platbě u Stripe. Klient podpis neověřuje
 * (nemá tajný klíč) — jen předkládá token; ověřování má smysl teprve u obsahu
 * servírovaného ze serveru (Fáze 3). Čistě klientská brána je obejitelná — viz
 * docs/STRIPE_PAYWALL_PLAN.md.
 */

/** Zobrazená cena ve storu. MUSÍ se ručně držet v souladu se Stripe Price. */
export const STORE_PRICE_LABEL = '€6.99'

/** Co všechno odemčení dává — pro store overlay (infografika hodnoty). */
export const UNLOCK_PERKS: string[] = [
  'The full campaign — every mission beyond the first four',
  'All ★ side missions (bonus plunder)',
  'Skirmish — free-play custom battles',
  'One payment, yours forever — no subscription',
]

export interface License {
  token: string
  email?: string
  issuedAt?: number
}

const LKEY = 'pirates.license.v1'
const OWN_DEV_KEY = 'pirates.ownDev' // testovací přepínač (?own=1 / ?own=off)

export function loadLicense(): License | null {
  try {
    const raw = localStorage.getItem(LKEY)
    if (!raw) return null
    const l = JSON.parse(raw) as Partial<License>
    return l && typeof l.token === 'string' && l.token ? (l as License) : null
  } catch { return null }
}

export function saveLicense(l: License): void {
  try { localStorage.setItem(LKEY, JSON.stringify(l)) } catch { /* ignore */ }
}

export function clearLicense(): void {
  try { localStorage.removeItem(LKEY) } catch { /* ignore */ }
}

/**
 * Vlastní hráč plnou hru? Buď má uložený licenční token, nebo je zapnutý
 * vývojářský přepínač (?own=1). Nezávisí na DEV odemčení misí — o to se stará
 * volající (main.ts kombinuje `allUnlocked || isOwned()`).
 */
export function isOwned(): boolean {
  if (loadLicense()) return true
  try { return localStorage.getItem(OWN_DEV_KEY) === '1' } catch { return false }
}

/**
 * Zpracuj vývojářský přepínač vlastnictví z URL (?own=1 zapne a uloží, ?own=off
 * vypne). Vrací true, pokud se stav změnil. Umožní testovat placený obsah bez
 * platby, obdoba ?unlock=all pro postup kampaní.
 */
export function applyOwnDevFlag(search: string): boolean {
  const v = new URLSearchParams(search).get('own')
  try {
    if (v === '1' || v === 'on') { localStorage.setItem(OWN_DEV_KEY, '1'); return true }
    if (v === 'off' || v === '0') { localStorage.removeItem(OWN_DEV_KEY); return true }
  } catch { /* ignore */ }
  return false
}

/** Je aktivní vývojářské (nezaplacené) vlastnictví? Jen pro čitelný hint ve storu. */
export function isDevOwned(): boolean {
  if (loadLicense()) return false
  try { return localStorage.getItem(OWN_DEV_KEY) === '1' } catch { return false }
}
