/**
 * Poster page utilities: event selection, density, formatting.
 */

import { getFacebookEvents } from '@/lib/facebook-api'
import {
  formatPosterExcludeQuery,
  parsePosterExcludeParam,
} from '@/lib/poster-exclude'
import {
  formatPosterCompactDate,
  formatPosterDateTime,
  formatPosterFeatureDate,
  formatPosterNextMonthLine,
  truncatePosterDescription,
} from '@/lib/poster-format'
import {
  getCalendarDateInTimeZone,
  isEventPastOnCalendar,
} from '@/lib/event-utils'
import {
  addMonths,
  formatPosterMonthLabel,
  formatPosterMonthSlug,
  type PosterMonth,
} from '@/lib/poster-month'
import type { TBWCEvent } from '@/types/event'

export { POSTER_QR_URL } from '@/lib/poster-constants'
export {
  formatPosterExcludeQuery,
  parsePosterExcludeParam,
} from '@/lib/poster-exclude'
export type { PosterMonth } from '@/lib/poster-month'
export {
  addMonths,
  formatPosterMonthLabel,
  formatPosterMonthSlug,
  getCurrentPosterMonth,
  parsePosterMonthParam,
} from '@/lib/poster-month'

export const POSTER_MAX_CURRENT_MONTH = 12
export const POSTER_MAX_NEXT_MONTH = 5

const BRISBANE = 'Australia/Brisbane'

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

function excludeEvents(events: TBWCEvent[], excludeIds: Set<string>): TBWCEvent[] {
  if (excludeIds.size === 0) return events
  return events.filter((event) => !excludeIds.has(event.id))
}

export async function getPosterEventsForMonth(
  anchor: PosterMonth,
  excludeIds: Set<string> = new Set()
): Promise<PosterEventsData> {
  const next = addMonths(anchor.year, anchor.month, 1)
  let all: TBWCEvent[] = []
  try {
    all = await getFacebookEvents()
  } catch (e) {
    console.error('Poster: failed to load events', e)
  }

  const upcoming = filterUpcoming(all)
  const currentMonth = excludeEvents(
    eventsInMonth(upcoming, anchor.year, anchor.month),
    excludeIds
  ).slice(0, POSTER_MAX_CURRENT_MONTH)
  const nextMonthRaw = excludeEvents(
    eventsInMonth(upcoming, next.year, next.month),
    excludeIds
  )
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

export {
  formatPosterCompactDate,
  formatPosterDateTime,
  formatPosterFeatureDate,
  formatPosterNextMonthLine,
  truncatePosterDescription,
} from '@/lib/poster-format'
