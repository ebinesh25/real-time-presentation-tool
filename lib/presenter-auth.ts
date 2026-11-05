import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { presentationOwners, presentations } from '@/lib/db/schema'

export const presenterCookieName = (shareId: string) => `presenter_${shareId}`
export const createPresenterToken = () => randomBytes(32).toString('base64url')
export const hashPresenterToken = (token: string) => createHash('sha256').update(token).digest('hex')

// Short-lived cache avoids repeated database round trips while presenting.
// Expiry is checked on every request, including cache hits.
const activeOwnerCache = new Map<string, { tokenHash: string; expiresAt: number; cachedUntil: number }>()
const OWNER_CACHE_MS = 30_000
const MAX_CACHED_OWNERS = 256

function cacheOwner(shareId: string, tokenHash: string, expiresAt: Date) {
  if (activeOwnerCache.size >= MAX_CACHED_OWNERS && !activeOwnerCache.has(shareId)) {
    activeOwnerCache.delete(activeOwnerCache.keys().next().value!)
  }
  activeOwnerCache.set(shareId, {
    tokenHash, expiresAt: expiresAt.getTime(), cachedUntil: Date.now() + OWNER_CACHE_MS,
  })
}

export async function isActivePresentationOwner(shareId: string) {
  const token = (await cookies()).get(presenterCookieName(shareId))?.value
  if (!token) return false
  const hash = hashPresenterToken(token)
  const now = Date.now()
  const cached = activeOwnerCache.get(shareId)
  if (cached && cached.cachedUntil > now) {
    const actual = Buffer.from(hash, 'hex')
    const expected = Buffer.from(cached.tokenHash, 'hex')
    return cached.expiresAt > now && actual.length === expected.length && timingSafeEqual(actual, expected)
  }

  const [owner] = await db.select({ tokenHash: presentationOwners.tokenHash, expiresAt: presentations.expiresAt })
    .from(presentationOwners)
    .innerJoin(presentations, eq(presentationOwners.presentationId, presentations.id))
    .where(eq(presentations.shareId, shareId)).limit(1)
  if (!owner || owner.expiresAt.getTime() <= Date.now()) return false
  const actual = Buffer.from(hash, 'hex')
  const expected = Buffer.from(owner.tokenHash, 'hex')
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return false
  cacheOwner(shareId, owner.tokenHash, owner.expiresAt)
  return true
}

export async function isPresentationOwner(shareId: string) {
  const token = (await cookies()).get(presenterCookieName(shareId))?.value
  if (!token) return false
  const [owner] = await db.select({ tokenHash: presentationOwners.tokenHash, expiresAt: presentations.expiresAt })
    .from(presentationOwners)
    .innerJoin(presentations, eq(presentationOwners.presentationId, presentations.id))
    .where(eq(presentations.shareId, shareId)).limit(1)
  if (!owner) return false
  const actual = Buffer.from(hashPresenterToken(token), 'hex')
  const expected = Buffer.from(owner.tokenHash, 'hex')
  const matches = actual.length === expected.length && timingSafeEqual(actual, expected)
  if (matches && owner.expiresAt.getTime() > Date.now()) cacheOwner(shareId, owner.tokenHash, owner.expiresAt)
  return matches
}
