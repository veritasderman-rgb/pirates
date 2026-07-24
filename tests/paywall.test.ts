import { describe, it, expect } from 'vitest'
import { isPaidMission, FREE_MISSIONS, CAMPAIGN_NODES } from '../src/data/campaign'
import { signLicense, verifyLicense } from '../api/_lib/license'

describe('paywall — free vs paid missions', () => {
  it('první 4 hlavní mise jsou zdarma', () => {
    expect(isPaidMission('mission01')).toBe(false)
    expect(isPaidMission('mission02')).toBe(false)
    expect(isPaidMission('mission03')).toBe(false)
    expect(isPaidMission('mission04')).toBe(false)
  })

  it('mise od 5. dál jsou placené', () => {
    expect(isPaidMission('mission05')).toBe(true)
    expect(isPaidMission('mission11')).toBe(true)
  })

  it('bonusové ★ odbočky jsou placený obsah', () => {
    expect(isPaidMission('side01')).toBe(true)
    expect(isPaidMission('side02')).toBe(true)
  })

  it('neexistující mise není placená (fail-safe)', () => {
    expect(isPaidMission('nope')).toBe(false)
  })

  it('přesně FREE_MISSIONS hlavních misí je zdarma', () => {
    const mains = CAMPAIGN_NODES.filter(n => !n.optional)
    const free = mains.filter(n => !isPaidMission(n.id))
    expect(free.length).toBe(FREE_MISSIONS)
  })
})

describe('paywall — licenční token (HMAC)', () => {
  const secret = 'test-signing-secret-please-change'

  it('podepsaný token se ověří stejným klíčem', () => {
    const token = signLicense({ ent: 'full', email: 'a@b.cz', iat: 1000 }, secret)
    const payload = verifyLicense(token, secret)
    expect(payload).not.toBeNull()
    expect(payload!.ent).toBe('full')
    expect(payload!.email).toBe('a@b.cz')
    expect(payload!.iat).toBe(1000)
  })

  it('pozměněný token neprojde', () => {
    const token = signLicense({ ent: 'full', iat: 1 }, secret)
    const [body] = token.split('.')
    const forged = `${body}.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA`
    expect(verifyLicense(forged, secret)).toBeNull()
  })

  it('jiný klíč token neověří', () => {
    const token = signLicense({ ent: 'full', iat: 1 }, secret)
    expect(verifyLicense(token, 'different-secret')).toBeNull()
  })

  it('nesmysl místo tokenu vrátí null', () => {
    expect(verifyLicense('garbage', secret)).toBeNull()
    expect(verifyLicense('', secret)).toBeNull()
  })
})
