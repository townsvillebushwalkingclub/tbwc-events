import type { EventPlace, TBWCEvent } from '@/types/event'
import { formatCalendarFeedEventTitle, filterUpcomingCalendarFeedEvents } from '@/lib/calendar-feed-events'
import {
  BRISBANE_TIMEZONE,
  getEventDescriptionText,
  parseFacebookEventDate,
} from '@/lib/event-utils'
import { getFacebookEvents } from '@/lib/facebook-api'
import { absoluteEventPageUrl, EVENTS_SITE_ORIGIN } from '@/lib/site'

export { BRISBANE_TIMEZONE as CALENDAR_TIMEZONE }

const DEFAULT_LOCATION = 'Townsville, Queensland, Australia'
const DEFAULT_END_OFFSET_MS = 3 * 60 * 60 * 1000

const VTIMEZONE_BLOCK = [
  'BEGIN:VTIMEZONE',
  `TZID:${BRISBANE_TIMEZONE}`,
  'BEGIN:STANDARD',
  'DTSTART:19700101T000000',
  'TZOFFSETFROM:+1000',
  'TZOFFSETTO:+1000',
  'TZNAME:AEST',
  'END:STANDARD',
  'END:VTIMEZONE',
].join('\r\n')

/** RFC 5545 text escaping for SUMMARY, DESCRIPTION, LOCATION, etc. */
export function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n/g, '\\n')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\n')
}

/** Local wall-clock datetime for DTSTART/DTEND with TZID. */
export function formatIcsDateTime(iso: string): string {
  const date = parseFacebookEventDate(iso)
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BRISBANE_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date)

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '00'

  return `${get('year')}${get('month')}${get('day')}T${get('hour')}${get('minute')}${get('second')}`
}

function formatIcsUtcStamp(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  )
}

function foldIcsLine(line: string): string {
  const maxBytes = 75
  const encoder = new TextEncoder()
  if (encoder.encode(line).length <= maxBytes) return line

  const chunks: string[] = []
  let remaining = line
  while (remaining.length > 0) {
    let sliceEnd = Math.min(remaining.length, maxBytes)
    while (
      sliceEnd > 0 &&
      encoder.encode(remaining.slice(0, sliceEnd)).length > maxBytes
    ) {
      sliceEnd--
    }
    chunks.push(remaining.slice(0, sliceEnd))
    remaining = remaining.slice(sliceEnd)
  }

  return chunks.join('\r\n ')
}

function foldIcsContent(lines: string[]): string {
  return lines.map(foldIcsLine).join('\r\n')
}

function buildLocation(place: EventPlace | null): string {
  if (!place?.name && !place?.location) return DEFAULT_LOCATION

  const parts: string[] = []
  if (place.name) parts.push(place.name)
  const loc = place.location
  if (loc) {
    if (loc.street) parts.push(loc.street)
    const cityLine = [loc.city, loc.state, loc.zip].filter(Boolean).join(' ')
    if (cityLine) parts.push(cityLine)
    if (loc.country) parts.push(loc.country)
  }
  return parts.join(', ') || DEFAULT_LOCATION
}

function eventEndIso(event: TBWCEvent): string {
  if (event.end_time) return event.end_time
  const start = parseFacebookEventDate(event.start_time)
  return new Date(start.getTime() + DEFAULT_END_OFFSET_MS).toISOString()
}

function eventUid(eventId: string): string {
  return `${eventId}@${new URL(EVENTS_SITE_ORIGIN).host}`
}

export function buildVEvent(
  event: TBWCEvent,
  options: { dtStamp?: Date; includeLeaderInitial?: boolean } = {}
): string[] {
  const stamp = formatIcsUtcStamp(options.dtStamp ?? new Date())
  const summary = options.includeLeaderInitial
    ? formatCalendarFeedEventTitle(event)
    : event.name
  const lines = [
    'BEGIN:VEVENT',
    `UID:${eventUid(event.id)}`,
    `DTSTAMP:${stamp}`,
    `DTSTART;TZID=${BRISBANE_TIMEZONE}:${formatIcsDateTime(event.start_time)}`,
    `DTEND;TZID=${BRISBANE_TIMEZONE}:${formatIcsDateTime(eventEndIso(event))}`,
    `SUMMARY:${escapeIcsText(summary)}`,
    `DESCRIPTION:${escapeIcsText(getEventDescriptionText(event, 'preserve-newlines'))}`,
    `LOCATION:${escapeIcsText(buildLocation(event.place))}`,
    `URL:${absoluteEventPageUrl(event.id)}`,
  ]

  if (event.is_cancelled) {
    lines.push('STATUS:CANCELLED')
  }

  lines.push('END:VEVENT')
  return lines
}

export type BuildVCalendarOptions = {
  name?: string
  refreshHours?: number
  includeLeaderInitial?: boolean
}

export function buildVCalendar(
  events: TBWCEvent[],
  options: BuildVCalendarOptions = {}
): string {
  const {
    name = 'Townsville Bushwalking Club Events',
    refreshHours = 6,
    includeLeaderInitial = false,
  } = options
  const dtStamp = new Date()

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Townsville Bushwalking Club//Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(name)}`,
    `REFRESH-INTERVAL;VALUE=DURATION:PT${refreshHours}H`,
    VTIMEZONE_BLOCK,
    ...events.flatMap((event) =>
      buildVEvent(event, { dtStamp, includeLeaderInitial })
    ),
    'END:VCALENDAR',
  ]

  return foldIcsContent(lines) + '\r\n'
}

export function slugifyEventFilename(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  return slug || 'event'
}

export async function getUpcomingEventsForCalendar(): Promise<TBWCEvent[]> {
  const allEvents = await getFacebookEvents()
  return filterUpcomingCalendarFeedEvents(allEvents)
}
