import { timingSafeEqual } from 'crypto'

function readBearerToken(authorization: string | null): string | null {
  if (!authorization?.startsWith('Bearer ')) return null
  const token = authorization.slice('Bearer '.length).trim()
  return token || null
}

function secretsMatch(expected: string, provided: string): boolean {
  if (expected.length !== provided.length) return false
  return timingSafeEqual(Buffer.from(expected), Buffer.from(provided))
}

export function isCacheClearAuthorized(request: Request): boolean {
  const expected = process.env.CACHE_CLEAR_SECRET?.trim()
  if (!expected) {
    return process.env.NODE_ENV !== 'production'
  }

  const provided =
    readBearerToken(request.headers.get('authorization')) ??
    request.headers.get('x-cache-clear-secret')?.trim() ??
    null

  if (!provided) return false
  return secretsMatch(expected, provided)
}
