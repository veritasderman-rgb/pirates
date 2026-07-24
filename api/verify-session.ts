/**
 * Po návratu ze Stripe checkoutu: ověří, že session je zaplacená, a vydá
 * podepsaný licenční token. Nikdy nevěří klientovu tvrzení o platbě — přeptá se
 * Stripe. Env: STRIPE_SECRET_KEY, LICENSE_SIGNING_SECRET.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'
import { signLicense } from './_lib/license'

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') { res.status(405).json({ error: 'method not allowed' }); return }
  const key = process.env.STRIPE_SECRET_KEY
  const secret = process.env.LICENSE_SIGNING_SECRET
  if (!key || !secret) { res.status(500).json({ error: 'payments not configured' }); return }

  const body = (req.body ?? {}) as { sessionId?: string }
  const sessionId = body.sessionId
  if (!sessionId) { res.status(400).json({ error: 'missing sessionId' }); return }

  try {
    const stripe = new Stripe(key)
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (session.payment_status !== 'paid') { res.status(402).json({ error: 'payment not completed' }); return }
    const email = session.customer_details?.email ?? undefined
    const token = signLicense({ ent: 'full', email, iat: Date.now() }, secret)
    res.status(200).json({ token, email })
  } catch {
    res.status(500).json({ error: 'could not verify session' })
  }
}
