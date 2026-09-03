/**
 * Shared cache TTLs for Facebook events and pages that mirror that data.
 * Use literal numbers in Next.js segment config exports (revalidate).
 */

/** Facebook events cache / ISR revalidate (6 hours, in seconds). */
export const FACEBOOK_EVENTS_REVALIDATE_SECONDS = 21600

/** Facebook events in-memory cache (6 hours, in milliseconds). */
export const FACEBOOK_EVENTS_CACHE_DURATION_MS = 21_600_000

/** Next.js fetch cache tag for the Facebook events list. */
export const FACEBOOK_EVENTS_CACHE_TAG = 'facebook-events'

/** Next.js fetch cache tag for a single Facebook event. */
export function facebookEventCacheTag(eventId: string): string {
  return `facebook-event-${eventId}`
}
