/**
 * Client-safe poster month routing helpers (no server/fs imports).
 */

import { getCalendarDateInTimeZone } from '@/lib/event-utils'

const BRISBANE = 'Australia/Brisbane'
const MONTH_PARAM_RE = /^(\d{4})-(0[1-9]|1[0-2])$/

export interface PosterMonth {
  year: number
  month: number
}

export function parsePosterMonthParam(month: string): PosterMonth | null {
  const m = month.match(MONTH_PARAM_RE)
  if (!m) return null
  return { year: parseInt(m[1], 10), month: parseInt(m[2], 10) }
}

export function getCurrentPosterMonth(now: Date = new Date()): PosterMonth {
  const cal = getCalendarDateInTimeZone(now, BRISBANE)
  return { year: cal.year, month: cal.month }
}

export function formatPosterMonthSlug(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

export function addMonths(
  year: number,
  month: number,
  delta: number
): PosterMonth {
  let y = year
  let m = month + delta
  while (m < 1) {
    m += 12
    y -= 1
  }
  while (m > 12) {
    m -= 12
    y += 1
  }
  return { year: y, month: m }
}

export function formatPosterMonthLabel(year: number, month: number): string {
  const d = new Date(year, month - 1, 1)
  return d.toLocaleDateString('en-AU', {
    month: 'long',
    year: 'numeric',
    timeZone: BRISBANE,
  })
}

export function posterMonthOrdinal(month: PosterMonth): number {
  return month.year * 100 + month.month
}

/** True when `month` is strictly before `other` (year/month only). */
export function isPosterMonthBefore(
  month: PosterMonth,
  other: PosterMonth
): boolean {
  return posterMonthOrdinal(month) < posterMonthOrdinal(other)
}
