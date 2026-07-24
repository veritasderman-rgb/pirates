/**
 * Obnovení nákupu na novém zařízení podle e-mailu. Dohledá u Stripe zákazníky
 * s daným e-mailem a jejich zaplacené checkout sessions; pokud nějaká je,
 * vydá znovu licenční token. Bez vlastní DB — spoléhá na customer_creation:
 * 'always' při checkoutu. (Mírný abuse vektor; MVP, viz docs.)
 * Env: STRIPE_SECRET_KEY, LICENSE_SIGNING_SECRET.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'
import { signLicense } from './_lib/license'

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') { res.status(405).json({ error: 'method not allowed' }); return }
  const key = process.env.STRIPE_SECRET_KEY
  const secret = process.env.LICENSE_SIGNING_SECRET
  if (!key || !secret) { res.status(500).json({ error: 'payments not configured' }); return }

  const body = (req.body ?? {}) as { email?: string }
  const email = body.email?.trim().toLowerCase()
  if (!email) { res.status(400).json({ error: 'missing email' }); return }

  try {
    const stripe = new Stripe(key)
    const customers = await stripe.customers.list({ email, limit: 20 })
    for (const c of customers.data) {
      const sessions = await stripe.checkout.sessions.list({ customer: c.id, limit: 50 })
      if (sessions.data.some(s => s.payment_status === 'paid')) {
        const token = signLicense({ ent: 'full', email, iat: Date.now() }, secret)
        res.status(200).json({ token, email })
        return
      }
    }
    res.status(404).json({ error: 'No completed purchase found for that email.' })
  } catch {
    res.status(500).json({ error: 'could not restore purchase' })
  }
}
