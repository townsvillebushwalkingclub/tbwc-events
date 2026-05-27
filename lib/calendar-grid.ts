import { getCalendarDateInTimeZone } from './event-utils'

export interface MonthCalendarGrid {
  startDate: Date
  endDate: Date
  numCells: number
}

/**
 * Monday-start grid covering the full month (plus leading/trailing days in
 * adjacent months). Uses 5 or 6 weeks — never a trailing row that is entirely
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
