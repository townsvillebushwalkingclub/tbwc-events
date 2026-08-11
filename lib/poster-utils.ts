/**
 * Poster page utilities: event selection, density, formatting.
 */

import { getFacebookEvents } from '@/lib/facebook-api'
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
  formatPosterFilterQuery,
  moveFeaturedFirst,
  parsePosterExcludeParam,
  parsePosterFeaturedParam,
  parsePosterIncludeParam,
} from '@/lib/poster-query'
export type { PosterMonth } from '@/lib/poster-month'
export {
  addMonths,
  formatPosterMonthLabel,
  formatPosterMonthSlug,
  getCurrentPosterMonth,
  isPosterMonthBefore,
  parsePosterMonthParam,
  posterMonthOrdinal,
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

function sortEventsByStart(events: TBWCEvent[]): TBWCEvent[] {
  return [...events].sort(
    (a, b) =>
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  )
}

function dedupeById(events: TBWCEvent[]): TBWCEvent[] {
  const seen = new Set<string>()
  return events.filter((event) => {
    if (seen.has(event.id)) return false
    seen.add(event.id)
    return true
  })
}

/**
 * Resolve force-include IDs from the full event pool (any month).
 * Skips cancelled / missing start_time. Result is chronological.
 */
export function resolvePosterIncludeEvents(
  allEvents: TBWCEvent[],
  includeIds: Set<string>
): TBWCEvent[] {
  if (includeIds.size === 0) return []
  const byId = new Map(allEvents.map((event) => [event.id, event]))
  const found: TBWCEvent[] = []
  for (const id of includeIds) {
    const event = byId.get(id)
    if (!event || !event.start_time || event.is_cancelled) continue
    found.push(event)
  }
  return sortEventsByStart(found)
}

/**
 * Cap month events while reserving force-included IDs (including cross-month).
 * Preserves chronological order in the result.
 */
export function selectPosterEvents(
  monthEvents: TBWCEvent[],
  includeEvents: TBWCEvent[],
  max: number
): TBWCEvent[] {
  if (max <= 0) return []
  if (includeEvents.length === 0) return monthEvents.slice(0, max)

  const monthIds = new Set(monthEvents.map((event) => event.id))
  const includeIds = new Set(includeEvents.map((event) => event.id))
  const included = sortEventsByStart([
    ...monthEvents.filter((event) => includeIds.has(event.id)),
    ...includeEvents.filter((event) => !monthIds.has(event.id)),
  ])
  const rest = monthEvents.filter((event) => !includeIds.has(event.id))
  const slotsForRest = Math.max(0, max - included.length)
  return sortEventsByStart([
    ...included,
    ...rest.slice(0, slotsForRest),
  ]).slice(0, max)
}

export async function getPosterEventsForMonth(
  anchor: PosterMonth,
  excludeIds: Set<string> = new Set(),
  includeIds: Set<string> = new Set()
): Promise<PosterEventsData> {
  const next = addMonths(anchor.year, anchor.month, 1)
  let all: TBWCEvent[] = []
  try {
    all = await getFacebookEvents()
  } catch (e) {
    console.error('Poster: failed to load events', e)
  }

  const upcoming = filterUpcoming(all)
  // Includes may be from any month; resolve against full pool so past or
  // far-future walks can still be pinned onto this poster.
  const includeEvents = excludeEvents(
    resolvePosterIncludeEvents(all, includeIds),
    excludeIds
  )
  const currentMonth = selectPosterEvents(
    excludeEvents(
      eventsInMonth(upcoming, anchor.year, anchor.month),
      excludeIds
    ),
    includeEvents,
    POSTER_MAX_CURRENT_MONTH
  )
  const currentIds = new Set(currentMonth.map((event) => event.id))
  // Next-month teaser: natural next-month walks, minus anything already on the
  // main poster (cross-month includes live in currentMonth only).
  const nextMonth = selectPosterEvents(
    dedupeById(
      excludeEvents(eventsInMonth(upcoming, next.year, next.month), excludeIds)
    ).filter((event) => !currentIds.has(event.id)),
    [],
    POSTER_MAX_NEXT_MONTH
  )

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
