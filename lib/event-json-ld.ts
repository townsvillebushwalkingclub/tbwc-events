import type { EventPlace, TBWCEvent } from '@/types/event'
import { getEventDescriptionText, normalizeFacebookIso } from '@/lib/event-utils'
import { resolveEventShareImageForMetadata } from '@/lib/event-share-image'
import {
  buildOrganizationJsonLd,
  TBWC_ORG_ID,
  type OrganizationJsonLd,
} from '@/lib/organization-json-ld'
import { EVENTS_SITE_ORIGIN } from '@/lib/site'

const SCHEMA_CONTEXT = 'https://schema.org'

const DEFAULT_LOCATION_NAME = 'Townsville, Queensland, Australia'

const DEFAULT_POSTAL_ADDRESS = {
  '@type': 'PostalAddress' as const,
  addressLocality: 'Townsville',
  addressRegion: 'QLD',
  addressCountry: 'AU',
}

/** Facebook uses +1000; schema.org validators expect +10:00. */
export { normalizeFacebookIso as normalizeIsoDateTime } from '@/lib/event-utils'

function eventPageUrl(eventId: string): string {
  return `${EVENTS_SITE_ORIGIN}/events/${eventId}`
}

function eventEntityId(eventId: string): string {
  return `${eventPageUrl(eventId)}#event`
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
  return getEventDescriptionText(event, 'single-line')
}

export type EventJsonLd = {
  '@type': 'Event'
  '@id': string
  name: string
  description: string
  startDate: string
  endDate?: string
  eventStatus: string
  eventAttendanceMode: string
  location: ReturnType<typeof buildEventLocation>
  organizer: { '@id': typeof TBWC_ORG_ID }
  url: string
  image?: string[]
}

/** Build schema.org Event JSON-LD for a single TBWC event. */
export function buildEventJsonLd(event: TBWCEvent): EventJsonLd {
  const jsonLd: EventJsonLd = {
    '@type': 'Event',
    '@id': eventEntityId(event.id),
    name: event.name,
    description: eventDescription(event),
    startDate: normalizeFacebookIso(event.start_time),
    eventStatus: event.is_cancelled
      ? `${SCHEMA_CONTEXT}/EventCancelled`
      : `${SCHEMA_CONTEXT}/EventScheduled`,
    eventAttendanceMode: `${SCHEMA_CONTEXT}/OfflineEventAttendanceMode`,
    location: buildEventLocation(event.place),
    organizer: { '@id': TBWC_ORG_ID },
    url: eventPageUrl(event.id),
  }

  if (event.end_time) {
    jsonLd.endDate = normalizeFacebookIso(event.end_time)
  }

  const shareImage = resolveEventShareImageForMetadata(
    event.id,
    event.cover?.source ?? null
  )
  if (shareImage) {
    jsonLd.image = [shareImage.url]
  }

  return jsonLd
}

export type JsonLdGraphDocument = {
  '@context': typeof SCHEMA_CONTEXT
  '@graph': (OrganizationJsonLd | EventJsonLd)[]
}

/** Build JSON-LD for the homepage: Organization + upcoming events. */
export function buildHomepageJsonLd(events: TBWCEvent[]): JsonLdGraphDocument {
  return {
    '@context': SCHEMA_CONTEXT,
    '@graph': [buildOrganizationJsonLd(), ...events.map(buildEventJsonLd)],
  }
}

/** Build JSON-LD for an event detail page: Organization + single event. */
export function buildEventPageJsonLd(event: TBWCEvent): JsonLdGraphDocument {
  return {
    '@context': SCHEMA_CONTEXT,
    '@graph': [buildOrganizationJsonLd(), buildEventJsonLd(event)],
  }
}

/** Safe JSON for embedding in a script tag (prevents `</script>` breakout). */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
