/**
 * Podpis/ověření licenčního tokenu (HMAC-SHA256). Token = base64url(payload)
 * + "." + base64url(sig). Klient token jen předkládá; server ho vydává po
 * ověřené platbě a případně ověřuje, pokud by se placený obsah servíroval ze
 * serveru (Fáze 3). Tajný klíč: env LICENSE_SIGNING_SECRET.
 */
import { createHmac, timingSafeEqual } from 'node:crypto'

export interface LicensePayload {
  ent: 'full'
  email?: string
  iat: number
}

const b64url = (buf: Buffer): string => buf.toString('base64url')

export function signLicense(payload: LicensePayload, secret: string): string {
  const body = b64url(Buffer.from(JSON.stringify(payload)))
  const sig = b64url(createHmac('sha256', secret).update(body).digest())
  return `${body}.${sig}`
}

export function verifyLicense(token: string, secret: string): LicensePayload | null {
  const [body, sig] = token.split('.')
  if (!body || !sig) return null
  const expect = b64url(createHmac('sha256', secret).update(body).digest())
  const a = Buffer.from(sig), b = Buffer.from(expect)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  try { return JSON.parse(Buffer.from(body, 'base64url').toString()) as LicensePayload }
  catch { return null }
}
