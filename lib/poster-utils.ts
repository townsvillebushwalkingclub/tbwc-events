/**
 * Poster page utilities: event selection, density, formatting.
 */

import { getFacebookEvents } from '@/lib/facebook-api'
import { normalizeNewlines } from '@/lib/process-description'
import {
  getCalendarDateInTimeZone,
  isEventPastOnCalendar,
  isMultiDayEvent,
} from '@/lib/event-utils'
import {
  addMonths,
  formatPosterMonthLabel,
  formatPosterMonthSlug,
  type PosterMonth,
} from '@/lib/poster-month'
import type { TBWCEvent } from '@/types/event'

export { POSTER_QR_URL } from '@/lib/poster-constants'
export type { PosterMonth } from '@/lib/poster-month'
export {
  addMonths,
  formatPosterMonthLabel,
  formatPosterMonthSlug,
  getCurrentPosterMonth,
  parsePosterMonthParam,
} from '@/lib/poster-month'

export const POSTER_MAX_CURRENT_MONTH = 20
export const POSTER_MAX_NEXT_MONTH = 5

const BRISBANE = 'Australia/Brisbane'

/** Layout scale for photo-forward event cards (all densities include images). */
export type PosterDensity = 'feature' | 'balanced' | 'mosaic'

export interface PosterEventsData {
  anchor: PosterMonth
  anchorLabel: string
  currentMonth: TBWCEvent[]
  nextMonth: TBWCEvent[]
  nextMonthLabel: string
}

function monthOrdinal(year: number, month: number): number {
  return year * 100 + month
}

function filterUpcoming(events: TBWCEvent[]): TBWCEvent[] {
  return events.filter((event) => {
    if (!event.start_time || event.is_cancelled) return false
    return !isEventPastOnCalendar(event)
  })
}

function eventsInMonth(events: TBWCEvent[], year: number, month: number): TBWCEvent[] {
  const target = monthOrdinal(year, month)
  return events
    .filter((event) => {
      const start = getCalendarDateInTimeZone(event.start_time, BRISBANE)
      return monthOrdinal(start.year, start.month) === target
    })
    .sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    )
}

export async function getPosterEventsForMonth(
  anchor: PosterMonth
): Promise<PosterEventsData> {
  const next = addMonths(anchor.year, anchor.month, 1)
  let all: TBWCEvent[] = []
  try {
    all = await getFacebookEvents()
  } catch (e) {
    console.error('Poster: failed to load events', e)
  }

  const upcoming = filterUpcoming(all)
  const currentMonth = eventsInMonth(upcoming, anchor.year, anchor.month).slice(
    0,
    POSTER_MAX_CURRENT_MONTH
  )
  const nextMonthRaw = eventsInMonth(upcoming, next.year, next.month)
  const nextMonthSeen = new Set<string>()
  const nextMonth = nextMonthRaw
    .filter((e) => {
      if (nextMonthSeen.has(e.id)) return false
      nextMonthSeen.add(e.id)
      return true
    })
    .slice(0, POSTER_MAX_NEXT_MONTH)

  return {
    anchor,
    anchorLabel: formatPosterMonthLabel(anchor.year, anchor.month),
    currentMonth,
    nextMonth,
    nextMonthLabel: formatPosterMonthLabel(next.year, next.month),
  }
}

export function getPosterDensity(count: number): PosterDensity {
  if (count <= 4) return 'feature'
  if (count <= 6) return 'balanced'
  return 'mosaic'
}

/** Show description copy only when the month is lightly scheduled. */
export function showPosterDescription(eventCount: number): boolean {
  return eventCount > 0 && eventCount <= 4
}

function formatShortWeekday(date: Date): string {
  return date.toLocaleDateString('en-AU', {
    weekday: 'short',
    timeZone: BRISBANE,
  })
}

function formatShortDayMonth(date: Date): string {
  return date.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    timeZone: BRISBANE,
  })
}

export function formatPosterCompactDate(event: TBWCEvent): string {
  const start = new Date(event.start_time)
  const startWd = formatShortWeekday(start)
  const startDm = formatShortDayMonth(start)

  if (isMultiDayEvent(event) && event.end_time) {
    const end = new Date(event.end_time)
    const endWd = formatShortWeekday(end)
    const endDm = formatShortDayMonth(end)
    const startDay = startDm.split(' ')[0]
    if (startDm === endDm) {
      return `${startWd} ${startDm}`
    }
    return `${startWd} ${startDay}–${endWd} ${endDm}`
  }

  return `${startWd} ${startDm}`
}

/** One-line teaser for the next-month footer list. */
export function formatPosterNextMonthLine(event: TBWCEvent): string {
  return `${formatPosterCompactDate(event)} — ${event.name}`
}

export function formatPosterFeatureDate(event: TBWCEvent): string {
  if (isMultiDayEvent(event)) {
    return `${event.formatted_date} ${event.formatted_time} to ${event.formatted_end_date} ${event.formatted_end_time || event.formatted_time}`
  }
  const timePart = event.formatted_end_time
    ? `${event.formatted_time} – ${event.formatted_end_time}`
    : event.formatted_time
  return `${event.formatted_date} · ${timePart}`
}

/** Date + time line for photo cards (dense months). */
export function formatPosterDateTime(event: TBWCEvent): string {
  const datePart = formatPosterCompactDate(event)
  if (isMultiDayEvent(event)) {
    return `${datePart} · from ${event.formatted_time}`
  }
  const timePart = event.formatted_end_time
    ? `${event.formatted_time} – ${event.formatted_end_time}`
    : event.formatted_time
  return `${datePart} · ${timePart}`
}

export function truncatePosterDescription(description: string): string {
  if (!description) return ''
  const normalized = normalizeNewlines(description)
  const paragraphs = normalized
    .split(/\n\s*\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
  if (paragraphs.length <= 2) return normalized.trim()
  return paragraphs.slice(0, 2).join('\n\n')
}
