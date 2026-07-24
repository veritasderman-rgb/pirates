/**
 * Stripe webhook — fulfillment/log. Ověří podpis (raw body, proto vypnutý
 * bodyParser) a zpracuje `checkout.session.completed`. Pro MVP jen loguje;
 * později sem přijde zápis nároku do DB (Fáze 2). Idempotentní.
 * Env: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'

export const config = { api: { bodyParser: false } }

function readRaw(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (c: Buffer) => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') { res.status(405).json({ error: 'method not allowed' }); return }
  const key = process.env.STRIPE_SECRET_KEY
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!key || !whSecret) { res.status(500).json({ error: 'payments not configured' }); return }

  const sig = req.headers['stripe-signature']
  if (!sig || typeof sig !== 'string') { res.status(400).json({ error: 'missing signature' }); return }

  try {
    const stripe = new Stripe(key)
    const raw = await readRaw(req)
    const event = stripe.webhooks.constructEvent(raw, sig, whSecret)
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      // fulfillment: pro MVP jen log; sem později zápis nároku do DB podle e-mailu
      console.log('purchase completed', session.id, session.customer_details?.email)
    }
    res.status(200).json({ received: true })
  } catch {
    res.status(400).json({ error: 'webhook signature verification failed' })
  }
}
