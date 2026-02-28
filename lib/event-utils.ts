/**
 * Utility functions for event-related operations
 */

import type { TBWCEvent } from '@/types/event'

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
