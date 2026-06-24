/**
 * Utility functions for event-related operations
 */

import type { TBWCEvent } from '@/types/event'

const DISPLAY_TIMEZONE = 'Australia/Brisbane'

/** Month heading for calendar/list UI; stable across server (UTC) and browser timezones. */
export function formatCalendarMonthLabel(year: number, month: number): string {
  const d = new Date(Date.UTC(year, month - 1, 1, 12, 0, 0))
  return d.toLocaleDateString('en-AU', {
    month: 'long',
    year: 'numeric',
    timeZone: DISPLAY_TIMEZONE,
  })
}

/**
 * Get the calendar date (year, month, day) for an instant in a given timezone.
 * Use this for "which month/day does this event show on?" so events at midnight
 * in the club's timezone (e.g. March 1 00:00 Brisbane) are not assigned to the
 * previous day/month when the server runs in UTC.
 * @param dateOrIso - Date instance or ISO 8601 string (e.g. event.start_time)
 * @param timeZone - IANA timezone (default Australia/Brisbane)
 * @returns year (full), month (1-12), day (1-31)
 */
export function getCalendarDateInTimeZone(
  dateOrIso: Date | string,
  timeZone: string = DISPLAY_TIMEZONE
): { year: number; month: number; day: number } {
  const date = typeof dateOrIso === 'string' ? new Date(dateOrIso) : dateOrIso
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = formatter.formatToParts(date)
  const year = parseInt(parts.find((p) => p.type === 'year')!.value, 10)
  const month = parseInt(parts.find((p) => p.type === 'month')!.value, 10)
  const day = parseInt(parts.find((p) => p.type === 'day')!.value, 10)
  return { year, month, day }
}

function toOrdinal(cal: { year: number; month: number; day: number }): number {
  return cal.year * 10000 + cal.month * 100 + cal.day
}

/** Past = last calendar day of the event (Brisbane) is before today (Brisbane). */
export function isEventPastOnCalendar(
  event: TBWCEvent,
  now: Date = new Date()
): boolean {
  const endCal = event.end_time
    ? getCalendarDateInTimeZone(event.end_time)
    : getCalendarDateInTimeZone(event.start_time)
  const todayCal = getCalendarDateInTimeZone(now)
  return toOrdinal(endCal) < toOrdinal(todayCal)
}

/**
 * Default calendar month: literal current month, or the month of the next
 * upcoming event when nothing remains in the rest of the current month (Brisbane).
 * Only considers events in the provided list (e.g. prefetched months).
 */
export function getPreferredCalendarMonth(
  events: TBWCEvent[],
  now: Date = new Date()
): { year: number; month: number } {
  const todayCal = getCalendarDateInTimeZone(now)
  const endDay = new Date(todayCal.year, todayCal.month, 0).getDate()
  const todayOrd = toOrdinal(todayCal)
  const endOfMonthOrd = todayCal.year * 10000 + todayCal.month * 100 + endDay

  const notPast = events.filter((e) => !isEventPastOnCalendar(e, now))

  const overlapsRestOfMonth = notPast.some((event) => {
    const startCal = getCalendarDateInTimeZone(event.start_time)
    const endCal = event.end_time
      ? getCalendarDateInTimeZone(event.end_time)
      : startCal
    const startOrd = toOrdinal(startCal)
    const endOrd = toOrdinal(endCal)
    return startOrd <= endOfMonthOrd && endOrd >= todayOrd
  })

  if (overlapsRestOfMonth) {
    return { year: todayCal.year, month: todayCal.month }
  }

  if (notPast.length === 0) {
    return { year: todayCal.year, month: todayCal.month }
  }

  notPast.sort(
    (a, b) =>
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  )
  const first = notPast[0]
  const startCal = getCalendarDateInTimeZone(first.start_time)
  return { year: startCal.year, month: startCal.month }
}

/**
 * Get Facebook event URL for an event ID
 */
export function getFacebookEventUrl(eventId: string): string {
  return `https://www.facebook.com/events/${eventId}/`
}

/**
 * Calculate month label for an event (e.g., "Next Month", "Month After Next")
 */
export function getMonthLabel(
  eventDate: Date | string,
  currentDate: Date | string = new Date()
): string | null {
  const event = new Date(eventDate)
  const current = new Date(currentDate)

  const currentMonth = current.getMonth()
  const eventMonth = event.getMonth()
  const currentYear = current.getFullYear()
  const eventYear = event.getFullYear()

  const monthDiff = (eventYear - currentYear) * 12 + (eventMonth - currentMonth)

  if (monthDiff === 1) return 'Next Month'
  if (monthDiff === 2) return 'Month After Next'
  return null
}

/**
 * Calendar event label with status tags prefixed so truncation keeps them visible.
 */
export function buildCalendarEventLabel(
  event: Pick<TBWCEvent, 'name' | 'is_cancelled'>,
  options: {
    multiDay?: boolean
    maxNameLength?: number
    minNameLength?: number
  } = {}
): string {
  const tags: string[] = []
  if (event.is_cancelled) tags.push('(CANCELLED)')
  if (options.multiDay) tags.push('(Multi-day)')
  const prefix = tags.length > 0 ? `${tags.join(' ')}\u00A0` : ''

  let name = event.name
  if (
    options.maxNameLength != null &&
    name.length > options.maxNameLength
  ) {
    const minLen = options.minNameLength ?? 8
    const cutAt = Math.max(minLen, options.maxNameLength)
    name = `${name.slice(0, cutAt).trimEnd()}…`
  }

  return `${prefix}${name}`
}

/**
 * Whether start/end fall on different calendar days in the club timezone.
 */
export function isMultiDayByTimes(
  startTime: string,
  endTime: string | null | undefined
): boolean {
  if (!endTime) return false
  const start = getCalendarDateInTimeZone(startTime)
  const end = getCalendarDateInTimeZone(endTime)
  return toOrdinal(start) !== toOrdinal(end)
}

/**
 * Check if an event is a multi-day event (Brisbane calendar days).
 */
export function isMultiDayEvent(event: TBWCEvent): boolean {
  return isMultiDayByTimes(event.start_time, event.end_time)
}

export interface FormatEventDateTimeResult {
  isMultiDay: boolean
  start?: string
  end?: string
  date?: string
  time?: string
  timeRange?: string
  display: string
}

/**
 * Format event date/time for display
 */
export function formatEventDateTime(event: TBWCEvent): FormatEventDateTimeResult {
  const isMultiDay = isMultiDayEvent(event)

  if (isMultiDay) {
    return {
      isMultiDay: true,
      start: `${event.formatted_date} ${event.formatted_time}`,
      end: `${event.formatted_end_date} ${event.formatted_end_time || event.formatted_time}`,
      display: `${event.formatted_date} ${event.formatted_time} to ${event.formatted_end_date} ${event.formatted_end_time || event.formatted_time}`,
    }
  }
  return {
    isMultiDay: false,
    date: event.formatted_date,
    time: event.formatted_time,
    timeRange: event.formatted_end_time
      ? `${event.formatted_time} - ${event.formatted_end_time}`
      : event.formatted_time,
    display: event.formatted_end_time
      ? `${event.formatted_date} ${event.formatted_time} - ${event.formatted_end_time}`
      : `${event.formatted_date} ${event.formatted_time}`,
  }
}
