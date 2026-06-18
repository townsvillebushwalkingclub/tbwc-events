/**
 * Client-safe poster exclude query helpers (no server-only imports).
 */

import { isValidFacebookEventId } from '@/lib/event-id'

/** Parse `?exclude=id1,id2` into a set of Facebook event IDs. */
export function parsePosterExcludeParam(
  value: string | string[] | undefined
): Set<string> {
  const raw = Array.isArray(value) ? value.join(',') : value ?? ''
  const ids = raw
    .split(',')
    .map((part) => part.trim())
    .filter((id) => id.length > 0 && isValidFacebookEventId(id))
  return new Set(ids)
}

/** Build query string to preserve exclude IDs across poster links. */
export function formatPosterExcludeQuery(excludeIds: Set<string>): string {
  if (excludeIds.size === 0) return ''
  return `?exclude=${[...excludeIds].join(',')}`
}
