/**
 * Public origin for absolute URLs in metadata (Open Graph, Twitter, etc.).
 * Social crawlers require fully qualified image URLs.
 */
export const EVENTS_SITE_ORIGIN =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
  'https://events.townsvillebushwalkingclub.com'

/** Absolute URL for an event detail page (required for PDF/print hyperlinks). */
export function absoluteEventPageUrl(eventId: string): string {
  return `${EVENTS_SITE_ORIGIN}/events/${eventId}`
}

/** Resolve a site-hosted cover path (/event-covers/…) to an absolute URL. */
export function absoluteEventShareImageUrl(
  imageUrl: string | null | undefined
): string | null {
  if (!imageUrl?.trim()) return null
  const s = imageUrl.trim()
  if (!s.startsWith('/event-covers/')) return null
  return new URL(s, EVENTS_SITE_ORIGIN).href
}
