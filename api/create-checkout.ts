/**
 * Vytvoří Stripe Checkout Session pro jednorázové odemčení celé hry a vrátí
 * URL, kam klient přesměruje. Secret key jen ze serverového env — nikdy do
 * klienta. Env: STRIPE_SECRET_KEY, STRIPE_PRICE_ID.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') { res.status(405).json({ error: 'method not allowed' }); return }
  const key = process.env.STRIPE_SECRET_KEY
  const price = process.env.STRIPE_PRICE_ID
  if (!key || !price) { res.status(500).json({ error: 'payments not configured' }); return }

  const body = (req.body ?? {}) as { origin?: string; path?: string }
  const origin = body.origin || `https://${req.headers.host}`
  const path = body.path || '/'

  try {
    const stripe = new Stripe(key)
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price, quantity: 1 }],
      customer_creation: 'always', // ať jde purchase dohledat e-mailem (restore)
      allow_promotion_codes: true,
      success_url: `${origin}${path}?purchase=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${path}?purchase=cancel`,
    })
    res.status(200).json({ url: session.url })
  } catch {
    res.status(500).json({ error: 'could not create checkout session' })
  }
}
