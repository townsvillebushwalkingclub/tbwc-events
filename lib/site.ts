/**
 * Public origin for absolute URLs in metadata (Open Graph, Twitter, etc.).
 * Social crawlers require fully qualified image URLs.
 */
export const EVENTS_SITE_ORIGIN =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
  'https://events.townsvillebushwalkingclub.com'

/** Resolve event cover URL (Facebook CDN or local /event-covers/…) to an absolute URL. */
export function absoluteEventShareImageUrl(
  imageUrl: string | null | undefined
): string | null {
  if (!imageUrl?.trim()) return null
  const s = imageUrl.trim()
  if (/^https?:\/\//i.test(s)) return s
  const path = s.startsWith('/') ? s : `/${s}`
  return new URL(path, EVENTS_SITE_ORIGIN).href
}
