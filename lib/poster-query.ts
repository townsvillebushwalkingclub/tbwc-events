/**
 * Client-safe poster filter query helpers (no server-only imports).
 */

import { isValidFacebookEventId } from '@/lib/event-id'

/** Parse a comma-separated Facebook event ID list query value. */
export function parsePosterIdListParam(
  value: string | string[] | undefined
): Set<string> {
  const raw = Array.isArray(value) ? value.join(',') : value ?? ''
  const ids = raw
    .split(',')
    .map((part) => part.trim())
    .filter((id) => id.length > 0 && isValidFacebookEventId(id))
  return new Set(ids)
}

/** Parse `?exclude=id1,id2` into a set of Facebook event IDs. */
export function parsePosterExcludeParam(
  value: string | string[] | undefined
): Set<string> {
  return parsePosterIdListParam(value)
}

/** Parse `?include=id1,id2` into a set of Facebook event IDs. */
export function parsePosterIncludeParam(
  value: string | string[] | undefined
): Set<string> {
  return parsePosterIdListParam(value)
}

/** Parse `?featured=id` into a single Facebook event ID, or null. */
export function parsePosterFeaturedParam(
  value: string | string[] | undefined
): string | null {
  const raw = Array.isArray(value) ? value[0] : value
  if (!raw) return null
  const id = raw.trim()
  return isValidFacebookEventId(id) ? id : null
}

export interface PosterFilterQueryInput {
  excludeIds?: Set<string>
  includeIds?: Set<string>
  featuredId?: string | null
}

/**
 * Build query string to preserve include / exclude / featured across poster links.
 * Stable param order: include, exclude, featured. Omits empty parts.
 */
export function formatPosterFilterQuery({
  excludeIds,
  includeIds,
  featuredId,
}: PosterFilterQueryInput): string {
  const parts: string[] = []
  if (includeIds && includeIds.size > 0) {
    parts.push(`include=${[...includeIds].join(',')}`)
  }
  if (excludeIds && excludeIds.size > 0) {
    parts.push(`exclude=${[...excludeIds].join(',')}`)
  }
  if (featuredId) {
    parts.push(`featured=${featuredId}`)
  }
  if (parts.length === 0) return ''
  return `?${parts.join('&')}`
}

/**
 * Move the featured event to index 0 when present; otherwise leave order unchanged.
 * Shared by server selection and client filters.
 */
export function moveFeaturedFirst<T extends { id: string }>(
  events: T[],
  featuredId: string | null | undefined
): T[] {
  if (!featuredId || events.length === 0) return events
  const index = events.findIndex((event) => event.id === featuredId)
  if (index <= 0) return events
  const featured = events[index]
  return [featured, ...events.slice(0, index), ...events.slice(index + 1)]
}
