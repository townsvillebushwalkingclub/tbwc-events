import type { TBWCEvent } from '@/types/event'
import { extractLeadersFromDescription } from '@/lib/poster-description-parse'
import {
  isEventPastOnCalendar,
  parseFacebookEventDate,
} from '@/lib/event-utils'

export const CALENDAR_FEED_MIN_YEAR = 2022

export function getCalendarFeedMaxFutureDate(now = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth() + 3, 1)
}

/** Upcoming events for the subscribeable iCal feed. */
export function filterUpcomingCalendarFeedEvents(
  events: TBWCEvent[],
  now = new Date()
): TBWCEvent[] {
  const maxFutureDate = getCalendarFeedMaxFutureDate(now)

  return events
    .filter((event) => {
      if (!event.start_time) return false
      const eventDate = parseFacebookEventDate(event.start_time)
      if (eventDate.getFullYear() < CALENDAR_FEED_MIN_YEAR) return false
      if (eventDate >= maxFutureDate) return false
      if (isEventPastOnCalendar(event, now)) return false
      return true
    })
    .sort(
      (a, b) =>
        parseFacebookEventDate(a.start_time).getTime() -
        parseFacebookEventDate(b.start_time).getTime()
    )
}

function getLeaderInitial(description: string | undefined): string | null {
  if (!description) return null
  const leaders = extractLeadersFromDescription(description)
  if (leaders.length === 0) return null
  const firstToken = leaders[0].trim().split(/\s+/)[0]
  const match = firstToken.match(/[A-Za-z]/)
  return match ? match[0].toUpperCase() : null
}

/** Event title for the subscribeable iCal feed (leader initial prefix). */
export function formatCalendarFeedEventTitle(
  event: Pick<TBWCEvent, 'name' | 'description'>
): string {
  const initial = getLeaderInitial(event.description)
  if (!initial) return event.name
  const prefix = `${initial} `
  if (event.name.startsWith(prefix)) return event.name
  return `${prefix}${event.name}`
}
