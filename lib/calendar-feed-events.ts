import type { TBWCEvent } from '@/types/event'
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
