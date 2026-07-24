# Stripe paywall — one-time full unlock

Design + implementation notes for monetising *Pirates*: the first 4 campaign
missions are free (demo/hook), and a **single one-time payment** unlocks the
rest of the campaign **and** the skirmish mode. Device-bound license with
email restore. This document is the durable spec; the code lands across two PRs.

## Product decisions (locked in)

- **Model:** one-time purchase, "unlock the full game". No subscription, no packs.
- **What it unlocks:** campaign missions 5–11, the optional ★ side missions, and
  **skirmish** (free-play custom battle — a new paid feature).
- **Free tier:** the first 4 main-line missions (`mission01`–`mission04`).
- **Entitlement:** a signed license token stored in `localStorage`
  (`pirates.license.v1`). Restore on a new device via **email** (looked up
  against Stripe, no separate account/password for the MVP).

## The core constraint

The game is a **static client** (Vite → static build on Vercel, state in
`localStorage`). A payment flow needs a server secret, which must never ship to
the browser. We add thin **Vercel serverless functions** under `/api` — the same
host, no separate backend. `tsconfig.json` includes only `src`/`tests`, so
`/api` is invisible to the client typecheck/bundle; Vercel compiles it separately.

Honest note on piracy: a purely client-side gate is bypassable (edit
`localStorage`). A signed token raises the bar (you can't just flip a boolean —
you need a server-signed blob), but a determined buyer could still share their
token. Truly preventing that means **not shipping paid mission data in the
bundle** and serving it from an authenticated endpoint (Phase 3, optional). For
a hobby game the signed-license approach is the pragmatic default.

## Architecture

```
Browser (game)                 Vercel /api (serverless)          Stripe
  Buy  ─── create-checkout ───► create Checkout Session ───────►  hosted checkout
       ◄─────────────────────── { url } ◄──────────────────────┘
  …pays, redirect back with ?purchase=success&session_id=…
       ─── verify-session ────► retrieve session, assert paid
       ◄──── signed license ─── HMAC(payload, LICENSE_SIGNING_SECRET)
  save token → owned() === true → paid content unlocked
  Restore (email) ─ restore ──► find paid Customer by email → re-issue license
       webhook  ◄───────────── checkout.session.completed (log / future DB)
```

## Client changes

### Entitlement module — `src/data/entitlement.ts`
- `pirates.license.v1` = `{ token, email?, issuedAt? }`.
- `hasLicense()` — token present.
- `saveLicense()`, `clearLicense()`, `loadLicense()`.
- Dev override for testing paid content without paying: `?own=1` sets a fake
  license, `?own=off` clears it (mirrors the existing `?unlock=all` dev switch).
- The client stores/presents the token; it does **not** verify the HMAC (it
  can't hold the secret). Verification matters only if/when paid content is
  server-delivered (Phase 3).

### Free vs paid — `src/data/campaign.ts`
- `FREE_MISSIONS = 4`; `isPaidMission(id)` → main-line index ≥ 4, or any optional
  side mission (bonus content is paid).

### Gating — `src/main.ts`
- `owned = allUnlocked || hasLicense()` (the dev `?unlock=all` also grants
  ownership, so testers can play everything).
- Map node state gains a third value: `paid` — reachable by progress but behind
  the paywall. Rendered with a gold lock + "Buy"; clicking opens the store
  overlay instead of launching.
- `?mission=` bootstrap guard also requires `!isPaidMission(id) || owned`.
- On return from Stripe (`?purchase=success&session_id=…`) → `verify-session`
  → save license → confirmation. `?purchase=cancel` → back to the store.

### Store overlay — `showStore()`
- One screen: what you get (full campaign + skirmish), display price, **Buy**
  (→ `create-checkout`), **Restore purchase** (email → `restore`).
- Local `vite preview` has no `/api`; Buy shows a friendly error there — use the
  `?own=1` dev toggle to exercise gated content locally.

## Serverless functions — `/api`

| File | Job |
|---|---|
| `create-checkout.ts` | Create a Checkout Session (`mode: payment`, `customer_creation: always`, `customer_email`, success/cancel URLs). Return `{ url }`. |
| `verify-session.ts` | Retrieve the session, assert `payment_status === 'paid'`, return a signed license token. |
| `restore.ts` | `customers.list({ email })` → their `checkout.sessions`/`paymentIntents` → if any paid, re-issue a license. |
| `stripe-webhook.ts` | Verify webhook signature; handle `checkout.session.completed` (log now, DB later). Idempotent. |
| `_lib/license.ts` | HMAC-SHA256 sign/verify of `{ ent:'full', email, iat }`. |

Token format: `base64url(payloadJSON) + '.' + base64url(hmac)`.

## Config (Vercel env)

- `STRIPE_SECRET_KEY` — server only.
- `STRIPE_PRICE_ID` — the one-time Price for the full unlock.
- `STRIPE_WEBHOOK_SECRET` — verify webhook signatures.
- `LICENSE_SIGNING_SECRET` — HMAC key for license tokens.

Dashboard setup: create a Product "Pirates — Full Game" with one Price (choose
currency; Stripe Tax optional). Add the webhook endpoint → `checkout.session.completed`.
The store's display price string (`src/data/entitlement.ts`) must be kept in
sync with the Stripe Price by hand.

## Security & legal

- Secrets only in serverless env; never in client, commits, or the bundle.
- Always verify the webhook signature; never trust the client's claim of payment —
  `verify-session` re-checks with Stripe.
- Terms + refund policy; for EU digital goods, capture the consumer's waiver of
  the 14-day withdrawal right on immediate delivery.
- Restore-by-email is a mild abuse vector (anyone who knows a paying email gets a
  license). Acceptable for MVP; harden with a magic-link in Phase 2.

## Phasing

- **PR A — paywall infrastructure:** this doc + client entitlement/gating/store +
  `/api` functions (Stripe test-mode ready). Gates campaign missions 5+.
  Testable now via the `?own=1` dev toggle.
- **PR B — skirmish mode:** the new paid free-play battle (pick ship / enemy /
  weather / map → ad-hoc scenario on the existing sim engine), gated by the same
  `owned()` check.
- **Phase 2 (later):** magic-link accounts + a DB (e.g. Supabase) so entitlement
  survives device changes and is harder to bypass.
- **Phase 3 (optional):** serve paid mission/skirmish data from an authenticated
  endpoint to actually defeat token-sharing.

## Go-live checklist

1. Create the Stripe Product + Price; note the Price id.
2. Set the four env vars on Vercel (test keys first).
3. Add the webhook endpoint in Stripe → `checkout.session.completed`.
4. Test the full loop in Stripe test mode (buy → unlock → restore).
5. Swap to live keys; update the display price string to match.
