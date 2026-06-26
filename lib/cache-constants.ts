/**
 * Shared cache TTLs for Facebook events and pages that mirror that data.
 * Use literal numbers in Next.js segment config exports (revalidate).
 */

/** Facebook events cache / ISR revalidate (6 hours, in seconds). */
export const FACEBOOK_EVENTS_REVALIDATE_SECONDS = 21600

/** Facebook events in-memory cache (6 hours, in milliseconds). */
export const FACEBOOK_EVENTS_CACHE_DURATION_MS = 21_600_000
