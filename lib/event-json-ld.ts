import type { EventPlace, TBWCEvent } from '@/types/event'
import { absoluteEventShareImageUrl, EVENTS_SITE_ORIGIN } from '@/lib/site'

const SCHEMA_CONTEXT = 'https://schema.org'
const TBWC_ORGANIZATION_URL = 'https://townsvillebushwalkingclub.com/'

const TBWC_ORGANIZER = {
  '@type': 'Organization' as const,
  name: 'Townsville Bushwalking Club',
  url: TBWC_ORGANIZATION_URL,
}

const DEFAULT_LOCATION_NAME = 'Townsville, Queensland, Australia'

const DEFAULT_POSTAL_ADDRESS = {
  '@type': 'PostalAddress' as const,
  addressLocality: 'Townsville',
  addressRegion: 'QLD',
  addressCountry: 'AU',
}

/** Facebook uses +1000; schema.org validators expect +10:00. */
export function normalizeIsoDateTime(iso: string): string {
  return iso.replace(/([+-]\d{2})(\d{2})$/, '$1:$2')
}

function eventPageUrl(eventId: string): string {
  return `${EVENTS_SITE_ORIGIN}/events/${eventId}`
}

function buildPostalAddress(place: EventPlace) {
  const loc = place.location
  if (!loc) return { ...DEFAULT_POSTAL_ADDRESS }

  return {
    '@type': 'PostalAddress' as const,
    ...(loc.street ? { streetAddress: loc.street } : {}),
    ...(loc.city ? { addressLocality: loc.city } : {}),
    ...(loc.state ? { addressRegion: loc.state } : {}),
    ...(loc.zip ? { postalCode: loc.zip } : {}),
    addressCountry: loc.country || 'AU',
  }
}

function buildEventLocation(place: EventPlace | null) {
  if (!place?.name && !place?.location) {
    return {
      '@type': 'Place' as const,
      name: DEFAULT_LOCATION_NAME,
      address: DEFAULT_POSTAL_ADDRESS,
    }
  }

  return {
    '@type': 'Place' as const,
    name: place.name || DEFAULT_LOCATION_NAME,
    address: buildPostalAddress(place),
  }
}

function eventDescription(event: TBWCEvent): string {
  const text = event.description?.trim()
  if (text) return text.replace(/\s+/g, ' ').trim()
  const locationPart = event.place?.name
    ? ` Location: ${event.place.name}.`
    : ''
  return `Join Townsville Bushwalking Club for ${event.name} on ${event.formatted_date}.${locationPart}`
}

export type EventJsonLd = {
  '@type': 'Event'
  name: string
  description: string
  startDate: string
  endDate?: string
  eventStatus?: string
  eventAttendanceMode: string
  location: ReturnType<typeof buildEventLocation>
  organizer: typeof TBWC_ORGANIZER
  url: string
  image?: string[]
}

/** Build schema.org Event JSON-LD for a single TBWC event. */
export function buildEventJsonLd(event: TBWCEvent): EventJsonLd {
  const jsonLd: EventJsonLd = {
    '@type': 'Event',
    name: event.name,
    description: eventDescription(event),
    startDate: normalizeIsoDateTime(event.start_time),
    eventAttendanceMode: `${SCHEMA_CONTEXT}/OfflineEventAttendanceMode`,
    location: buildEventLocation(event.place),
    organizer: TBWC_ORGANIZER,
    url: eventPageUrl(event.id),
  }

  if (event.end_time) {
    jsonLd.endDate = normalizeIsoDateTime(event.end_time)
  }

  if (event.is_cancelled) {
    jsonLd.eventStatus = `${SCHEMA_CONTEXT}/EventCancelled`
  }

  const imageUrl = absoluteEventShareImageUrl(event.cover?.source)
  if (imageUrl) {
    jsonLd.image = [imageUrl]
  }

  return jsonLd
}

export type EventJsonLdDocument = {
  '@context': typeof SCHEMA_CONTEXT
} & EventJsonLd

export type EventsJsonLdDocument = {
  '@context': typeof SCHEMA_CONTEXT
  '@graph': EventJsonLd[]
}

/** Build a single JSON-LD document for one event page. */
export function buildEventJsonLdDocument(event: TBWCEvent): EventJsonLdDocument {
  return {
    '@context': SCHEMA_CONTEXT,
    ...buildEventJsonLd(event),
  }
}

/** Build a single JSON-LD document listing multiple events (calendar / list pages). */
export function buildEventsJsonLd(events: TBWCEvent[]): EventsJsonLdDocument {
  return {
    '@context': SCHEMA_CONTEXT,
    '@graph': events.map(buildEventJsonLd),
  }
}

/** Safe JSON for embedding in a script tag (prevents `</script>` breakout). */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
