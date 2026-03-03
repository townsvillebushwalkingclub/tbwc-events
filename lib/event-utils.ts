/**
 * Utility functions for event-related operations
 */

import type { TBWCEvent } from '@/types/event'

const DISPLAY_TIMEZONE = 'Australia/Brisbane'

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
 * Check if an event is a multi-day event
 */
export function isMultiDayEvent(event: TBWCEvent): boolean {
  return !!(
    event.formatted_end_date &&
    event.formatted_end_date !== event.formatted_date
  )
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
