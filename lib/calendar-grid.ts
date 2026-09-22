import { getCalendarDateInTimeZone } from './event-utils'
import type { TBWCEvent } from '@/types/event'

export interface CalendarDate {
  year: number
  month: number
  day: number
}

export interface MultiDayEventSegment {
  segmentDays: number
  isFirstSegment: boolean
}

function toOrdinal(cal: CalendarDate): number {
  return cal.year * 10000 + cal.month * 100 + cal.day
}

function daysBetweenInclusive(
  startCal: CalendarDate,
  endCal: CalendarDate
): number {
  const startMs = Date.UTC(startCal.year, startCal.month - 1, startCal.day)
  const endMs = Date.UTC(endCal.year, endCal.month - 1, endCal.day)
  return Math.round((endMs - startMs) / 86_400_000) + 1
}

/**
 * For a multi-day event, returns segment info when `cellCal` is the start of a
 * week-row segment (event start day, or Monday continuation after a row break).
 */
export function getMultiDayEventSegment(
  cellCal: CalendarDate,
  startCal: CalendarDate,
  endCal: CalendarDate,
  cellDate: Date
): MultiDayEventSegment | null {
  const cellOrd = toOrdinal(cellCal)
  const startOrd = toOrdinal(startCal)
  const endOrd = toOrdinal(endCal)

  if (cellOrd < startOrd || cellOrd > endOrd) return null

  const jsDay = cellDate.getDay()
  const mondayStartCol = jsDay === 0 ? 6 : jsDay - 1
  const isMonday = mondayStartCol === 0
  const isFirstSegment = cellOrd === startOrd
  const isContinuationStart = isMonday && cellOrd > startOrd

  if (!isFirstSegment && !isContinuationStart) return null

  const daysUntilWeekEnd = 6 - mondayStartCol
  const daysRemaining = daysBetweenInclusive(cellCal, endCal)
  const segmentDays = Math.min(daysUntilWeekEnd + 1, daysRemaining)

  return { segmentDays, isFirstSegment }
}

export interface MonthCalendarGrid {
  startDate: Date
  endDate: Date
  numCells: number
}

/**
 * Monday-start grid covering the full month (plus leading/trailing days in
 * adjacent months). Uses 5 or 6 weeks - never a trailing row that is entirely
 * outside the displayed month.
 */
export function getMonthCalendarGrid(
  year: number,
  month: number
): MonthCalendarGrid {
  const displayMonth = month - 1
  const firstDay = new Date(year, displayMonth, 1)
  const lastDay = new Date(year, displayMonth + 1, 0)

  const dayOfWeek = firstDay.getDay()
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - daysToSubtract)

  const endDate = new Date(lastDay)
  const endDow = endDate.getDay()
  if (endDow !== 0) {
    endDate.setDate(endDate.getDate() + (7 - endDow))
  }

  const numCells =
    Math.round((endDate.getTime() - startDate.getTime()) / 86_400_000) + 1

  return { startDate, endDate, numCells }
}

export function getMonthsInGrid(
  startDate: Date,
  numCells: number
): Array<{ year: number; month: number }> {
  const months = new Map<string, { year: number; month: number }>()
  for (let i = 0; i < numCells; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    const cal = getCalendarDateInTimeZone(date)
    months.set(`${cal.year}-${cal.month}`, { year: cal.year, month: cal.month })
  }
  return [...months.values()]
}

/** Three consecutive months prefetched on the homepage (anchor + 2). */
export function getPrefetchMonths(
  anchorYear: number,
  anchorMonth: number
): Array<{ year: number; month: number }> {
  const months: Array<{ year: number; month: number }> = []
  let y = anchorYear
  let m = anchorMonth
  for (let i = 0; i < 3; i++) {
    months.push({ year: y, month: m })
    m += 1
    if (m > 12) {
      m = 1
      y += 1
    }
  }
  return months
}

export function monthKey(year: number, month: number): string {
  return `${year}-${month}`
}

export function monthsToFetchForGrid(
  gridMonths: Array<{ year: number; month: number }>,
  prefetchedMonths: Array<{ year: number; month: number }>,
  loadedViewKey: string | null,
  viewYear: number,
  viewMonth: number
): Array<{ year: number; month: number }> {
  const covered = new Set<string>()
  for (const { year, month } of prefetchedMonths) {
    covered.add(monthKey(year, month))
  }
  if (loadedViewKey === monthKey(viewYear, viewMonth)) {
    covered.add(monthKey(viewYear, viewMonth))
  }

  return gridMonths.filter(({ year, month }) => !covered.has(monthKey(year, month)))
}

/**
 * Default homepage calendar month (Brisbane calendar date).
 * Stays on the current month until today falls on or after the Monday of the
 * last week-row of that month's Monday-start grid (see getMonthCalendarGrid).
 * The events argument is unused and kept only for call-site compatibility.
 */
export function getPreferredCalendarMonth(
  _events?: TBWCEvent[],
  now: Date = new Date()
): { year: number; month: number } {
  const todayCal = getCalendarDateInTimeZone(now)
  const { endDate } = getMonthCalendarGrid(todayCal.year, todayCal.month)

  // Last week-row is Mon..Sun ending on endDate (always a Sunday).
  const lastWeekMonday = new Date(endDate)
  lastWeekMonday.setDate(endDate.getDate() - 6)

  const lastMondayOrd =
    lastWeekMonday.getFullYear() * 10000 +
    (lastWeekMonday.getMonth() + 1) * 100 +
    lastWeekMonday.getDate()
  const todayOrd = todayCal.year * 10000 + todayCal.month * 100 + todayCal.day

  if (todayOrd >= lastMondayOrd) {
    if (todayCal.month === 12) {
      return { year: todayCal.year + 1, month: 1 }
    }
    return { year: todayCal.year, month: todayCal.month + 1 }
  }

  return { year: todayCal.year, month: todayCal.month }
}
