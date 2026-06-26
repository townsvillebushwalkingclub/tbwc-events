import type { TBWCEvent } from '@/types/event'
import { FACEBOOK_EVENTS_REVALIDATE_SECONDS } from '@/lib/cache-constants'
import { parseFacebookEventDate } from '@/lib/event-utils'

export const EVENT_DETAIL_API_MIN_YEAR = 2019

const PAST_EVENT_CACHE_SECONDS = 31536000 * 10

export type EventDetailApiAccessResult =
  | { ok: true }
  | { ok: false; status: 403; message: string }

export function getEventDetailMaxFutureDate(now = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth() + 4, 0)
}

export function validateEventDetailApiAccess(
  event: TBWCEvent,
  now = new Date()
): EventDetailApiAccessResult {
  if (!event.start_time) return { ok: true }

  const eventDate = parseFacebookEventDate(event.start_time)
  const maxFutureDate = getEventDetailMaxFutureDate(now)

  if (eventDate.getFullYear() < EVENT_DETAIL_API_MIN_YEAR) {
    return {
      ok: false,
      status: 403,
      message: `Events before ${EVENT_DETAIL_API_MIN_YEAR} are not available`,
    }
  }

  if (eventDate > maxFutureDate) {
    return {
      ok: false,
      status: 403,
      message: 'Events more than 3 months in the future are not available',
    }
  }

  return { ok: true }
}

export function getEventDetailCacheSeconds(
  event: TBWCEvent,
  now = new Date()
): number {
  if (!event.start_time) return FACEBOOK_EVENTS_REVALIDATE_SECONDS

  const eventDate = parseFacebookEventDate(event.start_time)
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  eventDate.setHours(0, 0, 0, 0)

  return eventDate < today
    ? PAST_EVENT_CACHE_SECONDS
    : FACEBOOK_EVENTS_REVALIDATE_SECONDS
}

export function buildEventDetailCacheControl(cacheSeconds: number): string {
  if (cacheSeconds > 31536000) {
    return 'public, max-age=31536000, s-maxage=31536000, immutable'
  }
  return `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}, stale-while-revalidate=${cacheSeconds}`
}
