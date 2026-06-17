/**
 * Client-safe poster formatting helpers (no server-only imports).
 */

import { isMultiDayEvent } from '@/lib/event-utils'
import { normalizeNewlines } from '@/lib/process-description'
import type { TBWCEvent } from '@/types/event'

const BRISBANE = 'Australia/Brisbane'

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
